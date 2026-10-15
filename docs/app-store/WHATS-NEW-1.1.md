# Crossfall 1.1 — release notes

Paste into App Store Connect › 1.1 › What's New in This Version (under 4,000 characters):

```
Crossfall 1.1 is our biggest update yet.

Learn a language
• A new Language category for Spanish, French, Italian, Portuguese, German, Japanese or Mandarin. Spell each word, hear it spoken, and lock it in with 60-second Rapid Recall drills.

700+ puzzles
• 50 new puzzles in every category, plus a free weekly event and a six-puzzle season pack every month with badges and season-only well themes.

Today's Puzzles
• The Mini (a 5×5 crossword against the clock) and Chunks (rebuild 4 theme words) sit next to the Daily, each with its own streak, scoreboard and archive.

Play your way
• Pick Easy, Medium, Hard or Expert for each category. Harder levels score up to ×1.5, and Crossfall suggests a change when you're crushing it or stuck.
• New hint choices: reveal a letter, show the vowels, or solve the word.

Sports, made personal
• Tell us your sports, teams and hometown and meet the legends from your area, from Bill Russell in Oakland to Messi in Rosario.

Your word book
• Every word you solve is collected. Hunt for golden words and finish a category for a collector badge.

Play with friends
• Challenge a friend and they race a live ghost of your run. Track your record against every rival.
• A Friends view on the Game Center leaderboards, and a "Share my week" card.

Feels better
• Big chain and combo callouts, rising chain sounds, word bursts and a highlights reel after every puzzle.
• XP and levels, 11 well themes, weekly challenges, streak milestones, a daily reminder, a home-screen widget, and three original music tracks.
• Every icon is now an original Crossfall letter tile.
```

## Review notes for 1.1

- Location (optional): the Sports intro offers "Use my current location". It asks once, uses reduced accuracy, matches the nearest city on the device and stores only that city. Typing a hometown works without location.
- Game Center friends (optional): the Friends tab on Rankings asks for friends-list permission (NSGKFriendListUsageDescription) only when tapped.
- Weekly events make 5 Pro puzzles free for everyone that week; season packs are free for everyone.

- Notifications are off by default. Settings (Aa) › Daily reminder asks for permission only when the player turns it on.
- The widget uses the app group `group.com.phoronomicstudios.crossfall` to read a small snapshot (streak, level, weekly progress). No data leaves the device.
- Challenge codes (`CFC.…`) only carry a puzzle id, a score, a nickname and a grade. Codes for paid puzzles still show the Pro sheet to free players.

## Before archiving 1.1

1. Xcode › Crossfall target › Signing & Capabilities: confirm **App Groups** shows `group.com.phoronomicstudios.crossfall` with a checkmark (automatic signing registers it on the first device build).
2. Same for the **CrossfallWidgetExtension** target (bundle id `com.phoronomicstudios.crossfall.widget`).
3. Build 13 is version 1.1. Archive only after 1.0 is approved, then create version 1.1 in App Store Connect.
