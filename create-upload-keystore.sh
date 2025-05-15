#!/usr/bin/env sh
set -e

# Directory for keystore
KEYSTORE_DIR="android/keystores"
mkdir -p "$KEYSTORE_DIR"

# Default alias 'upload' if not provided
: ${KEY_ALIAS:="upload"}
KEYSTORE_PATH="$KEYSTORE_DIR/${KEY_ALIAS}-keystore.jks"

# If already exists, skip
if [ -f "$KEYSTORE_PATH" ]; then
  echo "✅ Keystore already exists: $KEYSTORE_PATH"
  exit 0
fi

# Check required env vars
if [ -z "$KEYSTORE_PASSWORD" ] || [ -z "$KEY_ALIAS" ] || [ -z "$KEY_PASSWORD" ]; then
  echo "ERROR: Please export KEYSTORE_PASSWORD, KEY_ALIAS, and KEY_PASSWORD before running."
  exit 1
fi

# Optional: distinguished name
: ${KEY_DNAME:="CN=Your Name, OU=Your Org Unit, O=Your Org, L=City, S=State, C=US"}

echo "🛠 Generating keystore at $KEYSTORE_PATH..."
keytool -genkeypair \
  -v \
  -keystore "$KEYSTORE_PATH" \
  -alias "$KEY_ALIAS" \
  -keyalg RSA -keysize 2048 \
  -validity 10000 \
  -storepass "$KEYSTORE_PASSWORD" \
  -keypass "$KEY_PASSWORD" \
  -dname "$KEY_DNAME"

echo "✅ Created keystore: $KEYSTORE_PATH"
