import SwiftUI
import WebKit
import GameKit
import UniformTypeIdentifiers

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
        let type = UTType(filenameExtension: file.pathExtension)?.preferredMIMEType ?? "text/html"
        let response = HTTPURLResponse(url: url, statusCode: 200, httpVersion: "HTTP/1.1",
                                       headerFields: ["Content-Type": "\(type); charset=utf-8",
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

    private func json(_ obj: Any) -> String {
        guard let data = try? JSONSerialization.data(withJSONObject: obj),
              let s = String(data: data, encoding: .utf8) else { return "null" }
        return s
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

    private func load(scope: String) {
        guard GKLocalPlayer.local.isAuthenticated else {
            js("window.gcEntries&&window.gcEntries(\(json(scope)),null,\(json("Not signed in to Game Center")))"); return
        }
        GKLeaderboard.loadLeaderboards(IDs: [GC.board(scope)]) { [weak self] boards, error in
            guard let self = self else { return }
            guard let board = boards?.first else {
                self.js("window.gcEntries&&window.gcEntries(\(self.json(scope)),null,\(self.json("setup")))"); return
            }
            board.loadEntries(for: .global, timeScope: .allTime, range: NSRange(location: 1, length: 100)) { local, entries, total, error in
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
    static func present(_ text: String) {
        let scene = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first
        var top = scene?.windows.first(where: { $0.isKeyWindow })?.rootViewController
        while let p = top?.presentedViewController { top = p }
        guard let host = top else { return }
        let sheet = UIActivityViewController(activityItems: [text], applicationActivities: nil)
        if let pop = sheet.popoverPresentationController {
            pop.sourceView = host.view
            pop.sourceRect = CGRect(x: host.view.bounds.midX, y: host.view.bounds.maxY - 80, width: 1, height: 1)
        }
        host.present(sheet, animated: true)
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
        default: break
        }
    }
}

// MARK: - Web view

struct GameView: UIViewRepresentable {
    @ObservedObject var theme: ThemeModel

    final class Coordinator: NSObject {
        let gameCenter = GameCenter()
        weak var web: WKWebView?
        @objc func textSizeChanged() {
            web?.evaluateJavaScript("window.setNativeTextScale&&window.setNativeTextScale(\(TextScale.current))", completionHandler: nil)
        }
    }

    func makeCoordinator() -> Coordinator { Coordinator() }

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        let bridge = PageBridge(theme: theme, gameCenter: context.coordinator.gameCenter)
        config.userContentController.add(bridge, name: "theme")
        config.userContentController.add(bridge, name: "gc")
        config.userContentController.add(bridge, name: "share")
        config.userContentController.addUserScript(WKUserScript(
            source: "window.__NATIVE_TS=\(TextScale.current);window.__NATIVE_GC=true;",
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
        if #available(iOS 16.4, *) { web.isInspectable = true }

        context.coordinator.web = web
        context.coordinator.gameCenter.web = web
        NotificationCenter.default.addObserver(context.coordinator, selector: #selector(Coordinator.textSizeChanged),
                                               name: UIContentSizeCategory.didChangeNotification, object: nil)
        web.load(URLRequest(url: URL(string: "crossfall://app/index.html")!))
        context.coordinator.gameCenter.authenticate()
        return web
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}
}
