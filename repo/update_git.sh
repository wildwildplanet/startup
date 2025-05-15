#!/bin/bash
set -e

echo "Updating git repository..."

# Copy files from parent directory
cp ../package.json .
cp ../appcircle.yml .

# Add all changes
git add .

# Commit changes
git commit -m "fix: update Unity Ads version and add AppCircle config"

# Push to remote
git push origin main

echo "Git repository updated successfully!"
