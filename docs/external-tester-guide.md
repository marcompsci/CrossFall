# Crossfall — external TestFlight guide

Two parts: how Omari sets up external testing in App Store Connect, and what testers do.

> **TestFlight approval isn't App Store approval.** External TestFlight builds get a short **Beta App Review**, usually within a day. It checks that the build works and follows the guidelines well enough to share with up to 10,000 testers. Full **App Store review** happens separately when a version is submitted for sale, and it's stricter (metadata, screenshots, purchases, every guideline). A build can pass beta review and still be rejected from the App Store. Approval of either is never guaranteed.

## Part 1 — Setting up external testing (Omari, App Store Connect)

### Before you start

- An uploaded build that has finished processing (it shows in **TestFlight › iOS Builds**). Uploading happens only on your say-so; see `testflight-release-checklist.md`.
- **Business › Agreements**: all agreements accepted. If any agreement is pending, beta review won't start.
- **TestFlight › Test Information** filled in: Beta App Description, Feedback Email, Privacy Policy URL (`https://github.com/marcompsci/CrossFall/blob/main/docs/app-store/PRIVACY.md`), and Beta App Review contact (name, phone, email). Text is in `app-review-notes.md`. Sign-in required: **No**.

### 1. Internal group (optional, no review)

1. **TestFlight › Internal Testing › ➕**, name it (for example "Team").
2. Add people who are already on your App Store Connect team (Users and Access).
3. Add the build, and turn on **Automatic Distribution** if you want every new build to reach them.

### 2. External group

1. **TestFlight › External Testing › ➕ (Add Group)**, name it (for example "Beta").
2. In the group, **Builds › ➕**, choose the build (1.1 (17) or newer).
3. Paste **What to Test** from `app-review-notes.md` §2.
4. Tap **Submit for Review**. When asked about export compliance, the build already answers "No" (no non-exempt encryption).

### 3. Confirm approval

- The build's status moves from **Waiting for Review** → **In Review** → **Approved** (or **Rejected** with a message in **App Review › Resolution Center**).
- Apple also emails the account holder.
- Later builds of the **same version** often go out without a new full review. A new version number always needs one.

### 4. Public link

1. In the external group, **Public Link › Enable Public Link**.
2. Optional: set a tester limit (for example 500) and, if offered, criteria such as device type or OS version.
3. Copy the link. Crossfall's existing link is `https://testflight.apple.com/join/Ncy29VUy`. Check that it's attached to the external group that has the approved build.
4. Share it however you like. Anyone with the link can join until the limit is reached.

### 5. Verify from an outside Apple Account

Use an Apple Account that's **not** on your App Store Connect team (a friend's phone, or a second account on a spare device):

1. Install **TestFlight** from the App Store.
2. Open the public link on that device and tap **Accept**, then **Install**.
3. Confirm the build number shown in TestFlight is the one you expect, the app opens, and a purchase shows "[Environment: Sandbox]" / isn't charged.
4. Send a test screenshot through **Share Beta Feedback** and check it appears under **TestFlight › Feedback**.

If the link says "This beta isn't accepting any new testers", the limit is reached or the link is off. If it says "not available", the group has no approved build.

## Part 2 — For testers

### Requirements

- iPhone or iPad running **iOS 16 or later** (iPadOS 16+)
- The free **TestFlight** app from the App Store
- An Apple Account (no Crossfall account is needed)

### Install

1. Open the invite link on your iPhone or iPad.
2. Tap **View in TestFlight** (install TestFlight first if asked), then **Accept** and **Install**.
3. Updates appear in TestFlight; turn on **Automatic Updates** to get them automatically.

### Good to know

- **Purchases are free in TestFlight.** "Go Pro" won't charge you, and the unlock may not carry over to the App Store version.
- Your progress stays on your device. TestFlight builds expire after 90 days; install the next one before then.
- Game Center is optional. Sign in through iOS Settings › Game Center to see rankings.
- Location is optional and approximate, used once for the Sports "hometown" feature.
- Spooky Season puzzles are only there from 15 October to 2 November.

### What we'd like you to try

See **What to Test** in the TestFlight app for this build. Most useful: a few full games, the Daily, Word Trail, and anything that felt confusing, slow or broken.

### Sending feedback

- **Screenshot feedback:** take a screenshot in Crossfall, tap the thumbnail, then **Share Beta Feedback**. Add a sentence on what happened.
- **Crash feedback:** if the app crashes, TestFlight asks if you want to send details. Please say yes.
- Or open **TestFlight › Crossfall › Send Beta Feedback**.

Please include your device model and what you were doing. Thank you!
