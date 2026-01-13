#!/bin/bash

# Test script - processes only kitchen.jpg
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../encoding-config.sh"

TEMP_DIR="$SCRIPT_DIR/tmp_discovery"
mkdir -p "$TEMP_DIR"

get_manual_offset() {
    [ -f "$CONFIG_FILE" ] && jq -r ".\"$1\".offset // \"+0+0\"" "$CONFIG_FILE" 2>/dev/null || echo "+0+0"
}

log() { echo "   $*" >&2; }

# Initialize config file as empty JSON object
echo "{}" > "$CONFIG_FILE"

echo "🔍 Testing with kitchen.jpg..." >&2
echo "" >&2

IMG_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)/../images/originals"
img="$IMG_ROOT/kitchen.jpg"
NAME="kitchen"
OFFSET=$(get_manual_offset "$NAME")

echo "📸 Processing: $NAME (offset: $OFFSET)" >&2

# Call the engine for three tiers
echo "   → Small (704px, 100KB)..." >&2
S_OUT=$(../image-optimize.sh "$img" 704 100 "$OFFSET" 2>&1 | tee /dev/stderr | tail -n 1)

echo "   → Medium (1200px, 300KB)..." >&2
M_OUT=$(../image-optimize.sh "$img" 1200 300 "$OFFSET" 2>&1 | tee /dev/stderr | tail -n 1)

echo "   → Large (1920px, 600KB)..." >&2
L_OUT=$(../image-optimize.sh "$img" 1920 600 "$OFFSET" 2>&1 | tee /dev/stderr | tail -n 1)

# Parsing FINAL line from image-optimize.sh
SQ=$(echo "$S_OUT" | grep -oE 'Q=[0-9]+' | cut -d= -f2); : ${SQ:=30}
MQ=$(echo "$M_OUT" | grep -oE 'Q=[0-9]+' | cut -d= -f2); : ${MQ:=30}
LQ=$(echo "$L_OUT" | grep -oE 'Q=[0-9]+' | cut -d= -f2); : ${LQ:=30}

SW=$(echo "$S_OUT" | grep -oE '[0-9]+px' | grep -oE '[0-9]+' | head -n 1); : ${SW:=704}
MW=$(echo "$M_OUT" | grep -oE '[0-9]+px' | grep -oE '[0-9]+' | head -n 1); : ${MW:=1200}
LW=$(echo "$L_OUT" | grep -oE '[0-9]+px' | grep -oE '[0-9]+' | head -n 1); : ${LW:=1920}

echo "   ✅ Results: S=${SW}px/Q${SQ}, M=${MW}px/Q${MQ}, L=${LW}px/Q${LQ}" >&2
echo "" >&2

jq -n \
  --arg name "$NAME" \
  --arg off "$OFFSET" \
  --argjson s "{\"w\": $SW, \"q\": $SQ}" \
  --argjson m "{\"w\": $MW, \"q\": $MQ}" \
  --argjson l "{\"w\": $LW, \"q\": $LQ}" \
  '{"\($name)": {"offset": $off, "small": $s, "medium": $m, "large": $l}}' > "$CONFIG_FILE"

rm -rf "$TEMP_DIR"
echo "✅ Test complete! Config saved to $CONFIG_FILE" >&2
echo "" >&2
echo "📄 Generated config:" >&2
cat "$CONFIG_FILE" >&2
