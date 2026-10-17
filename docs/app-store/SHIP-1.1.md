# Shipping Crossfall 1.1

Version 1.1 (build 16 uploaded; build 17 ready, see ../testflight-release-checklist.md). Release it once 1.0 is approved and live; App Store Connect won't take a new version while 1.0 is still in review.

## 1. Screenshots (ready)

| Set | Folder | Size | Use for |
| --- | --- | --- | --- |
| iPhone 6.9" | `screenshots-1.1/` | 1320 × 2868 | Required iPhone set (6.9" display) |
| iPhone 6.3" | `screenshots-6.3-1.1/` | 1206 × 2622 | Optional 6.3" set |
| iPad 13" | `screenshots-ipad-1.1/` | 2064 × 2752 | Required iPad set |

Order: 1 Crosswords that fall · 2 Solve the clue · 3 Events & seasons · 4 Learn a language · 5 Duel a friend's ghost · 6 Your word book · 7 Hometown legends · 8 Play your way.

## 2. Text

- **What's New:** copy the block in `WHATS-NEW-1.1.md` (about 1,600 characters).
- **Promotional text (170):** `700+ crosswords that fall into a well. Learn a language, duel a friend's ghost, chase golden words, and play a free event every week. No ads, no tracking.`
- **Keywords (100):** `crossword,word,puzzle,blocks,falling,language,spanish,vocabulary,spelling,daily,mini,anagram,brain`
- **Description:** in the 1.0 text, change "Nine categories … 180 in all" to "Ten categories, including Language, with 70 or more puzzles each: 700+ in all." Then add a LEARN A LANGUAGE paragraph and an EVENTS & SEASONS paragraph, using the What's New wording.

## 3. App privacy (update in App Store Connect)

- **Location: Coarse Location.** Used only for App Functionality, not linked to the user, no tracking. It's optional, asked once in the Sports intro, and matched to a city on the device.
- Game Center friends are handled by Apple's Game Center. No new data is collected by Crossfall.

## 4. In-app purchase

Crossfall Pro is unchanged. The paywall copy now says "70 or more crosswords in every category". No new review screenshot is needed.

## 5. Build

- `MARKETING_VERSION 1.1`, `CURRENT_PROJECT_VERSION 17` (16 already uploaded).
- New Info.plist keys: `NSLocationWhenInUseUsageDescription` and `NSGKFriendListUsageDescription`.
- In Xcode: Product › Archive, then Distribute App › App Store Connect › Upload. Build 16 goes to TestFlight.

## 6. Before you submit

- [ ] Play the TestFlight build on a real iPhone: Daily, one puzzle in each category, the Language quiz and Rapid Recall, the Sports intro with location, the events screen, the word book, a duel code, and buying and restoring Pro (sandbox).
- [ ] The Friends tab on Rankings asks for friends permission and loads.
- [ ] The widget shows the streak, and the reminder fires.
- [ ] Upload the screenshots, What's New, promotional text and keywords.
- [x] Update app privacy (Coarse Location). Published 15 Oct 2026.
- [ ] Add the review notes from `WHATS-NEW-1.1.md`.
