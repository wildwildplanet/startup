#!/usr/bin/env sh
set -e

echo "📦 Prebuilding native Android project…"
CI=1 npx expo prebuild --platform android

echo "🛠  Building release APK…"
cd android
./gradlew clean assembleRelease

APK_PATH="app/build/outputs/apk/release/app-release.apk"
echo "✅ APK ready at android/$APK_PATH"
