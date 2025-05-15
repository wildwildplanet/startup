#!/usr/bin/env bash
# rotate_and_zero_touch_automated.sh
# Automatically rotates remote upload keystore via Expect, then runs zero-touch build & submit

set -euo pipefail

# Check for Expect
if ! command -v expect &>/dev/null; then
  echo "Please install 'expect' (e.g. brew install expect) to automate EAS CLI interactions."
  exit 1
fi

KEYSTORE_PATH="android/keystores/my-upload-key-keystore.jks"

# Prompt for credentials
read -s -p "Enter keystore password: " KEYSTORE_PASSWORD; echo
read -p  "Enter key alias (default my-upload-key): " KEY_ALIAS
KEY_ALIAS=${KEY_ALIAS:-my-upload-key}
read -s -p "Enter key password (default same as keystore password): " KEY_PASSWORD; echo
KEY_PASSWORD=${KEY_PASSWORD:-$KEYSTORE_PASSWORD}

echo "🔄 Rotating upload keystore on EAS using $KEYSTORE_PATH"
# Generate temporary Expect script
TMP_EXPECT=$(mktemp)
cat > "$TMP_EXPECT" << 'EOF'
#!/usr/bin/expect -f
set timeout -1
spawn eas credentials --platform android
expect "Which build profile do you want to configure?"
send "production\r"
expect "What do you want to do?"
send "Manage your Keystore\r"
expect "What do you want to do?"
send "Rotate upload keystore\r"
expect "Upload Keystore"
send "Upload Keystore\r"
expect "Path to the Keystore file"
send "$KEYSTORE_PATH\r"
expect "Keystore password"
send "$KEYSTORE_PASSWORD\r"
expect "Key alias"
send "$KEY_ALIAS\r"
expect "Key password"
send "$KEY_PASSWORD\r"
expect "Do you want to set this as your default"
send "yes\r"
expect eof
EOF
chmod +x "$TMP_EXPECT"
# Run Expect script (inherits environment variables)
expect "$TMP_EXPECT"
# Clean up
rm "$TMP_EXPECT"

# Now run zero-touch build & submit
echo "🚀 Starting zero-touch build & submit"
./zero_touch_build.sh
