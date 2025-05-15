#!/usr/bin/env bash
set -euo pipefail

# build_release.sh: configure Java 11 and build Android release APK

echo "=== Checking for Java 11 ==="
JAVA11_HOME=$(/usr/libexec/java_home -v 11 2>/dev/null || true)
if [ -z "$JAVA11_HOME" ]; then
  echo "Error: Java 11 not found. Install via: brew install openjdk@11"
  exit 1
fi
export JAVA_HOME="$JAVA11_HOME"
echo "JAVA_HOME set to $JAVA_HOME"
echo

echo "=== Java Version ==="
java -version
echo

echo "=== Running Gradle Build ==="
# Navigate to android folder
cd "$(dirname "$0")/android"
# Use wrapper and disable Java version alignment
./gradlew clean assembleRelease -Preact.internal.disableJavaVersionAlignment=true

echo "=== Build Finished ==="
