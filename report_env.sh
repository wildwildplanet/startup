#!/usr/bin/env bash
# report_env.sh: prints Java and Gradle environment info

echo "Current Directory: $(pwd)"

echo "Java Version:"
java -version 2>&1

echo

echo "JAVA_HOME: $JAVA_HOME"

echo

# Check for Gradle wrapper
echo "Gradle Wrapper (gradlew):"
if [ -f gradlew ]; then
  ls -l gradlew
else
  echo "  not found in $(pwd)"
fi
