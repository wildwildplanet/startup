#!/usr/bin/env bash
# zero_touch_build.sh
# Run EAS build & submit fully non-interactively using remote credentials

set -euo pipefail

# Ensure remote credentials in eas.json (already configured)

echo "🔑 Using remote credentials (zero-touch)"

echo "🚀 Starting EAS Android build (production) non-interactively..."
eas build --platform android --profile production --non-interactive

echo "📦 Build complete. Submitting to Google Play..."
eas submit --platform android --latest --non-interactive

echo "✅ Build & submit process finished!"
