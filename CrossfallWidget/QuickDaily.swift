import WidgetKit
import SwiftUI
import AppIntents

// MARK: - Quick Daily
// A tiny version of Crossfall you play right on the Home Screen (iOS 17 interactive widget).
// Step 1: solve three short clues by tapping letter tiles.
// Step 2: the three words drop into a small well. Slide each word over the gap in a junk row
//         and drop it to clear the row. Clear all three rows to solve the day.
// State lives in the app group so every tap (an App Intent) updates it and the widget redraws.

struct QDWord { let w: String; let clue: String }

enum QD {
    static let suite = "group.com.phoronomicstudios.crossfall"
    static let kind = "CrossfallQuickDaily"
    static let key = "qd.state.v1"
    static let cols = 6
    static let rows = 6
    static let junkTop = 3   // rows 3, 4, 5 start as junk with one gap each

    static let bank: [QDWord] = [
        QDWord(w: "SUN", clue: "It rises in the east"), QDWord(w: "OWL", clue: "Wise night bird"), QDWord(w: "MAP", clue: "It shows the way"),
        QDWord(w: "JAM", clue: "Fruit spread for toast"), QDWord(w: "KEY", clue: "Opens a lock"), QDWord(w: "BEE", clue: "Buzzing honey maker"),
        QDWord(w: "INK", clue: "A pen is full of it"), QDWord(w: "FOX", clue: "Clever red animal"), QDWord(w: "CUP", clue: "Hold your tea in it"),
        QDWord(w: "HAT", clue: "Wear it on your head"), QDWord(w: "SKY", clue: "Blue up above"), QDWord(w: "OAR", clue: "Row a boat with it"),
        QDWord(w: "ELF", clue: "Santa's little helper"), QDWord(w: "EGG", clue: "A hen lays one"), QDWord(w: "NET", clue: "Goal or tennis mesh"),
        QDWord(w: "PIE", clue: "Dessert with a crust"), QDWord(w: "ANT", clue: "Tiny picnic visitor"), QDWord(w: "ICE", clue: "Frozen water"),
        QDWord(w: "BOOK", clue: "Read it cover to cover"), QDWord(w: "MOON", clue: "Night light in the sky"), QDWord(w: "TREE", clue: "It has bark and leaves"),
        QDWord(w: "SHIP", clue: "Big boat"), QDWord(w: "FROG", clue: "Green hopper by the pond"), QDWord(w: "STAR", clue: "Twinkles at night"),
        QDWord(w: "RAIN", clue: "Falls from clouds"), QDWord(w: "DRUM", clue: "Hit it with sticks"), QDWord(w: "KITE", clue: "Fly it on a windy day"),
        QDWord(w: "LAMP", clue: "Turn it on to read"), QDWord(w: "NEST", clue: "Bird's home"), QDWord(w: "SNOW", clue: "White winter flakes"),
        QDWord(w: "CAKE", clue: "Birthday dessert"), QDWord(w: "BOLT", clue: "Flash of lightning"), QDWord(w: "GOLF", clue: "Sport with tees and holes"),
        QDWord(w: "WAVE", clue: "Ocean ripple, or a hello"), QDWord(w: "SALT", clue: "Pepper's partner"), QDWord(w: "MILK", clue: "Pour it on cereal"),
        QDWord(w: "TRAIN", clue: "It runs on tracks"), QDWord(w: "APPLE", clue: "Crisp red fruit"), QDWord(w: "CLOUD", clue: "Fluffy white thing in the sky"),
        QDWord(w: "PIANO", clue: "Instrument with 88 keys"), QDWord(w: "TIGER", clue: "Striped big cat"), QDWord(w: "BREAD", clue: "Slice it for a sandwich"),
        QDWord(w: "OCEAN", clue: "The Pacific, for one"), QDWord(w: "CHAIR", clue: "Sit on it"), QDWord(w: "LEMON", clue: "Sour yellow fruit"),
        QDWord(w: "RIVER", clue: "It flows to the sea"), QDWord(w: "ROBOT", clue: "Machine helper"), QDWord(w: "MUSIC", clue: "Songs and melodies"),
        QDWord(w: "CLOCK", clue: "It tells the time"), QDWord(w: "HONEY", clue: "Sweet stuff from bees"), QDWord(w: "SPOON", clue: "Eat soup with it"),
        QDWord(w: "BEACH", clue: "Sand by the sea"), QDWord(w: "GHOST", clue: "Spooky see-through spirit"), QDWord(w: "PLANT", clue: "It grows in a pot"),
        QDWord(w: "SMILE", clue: "A happy face makes one"), QDWord(w: "TOAST", clue: "Crispy bread, or a cheers"), QDWord(w: "BRUSH", clue: "Paint or teeth tool"),
        QDWord(w: "CHALK", clue: "Write on the board with it"), QDWord(w: "STORM", clue: "Thunder and lightning"), QDWord(w: "FLUTE", clue: "Woodwind you play sideways"),
    ]

