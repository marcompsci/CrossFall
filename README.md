# Crossfall

A word game for iPhone: solve a crossword, and every word you finish **falls** into a Tetris-style well as a piece. Stack the letters so a target word lands on the middle line, and when the stack climbs past it you get a timed **rush** to find the word hiding in it.

![Crossfall app icon](design/app-icon-final.png)

## What's in the game
- **Categories** as swipeable cards: Sports (Skate Park, Hoops, Soccer), Biblical, Psychology, Books, Music, Arcade, Bay City, Kitchen, Night Sky.
- **Personal categories** (Biblical, Psychology, Books) start with a 5-question check-in that picks words around the player's focus (Peace, Hope, Strength, Love, Rest, Courage, Letting go, Gratitude). Biblical clues are KJV verses, Books clues are public-domain quotes, and every verse or quote can be read back at the end.
- **Three drop styles** (whole word, tetromino chunks, one letter at a time) and **three rush styles** (tap the letters, unscramble, answer a clue).
- **Adaptive rush timer**: starts at 2:00 and shortens for players who win fast (never under 0:30); gives time back after a timeout.
- **Forgiving fall**: about 1.3–1.5 s per row, a 2 s pause before each piece falls, and a short slide after it lands.
- **Accessibility**: crossword and well on separate full-width screens, bigger text, high contrast, a press-and-hold magnifying glass, screen-reader announcements.
- **Light and dark mode** from the ☰ menu.
- **Profile dashboard** (level, score history, stars, rush times) and a **rankings** page.

## Project layout
| Path | What |
| --- | --- |
| `web/crossfall.html` | The whole game (HTML, CSS, JS in one file). This is the source of truth. |
| `Crossfall/index.html` | The game wrapped for the iOS app. Regenerate with `python3 scripts/build_index.py`. |
| `Crossfall/CrossfallApp.swift` | SwiftUI app: a WKWebView that serves the bundled game at `crossfall://app/` (so saved progress persists) and switches the status bar for light/dark mode. |
| `Crossfall/Assets.xcassets` | App icon (1024 px). |
| `design/` | Final icon and the other icon options. |
| `Install on iPhone.command` | Double-click on the Mac: builds and installs on the plugged-in iPhone. |
| `Ship to TestFlight.command` | Double-click on the Mac: archives and uploads a new TestFlight build. |

Bundle ID `com.phoronomicstudios.crossfall` · iOS 16+ · iPhone, portrait.

## Updating the app after changing the game
1. Edit `web/crossfall.html`.
2. `python3 scripts/build_index.py`
3. Double-click **Install on iPhone.command** to test, then **Ship to TestFlight.command** to upload.
   If the upload step says "Failed to Use Accounts", double-click `build/Crossfall.xcarchive` and use Xcode Organizer: Distribute App > App Store Connect > Distribute.

## TestFlight
- App Store Connect app: **Crossfall** (bundle ID `com.phoronomicstudios.crossfall`), created 11 Oct 2026 from Xcode Organizer.
- First build: 0.1 (2610111829), uploaded 11 Oct 2026. Build numbers come from the date and time (YYMMDDHHMM).

## Notes
- In the iOS app the Rankings tab shows a placeholder; worldwide rankings are planned for Game Center. The live leaderboard currently runs only in the web version published in Claude.
- Before an App Store release, proofread the Bible verses and book quotes against their sources.
