import { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Text, Button, Card, useTheme, IconButton } from 'react-native-paper';
import Slider from '@react-native-community/slider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface InvestmentParams {
  id?: string;
  name?: string;
  askAmount?: string;
  valuation?: string;
}

export default function InvestmentScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams() as InvestmentParams;
  
  const startupId = params.id || '';
  const startupName = params.name || 'Startup';
  const askAmount = parseInt(params.askAmount || '500000', 10);
  const valuation = parseInt(params.valuation || '5000000', 10);

  const minInvestment = Math.floor(askAmount * 0.7);
  const maxInvestment = Math.floor(askAmount * 1.3);
  
  const [investmentAmount, setInvestmentAmount] = useState(askAmount);
  const [equityPercentage, setEquityPercentage] = useState(0);
  const [userCash, setUserCash] = useState(1000000); // Mock user cash
  
  useEffect(() => {
    // Calculate equity percentage based on investment amount and valuation
    const equity = (investmentAmount / (valuation + investmentAmount)) * 100;
    setEquityPercentage(equity);
  }, [investmentAmount, valuation]);

  const handleInvestmentChange = (value: number) => {
    setInvestmentAmount(value);
  };

  const handleInvest = () => {
    // Here would be the logic to process the investment
    // For this example, we'll just close the modal and return to the main screen
    router.back();
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <IconButton
          icon="close"
          size={24}
          onPress={handleCancel}
          style={styles.closeButton}
        />
        <Text style={styles.headerTitle}>Investment Details</Text>
        <View style={{ width: 40 }} /> {/* Spacer for centering the title */}
      </View>

      <ScrollView style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.startupName}>{startupName}</Text>
            
            <View style={styles.askContainer}>
              <View style={styles.askItem}>
                <Text style={styles.askLabel}>Asking</Text>
                <Text style={styles.askValue}>${(askAmount / 1000000).toFixed(2)}M</Text>
              </View>
              <View style={styles.askItem}>
                <Text style={styles.askLabel}>Valuation</Text>
                <Text style={styles.askValue}>${(valuation / 1000000).toFixed(2)}M</Text>
              </View>
            </View>

            <View style={styles.sliderContainer}>
              <View style={styles.sliderHeader}>
                <Text style={styles.sliderTitle}>Your Investment</Text>
                <Text style={styles.investmentAmount}>
                  ${(investmentAmount / 1000000).toFixed(2)}M
                </Text>
              </View>
              
              <Slider
                value={investmentAmount}
                minimumValue={minInvestment}
                maximumValue={maxInvestment}
                step={10000}
                onValueChange={handleInvestmentChange}
                style={styles.slider}
                minimumTrackTintColor={theme.colors.primary}
                maximumTrackTintColor="#3F3F46"
                thumbTintColor={theme.colors.primary}
              />
              
              <View style={styles.sliderLabels}>
                <Text style={styles.sliderMinLabel}>
                  ${(minInvestment / 1000000).toFixed(2)}M
                </Text>
                <Text style={styles.sliderMaxLabel}>
                  ${(maxInvestment / 1000000).toFixed(2)}M
                </Text>
              </View>
            </View>

            <View style={styles.equityContainer}>
              <Text style={styles.equityLabel}>Equity Stake</Text>
              <Text style={styles.equityValue}>{equityPercentage.toFixed(2)}%</Text>
            </View>

            <View style={styles.cashContainer}>
              <Text style={styles.cashLabel}>Your Available Cash</Text>
              <Text style={styles.cashValue}>${(userCash / 1000000).toFixed(2)}M</Text>
              <View style={styles.cashBarContainer}>
                <View style={styles.cashBarBackground}>
                  <View 
                    style={[
                      styles.cashBarFill, 
                      { 
                        width: `${(100 * (userCash - investmentAmount) / userCash)}%`,
                        backgroundColor: investmentAmount > userCash ? '#FF6B6B' : '#06D6A0' 
                      }
                    ]} 
                  />
                </View>
              </View>
              <Text style={[
                styles.remainingCash,
                { color: investmentAmount > userCash ? '#FF6B6B' : '#06D6A0' }
              ]}>
                Remaining: ${((userCash - investmentAmount) / 1000000).toFixed(2)}M
              </Text>
            </View>

            <View style={styles.returnContainer}>
              <View style={styles.returnItem}>
                <Text style={styles.returnLabel}>Potential Return (Low)</Text>
                <Text style={styles.returnValue}>
                  ${((investmentAmount * 1.2) / 1000000).toFixed(2)}M
                </Text>
              </View>
              <View style={styles.returnItem}>
                <Text style={styles.returnLabel}>Potential Return (Mid)</Text>
                <Text style={styles.returnValue}>
                  ${((investmentAmount * 2.5) / 1000000).toFixed(2)}M
                </Text>
              </View>
              <View style={styles.returnItem}>
                <Text style={styles.returnLabel}>Potential Return (High)</Text>
                <Text style={styles.returnValue}>
                  ${((investmentAmount * 5) / 1000000).toFixed(2)}M
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        <View style={styles.buttonContainer}>
          <Button
            mode="outlined"
            onPress={handleCancel}
            style={styles.cancelButton}
            labelStyle={styles.cancelButtonLabel}
          >
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleInvest}
            style={[
              styles.investButton,
              { backgroundColor: investmentAmount > userCash ? '#999999' : '#06D6A0' }
            ]}
            labelStyle={styles.investButtonLabel}
            disabled={investmentAmount > userCash}
          >
            Invest Now
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1B1F',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  closeButton: {
    margin: 0,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#2B2930',
    borderRadius: 10,
    marginBottom: 16,
  },
  startupName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  askContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#0F1729',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
  },
  askItem: {
    alignItems: 'center',
  },
  askLabel: {
    color: '#CCCCCC',
    fontSize: 14,
    marginBottom: 4,
  },
  askValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  sliderContainer: {
    marginBottom: 24,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sliderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  investmentAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7D5DFE',
  },
  slider: {
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -12,
  },
  sliderMinLabel: {
    color: '#CCCCCC',
    fontSize: 12,
  },
  sliderMaxLabel: {
    color: '#CCCCCC',
    fontSize: 12,
  },
  equityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0F1729',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
  },
  equityLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  equityValue: {
    color: '#7D5DFE',
    fontSize: 22,
    fontWeight: 'bold',
  },
  cashContainer: {
    marginBottom: 24,
  },
  cashLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cashValue: {
    color: '#FFFFFF',
    fontSize: 18,
    marginBottom: 8,
  },
  cashBarContainer: {
    height: 10,
    marginBottom: 8,
  },
  cashBarBackground: {
    height: '100%',
    backgroundColor: '#3F3F46',
    borderRadius: 5,
    overflow: 'hidden',
  },
  cashBarFill: {
    height: '100%',
  },
  remainingCash: {
    fontSize: 14,
    textAlign: 'right',
  },
  returnContainer: {
    backgroundColor: '#0F1729',
    borderRadius: 8,
    padding: 12,
  },
  returnItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  returnLabel: {
    color: '#CCCCCC',
    fontSize: 14,
  },
  returnValue: {
    color: '#06D6A0',
    fontSize: 14,
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
    borderColor: '#CCCCCC',
  },
  cancelButtonLabel: {
    fontSize: 16,
  },
  investButton: {
    flex: 2,
  },
  investButtonLabel: {
    fontSize: 16,
    color: '#FFFFFF',
  },
}); 