    static func dayKey(_ d: Date = Date()) -> String {
        let f = DateFormatter(); f.dateFormat = "yyyy-MM-dd"; f.locale = Locale(identifier: "en_US_POSIX"); return f.string(from: d)
    }
    static func seed(_ s: String) -> UInt64 {
        var h: UInt64 = 1469598103934665603
        for b in s.utf8 { h ^= UInt64(b); h = h &* 1099511628211 }
        return h
    }
}

/// Small deterministic RNG so everyone gets the same puzzle on the same day.
struct QDRandom {
    var s: UInt64
    init(_ seed: UInt64) { s = seed == 0 ? 0x9E3779B97F4A7C15 : seed }
    mutating func next() -> UInt64 {
        s &+= 0x9E3779B97F4A7C15
        var z = s
        z = (z ^ (z >> 30)) &* 0xBF58476D1CE4E5B9
        z = (z ^ (z >> 27)) &* 0x94D049BB133111EB
        return z ^ (z >> 31)
    }
    mutating func int(_ n: Int) -> Int { n <= 1 ? 0 : Int(next() % UInt64(n)) }
}

struct QDState: Codable {
    var day: String
    var words: [String]
    var clues: [String]
    var phase: Int            // 0 crossword, 1 well, 2 done
    var wi: Int               // word being solved, or piece being dropped
    var typed: String
    var tiles: [String]
    var used: [Int]
    var mistakes: Int
    var grid: [[String]]      // "" empty, "#" junk, letter = placed
    var col: Int
    var cleared: Int
    var msg: String
    var streak: Int

    static func fresh(day: String, streak: Int) -> QDState {
        var r = QDRandom(QD.seed("qd" + day))
        var pick: [QDWord] = []
        while pick.count < 3 {
            let w = QD.bank[r.int(QD.bank.count)]
            if !pick.contains(where: { $0.w == w.w }) { pick.append(w) }
        }
        var s = QDState(day: day, words: pick.map { $0.w }, clues: pick.map { $0.clue }, phase: 0, wi: 0, typed: "", tiles: [], used: [],
                        mistakes: 0, grid: [], col: 0, cleared: 0, msg: "", streak: streak)
        s.makeTiles()
        return s
    }

    /// The current word's letters plus decoys, shuffled the same way for everyone today.
    mutating func makeTiles() {
        var r = QDRandom(QD.seed(day + "t\(wi)"))
        let w = Array(words[wi]).map(String.init)
        var t = w
        let pool = Array("AEIOURSTLNDMCBHPGK").map(String.init)
        while t.count < 8 { t.append(pool[r.int(pool.count)]) }
        for i in stride(from: t.count - 1, to: 0, by: -1) { let j = r.int(i + 1); t.swapAt(i, j) }
        tiles = t; used = []; typed = ""
    }

