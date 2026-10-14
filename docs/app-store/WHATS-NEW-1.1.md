# Crossfall 1.1 — release notes

Paste into App Store Connect › 1.1 › What's New in This Version (under 4,000 characters):

```
Learn a language as you play
• New Language category: Spanish, French, Italian, Portuguese, German, Japanese or Mandarin.
• Tell us what you're learning and every puzzle is built around it. Spell each word, hear it spoken, and see hints from languages you already know.
• Rapid Recall: a 60-second drill to lock words in. See it or hear it, then spell it fast.
• The Language lab spaces your reviews so each word comes back right before you'd forget it.

Sports legends
• Three new Sports puzzles built from famous lines by the greatest athletes, including quotes in their original Spanish and Dutch.

Today's Puzzles
• Two new free daily puzzles next to the Daily Crossfall.
• The Mini: a quick 5×5 crossword against the clock.
• Chunks: rebuild 4 theme words from letter chunks and chase a Perfect.
• Every puzzle shows its difficulty, keeps its own streak, and has a scoreboard and a 14-day archive.

Level up and make it yours
• Every point you score is XP. Levels unlock 7 new well themes: Neon, Sunset, Ocean, Forest, Royal and Gold.
• Three weekly challenges, new every Monday. Finish all three for bonus XP and a streak freeze.
• Daily streak milestones at 3, 7, 14, 30, 50, 100 and 365 days.

Challenge a friend
• After any puzzle, send a challenge with your score and a picture of your result. Your friend plays the same puzzle and sees who won.

Never miss a Daily
• An optional daily reminder that mentions your streak and skips days you've already played.
• A new home-screen and Lock Screen widget with your streak and today's Daily.

Sounds better
• New sound effects for solves, drops, row clears, targets and rushes.
• Three original music tracks: Calm, Drive and Night.
```

## Review notes for 1.1

- Notifications are off by default. Settings (Aa) › Daily reminder asks for permission only when the player turns it on.
- The widget uses the app group `group.com.phoronomicstudios.crossfall` to read a small snapshot (streak, level, weekly progress). No data leaves the device.
- Challenge codes (`CFC.…`) only carry a puzzle id, a score, a nickname and a grade. Codes for paid puzzles still show the Pro sheet to free players.

## Before archiving 1.1

1. Xcode › Crossfall target › Signing & Capabilities: confirm **App Groups** shows `group.com.phoronomicstudios.crossfall` with a checkmark (automatic signing registers it on the first device build).
2. Same for the **CrossfallWidgetExtension** target (bundle id `com.phoronomicstudios.crossfall.widget`).
3. Build 13 is version 1.1. Archive only after 1.0 is approved, then create version 1.1 in App Store Connect.
