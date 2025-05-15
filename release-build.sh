#!/usr/bin/env bash
set -euo pipefail

# ---- CONFIGURE THESE ----
KEYSTORE_PATH="android/keystores/my-upload-key-keystore.jks"
KEY_ALIAS="upload"
KEYSTORE_PASSWORD="expoexpo"
KEY_PASSWORD="expoexpo"
RELEASE_CHANNEL="prod"
# ------------------------

# Export credentials for Expo CLI
export EXPO_ANDROID_KEYSTORE_ALIAS="$KEY_ALIAS"
export EXPO_ANDROID_KEYSTORE_PASSWORD="$KEYSTORE_PASSWORD"
export EXPO_ANDROID_KEY_PASSWORD="$KEY_PASSWORD"
export EAS_BUILD_ANDROID_KEYSTORE_PATH="$KEYSTORE_PATH"
export EAS_BUILD_ANDROID_KEYSTORE_ALIAS="$KEY_ALIAS"
export EAS_BUILD_ANDROID_KEYSTORE_PASSWORD="$KEYSTORE_PASSWORD"
export EAS_BUILD_ANDROID_KEY_PASSWORD="$KEY_PASSWORD"

echo "🔨 Building Local Android APK…"
npx eas build -p android --profile preview --local

echo "🔨 Starting EAS iOS build…"
npx eas build -p ios --profile production

echo "✅ EAS builds queued. Monitor progress at https://eas.expo.dev"
