#!/usr/bin/env bash
set -euo pipefail
# Un AVD arrancado no implica que ADB y Package Manager estén listos.
# Se espera infraestructura estable; no se reintentan aserciones funcionales.
stable=0
for attempt in $(seq 1 60); do
  if adb get-state 2>/dev/null | grep -q '^device$' &&
    [ "$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = '1' ] &&
    adb shell pm path android 2>/dev/null | grep -q '^package:'; then
    stable=$((stable + 1))
    [ "$stable" -ge 10 ] && exit 0
  else
    stable=0
    adb reconnect offline >/dev/null 2>&1 || true
  fi
  sleep 2
done
adb devices -l
echo '::error::El entorno Android no se estabilizó; no se acredita aceptación de la app.'
exit 1
