import SwiftUI
import WebKit
import GameKit
import StoreKit
import UniformTypeIdentifiers
import UserNotifications
import WidgetKit
import AVFoundation
import CoreLocation

// MARK: - Theme

/// The page tells us which theme the player picked ("light", "dark" or "system"),
/// so the status bar and the area behind the web view match it.
final class ThemeModel: ObservableObject {
    @Published var mode: String = UserDefaults.standard.string(forKey: "crossfall.theme")
        ?? (UserDefaults.standard.bool(forKey: "crossfall.light") ? "light" : "dark")

    func set(_ value: String) {
        let m = ["light", "dark", "system"].contains(value) ? value : "dark"
        guard m != mode else { return }
        mode = m
        UserDefaults.standard.set(m, forKey: "crossfall.theme")
    }

    var scheme: ColorScheme? {
        switch mode {
        case "light": return .light
        case "dark": return .dark
        default: return nil // follow the phone
        }
    }

    static let lightUI = UIColor(red: 0.969, green: 0.949, blue: 0.910, alpha: 1)
    static let darkUI = UIColor(red: 0.118, green: 0.090, blue: 0.188, alpha: 1)

    var background: Color {
        switch mode {
        case "light": return Color(ThemeModel.lightUI)
        case "dark": return Color(ThemeModel.darkUI)
        default: return Color(UIColor { $0.userInterfaceStyle == .light ? ThemeModel.lightUI : ThemeModel.darkUI })
        }
    }
}

// MARK: - App

@main
struct CrossfallApp: App {
    @StateObject private var theme = ThemeModel()
    var body: some Scene {
        WindowGroup {
            GameView(theme: theme)
                .ignoresSafeArea()
                .background(theme.background.ignoresSafeArea())
                .statusBarHidden(false)
                .preferredColorScheme(theme.scheme)
                .animation(.easeInOut(duration: 0.25), value: theme.mode)
        }
    }
}

// MARK: - Bundled game

/// Serves the bundled game at crossfall://app/ so it gets a stable origin
/// (localStorage keeps stars, stats and settings between launches).
final class BundleSchemeHandler: NSObject, WKURLSchemeHandler {
    func webView(_ webView: WKWebView, start task: WKURLSchemeTask) {
        guard let url = task.request.url else { return }
        var name = url.path.isEmpty || url.path == "/" ? "index.html" : String(url.path.dropFirst())
        if name.contains("..") { name = "index.html" }
        guard let file = Bundle.main.url(forResource: name, withExtension: nil),
              let data = try? Data(contentsOf: file) else {
            task.didFailWithError(URLError(.fileDoesNotExist)); return
        }
        let ext = file.pathExtension.lowercased()
        let type = ext == "woff2" ? "font/woff2" : (UTType(filenameExtension: ext)?.preferredMIMEType ?? "text/html")
        let contentType = type.hasPrefix("text/") ? "\(type); charset=utf-8" : type
        let response = HTTPURLResponse(url: url, statusCode: 200, httpVersion: "HTTP/1.1",
                                       headerFields: ["Content-Type": contentType,
                                                      "Content-Length": "\(data.count)"])!
        task.didReceive(response)
        task.didReceive(data)
        task.didFinish()
    }
    func webView(_ webView: WKWebView, stop task: WKURLSchemeTask) {}
}

// MARK: - Dynamic Type

/// Maps the phone's text size setting to a scale the page multiplies its type by.
enum TextScale {
    static var current: Double {
        switch UIApplication.shared.preferredContentSizeCategory {
        case .extraSmall: return 0.82
        case .small: return 0.88
        case .medium: return 0.94
        case .large: return 1.0
        case .extraLarge: return 1.1
        case .extraExtraLarge: return 1.2
        case .extraExtraExtraLarge: return 1.3
        case .accessibilityMedium: return 1.42
        case .accessibilityLarge: return 1.55
        case .accessibilityExtraLarge: return 1.65
        case .accessibilityExtraExtraLarge, .accessibilityExtraExtraExtraLarge: return 1.75
        default: return 1.0
        }
    }
}

// MARK: - Game Center

