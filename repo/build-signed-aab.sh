#!/usr/bin/env sh
set -e

# Build and sign AAB using the upload keystore
# Customize these if needed or set env vars before running.
: ${KEYSTORE_PATH:="$(pwd)/android/keystores/my-upload-key-keystore.jks"}
: ${KEYSTORE_PASSWORD:="keystorePass"}
: ${KEY_ALIAS:="my-upload-key"}
: ${KEY_PASSWORD:="keyPass"}

echo "Using keystore: $KEYSTORE_PATH"

# Ensure build script is executable
chmod +x build-android-local.sh

# Run build and signing
KEYSTORE_PATH="$(pwd)/android/keystores/my-upload-key-keystore.jks" \
KEYSTORE_PASSWORD="${KEYSTORE_PASSWORD}" \
KEY_ALIAS="${KEY_ALIAS}" \
KEY_PASSWORD="${KEY_PASSWORD}" \
./build-android-local.sh
