import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  Dimensions, 
  ActivityIndicator, 
  Animated, 
  PanResponder,
  ScrollView,
  StatusBar,
  Platform,
  FlatList,
  TouchableOpacity,
  InteractionManager
} from 'react-native';
import { Text, Button, useTheme, IconButton, Surface, Divider, Snackbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase/supabaseClient';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import InvestmentModal from '../../components/Investments/InvestmentModal';
import { useStore } from '../../lib/store/useStore';
import { useSupabase } from '../../lib/supabase/SupabaseProvider';
import { useIsFocused } from '@react-navigation/native';
import Svg, { Rect, G, Text as SvgText, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
let UnityAds: any;
try {
  UnityAds = require('react-native-unity-ads');
} catch (e) {
  UnityAds = null;
}

// Get screen dimensions
const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

// Swipe threshold - card is considered swiped when moved beyond this distance
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

// Number of startups to load per page
const PAGE_SIZE = 8;

// LinkedIn-inspired theme colors
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
  darkBg: '#1C2533', // Dark navy/black for card background
  cardSectionBg: '#F5F1E8', // Beige for card sections
  goldButton: '#D4AF37', // Gold color for button
  goldButtonText: '#000000', // Black text for gold button
};

// Format currency utility function
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: amount >= 1000000 ? 'compact' : 'standard',
    maximumFractionDigits: amount >= 1000000 ? 0 : 0,
  }).format(amount);
};

// Random country picker function for default values
const getRandomCountry = () => {
  // Keeping this function as it might be used elsewhere, but removing the actual country logic
  return '';
};

// Country flags with more country codes for better mapping
const countryFlags: Record<string, any> = {
  US: require('../../assets/images/country_png/us.png'),
  UK: require('../../assets/images/country_png/uk.png'),
  GB: require('../../assets/images/country_png/uk.png'), // Alternative code for UK
  CA: require('../../assets/images/country_png/ca.png'),
  SG: require('../../assets/images/country_png/sg.png'),
  IN: require('../../assets/images/country_png/in.png'),
  // Add more flags as needed for your startups
};

// Improved flag source function that handles location to country code mapping
const getCountryFlagSource = (country: string | undefined, location: string | undefined): any => {
  if (!country && !location) return countryFlags.US;
  
  // Try to derive country from location if country is not specified
  if (!country && location) {
    // Simple location to country mapping
    if (location.includes('United States') || location.includes('USA') || location.includes('US')) 
      return countryFlags.US;
    if (location.includes('United Kingdom') || location.includes('UK') || location.includes('England') || location.includes('Britain'))
      return countryFlags.GB;
    if (location.includes('Canada'))
      return countryFlags.CA;
    if (location.includes('Singapore'))
      return countryFlags.SG;
    if (location.includes('India'))
      return countryFlags.IN;
  }
  
  // Use the specified country if available
  if (country) {
    const upperCountry = String(country).toUpperCase();
    // Check for the country code in our flags object
    if (countryFlags[upperCountry as keyof typeof countryFlags]) {
      return countryFlags[upperCountry as keyof typeof countryFlags];
    }
    
    // Handle special cases
    if (upperCountry === 'UNITED KINGDOM' || upperCountry === 'GREAT BRITAIN')
      return countryFlags.GB;
    if (upperCountry === 'UNITED STATES' || upperCountry === 'AMERICA')
      return countryFlags.US;
  }
  
  // Default to US flag if we couldn't determine the country
  return countryFlags.US;
};

// Interface for startup data
interface Startup {
  id: string;
  name: string;
  askamount: number;
  valuation: number;
  roi: number;
  problem: string;
  solution: string;
  fundinguse?: string;
  revenue?: string;
  growth?: string;
  team?: string;
  teamsize?: number;
  market?: string;
  traction?: string;
  risks?: string;
  stage: string;
  industry: string;
  risklevel: string;
  created_at?: string;
  tagline?: string;
  description?: string;
  market_size?: number;
  business_model?: string;
  go_to_market?: string;
  competition?: string;
  competitive_advantage?: string;
  exit_strategy?: string;
  team_background?: string;
  key_metrics?: string;
  milestones?: string;
  use_of_funds?: string;
  closing_hook?: string;
  funding_goal?: number;
  equity_offered?: number;
  location?: string;
  country?: string;
  founded_date?: string;
  team_size?: number;
  current_revenue?: number;
  growth_rate?: number;
  margins?: number;
  min_investment?: number;
  negotiation_willingness?: number;
  growth_rate_monthly?: number;
  current_status?: string;
  exit_multiplier?: number;
  exit_probability?: number;
  _logoError?: boolean; // Flag to track logo loading errors
  funding_allocation?: {
    product_development: number;
    marketing: number;
    operations: number;
  };
  financials?: {
    revenue: number;
    gross_margin: number;
    growth_rate: number;
  };
}

// Dev-only logging helper
const devLog = (...args: any[]) => { if (__DEV__) console.log(...args); };

