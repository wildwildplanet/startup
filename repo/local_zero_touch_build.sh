#!/usr/bin/env bash
# local_zero_touch_build.sh
# Builds & submits using local keystore via credentials.json

set -euo pipefail

# Ensure required EAS environment variables are set
: "${EAS_BUILD_ANDROID_KEYSTORE_PATH:?Need EAS_BUILD_ANDROID_KEYSTORE_PATH (path to .jks)}"
: "${EAS_BUILD_ANDROID_KEYSTORE_PASSWORD:?Need EAS_BUILD_ANDROID_KEYSTORE_PASSWORD}" 
: "${EAS_BUILD_ANDROID_KEY_ALIAS:?Need EAS_BUILD_ANDROID_KEY_ALIAS}" 
: "${EAS_BUILD_ANDROID_KEY_PASSWORD:?Need EAS_BUILD_ANDROID_KEY_PASSWORD}" 

# If specified JKS not found, try PKCS12 (.p12)
if [ ! -f "$EAS_BUILD_ANDROID_KEYSTORE_PATH" ]; then
  alt_path="${EAS_BUILD_ANDROID_KEYSTORE_PATH%.jks}.p12"
  if [ -f "$alt_path" ]; then
    echo "⚠️ Keystore .jks not found, falling back to PKCS12: $alt_path"
    EAS_BUILD_ANDROID_KEYSTORE_PATH="$alt_path"
  else
    echo "❌ Keystore file not found at $EAS_BUILD_ANDROID_KEYSTORE_PATH or $alt_path" >&2
    exit 1
  fi
fi

echo "🔑 Generating credentials.json with keystorePath..."
cat <<EOF > credentials.json
{
  "android": {
    "keystore": {
      "keystorePath": "${EAS_BUILD_ANDROID_KEYSTORE_PATH}",
      "keystorePassword": "${EAS_BUILD_ANDROID_KEYSTORE_PASSWORD}",
      "keyAlias": "${EAS_BUILD_ANDROID_KEY_ALIAS}",
      "keyPassword": "${EAS_BUILD_ANDROID_KEY_PASSWORD}"
    }
  }
}
EOF
echo "🔑 credentials.json generated"

echo "🚀 Starting EAS build (production) with local credentials..."
eas build --platform android --profile production --non-interactive

echo "📦 Build complete. Submitting to Google Play..."
eas submit --platform android --latest --non-interactive

echo "✅ Build & submit finished!"
