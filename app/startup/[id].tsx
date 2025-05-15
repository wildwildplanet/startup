import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Image, ActivityIndicator, Platform, Dimensions, TouchableOpacity } from 'react-native';
import { Text, Button, Card, Chip, Divider, useTheme, IconButton, Avatar, ProgressBar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useSupabase } from '../../lib/supabase/SupabaseProvider';
import { fetchUserProfile } from '../../lib/supabase/supabaseClient';
import { useStore } from '../../lib/store/useStore';
import { PitchCard } from '../../components/Cards/PitchCard';
import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import InvestmentModal from '../../components/Investments/InvestmentModal';
import { supabase } from '../../lib/supabase/supabaseClient';
import { LinearGradient } from 'expo-linear-gradient';

// Define startup interface based on database schema
interface Startup {
  id: string;
  name: string;
  logo: string;
  askamount: number;
  valuation: number;
  roi: number;
  problem: string;
  solution: string;
  fundinguse: string;
  growth: string;
  team_background?: string;
  market: string;
  traction: string;
  risks: string;
  stage: string;
  industry: string;
  risklevel: string;
  tagline?: string;
  description?: string;
  market_size?: number;
  business_model?: string;
  go_to_market?: string;
  competition?: string;
  competitive_advantage?: string;
  exit_strategy?: string;
  key_metrics?: string;
  min_investment?: number;
  equity_offered?: number;
  exit_multiplier?: number;
  exit_probability?: number;
  funding_goal?: number;
  use_of_funds?: string;
  founded_date?: string;
  location?: string;
  team_size?: number;
  team_lead?: string;
  growth_rate?: number;
  revenue?: number;
  margins?: number;
  milestones?: string;
  negotiation_willingness?: number;
}

// Format currency utility function
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: amount >= 1000000 ? 'compact' : 'standard',
    maximumFractionDigits: amount >= 1000000 ? 1 : 0,
  }).format(amount);
};

// Format market size utility function
const formatMarketSize = (amount?: number) => {
  if (!amount) return 'Unknown';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount);
};

// Simplified formatter: round down to nearest K or M
const formatCompactAmount = (amount: number) => {
  if (amount >= 1000000) {
    return `$${Math.floor(amount / 1000000)}M`;
  } else if (amount >= 1000) {
    return `$${Math.floor(amount / 1000)}K`;
  }
  return `$${amount}`;
};

// Get risk level color
const getRiskLevelColor = (riskLevel: string): readonly [string, string] => {
  switch (riskLevel.toLowerCase()) {
    case 'high':
      return ['#FF4B4B', '#FF7676'] as const;
    case 'medium':
      return ['#FFA726', '#FFCC80'] as const;
    case 'low':
      return ['#66BB6A', '#A5D6A7'] as const;
    default:
      return ['#90CAF9', '#BBDEFB'] as const;
  }
};

