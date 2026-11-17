#!/usr/bin/env bash
# Собирает zip для релиза: только то, что нужно браузеру.
# Тесты, документация, хуки и скриншоты в дистрибутив не попадают.
set -euo pipefail
cd "$(dirname "$0")/.."

VERSION=$(node -p "require('./manifest.json').version")
OUT="dist/page-counter-${VERSION}.zip"

mkdir -p dist
rm -f "$OUT"
zip -q -r "$OUT" \
  manifest.json background.js theme.css \
  lib popup options icons _locales \
  -x "*.DS_Store" -x "*__MACOSX*"

echo "готово: $OUT"
