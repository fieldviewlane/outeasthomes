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
    magick "$SRC" -resize ${WIDTH}x -quality $MAX_QUALITY "$OUT"
    local SIZE=$(du -k "$OUT" | awk '{print $1}')
    # Note: compare returns metric in parentheses, we need to extract it
    local DSSIM=$(magick compare -metric DSSIM "$SRC" "$OUT" null: 2>&1 | awk -F '[()]' '{print $2}')
    [ -z "$DSSIM" ] && DSSIM=1.0
    echo "$OUT $SIZE $DSSIM"
}

# ----------------------------
# Stage1/Stage2: AVIF binary search (size-only; DSSIM evaluated by caller)
# ----------------------------
stage_avif_search() {
    local SRC="$1" WIDTH="$2" MINQ="$3" MAXQ="$4"
    local TMP_PREFIX="$5"
    local PRE_FILE="$6" # This is the preprocessed image path

    local LOW=$MINQ HIGH=$MAXQ

    # Track best candidate under the byte cap (regardless of DSSIM)
    local BESTQ=-1 BESTSIZE=0 BESTDSSIM=1.0 BESTFILE=""

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
            # Always keep the candidate that uses the most bytes under the cap
            if [ -z "$BESTFILE" ] || (( $(echo "$SIZE > $BESTSIZE" | bc -l) )); then
                BESTQ=$MID
                BESTSIZE=$SIZE
                BESTDSSIM=$DSSIM
                BESTFILE="$TMP"
            fi

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

# Helper to run the full pipeline (Stage 1 + Stage 2 preprocessing) for a
# given width and current TARGET_KB. Returns best candidate that satisfies
# the DSSIM threshold if possible. If none satisfy the threshold, returns
# an empty result.
run_pipeline_for_width() {
    local WIDTH="$1"
    local THRESHOLD=$(get_dssim_threshold "$WIDTH")

    local BEST_W=0 BEST_Q=0 BEST_SIZE=0 BEST_DSSIM=1.0 BEST_FILE=""

    # Try Stage 1 (no preprocessing)
    read BQ BS BD BF <<< $(stage_avif_search "$SRC" "$WIDTH" $MIN_QUALITY $MAX_QUALITY "S1")
    if [ -n "$BF" ] && (( $(echo "$BS <= $TARGET_KB" | bc -l) )) && \
       (( $(echo "$THRESHOLD <= 0" | bc -l) )) || (( $(echo "$BD <= $THRESHOLD" | bc -l) )); then
        BEST_W=$WIDTH; BEST_Q=$BQ; BEST_SIZE=$BS; BEST_DSSIM=$BD; BEST_FILE=$BF
    fi

    # Stage 2 (preprocessing) only if we still haven't met the threshold
    if [ -z "$BEST_FILE" ]; then
        for STEP in "blur" "median"; do
            PRE_IMG="$OUTPUT_DIR/pre_${STEP}_${WIDTH}.png"
            if [ "$STEP" == "blur" ]; then 
                magick "$SRC" -gravity center -crop ${CROP_RATIO}$OFFSET -resize ${WIDTH}x -blur 0x0.5 "$PRE_IMG"
            else 
                magick "$SRC" -gravity center -crop ${CROP_RATIO}$OFFSET -resize ${WIDTH}x -statistic Median 3x3 "$PRE_IMG"
            fi
            
            read BQ BS BD BF <<< $(stage_avif_search "$SRC" "$WIDTH" 18 $MAX_QUALITY "S2_$STEP" "$PRE_IMG")
            rm -f "$PRE_IMG"
            
            if [ -n "$BF" ] && (( $(echo "$BS <= $TARGET_KB" | bc -l) )) && \
               ( (( $(echo "$THRESHOLD <= 0" | bc -l) )) || (( $(echo "$BD <= $THRESHOLD" | bc -l) )) ); then
                BEST_W=$WIDTH; BEST_Q=$BQ; BEST_SIZE=$BS; BEST_DSSIM=$BD; BEST_FILE=$BF
                log "   ✅ Stage 2 ($STEP) succeeded at ${WIDTH}px under ${TARGET_KB}KB cap"
                break
            fi
        done
    fi

    if [ -n "$BEST_FILE" ]; then
        echo "$BEST_W $BEST_Q $BEST_SIZE $BEST_DSSIM $BEST_FILE"
    else
        echo "0 0 0 0 "
    fi
}

# Multi-step degradation strategy:
# 1. Try to hit DSSIM threshold at the original TARGET_KB and WIDTH_GOAL.
# 2. If that fails, relax the cap by 1.5x and try again at WIDTH_GOAL.
# 3. If that still fails, move to lower resolution tiers and repeat steps 1–2.

BASE_TARGET_KB=$TARGET_KB
RELAXED_TARGET_KB=$(( BASE_TARGET_KB * 3 / 2 ))

# Step 1 & 2 at target width
WIDTH=$WIDTH_GOAL
log "   ➤ Phase 1: target width ${WIDTH}px @ ${BASE_TARGET_KB}KB (then ${RELAXED_TARGET_KB}KB if needed)"

# Phase 1a: original cap
TARGET_KB=$BASE_TARGET_KB
read FW FQ FS FD FF <<< $(run_pipeline_for_width "$WIDTH")

if [ -n "$FF" ]; then
    FINAL_W=$FW; FINAL_Q=$FQ; FINAL_SIZE=$FS; FINAL_DSSIM=$FD; FINAL_FILE=$FF
else
    # Phase 1b: relaxed cap
    TARGET_KB=$RELAXED_TARGET_KB
    log "   ⚠️  DSSIM threshold not met at base cap; retrying at relaxed cap ${TARGET_KB}KB"
    read FW FQ FS FD FF <<< $(run_pipeline_for_width "$WIDTH")

    if [ -n "$FF" ]; then
        FINAL_W=$FW; FINAL_Q=$FQ; FINAL_SIZE=$FS; FINAL_DSSIM=$FD; FINAL_FILE=$FF
    fi
fi

# If still no success, try smaller resolutions with the same two-phase strategy
if [ -z "$FINAL_FILE" ]; then
    log "   ⚠️  Trying smaller resolutions with degradation strategy..."
    for WIDTH in "${RESOLUTIONS[@]}"; do
        [ "$WIDTH" -ge "$WIDTH_GOAL" ] && continue  # Skip widths >= target

        log "   ➤ Phase 2: width ${WIDTH}px @ ${BASE_TARGET_KB}KB (then ${RELAXED_TARGET_KB}KB if needed)"

        # Reset to base cap for this width
        TARGET_KB=$BASE_TARGET_KB
        read FW FQ FS FD FF <<< $(run_pipeline_for_width "$WIDTH")

        if [ -n "$FF" ]; then
            FINAL_W=$FW; FINAL_Q=$FQ; FINAL_SIZE=$FS; FINAL_DSSIM=$FD; FINAL_FILE=$FF
            break
        fi

        # Retry with relaxed cap at this width
        TARGET_KB=$RELAXED_TARGET_KB
        log "   ⚠️  DSSIM threshold not met at base cap; retrying at relaxed cap ${TARGET_KB}KB for width ${WIDTH}px"
        read FW FQ FS FD FF <<< $(run_pipeline_for_width "$WIDTH")

        if [ -n "$FF" ]; then
            FINAL_W=$FW; FINAL_Q=$FQ; FINAL_SIZE=$FS; FINAL_DSSIM=$FD; FINAL_FILE=$FF
            break
        fi
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