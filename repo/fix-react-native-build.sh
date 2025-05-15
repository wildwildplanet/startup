#!/bin/bash
set -e

# Step 1: Ensure you are in the project root
echo "[Step 1] Checking for package.json..."
if [ ! -f package.json ]; then
  echo "Run this script from your project root (where package.json is)."
  exit 1
fi

# Step 2: Clean node_modules, android/.gradle, and android/build
echo "[Step 2] Removing node_modules, android/.gradle, android/build..."
rm -rf node_modules android/.gradle android/build

# Step 3: Install node dependencies
echo "[Step 3] Installing npm dependencies..."
npm install

# Step 4: Clean Gradle
cd android
echo "[Step 4] Running Gradle clean..."
./gradlew clean

# Step 5: Assemble release APK
echo "[Step 5] Building release APK..."
./gradlew assembleRelease -Preact.internal.disableJavaVersionAlignment=true

echo "\nAll done! Check for errors above. If the build still fails, consider upgrading to React Native 0.77.x for best compatibility with the new Java toolchain."
