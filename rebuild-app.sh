#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}==================================${NC}"
echo -e "${BLUE}   COMPLETE APP REBUILD SCRIPT   ${NC}"
echo -e "${BLUE}==================================${NC}\n"

# Function to check if command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Stop any running Expo processes
echo -e "${YELLOW}Stopping any running Expo processes...${NC}"
if command_exists pkill; then
  pkill -f "expo" || true
fi
echo -e "${GREEN}✓ Processes stopped${NC}\n"

# Clear node_modules and reinstall
echo -e "${YELLOW}Removing node_modules and reinstalling dependencies...${NC}"
rm -rf node_modules
rm -rf .expo
rm -rf web-build
rm -f yarn.lock
rm -f package-lock.json

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
npm install

# Install specific web dependencies
echo -e "${YELLOW}Installing web-specific dependencies...${NC}"
npx expo install react-dom react-native-web
echo -e "${GREEN}✓ Dependencies installed${NC}\n"

# Ensure that babel.config.js has web support
echo -e "${YELLOW}Checking babel configuration...${NC}"
cat > babel.config.js << 'EOF'
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Required for expo-router
      'expo-router/babel',
      'react-native-reanimated/plugin',
    ],
  };
};
EOF
echo -e "${GREEN}✓ Babel config updated${NC}\n"

# Create a simple debug page
echo -e "${YELLOW}Creating debug page...${NC}"
mkdir -p app
cat > app/debug.tsx << 'EOF'
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function DebugPage() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Debug Page</Text>
      <Text style={styles.subtitle}>If you see this, basic rendering is working!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
});
EOF
echo -e "${GREEN}✓ Debug page created${NC}\n"

# Start development server
echo -e "${YELLOW}Starting development server...${NC}"
echo -e "${GREEN}When loaded, visit http://localhost:3000/debug to test${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop the server${NC}\n"

# Use expo start with clearing cache
npx expo start --web --clear 