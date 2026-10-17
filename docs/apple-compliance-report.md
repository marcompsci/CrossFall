# Crossfall — Apple App Review compliance report

_Audit date: 16 October 2026 · Version 1.1, build 17 · Commit after bf4d28d_

This report checks Crossfall against the App Review Guidelines and Apple's developer requirements as I understand them on the audit date. Apple's reviewers make the final decision, and nothing here guarantees approval of either TestFlight or the App Store.

## 1. What the app is

| Layer | What's actually in the repo |
| --- | --- |
| Native shell | SwiftUI app (`Crossfall/CrossfallApp.swift`) hosting one `WKWebView`. iOS 16.0+, iPhone and iPad (`TARGETED_DEVICE_FAMILY = 1,2`). |
| Game | One bundled HTML/JS file (`web/crossfall.html` → `Crossfall/index.html` via `scripts/build_index.py`), served from the app bundle by `BundleSchemeHandler` at `crossfall://app/`. |
| Native bridges | `theme`, `gc` (Game Center), `share`, `haptic`, `iap` (StoreKit 2), `notify` (local notifications), `status`, `say` (AVSpeechSynthesizer), `locate` (CoreLocation, one shot). |
| Widget | `CrossfallWidget` (WidgetKit), reads a small snapshot from app group `group.com.phoronomicstudios.crossfall`. |
| Purchases | One non-consumable, `com.phoronomicstudios.crossfall.pro` ($4.99). |
| Backend | **None.** No accounts, no server, no database, no analytics, no third-party SDKs, no Swift packages or CocoaPods. |
| Storage | `localStorage` inside the web view, plus `UserDefaults` (app group) for the widget. |
| CI | `.github/workflows/release-gate.yml` (new): Linux static gate + smoke test; macOS unsigned Release simulator build. |

Because there is no backend, no login and no messaging, guidelines 4.7, 4.8 and 5.4 don't apply, and Supabase/Firebase rules, token storage and server-side authorization have nothing to check.

## 2. Findings

Severity: **BLOCKER** stops TestFlight external review or the App Store, **HIGH** is a likely rejection, **MEDIUM** is a possible rejection or user harm, **LOW** is hygiene.

