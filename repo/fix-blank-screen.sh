#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting troubleshooting for blank screen...${NC}\n"

# Step 1: Install or verify web-related dependencies
echo -e "${YELLOW}Step 1: Installing web-related dependencies...${NC}"
npx expo install react-dom react-native-web
echo -e "${GREEN}✓ Dependencies installed${NC}\n"

# Step 2: Clear cache
echo -e "${YELLOW}Step 2: Clearing cache...${NC}"
rm -rf node_modules/.cache
rm -rf .expo
echo -e "${GREEN}✓ Cache cleared${NC}\n"

# Step 3: Navigate to debug page
echo -e "${YELLOW}Step 3: Starting Expo server...${NC}"
echo -e "${GREEN}Once loaded, visit: http://localhost:3000/debug${NC}"
echo -e "${GREEN}If debug page works but test page doesn't, the issue is with Supabase connection${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop the server when finished${NC}\n"

# Start the development server
npm run web 