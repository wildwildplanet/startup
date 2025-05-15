#!/usr/bin/env bash
set -euo pipefail

# Build script: local RN build, fallback to Expo EAS build if failure

# Function: fallback to Expo EAS Build
fallback_eas_build() {
  echo "\n🚨 Local build failed, falling back to Expo EAS Build..."
  # Install EAS CLI if missing
  if ! command -v eas >/dev/null 2>&1; then
    echo "Installing EAS CLI globally..."
    npm install -g eas-cli
  fi
  # Ensure logged in
  if ! eas whoami >/dev/null 2>&1; then
    echo "Please log in to Expo (EAS)..."
    eas login
  fi
  # Configure and run EAS build
  echo "Configuring EAS build..."
  eas build:configure || true
  echo "Uploading credentials..."
  eas credentials || true
  echo "Starting EAS Android build..."
  eas build --platform android --profile production
}

# 1. Update RN Gradle plugin to v0.77.2 in settings.gradle
echo "Updating React Native Gradle plugin to 0.77.2 in android/settings.gradle..."
sed -i '' 's/id("com.facebook.react.settings") version ".*"/id("com.facebook.react.settings") version "0.77.2"/' android/settings.gradle

# 2. Install project dependencies
if [ -f yarn.lock ]; then
  echo "Installing dependencies via yarn..."
  yarn install
else
  echo "Installing dependencies via npm..."
  npm install
fi

# 3. Apply JdkConfiguratorUtils hack to disable Java toolchain
echo "Patching JdkConfiguratorUtils to disable Java toolchain alignment..."
patch -p0 << 'PATCH'
*** Begin Patch
*** Update File: node_modules/@react-native/gradle-plugin/react-native-gradle-plugin/src/main/kotlin/com/facebook/react/utils/JdkConfiguratorUtils.kt
@@
-  fun configureJavaToolChains(input: Project) {
+  fun configureJavaToolChains(input: Project) {
+    // Patched: disable Java toolchain alignment entirely
+    return
PATCH

# 4. Clean and assemble Android release
echo "Running Gradle clean and assembleRelease..."
if (cd android && ./gradlew clean assembleRelease -Preact.internal.disableJavaVersionAlignment=true); then
  echo "\n✅ Local Android build succeeded: Locate your APK in android/app/build/outputs/apk/release/."
else
  fallback_eas_build
fi
