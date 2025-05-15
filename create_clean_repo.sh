#!/usr/bin/env bash
set -e

# Path definitions
ROOT_DIR=$(pwd)
CLEAN_DIR="$ROOT_DIR/repo_clean"

# Remove any existing clean directory
rm -rf "$CLEAN_DIR"
mkdir -p "$CLEAN_DIR"

echo "Copying allowed files to clean repo..."
rsync -av --progress \
  --exclude 'android' \
  --exclude 'ios' \
  --exclude 'scripts' \
  --exclude '.git' \
  --exclude 'db/populate_startups.py' \
  --exclude 'appcircle-ssh*' \
  --exclude '.env*' \
  "$ROOT_DIR/" "$CLEAN_DIR/"

# Initialize new git repo
cd "$CLEAN_DIR"
git init

# Add remote and push
REMOTE_URL="https://github.com/wildwildplanet/startup.git"
git remote add origin "$REMOTE_URL"
git checkout -b main
git add .
git commit -m "chore: initial clean push (excludes native folders & secrets)"
git push -f origin main

echo "Clean repo pushed to 'main' on origin."