    /// Three junk rows, each with one gap exactly as wide as one of the words, top row for the first word.
    mutating func makeWell() {
        var r = QDRandom(QD.seed(day + "well"))
        for _ in 0..<60 {
            var g: [[String]] = Array(repeating: Array(repeating: "", count: QD.cols), count: QD.rows)
            var gaps: [Int] = []
            for i in 0..<3 {
                let L = words[i].count
                let start = r.int(QD.cols - L + 1)
                gaps.append(start)
                for c in 0..<QD.cols { g[QD.junkTop + i][c] = (c >= start && c < start + L) ? "" : "#" }
            }
            // Each gap must sit on something in the row below, so a word dropped in it stays in that row.
            var ok = true
            for i in 0..<2 {
                let L = words[i].count
                if !(gaps[i]..<(gaps[i] + L)).contains(where: { g[QD.junkTop + i + 1][$0] == "#" }) { ok = false }
            }
            if ok { grid = g; break }
        }
        if grid.isEmpty {   // fallback: gaps on alternating sides
            var g: [[String]] = Array(repeating: Array(repeating: "", count: QD.cols), count: QD.rows)
            for i in 0..<3 {
                let L = words[i].count, start = i % 2 == 0 ? 0 : QD.cols - L
                for c in 0..<QD.cols { g[QD.junkTop + i][c] = (c >= start && c < start + L) ? "" : "#" }
            }
            grid = g
        }
        wi = 0; centerPiece()
    }

    mutating func centerPiece() { col = max(0, (QD.cols - words[min(wi, 2)].count) / 2) }

    var score: Int {
        let cross = max(0, 300 - mistakes * 20)
        return cross + cleared * 100 + (cleared == 3 ? 200 : 0)
    }

    // MARK: actions

    mutating func tap(_ i: Int) {
        guard phase == 0, i >= 0, i < tiles.count, !used.contains(i) else { return }
        let w = Array(words[wi])
        guard typed.count < w.count else { return }
        if tiles[i] == String(w[typed.count]) {
            typed += tiles[i]; used.append(i); msg = ""
            if typed.count == w.count {
                if wi < 2 { wi += 1; makeTiles(); msg = "Nice! Next clue." }
                else { phase = 1; makeWell(); msg = "Now drop each word into its gap." }
            }
        } else {
            mistakes += 1; msg = "Not \(tiles[i]). Try another letter."
        }
    }

    mutating func clearWord() { guard phase == 0 else { return }; used = []; typed = ""; msg = "" }

    mutating func move(_ d: Int) {
        guard phase == 1 else { return }
        let L = words[wi].count
        col = min(max(0, col + d), QD.cols - L)
    }

    mutating func drop(on day: Date = Date()) {
        guard phase == 1 else { return }
        let w = Array(words[wi]).map(String.init), L = w.count
        func free(_ r: Int) -> Bool { (0..<L).allSatisfy { grid[r][col + $0] == "" } }
        if !free(0) { finish(on: day); return }
        var r = 0
        while r + 1 < QD.rows && free(r + 1) { r += 1 }
        for k in 0..<L { grid[r][col + k] = w[k] }
        // Clear any full rows.
        var cleared = 0
        grid = grid.filter { row in
            let full = row.allSatisfy { $0 != "" }
            if full { cleared += 1 }
            return !full
        }
        while grid.count < QD.rows { grid.insert(Array(repeating: "", count: QD.cols), at: 0) }
        self.cleared += cleared
        msg = cleared > 0 ? "Row cleared! +100" : "No row cleared. Line the word up with a gap."
        if wi < 2 { wi += 1; centerPiece() } else { finish(on: day) }
    }

    mutating func finish(on day: Date) {
        phase = 2
        let d = UserDefaults(suiteName: QD.suite)
        let last = d?.string(forKey: "qd.lastDone") ?? ""
        let y = QD.dayKey(Calendar.current.date(byAdding: .day, value: -1, to: day) ?? day)
        if last != self.day { streak = (last == y ? (d?.integer(forKey: "qd.streak") ?? 0) : 0) + 1 }
        d?.set(self.day, forKey: "qd.lastDone"); d?.set(streak, forKey: "qd.streak")
        d?.set(score, forKey: "qd.score")
        msg = cleared == 3 ? "Solved! All three rows cleared." : "Done for today: \(cleared) of 3 rows."
    }
}

