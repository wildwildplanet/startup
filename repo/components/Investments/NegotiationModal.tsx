import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Modal, ScrollView, Platform, ActivityIndicator, Image, Animated } from 'react-native';
import { Text, Button, IconButton, Surface, TextInput, Chip, Divider } from 'react-native-paper';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase/supabaseClient';
import Slider from '@react-native-community/slider';
import { TouchableOpacity } from 'react-native';

// LinkedIn-inspired theme colors (same as other files)
const THEME = {
  primary: '#0A66C2', // LinkedIn blue
  secondary: '#1E2A3A', // Dark navy
  background: '#F3F2EF', // Light gray
  cardBackground: '#FFFFFF', // White
  cardContent: '#F5F1E8', // Light beige
  textDark: '#191919', // Almost black
  textLight: '#FFFFFF', // White
  textMedium: '#666666', // Medium gray
  error: '#E34D4D', // Red
  success: '#4CAF50', // Green
  border: '#E0E0E0', // Light gray border
  backgroundLight: '#F3F2EF', // Light gray
  text: '#191919', // Almost black
  textSecondary: '#666666', // Medium gray
};

// Format currency utility function
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: amount >= 1000000 ? 'compact' : 'standard',
    maximumFractionDigits: amount >= 1000000 ? 1 : 0,
  }).format(amount);
};

// Format percentage utility function
const formatPercentage = (decimal: number) => {
  return `${(decimal * 100).toFixed(2)}%`;
};

// Ensure all text is rendered within Text components
const renderFormattedPercentage = (decimal: number) => {
  return <Text>{formatPercentage(decimal)}</Text>;
};

// Ensure all text is rendered within Text components
const renderFormattedCurrency = (amount: number) => {
  return <Text>{formatCurrency(amount)}</Text>;
};

interface NegotiationModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (investmentId: string) => void;
  startup: {
    id: string;
    name: string;
    logo: string;
    askamount: number;
    valuation: number;
    roi: number;
    stage: string;
    industry: string;
    risklevel: string;
    problem: string;
    solution: string;
    min_investment?: number;
    negotiation_willingness?: number;
    description?: string;
  };
  userBalance: number;
}

const STAGES = [
  { label: 'Initial Offer', isActive: true, isComplete: false },
  { label: 'Negotiation', isActive: false, isComplete: false },
  { label: 'Agreement', isActive: false, isComplete: false },
];

