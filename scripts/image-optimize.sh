#!/bin/bash
# Source shared encoding configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/encoding-config.sh"

SRC_IMG="${1:-$INPUT_DIR}"
OUTPUT_DIR="../image_optimization"

WIDTH_GOAL="${2:-$WIDTH_SMALL}"
TARGET_KB="${3:-$TARGET_SMALL}"
OFFSET="${4:-+0+0}"

# Build a resolution fallback list based on WIDTH_GOAL
if [ "$WIDTH_GOAL" -ge 1920 ]; then
    RESOLUTIONS=(1920 1600 1400 1200 1024 800)
elif [ "$WIDTH_GOAL" -ge 1200 ]; then
    RESOLUTIONS=(1200 1024 800 704 640)
else
    RESOLUTIONS=(704 640 576 512 480)
fi
DEBUG=true

mkdir -p "$OUTPUT_DIR"

log() { $DEBUG && echo "   $*" >&2; } # Send logs to stderr to keep stdout clean for returns

# ----------------------------
# Stage0: baseline with ImageMagick
# ----------------------------
stage0_baseline() {
    local SRC="$1" WIDTH="$2"
    local OUT="$OUTPUT_DIR/tmp_baseline_${WIDTH}.avif"
    # Use -thumbnail to strip metadata and speed up baseline
    magick "$SRC" -resize ${WIDTH}x -quality $MAXQ "$OUT"
    local SIZE=$(du -k "$OUT" | awk '{print $1}')
    # Note: compare returns metric in parentheses, we need to extract it
    local DSSIM=$(magick compare -metric DSSIM "$SRC" "$OUT" null: 2>&1 | awk -F '[()]' '{print $2}')
    [ -z "$DSSIM" ] && DSSIM=1.0
    echo "$OUT $SIZE $DSSIM"
}

# ----------------------------
# Stage1/Stage2: AVIF binary search
# ----------------------------
stage_avif_search() {
    local SRC="$1" WIDTH="$2" MINQ="$3" MAXQ="$4"
    local TMP_PREFIX="$5"
    local PRE_FILE="$6" # This is the preprocessed image path

    local LOW=$MINQ HIGH=$MAXQ
    local BESTQ=$MINQ BESTSIZE=999 BESTDSSIM=1.0 BESTFILE=""

    # Get encoding settings from shared config
    local ENC_FLAGS=$(get_encoding_flags "$WIDTH")

    # 1. Prepare a resized version of the source to compare against for DSSIM
    # We compare the AVIF against the resized source, not the original huge source
    # Prepare resized reference with the requested OFFSET
    local RESIZED_REF="$OUTPUT_DIR/ref_${WIDTH}_${TMP_PREFIX}.png"
    magick "$SRC" -gravity center -crop ${CROP_RATIO}$OFFSET -resize ${WIDTH}x "$RESIZED_REF"

    while [ $LOW -le $HIGH ]; do
        local MID=$(( (LOW+HIGH)/2 ))
        local TMP="$OUTPUT_DIR/tmp_${TMP_PREFIX}_Q${MID}_W${WIDTH}.avif"
        
        # Determine if we use the original or a preprocessed version
        local INPUT_IMAGE="$RESIZED_REF"
        [ -f "$PRE_FILE" ] && INPUT_IMAGE="$PRE_FILE"

        # Encode with the same settings that will be used in final generation
        avifenc $ENC_FLAGS -q $MID "$INPUT_IMAGE" "$TMP" >/dev/null 2>&1

        local SIZE=$(du -k "$TMP" | awk '{print $1}')
        # Measure DSSIM against the resized reference
        local DSSIM=$(magick compare -metric DSSIM "$RESIZED_REF" "$TMP" null: 2>&1 | awk -F '[()]' '{print $2}')
        [ -z "$DSSIM" ] && DSSIM=1.0

        log "      [$WIDTH px] Q=$MID → Size=${SIZE}KB | DSSIM=${DSSIM}"

        if (( $(echo "$SIZE <= $TARGET_KB" | bc -l) )); then
            BESTQ=$MID
            BESTSIZE=$SIZE
            BESTDSSIM=$DSSIM
            BESTFILE="$TMP"
            LOW=$((MID+1)) # Try higher quality
        else
            HIGH=$((MID-1)) # Too big, try lower quality
        fi
    done
    rm -f "$RESIZED_REF"
    echo "$BESTQ $BESTSIZE $BESTDSSIM $BESTFILE"
}

# ----------------------------
# Main Execution (Single Image Mode)
# ----------------------------
SRC="$SRC_IMG"
[ ! -f "$SRC" ] && echo "❌ Error: Source file not found: $SRC" >&2 && exit 1

