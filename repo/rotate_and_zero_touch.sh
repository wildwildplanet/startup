#!/usr/bin/env bash
# rotate_and_zero_touch.sh
# Rotates the remote upload keystore to your local JKS, then runs zero-touch build & submit

set -euo pipefail

# Path to your local keystore
KEYSTORE_PATH="android/keystores/my-upload-key-keystore.jks"

# Prompt for keystore credentials
read -s -p "Enter keystore password: " KEYSTORE_PASSWORD; echo
read -p  "Enter key alias (default my-upload-key): " KEY_ALIAS
KEY_ALIAS=${KEY_ALIAS:-my-upload-key}
read -s -p "Enter key password (default same as keystore password): " KEY_PASSWORD; echo
KEY_PASSWORD=${KEY_PASSWORD:-$KEYSTORE_PASSWORD}

echo "🔄 Rotating upload keystore on EAS to use $KEYSTORE_PATH"
# Feed answers to EAS CLI
(echo production
 echo Manage\ your\ Keystore
 echo Rotate\ upload\ keystore
 echo Upload\ Keystore
 echo "$KEYSTORE_PATH"
 echo "$KEYSTORE_PASSWORD"
 echo "$KEY_ALIAS"
 echo "$KEY_PASSWORD"
 echo yes) | eas credentials --platform android

# Run zero-touch build
echo "🚀 Running zero-touch build & submit"
./zero_touch_build.sh
