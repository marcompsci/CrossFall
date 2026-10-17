#!/usr/bin/env python3
"""Crossfall release gate. Run before every TestFlight upload:  python3 scripts/release_gate.py [--smoke]

Static checks that run anywhere (no Mac needed). Each line prints PASS, FAIL, WARN or SKIP.
A SKIP is never counted as a pass: the summary lists what still needs checking by hand.
Exit code 1 if anything FAILs.

What it does NOT do: build or sign the app (that needs Xcode on macOS; the GitHub workflow
runs a simulator build), or check anything inside App Store Connect.
"""
import json, plistlib, re, shutil, subprocess, sys, tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PBX = (ROOT / "Crossfall.xcodeproj" / "project.pbxproj").read_text(encoding="utf-8")
SWIFT = "\n".join(p.read_text(encoding="utf-8") for p in ROOT.rglob("*.swift"))
INDEX = (ROOT / "Crossfall" / "index.html").read_text(encoding="utf-8")
WEB = (ROOT / "web" / "crossfall.html").read_text(encoding="utf-8")
LAST_UPLOADED = ROOT / "docs" / "app-store" / "last-uploaded-build.txt"
out = []

def res(status, name, detail=""):
    out.append((status, name, detail)); print(f"{status:<5} {name}{('  · ' + detail) if detail else ''}")

def setting(key):
    return sorted(set(re.findall(rf"\b{key} = ([^;]+);", PBX)))

# 1. Bundled page is current and parses
tmp = Path(tempfile.mkdtemp())
try:
    shutil.copytree(ROOT / "scripts", tmp / "scripts"); shutil.copytree(ROOT / "web", tmp / "web"); (tmp / "Crossfall").mkdir()
    subprocess.run([sys.executable, str(tmp / "scripts" / "build_index.py")], check=True, capture_output=True)
    fresh = (tmp / "Crossfall" / "index.html").read_text(encoding="utf-8")
    res("PASS" if fresh == INDEX else "FAIL", "Crossfall/index.html is built from web/crossfall.html",
        "" if fresh == INDEX else "run: python3 scripts/build_index.py")
finally:
    shutil.rmtree(tmp, ignore_errors=True)

m = re.search(r'<script>\n"use strict"(.*?)</script>', INDEX, re.S)
if not m: res("FAIL", "main game script found")
elif shutil.which("node"):
    js = Path(tempfile.mktemp(suffix=".js")); js.write_text('"use strict"' + m.group(1), encoding="utf-8")
    r = subprocess.run(["node", "--check", str(js)], capture_output=True, text=True); js.unlink()
    res("PASS" if r.returncode == 0 else "FAIL", "game JavaScript parses", (r.stderr.strip().splitlines() or [""])[-1][:160])
else: res("SKIP", "game JavaScript parses", "node not installed")

# 2. No network calls from the app's own UI (2.5.2 no remote code; privacy label accuracy)
urls = set(re.findall(r'(?:src|href)\s*=\s*["\']?(https?://[^"\'\s>]+)', INDEX)) | set(re.findall(r"url\((https?://[^)]+)\)", INDEX))
allowed = ("https://github.com/marcompsci/CrossFall/",)
bad = sorted(u for u in urls if not u.startswith(allowed))
res("PASS" if not bad else "FAIL", "no remote scripts, styles or fonts in the app bundle", ", ".join(bad[:4]))
scripts = re.findall(r"<script[^>]+src=", INDEX)
res("PASS" if not scripts else "FAIL", "no external <script src> (all code is bundled)")
for f in re.findall(r"url\(([a-z0-9-]+\.woff2)\)", INDEX):
    ok = (ROOT / "Crossfall" / "Fonts" / f).exists() and f in PBX
    res("PASS" if ok else "FAIL", f"bundled font {f} exists and is in the Xcode project")

# 3. Privacy manifests (required-reason APIs) for every binary
for target, path, reasons in (("app", "Crossfall/PrivacyInfo.xcprivacy", {"CA92.1", "1C8F.1"}),
                              ("widget", "CrossfallWidget/PrivacyInfo.xcprivacy", {"1C8F.1"})):
    p = ROOT / path
    if not p.exists(): res("FAIL", f"{target} privacy manifest exists", path); continue
    try: d = plistlib.loads(p.read_bytes())
    except Exception as e: res("FAIL", f"{target} privacy manifest parses", str(e)); continue
    got = {r for a in d.get("NSPrivacyAccessedAPITypes", []) if a.get("NSPrivacyAccessedAPIType") == "NSPrivacyAccessedAPICategoryUserDefaults"
           for r in a.get("NSPrivacyAccessedAPITypeReasons", [])}
    res("PASS" if reasons <= got and d.get("NSPrivacyTracking") is False else "FAIL",
        f"{target} manifest declares UserDefaults {sorted(reasons)} and no tracking", f"found {sorted(got)}")