/// Leaderboard and achievement IDs. Create these in App Store Connect › Crossfall › Game Center.
enum GC {
    static let total = "crossfall.total"     // classic, high to low: lifetime total score
    static let best = "crossfall.best"       // classic, high to low: best single game
    static let weekly = "crossfall.weekly"   // recurring, resets every Monday: best game this week
    static let daily = "crossfall.daily"     // recurring, resets every day: first try at the daily puzzle
    static func board(_ scope: String) -> String {
        switch scope { case "best": return best; case "week": return weekly; case "day": return daily; default: return total }
    }
}

final class GameCenter: NSObject, GKGameCenterControllerDelegate {
    weak var web: WKWebView?
    private var lastAuth: String?

    private func js(_ code: String) {
        DispatchQueue.main.async { self.web?.evaluateJavaScript(code, completionHandler: nil) }
    }

    /// Encodes a value for evaluateJavaScript. JSONSerialization only accepts arrays and
    /// dictionaries at the top level (anything else raises an uncatchable NSException),
    /// so single values are wrapped in an array and unwrapped again.
    private func json(_ obj: Any) -> String {
        let isContainer = obj is [Any] || obj is [String: Any]
        let wrapped: Any = isContainer ? obj : [obj]
        guard JSONSerialization.isValidJSONObject(wrapped),
              let data = try? JSONSerialization.data(withJSONObject: wrapped),
              let s = String(data: data, encoding: .utf8) else { return "null" }
        return isContainer ? s : String(s.dropFirst().dropLast())
    }

    private func topController() -> UIViewController? {
        let scene = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first
        var vc = scene?.windows.first(where: { $0.isKeyWindow })?.rootViewController ?? scene?.windows.first?.rootViewController
        while let p = vc?.presentedViewController { vc = p }
        return vc
    }

    func authenticate() {
        GKLocalPlayer.local.authenticateHandler = { [weak self] viewController, error in
            guard let self = self else { return }
            if let vc = viewController {
                DispatchQueue.main.async { self.topController()?.present(vc, animated: true) }
                return
            }
            let p = GKLocalPlayer.local
            let info: [String: Any] = p.isAuthenticated
                ? ["ok": true, "name": p.displayName, "id": p.gamePlayerID]
                : ["ok": false, "error": error?.localizedDescription ?? "Not signed in to Game Center"]
            self.lastAuth = self.json(info)
            self.js("window.gcAuth&&window.gcAuth(\(self.lastAuth!))")
        }
    }

    func handle(_ body: [String: Any]) {
        switch body["type"] as? String {
        case "score": submit(body)
        case "achieve": report(body)
        case "load": load(scope: body["scope"] as? String ?? "total")
        case "open": open(scope: body["scope"] as? String)
        case "status": if let a = lastAuth { js("window.gcAuth&&window.gcAuth(\(a))") }
        default: break
        }
    }

    private func submit(_ b: [String: Any]) {
        guard GKLocalPlayer.local.isAuthenticated else { return }
        let pairs: [(String, Int)] = [(GC.total, b["total"] as? Int ?? 0), (GC.best, b["best"] as? Int ?? 0),
                                      (GC.weekly, b["game"] as? Int ?? 0), (GC.daily, b["daily"] as? Int ?? 0)]
        for (id, value) in pairs where value > 0 {
            GKLeaderboard.submitScore(value, context: 0, player: GKLocalPlayer.local, leaderboardIDs: [id]) { _ in }
        }
    }

    private func report(_ b: [String: Any]) {
        guard GKLocalPlayer.local.isAuthenticated, let id = b["id"] as? String else { return }
        let a = GKAchievement(identifier: id)
        a.percentComplete = min(100, b["pct"] as? Double ?? Double(b["pct"] as? Int ?? 100))
        a.showsCompletionBanner = true
        GKAchievement.report([a]) { _ in }
    }

    /// `scope` is "total", "week", "best" or "day"; a "~f" suffix loads only the player's Game Center friends.
    private func load(scope: String) {
        let friends = scope.hasSuffix("~f")
        let base = friends ? String(scope.dropLast(2)) : scope
        guard GKLocalPlayer.local.isAuthenticated else {
            js("window.gcEntries&&window.gcEntries(\(json(scope)),null,\(json("Not signed in to Game Center")))"); return
        }
        let go = { [weak self] in self?.loadBoard(scope: scope, base: base, friends: friends) }
        if friends {
            // Asks for friends-list permission the first time (NSGKFriendListUsageDescription).
            GKLocalPlayer.local.loadFriends { _, _ in go() }
        } else { go() }
    }

