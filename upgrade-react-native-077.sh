#!/bin/bash
set -e

# Step 1: Ensure you are in the project root
echo "[Step 1] Checking for package.json..."
if [ ! -f package.json ]; then
  echo "Run this script from your project root (where package.json is)."
  exit 1
fi

# Step 2: Update react-native version in package.json to 0.77.0
echo "[Step 2] Updating react-native to 0.77.0 in package.json..."
npm pkg set react-native=0.77.0

# Step 3: Clean node_modules, android/.gradle, and android/build
echo "[Step 3] Removing node_modules, android/.gradle, android/build..."
rm -rf node_modules android/.gradle android/build

# Step 4: Install node dependencies
echo "[Step 4] Installing npm dependencies..."
npm install

# Step 5: Update Gradle plugin version in android/build.gradle
echo "[Step 5] Updating Gradle plugin version in android/build.gradle..."
sed -i.bak 's/com.facebook.react:react-native-gradle-plugin:[0-9.\-]*/com.facebook.react:react-native-gradle-plugin:0.77.0/' android/build.gradle

# Step 6: Clean Gradle
cd android
echo "[Step 6] Running Gradle clean..."
./gradlew clean

# Step 7: Assemble release APK
echo "[Step 7] Building release APK..."
./gradlew assembleRelease -Preact.internal.disableJavaVersionAlignment=true

echo "\nAll done! Check for errors above. If the build still fails, check for manual migration steps in the React Native 0.77 release notes."
