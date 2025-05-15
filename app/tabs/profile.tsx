import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView, Image } from 'react-native';
import { Text, Card, Button, ActivityIndicator, useTheme, Divider, Chip, ProgressBar, Portal, Dialog } from 'react-native-paper';
import { FlatList } from 'react-native';
import { fetchUserProfile } from '../../lib/supabase/supabaseClient';
import { useSupabase } from '../../lib/supabase/SupabaseProvider';
import { useStore } from '../../lib/store/useStore';
import { supabase } from '../../lib/supabase/supabaseClient';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
// @ts-ignore: no type declarations for md5 module
import md5 from 'md5';

const ProfileIconAsset = require('../../doc/1.jpeg');

type UserProfile = {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar: string;
  bio: string;
  balance: number;  // available cash balance
  portfolio_value: number;
  investments_count: number;
  join_date: string;
  rank?: number;
};

// Map numeric level to human title
const getInvestorTitle = (level: number): string => {
  if (level < 5) return 'Novice Investor';
  if (level < 10) return 'Intermediate Investor';
  return 'Expert Investor';
};

export default function ProfileScreen() {
  const theme = useTheme();
  const { session, isLoading: sessionLoading } = useSupabase();
  const logoutStore = useStore(state => state.logout);
  const isFocused = useIsFocused();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  // Use global store values when available for real-time updates
  const storeUser = useStore(state => state.user);
  const storePortfolio = useStore(state => state.portfolio);
  const availableCash = storeUser?.cashAvailable ?? profile?.balance ?? 0;
  const portfolioValue = storeUser?.portfolioValue ?? profile?.portfolio_value ?? 0;
  const investmentsCount = storePortfolio.length ?? profile?.investments_count ?? 0;

  useEffect(() => {
    if (!isFocused || sessionLoading) return;
    if (!session?.user) {
      router.replace('/auth/login');
      return;
    }
    loadProfile(session!.user.id);
  }, [isFocused, session, sessionLoading]);

  const loadProfile = async (userId: string) => {
    setLoading(true);
    try {
      const data = await fetchUserProfile(userId);
      // Merge with Supabase session user_metadata to fill missing fields (e.g., Google profile)
      const metadata = session?.user.user_metadata || {};
      const mergedProfile = {
        id: data?.id || session?.user?.id || '',
        name: data?.name || metadata.full_name || metadata.name || '',
        username: data?.username || (metadata.email?.split('@')[0] as string) || '',
        email: data?.email || session?.user?.email || '',
        avatar:
          data?.avatar ||
          metadata.avatar_url ||
          metadata.picture ||
          `https://www.gravatar.com/avatar/${md5(
            (session?.user?.email || '').trim().toLowerCase()
          )}?d=identicon`,
        bio: data?.bio || '',
        balance: data?.cashavailable ?? 0,
        portfolio_value: data?.portfoliovalue ?? 0,
        investments_count: data?.investments_count ?? 0,
        join_date: data?.join_date || new Date().toISOString(),
        // XP and level
        level: data?.level ?? storeUser?.level ?? 0,
        experiencePoints: data?.experience_points ?? storeUser?.experiencePoints ?? 0,
        experienceToNextLevel: data?.experience_to_next_level ?? storeUser?.experienceToNextLevel ?? 1,
        achievements: [],
        rank: data?.rank,
      };
      setProfile(mergedProfile);
      // Also sync profile into global store
      useStore.setState(state => {
        const shouldUpdateBalance =
          typeof state.user?.cashAvailable !== 'number' ||
          (mergedProfile.balance !== 1000000 && mergedProfile.balance != null);
        return {
          ...state,
          user: {
            id: mergedProfile.id,
            name: mergedProfile.name,
            username: mergedProfile.username,
            email: mergedProfile.email,
            avatar: mergedProfile.avatar,
            level: mergedProfile.level,
            experiencePoints: mergedProfile.experiencePoints,
            experienceToNextLevel: mergedProfile.experienceToNextLevel,
            rank: mergedProfile.rank?.toString() || '',
            portfolioValue: mergedProfile.portfolio_value,
            cashAvailable: shouldUpdateBalance ? mergedProfile.balance : state.user?.cashAvailable,
            achievements: [],
          }
        };
      });
    } catch (err: any) {
      console.error('Error loading profile:', err);
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount?: number) =>
    typeof amount === 'number' && !isNaN(amount)
      ? amount.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 })
      : '$0';

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <Button mode="contained" onPress={() => loadProfile(session!.user.id)}>
          Retry
        </Button>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorText}>No profile found</Text>
        <Button mode="contained" onPress={() => loadProfile(session!.user.id)}>
          Retry
        </Button>
      </SafeAreaView>
    );
  }

  // Format join date
  const joinDate = new Date((profile as any).join_date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        {/* Gradient Header with Avatar, Name, Rank, and Edit Profile */}
        <View style={styles.gradientHeader}>
          <View style={styles.headerRow}>
            <Image source={ProfileIconAsset} style={{ width: 100, height: 100, borderRadius: 50 }} resizeMode="cover" />
            <Text style={styles.profileUsername}>@{profile.username}</Text>
          </View>
          <Text style={styles.profileName}>{profile.name}</Text>
          <View style={styles.profileMetaRow}>
            {profile.rank && (
              <View style={styles.rankBadge}><Text style={styles.rankBadgeText}>#{profile.rank}</Text></View>
            )}
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsCardRow}>
          <View style={[styles.statCard, styles.statRow]}>
            <Text style={styles.statIcon}>💰</Text>
            <Text style={styles.statCardValue}>{formatCurrency(availableCash)}</Text>
            <Text style={styles.statCardLabel}>Cash</Text>
          </View>
          <View style={[styles.statCard, styles.statRow]}>
            <Text style={styles.statIcon}>📈</Text>
            <Text style={styles.statCardValue}>{formatCurrency(portfolioValue)}</Text>
            <Text style={styles.statCardLabel}>Portfolio</Text>
          </View>
          <View style={[styles.statCard, styles.statRow]}>
            <Text style={styles.statIcon}>📦</Text>
            <Text style={styles.statCardValue}>{investmentsCount}</Text>
            <Text style={styles.statCardLabel}>Investments</Text>
          </View>
        </View>

        {/* Bio Section */}
        <Card style={styles.bioCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Bio</Text>
            {storeUser?.level != null && (
              <Chip style={{ alignSelf: 'flex-start', marginBottom: 8 }}>
                {getInvestorTitle(storeUser.level)}
              </Chip>
            )}
            <Text style={styles.bio}>{profile.bio}</Text>
            <Text style={styles.joinedText}>Joined: {profile.join_date ? new Date(profile.join_date).toLocaleDateString() : ''}</Text>
          </Card.Content>
        </Card>

        {/* Action Buttons */}
        <View style={styles.buttonsContainer}>
          <Button
            mode="outlined"
            onPress={async () => {
              await supabase.auth.signOut();
              logoutStore();
              router.replace('/auth/login');
            }}
            style={styles.button}
            icon="logout"
          >
            Logout
          </Button>
          {/* Delete Account */}
          <Chip
            mode="outlined"
            style={[styles.button, { marginTop: 8, borderColor: theme.colors.error }]}
            textStyle={{ color: '#666666' }}
            onPress={() => setShowDeleteConfirm(true)}
          >
            Delete My Account
          </Chip>
        </View>
        {/* Confirmation Dialog */}
        <Portal>
          <Dialog visible={showDeleteConfirm} onDismiss={() => setShowDeleteConfirm(false)}>
            <Dialog.Title>Confirm Deletion</Dialog.Title>
            <Dialog.Content>
              <Text>This will delete all your information and your account. Are you sure?</Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setShowDeleteConfirm(false)}>No</Button>
              <Button
                onPress={async () => {
                  // Invoke Supabase Edge Function
                  const { error: deleteError } = await supabase.functions.invoke('deleteUserAccount', {
                    body: JSON.stringify({ userId: session!.user.id }),
                  });
                  if (deleteError) {
                    console.error('Delete failed', deleteError);
                  } else {
                    await supabase.auth.signOut();
                    logoutStore();
                    router.replace('/auth/login');
                  }
                  setShowDeleteConfirm(false);
                }}
                textColor={theme.colors.error}
              >
                Yes
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  gradientHeader: {
    width: '100%',
    paddingVertical: 28,
    paddingHorizontal: 20,
    backgroundColor: '#1C1B1F',
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 16,
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  profileName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  profileMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  rankBadge: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 4,
  },
  rankBadgeText: {
    color: '#2196F3',
    fontWeight: 'bold',
    fontSize: 14,
  },
  statsCardRow: {
    flexDirection: 'column',
    width: '100%',
    marginTop: 16,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#22202A',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginVertical: 8,
    marginHorizontal: 0,
    elevation: 2,
  },
  statIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  statCardValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginRight: 4,
  },
  statCardLabel: {
    fontSize: 14,
    color: '#B0BEC5',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bioCard: {
    width: '100%',
    backgroundColor: '#22202A',
    borderRadius: 16,
    marginBottom: 14,
    padding: 16,
  },
  joinedText: {
    fontSize: 12,
    color: '#90CAF9',
    marginTop: 6,
  },
  container: { flex:1, backgroundColor: '#1C1B1F' },
  contentContainer: { padding:16, alignItems:'center' },
  header: { alignItems:'center', marginBottom:24 },
  level: { fontSize:16, color:'#CCCCCC', marginTop:8 },
  xpBar: { width:120, height:8, marginTop:4, borderRadius:4 },
  xpText: { fontSize:12, color:'#CCCCCC', marginTop:4, marginBottom:12 },
  name:{ fontSize:24, fontWeight:'bold', marginTop:8, color:'#FFFFFF' },
  username:{ fontSize:16, color:'#CCCCCC' },
  card:{ width:'100%', marginVertical:8 },
  value:{ fontSize:20, fontWeight:'bold' },
  buttonsContainer:{ flexDirection:'row', justifyContent:'space-around', width:'100%', marginTop:24 },
  button:{ flex:1, marginHorizontal:8 },
  divider:{ marginVertical:16, backgroundColor:'#333' },
  centered:{ flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'#1C1B1F' },
  loadingText:{ marginTop:16, color:'#CCCCCC' },
  errorText:{ color:'#FF6B6B', textAlign:'center', margin:16 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  bio: {
    fontSize: 16,
    color: '#CCCCCC',
    lineHeight: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  statItem: {
    alignItems: 'center',
    padding: 16,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#AAAAAA',
  },
  profileUsername: {
    fontSize: 18,
    color: '#FFFFFF',
    marginLeft: 12,
    fontWeight: '500',
  },
});