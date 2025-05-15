import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Image, TouchableOpacity } from 'react-native';
import { Text, Button, Card, useTheme, TextInput, Divider } from 'react-native-paper';
import Slider from '@react-native-community/slider';
import { useLocalSearchParams, router } from 'expo-router';
import { fetchStartupById, makeInvestment, supabase } from '../../lib/supabase/supabaseClient';
import { useStore, updateUserBalanceEverywhere } from '../../lib/store/useStore';
import { Ionicons } from '@expo/vector-icons';

type Startup = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  logo: string;
  funding_goal: number;
  equity_offered: number;
  industry: string;
  location: string;
  founded_date: string;
  team_size: number;
};

export default function MakeOfferScreen() {
  const { id } = useLocalSearchParams();
  const theme = useTheme();
  const storeUser = useStore(state => state.user);
  
  const [startup, setStartup] = useState<Startup | null>(null);
  const [loading, setLoading] = useState(true);
  const [investmentAmount, setInvestmentAmount] = useState('10000');
  const [equityReceived, setEquityReceived] = useState(0);
  const [sliderValue, setSliderValue] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const loadStartup = async () => {
      if (id) {
        setLoading(true);
        try {
          const data = await fetchStartupById(id as string);
          setStartup(data);
          // Initialize with 1% of the funding goal
          const initialAmount = Math.round(data.funding_goal * 0.01).toString();
          setInvestmentAmount(initialAmount);
          calculateEquity(initialAmount, data);
        } catch (err) {
          console.error('Error loading startup details:', err);
        } finally {
          setLoading(false);
        }
      }
    };

    loadStartup();
  }, [id]);

  const calculateEquity = (amount: string, startupData = startup) => {
    if (!startupData) return;
    const numericAmount = parseFloat(amount) || 0;
    // Cap at funding goal to prevent over-investment
    const effectiveAmount = Math.min(numericAmount, startupData.funding_goal);
    const percentageOfGoal = effectiveAmount / startupData.funding_goal;
    const rawEquity = percentageOfGoal * startupData.equity_offered;
    // Ensure equity doesn't exceed offered max
    const equity = Math.min(rawEquity, startupData.equity_offered);
    setEquityReceived(equity);
  };

  const handleInvestmentChange = (value: string) => {
    setInvestmentAmount(value);
    calculateEquity(value);
  };

  const handleSliderChange = (value: number) => {
    setSliderValue(value);
    if (!startup) return;
    
    // Calculate investment amount based on slider (1-100% of funding goal)
    const percentage = value / 100;
    const amount = Math.round(startup.funding_goal * percentage).toString();
    setInvestmentAmount(amount);
    calculateEquity(amount);
  };

  const handleSubmitOffer = async () => {
    if (!startup || !investmentAmount) return;
    
    setProcessing(true);
    try {
      // Save the investment to the database
      const newInv = await makeInvestment({
        startup_id: startup.id,
        amount: parseFloat(investmentAmount),
        equity_received: equityReceived
      });
      // Update user_profiles table and global store on success
      if (newInv && storeUser) {
        const investedAmt = parseFloat(investmentAmount);
        const newBalance = storeUser.cashAvailable - investedAmt;
        const newPortfolio = storeUser.portfolioValue + investedAmt;
        await updateUserBalanceEverywhere(storeUser.id, newBalance);
        // Sync only the updated portfolioValue into the global store
        useStore.setState(state => ({
          ...state,
          user: state.user
            ? { ...state.user, portfolioValue: newPortfolio }
            : state.user,
        }));
      }
      // Refresh the portfolio in Zustand so the new investment appears immediately
      await useStore.getState().loadPortfolio();
      setSuccess(true);
      
      // Show success state briefly before navigating
      setTimeout(() => {
        router.replace('/tabs/portfolio');
      }, 1500);
    } catch (error) {
      console.error('Error making investment:', error);
    } finally {
      setProcessing(false);
    }
  };

  const calculateROI = () => {
    // Simple mock ROI calculation - would be more complex in real app
    const mockMultiplier = 1 + (Math.random() * 1.5);
    return Math.round((mockMultiplier * parseFloat(investmentAmount)) - parseFloat(investmentAmount));
  };

  const formatCurrency = (value: number | string) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return numValue.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading startup details...</Text>
      </View>
    );
  }

  if (!startup) {
    return (
      <View style={styles.container}>
        <Text>Startup not found</Text>
        <Button mode="contained" onPress={() => router.back()}>
          Go Back
        </Button>
      </View>
    );
  }

  if (success) {
    return (
      <View style={styles.successContainer}>
        <Ionicons name="checkmark-circle" size={80} color="#06D6A0" />
        <Text style={styles.successTitle}>Investment Successful!</Text>
        <Text style={styles.successText}>
          You've invested {formatCurrency(investmentAmount)} in {startup.name}
        </Text>
        <Text style={styles.successText}>
          You now own {equityReceived.toFixed(2)}% equity in this startup
        </Text>
      </View>
    );
  }

  const projectedReturn = calculateROI();
  const isPositiveROI = projectedReturn > 0;

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineMedium" style={styles.title}>Investment Offer</Text>
          
          <View style={styles.startupInfo}>
            <Text variant="titleLarge" style={styles.startupName}>{startup.name}</Text>
            <Text variant="bodyMedium" style={styles.startupTagline}>{startup.tagline}</Text>
            
            <View style={styles.startupMetrics}>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Ask</Text>
                <Text style={styles.metricValue}>{formatCurrency(startup.funding_goal)}</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Equity</Text>
                <Text style={styles.metricValue}>{startup.equity_offered}%</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Valuation</Text>
                <Text style={styles.metricValue}>
                  {formatCurrency(startup.funding_goal / (startup.equity_offered / 100))}
                </Text>
              </View>
            </View>
          </View>
          
          <Divider style={styles.divider} />
          
          <Text variant="titleMedium" style={styles.sectionTitle}>Your Investment</Text>
          
          <View style={styles.sliderContainer}>
            <Text style={styles.sliderLabel}>Investment Amount ({(sliderValue).toFixed(0)}% of ask)</Text>
            <Slider
              value={sliderValue}
              onValueChange={handleSliderChange}
              minimumValue={1}
              maximumValue={100}
              step={1}
              minimumTrackTintColor="#D4AF37"
              maximumTrackTintColor="#444"
              thumbTintColor="#D4AF37"
              style={styles.slider}
            />
          </View>
          
          <View style={styles.investmentInput}>
            <Text style={styles.inputLabel}>Amount to Invest</Text>
            <TextInput
              mode="outlined"
              value={investmentAmount}
              onChangeText={handleInvestmentChange}
              keyboardType="numeric"
              style={styles.input}
              outlineColor="#D4AF37"
              activeOutlineColor="#D4AF37"
              left={<TextInput.Affix text="$" />}
            />
          </View>

          <View style={styles.divider} />
          
          <View style={styles.investmentDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Equity Received</Text>
              <Text style={styles.detailValue}>{equityReceived.toFixed(2)}%</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Projected Return</Text>
              <Text style={[styles.detailValue, isPositiveROI ? styles.positive : styles.negative]}>
                {isPositiveROI ? '+' : ''}{formatCurrency(projectedReturn)}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>ROI Estimate</Text>
              <Text style={[styles.detailValue, isPositiveROI ? styles.positive : styles.negative]}>
                {isPositiveROI ? '+' : ''}
                {Math.round((projectedReturn / parseFloat(investmentAmount)) * 100)}%
              </Text>
            </View>
          </View>
          
          <View style={styles.actionButtons}>
            <Button 
              mode="outlined" 
              onPress={() => router.back()}
              style={styles.cancelButton}
              labelStyle={styles.cancelButtonLabel}
            >
              Cancel
            </Button>
            
            <Button 
              mode="contained" 
              onPress={handleSubmitOffer}
              style={styles.investButton}
              labelStyle={styles.investButtonLabel}
              loading={processing}
              disabled={processing}
            >
              Invest Now
            </Button>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1B1F',
  },
  card: {
    margin: 16,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    overflow: 'hidden',
  },
  title: {
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: 'bold',
  },
  startupInfo: {
    marginBottom: 16,
  },
  startupName: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 24,
  },
  startupTagline: {
    color: '#CCCCCC',
    marginBottom: 16,
  },
  startupMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    color: '#AAAAAA',
    fontSize: 14,
  },
  metricValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    backgroundColor: '#333',
    height: 1,
    marginVertical: 16,
  },
  sectionTitle: {
    color: '#FFFFFF',
    marginBottom: 16,
  },
  sliderContainer: {
    marginBottom: 16,
  },
  sliderLabel: {
    color: '#FFFFFF',
    marginBottom: 8,
  },
  slider: {
    height: 40,
  },
  investmentInput: {
    marginBottom: 16,
  },
  inputLabel: {
    color: '#FFFFFF',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#2C3E50',
  },
  investmentDetails: {
    marginTop: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailLabel: {
    color: '#AAAAAA',
    fontSize: 16,
  },
  detailValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  positive: {
    color: '#06D6A0',
  },
  negative: {
    color: '#FF6B6B',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
    borderColor: '#AAAAAA',
  },
  cancelButtonLabel: {
    color: '#FFFFFF',
  },
  investButton: {
    flex: 1,
    marginLeft: 8,
    backgroundColor: '#D4AF37',
  },
  investButtonLabel: {
    color: '#000000',
    fontWeight: 'bold',
  },
  successContainer: {
    flex: 1,
    backgroundColor: '#1C1B1F',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  successTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  successText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 8,
  }
}); 