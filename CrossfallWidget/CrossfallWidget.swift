import WidgetKit
import SwiftUI

// Home-screen and Lock Screen widget: your Daily streak, whether today's puzzle is done,
// your level and this week's challenges. The game writes a small snapshot to the app group.

struct DailyEntry: TimelineEntry {
    let date: Date
    let streak: Int
    let doneToday: Bool
    let freezes: Int
    let level: Int
    let pct: Int
    let weekly: Int
    let score: Int

    static let sample = DailyEntry(date: Date(), streak: 6, doneToday: false, freezes: 1, level: 7, pct: 40, weekly: 2, score: 0)

    static func load(at date: Date = Date()) -> DailyEntry {
        let d = UserDefaults(suiteName: "group.com.phoronomicstudios.crossfall")
        let day = d?.string(forKey: "day") ?? ""
        let f = DateFormatter(); f.dateFormat = "yyyy-MM-dd"; f.locale = Locale(identifier: "en_US_POSIX")
        let today = f.string(from: date)
        let yesterday = f.string(from: Calendar.current.date(byAdding: .day, value: -1, to: date) ?? date)
        let streak = d?.integer(forKey: "streak") ?? 0
        let done = (d?.bool(forKey: "doneToday") ?? false) && day == today
        // A snapshot from yesterday still counts if the player was done then; older ones only keep the streak if freezes cover it.
        let liveStreak = (day == today || day == yesterday) ? streak : (d?.integer(forKey: "freezes") ?? 0) > 0 ? streak : 0
        return DailyEntry(date: date, streak: liveStreak, doneToday: done, freezes: d?.integer(forKey: "freezes") ?? 0,
                          level: max(1, d?.integer(forKey: "level") ?? 1), pct: d?.integer(forKey: "pct") ?? 0,
                          weekly: d?.integer(forKey: "weekly") ?? 0, score: day == today ? (d?.integer(forKey: "score") ?? 0) : 0)
    }
}

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> DailyEntry { .sample }
    func getSnapshot(in context: Context, completion: @escaping (DailyEntry) -> Void) {
        completion(context.isPreview ? .sample : .load())
    }
    func getTimeline(in context: Context, completion: @escaping (Timeline<DailyEntry>) -> Void) {
        let now = Date()
        let midnight = Calendar.current.startOfDay(for: Calendar.current.date(byAdding: .day, value: 1, to: now) ?? now)
        completion(Timeline(entries: [.load(at: now), .load(at: midnight.addingTimeInterval(5))], policy: .after(midnight.addingTimeInterval(60))))
    }
}

private let ink = Color(red: 0.96, green: 0.94, blue: 1.0)
private let orange = Color(red: 0.91, green: 0.40, blue: 0.11)
private let teal = Color(red: 0.15, green: 0.66, blue: 0.60)
private let bg = LinearGradient(colors: [Color(red: 0.16, green: 0.10, blue: 0.24), Color(red: 0.08, green: 0.05, blue: 0.13)],
                                startPoint: .topLeading, endPoint: .bottomTrailing)

extension View {
    @ViewBuilder func widgetBackground(_ plain: Bool) -> some View {
        if #available(iOSApplicationExtension 17.0, *) {
            if plain { containerBackground(for: .widget) { Color.clear } } else { containerBackground(for: .widget) { bg } }
        } else if plain { self } else { padding().background(bg) }
    }
}

struct SmallView: View {
    let e: DailyEntry
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("CROSSFALL").font(.system(size: 11, weight: .heavy)).foregroundColor(orange).kerning(1)
            Spacer(minLength: 0)
            HStack(alignment: .firstTextBaseline, spacing: 4) {
                Text("🔥").font(.system(size: 26))
                Text("\(e.streak)").font(.system(size: 40, weight: .heavy, design: .rounded)).foregroundColor(ink)
            }
            Text("day streak").font(.system(size: 12, weight: .semibold)).foregroundColor(ink.opacity(0.7))
            Spacer(minLength: 0)
            Text(e.doneToday ? "✓ Daily done" : "Daily is ready")
                .font(.system(size: 13, weight: .bold))
                .foregroundColor(e.doneToday ? teal : .white)
                .padding(.horizontal, 8).padding(.vertical, 4)
                .background(Capsule().fill(e.doneToday ? teal.opacity(0.2) : orange))
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
    }
}

struct MediumView: View {
    let e: DailyEntry
    var body: some View {
        HStack(spacing: 14) {
            SmallView(e: e)
            VStack(alignment: .leading, spacing: 8) {
                Label { Text("Level \(e.level)").font(.system(size: 14, weight: .bold)).foregroundColor(ink) } icon: { Text("⭐️") }
                GeometryReader { g in
                    ZStack(alignment: .leading) {
                        Capsule().fill(ink.opacity(0.15))
                        Capsule().fill(orange).frame(width: g.size.width * CGFloat(min(100, max(0, e.pct))) / 100)
                    }
                }.frame(height: 6)
                Label { Text("Weekly \(e.weekly)/3").font(.system(size: 14, weight: .bold)).foregroundColor(ink) } icon: { Text("🏆") }
                if e.doneToday && e.score > 0 {
                    Text("Today: \(e.score) pts").font(.system(size: 12, weight: .semibold)).foregroundColor(ink.opacity(0.7))
                } else if e.freezes > 0 {
                    Text("❄ \(e.freezes) freeze\(e.freezes == 1 ? "" : "s") saved").font(.system(size: 12, weight: .semibold)).foregroundColor(ink.opacity(0.7))
                }
                Spacer(minLength: 0)
            }
        }
    }
}

struct CrossfallWidgetView: View {
    @Environment(\.widgetFamily) var family
    let e: DailyEntry
    var body: some View {
        content.widgetBackground(family != .systemSmall && family != .systemMedium)
    }
    @ViewBuilder var content: some View {
        switch family {
        case .accessoryCircular:
            ZStack {
                AccessoryWidgetBackground()
                VStack(spacing: 0) { Text("🔥").font(.system(size: 14)); Text("\(e.streak)").font(.system(size: 20, weight: .heavy, design: .rounded)) }
            }
        case .accessoryInline:
            Text(e.doneToday ? "🔥 \(e.streak) · Daily done" : "🔥 \(e.streak) · Crossfall Daily ready")
        case .accessoryRectangular:
            VStack(alignment: .leading) {
                Text("Crossfall").font(.headline)
                Text("🔥 \(e.streak)-day streak")
                Text(e.doneToday ? "Daily done ✓" : "Daily is ready")
            }
        case .systemMedium:
            MediumView(e: e)
        default:
            SmallView(e: e)
        }
    }
}

@main
struct CrossfallWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "CrossfallDaily", provider: Provider()) { entry in
            CrossfallWidgetView(e: entry)
        }
        .configurationDisplayName("Crossfall Daily")
        .description("Your streak and today's Daily puzzle.")
        .supportedFamilies([.systemSmall, .systemMedium, .accessoryCircular, .accessoryInline, .accessoryRectangular])
    }
}