export default function NegotiationModal({
  visible,
  onClose,
  onSuccess,
  startup,
  userBalance,
}: NegotiationModalProps) {
  // Animation for the negotiation progress
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  
  // State variables
  const [amount, setAmount] = useState<string>('');
  const [investmentAmount, setInvestmentAmount] = useState<number>(0);
  const [equity, setEquity] = useState<number>(0);
  const [requestedEquity, setRequestedEquity] = useState<number>(0);
  const [counterOffer, setCounterOffer] = useState<{ amount: number; equity: number } | null>(null);
  const [stage, setStage] = useState<number>(0);
  const [negotiationStages, setNegotiationStages] = useState(STAGES);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Set initial investment amount
  useEffect(() => {
    if (visible && startup) {
      const initialAmount = startup.min_investment || Math.round(startup.askamount * 0.1);
      setAmount(initialAmount.toString());
      setInvestmentAmount(initialAmount);
      updateEquity(initialAmount, startup.valuation);
      
      // Default requested equity (slightly higher than fair value)
      const fairEquity = initialAmount / startup.valuation;
      setRequestedEquity(fairEquity * 1.2); // Ask for 20% more
      
      // Fade in animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, startup, fadeAnim]);
  
  // Calculate equity percentage based on investment amount and valuation
  const updateEquity = (amount: number, valuation: number) => {
    const equityPercentage = amount / valuation;
    setEquity(equityPercentage);
  };
  
  const handleAmountChange = (value: string) => {
    // Allow only numeric input
    if (/^\d*$/.test(value)) {
      setAmount(value);
      const numericValue = value === '' ? 0 : parseInt(value, 10);
      setInvestmentAmount(numericValue);
      updateEquity(numericValue, startup.valuation);
    }
  };
  
  const handleEquityChange = (value: number) => {
    setRequestedEquity(value);
  };
  
  // Submit the initial offer
  const submitOffer = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (investmentAmount <= 0) {
        throw new Error('Investment amount must be greater than 0');
      }
      
      if (investmentAmount > userBalance) {
        throw new Error('Insufficient funds');
      }
      
      const minInvestment = startup.min_investment || 1000;
      if (investmentAmount < minInvestment) {
        throw new Error('Minimum investment is ' + formatCurrency(minInvestment));
      }
      
      // Simulate API call to submit offer
      setTimeout(() => {
        // Update stage
        const updatedStages = [...negotiationStages];
        updatedStages[0].isComplete = true;
        updatedStages[1].isActive = true;
        setNegotiationStages(updatedStages);
        setStage(1);
        
        // Generate counter offer (80-95% of requested equity)
        const counterOfferMultiplier = 0.8 + Math.random() * 0.15;
        const counterEquity = requestedEquity * counterOfferMultiplier;
        
        // Create counter offer
        setCounterOffer({
          amount: investmentAmount,
          equity: counterEquity
        });
        
        setIsLoading(false);
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to submit offer');
      setIsLoading(false);
    }
  };
  
  // Accept the founder's counter offer
  const acceptCounterOffer = async () => {
    setIsLoading(true);
    
    try {
      // Simulate API call to accept offer
      setTimeout(() => {
        // Update stage
        const updatedStages = [...negotiationStages];
        updatedStages[1].isComplete = true;
        updatedStages[2].isActive = true;
        setNegotiationStages(updatedStages);
        setStage(2);
        
        // Show success message after brief delay
        setTimeout(() => {
          const successMsg = 'Deal agreed! You\'ve invested ' + 
            formatCurrency(investmentAmount) + ' in ' + 
            startup.name + ' for ' + 
            formatPercentage(counterOffer?.equity || 0) + ' equity.';
          
          setSuccessMessage(successMsg);
          
          // Close the modal after showing success message
          setTimeout(() => {
            onSuccess('negotiation-' + Date.now());
            onClose();
          }, 2000);
        }, 1000);
        
        setIsLoading(false);
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to accept offer');
      setIsLoading(false);
    }
  };
  
  // Revise your offer
  const reviseOffer = async () => {
    setIsLoading(true);
    
    try {
      setTimeout(() => {
        // Show success message
        const successMsg = 'You\'ve countered the offer. Investment of ' +
          formatCurrency(investmentAmount) + ' for ' +
          formatPercentage(requestedEquity) + ' equity.';
        
        setSuccessMessage(successMsg);
        
        // Complete all stages
        const updatedStages = [...negotiationStages];
        updatedStages[0].isComplete = true;
        updatedStages[1].isComplete = true;
        updatedStages[2].isActive = true;
        updatedStages[2].isComplete = true;
        setNegotiationStages(updatedStages);
        
        // Close the modal after showing success message
        setTimeout(() => {
          onSuccess('negotiation-' + Date.now());
          onClose();
        }, 2000);
        
        setIsLoading(false);
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to revise offer');
      setIsLoading(false);
    }
  };
  
  // Render different content based on negotiation stage
  const renderStageContent = () => {
    switch (stage) {
      case 0: // Initial offer
        return (
          <>
            <View style={styles.startupInfo}>
              <Image 
                source={{ uri: startup.logo || 'https://via.placeholder.com/100' }} 
                style={styles.startupLogo} 
                resizeMode="cover"
              />
              <View style={styles.startupDetails}>
                <Text style={styles.startupName}>{startup.name}</Text>
                <View style={styles.tagContainer}>
                  <Chip style={styles.tag}>{startup.industry}</Chip>
                  <Chip style={styles.tag}>{startup.stage}</Chip>
                </View>
              </View>
            </View>
            
            <View style={styles.pitchSection}>
              <Text style={styles.pitchTitle}>Startup's Ask</Text>
              <View style={styles.pitchMetrics}>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Amount</Text>
                  <Text style={styles.metricValue}>{formatCurrency(startup.askamount)}</Text>
                </View>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Valuation</Text>
                  <Text style={styles.metricValue}>{formatCurrency(startup.valuation)}</Text>
                </View>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Target ROI</Text>
                  <Text style={[styles.metricValue, styles.roiValue]}>{startup.roi}%</Text>
                </View>
              </View>
            </View>
            
            <Divider style={styles.divider} />
            
            <Text style={styles.sectionTitle}>Your Offer</Text>
            
            <Text style={styles.inputLabel}>Investment Amount</Text>
            <TextInput
              value={amount}
              onChangeText={handleAmountChange}
              keyboardType="number-pad"
              mode="outlined"
              left={<TextInput.Affix text="$" />}
              style={styles.amountInput}
              disabled={isLoading}
              theme={{ colors: { primary: THEME.primary } }}
            />
            
            <Text style={styles.inputLabel}>Equity Requested ({formatPercentage(requestedEquity)})</Text>
            <Slider
              minimumValue={equity * 0.8}
              maximumValue={equity * 1.5}
              step={0.001}
              value={requestedEquity}
              onValueChange={handleEquityChange}
              minimumTrackTintColor={THEME.primary}
              maximumTrackTintColor={THEME.border}
              thumbTintColor={THEME.primary}
              style={styles.slider}
              disabled={isLoading}
            />
            
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabel}>Fair Value: {formatPercentage(equity)}</Text>
              <Text style={styles.sliderLabel}>Max: {formatPercentage(equity * 1.5)}</Text>
            </View>
            
            <View style={styles.infoContainer}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Your Investment:</Text>
                <Text style={styles.infoValue}>{formatCurrency(investmentAmount)}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Equity Requested:</Text>
                <Text style={styles.infoValue}>{formatPercentage(requestedEquity)}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Implied Valuation:</Text>
                <Text style={styles.infoValue}>
                  {formatCurrency(investmentAmount / requestedEquity)}
                </Text>
              </View>
            </View>
            
            {error && <Text style={styles.errorText}>{error}</Text>}
            
            <Button
              mode="contained"
              onPress={submitOffer}
              style={styles.submitButton}
              loading={isLoading}
              disabled={isLoading || investmentAmount <= 0 || investmentAmount > userBalance}
              buttonColor={THEME.primary}
              textColor={THEME.textLight}
            >
              Submit Offer
            </Button>
          </>
        );
        
      case 1: // Counter offer
        return (
          <>
            <View style={styles.counterOfferContainer}>
              <FontAwesome5 name="handshake" size={48} color={THEME.primary} style={styles.handshakeIcon} />
              <Text style={styles.counterOfferTitle}>Counter Offer Received</Text>
              <Text style={styles.counterOfferMessage}>
                {startup.name} has countered your offer:
              </Text>

              <View style={styles.offerComparisonContainer}>
                <View style={styles.offerColumn}>
                  <Text style={styles.offerColumnTitle}>Your Offer</Text>
                  <Text style={styles.offerAmount}>{formatCurrency(investmentAmount)}</Text>
                  <Text style={styles.offerEquity}>for {formatPercentage(requestedEquity)} equity</Text>
                </View>
                
                <View style={styles.vsContainer}>
                  <FontAwesome5 name="exchange-alt" size={24} color={THEME.textMedium} />
                </View>
                
                <View style={styles.offerColumn}>
                  <Text style={styles.offerColumnTitle}>Their Counter</Text>
                  <Text style={styles.offerAmount}>{formatCurrency(counterOffer?.amount || 0)}</Text>
                  <Text style={styles.offerEquity}>for {formatPercentage(counterOffer?.equity || 0)} equity</Text>
                </View>
              </View>
              
              <View style={styles.comparisonMetrics}>
                <Text style={styles.comparisonText}>
                  This counter offers {((counterOffer?.equity || 0) / requestedEquity * 100).toFixed(1)}% of your requested equity
                </Text>
                <Text style={styles.comparisonText}>
                  Implied valuation: {formatCurrency((counterOffer?.amount || 0) / (counterOffer?.equity || 1))}
                </Text>
              </View>
              
              {error && <Text style={styles.errorText}>{error}</Text>}
              
              <View style={styles.counterOfferActions}>
                <Button
                  mode="outlined"
                  onPress={reviseOffer}
                  style={[styles.actionButton, { borderColor: THEME.primary }]}
                  disabled={isLoading}
                  textColor={THEME.primary}
                >
                  Revise Offer
                </Button>
                <Button
                  mode="contained"
                  onPress={acceptCounterOffer}
                  style={styles.actionButton}
                  loading={isLoading}
                  disabled={isLoading}
                  buttonColor={THEME.primary}
                  textColor={THEME.textLight}
                >
                  Accept Counter
                </Button>
              </View>
            </View>
          </>
        );
        
      case 2: // Agreement
        return (
          <View style={styles.successContainer}>
            {successMessage ? (
              <>
                <FontAwesome5 name="check-circle" size={64} color={THEME.success} />
                <Text style={styles.successText}>{successMessage}</Text>
              </>
            ) : (
              <>
                <ActivityIndicator size="large" color={THEME.primary} />
                <Text style={styles.loadingText}>Finalizing agreement...</Text>
              </>
            )}
          </View>
        );
        
      default:
        return null;
    }
  };
  
  // Render the progress bar for negotiation stages
  const renderProgressBar = () => {
    return (
      <View style={styles.negotiationProgress}>
        {negotiationStages.map((s, index) => (
          <View key={index} style={styles.stageContainer}>
            <View style={[
              styles.stageCircle,
              s.isActive && styles.activeStage,
              s.isComplete && styles.completeStage
            ]}>
              <Text style={styles.stageNumber}>{index + 1}</Text>
            </View>
            <Text style={styles.stageName}>{s.label}</Text>
            {index < negotiationStages.length - 1 && (
              <View style={[
                styles.stageLine,
                negotiationStages[index + 1].isActive && styles.activeStage,
                negotiationStages[index + 1].isComplete && styles.completeStage
              ]} />
            )}
          </View>
        ))}
      </View>
    );
  };
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Negotiate Investment</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.scrollContainer}>
            <View style={styles.startupInfo}>
              <Text style={styles.startupName}>{startup.name}</Text>
              <Text style={styles.startupDescription}>
                {startup.description || startup.problem}
              </Text>
            </View>
            
            <View style={styles.negotiationProgress}>
              {negotiationStages.map((s, index) => (
                <View key={index} style={styles.stageContainer}>
                  <View style={[
                    styles.stageCircle,
                    s.isActive && styles.activeStage,
                    s.isComplete && styles.completeStage
                  ]}>
                    <Text style={styles.stageNumber}>{index + 1}</Text>
                  </View>
                  <Text style={styles.stageName}>{s.label}</Text>
                  {index < negotiationStages.length - 1 && (
                    <View style={[
                      styles.stageLine,
                      negotiationStages[index + 1].isActive && styles.activeStage,
                      negotiationStages[index + 1].isComplete && styles.completeStage
                    ]} />
                  )}
                </View>
              ))}
            </View>
            
            {/* Stage 0: Initial Offer */}
            {stage === 0 && (
              <View style={styles.stageContent}>
                <Text style={styles.offerTitle}>Your Investment Offer</Text>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Investment Amount</Text>
                  <TextInput
                    style={styles.input}
                    value={amount}
                    onChangeText={handleAmountChange}
                    keyboardType="numeric"
                    placeholder="Enter amount"
                  />
                </View>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Requested Equity</Text>
                  <View style={styles.sliderContainer}>
                    <Slider
                      style={styles.slider}
                      minimumValue={0.5}
                      maximumValue={25}
                      step={0.5}
                      value={requestedEquity}
                      onValueChange={handleEquityChange}
                      minimumTrackTintColor="#4CAF50"
                      maximumTrackTintColor="#ECECEC"
                    />
                    <Text style={styles.sliderValue}>
                      {formatPercentage(requestedEquity)}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.summaryContainer}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Your Balance:</Text>
                    <Text style={styles.summaryValue}>
                      {formatCurrency(userBalance)}
                    </Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Investment:</Text>
                    <Text style={styles.summaryValue}>
                      {formatCurrency(investmentAmount)}
                    </Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Equity:</Text>
                    <Text style={styles.summaryValue}>
                      {formatPercentage(requestedEquity)}
                    </Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Company Valuation:</Text>
                    <Text style={styles.summaryValue}>
                      {investmentAmount > 0
                        ? formatCurrency((investmentAmount / requestedEquity) * 100)
                        : formatCurrency(0)}
                    </Text>
                  </View>
                </View>
                
                {error && <Text style={styles.errorText}>{error}</Text>}
                
                <TouchableOpacity
                  style={[styles.submitButton, isLoading && styles.disabledButton]}
                  onPress={submitOffer}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitButtonText}>Submit Offer</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
            
            {/* Stage 1: Counter Offer */}
            {stage === 1 && counterOffer && (
              <View style={styles.stageContent}>
                <Text style={styles.offerTitle}>Founder's Counter Offer</Text>
                
                <View style={styles.counterOfferContainer}>
                  <Text style={styles.counterOfferText}>
                    The founder has countered your offer:
                  </Text>
                  
                  <View style={styles.summaryContainer}>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>Your Offer:</Text>
                      <Text style={styles.summaryValue}>
                        {formatCurrency(investmentAmount)} for {formatPercentage(requestedEquity)}
                      </Text>
                    </View>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>Counter Offer:</Text>
                      <Text style={styles.summaryValue}>
                        {formatCurrency(counterOffer.amount)} for {formatPercentage(counterOffer.equity)}
                      </Text>
                    </View>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>New Valuation:</Text>
                      <Text style={styles.summaryValue}>
                        {formatCurrency((counterOffer.amount / counterOffer.equity) * 100)}
                      </Text>
                    </View>
                  </View>
                  
                  {error && <Text style={styles.errorText}>{error}</Text>}
                  
                  <View style={styles.counterButtonsContainer}>
                    <TouchableOpacity
                      style={[styles.counterButton, styles.acceptButton, isLoading && styles.disabledButton]}
                      onPress={acceptCounterOffer}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text style={styles.counterButtonText}>Accept</Text>
                      )}
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.counterButton, styles.reviseButton, isLoading && styles.disabledButton]}
                      onPress={reviseOffer}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text style={styles.counterButtonText}>Revise</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
            
            {/* Stage 2: Confirmation */}
            {stage === 2 && (
              <View style={styles.stageContent}>
                <View style={styles.confirmationContainer}>
                  {isLoading ? (
                    <ActivityIndicator color="#4CAF50" size="large" />
                  ) : (
                    <>
                      <View style={styles.successIconContainer}>
                        <Text style={styles.successIcon}>✓</Text>
                      </View>
                      {successMessage && (
                        <Text style={styles.successMessage}>{successMessage}</Text>
                      )}
                    </>
                  )}
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxHeight: '85%',
    borderRadius: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
    backgroundColor: THEME.cardBackground,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  headerTitle: {
    fontWeight: 'bold',
    color: THEME.textDark,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.textDark,
  },
  scrollContainer: {
    padding: 16,
  },
  startupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  startupLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
    backgroundColor: THEME.background,
  },
  startupDetails: {
    flex: 1,
  },
  startupName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.textDark,
    marginBottom: 8,
  },
  startupDescription: {
    fontSize: 14,
    color: THEME.textMedium,
  },
  tagContainer: {
    flexDirection: 'row',
  },
  tag: {
    marginRight: 8,
    backgroundColor: 'rgba(10, 102, 194, 0.1)',
  },
  pitchSection: {
    backgroundColor: THEME.cardContent,
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  pitchTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.textDark,
    marginBottom: 12,
  },
  pitchMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metric: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    fontSize: 12,
    color: THEME.textMedium,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: THEME.textDark,
  },
  roiValue: {
    color: THEME.success,
  },
  divider: {
    marginVertical: 16,
    backgroundColor: THEME.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.textDark,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: THEME.textDark,
    marginBottom: 8,
  },
  amountInput: {
    marginBottom: 16,
    backgroundColor: THEME.cardBackground,
  },
  slider: {
    height: 40,
    marginBottom: 8,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sliderLabel: {
    fontSize: 12,
    color: THEME.textMedium,
  },
  infoContainer: {
    backgroundColor: THEME.background,
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: THEME.textDark,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: THEME.textDark,
  },
  errorText: {
    color: THEME.error,
    marginBottom: 16,
    textAlign: 'center',
  },
  submitButton: {
    marginBottom: 16,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.textLight,
  },

  handshakeIcon: {
    marginBottom: 16,
  },
  counterOfferContainer: {
    alignItems: 'center',
    padding: 16,
  },
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  counterOfferTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.textDark,
    marginBottom: 8,
  },
  counterOfferMessage: {
    fontSize: 16,
    color: THEME.textDark,
    marginBottom: 24,
    textAlign: 'center',
  },
  offerComparisonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 24,
  },
  offerColumn: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: THEME.cardContent,
    borderRadius: 8,
  },
  vsContainer: {
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  offerColumnTitle: {
    fontSize: 14,
    color: THEME.textMedium,
    marginBottom: 8,
  },
  offerAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.textDark,
    marginBottom: 4,
  },
  offerEquity: {
    fontSize: 14,
    color: THEME.textDark,
  },
  comparisonMetrics: {
    width: '100%',
    backgroundColor: THEME.background,
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  comparisonText: {
    fontSize: 14,
    color: THEME.textDark,
    marginBottom: 8,
  },
  counterOfferActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 8,
  },

  successText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 16,
    color: THEME.textDark,
    fontWeight: '500',
  },
  loadingText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 16,
    color: THEME.textDark,
  },
  negotiationProgress: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  stageContainer: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  stageCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: THEME.backgroundLight,
    borderWidth: 2,
    borderColor: THEME.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeStage: {
    backgroundColor: THEME.primary,
    borderColor: THEME.primary,
  },
  completeStage: {
    backgroundColor: THEME.success,
    borderColor: THEME.success,
  },
  stageNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: THEME.text,
  },
  stageName: {
    fontSize: 10,
    color: THEME.textSecondary,
    marginTop: 4,
  },
  stageContent: {
    padding: 16,
  },
  offerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.textDark,
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: THEME.cardBackground,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sliderValue: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: 'bold',
    color: THEME.textDark,
  },
  summaryContainer: {
    backgroundColor: THEME.background,
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: THEME.textDark,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: THEME.textDark,
  },

  counterOfferText: {
    fontSize: 16,
    color: THEME.textDark,
    marginBottom: 16,
  },
  counterButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  counterButton: {
    flex: 1,
    padding: 16,
    borderWidth: 2,
    borderColor: THEME.primary,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButton: {
    backgroundColor: THEME.primary,
  },
  reviseButton: {
    backgroundColor: THEME.textLight,
  },
  counterButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.primary,
  },

  successIconContainer: {
    backgroundColor: THEME.success,
    borderRadius: 32,
    padding: 16,
    marginBottom: 16,
  },
  successIcon: {
    fontSize: 24,
    fontWeight: 'bold',
    color: THEME.textLight,
  },
  successMessage: {
    fontSize: 18,
    textAlign: 'center',
    color: THEME.textDark,
    fontWeight: '500',
  },
  confirmationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  disabledButton: {
    backgroundColor: THEME.border,
  },
  stageLine: {
    height: 2,
    backgroundColor: THEME.border,
    flex: 1,
    marginHorizontal: 8,
  },
}); 