enum QDStore {
    static func load(_ now: Date = Date()) -> QDState {
        let d = UserDefaults(suiteName: QD.suite), today = QD.dayKey(now)
        if let data = d?.data(forKey: QD.key), let s = try? JSONDecoder().decode(QDState.self, from: data), s.day == today { return s }
        let last = d?.string(forKey: "qd.lastDone") ?? ""
        let y = QD.dayKey(Calendar.current.date(byAdding: .day, value: -1, to: now) ?? now)
        let streak = (last == today || last == y) ? (d?.integer(forKey: "qd.streak") ?? 0) : 0
        return QDState.fresh(day: today, streak: streak)
    }
    static func save(_ s: QDState) {
        if let data = try? JSONEncoder().encode(s) { UserDefaults(suiteName: QD.suite)?.set(data, forKey: QD.key) }
    }
    static func update(_ f: (inout QDState) -> Void) { var s = load(); f(&s); save(s) }
}

// MARK: - Intents (each tap runs one, then the widget redraws)

@available(iOS 17.0, *)
struct QDTapTile: AppIntent {
    static var title: LocalizedStringResource = "Pick a letter"
    static var isDiscoverable: Bool = false
    @Parameter(title: "Tile") var index: Int
    init() {}
    init(index: Int) { self.index = index }
    func perform() async throws -> some IntentResult { QDStore.update { $0.tap(index) }; return .result() }
}

@available(iOS 17.0, *)
struct QDClearWord: AppIntent {
    static var title: LocalizedStringResource = "Clear the word"
    static var isDiscoverable: Bool = false
    init() {}
    func perform() async throws -> some IntentResult { QDStore.update { $0.clearWord() }; return .result() }
}

@available(iOS 17.0, *)
struct QDMove: AppIntent {
    static var title: LocalizedStringResource = "Move the word"
    static var isDiscoverable: Bool = false
    @Parameter(title: "Direction") var dir: Int
    init() {}
    init(dir: Int) { self.dir = dir }
    func perform() async throws -> some IntentResult { QDStore.update { $0.move(dir) }; return .result() }
}

@available(iOS 17.0, *)
struct QDDrop: AppIntent {
    static var title: LocalizedStringResource = "Drop the word"
    static var isDiscoverable: Bool = false
    init() {}
    func perform() async throws -> some IntentResult { QDStore.update { $0.drop() }; return .result() }
}

// MARK: - Widget

struct QDEntry: TimelineEntry { let date: Date; let s: QDState }

struct QDProvider: TimelineProvider {
    func placeholder(in context: Context) -> QDEntry { QDEntry(date: Date(), s: QDState.fresh(day: QD.dayKey(), streak: 0)) }
    func getSnapshot(in context: Context, completion: @escaping (QDEntry) -> Void) {
        completion(QDEntry(date: Date(), s: context.isPreview ? QDState.fresh(day: QD.dayKey(), streak: 0) : QDStore.load()))
    }
    func getTimeline(in context: Context, completion: @escaping (Timeline<QDEntry>) -> Void) {
        let now = Date()
        let midnight = Calendar.current.startOfDay(for: Calendar.current.date(byAdding: .day, value: 1, to: now) ?? now)
        completion(Timeline(entries: [QDEntry(date: now, s: QDStore.load(now))], policy: .after(midnight.addingTimeInterval(5))))
    }
}