res("PASS" if PBX.count("PrivacyInfo.xcprivacy in Resources */,") == 2 else "FAIL", "both privacy manifests are in a Copy Resources phase")
apis = {"UserDefaults": "NSPrivacyAccessedAPICategoryUserDefaults", "creationDate": "NSPrivacyAccessedAPICategoryFileTimestamp",
        "modificationDate": "NSPrivacyAccessedAPICategoryFileTimestamp", "systemUptime": "NSPrivacyAccessedAPICategorySystemBootTime",
        "mach_absolute_time": "NSPrivacyAccessedAPICategorySystemBootTime", "volumeAvailableCapacity": "NSPrivacyAccessedAPICategoryDiskSpace",
        "activeInputModes": "NSPrivacyAccessedAPICategoryActiveKeyboards"}
manif = (ROOT / "Crossfall/PrivacyInfo.xcprivacy").read_text() + (ROOT / "CrossfallWidget/PrivacyInfo.xcprivacy").read_text() if (ROOT / "Crossfall/PrivacyInfo.xcprivacy").exists() else ""
missing = sorted({cat for sym, cat in apis.items() if re.search(rf"\b{sym}\b", SWIFT) and cat not in manif})
res("PASS" if not missing else "FAIL", "every required-reason API used in Swift is declared", ", ".join(missing))

# 4. Permission purpose strings match the frameworks used
needs = [(r"requestWhenInUseAuthorization", "NSLocationWhenInUseUsageDescription"),
         (r"loadFriends", "NSGKFriendListUsageDescription"),
         (r"AVCaptureDevice|UIImagePickerController", "NSCameraUsageDescription"),
         (r"PHPhotoLibrary", "NSPhotoLibraryUsageDescription"),
         (r"requestRecordPermission|AVAudioRecorder", "NSMicrophoneUsageDescription"),
         (r"ATTrackingManager", "NSUserTrackingUsageDescription"),
         (r"CNContactStore", "NSContactsUsageDescription")]
for pat, key in needs:
    if re.search(pat, SWIFT):
        vals = re.findall(rf'INFOPLIST_KEY_{key} = "([^"]+)"', PBX)
        res("PASS" if len(vals) >= 2 and all(len(v) > 25 for v in vals) else "FAIL", f"{key} set for Debug and Release")
if "CLLocationManager" in SWIFT:
    res("PASS" if "kCLLocationAccuracyReduced" in SWIFT else "FAIL", "location is requested at reduced (approximate) accuracy")
res("PASS" if "ATTrackingManager" not in SWIFT and "AdSupport" not in SWIFT else "FAIL", "no tracking / IDFA APIs")
res("PASS" if setting("INFOPLIST_KEY_ITSAppUsesNonExemptEncryption") == ["NO"] else "WARN",
    "export compliance declared (ITSAppUsesNonExemptEncryption = NO; app uses only Apple's HTTPS)")

# 5. Versions, build number, signing basics
mv, cv = setting("MARKETING_VERSION"), setting("CURRENT_PROJECT_VERSION")
res("PASS" if len(mv) == 1 and len(cv) == 1 else "FAIL", "one version and build number across the app and widget", f"version {mv}, build {cv}")
if LAST_UPLOADED.exists() and len(cv) == 1 and cv[0].isdigit():
    last = int(LAST_UPLOADED.read_text().split()[0])
    res("PASS" if int(cv[0]) > last else "FAIL", "build number is higher than the last upload", f"{cv[0]} vs last uploaded {last}")
else: res("SKIP", "build number is higher than the last upload", "docs/app-store/last-uploaded-build.txt missing")
ids = setting("PRODUCT_BUNDLE_IDENTIFIER")
res("PASS" if ids == ["com.phoronomicstudios.crossfall", "com.phoronomicstudios.crossfall.widget"] else "FAIL", "bundle identifiers", ", ".join(ids))
res("PASS" if len(setting("DEVELOPMENT_TEAM")) == 1 else "FAIL", "one development team for every target", ", ".join(setting("DEVELOPMENT_TEAM")))
ent_a = plistlib.loads((ROOT / "Crossfall/Crossfall.entitlements").read_bytes())
ent_w = plistlib.loads((ROOT / "CrossfallWidget/CrossfallWidget.entitlements").read_bytes())
g = "com.apple.security.application-groups"
res("PASS" if ent_a.get(g) == ent_w.get(g) and ent_a.get(g) else "FAIL", "app and widget share the same app group")
res("PASS" if ent_a.get("com.apple.developer.game-center") else "FAIL", "Game Center entitlement")
icon = ROOT / "Crossfall/Assets.xcassets/AppIcon.appiconset/AppIcon-1024.png"
res("PASS" if icon.exists() and icon.read_bytes()[16:24] == (1024).to_bytes(4, "big") * 2 else "FAIL", "1024×1024 app icon present")

