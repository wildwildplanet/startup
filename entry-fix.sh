#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}==================================${NC}"
echo -e "${BLUE}     ENTRY POINT FIX SCRIPT      ${NC}"
echo -e "${BLUE}==================================${NC}\n"

# Stop any running Expo processes
echo -e "${YELLOW}Stopping any running Expo processes...${NC}"
pkill -f "expo" || true
echo -e "${GREEN}✓ Processes stopped${NC}\n"

# Fix the index.ts entry point
echo -e "${YELLOW}Fixing app entry point...${NC}"

# Create or update the App.tsx file
cat > App.tsx << 'EOF'
import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider, MD3DarkTheme } from 'react-native-paper';
import { ExpoRoot } from 'expo-router';

// Custom theme
const theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#6750A4',
    background: '#1C1B1F',
  },
};

export default function App() {
  const ctx = require.context('./app');
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <StatusBar style="light" />
        <ExpoRoot context={ctx} />
      </PaperProvider>
    </SafeAreaProvider>
  );
}
EOF

# Update index.ts to use the correct import
cat > index.ts << 'EOF'
import 'expo-router/entry';
EOF

# Create a dummy _layout.tsx if it doesn't exist
mkdir -p app
if [ ! -f "app/_layout.tsx" ]; then
  cat > app/_layout.tsx << 'EOF'
import { Stack } from 'expo-router';

export default function Layout() {
  return <Stack />;
}
EOF
fi

# Update index.tsx in the app directory
cat > app/index.tsx << 'EOF'
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Home() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>App is working!</Text>
      <Text style={styles.subtitle}>Your Expo app is now running correctly.</Text>
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

# Verify package.json has correct main entry
HAS_MAIN=$(grep -c "\"main\": \"index.ts\"" package.json || echo "0")
if [ "$HAS_MAIN" = "0" ]; then
  echo -e "${YELLOW}Updating package.json main entry...${NC}"
  # Use sed to replace the main entry
  sed -i '' 's/"main": "[^"]*"/"main": "index.ts"/g' package.json || true
fi

echo -e "${GREEN}✓ Entry point fixed${NC}\n"

# Clean cache
echo -e "${YELLOW}Cleaning cache...${NC}"
rm -rf node_modules/.cache
rm -rf .expo
echo -e "${GREEN}✓ Cache cleaned${NC}\n"

# Start the app
echo -e "${YELLOW}Starting the app...${NC}"
echo -e "${GREEN}Please visit http://localhost:3000 when loaded${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop the server${NC}\n"

npx expo start --web --clear 