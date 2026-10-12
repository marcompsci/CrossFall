#!/usr/bin/env bash
# Double-click: builds Crossfall and installs it on the iPhone plugged into this Mac (or on the same Wi-Fi).
# Summary Claude reads: ~/Retro Games/Crossfall/Logs/install.txt
cd "$(dirname "$0")" || exit 1
mkdir -p Logs
exec > >(tee Logs/install.txt) 2>&1
echo "=== $(date '+%Y-%m-%d %H:%M:%S')  Install Crossfall on iPhone"
echo "$(xcodebuild -version 2>/dev/null | head -1)"
TEAM="X6LZQ3FS36"

echo "1/3  Finding your iPhone..."
xcrun devicectl list devices --json-output Logs/devices.json > Logs/devices.log 2>&1
UDID="$(/usr/bin/python3 - <<'PY'
import json
try: d=json.load(open("Logs/devices.json"))
except Exception: d={}
best=None
for dev in d.get("result",{}).get("devices",[]):
    hw=dev.get("hardwareProperties",{}); cp=dev.get("connectionProperties",{})
    if hw.get("platform")!="iOS" or hw.get("reality")=="virtual": continue
    score=(cp.get("tunnelState")=="connected")*2+(cp.get("transportType")=="wired")
    if best is None or score>best[0]: best=(score,hw.get("udid"),dev.get("deviceProperties",{}).get("name"))
print(f"{best[1]}|{best[2]}" if best else "")
PY
)"
if [[ -z "$UDID" ]]; then
  echo "STOPPED: no iPhone found. Plug it in with a cable, unlock it, tap Trust if asked, and make sure Developer Mode is on (Settings > Privacy & Security). Then double-click this again."
  cat Logs/devices.log | tail -5; exit 1
fi
NAME="${UDID#*|}"; UDID="${UDID%%|*}"
echo "     Found: $NAME ($UDID)"

echo "2/3  Building and signing (team $TEAM)..."
rm -rf build
xcodebuild -project Crossfall.xcodeproj -scheme Crossfall -configuration Debug \
  -destination "id=$UDID" -derivedDataPath build -allowProvisioningUpdates \
  DEVELOPMENT_TEAM="$TEAM" CODE_SIGN_STYLE=Automatic build > Logs/xcodebuild.log 2>&1
if [[ $? -ne 0 ]]; then
  echo "FAILED (build). Errors:"; grep -E "error:|requires a provisioning|No Account|No profiles|BUILD FAILED" Logs/xcodebuild.log | sort -u | head -20; exit 1
fi
APP="$(ls -d build/Build/Products/Debug-iphoneos/Crossfall.app 2>/dev/null)"
[[ -z "$APP" ]] && { echo "FAILED: build finished but Crossfall.app is missing."; exit 1; }

echo "3/3  Installing on $NAME and opening it..."
xcrun devicectl device install app --device "$UDID" "$APP" > Logs/install_app.log 2>&1 || {
  echo "FAILED (install):"; tail -15 Logs/install_app.log; exit 1; }
xcrun devicectl device process launch --device "$UDID" com.phoronomicstudios.crossfall > Logs/launch.log 2>&1
if [[ $? -ne 0 ]]; then
  if grep -qiE "untrusted|not been trusted|profile" Logs/launch.log; then
    echo "INSTALLED, but iOS needs you to trust the developer once: on the iPhone open Settings > General > VPN & Device Management, tap your Apple ID, then Trust. Then open Crossfall from the home screen."
  else echo "INSTALLED, but it didn't open automatically. Open Crossfall from the home screen."; tail -5 Logs/launch.log; fi
else
  echo "INSTALLED AND OPENED on $NAME."
fi
echo "=== finished $(date '+%H:%M:%S'). You can close this window."
