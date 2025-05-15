#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored header
echo -e "\n${BLUE}======================================${NC}"
echo -e "${BLUE}   Startup Pitch Challenge Test Tool   ${NC}"
echo -e "${BLUE}======================================${NC}\n"

# Function to check and install missing dependencies
check_dependencies() {
  echo -e "${YELLOW}Checking for required dependencies...${NC}"
  
  # Check for react-native-web
  if ! grep -q "\"react-native-web\"" package.json; then
    echo -e "${RED}Missing react-native-web dependency${NC}"
    echo -e "${YELLOW}Installing react-native-web...${NC}"
    npx expo install react-native-web
    echo -e "${GREEN}✓ Installed react-native-web${NC}"
  else
    echo -e "${GREEN}✓ react-native-web is installed${NC}"
  fi

  # Check for AsyncStorage
  if ! grep -q "\"@react-native-async-storage/async-storage\"" package.json; then
    echo -e "${RED}Missing @react-native-async-storage/async-storage dependency${NC}"
    echo -e "${YELLOW}Installing @react-native-async-storage/async-storage...${NC}"
    npx expo install @react-native-async-storage/async-storage
    echo -e "${GREEN}✓ Installed @react-native-async-storage/async-storage${NC}"
  else
    echo -e "${GREEN}✓ @react-native-async-storage/async-storage is installed${NC}"
  fi

  # Check for Supabase JS client
  if ! grep -q "\"@supabase/supabase-js\"" package.json; then
    echo -e "${RED}Missing @supabase/supabase-js dependency${NC}"
    echo -e "${YELLOW}Installing @supabase/supabase-js...${NC}"
    npm install @supabase/supabase-js
    echo -e "${GREEN}✓ Installed @supabase/supabase-js${NC}"
  else
    echo -e "${GREEN}✓ @supabase/supabase-js is installed${NC}"
  fi

  echo -e "${GREEN}All required dependencies are installed!${NC}\n"
}

# Function to validate Supabase credentials in supabaseClient.ts
validate_supabase_config() {
  echo -e "${YELLOW}Validating Supabase configuration...${NC}"
  
  if [ -f "./lib/supabase/supabaseClient.ts" ]; then
    # Check if supabaseUrl and supabaseAnonKey are properly defined
    URL_DEFINED=$(grep -c "supabaseUrl = " ./lib/supabase/supabaseClient.ts)
    KEY_DEFINED=$(grep -c "supabaseAnonKey = " ./lib/supabase/supabaseClient.ts)
    
    if [ $URL_DEFINED -eq 0 ] || [ $KEY_DEFINED -eq 0 ]; then
      echo -e "${RED}⚠️ Supabase configuration incomplete! Please check lib/supabase/supabaseClient.ts${NC}"
      echo -e "${YELLOW}Make sure supabaseUrl and supabaseAnonKey are properly defined${NC}"
    else
      echo -e "${GREEN}✓ Supabase configuration found${NC}"
    fi
  else
    echo -e "${RED}⚠️ Supabase client file not found at expected location!${NC}"
    echo -e "${YELLOW}Expected at: ./lib/supabase/supabaseClient.ts${NC}"
  fi
  
  echo ""
}

# Function to create a simple test component if not exists
ensure_test_route() {
  echo -e "${YELLOW}Ensuring test route exists...${NC}"
  
  # Check if test.tsx exists
  if [ ! -f "./app/test.tsx" ]; then
    echo -e "${YELLOW}Creating test route at app/test.tsx...${NC}"
    
    mkdir -p ./app
    
    cat > ./app/test.tsx << 'EOF'
import React from 'react';
import { SafeAreaView, View } from 'react-native';
import { SupabaseTest } from '../components/common/SupabaseTest';
import { Button, Text } from 'react-native-paper';
import { Link } from 'expo-router';

export default function TestPage() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
        <Link href="/" asChild>
          <Button mode="outlined" style={{ marginBottom: 16 }}>
            Back to Home
          </Button>
        </Link>
        <Text variant="headlineMedium" style={{ marginBottom: 16, textAlign: 'center' }}>
          Supabase Connection Test
        </Text>
      </View>
      <SupabaseTest />
    </SafeAreaView>
  );
}
EOF
    echo -e "${GREEN}✓ Created test route${NC}"
  else
    echo -e "${GREEN}✓ Test route exists${NC}"
  fi
  
  echo ""
}

# Function to clear cache and rebuild
clean_and_rebuild() {
  echo -e "${YELLOW}Cleaning project cache...${NC}"
  
  # Remove node_modules/.cache
  if [ -d "node_modules/.cache" ]; then
    rm -rf node_modules/.cache
    echo -e "${GREEN}✓ Cleared node_modules/.cache${NC}"
  fi
  
  # Remove .expo folder
  if [ -d ".expo" ]; then
    rm -rf .expo
    echo -e "${GREEN}✓ Cleared .expo cache${NC}"
  fi
  
  # Clear Metro bundler cache
  npx expo start --clear
  pkill -f "expo"
  
  echo -e "${GREEN}Cache cleared successfully!${NC}\n"
}

# Main execution
main() {
  # Step 1: Check dependencies
  check_dependencies
  
  # Step 2: Validate Supabase configuration
  validate_supabase_config
  
  # Step 3: Ensure test route exists
  ensure_test_route
  
  # Step 4: Clean and rebuild if requested
  if [[ "$1" == "--clean" ]]; then
    clean_and_rebuild
  fi
  
  # Step 5: Start the application
  echo -e "${YELLOW}Starting the application...${NC}"
  echo -e "${GREEN}Once loaded, visit: http://localhost:3000/test${NC}"
  echo -e "${BLUE}Press Ctrl+C to stop the application${NC}\n"
  
  npm run web
}

# Run main function with all arguments passed to the script
main "$@" 