# Crossfall — App Review and TestFlight review text

Copy-ready text for **App Store Connect**. Each block fits Apple's field limits (TestFlight "What to Test" ≤ 4,000 characters, "Beta App Description" ≤ 4,000, App Review notes ≤ 4,000).

---

## 1. Beta App Description (TestFlight › Test Information)

```
Crossfall is a word game where crosswords fall. Solve a clue and your word drops into a well as a falling piece. Stack it, spell the target word on the middle line, and win the word rush before time runs out.

700+ puzzles across ten categories, plus four free Today's Puzzles (the Mini, Chunks, Ladder and Cipher), a Daily, a 40-stop Word Trail, a 60-second Rush Gym, weekly events and seasonal packs (Spooky Season until 2 November, Harvest Season 3 to 30 November). Game Center leaderboards, a home-screen widget, and a one-time Crossfall Pro purchase. No ads, no tracking, no account.
```

## 2. What to Test (TestFlight, per build)

```
Build 17 — thanks for testing! Please try:

1. First launch: the welcome questions, the one-minute tour, then the simpler "Start here" home for your first three games.
2. Play one puzzle start to finish (Play › any category). Tell us if the falling pieces feel too fast or slow. Rate it on the result screen.
3. Today's Puzzles on the home screen: the Daily, the Mini, Chunks, Ladder and the new Cipher.
4. ☰ Menu › Word Trail: clear the first two stops.
5. Power-ups (Freeze, Bomb, Sweep and the new Rewind) under the drop buttons, and the Fever bar under the target.
6. ☰ › Rush Gym, My records, Achievements, Insights and Word of the day. Try Surprise me on the home screen.
7. ☰ › Spooky Season (until 2 November) or Harvest Season (3 to 30 November).
8. Settings (Aa): Privacy policy and Help & support links open in Safari.
9. Rankings tab, signed in and signed out of Game Center.
10. Go Pro and Restore purchase (TestFlight purchases are free and not charged).

Send feedback with a screenshot: take a screenshot in the app and tap Share Beta Feedback, or open TestFlight › Crossfall › Send Beta Feedback.
```

## 3. App Review notes (App Store version 1.1 and TestFlight external review)

```
Crossfall is a single-player word game. No sign-in or account is needed, so there is no demo account.

TRY A ROUND
Play › Sports › Skate Park. Type the answer to a clue; the word falls into the well. Move it with ◀ ▶, rotate with ⟳, drop with ⤓. When the stack crosses the orange middle line, a "rush" starts: find the hidden word before the timer runs out.

FIRST LAUNCH
A short welcome (nickname, mood, choose 3 free categories), then a one-minute playable tour you can skip.

IN-APP PURCHASE
Crossfall Pro, non-consumable (com.phoronomicstudios.crossfall.pro). Free players get 6 puzzles in each chosen category plus every daily puzzle, event and season. To see the purchase sheet: open a category you didn't pick, puzzle 7 of a picked one, or Menu › Go Pro. Restore Purchase is on the same sheet. There are no other purchases, no subscriptions and no external links to buy.

NEW IN 1.1 (where to find it)
• Ladder: Today's Puzzles on the home screen.
• Word Trail (40 stops): Menu › Word Trail.
• Power-ups and Fever: in any regular game, under the drop buttons. Off in the Daily and in duels so those scores stay fair.
• Achievements, Insights, Word of the day, Avatar & title: Menu.
• Quests, Marathon and Pass & Play (same-device multiplayer): Menu › Quests, Marathon & Pass and Play.
• Spooky Season: a free, time-limited pack (15 Oct to 2 Nov). Menu › Spooky Season. After 2 Nov this menu item is hidden.
• Harvest Season: a free, time-limited pack (3 to 30 Nov). Menu › Harvest Season and a tile on the home screen, shown only on those dates.
• Cipher: a fourth Today's Puzzle on the home screen, a daily cryptogram of a public-domain saying or proverb.
• Rush Gym (60-second unscramble sprint) and My records: Menu.
• Rewind power-up: under the drop buttons, next to Freeze, Bomb and Sweep.
• Surprise me: home screen; starts a random puzzle the player can already play.
• A short thumbs-up / "Not for me" on the result screen. It's stored on the device and only changes which puzzles "For you" suggests.
• New players see a simpler home screen (the Daily plus one suggested puzzle) for their first three games; "Show everything now" opens the full screen right away.

WELLNESS TOPICS
Biblical, Psychology and Books start with an optional check-in that chooses which words appear, and offer an optional reflection note after a game (Menu › My journal). All of this is stored only on the device; Menu › My journal › Delete all removes it. The app says it is a game, not therapy, and lists 988 (US). No health claims are made.

SHARING
Players can share a challenge code or a home-made puzzle code as text (for example in Messages). There is no chat, feed, profile or server: a code only appears in someone's game after they paste it themselves. Codes contain a puzzle id or word list, a score and a nickname limited to letters and numbers.

PERMISSIONS (all optional, all asked only when the player taps the feature)
• Location: Sports intro › "Use my current location". Reduced accuracy, read once, matched to a built-in city list on the device. Typing a hometown works without it.
• Game Center friends: Rankings › Friends.
• Notifications: Settings › Daily reminder.

PRIVACY
No ads, analytics, tracking or third-party SDKs. The app makes no network requests of its own; it uses only Apple's Game Center, StoreKit and notifications. Privacy policy and support are linked in Settings and the Menu.
```

## 4. What's New in This Version (App Store 1.1)

Use the block in [`app-store/WHATS-NEW-1.1.md`](app-store/WHATS-NEW-1.1.md). It's been updated for build 17.

## 5. Reviewer navigation, quick reference

| To check | Path |
| --- | --- |
| A full game | Play › Sports › Skate Park |
| Purchase sheet | Menu › Go Pro |
| Restore purchase | Menu › Go Pro › Restore purchase |
| Privacy policy | Settings (Aa) › Privacy policy, or Menu › Privacy policy |
| Support | Settings (Aa) › Help & support |
| Delete journal data | Menu › My journal › Delete all entries and saved quotes |
| Location prompt | Play › Sports (first time) › Use my current location |
| Leaderboards | Rankings tab |

## 6. Demo account

Not needed: the app has no accounts or sign-in. Game Center is optional and uses the reviewer's own Game Center sign-in.

## 7. Contact information (TestFlight › Test Information, and App Review › contact)

Apple needs a first and last name, a phone number and an email that Apple can reach. Omari enters these himself in App Store Connect. They are **not** stored in this repository, and the personal address shouldn't go on public pages.

Feedback email (TestFlight): use a dedicated support address if one exists. Otherwise testers can use TestFlight's built-in feedback, which needs no email.
