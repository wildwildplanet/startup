import React from 'react';
import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { Ionicons, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';
import { useStore } from '../../lib/store/useStore';

// Dynamically import UnityAds to prevent errors in Expo Go
let UnityAds: typeof import('react-native-unity-ads') | null = null;
if (Platform.OS !== 'web') {
  try {
    UnityAds = require('react-native-unity-ads');
  } catch (e) {
    console.warn('Unity Ads not available:', e);
  }
}

export default function TabsLayout() {
  const theme = useTheme();
  const simulateMarket = useStore(state => state.simulateMarket);
  const loadStartups = useStore(state => state.loadStartups);

  // Initialize Unity Ads
  useEffect(() => {
    const initUnityAds = async () => {
      if (UnityAds?.initialize) {
        try {
          const gameId = Platform.OS === 'ios' ? '5838972' : '5838973';
          await UnityAds.initialize(gameId, true);
          console.log('Unity Ads initialized successfully');
        } catch (error) {
          console.error('Unity Ads initialization failed:', error);
          // Retry initialization after delay
          setTimeout(initUnityAds, 5000);
        }
      }
    };

    if (Platform.OS !== 'web') {
      initUnityAds();
    }
  }, []);

  // Load startup catalog and run GBM market simulation
  useEffect(() => {
    loadStartups();
    simulateMarket();
    const id = setInterval(simulateMarket, 10000);
    return () => clearInterval(id);
  }, [loadStartups, simulateMarket]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: '#999999',
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopColor: '#333333',
        },
        tabBarLabelStyle: {
          fontSize: 12,
        },
        headerStyle: {
          backgroundColor: theme.colors.background,
        },
        headerTintColor: '#FFFFFF',
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Swipe',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="fire" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: 'Discover',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="compass" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="portfolio"
        options={{
          title: 'Portfolio',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="briefcase" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="balance"
        options={{
          title: 'Bank',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="currency-usd" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}