import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { Text, Button, Title, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useSupabase } from '../../lib/supabase/SupabaseProvider';
import { useStore, updateUserBalanceEverywhere } from '../../lib/store/useStore';
import { supabase } from '../../lib/supabase/supabaseClient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';

let UnityAds: any;
try {
  UnityAds = require('react-native-unity-ads');
} catch {
  UnityAds = null;
}

export default function BalanceScreen() {
  const theme = useTheme();
  const { session, isLoading: sessionLoading } = useSupabase();
  const router = useRouter();
  const storeUser = useStore(state => state.user);
  const balance = storeUser?.cashAvailable ?? 0;
  // throttle state must be defined before any early returns
  const [adCooldown, setAdCooldown] = useState<boolean>(false);

  // Redirect to login if unauthenticated
  useEffect(() => {
    if (!sessionLoading && !session) {
      router.replace('/auth/login');
    }
  }, [session, sessionLoading]);

  if (sessionLoading || !storeUser) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  const addBalance = async (amount: number) => {
    if (!storeUser?.id) return;
    const newBalance = storeUser.cashAvailable + amount;
    await updateUserBalanceEverywhere(storeUser.id, newBalance);
  };

  // Simple throttle: prevent multiple ad watches in a short time
  const handleWatchAd = async () => {
    if (adCooldown) return;
    setAdCooldown(true);
    try {
      if (UnityAds?.showAd) {
        const placementId = Platform.OS === 'ios' ? 'Rewarded_iOS' : 'Rewarded_Android';
        UnityAds.addListener('onUnityAdsFinish', (result: any) => {
          console.log('Unity ad finished with result:', result);
          addBalance(50000);
        });
        UnityAds.showAd(placementId, true);
      } else {
        console.warn('Unity Ads not available');
        addBalance(50000);
      }
    } catch (error) {
      console.error('Rewarded ad error:', error);
      addBalance(50000);
    } finally {
      setTimeout(() => setAdCooldown(false), 60000);
    }
  };

  // Use toLocaleString for currency formatting compatible with React Native
  const formatCurrency = (amt: number) =>
    amt.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    });

  return (
    <View style={styles.container}>
      <Title style={[styles.title, { color: '#FFFFFF' }]}> 
        <MaterialCommunityIcons name="bank-outline" size={24} color="#FFFFFF" style={{ marginRight: 8 }} />
        Balance
      </Title>
      <Text style={[styles.amount, { color: '#FFFFFF' }]}>{formatCurrency(balance)}</Text>
      <Text style={[styles.watchAdPrompt, { color: '#DDD' }]}>  
        {adCooldown
          ? 'Please wait 1 minute before watching another ad.'
          : 'Watch an ad to earn free balance!'}
      </Text>
      <View style={styles.buttonColumn}>
        <Button
          mode="contained"
          icon={() => <MaterialCommunityIcons name="video-outline" size={24} color="#FFFFFF" />}
          onPress={handleWatchAd}
          disabled={adCooldown}
          style={[styles.buttonFull, styles.watchAdButton]}
          labelStyle={styles.watchAdLabel}
        >
          Watch Ad for $50k
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16, backgroundColor: '#1C1B1F' },
  title: { marginBottom: 8, fontSize: 22 },
  amount: { fontSize: 36, fontWeight: 'bold', marginBottom: 24 },
  buttonColumn: { width: '100%' },
  buttonFull: { width: '100%', marginVertical: 8 },
  watchAdButton: { backgroundColor: '#E53935', height: 60, justifyContent: 'center' },
  watchAdLabel: { color: '#FFFFFF', fontWeight: 'bold' },
  watchAdPrompt: { marginVertical: 8, fontSize: 16, textAlign: 'center' },
  note: { marginTop: 16, fontSize: 12, color: '#DDD', textAlign: 'center' },
}); 