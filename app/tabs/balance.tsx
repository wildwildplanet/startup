import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { Text, Button, Title, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useSupabase } from '../../lib/supabase/SupabaseProvider';
import { useStore, updateUserBalanceEverywhere } from '../../lib/store/useStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Dynamically import UnityAds
let UnityAds: any = null;
if (Platform.OS !== 'web') {
  try {
    UnityAds = require('react-native-unity-ads');
  } catch (e) {
    console.warn('Unity Ads not available:', e);
  }
}

export default function BalanceScreen() {
  const theme = useTheme();
  const { session, isLoading: sessionLoading } = useSupabase();
  const router = useRouter();
  const storeUser = useStore(state => state.user);
  const [adCooldown, setAdCooldown] = useState(false);
  const [adLoading, setAdLoading] = useState(false);
  const [adError, setAdError] = useState<string | null>(null);

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

  const showRewardedAd = async () => {
    if (adCooldown || adLoading) return;
    
    setAdLoading(true);
    setAdError(null);
    
    try {
      if (UnityAds?.showAd) {
        const placementId = Platform.OS === 'ios' ? 'Rewarded_iOS' : 'Rewarded_Android';
        
        // Set up ad completion listener
        UnityAds.addListener('onUnityAdsFinish', async (result: any) => {
          console.log('Unity ad finished with result:', result);
          if (result === 'completed') {
            await addBalance(50000);
            setAdCooldown(true);
            setTimeout(() => setAdCooldown(false), 60000);
          }
        });

        // Set up error listener
        UnityAds.addListener('onUnityAdsError', (error: any) => {
          console.error('Unity ad error:', error);
          setAdError('Failed to load ad. Please try again.');
        });

        // Show the ad
        await UnityAds.showAd(placementId, true);
      } else {
        console.warn('Unity Ads not available, simulating reward');
        await addBalance(50000);
        setAdCooldown(true);
        setTimeout(() => setAdCooldown(false), 60000);
      }
    } catch (error) {
      console.error('Rewarded ad error:', error);
      setAdError('Failed to show ad. Please try again.');
    } finally {
      setAdLoading(false);
    }
  };

  const addBalance = async (amount: number) => {
    if (!storeUser?.id) return;
    const newBalance = storeUser.cashAvailable + amount;
    await updateUserBalanceEverywhere(storeUser.id, newBalance);
  };

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
      
      <Text style={[styles.amount, { color: '#FFFFFF' }]}>
        {formatCurrency(storeUser.cashAvailable)}
      </Text>
      
      <Text style={[styles.watchAdPrompt, { color: '#DDD' }]}>
        {adCooldown
          ? 'Please wait 1 minute before watching another ad.'
          : 'Watch an ad to earn free balance!'}
      </Text>

      {adError && (
        <Text style={styles.errorText}>{adError}</Text>
      )}

      <View style={styles.buttonColumn}>
        <Button
          mode="contained"
          icon={() => <MaterialCommunityIcons name="video-outline" size={24} color="#FFFFFF" />}
          onPress={showRewardedAd}
          disabled={adCooldown || adLoading}
          loading={adLoading}
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
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1C1B1F',
  },
  title: {
    marginBottom: 8,
    fontSize: 22,
  },
  amount: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  buttonColumn: {
    width: '100%',
  },
  buttonFull: {
    width: '100%',
    marginVertical: 8,
  },
  watchAdButton: {
    backgroundColor: '#E53935',
    height: 60,
    justifyContent: 'center',
  },
  watchAdLabel: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  watchAdPrompt: {
    marginVertical: 8,
    fontSize: 16,
    textAlign: 'center',
  },
  errorText: {
    color: '#FF6B6B',
    marginBottom: 16,
    textAlign: 'center',
  },
});