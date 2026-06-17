#!/bin/bash
N="$1"
P=$(mktemp -d)
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new \
  --disable-gpu \
  --no-sandbox \
  --hide-scrollbars \
  --user-data-dir="$P" \
  --virtual-time-budget=2000 \
  --window-size=1920,1080 \
  --screenshot="/Users/jvanwaveren/IFC/slide-backgrounds/slide-$N.png" \
  "http://localhost:8085/ifc-businessplan.html?capturemode=backgrounds&slide=$N" \
  > /dev/null 2>&1
rm -rf "$P"
ls -la "/Users/jvanwaveren/IFC/slide-backgrounds/slide-$N.png" 2>&1 | head -1
