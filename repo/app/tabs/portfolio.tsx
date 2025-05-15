import React, { useState, useEffect, useCallback } from 'react';
import { NativeModules } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { StyleSheet, View, FlatList, ActivityIndicator, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Card, Text, Button, IconButton, Dialog, Portal, useTheme, ProgressBar } from 'react-native-paper';
import { useStore, Investment, updateUserBalanceEverywhere } from '../../lib/store/useStore';
import { supabase } from '../../lib/supabase/supabaseClient';
import { useSupabase } from '../../lib/supabase/SupabaseProvider';
import { useFocusEffect } from '@react-navigation/native';

const screenWidth = Dimensions.get('window').width;
const COLORS = ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336', '#FFC107'];
const getColor = (index: number) => COLORS[index % COLORS.length];

export default function PortfolioScreen() {
  const { session, isLoading: sessionLoading } = useSupabase();
  const theme = useTheme();
  const storeUser = useStore(state => state.user);
  const storePortfolio = useStore(state => state.portfolio);
  const loadPortfolio = useStore(state => state.loadPortfolio);
  const simulateMarket = useStore(state => state.simulateMarket);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const storeLoading = useStore(state => state.isLoading);
  const storeError = useStore(state => state.error);
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);
  // Exit scenario simulation
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [exitResult, setExitResult] = useState<string | null>(null);
  const [exitType, setExitType] = useState<'IPO' | 'Acquisition' | 'Liquidation' | null>(null);
  const [exitLoading, setExitLoading] = useState(false);
  const [sellPercentage, setSellPercentage] = useState(100);
  const [totalPortfolioValue, setTotalPortfolioValue] = useState(0);
  const [totalInvested, setTotalInvested] = useState(0);
  const [portfolioPerformance, setPortfolioPerformance] = useState(0);
  // Track historical portfolio values for charting
  const [portfolioHistory, setPortfolioHistory] = useState<number[]>([]);

  // 10s market simulation timer
  useEffect(() => {
    const simId = setInterval(simulateMarket, 10000);
    return () => clearInterval(simId);
  }, [simulateMarket]);

  // Init load and simulation once on mount
  useEffect(() => {
    const init = async () => {
      if (storePortfolio.length === 0) {
        await loadPortfolio();
      }
      simulateMarket();
    };
    init();
  }, [loadPortfolio, simulateMarket, storePortfolio.length]);

  // Sync investments when global portfolio changes
  useEffect(() => {
    setInvestments(storePortfolio);
  }, [storePortfolio]);

  // Recalculate metrics whenever portfolio changes
  useEffect(() => {
    const totalInv = investments.reduce((sum, inv) => sum + inv.investedAmount, 0);
    const totalCurr = investments.reduce((sum, inv) => sum + inv.currentValue, 0);
    setTotalInvested(totalInv);
    setTotalPortfolioValue(totalCurr);
    setPortfolioPerformance(totalInv > 0 ? ((totalCurr - totalInv) / totalInv) * 100 : 0);
    // Update portfolio value history for charting
    setPortfolioHistory(prev => [...prev, totalCurr]);
  }, [investments]);

  useFocusEffect(
    useCallback(() => {
      loadPortfolio();
    }, [loadPortfolio])
  );

  const handleSellInvestment = (investment: Investment) => {
    setSelectedInvestment(investment);
    setSellPercentage(100); // Default to selling entire stake
    setShowExitDialog(true); // Show exit scenario dialog instead
  };

  // Simulate exit scenario outcome
  const simulateExit = async (type: 'IPO' | 'Acquisition' | 'Liquidation') => {
    if (!selectedInvestment) return;
    setExitLoading(true);
    setExitType(type);
    let multiplier = 1;
    let message = '';
    // Simple probabilistic simulation
    const rand = Math.random();
    if (type === 'IPO') {
      if (rand < 0.6) { multiplier = 2 + Math.random(); message = 'IPO Success! Your investment doubled.'; }
      else if (rand < 0.9) { multiplier = 1 + Math.random(); message = 'IPO was modest. You get your money back plus a little.'; }
      else { multiplier = 0.2 + Math.random() * 0.2; message = 'IPO failed. You lost most of your investment.'; }
    } else if (type === 'Acquisition') {
      if (rand < 0.5) { multiplier = 1.5 + Math.random(); message = 'Acquisition was lucrative!'; }
      else if (rand < 0.85) { multiplier = 1 + Math.random() * 0.5; message = 'Acquisition was average.'; }
      else { multiplier = 0.3 + Math.random() * 0.3; message = 'Acquisition was a fire sale.'; }
    } else {
      if (rand < 0.3) { multiplier = 1 + Math.random() * 0.2; message = 'Liquidation returned some value.'; }
      else { multiplier = 0; message = 'Liquidation failed. Investment lost.'; }
    }
    // Calculate payout
    const payout = selectedInvestment.currentValue * multiplier * (sellPercentage / 100);
    setTimeout(async () => {
      setExitResult(`${message} You receive $${payout.toFixed(2)}`);
      setExitLoading(false);
      // Update user balance and remove/split investment
      if (storeUser?.id) {
        const newBalance = storeUser.cashAvailable + payout;
        // Round to integer to match Supabase integer column
        const roundedBalance = Math.round(newBalance);
        const newPortfolioValue = storeUser.portfolioValue - selectedInvestment.currentValue * (sellPercentage / 100);
        await updateUserBalanceEverywhere(storeUser.id, roundedBalance);
        useStore.setState(state => ({
          ...state,
          user: state.user
            ? { ...state.user, portfolioValue: newPortfolioValue }
            : state.user,
        }));
      }
      if (sellPercentage === 100) {
        // Mark as sold in Supabase and remove locally
        try {
          await supabase
            .from('investments')
            .update({ status: 'sold' })
            .eq('id', selectedInvestment.id);
        } catch {}
        setInvestments(investments.filter(inv => inv.id !== selectedInvestment.id));
      } else {
        // Partial sale
        const updatedInvestments = investments.map(inv => {
          if (inv.id === selectedInvestment.id) {
            const remaining = (100 - sellPercentage) / 100;
            return {
              ...inv,
              investedAmount: inv.investedAmount * remaining,
              equity: inv.equity * remaining,
              currentValue: inv.currentValue * remaining
            };
          }
          return inv;
        });
        setInvestments(updatedInvestments);
      }
    }, 1200);
  };

  const confirmSellInvestment = async () => {
    if (!selectedInvestment) return;
    // Compute sale proceeds
    const sellingAmount = (sellPercentage / 100) * selectedInvestment.currentValue;
    // Update user balance
    try {
      if (storeUser?.id) {
        const roundedBalance = Math.round(storeUser.cashAvailable + sellingAmount);
        await updateUserBalanceEverywhere(storeUser.id, roundedBalance);
      }
    } catch (err) {
      console.error('Failed to update user balance on sale:', err);
    }
    // Persist sale on server
    try {
      if (sellPercentage === 100) {
        await supabase.from('investments').update({ status: 'sold' }).eq('id', selectedInvestment.id);
      } else {
        const rem = (100 - sellPercentage) / 100;
        await supabase.from('investments').update({
          amount: selectedInvestment.investedAmount * rem,
          equity: selectedInvestment.equity * rem,
          current_value: selectedInvestment.currentValue * rem,
        }).eq('id', selectedInvestment.id);
      }
    } catch (err) {
      console.error('Failed to update investment on sale:', err);
    }
    // Refresh portfolio and re-simulate market
    await loadPortfolio();
    simulateMarket();
    setShowExitDialog(false);
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  const getSellButtonColor = (growth: number) => {
    if (growth > 20) return '#06D6A0'; // Significant profit - green
    if (growth > 0) return '#5DD499'; // Small profit - light green
    if (growth > -10) return '#FFC107'; // Small loss - yellow
    return '#FF6B6B'; // Significant loss - red
  };

  const renderInvestmentCard = ({ item }: { item: Investment }) => {
    const isGrowthPositive = item.changePercent > 0;
    const growthColor = isGrowthPositive ? '#06D6A0' : '#FF6B6B';
    const sellButtonColor = getSellButtonColor(item.changePercent);
    
    return (
      <Card style={styles.investmentCard}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.startupName}>{item.startup?.name}</Text>
              <Text style={styles.equityLabel}>
                {(item.equity * 100).toFixed(2)}% equity
              </Text>
            </View>
            
            <View style={styles.valueContainer}>
              <Text style={styles.valueLabel}>Current value</Text>
              <Text style={styles.valueAmount}>
                {formatCurrency(item.currentValue)}
              </Text>
              <Text style={[styles.growth, { color: growthColor, fontSize: 18, fontWeight: 'bold', textShadowColor: '#000', textShadowOffset: {width: 0, height: 1}, textShadowRadius: 2 }]}>
                {isGrowthPositive ? '+' : ''}{item.changePercent.toFixed(1)}%
              </Text>
            </View>
          </View>
          
          <View style={styles.investmentDetails}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Invested</Text>
              <Text style={styles.detailValue}>{formatCurrency(item.investedAmount)}</Text>
            </View>
            
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Profit/Loss</Text>
              <Text style={[styles.detailValue, { color: growthColor }]}>
                {formatCurrency(item.currentValue - item.investedAmount)}
              </Text>
            </View>
            
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>ROI</Text>
              <Text style={[styles.detailValue, { color: growthColor }]}>
                {isGrowthPositive ? '+' : ''}{item.changePercent.toFixed(1)}%
              </Text>
            </View>
          </View>
          
          <Button 
            mode="contained" 
            onPress={() => handleSellInvestment(item)}
            style={[styles.sellButton, { backgroundColor: sellButtonColor }]}
          >
            Sell Equity
          </Button>
        </Card.Content>
      </Card>
    );
  };

  if (sessionLoading || !session) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (storeLoading) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: '#1C1B1F' }}>
        <ActivityIndicator size="large" color="#4CAF50" style={{ marginTop: 32 }} />
      </ScrollView>
    );
  }

  if (storeError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {storeError}</Text>
        <Button mode="contained" onPress={() => {/* retry logic */}}>
          Retry
        </Button>
      </View>
    );
  }

  if (investments.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No investments yet</Text>
        <Text style={styles.emptySubtext}>
          Start investing in startups to build your portfolio
        </Text>
      </View>
    );
  }

  const performanceColor = portfolioPerformance >= 0 ? '#0F0' : '#F00';

  // Chart data
  const performanceData = {
    labels: investments.map((_, i) => ``), // hide labels for a clean LED display
    datasets: [{ data: investments.map(inv => inv.currentValue) }]
  };

  return (
    <>
      <FlatList
        style={styles.container}
        data={investments}
        renderItem={renderInvestmentCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Portfolio</Text>
            <Text style={styles.headerBalance}>Cash: {formatCurrency(storeUser?.cashAvailable ?? 0)}</Text>
            <Text style={styles.headerBalance}>Portfolio: {formatCurrency(storeUser?.portfolioValue ?? 0)}</Text>
            <Card style={[styles.summaryCard, { backgroundColor: '#111' }]}> 
              <Card.Content>
                <Text style={[styles.summaryTitle, { color: '#FFFFFF' }]}>Portfolio Performance</Text>
                <View style={[styles.chart, {alignItems: 'center', justifyContent: 'center', height: 200, backgroundColor: '#111', borderRadius: 12}]}> 
                  {portfolioHistory.length > 1 ? (
                    <LineChart
                      data={{
                        labels: portfolioHistory.map((_, i) => i % 5 === 0 ? `${i}` : ''),
                        datasets: [
                          {
                            data: portfolioHistory,
                            color: () => '#4CAF50',
                            strokeWidth: 3,
                          },
                        ],
                      }}
                      width={Dimensions.get('window').width - 72}
                      height={160}
                      chartConfig={{
                        backgroundGradientFrom: '#222',
                        backgroundGradientTo: '#222',
                        color: () => '#4CAF50',
                        labelColor: () => '#aaa',
                        propsForDots: { r: '2', strokeWidth: '1', stroke: '#4CAF50' },
                        propsForBackgroundLines: { stroke: '#444', strokeDasharray: '4,4' },
                        propsForLabels: { fontSize: 12 },
                      }}
                      bezier
                      style={{ borderRadius: 16 }}
                      withVerticalLabels={true}
                      withHorizontalLabels={true}
                      fromZero
                    />
                  ) : (
                    <Text style={{ color: '#aaa', marginTop: 40, textAlign: 'center' }}>
                      Make investments and swipe to see your portfolio performance!
                    </Text>
                  )}
                </View>
                <Text style={[styles.summaryTitle, { color: '#FFFFFF' }]}>Portfolio Allocation</Text>
                <View style={styles.allocationBar}>
                  {investments.map((inv, idx) => (
                    <View 
                      key={inv.id} 
                      style={{
                        flex: totalPortfolioValue > 0 ? inv.currentValue / totalPortfolioValue : 0,
                        backgroundColor: getColor(idx)
                      }}
                    />
                  ))}
                </View>
                <View style={styles.allocationLabels}>
                  {investments.map((inv, idx) => (
                    <Text key={inv.id} style={styles.allocationLabel}>
                      {inv.startup?.name}: {(inv.currentValue/totalPortfolioValue*100).toFixed(1)}%
                    </Text>
                  ))}
                </View>
              </Card.Content>
            </Card>
            <Text style={styles.sectionTitle}>Your Investments</Text>
          </View>
        }
      />
      <Portal>
        <Dialog visible={showExitDialog} onDismiss={() => setShowExitDialog(false)} style={styles.sellDialog}>
          <Dialog.Title style={styles.dialogTitle}>
            Sell Equity in {selectedInvestment?.startup?.name}
          </Dialog.Title>
          
          <Dialog.Content>
            <Text style={styles.dialogText}>
              Current value: {selectedInvestment ? formatCurrency(selectedInvestment.currentValue) : '$0'}
            </Text>
            <Text style={styles.dialogText}>
              How much would you like to sell?
            </Text>
            
            <View style={styles.sellPercentageButtons}>
              {[25, 50, 75, 100].map((percentage) => (
                <TouchableOpacity
                  key={percentage}
                  style={[
                    styles.percentageButton,
                    sellPercentage === percentage && styles.selectedPercentageButton
                  ]}
                  onPress={() => setSellPercentage(percentage)}
                >
                  <Text style={[
                    styles.percentageText,
                    sellPercentage === percentage && styles.selectedPercentageText
                  ]}>
                    {percentage}%
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <Text style={styles.sellAmountText}>
              Amount to receive: {selectedInvestment ? formatCurrency(selectedInvestment.currentValue * (sellPercentage / 100)) : '$0'}
            </Text>
          </Dialog.Content>
          <Dialog.Actions style={{ justifyContent: 'flex-end', paddingHorizontal: 16 }}>
            <Button
              onPress={() => setShowExitDialog(false)}
              labelStyle={{ color: '#AAA', fontSize: 16 }}
              style={{ marginRight: 16, backgroundColor: 'transparent' }}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={confirmSellInvestment}
              labelStyle={{ color: '#222', fontWeight: 'bold', fontSize: 16 }}
              style={{ backgroundColor: '#FFD600' }}
            >
              Sell
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000'
  },
  header: {
    padding: 16
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0F0',
    alignSelf: 'center'
  },
  headerBalance: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F0',
    alignSelf: 'center',
    marginBottom: 12
  },
  chart: {
    marginVertical: 8,
    borderRadius: 8
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1C1B1F',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#FFFFFF',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1C1B1F',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#FF6B6B',
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    width: 120,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1C1B1F',
    padding: 20,
  },
  emptyText: {
    fontSize: 24,
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 16,
    color: '#AAAAAA',
    textAlign: 'center',
  },
  portfolioSummary: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  summaryValue: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  performanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  performanceLabel: {
    color: '#AAAAAA',
    fontSize: 14,
  },
  performanceValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  performanceBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#333',
    marginBottom: 16,
  },
  summaryMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    color: '#AAAAAA',
    fontSize: 12,
    marginBottom: 4,
  },
  metricValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  list: {
    paddingBottom: 20,
  },
  investmentCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  startupName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  equityLabel: {
    color: '#AAAAAA',
    fontSize: 14,
  },
  valueContainer: {
    alignItems: 'flex-end',
  },
  valueLabel: {
    color: '#AAAAAA',
    fontSize: 12,
  },
  valueAmount: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  growth: {
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.2,
  },
  investmentDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  detailItem: {
    flex: 1,
    alignItems: 'center',
  },
  detailLabel: {
    color: '#AAAAAA',
    fontSize: 12,
  },
  detailValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.2,
  },
  sellButton: {
    borderRadius: 8,
  },
  sellDialog: {
    backgroundColor: '#1E293B',
  },
  dialogTitle: {
    color: '#FFFFFF',
  },
  dialogText: {
    color: '#FFFFFF',
    marginBottom: 12,
  },
  sellPercentageButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 16,
  },
  percentageButton: {
    backgroundColor: '#2C3E50',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  selectedPercentageButton: {
    backgroundColor: '#D4AF37',
  },
  percentageText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  selectedPercentageText: {
    color: '#000000',
  },
  sellAmountText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  summaryCard: { 
    marginVertical: 16,
    borderRadius: 12,
    elevation: 4,
    backgroundColor: '#111'
  },
  performanceLegend: { flexDirection:'row', flexWrap:'wrap', marginVertical:8 },
  legendItem: { flexDirection:'row', alignItems:'center', marginRight:12, marginBottom:4 },
  legendColor: { width:12, height:12, borderRadius:6, marginRight:6 },
  legendText: { fontSize:12, color:'#333' },
  allocationBar: { flexDirection:'row', height:12, borderRadius:6, overflow:'hidden', marginBottom:8 },
  allocationLabels: { flexDirection:'row', flexWrap:'wrap', justifyContent:'space-between' },
  allocationLabel: { fontSize:12, color:'#FFFFFF', marginRight:8 },
}); 