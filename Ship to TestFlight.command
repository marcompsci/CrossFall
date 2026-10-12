#!/usr/bin/env bash
# Double-click: archives Crossfall and uploads it to App Store Connect / TestFlight.
# The build number is set from the date and time, so every run uploads a new build.
# Summary Claude reads: Logs/testflight.txt (full logs next to it).
cd "$(dirname "$0")" || exit 1
mkdir -p Logs
exec > >(tee Logs/testflight.txt) 2>&1
TEAM="X6LZQ3FS36"; BUNDLE="com.phoronomicstudios.crossfall"
BUILD="$(date +%y%m%d%H%M)"
VERSION="$(sed -n 's/.*MARKETING_VERSION = \([0-9.]*\);.*/\1/p' Crossfall.xcodeproj/project.pbxproj | head -1)"
ARCHIVE="build/Crossfall.xcarchive"; EXPORT="build/export"
echo "=== $(date '+%Y-%m-%d %H:%M:%S')  Crossfall $VERSION ($BUILD) to TestFlight"
echo "$(xcodebuild -version 2>/dev/null | head -1)"

echo "1/2  Archiving (1-3 minutes)..."
rm -rf "$ARCHIVE"
xcodebuild -project Crossfall.xcodeproj -scheme Crossfall -configuration Release \
  -destination 'generic/platform=iOS' -archivePath "$ARCHIVE" -allowProvisioningUpdates \
  DEVELOPMENT_TEAM="$TEAM" CODE_SIGN_STYLE=Automatic CURRENT_PROJECT_VERSION="$BUILD" archive > Logs/xcodebuild_archive.log 2>&1
if [[ ! -d "$ARCHIVE" ]]; then
  echo "FAILED (archive). Errors:"; grep -E "error:|requires a provisioning|No Account|No profiles" Logs/xcodebuild_archive.log | sort -u | head -15
  echo "If it says \"No Accounts\" or the profile lacks Game Center: the command line can't reach your Xcode account."
  echo "Archive from Xcode instead: open Crossfall.xcodeproj, Product > Archive, then Distribute App > App Store Connect > Distribute."; exit 1
fi

echo "2/2  Uploading to App Store Connect..."
cat > build/ExportOptions.plist <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>method</key><string>app-store-connect</string>
  <key>destination</key><string>upload</string>
  <key>teamID</key><string>$TEAM</string>
  <key>signingStyle</key><string>automatic</string>
  <key>uploadSymbols</key><true/>
  <key>manageAppVersionAndBuildNumber</key><false/>
</dict></plist>
PLIST
rm -rf "$EXPORT"
xcodebuild -exportArchive -archivePath "$ARCHIVE" -exportOptionsPlist build/ExportOptions.plist -exportPath "$EXPORT" \
  -allowProvisioningUpdates > Logs/xcodebuild_export.log 2>&1
if [[ $? -ne 0 ]]; then
  echo "FAILED (upload). Errors:"; grep -iE "error" Logs/xcodebuild_export.log | sort -u | head -12
  if grep -qiE "no suitable application records|Cannot determine the Apple ID|app record|Error Downloading App Information" Logs/xcodebuild_export.log; then
    echo "App Store Connect has no app with bundle ID $BUNDLE yet. Create it (App Store Connect > Apps > + > New App), then double-click this again."
  elif grep -qiE "Failed to Use Accounts" Logs/xcodebuild_export.log; then
    echo "Xcode wouldn't let the command line use your Apple ID for the upload. The archive is ready: open build/Crossfall.xcarchive (double-click it), then in Organizer click Distribute App > App Store Connect > Distribute."
    echo "If it keeps happening: Xcode > Settings > Accounts, remove your Apple ID and sign in again."
  fi
  exit 1
fi
echo "UPLOADED: Crossfall $VERSION ($BUILD). It appears in App Store Connect > TestFlight after Apple processes it (usually 10-30 minutes; you get an email)."
echo "=== finished $(date '+%H:%M:%S'). You can close this window."
