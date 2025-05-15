import 'react-native-url-polyfill/auto';
import { useEffect, useState } from 'react';
import { Slot, Stack, useRouter, useSegments } from 'expo-router';
import { useStore } from '../lib/store/useStore';
import { SupabaseProvider, useSupabase } from '../lib/supabase/SupabaseProvider';
import { View, ActivityIndicator, Platform } from 'react-native';
import { PaperProvider, MD3DarkTheme } from 'react-native-paper';

// Dynamically require UnityAds to prevent errors in Expo Go
let UnityAds: typeof import('react-native-unity-ads') | null;
try {
  UnityAds = require('react-native-unity-ads');
} catch {
  UnityAds = null;
}

// Custom Paper theme
const theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#6750A4',
    background: '#1C1B1F',
  },
};

// Auth context provider
function RootLayoutNav() {
  const { session, isLoading } = useSupabase();
  const segments = useSegments();
  const router = useRouter();
  
  // Get store for initial data loading
  const loadStartups = useStore(state => state.loadStartups);

  // Effect to manage authentication state
  useEffect(() => {
    if (isLoading) return;

    // Handle auth state changes
    const inAuthGroup = segments[0] === 'auth';

    if (!session && !inAuthGroup) {
      // If not logged in and not in auth group, redirect to login
      router.replace('/auth/login');
    } else if (session && inAuthGroup) {
      // If logged in and in auth group, redirect to home
      router.replace('/tabs/home');
    }
  }, [session, segments, isLoading]);

  // On mount, try to load startup data
  useEffect(() => {
    if (session) {
      // Load real data when authenticated
      loadStartups();
    }
  }, [session]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0A66C2" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen 
        name="auth" 
        options={{ 
          headerShown: false,
          animation: 'fade',
        }} 
      />
      <Stack.Screen
        name="tabs"
        options={{
          headerShown: false,
          animation: 'fade',
        }}
      />
      <Stack.Screen
        name="modals"
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
    </Stack>
  );
}

// Main app layout
export default function AppLayout() {
  useEffect(() => {
    if (UnityAds?.initialize) {
      const gameId = Platform.OS === 'ios' ? '5838972' : '5838973';
      UnityAds.initialize(gameId, true);
    }
  }, []);
  return (
    <SupabaseProvider>
      <PaperProvider theme={theme}>
        <RootLayoutNav />
      </PaperProvider>
    </SupabaseProvider>
  );
} 