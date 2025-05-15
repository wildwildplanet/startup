import 'react-native-gesture-handler';
import { useState, useEffect, useCallback } from 'react';
import { View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { Asset } from 'expo-asset';
import * as Font from 'expo-font';
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

// Keep splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Preload images
        const images = [
          require('./assets/icon.png'),
          require('./assets/splash-icon.png'),
          require('./assets/adaptive-icon.png'),
        ];
        const imagePromises = images.map(img => Asset.loadAsync(img));
        // Preload custom fonts (add entries as needed)
        const fontPromises: Promise<any>[] = [
          // Font.loadAsync({ 'Roboto': require('native-base/Fonts/Roboto.ttf') }),
        ];
        await Promise.all([...imagePromises, ...fontPromises]);
      } catch (e) {
        console.warn('Error loading assets:', e);
      } finally {
        setAppIsReady(true);
      }
    }
    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }
  // @ts-ignore - require.context is added by Metro
  const ctx = require.context('./app');
  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <StatusBar style="light" />
          <ExpoRoot context={ctx} />
        </PaperProvider>
      </SafeAreaProvider>
    </View>
  );
}

// Default export for Expo
export default App;