export default function SwipeScreen() {
  // Light-weight out-of-funds message
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  // Market simulation hook must be inside component
  const simulateMarket = useStore(state => state.simulateMarket);
  const loadPortfolio = useStore(state => state.loadPortfolio);
  const theme = useTheme();
  const router = useRouter();
  const { session } = useSupabase();
  
  // Track total swipes
  const [swipeCount, setSwipeCount] = useState(0);
  
  // Pagination state for swipe deck
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Subscribe directly to cashAvailable for live updates (default $1M)
  const cashAvailable = useStore(state => state.user?.cashAvailable ?? 1000000);
  const user = useStore(state => state.user); // still pick user for other logic
  
  // State variables
  const [startups, setStartups] = useState<Startup[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [investModalVisible, setInvestModalVisible] = useState(false);
  const [currentStartup, setCurrentStartup] = useState<Startup | null>(null);
  const [showTip, setShowTip] = useState(false);
  const tipTimer = useRef<NodeJS.Timeout | null>(null);
  
  // Tooltip animation values
  const tipTranslateY = useRef(new Animated.Value(-50)).current;
  const tipOpacity = useRef(new Animated.Value(0)).current;
  
  // Animation values
  const position = useRef(new Animated.ValueXY()).current;
  const rotation = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ['-10deg', '0deg', '10deg'],
    extrapolate: 'clamp',
  });
  
  // Button scale animations
  const likeScale = useRef(new Animated.Value(1)).current;
  const passScale = useRef(new Animated.Value(1)).current;
  
  // Opacity values for "INVEST" and "PASS" labels
  const likeOpacity = position.x.interpolate({
    inputRange: [0, SCREEN_WIDTH / 4],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  
  const nopeOpacity = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 4, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  // PanResponder for swipe gestures on the card (recreated each render to capture fresh state)
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_evt, gestureState) =>
      Math.abs(gestureState.dx) > 20 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
    onPanResponderMove: (_evt, { dx }) => {
      position.setValue({ x: dx, y: 0 });
    },
    onPanResponderRelease: (_evt, { dx }) => {
      devLog('Pan released - dx:', dx);
      if (dx > SWIPE_THRESHOLD) {
        devLog('Swipe right detected - performing invest action');
        nextCard(true);
      } else if (dx < -SWIPE_THRESHOLD) {
        devLog('Swipe left detected - moving to next card');
        nextCard(false);
      }
      // reset card position to center
      Animated.spring(position, { toValue: { x: 0, y: 0 }, friction: 5, useNativeDriver: false }).start();
    },
    onPanResponderTerminationRequest: () => false,
  });

  // Add debug logging for the current UI state
  useEffect(() => {
    devLog('Current UI state:', {
      investModalVisible,
      currentStartupId: currentStartup?.id,
      currentStartupName: currentStartup?.name,
      startupCount: startups.length,
      currentIndex,
    });
  }, [investModalVisible, currentStartup, startups, currentIndex]);
  
  // Subscribe to focus state for refreshing startups
  const isFocused = useIsFocused();
  useEffect(() => {
    if (isFocused) {
      fetchStartups(0);
    }
  }, [isFocused]);
  
  // Fetch startups from Supabase with pagination (optimized)
  const fetchStartups = useCallback(async (pageNum = 0) => {
    // prevent redundant calls
    if (pageNum === 0 && loading) return;
    if (pageNum > 0 && loadingMore) return;

    // set loading flags
    if (pageNum === 0) setLoading(true);
    else setLoadingMore(true);

    try {
      // Fetch all startups for random shuffle locally
      const { data: allData, error } = await supabase
        .from('startups')
        .select('*');

      if (error) {
        devLog('Error fetching startups:', error);
        return;
      }
      
      devLog(`Fetched ${allData?.length || 0} startups`);

      // normalize incoming data
      const enhancedData = (allData || []).map(startup => {
        return {
          id: startup.id,
          name: startup.name || 'Unnamed Startup',
          askamount: startup.askamount || 500000,
          valuation: startup.valuation || 5000000,
          roi: startup.roi || 30,
          problem: startup.problem || 'No problem statement provided',
          solution: startup.solution || 'No solution description provided',
          stage: startup.stage || 'Seed',
          industry: startup.industry || 'Technology',
          risklevel: startup.risklevel || 'Medium',
          
          // All other fields
          created_at: startup.created_at,
          tagline: startup.tagline || '',
          description: startup.description || '',
          market: startup.market || '',
          market_size: startup.market_size || 0,
          traction: startup.traction || '',
          team: startup.team || '',
          teamsize: startup.teamsize || 3,
          fundinguse: startup.fundinguse || '',
          revenue: startup.revenue || '',
          growth: startup.growth || '',
          risks: startup.risks || '',
          team_background: startup.team_background || '',
          key_metrics: startup.key_metrics || '',
          business_model: startup.business_model || '',
          go_to_market: startup.go_to_market || '',
          competitive_advantage: startup.competitive_advantage || '',
          competition: startup.competition || '',
          exit_strategy: startup.exit_strategy || '',
          milestones: startup.milestones || '',
          use_of_funds: startup.use_of_funds || '',
          closing_hook: startup.closing_hook || '',
          funding_goal: startup.funding_goal || 0,
          equity_offered: startup.equity_offered || 0,
          location: startup.location || '',
          // We keep the country property for data structure consistency but don't use it in the UI
          country: '',
          founded_date: startup.founded_date || '',
          team_size: startup.team_size || startup.teamsize || 3,
          current_revenue: startup.current_revenue || 0,
          growth_rate: startup.growth_rate || 0,
          margins: startup.margins || 0,
          min_investment: startup.min_investment || 0,
          negotiation_willingness: startup.negotiation_willingness || 0,
          growth_rate_monthly: startup.growth_rate_monthly || 0,
          current_status: startup.current_status || '',
          exit_multiplier: startup.exit_multiplier || 0,
          exit_probability: startup.exit_probability || 0,
          
          // Handle nested objects that might be stored as JSON strings
          funding_allocation: typeof startup.funding_allocation === 'string' 
            ? JSON.parse(startup.funding_allocation)
            : startup.funding_allocation || {
                product_development: 55,
                marketing: 30,
                operations: 15
              },
          
          financials: typeof startup.financials === 'string'
            ? JSON.parse(startup.financials)
            : startup.financials || {
                revenue: startup.current_revenue || 1200000,
                gross_margin: startup.margins || 35,
                growth_rate: startup.growth_rate_monthly || 4,
              }
        };
      });
      
      // Exclude any startups already swiped
      const filteredData = enhancedData.filter(item => !swipedIdsRef.current.has(item.id));
      const shuffled = [...filteredData].sort(() => Math.random() - 0.5);
      const startIdx = pageNum * PAGE_SIZE;
      const endIdx = startIdx + PAGE_SIZE;
      const pageItems = shuffled.slice(startIdx, endIdx);

      if (pageNum === 0) {
        setStartups(pageItems);
        setCurrentIndex(0);
        if (pageItems.length > 0) setCurrentStartup(pageItems[0]);
      } else {
        setStartups(prev => [...prev, ...pageItems]);
      }
      setPage(pageNum);
      setHasMore(endIdx < shuffled.length);
    } catch (err) {
      devLog('Unexpected error fetching startups:', err);
      setLoading(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [loading, loadingMore]);

  // Initial fetch on mount
  useEffect(() => {
    fetchStartups(0);
  }, []);

  // Prefetch next page when nearing end of current deck
  useEffect(() => {
    // Only prefetch when initial load done and we have cards, without blocking UI
    if (!loading && startups.length > 0 && currentIndex >= startups.length - 2 && hasMore && !loadingMore) {
      InteractionManager.runAfterInteractions(() => {
        fetchStartups(page + 1);
      });
    }
  }, [currentIndex, startups, hasMore, loadingMore, loading]);
  
  // Animate tooltip slide-down and fade-out on first render
  useEffect(() => {
    setShowTip(true);
    Animated.parallel([
      Animated.timing(tipTranslateY, { toValue: 0, duration: 500, useNativeDriver: true }),
      Animated.timing(tipOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start(() => {
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(tipTranslateY, { toValue: -50, duration: 500, useNativeDriver: true }),
          Animated.timing(tipOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
        ]).start(() => setShowTip(false));
      }, 10000);
    });
  }, []);
  
  // Reset tip timer when user interacts
  const resetTipTimer = () => {
    setShowTip(false);
  };
  
  // Track IDs swiped this session (to hide them)
  const swipedIdsRef = useRef<Set<string>>(new Set());

  // Move to the next card
  const nextCard = (invested: boolean) => {
    // Record swipe for session
    if (currentStartup?.id) swipedIdsRef.current.add(currentStartup.id);
    // Swipe right => invest
    if (invested) {
      if (cashAvailable <= 0) {
        setSnackbarVisible(true);
        return;
      }
      devLog('Swipe right detected - opening invest modal for startup:', currentStartup?.name);
      setInvestModalVisible(true);
      return;
    }
    // Swipe left => pass and advance
    devLog('Swipe left detected - moving to next card');
    setSwipeCount(prev => {
      const newCount = prev + 1;
      simulateMarket();
      if (newCount % 10 === 0) showInterstitialAd();
      return newCount;
    });
    // Remove swiped card locally
    const remaining = startups.filter(s => s.id !== currentStartup?.id);
    setStartups(remaining);
    // Reset position
    position.setValue({ x: 0, y: 0 });
    if (remaining.length > 0) {
      setCurrentIndex(0);
      setCurrentStartup(remaining[0]);
    } else {
      devLog('No startups available after swipe, loading more...');
      fetchStartups(page + 1);
    }
  };

  // Get risk level color for styling
  const getRiskLevelColor = (riskLevel: string): readonly [string, string] => {
    switch (riskLevel?.toLowerCase() || 'medium') {
      case 'high':
        return [THEME.error, '#FF7676'] as const;
      case 'medium':
        return ['#FFA726', '#FFCC80'] as const;
      case 'low':
        return [THEME.success, '#A5D6A7'] as const;
      default:
        return ['#90CAF9', '#BBDEFB'] as const;
    }
  };

  // Get stage color for badge styling
  const getStageColor = (stage: string) => {
    switch (stage?.toLowerCase() || 'seed') {
      case 'seed':
        return '#8BC34A';
      case 'series a':
        return THEME.primary;
      case 'series b':
        return '#FF7043';
      case 'series c':
        return '#9575CD';
      default:
        return '#78909C';
    }
  };

  // Handle tapping a startup card to view details
  const handleStartupPress = (startup: Startup) => {
    router.push(`/startup/${startup.id}`);
  };

  // Handle investment modal closure
  const handleInvestModalClose = () => {
    devLog('Investment modal closed, moving to next card');
    
    // IMPORTANT: Hide the modal first
    setInvestModalVisible(false);
    
    // Wait a moment before animating to the next card
    setTimeout(() => {
      devLog('Now animating to next card after modal close');
      // Reset position first
      position.setValue({ x: 0, y: 0 });
      
      // Move to next card without animation
      const newIndex = startups.length > 0 ? 
        (currentIndex + 1 >= startups.length ? 0 : currentIndex + 1) : 0;
      
      setCurrentIndex(newIndex);
      if (startups.length > 0) {
        setCurrentStartup(startups[newIndex]);
      }
    }, 500);
  };

  // Handle successful investment
  const handleInvestmentSuccess = () => {
    devLog('Investment successful');
    router.push('/tabs/portfolio');
  };

  // Add a default empty startup for when none is available
  const DEFAULT_STARTUP: Startup = {
    id: 'default-startup',
    name: 'Loading Startup...',
    askamount: 0,
    valuation: 0,
    roi: 0,
    problem: '',
    solution: '',
    stage: 'Seed',
    industry: 'Technology',
    risklevel: 'Medium',
  };

  // Add a log for when the investment modal's visible state changes
  useEffect(() => {
    devLog('Investment modal visible changed to:', investModalVisible);
  }, [investModalVisible]);

  const showInterstitialAd = async () => {
    try {
      if (UnityAds?.showAd) {
        const placementId = Platform.OS === 'ios' ? 'Interstitial_iOS' : 'Interstitial_Android';
        UnityAds.addListener('onUnityAdsFinish', (result: any) => {
          console.log('Unity ad finished with result:', result);
        });
        UnityAds.showAd(placementId, true);
      } else {
        console.warn('Unity Ads not available');
      }
    } catch (error) {
      devLog('Interstitial ad error:', error);
    }
  };

  // Render loading indicator
  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={THEME.primary} />
        <Text style={[styles.loadingText, { color: THEME.textMedium }]}>Finding startups...</Text>
      </SafeAreaView>
    );
  }

  // Render empty state if no startups
  if (startups.length === 0) {
    return (
      <SafeAreaView style={styles.emptyContainer}>
        <Text variant="headlineSmall" style={{ color: THEME.textDark }}>No startups available</Text>
        <Text variant="bodyMedium" style={styles.emptyText}>
          Check back later for new startup pitches
        </Text>
        <Button 
          mode="contained"
          onPress={() => fetchStartups(0)}
          style={{ marginTop: 24, backgroundColor: THEME.primary }}
          labelStyle={{ color: THEME.textLight }}
        >
          Refresh
        </Button>
      </SafeAreaView>
    );
  }

  // Current startup card data
  const currentStartupData = startups[currentIndex];

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left', 'top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Card Container */}
      <View style={styles.cardContainer}>
        {/* Current card */}
        {currentStartupData && (
          <Animated.View
            {...panResponder.panHandlers}
            style={[
              styles.card,
              {
                transform: [
                  { translateX: position.x },
                  { rotate: rotation },
                ],
              },
            ]}
          >
            {/* "INVEST" overlay */}
            <Animated.View
              style={[
                styles.investOverlay,
                { opacity: likeOpacity },
              ]}
            >
              <Text style={styles.overlayText}>INVEST</Text>
            </Animated.View>
            
            {/* "PASS" overlay */}
            <Animated.View
              style={[
                styles.passOverlay,
                { opacity: nopeOpacity },
              ]}
            >
              <Text style={styles.overlayText}>PASS</Text>
            </Animated.View>
            
            {/* Card Header - Fixed, not part of scroll */}
            <View style={styles.cardTopSection}>
              <View style={styles.headerTopRow}>
                <View style={styles.appTitleContainer}>
                  <Text style={styles.appTitle}>Cash Available</Text>
                </View>
                <View style={styles.balanceChip}>
                  <FontAwesome name="dollar" size={18} color="#fff" />
                  <Text style={styles.balanceText}>
                    {new Intl.NumberFormat('en-US', {
                      useGrouping: true,
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }).format(cashAvailable)}
                  </Text>
                </View>
              </View>
              <View style={styles.titleDivider} />
              
              {/* Animated tooltip for swipe instructions */}
              {showTip && (
                <Animated.View style={[styles.tipContainer, { opacity: tipOpacity, transform: [{ translateY: tipTranslateY }] }]}> 
                  <Text style={styles.tipText}>Swipe left to pass or swipe right to invest</Text>
                </Animated.View>
              )}
              
              <View style={styles.companyHeaderRow}>
                {/* Company logo moved to the left side */}
                <View style={styles.companyLogoContainer}>
                  <View style={styles.defaultLogoContainer}>
                    <Text style={styles.defaultLogoText}>
                      {(currentStartupData.name || '').slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.companyNameContainer}>
                  <View style={styles.companyNameRow}>
                    <Text style={styles.cardCompanyName} numberOfLines={2} ellipsizeMode="tail">
                      {currentStartupData.name}
                    </Text>
                  </View>
                  
                  <View style={styles.industryBadge}>
                    <FontAwesome name="industry" size={16} color="#fff" />
                    <Text style={styles.industryBadgeText}>{currentStartupData.industry}</Text>
                  </View>
                </View>
              </View>
              
              {/* Ask amount highlighted */}
              <View style={styles.askAmountContainer}>
                <View style={styles.askAmountRow}>
                  <Text style={styles.askAmountLabel}>ASK:</Text>
                  <Text style={styles.askAmountValue}>
                    {formatCurrency(currentStartupData.askamount)}
                  </Text>
                  <Text style={styles.askAmountEquity}>
                    at {Math.round((currentStartupData.askamount / currentStartupData.valuation) * 100)}% Equity
                  </Text>
                </View>
              </View>
              
              {/* Offer row with ROI moved next to button */}
              <View style={styles.offerRow}>
                <Text style={styles.roiText}>
                  +{currentStartupData.roi}% ROI
                </Text>
                
                {/* Make Offer Button */}
                <TouchableOpacity
                  style={styles.makeOfferButton}
                  onPress={() => {
                    devLog('Make Offer button pressed for startup:', currentStartupData?.name);
                    // Ensure the current startup is set correctly before opening modal
                    if (currentStartupData) {
                      setCurrentStartup(currentStartupData);
                      // Short timeout to ensure state is updated before modal shows
                      setTimeout(() => {
                        setInvestModalVisible(true);
                      }, 50);
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.makeOfferText}>MAKE OFFER</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Main scrollable content area - with PitchCard-like style */}
            <View style={styles.scrollableArea}>
              <ScrollView 
                showsVerticalScrollIndicator={true}
                style={styles.scrollContent}
                contentContainerStyle={[styles.scrollContentContainer, {paddingBottom: 32, minHeight: 0, flexGrow: 1}]}
                scrollEventThrottle={16}
                decelerationRate="normal"
                bounces={true}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled={true}
              >
                {/* About Section moved to be first */}
                {currentStartupData.description && (
                  <View style={styles.pitchSection}>
                    <View style={styles.pitchSectionHeader}>
                      <FontAwesome name="file-text" size={22} color="#000" />
                      <Text style={styles.pitchSectionTitle}>About</Text>
                    </View>
                    
                    <Text style={styles.pitchSectionText}>
                      {currentStartupData.description}
                    </Text>
                  </View>
                )}

                {/* Problem & Solution Sections Side by Side */}
                <View style={styles.sectionRow}>
                  <View style={styles.sectionHalf}>
                    <View style={[styles.pitchSection, {flex: 1}]}>
                      <View style={styles.pitchSectionHeader}>
                        <FontAwesome name="lightbulb-o" size={22} color="#000" />
                        <Text style={styles.pitchSectionTitle}>Problem</Text>
                      </View>
                      <Text style={[styles.pitchSectionText, { textAlign: 'left' }]}>
                        {currentStartupData.problem || "Setting up automated workflows is complex and time-consuming, requiring extensive expertise."}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.sectionHalf}>
                    <View style={[styles.pitchSection, {flex: 1}]}>
                      <View style={styles.pitchSectionHeader}>
                        <FontAwesome name="wrench" size={22} color="#000" />
                        <Text style={styles.pitchSectionTitle}>Solution</Text>
                      </View>
                      <Text style={[styles.pitchSectionText, { textAlign: 'left' }]}>
                        {currentStartupData.solution || "No-code platform to create automated solutions with ease"}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Company Details Section */}
                <View style={styles.pitchSection}>
                  <View style={styles.pitchSectionHeader}>
                    <FontAwesome name="building-o" size={22} color="#000" />
                    <Text style={styles.pitchSectionTitle}>Company Details</Text>
                  </View>
                  
                  <View style={styles.detailsGrid}>
                    {/* Stage badge moved to Company Details */}
                    <View style={styles.detailItem}>
                      <FontAwesome name="leaf" size={16} color={getStageColor(currentStartupData.stage)} />
                      <Text style={styles.detailText}>Stage: {currentStartupData.stage}</Text>
                    </View>
                    
                    {currentStartupData.location && (
                      <View style={styles.detailItem}>
                        <FontAwesome name="map-marker" size={16} color={THEME.textDark} />
                        <Text style={styles.detailText}>{currentStartupData.location}</Text>
                      </View>
                    )}
                    
                    {currentStartupData.founded_date && (
                      <View style={styles.detailItem}>
                        <FontAwesome name="calendar" size={16} color={THEME.textDark} />
                        <Text style={styles.detailText}>
                          Founded: {new Date(currentStartupData.founded_date).getFullYear()}
                        </Text>
                      </View>
                    )}
                    
                    {currentStartupData.current_status && (
                      <View style={styles.detailItem}>
                        <FontAwesome name="info-circle" size={16} color={THEME.textDark} />
                        <Text style={styles.detailText}>Status: {currentStartupData.current_status}</Text>
                      </View>
                    )}

                    {currentStartupData.team_size && (
                      <View style={styles.detailItem}>
                        <FontAwesome name="users" size={16} color={THEME.textDark} />
                        <Text style={styles.detailText}>Team: {currentStartupData.team_size} members</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Market Opportunity Section with Visualization */}
                <View style={styles.pitchSection}>
                  <View style={styles.pitchSectionHeader}>
                    <FontAwesome name="line-chart" size={22} color="#000" />
                    <Text style={styles.pitchSectionTitle}>Market Opportunity</Text>
                  </View>
                  <Text style={styles.pitchSectionText}>
                    {currentStartupData.market || "Large addressable market with strong growth potential."}
                  </Text>
                  
                  {/* Market Size Visualization - SVG Bar */}
                  {currentStartupData.market_size && currentStartupData.market_size > 0 && (
                    <View style={styles.marketSizeVisualization}>
                      <Text style={styles.visualizationTitle}>Total Addressable Market</Text>
                      <Text style={styles.marketSizeValue}>{formatCurrency(currentStartupData.market_size)}</Text>
                      <Svg height={24} width="100%" style={{ marginTop: 8, marginBottom: 4 }}>
                        <Rect
                          x={0}
                          y={0}
                          width="100%"
                          height={16}
                          fill="#E3F2FD"
                          rx={8}
                        />
                        <Rect
                          x={0}
                          y={0}
                          width={`${Math.min((currentStartupData.market_size/10000000000) * 100, 100)}%`}
                          height={16}
                          fill="url(#marketBarGradient)"
                          rx={8}
                        />
                        <G>
                          <SvgText
                            x={0}
                            y={15}
                            fontSize="10"
                            fill="#1976D2"
                          >
                            $0
                          </SvgText>
                          <SvgText
                            x="95%"
                            y={15}
                            fontSize="10"
                            fill="#1976D2"
                            textAnchor="end"
                          >
                            $10B+
                          </SvgText>
                        </G>
                        <Defs>
                          <SvgLinearGradient id="marketBarGradient" x1="0" y1="0" x2="1" y2="0">
                            <Stop offset="0%" stopColor="#0A66C2" />
                            <Stop offset="100%" stopColor="#4FC3F7" />
                          </SvgLinearGradient>
                        </Defs>
                      </Svg>
                    </View>
                  )}
                  {currentStartupData.market_size && currentStartupData.market_size > 0 && (
                    <View style={styles.marketSizeVisualization}>
                      <Text style={styles.visualizationTitle}>Total Addressable Market</Text>
                      <Text style={styles.marketSizeValue}>{formatCurrency(currentStartupData.market_size)}</Text>
                      
                      <View style={styles.marketSizeProgressBar}>
                        <LinearGradient
                          colors={['#0A66C2', '#4FC3F7']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={[styles.marketSizeProgress, {width: `${Math.min((currentStartupData.market_size/10000000000) * 100, 100)}%`}]}
                        />
                      </View>
                      <View style={styles.progressBarLabels}>
                        <Text style={styles.progressBarLabel}>$0</Text>
                        <Text style={styles.progressBarLabel}>$10B+</Text>
                      </View>
                    </View>
                  )}
                </View>
                
                {/* Traction Section with Metrics */}
                <View style={styles.pitchSection}>
                  <View style={styles.pitchSectionHeader}>
                    <FontAwesome name="rocket" size={22} color="#000" />
                    <Text style={styles.pitchSectionTitle}>Traction</Text>
                  </View>
                  <Text style={styles.pitchSectionText}>
                    {currentStartupData.traction || "Early customer validation with strong user engagement."}
                  </Text>
                  
                  {/* Key Metrics with SVG Bar Chart */}
                  <View style={styles.metricsVisual}>
                    <Svg height={100} width="100%" style={{ marginBottom: 8 }}>
                      {/* Revenue Bar */}
                      <Rect
                        x="10%"
                        y={100 - Math.min((currentStartupData.financials?.revenue || 1200000) / 3000000 * 80, 80)}
                        width="20%"
                        height={Math.min((currentStartupData.financials?.revenue || 1200000) / 3000000 * 80, 80)}
                        fill="#4CAF50"
                      />
                      <SvgText x="20%" y="15" fontSize="12" fill="#222" textAnchor="middle">
                        Revenue
                      </SvgText>
                      {/* Margin Bar */}
                      <Rect
                        x="40%"
                        y={100 - (currentStartupData.financials?.gross_margin || 35)}
                        width="20%"
                        height={currentStartupData.financials?.gross_margin || 35}
                        fill="#FF9800"
                      />
                      <SvgText x="50%" y="15" fontSize="12" fill="#222" textAnchor="middle">
                        Margin
                      </SvgText>
                      {/* Growth Bar */}
                      <Rect
                        x="70%"
                        y={100 - ((currentStartupData.financials?.growth_rate || 4) * 10)}
                        width="20%"
                        height={(currentStartupData.financials?.growth_rate || 4) * 10}
                        fill="#9C27B0"
                      />
                      <SvgText x="80%" y="15" fontSize="12" fill="#222" textAnchor="middle">
                        Growth
                      </SvgText>
                    </Svg>
                    <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-evenly', marginTop: 4, alignSelf: 'center' }}>
                      <Text style={[styles.barChartValue, { width: '20%', textAlign: 'center' }]}>{formatCurrency(currentStartupData.financials?.revenue || 1200000)}</Text>
                      <Text style={[styles.barChartValue, { width: '20%', textAlign: 'center' }]}>{currentStartupData.financials?.gross_margin || 35}%</Text>
                      <Text style={[styles.barChartValue, { width: '20%', textAlign: 'center' }]}>{currentStartupData.financials?.growth_rate || 4}%/mo</Text>
                    </View>
                  </View>
                  {currentStartupData.key_metrics && (
                    <View style={styles.keyMetrics}>
                      <Text style={styles.keyMetricsTitle}>Key Metrics</Text>
                      <Text style={styles.pitchSectionText}>{currentStartupData.key_metrics}</Text>
                    </View>
                  )}
                </View>
                
                {/* Team Section */}
                {currentStartupData.team && (
                  <View style={styles.pitchSection}>
                    <View style={styles.pitchSectionHeader}>
                      <FontAwesome name="users" size={22} color="#000" />
                      <Text style={styles.pitchSectionTitle}>Team</Text>
                    </View>
                    <Text style={styles.pitchSectionText}>
                      {currentStartupData.team}
                    </Text>
                    
                    {currentStartupData.team_background && (
                      <View style={styles.teamBackgroundContainer}>
                        <Text style={styles.teamBackgroundTitle}>Background</Text>
                        <Text style={styles.pitchSectionText}>{currentStartupData.team_background}</Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Competition Section */}
                {(currentStartupData.competition || currentStartupData.competitive_advantage) && (
                  <View style={styles.pitchSection}>
                    <View style={styles.pitchSectionHeader}>
                      <FontAwesome name="crosshairs" size={22} color="#000" />
                      <Text style={styles.pitchSectionTitle}>Competition</Text>
                    </View>
                    
                    {currentStartupData.competition && (
                      <Text style={styles.pitchSectionText}>
                        {currentStartupData.competition}
                      </Text>
                    )}
                    
                    {currentStartupData.competitive_advantage && (
                      <View style={styles.advantageContainer}>
                        <View style={styles.sectionSubheader}>
                          <FontAwesome name="trophy" size={18} color="#0A66C2" />
                          <Text style={styles.advantageTitle}>Our Advantage</Text>
                        </View>
                        <Text style={styles.pitchSectionText}>{currentStartupData.competitive_advantage}</Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Business Model Section */}
                {currentStartupData.business_model && (
                  <View style={styles.pitchSection}>
                    <View style={styles.pitchSectionHeader}>
                      <FontAwesome name="briefcase" size={22} color="#000" />
                      <Text style={styles.pitchSectionTitle}>Business Model</Text>
                    </View>
                    <Text style={styles.pitchSectionText}>
                      {currentStartupData.business_model}
                    </Text>
                    
                    {currentStartupData.go_to_market && (
                      <View style={styles.subsection}>
                        <Text style={styles.subsectionTitle}>Go-to-Market Strategy</Text>
                        <Text style={styles.pitchSectionText}>{currentStartupData.go_to_market}</Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Risk Factors Section */}
                {currentStartupData.risks && (
                  <View style={styles.pitchSection}>
                    <View style={styles.pitchSectionHeader}>
                      <FontAwesome name="exclamation-triangle" size={22} color="#000" />
                      <Text style={styles.pitchSectionTitle}>Risk Factors</Text>
                      {/* Add risk level badge here */}
                      <View style={[styles.riskBadgeSmall, {backgroundColor: getRiskLevelColor(currentStartupData.risklevel)[0], marginLeft: 10}]}>
                        <FontAwesome name="exclamation-triangle" size={12} color="#fff" />
                        <Text style={styles.riskBadgeSmallText}>{currentStartupData.risklevel}</Text>
                      </View>
                    </View>
                    <Text style={styles.pitchSectionText}>
                      {currentStartupData.risks}
                    </Text>
                  </View>
                )}

                {/* Exit Strategy Section */}
                {currentStartupData.exit_strategy && (
                  <View style={styles.pitchSection}>
                    <View style={styles.pitchSectionHeader}>
                      <FontAwesome name="sign-out" size={22} color="#000" />
                      <Text style={styles.pitchSectionTitle}>Exit Strategy</Text>
                    </View>
                    <Text style={styles.pitchSectionText}>
                      {currentStartupData.exit_strategy}
                    </Text>
                    
                    {(currentStartupData.exit_multiplier || currentStartupData.exit_probability) && (
                      <View style={styles.exitMetrics}>
                        {currentStartupData.exit_multiplier && (
                          <Text style={styles.exitMetricText}>
                            Potential multiple: {currentStartupData.exit_multiplier}x
                          </Text>
                        )}
                        {currentStartupData.exit_probability && (
                          <Text style={styles.exitMetricText}>
                            Exit probability: {currentStartupData.exit_probability}%
                          </Text>
                        )}
                      </View>
                    )}
                  </View>
                )}

                {/* Milestones Section */}
                {currentStartupData.milestones && (
                  <View style={styles.pitchSection}>
                    <View style={styles.pitchSectionHeader}>
                      <FontAwesome name="flag-checkered" size={22} color="#000" />
                      <Text style={styles.pitchSectionTitle}>Milestones</Text>
                    </View>
                    <Text style={styles.pitchSectionText}>
                      {currentStartupData.milestones}
                    </Text>
                  </View>
                )}

                {/* Funding Allocation Section */}
                <View style={styles.pitchSection}>
                  <View style={styles.pitchSectionHeader}>
                    <FontAwesome name="money" size={22} color="#000" />
                    <Text style={styles.pitchSectionTitle}>Funding Allocation</Text>
                  </View>
                  
                  {/* Improved funding allocation visualization - SVG Horizontal Bar */}
                  <View style={styles.fundingVisualization}>
                    <Svg height={28} width="100%">
                      {/* Product Development */}
                      <Rect
                        x={0}
                        y={0}
                        width={`${currentStartupData.funding_allocation?.product_development || 55}%`}
                        height={28}
                        fill="#9C27B0"
                        rx={6}
                      />
                      {/* Marketing */}
                      <Rect
                        x={`${currentStartupData.funding_allocation?.product_development || 55}%`}
                        y={0}
                        width={`${currentStartupData.funding_allocation?.marketing || 30}%`}
                        height={28}
                        fill="#00BCD4"
                        rx={6}
                      />
                      {/* Operations */}
                      <Rect
                        x={`${(currentStartupData.funding_allocation?.product_development || 55) + (currentStartupData.funding_allocation?.marketing || 30)}%`}
                        y={0}
                        width={`${currentStartupData.funding_allocation?.operations || 15}%`}
                        height={28}
                        fill="#FFC107"
                        rx={6}
                      />
                    </Svg>
                    <View style={styles.fundingLegend}>
                      <View style={styles.legendItem}><View style={[styles.legendColor1, { backgroundColor: '#9C27B0' }]} /><Text style={styles.legendText}>Product Development ({currentStartupData.funding_allocation?.product_development || 55}%)</Text></View>
                      <View style={styles.legendItem}><View style={[styles.legendColor2, { backgroundColor: '#00BCD4' }]} /><Text style={styles.legendText}>Marketing ({currentStartupData.funding_allocation?.marketing || 30}%)</Text></View>
                      <View style={styles.legendItem}><View style={[styles.legendColor3, { backgroundColor: '#FFC107' }]} /><Text style={styles.legendText}>Operations ({currentStartupData.funding_allocation?.operations || 15}%)</Text></View>
                    </View>
                  </View>
                  <View style={styles.fundingVisualization}>
                    {/* Horizontal bar chart for funding allocation */}
                    <View style={styles.horizontalBarChartContainer}>
                      <View style={styles.horizontalBarChart}>
                        <View 
                          style={[styles.horizontalBarProduct, { 
                            width: `${currentStartupData.funding_allocation?.product_development || 55}%` 
                          }]} 
                        />
                        <View 
                          style={[styles.horizontalBarMarketing, { 
                            width: `${currentStartupData.funding_allocation?.marketing || 30}%` 
                          }]} 
                        />
                        <View 
                          style={[styles.horizontalBarOperations, { 
                            width: `${currentStartupData.funding_allocation?.operations || 15}%` 
                          }]} 
                        />
                      </View>
                    </View>
                    
                    <View style={styles.fundingLegend}>
                      <View style={styles.legendItem}>
                        <View style={styles.legendColor1} />
                        <Text style={styles.legendText}>
                          Product Development ({currentStartupData.funding_allocation?.product_development || 55}%)
                        </Text>
                      </View>
                      <View style={styles.legendItem}>
                        <View style={styles.legendColor2} />
                        <Text style={styles.legendText}>
                          Marketing ({currentStartupData.funding_allocation?.marketing || 30}%)
                        </Text>
                      </View>
                      <View style={styles.legendItem}>
                        <View style={styles.legendColor3} />
                        <Text style={styles.legendText}>
                          Operations ({currentStartupData.funding_allocation?.operations || 15}%)
                        </Text>
                      </View>
                    </View>
                  </View>
                  
                  {/* How Funds Will Be Used Section */}
                  {currentStartupData.use_of_funds && (
                    <View style={styles.fundingUseSection}>
                      <Text style={styles.fundingUseTitle}>How Funds Will Be Used</Text>
                      <Text style={styles.pitchSectionText}>
                        {currentStartupData.use_of_funds}
                      </Text>
                    </View>
                  )}
                  
                  {/* Funding Use section - alternative if use_of_funds not available */}
                  {!currentStartupData.use_of_funds && currentStartupData.fundinguse && (
                    <View style={styles.fundingUseSection}>
                      <Text style={styles.fundingUseTitle}>How Funds Will Be Used</Text>
                      <Text style={styles.pitchSectionText}>
                        {currentStartupData.fundinguse}
                      </Text>
                    </View>
                  )}
                  
                  {/* Show closing hook if available */}
                  {currentStartupData.closing_hook && (
                    <View style={styles.closingHookSection}>
                      <Text style={styles.closingHookText}>
                        "{currentStartupData.closing_hook}"
                      </Text>
                    </View>
                  )}
                </View>

                {/* Investment Insights Section - Now with tagline */}
                <View style={styles.insightsSection}>
                  <View style={styles.pitchSectionHeader}>
                    <FontAwesome name="lightbulb-o" size={22} color="#000" />
                    <Text style={styles.pitchSectionTitle}>Investment Insights</Text>
                  </View>
                  
                  {/* Add tagline at the top of Investment Insights */}
                  {currentStartupData.tagline && (
                    <View style={[styles.taglineContainer, {marginBottom: 16}]}>
                      <Text style={styles.taglineText}>"{currentStartupData.tagline}"</Text>
                    </View>
                  )}
                  
                  <View style={styles.insightCardsContainer}>
                    {/* ROI Analysis */}
                    <View style={styles.insightCard}>
                      <Text style={styles.insightTitle}>ROI Potential</Text>
                      <Text style={styles.insightValue}>{currentStartupData.roi}%</Text>
                      <Text style={styles.insightDescription}>
                        {currentStartupData.roi > 40 ? 'High-risk, high-return opportunity' : 
                         currentStartupData.roi > 20 ? 'Balanced risk-return profile' : 'Conservative return profile'}
                      </Text>
                    </View>
                    
                    {/* Market Position */}
                    <View style={styles.insightCard}>
                      <Text style={styles.insightTitle}>Market Position</Text>
                      <Text style={styles.insightValue}>
                        {(currentStartupData.market_size && currentStartupData.market_size > 10000000000) ? 'Large' : 
                         (currentStartupData.market_size && currentStartupData.market_size > 1000000000) ? 'Medium' : 'Niche'}
                      </Text>
                      <Text style={styles.insightDescription}>
                        {currentStartupData.competition ? 'Competitive landscape requires differentiation' : 'Potential first-mover advantage'}
                      </Text>
                    </View>
                  </View>
                  
                  {/* Tips section (formerly Recommendation) */}
                  <View style={styles.recommendationContainer}>
                    <View style={styles.tipsHeaderRow}>
                      <FontAwesome name="lightbulb-o" size={16} color={THEME.textDark} style={styles.tipsIcon} />
                      <Text style={styles.recommendationTitle}>Tips</Text>
                    </View>
                    
                    <View style={styles.recommendationItem}>
                      <FontAwesome name="hand-o-right" size={16} color="#4CAF50" style={styles.tipBulletIcon} />
                      <Text style={styles.recommendationText}>Swipe left to pass or swipe right to invest</Text>
                    </View>
                    
                    <View style={styles.recommendationItem}>
                      <FontAwesome name="hand-o-right" size={16} color="#4CAF50" style={styles.tipBulletIcon} />
                      <Text style={styles.recommendationText}>Review detailed financials</Text>
                    </View>
                    
                    <View style={styles.recommendationItem}>
                      <FontAwesome name="hand-o-right" size={16} color="#4CAF50" style={styles.tipBulletIcon} />
                      <Text style={styles.recommendationText}>Evaluate the team's expertise</Text>
                    </View>
                    
                    <View style={styles.recommendationItem}>
                      <FontAwesome name="hand-o-right" size={16} color="#4CAF50" style={styles.tipBulletIcon} />
                      <Text style={styles.recommendationText}>Search more startups in the Discover tab</Text>
                    </View>
                    
                    <View style={styles.recommendationItem}>
                      <FontAwesome name="hand-o-right" size={16} color="#4CAF50" style={styles.tipBulletIcon} />
                      <Text style={styles.recommendationText}>Check Portfolio for your investment performance</Text>
                    </View>
                  </View>
                </View>
              </ScrollView>
            </View>
          </Animated.View>
        )}
      </View>
      
      {/* Investment Modal - render only when visible for performance */}
      {investModalVisible && (
        <InvestmentModal
          visible={investModalVisible}
          onClose={handleInvestModalClose}
          onSuccess={handleInvestmentSuccess}
          startup={currentStartup || DEFAULT_STARTUP}
          userBalance={cashAvailable}
        />
      )}
      {/* Out-of-funds Snackbar */}
      {snackbarVisible && (
        <Snackbar
          visible={true}
          onDismiss={() => setTimeout(() => setSnackbarVisible(false), 0)}
          duration={3000}
          style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}
        >
          Out of funds! Visit Balance tab to add more funds.
        </Snackbar>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  cardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 0,
  },
  card: {
    width: SCREEN_WIDTH - 24,
    height: SCREEN_HEIGHT * 0.85, 
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: THEME.darkBg,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: {
        elevation: 10,
      },
      web: {
        boxShadow: '0px 6px 15px rgba(0, 0, 0, 0.15)',
      }
    }),
    borderWidth: 0,
  },
  cardTopSection: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: THEME.darkBg,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  appTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  appTitle: {
    color: THEME.textLight,
    fontSize: 18,
    fontWeight: 'bold',
  },
  balanceChip: {
    backgroundColor: '#1E2A3A',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  balanceText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  titleDivider: {
    height: 2,
    backgroundColor: THEME.textLight,
    marginBottom: 12,
    marginTop: 8,
  },
  cardCompanyName: {
    color: THEME.textLight,
    fontWeight: 'bold',
    marginBottom: 6,
    fontSize: 32,
    flexWrap: 'wrap',
    lineHeight: 38,
  },
  valuationRow: {
    marginBottom: 12,
  },
  financialText: {
    color: 'rgba(255, 255, 255, 0.95)',
    fontSize: 18,
  },
  offerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roiText: {
    fontWeight: 'bold',
    color: '#4eff91',
    fontSize: 22,
  },
  scrollableArea: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
    backgroundColor: THEME.darkBg,
  },
  scrollContentContainer: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  // Pitch card sections
  pitchSection: {
    marginBottom: 16, 
    backgroundColor: THEME.cardSectionBg,
    borderRadius: 8,
    padding: 16,
  },
  pitchSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  pitchSectionTitle: {
    color: THEME.textDark,
    fontSize: 22,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  pitchSectionText: {
    color: THEME.textDark,
    fontSize: 17,
    textAlign: 'justify',
    lineHeight: 24,
  },
  financialMetricsSimple: {
    marginBottom: 16,
  },
  metricText: {
    color: THEME.textDark,
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  fundingAllocation: {
    marginBottom: 16,
  },
  fundingText: {
    color: THEME.textDark,
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
  fundingBar: {
    height: 12,
    backgroundColor: '#E8E8E8',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 12,
  },
  fundingFill: {
    height: '100%',
    backgroundColor: THEME.primary,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 16,
  },
  industryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#1E2A3A',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  industryBadgeText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  stageBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 10,
  },
  riskBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#E34D4D',
  },
  badgeText: {
    color: THEME.textLight,
    fontSize: 15,
    fontWeight: 'bold',
  },
  makeOfferButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: THEME.goldButton,
    alignItems: 'center',
    justifyContent: 'center',
    width: '45%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  makeOfferText: {
    color: THEME.goldButtonText,
    fontSize: 17,
    fontWeight: 'bold',
  },
  
  // Animations and overlays
  investOverlay: {
    position: 'absolute',
    top: 50,
    right: 30,
    zIndex: 1000,
    transform: [{ rotate: '30deg' }],
  },
  passOverlay: {
    position: 'absolute',
    top: 50,
    left: 30,
    zIndex: 1000,
    transform: [{ rotate: '-30deg' }],
  },
  overlayText: {
    borderWidth: 4,
    borderColor: 'white',
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  
  // Loading and empty states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 16,
    color: '#666666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  emptyText: {
    color: '#666666',
    marginTop: 8,
    textAlign: 'center',
  },
  metricSeparator: {
    width: 1,
    height: 30,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 15,
  },
  riskBadgeEnhanced: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    elevation: 2,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionHalf: {
    flex: 1,
    marginHorizontal: 4,
  },
  marketSizeVisualization: {
    marginBottom: 16,
  },
  visualizationTitle: {
    color: THEME.textDark,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  marketSizeValue: {
    color: THEME.textDark,
    fontSize: 20,
    fontWeight: 'bold',
  },
  marketSizeProgressBar: {
    height: 12,
    backgroundColor: '#E8E8E8',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  marketSizeProgress: {
    height: '100%',
    backgroundColor: THEME.primary,
  },
  progressBarLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  progressBarLabel: {
    color: THEME.textDark,
    fontSize: 15,
    fontWeight: '500',
  },
  metricsVisual: {
    marginBottom: 16,
  },
  barChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  barChartColumn: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  barChartBar: {
    height: 12,
    backgroundColor: '#E8E8E8',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  barChartFill: {
    height: '100%',
    backgroundColor: THEME.primary,
  },
  barChartLabel: {
    color: THEME.textDark,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  barChartValue: {
    color: THEME.textDark,
    fontSize: 16,
    fontWeight: 'bold',
  },
  keyMetrics: {
    marginBottom: 16,
  },
  keyMetricsTitle: {
    color: THEME.textDark,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subsection: {
    marginTop: 8,
  },
  subsectionTitle: {
    color: THEME.textDark,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  fundingVisualization: {
    marginBottom: 16,
  },
  horizontalBarChartContainer: {
    marginVertical: 12,
  },
  horizontalBarChart: {
    height: 24,
    flexDirection: 'row',
    borderRadius: 12,
    overflow: 'hidden',
  },
  horizontalBarProduct: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  horizontalBarMarketing: {
    height: '100%',
    backgroundColor: '#FF9800',
  },
  horizontalBarOperations: {
    height: '100%',
    backgroundColor: '#9C27B0',
  },
  fundingLegend: {
    marginTop: 12,
    flexDirection: 'column',
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  legendColor1: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    marginRight: 8,
  },
  legendColor2: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF9800',
    marginRight: 8,
  },
  legendColor3: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#9C27B0',
    marginRight: 8,
  },
  legendText: {
    color: THEME.textDark,
    fontSize: 14,
    fontWeight: '500',
  },
  timeline: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  timelineBar: {
    flex: 1,
    height: 2,
    backgroundColor: '#E8E8E8',
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: THEME.primary,
    marginRight: 8,
  },
  timelineText: {
    color: THEME.textDark,
    fontSize: 14,
    fontWeight: '500',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    marginBottom: 12,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 6,
  },
  detailText: {
    marginLeft: 8,
    color: THEME.textDark,
    fontSize: 15,
  },
  exitMetrics: {
    marginTop: 12,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
  },
  exitMetricText: {
    fontSize: 14,
    fontWeight: '500',
    color: THEME.textDark,
    marginBottom: 4,
  },
  financialMetricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  metricLabel: {
    color: THEME.textDark,
    fontSize: 14,
    fontWeight: '500',
  },
  metricValue: {
    color: THEME.textDark,
    fontSize: 14,
    fontWeight: 'bold',
  },
  investmentDetails: {
    marginVertical: 16,
    padding: 12,
    backgroundColor: 'rgba(10, 102, 194, 0.1)',
    borderRadius: 8,
  },
  investmentDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  investmentDetailItem: {
    flex: 1,
    alignItems: 'center',
  },
  investmentDetailLabel: {
    color: THEME.textMedium,
    fontSize: 12,
    marginBottom: 4,
  },
  investmentDetailValue: {
    color: THEME.textDark,
    fontSize: 16,
    fontWeight: 'bold',
  },
  fundingAllocationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.textDark,
    marginBottom: 8,
  },
  fundingUseSection: {
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 8,
  },
  fundingUseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.textDark,
    marginBottom: 8,
  },
  closingHookSection: {
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: THEME.goldButton,
  },
  closingHookText: {
    color: THEME.textDark,
    fontSize: 16,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    flexWrap: 'wrap',
  },
  companyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  companyNameContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    marginLeft: 16,
  },
  companyLogoContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4.5,
  },
  defaultLogoContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  defaultLogoText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  askAmountContainer: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  askAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  askAmountLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginRight: 8,
  },
  askAmountValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginRight: 8,
  },
  askAmountEquity: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  taglineContainer: {
    marginBottom: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#F5F1E8',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: THEME.primary,
  },
  taglineText: {
    fontSize: 18,
    fontStyle: 'italic',
    color: THEME.textDark,
    textAlign: 'center',
  },
  teamBackgroundContainer: {
    marginTop: 10,
    padding: 12,
    backgroundColor: 'rgba(10, 102, 194, 0.1)',
    borderRadius: 8,
  },
  teamBackgroundTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.textDark,
    marginBottom: 5,
  },
  advantageContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 8,
  },
  advantageTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.textDark,
    marginLeft: 8,
  },
  sectionSubheader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightsSection: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  insightCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  insightCard: {
    width: '48%',
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.textDark,
    marginBottom: 4,
  },
  insightValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: THEME.primary,
    marginBottom: 4,
  },
  insightDescription: {
    fontSize: 14,
    color: THEME.textMedium,
  },
  recommendationContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F5F7FA',
    borderRadius: 8,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.textDark,
    marginBottom: 10,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  recommendationText: {
    fontSize: 15,
    color: THEME.textDark,
    marginLeft: 8,
  },
  companyNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  riskBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF5722',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  riskBadgeSmallText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  companyLogo: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
    borderRadius: 35,
  },
  tipsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipsIcon: {
    marginRight: 8,
    marginTop: 2, // Align icon with text
  },
  tipBulletIcon: {
    width: 20, // Fixed width for alignment
    marginRight: 8,
  },
  tipContainer: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderRadius: 8,
    alignItems: 'center',
  },
  tipText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
