#!/bin/bash
set -e

# Step 1: Ensure you are in the project root
echo "[Step 1] Checking for package.json..."
if [ ! -f package.json ]; then
  echo "Run this script from your project root (where package.json is)."
  exit 1
fi

# Step 2: Ensure version alignment (default to 0.77.0, user can edit if needed)
RN_VERSION="0.77.0"
echo "[Step 2] Setting react-native version to $RN_VERSION in package.json and android/build.gradle..."
npm pkg set react-native=$RN_VERSION
sed -i.bak "s/com.facebook.react:react-native-gradle-plugin:[0-9.\-]*/com.facebook.react:react-native-gradle-plugin:$RN_VERSION/" android/build.gradle

# Step 3: Remove node_modules, android/.gradle, android/build
echo "[Step 3] Removing node_modules, android/.gradle, android/build..."
rm -rf node_modules android/.gradle android/build

# Step 4: Install node dependencies
echo "[Step 4] Installing npm dependencies..."
npm install

# Step 5: Patch only java { targetCompatibility = JavaVersion.VERSION_11 } in plugin, leave kotlin toolchain active
FILES=(
  "node_modules/@react-native/gradle-plugin/react-native-gradle-plugin/build.gradle.kts"
  "node_modules/@react-native/gradle-plugin/shared/build.gradle.kts"
  "node_modules/@react-native/gradle-plugin/settings-plugin/build.gradle.kts"
  "node_modules/@react-native/gradle-plugin/shared-testutil/build.gradle.kts"
)
echo "[Step 5] Patching Java compatibility in plugin files..."
for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    sed -i.bak '/java { *targetCompatibility *= *JavaVersion.VERSION_11 *}/s/^/\/\//' "$file"
  fi
done

# Step 6: Clean Gradle and build
echo "[Step 6] Running Gradle clean and assembleRelease..."
cd android
./gradlew clean
./gradlew assembleRelease -Preact.internal.disableJavaVersionAlignment=true

echo "\nAll done! If you see plugin source errors, try downgrading to react-native 0.76.8 in both package.json and android/build.gradle, then re-run this script."
