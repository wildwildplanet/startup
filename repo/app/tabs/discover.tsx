import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  FlatList, 
  ActivityIndicator, 
  RefreshControl,
  Platform,
  Animated,
  StatusBar,
  TouchableOpacity,
  ViewToken
} from 'react-native';
import { Text, Chip, Searchbar, Button, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase/supabaseClient';
import PitchCard from '../../components/Cards/PitchCard';
let UnityAds: any;
try {
  UnityAds = require('react-native-unity-ads');
} catch (e) {
  UnityAds = null;
}

// LinkedIn-inspired theme colors (same as home.tsx)
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
};

// Interface for startup data
interface Startup {
  id: string;
  name: string;
  logo: string;
  askamount: number;
  valuation: number;
  roi: number;
  problem: string;
  solution: string;
  stage: string;
  industry: string;
  risklevel: string;
  tagline?: string;
  description?: string;
  created_at: string;
}

// Available industry filters
const INDUSTRIES = [
  'All',
  'Tech',
  'Health',
  'Finance',
  'Consumer',
  'Energy',
  'Education',
  'Real Estate'
];

// Limit for pagination
const PAGE_SIZE = 8;

export default function DiscoverScreen() {
  const theme = useTheme();
  const router = useRouter();
  const scrollY = useRef(new Animated.Value(0)).current;
  
  // State variables
  const [startups, setStartups] = useState<Startup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('All');
  const [page, setPage] = useState(0);
  const [adShown, setAdShown] = useState(false);
  const [adLoading, setAdLoading] = useState(false);
  const [adError, setAdError] = useState(false);
  
  // Header animation values
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [120, 60],
    extrapolate: 'clamp',
  });
  
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 80, 120],
    outputRange: [1, 0.5, 0],
    extrapolate: 'clamp',
  });

  // Fetch startups from Supabase
  const fetchStartups = useCallback(async (pageNum = 0, refresh = false) => {
    if (refresh) {
      setRefreshing(true);
    } else if (pageNum === 0) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const startRange = pageNum * PAGE_SIZE;
      const endRange = startRange + PAGE_SIZE - 1;
      let query = supabase
        .from('startups')
        .select('*')
        .order('created_at', { ascending: false })
        .range(startRange, endRange);
      if (selectedIndustry !== 'All') {
        query = query.eq('industry', selectedIndustry);
      }
      if (searchQuery) {
        query = query.or(
          `name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,problem.ilike.%${searchQuery}%,solution.ilike.%${searchQuery}%`
        );
      }
      const { data, error } = await query;
      if (error) {
        console.error('Error fetching startups:', error);
      } else {
        if (refresh || pageNum === 0) {
          setStartups(data);
        } else {
          setStartups(prev => [...prev, ...data]);
        }
        setHasMoreData(data.length === PAGE_SIZE);
        setPage(pageNum);
      }
    } catch (e) {
      console.error('Exception fetching startups:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [selectedIndustry, searchQuery]);

  // Load startups on initial mount and when filters change
  useEffect(() => {
    console.log('[DEBUG] useEffect triggered - fetching startups');
    console.log(`[DEBUG] Filter state - industry: ${selectedIndustry}, search: ${searchQuery}`);
    // Reset to page 0 when filters change
    setPage(0);
    fetchStartups(0);
  }, [fetchStartups, selectedIndustry, searchQuery]);

  // Handler for pull-to-refresh
  const handleRefresh = useCallback(() => {
    fetchStartups(0, true);
  }, [fetchStartups]);

  // Handler for reaching end of list (pagination)
  const handleEndReached = useCallback(() => {
    if (!loadingMore && hasMoreData) {
      fetchStartups(page + 1);
    }
  }, [loadingMore, hasMoreData, page, fetchStartups]);

  // Handler for tapping a startup card
  const handleStartupPress = (startup: Startup) => {
    router.push(`/startup/${startup.id}`);
  };

  // Handler for industry filter selection
  const handleIndustrySelect = (industry: string) => {
    setSelectedIndustry(industry);
  };

  // Render each startup card
  const renderStartupCard = ({ item }: { item: Startup }) => (
    <PitchCard
      startup={item}
      onPress={() => handleStartupPress(item)}
    />
  );

  // Render the industry filter chips
  const renderIndustryFilters = () => (
    <View style={styles.filtersContainer}>
      <FlatList
        horizontal
        data={INDUSTRIES}
        renderItem={({ item }) => (
          <Chip
            mode="outlined"
            selected={selectedIndustry === item}
            onPress={() => handleIndustrySelect(item)}
            style={[
              styles.industryChip,
              selectedIndustry === item && { backgroundColor: THEME.primary, borderColor: THEME.primary }
            ]}
            selectedColor={selectedIndustry === item ? THEME.textLight : THEME.secondary}
            textStyle={{ 
              color: selectedIndustry === item ? THEME.textLight : THEME.secondary,
              fontWeight: selectedIndustry === item ? 'bold' : 'normal',
              fontSize: 16
            }}
            showSelectedCheck={false}
          >
            {item}
          </Chip>
        )}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipContainer}
      />
    </View>
  );

  // Render the loading indicator for pagination
  const renderFooter = () => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={THEME.primary} />
      </View>
    );
  };

  // Render empty state when no startups match filters
  const renderEmptyComponent = () => {
    if (loading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <Text variant="bodyLarge" style={{ color: THEME.textDark, fontSize: 18 }}>No startups found</Text>
        <Text variant="bodyMedium" style={{ color: THEME.textMedium, marginTop: 8, fontSize: 18 }}>
          Try changing your filters or search query
        </Text>
        <Button 
          mode="contained"
          onPress={() => {
            setSelectedIndustry('All');
            setSearchQuery('');
          }}
          style={{ marginTop: 16, backgroundColor: THEME.primary }}
          labelStyle={{ color: THEME.textLight }}
        >
          Reset Filters
        </Button>
      </View>
    );
  };

  const showInterstitialAd = useCallback(async () => {
    setAdLoading(true);
    setAdError(false);
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
    } catch (err) {
      console.warn('Interstitial ad error:', err);
      setAdError(true);
    } finally {
      setAdLoading(false);
    }
  }, []);

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;
  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (!adShown && viewableItems.some(i => typeof i.index === 'number' && i.index >= 19)) {
      showInterstitialAd();
      setAdShown(true);
    }
  }, [adShown, showInterstitialAd]);

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left']}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.secondary} />
      
      {/* Animated Search Header */}
      <Animated.View style={[styles.header, { height: headerHeight }]}>
        <Text variant="headlineSmall" style={[styles.title, { fontSize: 28 }]}>
          STARTUP PITCH
        </Text>
        
        <Animated.View style={{ opacity: headerOpacity }}>
          <Text variant="bodyMedium" style={[styles.subtitle, { fontSize: 18 }]}>
            Find your next investment opportunity
          </Text>
        </Animated.View>
        
        <Searchbar
          placeholder="Search startups..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          onSubmitEditing={() => fetchStartups(0)}
          style={styles.searchBar}
          inputStyle={{ color: THEME.textDark, fontSize: 16 }}
          iconColor={THEME.primary}
          placeholderTextColor={THEME.textMedium}
        />
      </Animated.View>
      
      {/* Loading Indicator */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={THEME.primary} />
        </View>
      )}
      
      {/* Ad Loading Indicator */}
      {adLoading && <ActivityIndicator style={styles.adLoading} size="large" color={THEME.primary} />}
      
      {/* Ad Error Message */}
      {adError && <Text style={[styles.adErrorText, { color: THEME.error }]}>Ad failed to load. Try again later.</Text>}
      
      {/* Startup List */}
      {!loading && (
        <Animated.FlatList
          data={startups}
          renderItem={renderStartupCard}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          contentContainerStyle={styles.listContent}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmptyComponent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[THEME.primary]}
              tintColor={THEME.primary}
            />
          }
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
          viewabilityConfig={viewabilityConfig}
          onViewableItemsChanged={onViewableItemsChanged}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: THEME.secondary,
    borderBottomWidth: 1,
    borderBottomColor: '#333F51',
    justifyContent: 'flex-end',
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 4,
    color: THEME.textLight,
    textAlign: 'center',
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 12,
    textAlign: 'center',
  },
  searchBar: {
    marginBottom: 12,
    elevation: 0,
    backgroundColor: THEME.cardBackground,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 8,
  },
  filtersContainer: {
    backgroundColor: THEME.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
    paddingVertical: 12,
  },
  chipContainer: {
    paddingHorizontal: 16,
  },
  industryChip: {
    marginRight: 8,
    borderColor: THEME.secondary,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  listContent: {
    paddingTop: 16,
    paddingBottom: 24,
    ...Platform.select({
      android: {
        paddingBottom: 80, // Extra padding for Android to account for FAB
      }
    }),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.cardBackground,
    margin: 16,
    borderRadius: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  adLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adErrorText: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 