#!/bin/bash
set -e

# Step 1: Ensure you are in the project root
echo "[Step 1] Checking for package.json..."
if [ ! -f package.json ]; then
  echo "Run this script from your project root (where package.json is)."
  exit 1
fi

# Step 2: Restore android/build.gradle for RN 0.77.x and Gradle 7.6.4
echo "[Step 2] Restoring android/build.gradle..."
cat > android/build.gradle <<'EOF'
// Top-level build file where you can add configuration options common to all sub-projects/modules.

buildscript {
    ext {
        buildToolsVersion = "35.0.0"
        minSdkVersion = 24
        compileSdkVersion = 34
        targetSdkVersion = 34
        kotlinVersion = "1.9.22"
        ndkVersion = "26.1.10909125"
    }
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath("com.android.tools.build:gradle:7.4.2")
        classpath("com.facebook.react:react-native-gradle-plugin:0.77.0")
        classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlinVersion")
    }
}

apply plugin: "com.facebook.react.rootproject"

allprojects {
    repositories {
        maven {
            // All of React Native (JS, Obj-C sources, Android binaries) is installed from npm
            url(new File(['node', '--print', "require.resolve('react-native/package.json')"].execute(null, rootDir).text.trim(), '../android'))
        }
        mavenCentral()
        google()
        maven { url 'https://www.jitpack.io' }
    }
}
EOF

# Step 3: Update react-native version in package.json to 0.77.0
echo "[Step 3] Updating react-native to 0.77.0 in package.json..."
npm pkg set react-native=0.77.0

# Step 4: Clean node_modules, android/.gradle, and android/build
echo "[Step 4] Removing node_modules, android/.gradle, android/build..."
rm -rf node_modules android/.gradle android/build

# Step 5: Install node dependencies
echo "[Step 5] Installing npm dependencies..."
npm install

# Step 6: Clean Gradle
cd android
echo "[Step 6] Running Gradle clean..."
./gradlew clean

# Step 7: Assemble release APK
echo "[Step 7] Building release APK..."
./gradlew assembleRelease -Preact.internal.disableJavaVersionAlignment=true

echo "\nAll done! Check for errors above. If the build still fails, check for manual migration steps in the React Native 0.77 release notes."
