#!/usr/bin/env bash
set -euo pipefail
# TIPO: aceptación de APK Debug y Release con API/PostgreSQL/TLS desechables.
# La acción del emulador separa las líneas de su input; se conserva aquí una
# sola sesión Bash para procesos, bucles y propagación de errores.
bash scripts/ci/wait-android.sh
adb reverse tcp:8081 tcp:8081
adb install android/app/build/outputs/apk/debug/app-debug.apk
adb logcat -b crash -v threadtime > reports/native/android-crash.log 2>&1 &
CRASH_LOG_PID=$!
/tmp/econolab-appium/node_modules/.bin/appium --address 127.0.0.1 --port 4723 --log reports/native/appium.log > /tmp/econolab-appium.log 2>&1 &
APPIUM_PID=$!
trap 'kill "$APPIUM_PID" "$CRASH_LOG_PID" 2>/dev/null || true' EXIT
python3 scripts/ci/appium-acceptance.py
bash scripts/ci/wait-android.sh
maestro test -e APP_ID=com.econolab.mobile.qa -e EMAIL=native-debug@example.test -e PASSWORD="$SECURITY_QA_UI_PASSWORD" --format junit --output reports/native/maestro-debug.xml --test-output-dir reports/native/debug .maestro/native-smoke.yml
adb uninstall com.econolab.mobile.qa
kill "$QA_METRO_PID"
for n in $(seq 1 15); do
  curl --max-time 1 -fsS http://127.0.0.1:8081/status > /dev/null 2>&1 || break
  sleep 1
done
if curl --max-time 1 -fsS http://127.0.0.1:8081/status > /dev/null 2>&1; then
  echo '::error::Metro sigue disponible; no se acredita Release independiente.'
  exit 1
fi
echo 'Metro detenido: Release se prueba con su bundle incluido.'
adb install android/app/build/outputs/apk/release/app-release.apk
maestro test -e APP_ID=com.econolab.mobile.qa -e EMAIL=native-release@example.test -e PASSWORD="$SECURITY_QA_UI_PASSWORD" --format junit --output reports/native/maestro-release.xml --test-output-dir reports/native/release .maestro/native-smoke.yml