    private func loadBoard(scope: String, base: String, friends: Bool) {
        GKLeaderboard.loadLeaderboards(IDs: [GC.board(base)]) { [weak self] boards, error in
            guard let self = self else { return }
            guard let board = boards?.first else {
                self.js("window.gcEntries&&window.gcEntries(\(self.json(scope)),null,\(self.json("setup")))"); return
            }
            board.loadEntries(for: friends ? .friendsOnly : .global, timeScope: .allTime, range: NSRange(location: 1, length: 100)) { local, entries, total, error in
                let me = GKLocalPlayer.local.gamePlayerID
                func row(_ e: GKLeaderboard.Entry) -> [String: Any] {
                    ["rank": e.rank, "name": e.player.displayName, "score": e.score, "me": e.player.gamePlayerID == me]
                }
                var out: [String: Any] = ["rows": (entries ?? []).map(row), "total": total]
                if let l = local { out["mine"] = row(l) }
                if let error = error, entries == nil { out["error"] = error.localizedDescription }
                self.js("window.gcEntries&&window.gcEntries(\(self.json(scope)),\(self.json(out)),null)")
            }
        }
    }

    private func open(scope: String?) {
        DispatchQueue.main.async {
            let vc: GKGameCenterViewController
            if let s = scope {
                vc = GKGameCenterViewController(leaderboardID: GC.board(s), playerScope: .global, timeScope: .allTime)
            } else {
                vc = GKGameCenterViewController(state: .dashboard)
            }
            vc.gameCenterDelegate = self
            self.topController()?.present(vc, animated: true)
        }
    }

    func gameCenterViewControllerDidFinish(_ gameCenterViewController: GKGameCenterViewController) {
        gameCenterViewController.dismiss(animated: true)
    }
}

// MARK: - Share sheet

/// Shows the iOS share sheet for a daily result, a puzzle code or a backup code.
enum Share {
    static func present(_ text: String, image: UIImage? = nil) {
        let scene = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first
        var top = scene?.windows.first(where: { $0.isKeyWindow })?.rootViewController
        while let p = top?.presentedViewController { top = p }
        guard let host = top else { return }
        let items: [Any] = image.map { [$0, text] } ?? [text]
        let sheet = UIActivityViewController(activityItems: items, applicationActivities: nil)
        if let pop = sheet.popoverPresentationController {
            pop.sourceView = host.view
            pop.sourceRect = CGRect(x: host.view.bounds.midX, y: host.view.bounds.maxY - 80, width: 1, height: 1)
        }
        host.present(sheet, animated: true)
    }
}

// MARK: - Crossfall Pro (StoreKit 2, one-time non-consumable)

@MainActor
final class ProStore {
    static let shared = ProStore()
    static let productID = "com.phoronomicstudios.crossfall.pro"
    weak var web: WKWebView?
    private var product: Product?
    private var updates: Task<Void, Never>?

    func start() {
        guard updates == nil else { return }
        updates = Task { [weak self] in
            for await result in Transaction.updates {
                if case .verified(let t) = result { await t.finish() }
                await self?.refresh()
            }
        }
        Task { await loadProduct(); await refresh() }
    }

    func handle(_ action: String) {
        Task {
            switch action {
            case "load": await loadProduct()
            case "refresh": await refresh()
            case "buy": await buy()
            case "restore": await restore()
            default: break
            }
        }
    }

    private func send(_ json: String) {
        web?.evaluateJavaScript("window.__iap&&window.__iap(\(json))", completionHandler: nil)
    }

    private func loadProduct() async {
        if product == nil { product = try? await Product.products(for: [Self.productID]).first }
        if let p = product {
            let price = p.displayPrice.replacingOccurrences(of: "\\", with: "").replacingOccurrences(of: "\"", with: "")
            send("{\"type\":\"product\",\"price\":\"\(price)\"}")
        }
    }

    private func owned() async -> Bool {
        for await result in Transaction.currentEntitlements {
            if case .verified(let t) = result, t.productID == Self.productID, t.revocationDate == nil { return true }
        }
        return false
    }