| # | Guideline / requirement | Where | Sev. | Problem | Fix | Done? | How verified |
|---|---|---|---|---|---|---|---|
| 1 | 5.1.1, privacy manifests (required-reason APIs; ITMS-91053) | `Crossfall/`, `CrossfallWidget/` | HIGH | No `PrivacyInfo.xcprivacy` in the app or widget, but both use `UserDefaults`. | Added both manifests: UserDefaults CA92.1 + 1C8F.1 (app), 1C8F.1 (widget); coarse location declared (not linked, no tracking); `NSPrivacyTracking` false. Added to both Copy Resources phases. | Yes | `release_gate.py` parses both and checks the reasons and the Resources phase; CI `plutil -lint` and checks they are inside the built `.app`/`.appex`. |
| 2 | 5.1.1(i), privacy policy accuracy; 5.1.2 | `docs/app-store/PRIVACY.md` | HIGH | Policy said "no data collected" and didn't mention location, journal, Game Center friends, widget or speech. That contradicts the App Privacy label (Coarse Location) published 15 Oct. | Rewrote the policy to match the code (data stays on device, one-shot approximate location matched to a built-in city list, Game Center, purchases, notifications, widget, journal delete-all, backup-code warning). | Yes | Read against the code paths (`spLocate`, `JR`/`QS`, `gc`, `iap`, `notify`); gate checks the topics are present. |
| 3 | 5.1.1(i), privacy policy reachable inside the app | `web/crossfall.html` Settings + drawer | HIGH | No privacy policy or support link anywhere in the app. | Added **Privacy policy** and **Help & support** to Settings and the ☰ drawer; links open in Safari. | Yes | `smoke_test.py` finds both links; gate checks both URLs are in the bundle. |
| 4 | 2.1 completeness / stability | `CrossfallApp.swift` | HIGH | If iOS killed the web content process (memory pressure in the background), the app showed a blank white screen until force-quit. | `webViewWebContentProcessDidTerminate` reloads `crossfall://app/index.html` (progress is in `localStorage`, so nothing is lost). | Yes | Code review + gate check. **Needs a device test** (kill via memory pressure isn't reproducible in CI). |
| 5 | 2.1 / 2.5.2 (no navigation to remote content in the shell) | `CrossfallApp.swift` | MEDIUM | No navigation delegate: a tapped `https:` link would load a web page *inside* the game with no way back. | `decidePolicyFor` allows only `crossfall:`, `about:`, `data:`, `blob:`; `https`/`http`/`mailto` open in Safari; `createWebViewWith` returns nil. | Yes | Code review; gate check. Needs a device tap test of the Privacy link. |
| 6 | 5.1.1 / privacy label accuracy | `web/crossfall.html`, `build_index.py` | MEDIUM | The app loaded Google Fonts from `fonts.googleapis.com` on every launch, which sends the IP address to Google and isn't in the privacy label. Also failed offline. | Bundled the five font files (SIL OFL 1.1, licence in `Crossfall/Fonts/OFL.txt`); the build script strips the Google links and asserts it did. The app now makes **no network requests of its own**. | Yes | `smoke_test.py` blocks and records every http(s) request: zero. Gate checks no remote `src/href/url()`. |
| 7 | 2.5.2 / security hygiene | `CrossfallApp.swift` | LOW | `isInspectable = true` in Release builds lets anyone attach Safari Web Inspector. | Wrapped in `#if DEBUG`. | Yes | Gate checks it; negative test (guard removed) fails as expected. |
| 8 | 5.1.1(iii) data minimization | `CrossfallApp.swift` location manager | — (pass) | Only a city is needed. | Already compliant: `desiredAccuracy = kCLLocationAccuracyReduced` gives approximate location only. (An extra `NSLocationDefaultAccuracyReduced` build setting I added was ignored by Xcode, as the CI bundle check showed, so it was removed.) | Already compliant | Gate checks the Swift setting. |
| 9 | 1.4.1 / age rating (wellness) | Check-in, reflection, journal | MEDIUM | Mood check-in and journal could read as wellness advice. | Added an in-app note ("a game, not therapy" + 988) to the journal, a **Delete all** button, and the same note in the policy. No health claims anywhere. Age rating must keep "Health or Wellness Topics: Yes". | Code: yes. Rating: **manual** | `t4.py` (journal + backup), smoke test; age rating checked by hand in App Store Connect. |
| 10 | 2.3.1 / 2.3.12 accurate metadata | `WHATS-NEW-1.1.md`, review notes | MEDIUM | What's New and review notes describe build 16 only; build 17 adds Word Trail, Ladder, power-ups, Fever, achievements, insights, Word of the day, journal, Pass & Play, Marathon and a time-limited Spooky Season (15 Oct–2 Nov). | New text in `docs/app-review-notes.md` and `WHATS-NEW-1.1.md`. The Spooky Season wording says it is seasonal, so the reviewer isn't surprised if it's gone. | Yes (docs) | Read-through. Paste into App Store Connect is **manual**. |
| 11 | 5.1 / 1.2 — safe handling of shared content (HTML injection) | `web/crossfall.html`: `renderRush` clue prompt, `parseWordList`, `buildCustom` | **HIGH** | **Found and fixed in this audit.** A crafted puzzle code (`CF1.…`) with HTML in a clue ran script when that clue came up in a rush. Script in the web view could read the journal from `localStorage`, call the native bridges, or `fetch()` it out. Challenge nicknames were already safe (whitelisted characters). | Clue and title text from shared codes is stripped of `<` `>` on import (`parseWordList`, `buildCustom`) and the rush prompt now uses `esc()`. | Yes | New smoke-test check plays a code with `<img onerror>` in the title, clues and nickname. It **fails on the old code** and passes on the fix. |
| 11b | 1.2 user-generated content | Puzzle maker codes, challenge nicknames | LOW | Players can share codes holding custom word lists and a nickname. There's no server, feed, chat or profile: content only appears after the recipient pastes a code themselves, like a message from a friend. | No moderation backend exists and none is claimed; this sharing model doesn't need one. Described in the review notes. | N/A | Code review of `readCustomCode`, `readChalCode`, `readMiniCode`. |
| 11c | 2.1 completeness (no dead ends) | `openDrawer`, `openSpooky` | MEDIUM | **Found in this audit.** After 2 Nov the Spooky Season menu item stayed visible and opened a "0 days left" screen whose puzzles refused to start. A reviewer seeing it in November would hit a dead end. | The menu item is hidden outside 15 Oct–2 Nov (the home tile already was). | Yes | Clock-faked test on 20 Oct, 3 Nov and 5 Jan: shown, hidden, hidden; no errors. |
| 12 | 3.1.1 in-app purchase | `CrossfallApp.swift` (`iap`) | — (pass) | Digital unlock must use IAP, with restore. | StoreKit 2 `Product.purchase()`, `.pending` and `.userCancelled` handled, `Transaction.currentEntitlements` at launch, `revocationDate` re-locks refunded purchases, **Restore purchase** calls `AppStore.sync()`. No external purchase links. | Already compliant | Gate checks; smoke test finds Restore. Sandbox purchase/refund test is **manual**. |
| 13 | 3.1.2 subscriptions | — | — | No subscriptions. | — | N/A | — |
| 14 | 5.1.1(v) account deletion | — | — | No accounts, so no deletion requirement. Players can still delete the journal and all data (delete the app). | — | N/A | — |
| 15 | 4.8 login services | — | — | No login. Game Center is optional. | — | N/A | — |
| 16 | 4.2 minimum functionality | Whole app | LOW | Web-view apps can be rejected as "repackaged websites". | Mitigated: all content is bundled and works offline, plus native Game Center, StoreKit, a widget, local notifications, haptics and speech. 700+ puzzles. | N/A | Smoke test offline (all network blocked) plays a full game. |
| 17 | 2.5.2 no downloaded code | Whole app | — (pass) | — | No `eval` of remote content, no remote scripts (gate checks). | Already compliant | Gate. |
| 18 | 5.2 intellectual property | Fonts, art, music, word lists | LOW | Fonts were remote; now bundled under OFL with the licence. Icons are original letter tiles, music is original. Sports "hometown legends" names real athletes in trivia clues only (factual, no likeness, no endorsement implied). | Licence file added. | Yes | `Crossfall/Fonts/OFL.txt`. |
| 19 | Export compliance | pbxproj | — (pass) | `ITSAppUsesNonExemptEncryption = NO` is correct: only Apple's own HTTPS (StoreKit/Game Center), no custom crypto. | — | Already compliant | Gate; CI prints the built key. |
| 20 | 2.2 beta testing / TestFlight agreements | App Store Connect | **Verify** | External TestFlight review can't start unless the current agreements are accepted in App Store Connect › Business. Earlier in the session this looked outstanding; I can't see App Store Connect from here. | Omari: open **Business** and accept any pending agreement. | **Manual** | Not verifiable from the repo. |
| 21 | 2.1 — support contact | `SUPPORT.md` | LOW | Support is GitHub issues only. Acceptable, but many players don't have GitHub. | Recommend a dedicated support email (not a personal address) on the support page and the TestFlight feedback field. | No (owner decision) | — |
| 22 | Build numbering | `Ship to TestFlight.command` | LOW | The Mac script uses date-based build numbers; the project uses 16 → 17. Mixing them could produce a build lower than one already uploaded. | Gate now checks the build is above `docs/app-store/last-uploaded-build.txt`. Use Xcode (or update the script) consistently. | Partly | Gate. |

## 3. Functionality and crash checks (Phase 3)

| Area | Result | How |
| --- | --- | --- |
| Cold start, empty storage | PASS | `smoke_test.py` |
| First-run onboarding / tour | PASS | `smoke_test.py` |
| Full puzzle start → finish, result screen | PASS | `smoke_test.py` |
| All 27 menu destinations open without JS errors | PASS | `smoke_test.py` |
| Offline (every network request blocked) | PASS | `smoke_test.py` |
| Daily puzzles unchanged after edits | PASS | `t7b.py` signature vs. `old_cf.html` |
| Phase 4–17 feature regressions | PASS | `t4`–`t7`, `t4b`–`t7b` |
| Accessibility (axe-core) on main screens | PASS (one transient mid-animation reading, clean once settled) | `t6b`/`t7b` |
| Web-process crash recovery | Code added; **device test needed** | — |
| Background/foreground, rotation, iPad split view | **Device test needed** | Checklist |
| Sign-in / account creation / deletion | N/A (no accounts) | — |
| Deep / universal links | N/A (none registered) | pbxproj, entitlements |
| Game Center signed out | Handled ("Not signed in" message) | Code review; device test in checklist |

## 4. What couldn't be run here

- **Signed Release archive and upload**: needs Xcode with Omari's signing on the Mac. CI runs an *unsigned* Release simulator build only. See the CI result in `docs/testflight-release-checklist.md`.
- **Real-device tests**: purchase/restore/refund in sandbox, location prompt, notifications, widget, memory pressure.
- **App Store Connect state**: agreements, App Privacy answers, age rating, 1.0 review status.
- **Dependency vulnerability scan**: there are no dependencies (no SPM, CocoaPods or npm in the shipped app), so there's nothing to scan. CI uses Playwright only as a test tool.
- **Unit tests in Xcode**: there's no XCTest target. The game logic lives in JS and is covered by the Playwright suites. Adding an XCTest target would be a project change I haven't made without approval.

## 5. Release-readiness result

**CONDITIONAL.** All 33 automated gates pass locally and the Linux CI job passed. No known code blockers remain. The manual items still open are: confirm the agreements in App Store Connect, the device play-test, the age-rating and App Privacy answers, pasting the new review notes and What's New, and Omari's go-ahead for the build 17 upload. External TestFlight approval is a separate, lighter review than App Store approval; passing one doesn't mean passing the other.
