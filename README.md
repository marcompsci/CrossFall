<p align="center">
  <img src="design/app-icon-final.png" width="160" alt="Crossfall app icon: the words WORDS, FALL and DOWN falling as Tetris pieces onto CROSS">
</p>

<h1 align="center">Crossfall</h1>

<p align="center"><b>Solve the crossword. Watch the words fall. Find what's hiding in the stack.</b><br>
A word puzzle game for iPhone that crosses a crossword with a falling-block well.</p>

<p align="center">
  <img src="docs/screenshots/home-cards.png" width="200" alt="Home screen with swipeable category cards">
  <img src="docs/screenshots/crossword-light.png" width="200" alt="Crossword screen in light mode">
  <img src="docs/screenshots/well-light.png" width="200" alt="Letter well with a falling word">
  <img src="docs/screenshots/profile-light.png" width="200" alt="Profile dashboard">
</p>

---

## How to play

1. **Solve a clue.** Tap a square and type. Tap the clue bar to switch between Across and Down.
2. **Your word falls.** Every finished word drops into the well as a piece: the whole word, Tetris-style chunks, or one letter at a time, depending on the puzzle. Move it with ◀ ▶, rotate with ⟳, slam it down with ⤓.
3. **Build the target.** Each puzzle has a target word. Spell it across the orange middle line, or down through it, for **+500**. Fill a whole row to clear it.
4. **Win the rush.** When the stack climbs above the middle line, a rush starts: find the hidden word by tapping its letters in the well, unscrambling it, or answering a clue. Win and everything above the line clears. Run out of time and a junk row rises from the bottom.
5. **Earn stars.** One for finishing, one for building the target, one for winning every rush.

## Features

| | |
| --- | --- |
| **Categories** | Swipeable game cards: Sports (Skate Park, Hoops, Soccer), Biblical, Psychology, Books, Music, Arcade, Bay City, Kitchen and Night Sky. |
| **Personal puzzles** | Biblical, Psychology and Books open with a five-question check-in. The answers choose the words, built around the player's focus: Peace, Hope, Strength, Love, Rest, Courage, Letting go or Gratitude. Clues are King James Version verses, short affirmations and public-domain book quotes, and each one can be read back at the end. |
| **Adaptive rush timer** | Every rush starts at 2:00. Win fast and your next one gets shorter (down to 0:30). Run out of time and it gives time back. Tracked per player and per rush style. |
| **Forgiving fall** | About 1.3–1.5 s per row, a 2-second pause before each piece starts falling, and a moment to slide it after it lands. |
| **Accessibility** | Crossword and well on separate full-width screens, bigger text, high contrast, a press-and-hold magnifying glass over clues and tiles, and screen-reader announcements. |
| **Light and dark mode** | Switch from the ☰ menu. Light mode uses a warm off-white. |
| **Profile** | Level and XP, total and weekly score, stars, rush win rate, day streak, a score chart and recent games. |
| **Rankings** | All time, this week and best game. Live in the web version; Game Center is planned for the App Store version. |

<p align="center">
  <img src="docs/screenshots/rush.png" width="200" alt="Rush: find the hidden word in the well">
  <img src="docs/screenshots/menu.png" width="200" alt="Side menu with categories and light/dark switch">
  <img src="docs/screenshots/ranks.png" width="200" alt="Rankings page">
</p>

## How it's built

The whole game lives in **one HTML file** (`web/crossfall.html`: markup, CSS and JavaScript, no frameworks). The iOS app is a small SwiftUI shell around a `WKWebView`:

- It serves the bundled game from `crossfall://app/`, a custom URL scheme, so saved stars, stats and settings persist between launches.
- It listens for a `theme` message from the page and switches the status bar and background when the player changes between light and dark mode.

Crossword layouts are generated on the fly by a backtracking placer (max 9×9). The personal categories build a fresh crossword from the player's themes every time.

## Project layout

```
Crossfall/
├── web/crossfall.html            # The game: source of truth
├── Crossfall/
│   ├── CrossfallApp.swift        # SwiftUI app + WKWebView + theme bridge
│   ├── index.html                # web/crossfall.html wrapped for iOS (generated)
│   └── Assets.xcassets/          # App icon
├── Crossfall.xcodeproj
├── scripts/build_index.py        # Regenerates Crossfall/index.html
├── Install on iPhone.command     # Build + install on the plugged-in iPhone
├── Ship to TestFlight.command    # Archive + upload a TestFlight build
├── design/                       # Final icon and the icon options
└── docs/screenshots/
```

## Run it

**In a browser:** open `web/crossfall.html`. It works on its own; rankings show as offline.

**On an iPhone** (macOS with Xcode 15 or later, iOS 16 or later):

1. Plug in the iPhone, unlock it and turn on Developer Mode.
2. Double-click **`Install on iPhone.command`**. It finds the phone, builds, signs with automatic signing, installs and opens the app. The log is in `Logs/install.txt`.

Or open `Crossfall.xcodeproj`, choose your team under *Signing & Capabilities*, pick your iPhone and press Run.

**After changing the game:**

```bash
python3 scripts/build_index.py      # copies web/crossfall.html into the app
```

Then run **Install on iPhone** again.

## TestFlight

Double-click **`Ship to TestFlight.command`**. It archives a Release build and uploads it. Each build number comes from the date and time (`YYMMDDHHMM`), so every run makes a new build.

If the upload step says **"Failed to Use Accounts"**:

1. Double-click `build/Crossfall.xcarchive`.
2. In Xcode Organizer, choose **Distribute App › App Store Connect › Distribute**.

To stop the error for future uploads, sign out of your Apple ID and back in under *Xcode › Settings › Accounts*.

| | |
| --- | --- |
| App Store Connect app | Crossfall |
| Bundle ID | `com.phoronomicstudios.crossfall` |
| First build | 0.1 (2610111829), 11 Oct 2026 |
| Devices | iPhone, portrait |

## Roadmap

- [ ] Game Center leaderboards (all time, weekly, best game)
- [ ] Fall-speed setting (Relaxed / Normal / Fast)
- [ ] Light/dark mode that follows the phone's setting
- [ ] Dynamic Type and full VoiceOver support in the native app
- [ ] More puzzles per category and a bigger word list
- [ ] Sound and music pass
- [ ] App Store listing: screenshots, description, privacy details

## Content notes

- Bible verses are from the King James Version (public domain).
- Book quotes come only from public-domain authors: Thoreau, Emerson, Dickinson, Shelley, Pope, Wilde, Henley, Alcott, Kipling, Shakespeare, Whitman, Keats, Wordsworth, Twain, Frost (1916), Brontë, Austen and Dickens.
- Psychology affirmations were written for the game.
- The check-in answers stay on the device. Crossfall is a game, not therapy; the check-in screen points players to someone they trust, and to 988 in the US.
- Proofread all verses and quotes against their sources before an App Store release.

---

<p align="center">Made by Omari Bell</p>