    func refresh() async {
        let pro = await owned()
        send("{\"type\":\"entitlement\",\"pro\":\(pro)}")
    }

    private func buy() async {
        await loadProduct()
        guard let p = product else { send("{\"type\":\"failed\"}"); return }
        do {
            switch try await p.purchase() {
            case .success(let verification):
                if case .verified(let t) = verification {
                    await t.finish()
                    send("{\"type\":\"purchased\"}")
                } else { send("{\"type\":\"failed\"}") }
            case .userCancelled: send("{\"type\":\"cancelled\"}")
            case .pending: send("{\"type\":\"pending\"}")
            @unknown default: send("{\"type\":\"cancelled\"}")
            }
        } catch { send("{\"type\":\"failed\"}") }
    }

    private func restore() async {
        try? await AppStore.sync()
        let pro = await owned()
        send("{\"type\":\"restored\",\"pro\":\(pro)}")
    }
}

// MARK: - Haptics

enum Haptics {
    private static let light = UIImpactFeedbackGenerator(style: .light)
    private static let medium = UIImpactFeedbackGenerator(style: .medium)
    private static let heavy = UIImpactFeedbackGenerator(style: .heavy)
    private static let rigid = UIImpactFeedbackGenerator(style: .rigid)
    private static let note = UINotificationFeedbackGenerator()
    private static let pick = UISelectionFeedbackGenerator()

    static func play(_ kind: String) {
        switch kind {
        case "light": light.impactOccurred()
        case "medium": medium.impactOccurred()
        case "heavy": heavy.impactOccurred()
        case "rigid": rigid.impactOccurred()
        case "success": note.notificationOccurred(.success)
        case "warning": note.notificationOccurred(.warning)
        case "error": note.notificationOccurred(.error)
        case "select": pick.selectionChanged()
        default: break
        }
    }
}

// MARK: - Daily reminder + home-screen widget

/// Takes a small snapshot from the game (streak, today's Daily, level), shares it with the
/// widget through the app group, and schedules the once-a-day Daily reminder.
@MainActor
final class DailyStatus {
    static let shared = DailyStatus()
    static let group = "group.com.phoronomicstudios.crossfall"
    weak var web: WKWebView?
    private var last: [String: Any] = [:]

    func askPermission() {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { granted, _ in
            Task { @MainActor in
                self.web?.evaluateJavaScript("window.__notify&&window.__notify({granted:\(granted)})", completionHandler: nil)
                self.reschedule()
            }
        }
    }

    func update(_ body: [String: Any]) {
        last = body
        if let shared = UserDefaults(suiteName: DailyStatus.group) {
            for key in ["streak", "freezes", "best", "level", "pct", "weekly", "score"] {
                shared.set((body[key] as? NSNumber)?.intValue ?? 0, forKey: key)
            }
            shared.set(body["doneToday"] as? Bool ?? false, forKey: "doneToday")
            shared.set(body["day"] as? String ?? "", forKey: "day")
            shared.set(Date().timeIntervalSince1970, forKey: "updated")
            WidgetCenter.shared.reloadAllTimelines()
        }
        reschedule()
    }

    private func reschedule() {
        let center = UNUserNotificationCenter.current()
        let ids = (0..<8).map { "crossfall.daily.\($0)" }
        center.removePendingNotificationRequests(withIdentifiers: ids)
        guard last["remind"] as? Bool == true else { return }
        let hour = (last["hour"] as? NSNumber)?.intValue ?? 19
        let minute = (last["minute"] as? NSNumber)?.intValue ?? 0
        let streak = (last["streak"] as? NSNumber)?.intValue ?? 0
        let doneToday = last["doneToday"] as? Bool ?? false
        center.getNotificationSettings { settings in
            guard settings.authorizationStatus == .authorized || settings.authorizationStatus == .provisional else { return }
            let cal = Calendar.current
            let now = Date()
            for d in 0..<7 {
                guard let day = cal.date(byAdding: .day, value: d, to: now),
                      let fire = cal.date(bySettingHour: hour, minute: minute, second: 0, of: day) else { continue }
                if d == 0 && (doneToday || fire <= now) { continue }
                let content = UNMutableNotificationContent()
                content.title = "Today's Crossfall is ready"
                let known = d == 0 ? streak : (d == 1 && doneToday ? streak : 0)
                content.body = known > 0
                    ? "Keep your 🔥 \(known)-day streak going. One puzzle, a few minutes."
                    : "A fresh Daily puzzle is waiting. Same puzzle for everyone today."
                content.sound = .default
                let parts = cal.dateComponents([.year, .month, .day, .hour, .minute], from: fire)
                let request = UNNotificationRequest(identifier: "crossfall.daily.\(d)", content: content,
                                                    trigger: UNCalendarNotificationTrigger(dateMatching: parts, repeats: false))
                center.add(request)
            }
        }
    }
}

