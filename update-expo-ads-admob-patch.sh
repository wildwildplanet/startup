#!/usr/bin/env bash
set -euo pipefail

# Navigate to script directory (project root)
cd "$(dirname "$0")"

# 1. Remove existing expo-ads-admob patch
echo "Removing old expo-ads-admob patch..."
rm -f patches/expo-ads-admob+12.0.1.patch

# 2. Apply sed fix to build.gradle
echo "Applying sed fix to expo-ads-admob build.gradle..."
sed -i '' "s/^\(\s*\)classifier = 'sources'/\1archiveClassifier.set('sources')/" node_modules/expo-ads-admob/android/build.gradle

# 3. Regenerate the patch with patch-package
echo "Regenerating patch-package patch..."
npx patch-package expo-ads-admob

# 4. Fix expo-modules-core patch header
echo "Fixing expo-modules-core patch header..."
sed -i '' \
  -e 's|^diff --git a/node_modules/expo-modules-core/android/ExpoModulesCorePlugin.gradle b/node_modules/expo-modules-core/android/ExpoModulesCorePlugin.gradle|diff --git a/android/ExpoModulesCorePlugin.gradle b/android/ExpoModulesCorePlugin.gradle|' \
  -e 's|^--- a/node_modules/expo-modules-core/android/ExpoModulesCorePlugin.gradle|--- a/android/ExpoModulesCorePlugin.gradle|' \
  -e 's|^+++ b/node_modules/expo-modules-core/android/ExpoModulesCorePlugin.gradle|+++ b/android/ExpoModulesCorePlugin.gradle|' \
  patches/expo-modules-core+2.2.3.patch

echo "Done. Expo-modules-core patch header fixed."

echo "Done. New patch located at patches/expo-ads-admob+12.0.1.patch"
