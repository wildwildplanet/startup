import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env';

// Initialize the Supabase client with environment variables (fall back to defaults if missing)
const supabaseUrl = SUPABASE_URL || 'https://fjhreuzbsbgbpmiqeuty.supabase.co';
const supabaseAnonKey = SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqaHJldXpic2JnYnBtaXFldXR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0Nzg2NzksImV4cCI6MjA2MDA1NDY3OX0.b9nX4biMFQk600GZ1vOdBW8jpC76Wl0SuM51x0FIF-Y';

// Enable debug mode in development
const debug = true;

// Use AsyncStorage for session persistence in React Native
// React Native environment requires AsyncStorage for supabase auth
// No need to detect via window

// Create a client that works in both server and client environments
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Use AsyncStorage for React Native, fallback to no storage on web/Node
    storage: Platform.OS !== 'web' ? AsyncStorage : undefined,
    autoRefreshToken: true,
    // Persist session only on native
    persistSession: Platform.OS !== 'web',
    // Detect session in URL only on web
    detectSessionInUrl: Platform.OS === 'web',
  },
});

// Connection test function
export const testConnection = async () => {
  try {
    if (debug) console.log('Testing Supabase connection...');
    // Simple query to test connection
    const { data, error } = await supabase.from('startups').select('id').limit(1);
    
    if (error) {
      console.error('Connection test error:', error);
      return { success: false, error };
    }
    
    if (debug) console.log('Connection successful:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Connection test exception:', error);
    return { success: false, error };
  }
};

// Startup-related functions
export const fetchStartups = async () => {
  if (debug) console.log('Fetching startups...');
  const { data, error } = await supabase
    .from('startups')
    .select('*');

  if (error) {
    console.error('Error fetching startups:', error);
    return [];
  }
  
  if (debug) console.log(`Fetched ${data?.length || 0} startups`);
  
  // Shuffle startups for random display
  const shuffled = (data || []).sort(() => Math.random() - 0.5);
  return shuffled;
};

// User-related functions
export const fetchUserProfile = async (userId: string) => {
  if (debug) console.log(`Fetching user profile for ID: ${userId}`);
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
  
  if (debug) console.log('User profile fetched:', data?.username);
  return data;
};

// Portfolio-related functions
export const fetchUserPortfolio = async (userId: string) => {
  if (debug) console.log(`Fetching portfolio for user ID: ${userId}`);
  const { data, error } = await supabase
    .from('investments')
    .select('*, startup: startups(*)')
    .eq('user_id', userId)
    .eq('status', 'active');

  if (error) {
    console.error('Error fetching user portfolio:', error);
    return [];
  }
  
  if (debug) console.log(`Fetched ${data?.length || 0} investments`);
  return data || [];
};

// Achievement-related functions
export const fetchUserAchievements = async (userId: string) => {
  if (debug) console.log(`Fetching achievements for user ID: ${userId}`);
  const { data, error } = await supabase
    .from('achievements')
    .select('*')
    .eq('user_id', userId)
    .order('date_earned', { ascending: false });

  if (error) {
    console.error('Error fetching user achievements:', error);
    return [];
  }
  
  if (debug) console.log(`Fetched ${data?.length || 0} achievements`);
  return data || [];
};

// Update user balance in Supabase
export const updateUserBalanceInSupabase = async (userId: string, newBalance: number) => {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .update({ cashavailable: newBalance })
      .eq('id', userId);
    if (error) {
      console.error('Error updating user balance:', error);
      throw new Error(error.message);
    }
    return true;
  } catch (error) {
    console.error('Error in updateUserBalanceInSupabase:', error);
    throw error;
  }
};

// Investment-related functions
export const makeInvestment = async (investment: {
  startup_id: string;
  amount: number;
  equity_received: number;
}): Promise<any> => {
  try {
    // Retrieve current authenticated user
    const { data: { user }, error: getUserError } = await supabase.auth.getUser();
    if (getUserError || !user) {
      throw new Error('User not authenticated');
    }
    const user_id = user.id;

    const { data, error } = await supabase
      .from('investments')
      .insert({
        user_id,
        startup_id: investment.startup_id,
        amount: investment.amount,
        equity: investment.equity_received,
        current_value: investment.amount, // Set initial current_value to amount
        status: 'active',
      })
      .select()
      .single();

    // LOG the result for debugging
    if (error) {
      console.error('[makeInvestment] Supabase insert error:', error.message, error.details, error.hint);
    } else {
      console.log('[makeInvestment] Supabase insert success:', data);
    }

    if (error) {
      console.error('Error making investment:', error);
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.error('Error in makeInvestment:', error);
    throw error;
  }
};

// Leaderboard-related functions
export const fetchLeaderboard = async () => {
  if (debug) console.log('Fetching leaderboard...');
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .order('portfoliovalue', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }
  
  if (debug) console.log(`Fetched ${data?.length || 0} leaderboard entries`);
  return data || [];
};

/**
 * Fetch a specific startup by ID
 */
export const fetchStartupById = async (id: string): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('startups')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching startup:', error);
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.error('Error in fetchStartupById:', error);
    throw error;
  }
}; 