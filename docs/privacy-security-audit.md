# Crossfall — privacy and security audit

_16 October 2026 · version 1.1 (17)_

## 1. Data inventory

Everything Crossfall stores lives on the device. There is no Crossfall server.

| Data | Where it's stored | Leaves the device? | Linked to identity? | Deletable |
| --- | --- | --- | --- | --- |
| Progress, stars, scores, XP, achievements, settings, nickname | Web view `localStorage` | No | No | Delete the app |
| Check-in answers (Biblical, Psychology, Books) | `localStorage` | No | No | Menu › Change my check-in answers; delete the app |
| Journal notes, moods, saved quotes | `localStorage` (`crossfall-journal`, `crossfall-quotes`) | No | No | Per entry, or Menu › My journal › **Delete all** |
| Hometown (city id from built-in list) | `localStorage` | No | No | Sports intro; delete the app |
| Location coordinates (optional) | Memory only, discarded after matching | No | No | Not stored |
| Widget snapshot (streak, level, weekly progress) | App-group `UserDefaults` | No | No | Delete the app |
| Backup code | Created only when the player taps Back up; contains all of the above | Only if the player shares it | No | Player controls it |
| Game Center scores, achievements | Sent to **Apple** Game Center | Yes, to Apple | Yes, Game Center player | Apple account settings |
| Purchase entitlement | Apple StoreKit | Apple | Apple Account | Apple |

### App Privacy label (App Store Connect)

Published 15 Oct 2026: **Coarse Location — App Functionality — not linked to the user — not used for tracking.** That matches `Crossfall/PrivacyInfo.xcprivacy`. Game Center and StoreKit data is collected by Apple, not by the developer, so it isn't declared as developer-collected. **Recheck this every release:** if a future feature sends anything off the device (analytics, crash reporting, a server), the label, the manifest and `PRIVACY.md` must all change together, and that feature needs Omari's approval first.

## 2. Privacy manifests and required-reason APIs

| Binary | File | Declares |
| --- | --- | --- |
| Crossfall.app | `Crossfall/PrivacyInfo.xcprivacy` | `NSPrivacyTracking` false, no tracking domains; collected: Coarse Location (not linked, no tracking, App Functionality); `NSPrivacyAccessedAPICategoryUserDefaults`: **CA92.1** (app's own defaults), **1C8F.1** (app group shared with the widget) |
| CrossfallWidgetExtension.appex | `CrossfallWidget/PrivacyInfo.xcprivacy` | `NSPrivacyTracking` false; nothing collected; UserDefaults **1C8F.1** |

`release_gate.py` greps the Swift sources for the other required-reason API families (file timestamps, system boot time, disk space, active keyboards) and fails if one appears without a declaration. None are used today. WebKit's own use of these APIs is covered by Apple's system framework manifest.

There are **no third-party SDKs** (no Swift packages, CocoaPods or frameworks), so there are no SDK manifests or signatures to collect.

## 3. Permissions

| Permission | Purpose string key | When it's asked | Without it |
| --- | --- | --- | --- |
| Location (When In Use, approximate only) | `NSLocationWhenInUseUsageDescription`; code sets `desiredAccuracy = kCLLocationAccuracyReduced` | Only when the player taps "Use my current location" in the Sports intro | Type a hometown instead |
| Game Center friends | `NSGKFriendListUsageDescription` | Only on Rankings › Friends | Global leaderboards only |
| Notifications | (runtime prompt) | Only when the daily reminder is turned on | No reminder |

No camera, microphone, photos, contacts, Bluetooth, tracking (ATT) or health permissions are requested. The gate fails if code for any of those appears without a purpose string.

## 4. Network and transport security

- The game is served from the app bundle through a custom `crossfall://` scheme (`BundleSchemeHandler`). It only serves files inside the bundle (no path traversal outside `Bundle.main`).
- **The app makes no network requests of its own.** Fonts used to come from Google Fonts and are now bundled. The smoke test blocks and records every `http(s)` request and requires zero.
- App Transport Security is at its defaults: no `NSAllowsArbitraryLoads` or exceptions.
- `WKNavigationDelegate` allows only `crossfall:`, `about:`, `data:` and `blob:` inside the web view. `https`, `http` and `mailto` links open in Safari, and new-window requests are refused.
- Apple frameworks (Game Center, StoreKit) make their own TLS connections.

## 5. Code and content security

| Check | Result |
| --- | --- |
| Remote code (2.5.2) | None. No remote `<script src>`, no `eval` of fetched content. Gate enforces. |
| HTML injection from shared codes | **Fixed in this audit.** Clue text in a shared `CF1.` puzzle code reached `innerHTML` in the rush prompt and could run script with access to the journal and the native bridges. Shared clue and title text is now stripped of `<` `>` on import, and the prompt is escaped. A permanent smoke-test check fails if this regresses. Challenge nicknames were already filtered to letters, numbers, space, `_`, `.` and `-`. |
| Web Inspector | Debug builds only (`#if DEBUG`). Gate enforces. |
| Secrets in the repo | None found (AWS, Google, GitHub, Slack and Stripe key formats; PEM private keys; service-account JSON). Gate enforces on every run. Signing is Xcode's automatic signing on Omari's Mac; no certificates or `.p8` keys are in the repo. |
| Native bridge input | Swift checks each message's type before using it. Leaderboard ids and the IAP product id are fixed in Swift, not taken from the page, and IAP actions are limited to load, refresh, buy and restore. Scores are reported by the device, as in any offline game, so leaderboards can be faked by a modified client. If that matters, set score limits per leaderboard in App Store Connect. |
| Bundle file serving | `BundleSchemeHandler` rejects `..` and resolves names only through `Bundle.main`, so the page can't read files outside the app bundle. |
| Content-process crash | Reloads the game automatically; progress is in `localStorage`. |

## 6. Accounts, deletion and retention

No accounts exist, so Apple's in-app account deletion rule (5.1.1(v)) doesn't apply. Journal data can be deleted in the app. Everything else is removed by deleting the app. Nothing is retained anywhere else by the developer.

## 7. Encryption and export compliance

`ITSAppUsesNonExemptEncryption = NO`. Crossfall contains no cryptography of its own; the only encryption is Apple's HTTPS inside Game Center and StoreKit, which is exempt. No export documentation is needed. If a future version adds its own encryption or a non-Apple HTTPS service, re-answer the export questions.

## 8. Children

Crossfall doesn't target children, isn't in the Kids category, and collects no personal data from anyone. Guideline 1.3 doesn't apply.

## 9. Open items

1. **Device test** of the Privacy link opening Safari and of crash recovery (can't be automated in CI).
2. **Support contact**: GitHub issues only. A dedicated support email would be friendlier; don't publish a personal address.
3. Keep `PRIVACY.md`, `PrivacyInfo.xcprivacy` and the App Store Connect label in sync. The gate checks the first two; the third is a manual step on the release checklist.
