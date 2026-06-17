#!/bin/bash
# Capture all 12 slide backgrounds as 1920x1080 PNGs.
# Runs headless Chrome against the local preview server (port 8085).
# Output: /Users/jvanwaveren/IFC/slide-backgrounds/slide-{1..12}.png

set -e

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
URL_BASE="http://localhost:8085/ifc-businessplan.html"
OUT_DIR="/Users/jvanwaveren/IFC/slide-backgrounds"

mkdir -p "$OUT_DIR"

for i in $(seq 1 12); do
  OUT="$OUT_DIR/slide-$i.png"
  echo "Capturing slide $i -> $OUT"
  PROFILE=$(mktemp -d)
  "$CHROME" \
    --headless=new \
    --disable-gpu \
    --no-sandbox \
    --hide-scrollbars \
    --user-data-dir="$PROFILE" \
    --virtual-time-budget=3000 \
    --window-size=1920,1080 \
    --screenshot="$OUT" \
    "$URL_BASE?capturemode=backgrounds&slide=$i" > /dev/null 2>&1
  rm -rf "$PROFILE"
done

echo "Done. Captured $(ls -1 "$OUT_DIR"/*.png | wc -l | tr -d ' ') slides."
ls -la "$OUT_DIR/"
