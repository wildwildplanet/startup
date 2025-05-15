#!/bin/bash
set -e

# Step 1: Ensure you are in the project root
echo "[Step 1] Checking for package.json..."
if [ ! -f package.json ]; then
  echo "Run this script from your project root (where package.json is)."
  exit 1
fi

# Step 2: Set React Native version to 0.76.7 in package.json and android/build.gradle
RN_VERSION="0.76.7"
echo "[Step 2] Setting react-native version to $RN_VERSION in package.json and android/build.gradle..."
npm pkg set react-native=$RN_VERSION
sed -i.bak "s/com.facebook.react:react-native-gradle-plugin:[0-9.\-]*/com.facebook.react:react-native-gradle-plugin:$RN_VERSION/" android/build.gradle

# Step 3: Remove node_modules, android/.gradle, android/build
echo "[Step 3] Removing node_modules, android/.gradle, android/build..."
rm -rf node_modules android/.gradle android/build

# Step 4: Clean npm cache and use official registry
echo "[Step 4] Cleaning npm cache and setting registry..."
npm cache clean --force
npm config set registry https://registry.npmjs.org/

# Step 5: Install node dependencies
echo "[Step 5] Installing npm dependencies..."
npm install

# Step 6: Patch only java { targetCompatibility = JavaVersion.VERSION_11 } in plugin, leave kotlin toolchain active
FILES=(
  "node_modules/@react-native/gradle-plugin/react-native-gradle-plugin/build.gradle.kts"
  "node_modules/@react-native/gradle-plugin/shared/build.gradle.kts"
  "node_modules/@react-native/gradle-plugin/settings-plugin/build.gradle.kts"
  "node_modules/@react-native/gradle-plugin/shared-testutil/build.gradle.kts"
)
echo "[Step 6] Patching Java compatibility in plugin files..."
for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    sed -i.bak '/java { *targetCompatibility *= *JavaVersion.VERSION_11 *}/s/^/\/\//' "$file"
  fi
done

# Step 7: Clean Gradle and build
echo "[Step 7] Running Gradle clean and assembleRelease..."
cd android
./gradlew clean
./gradlew assembleRelease -Preact.internal.disableJavaVersionAlignment=true

echo "\nAll done! If you still see plugin source errors, please report the issue to the React Native team."
