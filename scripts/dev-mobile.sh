#!/usr/bin/env bash
#
# Levanta la API (wrangler dev :8787) + la app mobile (Expo Go :8082) con un solo comando.
#
# Uso:
#   scripts/dev-mobile.sh wifi    -> celu por WiFi (misma red que la PC)
#   scripts/dev-mobile.sh cable   -> celu por USB (adb reverse + modo localhost)
#
# La API corre en background; Metro queda en primer plano (mantiene su UI interactiva:
# r = reload, j = debugger, etc.). Ctrl-C corta las dos.

set -uo pipefail

MODE="${1:-wifi}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
API_PID=""

cleanup() {
  if [ -n "$API_PID" ] && kill -0 "$API_PID" 2>/dev/null; then
    echo ""
    echo "▶ Bajando la API (pid $API_PID)…"
    kill "$API_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

# 1) Backend en :8787 (si no está ya corriendo)
if lsof -ti :8787 >/dev/null 2>&1; then
  echo "▶ La API ya está corriendo en :8787, la reutilizo."
else
  echo "▶ Levantando API (wrangler dev) en :8787…"
  ( cd "$ROOT/apps/api" && pnpm dev ) &
  API_PID=$!
fi

# 2) Modo cable: reenviar puertos por USB
if [ "$MODE" = "cable" ]; then
  if ! command -v adb >/dev/null 2>&1; then
    echo "⚠ adb no está en el PATH; no puedo configurar el reenvío por USB."
  elif [ -z "$(adb devices | grep -w device | grep -v 'List of')" ]; then
    echo "⚠ No hay ningún celu conectado por USB (revisá 'adb devices')."
  else
    echo "▶ adb reverse 8082 (bundle) + 8787 (API)…"
    adb reverse tcp:8082 tcp:8082 && adb reverse tcp:8787 tcp:8787
  fi
fi

# 3) Metro / Expo en primer plano
echo "▶ Levantando Expo (modo $MODE)…"
cd "$ROOT/apps/mobile"
if [ "$MODE" = "cable" ]; then
  pnpm expo start --go --port 8082 --localhost
else
  pnpm expo start --go --port 8082
fi