// MARK: - Spoken words (Language category)

/// Speaks a word in its language with the system voice so players hear real pronunciation.
@MainActor
enum Speech {
    static let synth = AVSpeechSynthesizer()
    static func say(_ body: [String: Any]) {
        guard let text = body["text"] as? String, !text.isEmpty else { return }
        try? AVAudioSession.sharedInstance().setCategory(.playback, mode: .spokenAudio, options: [.mixWithOthers, .duckOthers])
        if synth.isSpeaking { synth.stopSpeaking(at: .immediate) }
        let u = AVSpeechUtterance(string: text)
        u.voice = AVSpeechSynthesisVoice(language: body["lang"] as? String ?? "en-US")
        u.rate = Float((body["rate"] as? NSNumber)?.doubleValue ?? 0.45)
        synth.speak(u)
    }
}

// MARK: - Hometown (Sports category)

/// One-shot, when-in-use location so the Sports intro can find legends from the player's area.
/// The coordinates go straight back to the page and are matched against a built-in list of cities
/// on the device. Nothing is stored or sent anywhere.
@MainActor
final class Locator: NSObject, CLLocationManagerDelegate {
    static let shared = Locator()
    weak var web: WKWebView?
    private let manager = CLLocationManager()
    private var waiting = false

    override init() {
        super.init()
        manager.delegate = self
        manager.desiredAccuracy = kCLLocationAccuracyReduced
    }

    func locate() {
        waiting = true
        switch manager.authorizationStatus {
        case .notDetermined: manager.requestWhenInUseAuthorization()
        case .denied, .restricted: reply("{err:'denied'}")
        default: manager.requestLocation()
        }
    }

    private func reply(_ body: String) {
        guard waiting else { return }
        waiting = false
        web?.evaluateJavaScript("window.__locate&&window.__locate(\(body))", completionHandler: nil)
    }

    nonisolated func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        Task { @MainActor in
            guard self.waiting else { return }
            switch manager.authorizationStatus {
            case .notDetermined: break
            case .denied, .restricted: self.reply("{err:'denied'}")
            default: manager.requestLocation()
            }
        }
    }

    nonisolated func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let c = locations.last?.coordinate else { return }
        Task { @MainActor in self.reply("{lat:\(c.latitude),lon:\(c.longitude)}") }
    }

    nonisolated func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        Task { @MainActor in self.reply("{err:'failed'}") }
    }
}

// MARK: - Bridge from the page

final class PageBridge: NSObject, WKScriptMessageHandler {
    let theme: ThemeModel
    let gameCenter: GameCenter
    init(theme: ThemeModel, gameCenter: GameCenter) { self.theme = theme; self.gameCenter = gameCenter }

    func userContentController(_ controller: WKUserContentController, didReceive message: WKScriptMessage) {
        switch message.name {
        case "theme":
            if let value = message.body as? String { DispatchQueue.main.async { self.theme.set(value) } }
        case "gc":
            if let body = message.body as? [String: Any] { gameCenter.handle(body) }
        case "share":
            if let text = message.body as? String { DispatchQueue.main.async { Share.present(text) } }
            else if let body = message.body as? [String: Any], let text = body["text"] as? String {
                var image: UIImage?
                if let url = body["image"] as? String, let comma = url.firstIndex(of: ","),
                   let data = Data(base64Encoded: String(url[url.index(after: comma)...])) { image = UIImage(data: data) }
                DispatchQueue.main.async { Share.present(text, image: image) }
            }
        case "say":
            if let body = message.body as? [String: Any] { Task { @MainActor in Speech.say(body) } }
        case "locate":
            Task { @MainActor in Locator.shared.locate() }
        case "notify":
            Task { @MainActor in DailyStatus.shared.askPermission() }
        case "status":
            if let body = message.body as? [String: Any] { Task { @MainActor in DailyStatus.shared.update(body) } }
        case "iap":
            if let action = message.body as? String { Task { @MainActor in ProStore.shared.handle(action) } }
        case "haptic":
            if let kind = message.body as? String { DispatchQueue.main.async { Haptics.play(kind) } }
        default: break
        }
    }
}

