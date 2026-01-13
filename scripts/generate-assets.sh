#!/bin/bash
# Source shared encoding configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/encoding-config.sh"

# Requirements: jq
if ! command -v jq &> /dev/null; then echo "Please install jq"; exit 1; fi

# Get image keys: use arguments if provided, otherwise get all keys from config
if [ $# -gt 0 ]; then
    KEYS=("$@")
    echo "🎯 Targeting specific assets: ${KEYS[*]}"
else
    KEYS=$(jq -r 'keys[]' "$CONFIG_FILE")
fi

for NAME in ${KEYS[@]}; do
    echo "📦 Generating final assets for: $NAME"
    
    # Check if key exists in config
    if [[ $(jq ".\"$NAME\"" "$CONFIG_FILE") == "null" ]]; then
       echo "   ⚠️  Warning: $NAME not found in $CONFIG_FILE. Skipping."
       continue
    fi
    
    # Locate source file
    SRC=$(find "$INPUT_DIR" -maxdepth 1 -type f -iname "$NAME.*" | head -n 1)
    GLOBAL_OFFSET=$(jq -r ".\"$NAME\".offset // \"+0+0\"" "$CONFIG_FILE")

    for TIER in small medium large; do
        W=$(jq -r ".\"$NAME\".$TIER.w" "$CONFIG_FILE")
        Q=$(jq -r ".\"$NAME\".$TIER.q" "$CONFIG_FILE")
        TIER_OFFSET=$(jq -r ".\"$NAME\".$TIER.offset // \"null\"" "$CONFIG_FILE")
        
        # Use tier-specific offset if defined, otherwise use global offset
        OFFSET="$GLOBAL_OFFSET"
        [ "$TIER_OFFSET" != "null" ] && OFFSET="$TIER_OFFSET"
        
        # Determine High-Quality flags based on Tier
        FLAGS=$(get_encoding_flags "$W")

        OUT_FILE="$OUTPUT_DIR/${NAME}-${TIER}.avif"
        TEMP_PNG="/tmp/${NAME}-${TIER}-temp.png"
        
        # Execute: Crop -> Resize -> Save temp PNG -> Encode to AVIF
        magick "$SRC" -gravity center -crop ${CROP_RATIO}${OFFSET} -resize ${W}x "$TEMP_PNG" && \
        avifenc $FLAGS -q $Q "$TEMP_PNG" "$OUT_FILE" >/dev/null 2>&1
        rm -f "$TEMP_PNG"
        
        if [ -f "$OUT_FILE" ]; then
            # Log actual file size in KB based on byte count (PageSpeed-relevant),
            # not filesystem allocation blocks.
            SIZE_BYTES=$(stat -f%z "$OUT_FILE" 2>/dev/null || stat -c%s "$OUT_FILE" 2>/dev/null)
            SIZE_KB=$(( (SIZE_BYTES + 1023) / 1024 ))
            echo "   ✅ $TIER: ${W}px (Q$Q) offset: $OFFSET -> ${SIZE_KB}KB (${SIZE_BYTES} bytes)"
        else
            echo "   ❌ $TIER: Failed to generate"
        fi
    done
done