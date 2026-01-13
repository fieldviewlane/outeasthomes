#!/bin/bash
# ⚙️ Shared Image Pipeline Configuration
# This file is sourced by all image-optimize and generate-assets scripts.
# It ensures consistency between the discovery (search) and generation phases.

# Directories & Files
INPUT_DIR="../images/originals"
OUTPUT_DIR="../public/assets"
CONFIG_FILE="./image-settings.json"

# Quality & Encoding Logic
# ---------------------------------------------------------
# WHY THIS FUNCTION MATTERS: 
# It centralizes the 'avifenc' flags so that both the binary search (optimize.sh) 
# and the final creation (generate.sh) use the EXACT same parameters.
# Without this, the file size found during discovery might not match the final file.
get_encoding_flags() {
    local WIDTH=$1
    
    # Small images (≤704px) use high-quality settings (4:4:4 chroma + sharpness)
    # Larger images use standard settings for better compression efficiency
    if [ "$WIDTH" -le 704 ]; then
        echo "--speed 2 --yuv 444 -a sharpness=5"
    else
        echo "--speed 2 --yuv 420"
    fi
}

# Tier Targets
# ---------------------------------------------------------
TARGET_SMALL=100
TARGET_MEDIUM=300
TARGET_LARGE=600

WIDTH_SMALL=704
WIDTH_MEDIUM=1200
WIDTH_LARGE=1920

# Search Parameters
# ---------------------------------------------------------
MIN_QUALITY=20
MAX_QUALITY=95

# DSSIM Thresholds (optional)
# ---------------------------------------------------------
# DSSIM is a "difference" metric where 0.0 is identical and higher values
# mean more visible difference (more blur / artifacts).
# Set these to 0 to disable DSSIM-based constraints.
# Recommended starting thresholds (tuned for sharpness under current caps):
# - Small screens tolerate slightly more difference; larger screens should be crisper.
MAX_DSSIM_SMALL=0.05   # e.g. phone portrait
MAX_DSSIM_MEDIUM=0.03  # e.g. tablet / small laptop
MAX_DSSIM_LARGE=0.02   # e.g. desktop hero

get_dssim_threshold() {
    local WIDTH=$1

    # Map width to a tier-specific threshold. This keeps large desktop
    # images sharper while allowing slightly more error on small screens.
    if [ "$WIDTH" -ge "$WIDTH_LARGE" ]; then
        echo "${MAX_DSSIM_LARGE:-0}"
    elif [ "$WIDTH" -ge "$WIDTH_MEDIUM" ]; then
        echo "${MAX_DSSIM_MEDIUM:-0}"
    else
        echo "${MAX_DSSIM_SMALL:-0}"
    fi
}

# Layout
# ---------------------------------------------------------
CROP_RATIO="9:16"
