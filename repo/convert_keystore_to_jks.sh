#!/usr/bin/env bash
# convert_keystore_to_jks.sh
# Convert PKCS12 keystore to JKS format for EAS compatibility

set -euo pipefail

echo "Using keystore: android/keystores/my-upload-key-keystore.jks"
# Load defaults if not set
: ${KEYSTORE_PASSWORD:=keystorePass}
: ${KEY_ALIAS:=my-upload-key}
: ${KEY_PASSWORD:=keyPass}

# Prompt for credentials if defaults are not overridden
if [ "${KEYSTORE_PASSWORD}" = "keystorePass" ]; then
  read -s -p "Enter keystore password: " KEYSTORE_PASSWORD; echo
fi
if [ "${KEY_ALIAS}" = "my-upload-key" ]; then
  read -p "Enter key alias (default ${KEY_ALIAS}): " input_alias
  KEY_ALIAS=${input_alias:-$KEY_ALIAS}
fi
if [ "${KEY_PASSWORD}" = "keyPass" ]; then
  read -s -p "Enter key password (default same as keystore password): " input_keypass; echo
  KEY_PASSWORD=${input_keypass:-$KEYSTORE_PASSWORD}
fi

SRC="android/keystores/my-upload-key-keystore.jks"
BACKUP="${SRC}.bak"

echo "Backing up original keystore to ${BACKUP}..."
cp "${SRC}" "${BACKUP}"

echo "Converting '${SRC}' from PKCS12 to JKS..."
keytool -importkeystore \
  -srckeystore "${SRC}" \
  -srcstoretype PKCS12 \
  -srcstorepass "${KEYSTORE_PASSWORD}" \
  -srckeypass "${KEY_PASSWORD}" \
  -srcalias "${KEY_ALIAS}" \
  -destkeystore "${SRC}" \
  -deststoretype JKS \
  -deststorepass "${KEYSTORE_PASSWORD}" \
  -destkeypass "${KEY_PASSWORD}" \
  -destalias "${KEY_ALIAS}" \
  -noprompt

echo "Conversion complete. Original backed up at ${BACKUP}."
