#!/bin/bash
set -e

# Patch only the java { targetCompatibility = JavaVersion.VERSION_11 } lines, leave kotlin { jvmToolchain(17) } UNcommented
FILES=(
  "node_modules/@react-native/gradle-plugin/react-native-gradle-plugin/build.gradle.kts"
  "node_modules/@react-native/gradle-plugin/shared/build.gradle.kts"
  "node_modules/@react-native/gradle-plugin/settings-plugin/build.gradle.kts"
  "node_modules/@react-native/gradle-plugin/shared-testutil/build.gradle.kts"
)

echo "[Patch] Commenting out java { targetCompatibility = JavaVersion.VERSION_11 } ONLY, restoring kotlin { jvmToolchain(17) } if needed..."
for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    # Uncomment kotlin { jvmToolchain(17) } if commented
    sed -i.bak '/^[ 	]*\/\/[ 	]*kotlin { *jvmToolchain(17) *}/s#^//##' "$file"
    # Comment out java { targetCompatibility = JavaVersion.VERSION_11 }
    sed -i.bak '/java { *targetCompatibility *= *JavaVersion.VERSION_11 *}/s/^/\/\//' "$file"
  fi
done

echo "[Patch] Done. Try your build again. If you re-install node_modules, re-run this script."
