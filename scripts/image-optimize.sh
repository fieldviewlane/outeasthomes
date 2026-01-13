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
# Stage1/Stage2: AVIF binary search
#   - Pure size search: find the highest Q such that size <= TARGET_KB.
#   - Also computes DSSIM for each candidate for logging, rounded to 3 decimals.
#   - Returns the best under-cap candidate (highest Q) and its DSSIM.
# ----------------------------
stage_avif_search() {
    local REF_PNG="$1" SRC_PNG="$2" WIDTH="$3" MINQ="$4" MAXQ="$5" TMP_PREFIX="$6"

    local LOW=$MINQ
    local HIGH=$MAXQ

    local BESTQ=-1
    local BESTSIZE=0
    local BESTFILE=""
    local BESTDSSIM=1.0

    local ENC_FLAGS=$(get_encoding_flags "$WIDTH")

    while [ $LOW -le $HIGH ]; do
        local MID=$(( (LOW+HIGH)/2 ))
        local TMP="$OUTPUT_DIR/tmp_${TMP_PREFIX}_Q${MID}_W${WIDTH}.avif"

        avifenc $ENC_FLAGS -q $MID "$SRC_PNG" "$TMP" >/dev/null 2>&1

        local SIZE=$(du -k "$TMP" | awk '{print $1}')
        local DSSIM_RAW=$(magick compare -metric DSSIM "$REF_PNG" "$TMP" null: 2>&1 | awk -F '[()]' '{print $2}')
        [ -z "$DSSIM_RAW" ] && DSSIM_RAW=1.0
        # Format DSSIM to three decimal places for readability
        local DSSIM_FMT
        DSSIM_FMT=$(printf '%.3f' "$DSSIM_RAW" 2>/dev/null || echo "$DSSIM_RAW")

        log "      [${WIDTH} px] Q=${MID} → Size=${SIZE}KB | DSSIM ${DSSIM_FMT}"

        if (( $(echo "$SIZE <= $TARGET_KB" | bc -l) )); then
            if [ $MID -gt $BESTQ ]; then
                BESTQ=$MID
                BESTSIZE=$SIZE
                BESTFILE="$TMP"
                BESTDSSIM=$DSSIM_RAW
            fi
            LOW=$((MID+1))  # try higher quality
        else
            HIGH=$((MID-1)) # too big, try lower quality
        fi
    done

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

# Helper to run the pipeline for a given width and current TARGET_KB.
# Steps for a single width/cap:
#   1. Binary-search Q on the cropped+resized image (Stage 1, no preprocessing)
#      to find the highest Q that fits under TARGET_KB.
#      - Measure DSSIM once on that best candidate.
#   2. If DSSIM is above threshold, optionally try preprocessing (Stage 2)
#      with the same width and cap using a small set of filters.
#      - Again, measure DSSIM once on the best candidate.
#   3. If still above threshold (or no candidate fits under the cap), the
#      caller should move on (e.g., relax cap or drop to a lower width).
run_pipeline_for_width() {
    local WIDTH="$1"
    local THRESHOLD=$(get_dssim_threshold "$WIDTH")

    local BEST_W=0 BEST_Q=0 BEST_SIZE=0 BEST_DSSIM=1.0 BEST_FILE=""

    # Prepare the base cropped+resized PNG once for this width.
    local BASE_PNG="$OUTPUT_DIR/base_${WIDTH}.png"
    magick "$SRC" -gravity center -crop ${CROP_RATIO}$OFFSET -resize ${WIDTH}x "$BASE_PNG"

    # --- Stage 1: no preprocessing ---
    read BQ BS BD BF <<< $(stage_avif_search "$BASE_PNG" "$BASE_PNG" "$WIDTH" $MIN_QUALITY $MAX_QUALITY "S1")

    if [ "$BQ" -ge 0 ] && [ -n "$BF" ]; then
        local DSSIM_STAGE1=$BD
        local DSSIM_FMT
        DSSIM_FMT=$(printf '%.3f' "$DSSIM_STAGE1" 2>/dev/null || echo "$DSSIM_STAGE1")
        log "   ▶ Stage 1 candidate at ${WIDTH}px: Q=$BQ, Size=${BS}KB, DSSIM=${DSSIM_FMT}"

        if (( $(echo "$THRESHOLD <= 0" | bc -l) )) || \
           (( $(echo "$DSSIM_STAGE1 <= $THRESHOLD" | bc -l) )); then
            BEST_W=$WIDTH; BEST_Q=$BQ; BEST_SIZE=$BS; BEST_DSSIM=$DSSIM_STAGE1; BEST_FILE=$BF
        fi
    fi
    # --- Stage 2: preprocessing (median only) ---
    # Only if Stage 1 didn't satisfy the DSSIM threshold.
    if [ -n "$THRESHOLD" ] && [ -z "$BEST_FILE" ]; then
        for STEP in "median"; do
            local PRE_PNG="$OUTPUT_DIR/pre_${STEP}_${WIDTH}.png"
            # Median filter can help denoise without as much structural loss
            magick "$SRC" -gravity center -crop ${CROP_RATIO}$OFFSET -resize ${WIDTH}x -statistic Median 3x3 "$PRE_PNG"

            read BQ BS BD BF <<< $(stage_avif_search "$BASE_PNG" "$PRE_PNG" "$WIDTH" 18 $MAX_QUALITY "S2_$STEP")

            if [ "$BQ" -ge 0 ] && [ -n "$BF" ]; then
                local DSSIM_STAGE2=$BD
                local DSSIM_FMT
                DSSIM_FMT=$(printf '%.3f' "$DSSIM_STAGE2" 2>/dev/null || echo "$DSSIM_STAGE2")
                log "   ▶ Stage 2 (${STEP}) candidate at ${WIDTH}px: Q=$BQ, Size=${BS}KB, DSSIM=${DSSIM_FMT}"

                if (( $(echo "$THRESHOLD <= 0" | bc -l) )) || \
                   (( $(echo "$DSSIM_STAGE2 <= $THRESHOLD" | bc -l) )); then
                    BEST_W=$WIDTH; BEST_Q=$BQ; BEST_SIZE=$BS; BEST_DSSIM=$DSSIM_STAGE2; BEST_FILE=$BF
                    log "   ✅ Stage 2 (${STEP}) met DSSIM threshold at ${WIDTH}px"
                    rm -f "$PRE_PNG"
                    break
                fi
            fi

            rm -f "$PRE_PNG"
        done
    fi

    rm -f "$BASE_PNG"

    if [ -n "$BEST_FILE" ]; then
        echo "$BEST_W $BEST_Q $BEST_SIZE $BEST_DSSIM $BEST_FILE"
    else
        echo "0 0 0 0 "
    fi
}

# Multi-step degradation strategy (per your description):
# 1. Try to achieve DSSIM under threshold using up to the base cap at
#    the highest resolution for this tier.
# 2. If DSSIM cannot be achieved, raise the cap by 1.5x and try again
#    at the same width.
# 3. If DSSIM still cannot be achieved, move to the next lower
#    resolution tier and repeat steps 1–2.

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