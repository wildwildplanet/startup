#!/usr/bin/env bash
# regenerate_unity_ads_patch.sh
# Reapply fixes and regenerate patch-package file for react-native-unity-ads

set -euo pipefail

echo "Patching React Native Unity Ads module..."
# Update import and remove @Override annotations
sed -i.bak \
  -e 's|import android.support.annotation.Nullable;|import androidx.annotation.Nullable;|' \
  -e '/@Override/d' \
  node_modules/react-native-unity-ads/android/src/main/java/me/th0th/rnunityads/RNUnityAdsModule.java

# Switch 'compile' to 'implementation' in Gradle
echo "Patching build.gradle for Unity Ads..."
sed -i.bak 's/compile /implementation /g' \
  node_modules/react-native-unity-ads/android/build.gradle

# Regenerate patch file
echo "Regenerating patch-package patch..."
npx patch-package react-native-unity-ads

echo "✅ Patch regenerated: patches/react-native-unity-ads+*.patch"
echo "Backup files (*.bak) created; remove them if not needed."
