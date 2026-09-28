#!/usr/bin/env bash
# Builds the small piano sample set used by the app from the Salamander Grand Piano V3 MP3s
# packaged as @audio-samples/piano-mp3-velocity8 (samples: CC BY 3.0, Alexander Holm; packaging: MIT, Jan Forst).
# Changes made: C2–C7 only, one sample every 3 semitones, mono, trimmed with a fade-out, +6 dB, 64 kbps.
# Output: audio/piano/*.mp3 (served over http) and js/audio/piano-samples.js (base64, works from file://).
set -euo pipefail
cd "$(dirname "$0")/.."
WORK="$(mktemp -d)"
( cd "$WORK" && npm pack @audio-samples/piano-mp3-velocity8@1.0.5 --silent >/dev/null && tar xzf ./*.tgz )
SRC="$WORK/package/audio"
OUT="audio/piano"
mkdir -p "$OUT" js/audio
rm -f "$OUT"/*.mp3

for oct in 2 3 4 5 6 7; do
  for name in C D# F# A; do
    [ "$oct" = 7 ] && [ "$name" != C ] && continue
    case $oct in 2|3) dur=5.5 ;; 4|5) dur=4.2 ;; *) dur=3.0 ;; esac
    fade=$(python3 -c "print($dur-0.9)")
    safe="${name/\#/s}${oct}"
    ffmpeg -hide_banner -loglevel error -y -i "$SRC/${name}${oct}v8.mp3" -t "$dur" \
      -af "pan=mono|c0=0.5*c0+0.5*c1,volume=6dB,afade=t=out:st=${fade}:d=0.9" \
      -ac 1 -ar 44100 -codec:a libmp3lame -b:a 64k "$OUT/${safe}.mp3"
  done
done

node -e '
const fs = require("fs");
const dir = "audio/piano";
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".mp3")).sort();
const map = {};
for (const f of files) map[f.replace(".mp3", "")] = fs.readFileSync(dir + "/" + f).toString("base64");
const head = "/* Piano samples embedded as base64 MP3 so sound works even when index.html is opened from disk.\n" +
  "   Source: Salamander Grand Piano V3 by Alexander Holm (CC BY 3.0, https://archive.org/details/SalamanderGrandPianoV3),\n" +
  "   via @audio-samples/piano-mp3-velocity8 by Jan Forst (MIT). Trimmed, mono, re-encoded by tools/build-samples.sh. */\n";
fs.writeFileSync("js/audio/piano-samples.js", head + "window.MC_PIANO_SAMPLES = " + JSON.stringify(map) + ";\n");
console.log(files.length + " samples, " + (fs.statSync("js/audio/piano-samples.js").size / 1024).toFixed(0) + " KB embedded");
'
cp "$WORK/package/LICENSE" licenses/piano-mp3-velocity8-MIT.txt
rm -rf "$WORK"
du -sh "$OUT"