export default function StartupDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const theme = useTheme();
  const { session } = useSupabase();
  // Use global store for current user balance
  const storeUser = useStore(state => state.user);
  const userBalance = storeUser?.cashAvailable ?? 0;
  
  const [startup, setStartup] = useState<Startup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [investmentAmount, setInvestmentAmount] = useState<number>(0);
  const [showInvestmentModal, setShowInvestmentModal] = useState(false);

  // Fetch startup details
  useEffect(() => {
    const fetchStartup = async () => {
      setLoading(true);
      try {
        if (!id) {
          throw new Error('No startup ID provided');
        }
        
        const { data, error } = await supabase
          .from('startups')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) {
          throw error;
        }
        
        setStartup(data);
        
        // Set default investment amount if min_investment is available
        if (data?.min_investment) {
          setInvestmentAmount(data.min_investment);
        } else if (data?.askamount) {
          // Otherwise set to 10% of ask amount as a reasonable default
          setInvestmentAmount(Math.round(data.askamount * 0.1));
        }
      } catch (err: any) {
        console.error('Error fetching startup:', err);
        setError(err.message || 'Failed to load startup details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchStartup();
  }, [id]);

  // Handle investment button press
  const handleInvest = () => {
    setShowInvestmentModal(true);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 16 }}>Loading startup details...</Text>
      </View>
    );
  }

  if (error || !startup) {
    return (
      <View style={styles.errorContainer}>
        <Text style={{ marginBottom: 16, textAlign: 'center' }}>
          {error || 'Unable to load startup details'}
        </Text>
        <Button mode="contained" onPress={() => router.back()}>
          Go Back
        </Button>
      </View>
    );
  }

  // Calculate equity based on investment amount and valuation
  const calculateEquity = (amount: number, valuation: number) => {
    return ((amount / valuation) * 100).toFixed(2);
  };

  // Calculate potential return based on ROI
  const calculatePotentialReturn = (amount: number, roi: number) => {
    return amount * (1 + roi / 100);
  };

  // Prepare Deep‑Dive sections with metrics and text
  const sections = [
    { title: 'About', type: 'text', data: startup.description ? [startup.description] : [] },
    { title: 'Problem', type: 'text', data: startup.problem ? [startup.problem] : [] },
    { title: 'Solution', type: 'text', data: startup.solution ? [startup.solution] : [] },
    { title: 'Team', type: 'text', data: startup.team_background ? [startup.team_background] : [] },
    { title: 'Financials', type: 'metrics', metrics: [
      { label: 'Ask', value: formatCurrency(startup.askamount) },
      { label: 'Valuation', value: formatCurrency(startup.valuation) },
      { label: 'ROI', value: `+${startup.roi}%` },
    ] },
    { title: 'Market', type: 'metrics', metrics: [
      { label: 'Market Size', value: formatMarketSize(startup.market_size) },
      { label: 'Industry', value: startup.industry },
    ] },
    { title: 'Details', type: 'metrics', metrics: [
      { label: 'Stage', value: startup.stage },
      { label: 'Risk Level', value: startup.risklevel },
      { label: 'Min Investment', value: startup.min_investment ? formatCurrency(startup.min_investment) : 'N/A' },
    ] },
    { title: 'Business Model', type: 'text', data: startup.business_model ? [startup.business_model] : [] },
    { title: 'Go to Market', type: 'text', data: startup.go_to_market ? [startup.go_to_market] : [] },
    { title: 'Competition', type: 'text', data: startup.competition ? [startup.competition] : [] },
    { title: 'Competitive Advantage', type: 'text', data: startup.competitive_advantage ? [startup.competitive_advantage] : [] },
    { title: 'Exit Strategy', type: 'text', data: startup.exit_strategy ? [startup.exit_strategy] : [] },
    { title: 'Key Metrics', type: 'text', data: startup.key_metrics ? [startup.key_metrics] : [] },
    { title: 'Growth', type: 'text', data: startup.growth ? [startup.growth] : [] },
    { title: 'Traction', type: 'text', data: startup.traction ? [startup.traction] : [] },
    { title: 'Risks', type: 'text', data: startup.risks ? [startup.risks] : [] },
  ].filter(sec => (sec.data?.length ?? 0) > 0 || (sec.metrics?.length ?? 0) > 0);

  // Icons for section headers
  const sectionIcons: Record<string, JSX.Element> = {
    Problem: <MaterialCommunityIcons name="alert-circle-outline" size={20} color={theme.colors.primary} />,
    Solution: <MaterialCommunityIcons name="lightbulb-outline" size={20} color={theme.colors.primary} />,
    Financials: <Ionicons name="cash-outline" size={20} color={theme.colors.primary} />,
    Team: <MaterialCommunityIcons name="account-group-outline" size={20} color={theme.colors.primary} />,
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Close button */}
        <IconButton icon="arrow-left" iconColor={theme.colors.onSurface} size={24} style={styles.backButton} onPress={() => router.back()} />
        <IconButton icon="close" iconColor={theme.colors.onSurface} size={24} style={styles.closeButton} onPress={() => router.back()} />
        {/* Header */}
        <LinearGradient colors={[theme.colors.secondary, '#000000']} style={styles.detailsHeader}>
          {startup.logo ? (
            <Image source={{ uri: startup.logo }} style={styles.headerLogo} />
          ) : (
            <Avatar.Text size={80} label={startup.name.slice(0,2).toUpperCase()} style={styles.headerAvatar} labelStyle={styles.headerAvatarLabel} />
          )}
          <Text variant="headlineMedium" style={styles.headerName}>{startup.name}</Text>
          {startup.tagline && <Text variant="bodyMedium" style={styles.headerTagline}>{startup.tagline}</Text>}
          <View style={styles.headerMetricsContainer}>
            <View style={styles.headerMetricItem}>
              <FontAwesome5 name="dollar-sign" size={20} color="#4CAF50" />
              <Text style={styles.headerMetricValue}>{formatCompactAmount(startup.askamount)}</Text>
              <Text style={styles.headerMetricLabel}>Ask</Text>
            </View>
            <View style={styles.headerMetricItem}>
              <FontAwesome5 name="balance-scale" size={20} color="#0A66C2" />
              <Text style={styles.headerMetricValue}>{formatCompactAmount(startup.valuation)}</Text>
              <Text style={styles.headerMetricLabel}>Valuation</Text>
            </View>
            <View style={styles.headerMetricItem}>
              <FontAwesome5 name="percent" size={20} color="#E34D4D" />
              <Text style={styles.headerMetricValue}>+{Math.round(startup.roi)}%</Text>
              <Text style={styles.headerMetricLabel}>ROI</Text>
            </View>
          </View>
          <Button mode="contained" onPress={handleInvest} style={styles.investActionButton} labelStyle={styles.investButtonLabel}>Invest</Button>
        </LinearGradient>
        {/* Detailed Metrics Card */}
        <Card style={styles.metricsCard}>
          <Card.Content>
            <Text style={[styles.metricsTitle, { color: '#000000', width: '100%' }]} >Key Metrics</Text>
            <View style={styles.metricsGrid}>
              {/* Equity Offered */}
              <View style={styles.metricBox}>
                <FontAwesome5 name="percent" size={20} color={theme.colors.primary} style={styles.metricIcon} />
                <Text style={styles.metricLabel}>Equity Offered</Text>
                <Text style={styles.metricValue}>{Math.round(startup.equity_offered ?? 0)}%</Text>
              </View>
              {/* Exit Multiplier */}
              <View style={styles.metricBox}>
                <FontAwesome5 name="award" size={20} color={theme.colors.primary} style={styles.metricIcon} />
                <Text style={styles.metricLabel}>Exit Multiplier</Text>
                <Text style={styles.metricValue}>{Math.round(startup.exit_multiplier ?? 0)}×</Text>
              </View>
              {/* Exit Probability */}
              <View style={styles.metricBox}>
                <FontAwesome5 name="chart-bar" size={20} color={theme.colors.primary} style={styles.metricIcon} />
                <Text style={styles.metricLabel}>Exit Probability</Text>
                <ProgressBar progress={startup.exit_probability ?? 0} color={theme.colors.primary} style={styles.progressBar} />
                <Text style={styles.metricValue}>{((startup.exit_probability ?? 0) * 100).toFixed(0)}%</Text>
              </View>
              {/* Funding Goal */}
              <View style={styles.metricBox}>
                <FontAwesome5 name="money-bill-wave" size={20} color={theme.colors.primary} style={styles.metricIcon} />
                <Text style={styles.metricLabel}>Funding Goal</Text>
                <Text style={styles.metricValue}>{formatCurrency(startup.funding_goal ?? 0)}</Text>
              </View>
              {/* Founded */}
              <View style={styles.metricBox}>
                <FontAwesome5 name="calendar-alt" size={20} color={theme.colors.primary} style={styles.metricIcon} />
                <Text style={styles.metricLabel}>Founded</Text>
                <Text style={styles.metricValue}>{startup.founded_date}</Text>
              </View>
              {/* Location */}
              <View style={styles.metricBox}>
                <FontAwesome5 name="map-marker-alt" size={20} color={theme.colors.primary} style={styles.metricIcon} />
                <Text style={styles.metricLabel}>Location</Text>
                <Text style={styles.metricValue}>{startup.location}</Text>
              </View>
              {/* Team Size */}
              <View style={styles.metricBox}>
                <FontAwesome5 name="users" size={20} color={theme.colors.primary} style={styles.metricIcon} />
                <Text style={styles.metricLabel}>Team Size</Text>
                <Text style={styles.metricValue}>{startup.team_size ?? 0}</Text>
              </View>
              {/* Team Lead */}
              <View style={styles.metricBox}>
                <FontAwesome5 name="user-tie" size={20} color={theme.colors.primary} style={styles.metricIcon} />
                <Text style={styles.metricLabel}>Team Lead</Text>
                <Text style={styles.metricValue}>{startup.team_lead}</Text>
              </View>
              {/* Growth Rate */}
              <View style={styles.metricBox}>
                <FontAwesome5 name="chart-line" size={20} color={theme.colors.primary} style={styles.metricIcon} />
                <Text style={styles.metricLabel}>Growth Rate</Text>
                <ProgressBar progress={(startup.growth_rate ?? 0) / 100} color={theme.colors.primary} style={styles.progressBar} />
                <Text style={styles.metricValue}>{Math.round(startup.growth_rate ?? 0)}%</Text>
              </View>
              {/* Revenue */}
              <View style={styles.metricBox}>
                <FontAwesome5 name="dollar-sign" size={20} color={theme.colors.primary} style={styles.metricIcon} />
                <Text style={styles.metricLabel}>Revenue</Text>
                <Text style={styles.metricValue}>{formatCurrency(startup.revenue ?? 0)}</Text>
              </View>
              {/* Margins */}
              <View style={styles.metricBox}>
                <FontAwesome5 name="percent" size={20} color={theme.colors.primary} style={styles.metricIcon} />
                <Text style={styles.metricLabel}>Margins</Text>
                <Text style={styles.metricValue}>{Math.round(startup.margins ?? 0)}%</Text>
              </View>
              {/* Negotiation */}
              <View style={styles.metricBox}>
                <FontAwesome5 name="handshake" size={20} color={theme.colors.primary} style={styles.metricIcon} />
                <Text style={styles.metricLabel}>Negotiation</Text>
                <Text style={styles.metricValue}>{startup.negotiation_willingness ? 'Open' : 'Fixed'}</Text>
              </View>
              {/* Use of Funds */}
              <View style={[styles.metricBox, styles.metricBoxFull]}>
                <FontAwesome5 name="toolbox" size={20} color={theme.colors.primary} style={styles.metricIcon} />
                <Text style={styles.metricLabel}>Use of Funds</Text>
                <Text style={styles.metricValue}>{startup.use_of_funds}</Text>
              </View>
              {/* Milestones */}
              <View style={[styles.metricBox, styles.metricBoxFull]}>
                <FontAwesome5 name="flag-checkered" size={20} color={theme.colors.primary} style={styles.metricIcon} />
                <Text style={styles.metricLabel}>Milestones</Text>
                <Text style={styles.metricValue}>{startup.milestones}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
        {/* Text & Metrics Sections as Cards */}
        {sections.map((sec, idx) => (
          <Card key={idx} style={styles.sectionCard}>
            <View style={[styles.sectionHeader, sec.type === 'metrics' && styles.sectionHeaderDark]}>
              {sectionIcons[sec.title] || <MaterialCommunityIcons name="file-document-outline" size={20} color={theme.colors.primary} />}
              <Text style={[styles.sectionCardHeader, sec.type === 'metrics' && styles.sectionCardHeaderDark]}>{sec.title}</Text>
            </View>
            <Divider style={[styles.sectionDivider, sec.type === 'metrics' && styles.sectionDividerDark]} />
            <Card.Content>
              {sec.type === 'metrics' ? (
                <View style={styles.metricsList}>
                  {(sec.metrics ?? []).map((m, j) => (
                    <View style={styles.metricListItem} key={j}>
                      <Text style={styles.metricLabel}>{m.label}</Text>
                      <Text style={styles.metricValue}>{m.value}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <>
                  {(sec.data ?? []).map((item, i) => {
                    if (sec.title === 'Key Metrics') {
                      return (
                        <View style={styles.textRow} key={i}>
                          <FontAwesome5 name="chart-line" size={16} color={theme.colors.primary} style={styles.textIcon} />
                          <Text style={styles.pitchSectionText}>{item}</Text>
                        </View>
                      );
                    } else if (sec.title === 'Traction') {
                      return (
                        <View style={styles.textRow} key={i}>
                          <FontAwesome5 name="rocket" size={16} color={theme.colors.primary} style={styles.textIcon} />
                          <Text style={styles.pitchSectionText}>{item}</Text>
                        </View>
                      );
                    }
                    return <Text style={styles.pitchSectionText} key={i}>{item}</Text>;
                  })}
                </>
              )}
            </Card.Content>
          </Card>
         ))}
      </ScrollView>
      {/* Investment Modal */}
      <InvestmentModal
        visible={showInvestmentModal}
        onClose={() => setShowInvestmentModal(false)}
        onSuccess={(investmentId) => {
          setShowInvestmentModal(false);
        }}
        startup={startup}
        userBalance={userBalance}
      />
      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.footerItem} onPress={() => router.push('/tabs/home')}>
          <FontAwesome5 name="fire" size={24} color={theme.colors.primary} />
          <Text style={[styles.footerLabel, { color: theme.colors.primary }]}>Swipe</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerItem} onPress={() => router.push('/tabs/discover')}>
          <Ionicons name="compass" size={24} color={theme.colors.primary} />
          <Text style={[styles.footerLabel, { color: theme.colors.primary }]}>Discover</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerItem} onPress={() => router.push('/tabs/portfolio')}>
          <Ionicons name="briefcase" size={24} color={theme.colors.primary} />
          <Text style={[styles.footerLabel, { color: theme.colors.primary }]}>Portfolio</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerItem} onPress={() => router.push('/tabs/balance')}>
          <MaterialCommunityIcons name="currency-usd" size={24} color={theme.colors.primary} />
          <Text style={[styles.footerLabel, { color: theme.colors.primary }]}>Bank</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerItem} onPress={() => router.push('/tabs/profile')}>
          <Ionicons name="person" size={24} color={theme.colors.primary} />
          <Text style={[styles.footerLabel, { color: theme.colors.primary }]}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ececec',
  },
  contentContainer: {
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  detailsHeader: {
    padding: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    backgroundColor: '#000000', // dark fallback
  },
  headerLogo: { width: 100, height: 100, borderRadius: 50, marginBottom: 12 },
  headerAvatar: { backgroundColor: '#F0F0F0', marginBottom: 12 },
  headerAvatarLabel: { color: '#666' },
  headerName: { color: '#FFF', fontWeight: 'bold', marginBottom: 4, fontSize: 24 },
  headerTagline: { color: '#DDD', fontStyle: 'italic', marginBottom: 12, fontSize: 16 },
  headerMetricsContainer: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginBottom: 16 },
  headerMetricItem: { alignItems: 'center', flex: 1 },
  headerMetricValue: { color: '#FFF', fontWeight: 'bold', fontSize: 18 },
  headerMetricLabel: { color: '#FFF', fontSize: 14 },
  investActionButton: { backgroundColor: '#FFD700', alignSelf: 'center', paddingVertical: 12, paddingHorizontal: 40, borderRadius: 24 },
  investButtonLabel: { color: '#000000', fontSize: 18, fontWeight: 'bold' },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 16 : 8,
    left: 16,
    zIndex: 20,
    elevation: 10,
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 16 : 8,
    right: 16,
    zIndex: 20,
    elevation: 10,
  },
  sectionCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
    backgroundColor: '#FFFFFF',
  },
  sectionCardTitle: {
    fontWeight: 'bold',
    color: '#000',
  },
  metricsList: {
    flexDirection: 'column',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  metricListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  textRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  textIcon: {
    marginRight: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  sectionCardHeader: {
    fontWeight: '600', color: '#000', fontSize: 20,
    marginLeft: 8,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 16,
    marginVertical: 8,
  },
  sectionHeaderDark: {
    backgroundColor: '#000',
  },
  sectionCardHeaderDark: {
    color: '#fff',
  },
  sectionDividerDark: {
    backgroundColor: '#333',
  },
  pitchSectionText: {
    color: '#000', fontSize: 20, lineHeight: 32, marginBottom: 12,
  },
  metricsCard: { margin: 16, borderRadius: 12, backgroundColor: '#FFFFFF', elevation: 3 },
  metricsTitle: { fontSize: 20, fontWeight: 'bold', marginLeft: 16, marginBottom: 12, color: '#000000', width: '100%' },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  metricBox: { width: '48%', marginBottom: 16, alignItems: 'center' },
  metricBoxFull: { width: '100%', alignItems: 'flex-start', paddingHorizontal: 16, marginBottom: 16 },
  metricIcon: { marginBottom: 4 },
  metricLabel: { fontSize: 16, color: '#666666', marginBottom: 4 },
  metricValue: { fontSize: 18, fontWeight: 'bold', color: '#000000' },
  progressBar: { width: '80%', height: 6, borderRadius: 3, marginVertical: 4 },
  footer: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingVertical: 12, backgroundColor: '#ececec' },
  footerItem: { alignItems: 'center' },
  footerLabel: { fontSize: 12, marginTop: 4 },
});