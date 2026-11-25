#!/usr/bin/env bash
set -euo pipefail
mkdir -p reports/native
cleanup() {
  adb shell cmd connectivity airplane-mode disable >/dev/null 2>&1 || true
  adb shell svc wifi enable >/dev/null 2>&1 || true
  adb shell svc data enable >/dev/null 2>&1 || true
  adb logcat -d -b crash > reports/native/android-crashes.log 2>/dev/null || true
}
trap cleanup EXIT
bash scripts/ci/wait-android.sh
adb shell input keyevent 82
adb shell am force-stop com.google.android.apps.nexuslauncher
adb shell settings put system font_scale 1.0
adb logcat -c
adb reverse tcp:8081 tcp:8081
node native-tests/export-blackbox-plan.cjs
/tmp/econolab-appium/node_modules/.bin/appium --address 127.0.0.1 --port 4723 --log-level warn --log-no-colors --log reports/native/appium.log > /tmp/econolab-appium.log 2>&1 &
school_appium_pid=$!
trap 'cleanup; kill "$school_appium_pid" 2>/dev/null || true' EXIT
adb install android/app/build/outputs/apk/debug/app-debug.apk
debug_result=0
VARIANT=debug EMAIL=native-debug@example.test PASSWORD="$SECURITY_QA_UI_PASSWORD" python3 native-tests/school-blackbox.py || debug_result=$?
cleanup
adb uninstall com.econolab.mobile.qa
kill "$QA_METRO_PID"
for n in $(seq 1 15); do
  kill -0 "$QA_METRO_PID" 2>/dev/null || break
  sleep 1
done
if curl --max-time 1 -fsS http://127.0.0.1:8081/status >/dev/null 2>&1; then
  echo '::error::Metro remains available; standalone Release is not verified.'
  exit 1
fi
printf '%s\n' 'Metro stopped before installing and executing Release.' > reports/native/release-independence.txt
adb install android/app/build/outputs/apk/release/app-release.apk
release_result=0
VARIANT=release EMAIL=native-release@example.test PASSWORD="$SECURITY_QA_UI_PASSWORD" python3 native-tests/school-blackbox.py || release_result=$?
printf '{"debugExitCode":%d,"releaseExitCode":%d}\n' "$debug_result" "$release_result" > reports/native/variant-exit-codes.json
if [ "$debug_result" -ne 0 ] || [ "$release_result" -ne 0 ]; then exit 1; fi