private let qInk = Color(red: 0.96, green: 0.94, blue: 1.0)
private let qMuted = Color(red: 0.96, green: 0.94, blue: 1.0).opacity(0.72)
private let qOrange = Color(red: 1.0, green: 0.54, blue: 0.24)
private let qTeal = Color(red: 0.37, green: 0.82, blue: 0.77)
private let qTile = Color(red: 0.94, green: 0.91, blue: 0.84)
private let qTileInk = Color(red: 0.14, green: 0.11, blue: 0.21)
private let qPanel = Color.white.opacity(0.09)
private let qBg = LinearGradient(colors: [Color(red: 0.16, green: 0.10, blue: 0.24), Color(red: 0.08, green: 0.05, blue: 0.13)],
                                 startPoint: .topLeading, endPoint: .bottomTrailing)

@available(iOS 17.0, *)
struct QDView: View {
    let s: QDState
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("QUICK DAILY").font(.system(size: 12, weight: .heavy)).kerning(0.6).foregroundColor(qOrange)
                Spacer()
                Text(s.phase == 0 ? "Clue \(s.wi + 1) of 3" : s.phase == 1 ? "Word \(s.wi + 1) of 3 · \(s.cleared) cleared" : "🔥 \(s.streak)")
                    .font(.system(size: 12, weight: .semibold)).foregroundColor(qMuted)
            }
            switch s.phase {
            case 0: crossword
            case 1: well
            default: done
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    }

    var crossword: some View {
        let w = Array(s.words[s.wi]).map(String.init)
        return VStack(alignment: .leading, spacing: 10) {
            Text(s.clues[s.wi]).font(.system(size: 18, weight: .bold)).foregroundColor(qInk).lineLimit(2).minimumScaleFactor(0.8)
            HStack(spacing: 6) {
                ForEach(0..<w.count, id: \.self) { i in
                    let ch = i < s.typed.count ? String(Array(s.typed)[i]) : ""
                    Text(ch).font(.system(size: 22, weight: .heavy, design: .monospaced)).foregroundColor(qTileInk)
                        .frame(width: 40, height: 44)
                        .background(RoundedRectangle(cornerRadius: 8).fill(ch.isEmpty ? qPanel : qTile))
                        .overlay(RoundedRectangle(cornerRadius: 8).stroke(i == s.typed.count ? qOrange : .clear, lineWidth: 2))
                }
                Spacer(minLength: 0)
                Button(intent: QDClearWord()) { Image(systemName: "delete.left").font(.system(size: 18, weight: .semibold)).foregroundColor(qMuted).frame(width: 40, height: 44) }
                    .buttonStyle(.plain).accessibilityLabel("Clear the word")
            }
            Text(s.msg.isEmpty ? "Tap the letters in order." : s.msg).font(.system(size: 13, weight: .medium)).foregroundColor(qMuted).lineLimit(1)
            Spacer(minLength: 0)
            Grid(horizontalSpacing: 8, verticalSpacing: 8) {
                ForEach(0..<2, id: \.self) { row in
                    GridRow {
                        ForEach(0..<4, id: \.self) { c in
                            let i = row * 4 + c, gone = s.used.contains(i)
                            Button(intent: QDTapTile(index: i)) {
                                Text(s.tiles[i]).font(.system(size: 24, weight: .heavy, design: .monospaced))
                                    .foregroundColor(qTileInk).frame(maxWidth: .infinity).frame(height: 52)
                                    .background(RoundedRectangle(cornerRadius: 10).fill(qTile))
                            }
                            .buttonStyle(.plain).opacity(gone ? 0.22 : 1).disabled(gone)
                            .accessibilityLabel("Letter \(s.tiles[i])")
                        }
                    }
                }
            }
        }
    }

    var well: some View {
        let w = Array(s.words[s.wi]).map(String.init)
        return VStack(spacing: 8) {
            HStack(alignment: .top, spacing: 12) {
                VStack(spacing: 3) {
                    ForEach(0..<QD.rows, id: \.self) { r in
                        HStack(spacing: 3) {
                            ForEach(0..<QD.cols, id: \.self) { c in cell(r, c, w) }
                        }
                    }
                }
                .padding(4).background(RoundedRectangle(cornerRadius: 10).fill(Color.black.opacity(0.25)))
                VStack(alignment: .leading, spacing: 6) {
                    Text("Drop").font(.system(size: 12, weight: .heavy)).foregroundColor(qMuted)
                    Text(s.words[s.wi]).font(.system(size: 20, weight: .heavy, design: .monospaced)).foregroundColor(qOrange)
                    Text("into the gap in the top junk row.").font(.system(size: 12)).foregroundColor(qMuted).fixedSize(horizontal: false, vertical: true)
                    Spacer(minLength: 0)
                    if !s.msg.isEmpty { Text(s.msg).font(.system(size: 12, weight: .semibold)).foregroundColor(qInk).fixedSize(horizontal: false, vertical: true) }
                }
            }
            HStack(spacing: 8) {
                Button(intent: QDMove(dir: -1)) { ctl("chevron.left") }.buttonStyle(.plain).accessibilityLabel("Move left")
                Button(intent: QDMove(dir: 1)) { ctl("chevron.right") }.buttonStyle(.plain).accessibilityLabel("Move right")
                Button(intent: QDDrop()) {
                    Label("Drop", systemImage: "arrow.down.to.line").font(.system(size: 17, weight: .bold)).foregroundColor(qTileInk)
                        .frame(maxWidth: .infinity).frame(height: 46).background(RoundedRectangle(cornerRadius: 10).fill(qOrange))
                }.buttonStyle(.plain)
            }
        }
    }

    @ViewBuilder func cell(_ r: Int, _ c: Int, _ w: [String]) -> some View {
        let v = s.grid[r][c]
        let piece = r == 0 && c >= s.col && c < s.col + w.count && v.isEmpty
        let ch = piece ? w[c - s.col] : (v == "#" ? "" : v)
        Text(ch).font(.system(size: 14, weight: .heavy, design: .monospaced))
            .foregroundColor(qTileInk)
            .frame(width: 24, height: 24)
            .background(RoundedRectangle(cornerRadius: 4).fill(piece ? qOrange : v == "#" ? Color.white.opacity(0.28) : v.isEmpty ? qPanel : qTile))
    }

    func ctl(_ sym: String) -> some View {
        Image(systemName: sym).font(.system(size: 18, weight: .bold)).foregroundColor(qInk)
            .frame(width: 58, height: 46).background(RoundedRectangle(cornerRadius: 10).fill(qPanel))
    }

    var done: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(s.cleared == 3 ? "Solved!" : "Done for today").font(.system(size: 30, weight: .heavy)).foregroundColor(qInk)
            Text("\(s.score) points").font(.system(size: 20, weight: .bold, design: .rounded)).foregroundColor(qOrange)
            HStack(spacing: 6) { ForEach(s.words, id: \.self) { w in Text(w).font(.system(size: 13, weight: .heavy, design: .monospaced)).foregroundColor(qTileInk).padding(.horizontal, 8).padding(.vertical, 4).background(Capsule().fill(qTeal)) } }
            Text("\(s.cleared) of 3 rows cleared · \(s.mistakes) wrong letter\(s.mistakes == 1 ? "" : "s")").font(.system(size: 13)).foregroundColor(qMuted)
            Text("🔥 \(s.streak)-day Quick Daily streak").font(.system(size: 15, weight: .semibold)).foregroundColor(qInk)
            Spacer(minLength: 0)
            Text("A new Quick Daily arrives at midnight. Tap to open Crossfall for the full Daily.").font(.system(size: 12)).foregroundColor(qMuted)
        }
    }
}

@available(iOS 17.0, *)
struct QuickDailyWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: QD.kind, provider: QDProvider()) { e in
            QDView(s: e.s).containerBackground(for: .widget) { qBg }
        }
        .configurationDisplayName("Quick Daily")
        .description("Solve three tiny clues, then drop the words into the well. Play it right on your Home Screen.")
        .supportedFamilies([.systemLarge])
    }
}