// MARK: - Web view

struct GameView: UIViewRepresentable {
    @ObservedObject var theme: ThemeModel

    final class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate {
        let gameCenter = GameCenter()
        weak var web: WKWebView?
        @objc func textSizeChanged() {
            web?.evaluateJavaScript("window.setNativeTextScale&&window.setNativeTextScale(\(TextScale.current))", completionHandler: nil)
        }

        /// iOS can end the web content process under memory pressure, which leaves a blank page.
        /// Reload the bundled game; progress is in localStorage, so nothing is lost.
        func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
            webView.load(URLRequest(url: URL(string: "crossfall://app/index.html")!))
        }

        /// The game itself only lives at crossfall://. Web links (privacy policy, support)
        /// open in Safari so the player never gets stuck on a page with no way back.
        func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction,
                     decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            guard let url = action.request.url else { decisionHandler(.cancel); return }
            switch url.scheme?.lowercased() {
            case "crossfall", "about", "data", "blob":
                decisionHandler(.allow)
            case "https", "http", "mailto":
                if action.targetFrame?.isMainFrame ?? true { UIApplication.shared.open(url) }  // nil target = target="_blank"
                decisionHandler(.cancel)
            default:
                decisionHandler(.cancel)
            }
        }

        /// Never open a second web view. target="_blank" links are already sent to Safari above.
        func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration,
                     for action: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? { nil }
    }

    func makeCoordinator() -> Coordinator { Coordinator() }

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        let bridge = PageBridge(theme: theme, gameCenter: context.coordinator.gameCenter)
        config.userContentController.add(bridge, name: "theme")
        config.userContentController.add(bridge, name: "gc")
        config.userContentController.add(bridge, name: "share")
        config.userContentController.add(bridge, name: "haptic")
        config.userContentController.add(bridge, name: "iap")
        config.userContentController.add(bridge, name: "notify")
        config.userContentController.add(bridge, name: "status")
        config.userContentController.add(bridge, name: "say")
        config.userContentController.add(bridge, name: "locate")
        config.userContentController.addUserScript(WKUserScript(
            source: "window.__NATIVE_TS=\(TextScale.current);window.__NATIVE_GC=true;window.__NATIVE_IAP=true;window.__NATIVE_NOTIFY=true;window.__NATIVE_SAY=true;window.__NATIVE_LOC=true;",
            injectionTime: .atDocumentStart, forMainFrameOnly: true))
        config.setURLSchemeHandler(BundleSchemeHandler(), forURLScheme: "crossfall")
        config.websiteDataStore = .default()
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []

        let web = WKWebView(frame: .zero, configuration: config)
        web.isOpaque = false
        web.backgroundColor = .clear
        web.scrollView.backgroundColor = .clear
        web.scrollView.contentInsetAdjustmentBehavior = .never
        web.scrollView.bounces = false
        web.allowsLinkPreview = false
        #if DEBUG
        if #available(iOS 16.4, *) { web.isInspectable = true }  // Safari Web Inspector in development builds only
        #endif
        web.navigationDelegate = context.coordinator
        web.uiDelegate = context.coordinator

        context.coordinator.web = web
        context.coordinator.gameCenter.web = web
        ProStore.shared.web = web
        ProStore.shared.start()
        DailyStatus.shared.web = web
        Locator.shared.web = web
        NotificationCenter.default.addObserver(context.coordinator, selector: #selector(Coordinator.textSizeChanged),
                                               name: UIContentSizeCategory.didChangeNotification, object: nil)
        web.load(URLRequest(url: URL(string: "crossfall://app/index.html")!))
        context.coordinator.gameCenter.authenticate()
        return web
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}
}
