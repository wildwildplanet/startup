#!/bin/bash
set -e

# Patch all known problematic lines in the React Native Gradle plugin (node_modules)

FILES=(
  "node_modules/@react-native/gradle-plugin/react-native-gradle-plugin/build.gradle.kts"
  "node_modules/@react-native/gradle-plugin/shared/build.gradle.kts"
  "node_modules/@react-native/gradle-plugin/settings-plugin/build.gradle.kts"
  "node_modules/@react-native/gradle-plugin/shared-testutil/build.gradle.kts"
)

echo "[Patch] Commenting out java { targetCompatibility = JavaVersion.VERSION_11 } and kotlin { jvmToolchain(17) } in Gradle plugin files..."
for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    sed -i.bak \
      -e '/java { *targetCompatibility *= *JavaVersion.VERSION_11 *}/s/^/\/\//' \
      -e '/kotlin { *jvmToolchain(17) *}/s/^/\/\//' \
      "$file"
  fi
done

# Patch the Foojay resolver plugin in settings.gradle.kts
SETTINGS_FILE="node_modules/@react-native/gradle-plugin/settings.gradle.kts"
if [ -f "$SETTINGS_FILE" ]; then
  sed -i.bak '/plugins {.*foojay-resolver-convention.*/s/^/\/\//' "$SETTINGS_FILE"
fi

echo "[Patch] Done. If you re-install node_modules, re-run this script."
