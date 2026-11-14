# Crossfall — TestFlight release checklist

Run this **before every TestFlight upload**. A step is done only once it has actually passed. "Skipped" or "didn't run" is not a pass.

## A. Automated gate (any computer)

```sh
python3 scripts/build_index.py          # rebuild Crossfall/index.html from web/crossfall.html
python3 scripts/release_gate.py --smoke # 44 checks; must end "RESULT: CONDITIONAL" with 0 fail, 0 skipped
npm install --no-save axe-core@4.10.2   # once, for the accessibility scan
bash tests/run_all.sh                   # feature regressions + accessibility; must end "ALL TESTS PASS"
```

What the gate covers: bundled page up to date and parses · no remote scripts/fonts · fonts bundled and in the Xcode project · both privacy manifests present, valid, with the right required-reason codes and in Copy Resources · every required-reason API used in Swift declared · purpose strings for every permission used · approximate location · no tracking APIs · export compliance key · one version/build across targets · **build number above the last upload** · bundle ids, team, app group, Game Center entitlement · 1024 icon · Web Inspector Debug-only · web-process crash recovery · links open in Safari · StoreKit restore/entitlements/refunds/pending/cancel · privacy policy covers each data topic · privacy and support linked in the app · secrets scan · headless smoke test (cold start, onboarding, full game, all menu screens, no network, no JS errors, **no HTML injection from shared codes or Game Center names**) · every Swift file compiled · App Intents hidden from Shortcuts · widget makes no network calls · Quick Daily gated to iOS 17 · Pro is the only purchase · review notes and What's New under 4,000 characters · live or upcoming seasonal events named in the review notes.

`tests/run_all.sh` adds the feature suites (t8–t11n), the Quick Daily logic simulation (1,500 days) and an axe-core WCAG 2 A/AA scan of 37 screens in light and dark.

- [ ] Gate result: 0 FAIL, 0 SKIP
- [ ] `tests/run_all.sh`: ALL TESTS PASS (a SKIP from a missing axe-core is not a pass)

## B. GitHub Actions (on push)

Workflow **Release gate** (`.github/workflows/release-gate.yml`):

| Job | Runs on | Checks |
| --- | --- | --- |
| Static checks + headless smoke test | ubuntu-latest | The full gate with `--smoke`, then `tests/run_all.sh` |
| Xcode build (iOS Simulator, unsigned) | macos-15 | `plutil -lint` on manifests, entitlements and widget plist; **Release** build of app + widget with `xcodebuild`; then checks the built `.app` contains both privacy manifests, `index.html`, the 5 fonts at the paths the page uses, and the Info.plist keys |

- [ ] Both jobs green on the commit being uploaded (`gh run list -R marcompsci/CrossFall`). A cancelled or skipped job is **not** green.

The CI build is unsigned and for the simulator. It proves the project compiles and bundles correctly, but not that signing or the App Store archive works. That's step C.

## C. Mac (Xcode) — only when Omari asks

1. GitHub Desktop: View › Show Repository List › CrossFall › **Fetch origin**, then **Pull**.
2. Xcode: scheme **Crossfall**, destination **Any iOS Device (arm64)**.
3. Check Signing & Capabilities for both targets: team set, App Groups `group.com.phoronomicstudios.crossfall` ticked, Game Center on the app.
4. **Product › Archive** (Release configuration).
5. Organizer › **Validate App**: must pass with no errors. Note any warnings.
6. Organizer › Distribute App › App Store Connect › **Upload**. _Only with Omari's explicit go-ahead._
7. After the upload: write the new build number into `docs/app-store/last-uploaded-build.txt` and commit.

- [ ] Archive succeeded · [ ] Validate passed · [ ] Upload authorized and done · [ ] last-uploaded-build.txt updated

## D. Real-device play-test (30 minutes, TestFlight build)

- [ ] Fresh install: onboarding → tour → first puzzle
- [ ] A full puzzle in three categories; a rush in each mode (tap, unscramble, clue)
- [ ] Daily, Mini, Chunks, Ladder
- [ ] Word Trail stops 1–2, power-ups, Fever
- [ ] Sports intro › Use my current location: prompt says "approximate"; deny works too
- [ ] Rankings signed in and signed out of Game Center; Friends permission
- [ ] Daily reminder: permission prompt and a notification arrives
- [ ] Widget shows streak after a game
- [ ] iOS 17+: add **Quick Daily** (large), finish the crossword by tapping, then move and drop pieces until the rows clear; it shows done and the score. Check it again the next day (new puzzle)
- [ ] Go Pro → buy (sandbox/TestFlight, not charged) → unlocks; delete and reinstall → **Restore purchase** re-unlocks
- [ ] Settings › Privacy policy opens **Safari** (not inside the game); same for Help & support
- [ ] Background the app for 10+ minutes while playing, return: game is there, no white screen
- [ ] iPad: portrait, landscape and Split View
- [ ] Bigger text / iOS large text, VoiceOver on the home screen
- [ ] Airplane mode: everything except Game Center works

## E. App Store Connect (manual)