NAME=$(basename "$SRC" | sed 's/\.[^.]*$//')
echo "🚀 Optimizing $NAME for ${WIDTH_GOAL}px @ ${TARGET_KB}KB..." >&2

FINAL_FILE=""
FINAL_W=0
FINAL_Q=0
FINAL_SIZE=0
FINAL_DSSIM=1.0

# Try the target width first with Stage 1 (straight encode)
WIDTH=$WIDTH_GOAL
read BQ BS BD BF <<< $(stage_avif_search "$SRC" "$WIDTH" $MIN_QUALITY $MAX_QUALITY "S1")

if [ -n "$BF" ] && (( $(echo "$BS <= $TARGET_KB" | bc -l) )); then
    FINAL_W=$WIDTH; FINAL_Q=$BQ; FINAL_SIZE=$BS; FINAL_DSSIM=$BD; FINAL_FILE=$BF
else
    # Stage 1 failed at target width, try Stage 2 (preprocessing) at target width
    log "   ⚠️  Stage 1 at ${WIDTH}px failed. Trying Stage 2 (preprocessing)..."
    
    for STEP in "blur" "median"; do
        PRE_IMG="$OUTPUT_DIR/pre_${STEP}_${WIDTH}.png"
        if [ "$STEP" == "blur" ]; then 
            magick "$SRC" -gravity center -crop 9:16$OFFSET -resize ${WIDTH}x -blur 0x0.5 "$PRE_IMG"
        else 
            magick "$SRC" -gravity center -crop 9:16$OFFSET -resize ${WIDTH}x -statistic Median 3x3 "$PRE_IMG"
        fi
        
        read BQ BS BD BF <<< $(stage_avif_search "$SRC" "$WIDTH" 18 $MAXQ "S2_$STEP" "$PRE_IMG")
        rm -f "$PRE_IMG"
        
        if [ -n "$BF" ] && (( $(echo "$BS <= $TARGET_KB" | bc -l) )); then
            FINAL_W=$WIDTH; FINAL_Q=$BQ; FINAL_SIZE=$BS; FINAL_DSSIM=$BD; FINAL_FILE=$BF
            log "   ✅ Stage 2 ($STEP) succeeded at ${WIDTH}px"
            break
        fi
    done
fi

# If still no success, try smaller resolutions with Stage 1
if [ -z "$FINAL_FILE" ]; then
    log "   ⚠️  Trying smaller resolutions..."
    for WIDTH in "${RESOLUTIONS[@]}"; do
        [ "$WIDTH" -ge "$WIDTH_GOAL" ] && continue  # Skip widths >= target
        
        read BQ BS BD BF <<< $(stage_avif_search "$SRC" "$WIDTH" 18 $MAXQ "S1")
        
        if [ -n "$BF" ] && (( $(echo "$BS <= $TARGET_KB" | bc -l) )); then
            FINAL_W=$WIDTH; FINAL_Q=$BQ; FINAL_SIZE=$BS; FINAL_DSSIM=$BD; FINAL_FILE=$BF
            break
        fi
        
        # If Stage 1 fails at this smaller width, try Stage 2
        for STEP in "blur" "median"; do
            PRE_IMG="$OUTPUT_DIR/pre_${STEP}_${WIDTH}.png"
            if [ "$STEP" == "blur" ]; then 
                magick "$SRC" -gravity center -crop 9:16$OFFSET -resize ${WIDTH}x -blur 0x0.5 "$PRE_IMG"
            else 
                magick "$SRC" -gravity center -crop 9:16$OFFSET -resize ${WIDTH}x -statistic Median 3x3 "$PRE_IMG"
            fi
            
            read BQ BS BD BF <<< $(stage_avif_search "$SRC" "$WIDTH" 18 $MAXQ "S2_$STEP" "$PRE_IMG")
            rm -f "$PRE_IMG"
            
            if [ -n "$BF" ] && (( $(echo "$BS <= $TARGET_KB" | bc -l) )); then
                FINAL_W=$WIDTH; FINAL_Q=$BQ; FINAL_SIZE=$BS; FINAL_DSSIM=$BD; FINAL_FILE=$BF
                log "   ✅ Stage 2 ($STEP) succeeded at ${WIDTH}px"
                break 2
            fi
        done
    done
fi

# Output result to stdout for parent script to parse
if [ -n "$FINAL_FILE" ]; then
    echo "   🏁 FINAL → ${FINAL_W}px | Q=${FINAL_Q} | Size=${FINAL_SIZE}KB | DSSIM=${FINAL_DSSIM}"
    rm -f "$FINAL_FILE"  # Clean up temp file
else
    echo "   ❌ FAILED to meet target"
fi

# Cleanup all tmp files
rm -f "$OUTPUT_DIR"/tmp_* "$OUTPUT_DIR"/ref_*