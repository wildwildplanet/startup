#!/usr/bin/env sh
set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
KEYSTORE_PATH="$SCRIPT_DIR/android/keystores/my-upload-key-keystore.jks"
: ${KEYSTORE_PASSWORD:=keystorePass}
: ${KEY_ALIAS:=my-upload-key}
: ${KEY_PASSWORD:=keyPass}

# Patch RNUnityAdsModule.java import to AndroidX
echo "Patching RNUnityAdsModule.java import..."
sed -i '' 's|import android.support.annotation.Nullable;|import androidx.annotation.Nullable;|' node_modules/react-native-unity-ads/android/src/main/java/me/th0th/rnunityads/RNUnityAdsModule.java

# Remove faulty @Override annotations in RNUnityAdsPackage
echo "Removing incorrect @Override annotations..."
sed -i '' '/@Override/d' node_modules/react-native-unity-ads/android/src/main/java/me/th0th/rnunityads/RNUnityAdsPackage.java

# Patch react-native-unity-ads to fix Gradle 'compile' → 'implementation'
echo "Patching react-native-unity-ads build.gradle..."
sed -i '' 's/compile /implementation /g' node_modules/react-native-unity-ads/android/build.gradle

# Ensure Android SDK path is set for Gradle
echo "Setting Android SDK path..."
mkdir -p android
printf "sdk.dir=%s
" "${HOME}/Library/Android/sdk" > android/local.properties

# Export SDK environment variables
export ANDROID_SDK_ROOT="${HOME}/Library/Android/sdk"
export ANDROID_HOME="${ANDROID_SDK_ROOT}"

echo "🛠  Building Android App Bundle (AAB)..."
cd android
./gradlew clean bundleRelease

echo "🛠 Signing AAB with release key..."
if [ -z "$KEYSTORE_PATH" ] || [ -z "$KEYSTORE_PASSWORD" ] || [ -z "$KEY_ALIAS" ] || [ -z "$KEY_PASSWORD" ]; then
  echo "ERROR: KEYSTORE_PATH, KEYSTORE_PASSWORD, KEY_ALIAS, and KEY_PASSWORD must be set"
  exit 1
fi
if [ ! -f "$KEYSTORE_PATH" ]; then
  echo "ERROR: Keystore file not found at $KEYSTORE_PATH"
  exit 1
fi
echo "🛠 Cleaning existing signature entries from AAB..."
zip -q -d "app/build/outputs/bundle/release/app-release.aab" "META-INF/*.SF" "META-INF/*.RSA" "META-INF/*.DSA"
jarsigner -storetype PKCS12 -verbose -sigalg SHA256withRSA -digestalg SHA-256 -keystore "$KEYSTORE_PATH" -storepass "$KEYSTORE_PASSWORD" -keypass "$KEY_PASSWORD" "app/build/outputs/bundle/release/app-release.aab" "$KEY_ALIAS"
echo "✅ AAB signed with release key"

AAB_PATH="app/build/outputs/bundle/release/app-release.aab"
echo "✅ AAB ready at android/$AAB_PATH"
