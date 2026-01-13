#!/bin/bash

# --- INSTRUCTIONS ---
# 1. This script DISCOVERS the best settings. It does NOT generate final assets.
# 2. It tests 3 tiers: Small (100KB), Medium (300KB), Large (600KB).
# 3. Settings are saved to image-settings.json.
# 4. Use 'generate_assets.sh' afterwards to create the actual files.

# Source shared encoding configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/encoding-config.sh"

TEMP_DIR="./tmp_discovery"
mkdir -p "$TEMP_DIR"

# Logic: We now call our external engine to leverage all its stages.
get_manual_offset() {
    # Try to read existing offset from JSON if script is re-run
    [ -f "$CONFIG_FILE" ] && jq -r ".\"$1\".offset // \"+0+0\"" "$CONFIG_FILE" || echo "+0+0"
}

log() { echo "   $*" >&2; }

# Initialize config file as empty JSON object if it doesn't exist
[ ! -f "$CONFIG_FILE" ] || [ ! -s "$CONFIG_FILE" ] && echo "{}" > "$CONFIG_FILE"

echo "🔍 Starting image optimization discovery..." >&2
echo "" >&2

# Build list of images to process. If image names are passed as arguments,
# restrict discovery to those basenames; otherwise scan the whole INPUT_DIR
# for common image extensions.
IMAGES=()
if [ "$#" -gt 0 ]; then
    for KEY in "$@"; do
        # Try to resolve KEY.{jpg,jpeg,png} in INPUT_DIR
        MATCH=$(ls "$INPUT_DIR"/"${KEY}".* 2>/dev/null | grep -E '\.(jpe?g|png)$' | head -n 1 || true)
        if [ -n "$MATCH" ]; then
            IMAGES+=("$MATCH")
        else
            echo "⚠️  No image found for key '$KEY' in $INPUT_DIR" >&2
        fi
    done
else
    while IFS= read -r -d '' FILE; do
        IMAGES+=("$FILE")
    done < <(find "$INPUT_DIR" -maxdepth 1 -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \) -print0)
fi

for img in "${IMAGES[@]}"; do
    [ -f "$img" ] || continue
    NAME=$(basename "$img" | sed 's/\.[^.]*$//')
    OFFSET=$(get_manual_offset "$NAME")
    
    # Check for tier-specific offsets to use during discovery
    SOFF=$(jq -r ".\"$NAME\".small.offset // \"$OFFSET\"" "$CONFIG_FILE" 2>/dev/null || echo "$OFFSET")
    MOFF=$(jq -r ".\"$NAME\".medium.offset // \"$OFFSET\"" "$CONFIG_FILE" 2>/dev/null || echo "$OFFSET")
    LOFF=$(jq -r ".\"$NAME\".large.offset // \"$OFFSET\"" "$CONFIG_FILE" 2>/dev/null || echo "$OFFSET")
    
    echo "📸 Processing: $NAME (offsets S:$SOFF M:$MOFF L:$LOFF)" >&2
    
    # Call the engine for three tiers
    # Format: ./image-optimize.sh [src] [width] [target] [offset]
    echo "   → Small (704px, 100KB)..." >&2
    S_OUT=$(./image-optimize.sh "$img" 704 100 "$SOFF" 2>&1 | tee /dev/stderr | tail -n 1)
    
    echo "   → Medium (1200px, 300KB)..." >&2
    M_OUT=$(./image-optimize.sh "$img" 1200 300 "$MOFF" 2>&1 | tee /dev/stderr | tail -n 1)
    
    echo "   → Large (1920px, 600KB)..." >&2
    L_OUT=$(./image-optimize.sh "$img" 1920 600 "$LOFF" 2>&1 | tee /dev/stderr | tail -n 1)

    # Parsing FINAL line from image-optimize.sh
    # Expected format: "   🏁 FINAL → 704px | Q=54 | Size=96KB | DSSIM=0.0111146"
    SQ=$(echo "$S_OUT" | grep -oE 'Q=[0-9]+' | cut -d= -f2); : ${SQ:=30}
    MQ=$(echo "$M_OUT" | grep -oE 'Q=[0-9]+' | cut -d= -f2); : ${MQ:=30}
    LQ=$(echo "$L_OUT" | grep -oE 'Q=[0-9]+' | cut -d= -f2); : ${LQ:=30}
    
    SW=$(echo "$S_OUT" | grep -oE '[0-9]+px' | grep -oE '[0-9]+' | head -n 1); : ${SW:=704}
    MW=$(echo "$M_OUT" | grep -oE '[0-9]+px' | grep -oE '[0-9]+' | head -n 1); : ${MW:=1200}
    LW=$(echo "$L_OUT" | grep -oE '[0-9]+px' | grep -oE '[0-9]+' | head -n 1); : ${LW:=1920}

    echo "   ✅ Results: S=${SW}px/Q${SQ}, M=${MW}px/Q${MQ}, L=${LW}px/Q${LQ}" >&2
    echo "" >&2

    # Prepare tier JSON, keeping existing offset if present and not null
    S_JSON=$(jq -n --arg W "$SW" --arg Q "$SQ" --arg OFF "$SOFF" \
      '{w: ($W|tonumber), q: ($Q|tonumber)} + (if $OFF != "+0+0" then {offset: $OFF} else {} end)')
    M_JSON=$(jq -n --arg W "$MW" --arg Q "$MQ" --arg OFF "$MOFF" \
      '{w: ($W|tonumber), q: ($Q|tonumber)} + (if $OFF != "+0+0" then {offset: $OFF} else {} end)')
    L_JSON=$(jq -n --arg W "$LW" --arg Q "$LQ" --arg OFF "$LOFF" \
      '{w: ($W|tonumber), q: ($Q|tonumber)} + (if $OFF != "+0+0" then {offset: $OFF} else {} end)')

    TEMP_ENTRY=$(mktemp)
    jq -n \
      --arg name "$NAME" \
      --arg off "$OFFSET" \
      --argjson s "$S_JSON" \
      --argjson m "$M_JSON" \
      --argjson l "$L_JSON" \
      '{"\($name)": {"offset": $off, "small": $s, "medium": $m, "large": $l}}' > "$TEMP_ENTRY"

    # Ensure config file exists as a JSON object before merging
    [ ! -f "$CONFIG_FILE" ] || [ ! -s "$CONFIG_FILE" ] && echo "{}" > "$CONFIG_FILE"
    jq -s 'add' "$CONFIG_FILE" "$TEMP_ENTRY" > "${CONFIG_FILE}.tmp" && mv "${CONFIG_FILE}.tmp" "$CONFIG_FILE"
    rm "$TEMP_ENTRY"
done

rm -rf "$TEMP_DIR"
echo "✅ Settings saved to $CONFIG_FILE"