# 6. Release hygiene in the native code
insp = [l for l in SWIFT.splitlines() if "isInspectable = true" in l]
guarded = re.search(r"#if DEBUG\n(?:(?!#endif).)*isInspectable = true(?:(?!#endif).)*\n\s*#endif", SWIFT, re.S)
res("PASS" if not insp or guarded else "FAIL", "Web Inspector only in Debug builds")
res("PASS" if "webViewWebContentProcessDidTerminate" in SWIFT else "FAIL", "web view recovers if iOS ends its content process")
res("PASS" if "decidePolicyFor" in SWIFT else "FAIL", "outside links open in Safari, not inside the game")
res("PASS" if "AppStore.sync" in SWIFT and "currentEntitlements" in SWIFT and "revocationDate" in SWIFT else "FAIL",
    "IAP: restore, entitlement check and refunds handled (StoreKit 2)")
res("PASS" if ".pending" in SWIFT and ".userCancelled" in SWIFT else "FAIL", "IAP: pending and cancelled purchases handled")

# 7. Privacy policy matches what the app does
pol = (ROOT / "docs/app-store/PRIVACY.md").read_text(encoding="utf-8")
topics = {"location": r"[Ll]ocation", "Game Center": r"Game Center", "journal": r"[Jj]ournal", "notifications": r"[Nn]otification",
          "purchases": r"[Pp]urchase", "tracking statement": r"tracking", "contact": r"## Contact"}
miss = [k for k, rx in topics.items() if not re.search(rx, pol)]
res("PASS" if not miss else "FAIL", "privacy policy covers location, Game Center, journal, notifications, purchases, contact", ", ".join(miss))
res("PASS" if "PRIVACY.md" in INDEX and "SUPPORT.md" in INDEX else "FAIL", "privacy policy and support are linked inside the app")

# 8. Secrets
pat = re.compile(r"(AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----|sk_live_[0-9a-zA-Z]{20,}|AIza[0-9A-Za-z_-]{35}|ghp_[0-9A-Za-z]{36}|xox[baprs]-[0-9A-Za-z-]{10,}|\"private_key\"\s*:)")
hits = []
for p in ROOT.rglob("*"):
    if ".git" in p.parts or not p.is_file() or p.suffix in (".png", ".mp4", ".woff2", ".jpg"): continue
    try: t = p.read_text(encoding="utf-8")
    except Exception: continue
    if pat.search(t): hits.append(str(p.relative_to(ROOT)))
res("PASS" if not hits else "FAIL", "no API keys, tokens or private keys committed", ", ".join(hits[:5]))

# 9. Optional headless smoke test
if "--smoke" in sys.argv:
    r = subprocess.run([sys.executable, str(ROOT / "scripts" / "smoke_test.py")], capture_output=True, text=True)
    for line in r.stdout.strip().splitlines(): print("      " + line)
    res("PASS" if r.returncode == 0 else "FAIL", "headless smoke test (cold start, full game, every menu, no network, no JS errors)",
        "" if r.returncode == 0 else (r.stderr.strip().splitlines() or ["see output"])[-1][:160])
else: res("SKIP", "headless smoke test", "run with --smoke (needs playwright)")

# Things only a person can check
manual = ["Xcode Release archive and upload (macOS) — the GitHub workflow builds for the simulator only",
          "App Store Connect: agreements accepted (TestFlight beta review is blocked without them)",
          "App Store Connect: App Privacy answers still match PrivacyInfo.xcprivacy",
          "App Store Connect: age rating questionnaire (wellness topics, contests) and What's New / review notes current",
          "A 30-minute play-test on a real iPhone and iPad from the TestFlight build"]
fails = [o for o in out if o[0] == "FAIL"]; skips = [o for o in out if o[0] == "SKIP"]
print(f"\n{len(out)} checks: {sum(o[0]=='PASS' for o in out)} pass, {len(fails)} fail, {sum(o[0]=='WARN' for o in out)} warn, {len(skips)} skipped")
print("Still to check by hand:\n  - " + "\n  - ".join(manual))
print("RESULT:", "FAIL" if fails else "CONDITIONAL (automated gates pass; manual checks above remain)")
sys.exit(1 if fails else 0)