- [ ] **Business › Agreements**: no pending agreement (external TestFlight review can't start otherwise)
- [ ] **App Privacy**: still "Coarse Location · App Functionality · not linked · no tracking", matching `PrivacyInfo.xcprivacy`
- [ ] **Age rating** questionnaire answered with the current questions: Health or Wellness Topics **Yes**, Contests **Frequent**, everything else None
- [ ] **TestFlight › Test Information**: Beta App Description, feedback email, privacy policy URL, review contact (from `docs/app-review-notes.md`)
- [ ] **What to Test** for this build (from `docs/app-review-notes.md` §2)
- [ ] Build's export compliance shows "No" automatically (from `ITSAppUsesNonExemptEncryption`)
- [ ] For an App Store version: What's New, review notes, screenshots, and the Pro purchase attached

## F. Flag new compliance risks

Before uploading, look at what changed since the last build (`git log <last-uploaded-commit>..HEAD`). Stop and update the docs and labels if anything:

- sends data off the device, or adds an SDK, analytics or crash reporting → App Privacy label, manifest, `PRIVACY.md`, and Omari's approval
- adds a permission → purpose string, policy, review notes
- adds a purchase, subscription, currency or a "buy" link → guideline 3.1 review
- adds chat, profiles or anything players post for others → guideline 1.2 needs reporting, blocking and moderation
- adds a login → 4.8 (Sign in with Apple) and 5.1.1(v) (account deletion)
- adds time-limited or seasonal content → mention it in the review notes with its dates
- downloads code or content at runtime → 2.5.2

## Last run

| Date | Commit | Gate (local) | CI static | CI Xcode build | Notes |
| --- | --- | --- | --- | --- | --- |
| 16 Oct 2026 | e624655 | 34/34 pass | pass ([run 38999835242](https://github.com/marcompsci/CrossFall/actions/runs/38999835242)) | pass: Release simulator build; both manifests, 5 fonts, `index.html`, build 17 / 1.1 in the bundle | Sections C–E not done yet. Build 17 **not uploaded** (needs Omari's OK) |
| 28 Oct 2026 | 756b6fc | 34/34 pass (smoke test opens 31 menu destinations) | pass ([run 40813159057](https://github.com/marcompsci/CrossFall/actions/runs/40813159057)) | pass: Release simulator build, bundle checks, build 17 / 1.1 | New: Cipher, Rush Gym, Rewind, Harvest Season (3–30 Nov, hidden otherwise), mastery, ratings (on device), records, monthly recap, first-run home. Still build 17, **not uploaded** |
| 1 Nov 2026 | phases 28–37 | 34/34 pass (smoke test opens 34 menu destinations) | see CI | see CI | New: customize home, first-time tips, second chance (5 sparks), CPU rivals, your-best ghost, Rival Cup, loved puzzles, report a clue (opens GitHub issue), My games, 4 medal tracks. Fixed: power-up buttons drew above every sheet. Still build 17, **not uploaded** |
| 1 Nov 2026 | phases 38–47 + Quick Daily widget | 34/34 pass (36 menu destinations) | see CI | see CI | Quick Daily widget (iOS 17, large) in `CrossfallWidget/QuickDaily.swift`; logic simulated over 1,500 days. **Device check needed:** add the widget and play it (interactive widgets can't be tested in CI). Still build 17, not uploaded |
| 12 Nov 2026 | 6d52216 | 44/44 pass (36 menu destinations; injection check now covers Mini codes and Game Center names) | pass, incl. `tests/run_all.sh` ([run 43322899727](https://github.com/marcompsci/CrossFall/actions/runs/43322899727)) | pass on re-run (first attempt never got a macOS runner and was cancelled; not counted): Release simulator build, widget embedded, both manifests, 5 fonts, build 17 / 1.1 | Compliance re-audit of phases 18–47 + Quick Daily: no blockers. Fixed: Snow Days missing from review notes, Game Center name hygiene, 4 accessibility issues. Tests moved into the repo and CI. Still build 17, **not uploaded** |
| 12 Nov 2026 | d1afc4a | — | — | — | **Build 17 uploaded** (Ship script, build number 17) and **submitted for external TestFlight review** to the Public Beta group with What to Test and review notes. Status: Waiting for Review |
| 12 Nov 2026 | 819ce0a | — | — | — | **App Store review:** Omari chose to skip releasing the approved 1.0 (release cancelled → Developer Rejected), renamed that version to 1.1, attached build 17, updated description/keywords/promo text and review notes, kept the approved 1.0 screenshots (the 1.1 sets couldn't be uploaded from this session), manual release. Submitted 19:35, **Waiting for Review** |
| 13 Nov 2026 | phases 48–57 | 43/43 pass (smoke test opens 38 menu destinations) | see CI | see CI | New: all-clues list, pencil letters, word recap + Study later, daily goal, Quick Daily in the app (same puzzle as the widget, checked on 134 days), category spotlight, Bigger text in-game, Export my data, Up next, word book search. Build number now **18** (17 is in App Store review). Not uploaded |
