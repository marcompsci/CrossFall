import SwiftUI
import WebKit
import UniformTypeIdentifiers

/// The page tells us when the player switches between dark and light mode,
/// so the status bar and the area behind the web view match.
final class ThemeModel: ObservableObject {
    @Published var light: Bool = UserDefaults.standard.bool(forKey: "crossfall.light")
    func set(_ isLight: Bool) {
        guard isLight != light else { return }
        light = isLight
        UserDefaults.standard.set(isLight, forKey: "crossfall.light")
    }
    var background: Color {
        light ? Color(red: 0.969, green: 0.949, blue: 0.910) : Color(red: 0.118, green: 0.090, blue: 0.188)
    }
}

@main
struct CrossfallApp: App {
    @StateObject private var theme = ThemeModel()
    var body: some Scene {
        WindowGroup {
            GameView(theme: theme)
                .ignoresSafeArea()
                .background(theme.background.ignoresSafeArea())
                .statusBarHidden(false)
                .preferredColorScheme(theme.light ? .light : .dark)
                .animation(.easeInOut(duration: 0.25), value: theme.light)
        }
    }
}

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

final class ThemeBridge: NSObject, WKScriptMessageHandler {
    let theme: ThemeModel
    init(theme: ThemeModel) { self.theme = theme }
    func userContentController(_ controller: WKUserContentController, didReceive message: WKScriptMessage) {
        guard let value = message.body as? String else { return }
        DispatchQueue.main.async { self.theme.set(value == "light") }
    }
}

struct GameView: UIViewRepresentable {
    @ObservedObject var theme: ThemeModel
    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.userContentController.add(ThemeBridge(theme: theme), name: "theme")
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
        web.load(URLRequest(url: URL(string: "crossfall://app/index.html")!))
        return web
    }
    func updateUIView(_ uiView: WKWebView, context: Context) {}
}
