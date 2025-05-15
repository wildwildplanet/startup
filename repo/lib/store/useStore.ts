import { create } from 'zustand';
import { fetchStartups, fetchUserProfile, fetchUserPortfolio, makeInvestment, updateUserBalanceInSupabase } from '../supabase/supabaseClient'; 
import { supabase } from '../supabase/supabaseClient';

export interface Startup {
  id: string;
  name: string;
  logo: string;
  askAmount: number;
  valuation: number;
  roi: number;
  problem: string;
  solution: string;
  fundingUse: string;
  revenue: string;
  growth: string;
  team: string;
  teamSize: number;
  market: string;
  traction: string;
  risks: string;
  stage: string;
  industry: string;
  riskLevel: string;
}

export interface Investment {
  id: string;
  userId: string;
  startupId: string;
  investedAmount: number;
  equity: number;
  currentValue: number;
  changePercent: number;
  status: 'growing' | 'stable' | 'declining' | 'bankrupt';
  startup?: Startup;
}

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar: string;
  level: number;
  experiencePoints: number;
  experienceToNextLevel: number;
  rank: string;
  portfolioValue: number;
  cashAvailable: number;
  achievements: Achievement[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

export interface AppState {
  user: User | null;
  startups: Startup[];
  portfolio: Investment[];
  isLoading: boolean;
  error: string | null;
  
  // Auth actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  
  // Startup actions
  loadStartups: () => Promise<void>;
  
  // Investment actions
  makeInvestment: (startupId: string, amount: number, equity: number) => Promise<boolean>;
  
  // Portfolio actions
  loadPortfolio: () => Promise<void>;
  
  // Simulate market conditions to update portfolio values randomly
  simulateMarket: () => void;
}

// Utility to update balance everywhere
export async function updateUserBalanceEverywhere(userId: string, newBalance: number) {
  try {
    // Try Supabase Edge Function for privileged update
    const { error } = await supabase.functions.invoke('updateUserBalance', {
      body: JSON.stringify({ userId, newBalance }),
    });
    if (error) throw error;
    useStore.setState(state => ({
      ...state,
      user: state.user ? { ...state.user, cashAvailable: newBalance } : state.user,
    }));
    return true;
  } catch (error: any) {
    console.error('Edge Function failed:', error);
    // Fallback: direct Supabase update
    try {
      console.log('Fallback: updating user balance directly');
      await updateUserBalanceInSupabase(userId, newBalance);
      useStore.setState(state => ({
        ...state,
        user: state.user ? { ...state.user, cashAvailable: newBalance } : state.user,
      }));
      return true;
    } catch (innerError: any) {
      console.error('Fallback direct update failed:', innerError);
      return false;
    }
  }
}

export const useStore = create<AppState>((set, get) => ({
  user: null,
  startups: [],
  portfolio: [],
  isLoading: false,
  error: null,
  
  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !data.user) throw error || new Error('Login failed');
      const profile = await fetchUserProfile(data.user.id);
      set({ user: profile as User, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },
  
  logout: async () => {
    await supabase.auth.signOut();
    // Reset local store to initial state
    set({
      user: null,
      startups: [],
      portfolio: [],
      isLoading: false,
      error: null,
    });
  },
  
  loadStartups: async () => {
    set({ isLoading: true, error: null });
    try {
      const startups = await fetchStartups();
      set({ startups, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },
  makeInvestment: async (startupId: string, amount: number, equity: number) => {
    set({ isLoading: true, error: null });
    try {
      const { user, startups } = get();
      if (!user) {
        set({ error: 'User not logged in', isLoading: false });
        return false;
      }
      if (user.cashAvailable < amount) {
        set({ error: 'Insufficient funds', isLoading: false });
        return false;
      }
      const startup = startups.find(s => s.id === startupId);
      if (!startup) {
        set({ error: 'Startup not found', isLoading: false });
        return false;
      }
      // Record investment on Supabase
      await makeInvestment({ startup_id: startupId, amount, equity_received: equity });
      // Deduct user balance and reload portfolio
      const newBalance = user.cashAvailable - amount;
      await updateUserBalanceEverywhere(user.id, newBalance);
      await get().loadPortfolio();
      // Award XP: 1 XP per $100 invested
      const xpGain = Math.floor(amount / 100);
      const currentXP = user.experiencePoints || 0;
      const newXP = currentXP + xpGain;
      const newLevel = Math.floor(newXP / 100);
      const xpToNext = (newLevel + 1) * 100;
      // Persist XP and level
      await supabase
        .from('user_profiles')
        .update({ experience_points: newXP, level: newLevel, experience_to_next_level: xpToNext })
        .eq('id', user.id);
      // Update local store
      set(state => ({
        user: state.user ? { ...state.user, experiencePoints: newXP, level: newLevel, experienceToNextLevel: xpToNext } : state.user
      }));
      set({ isLoading: false });
      return true;
    } catch (error: any) {
      set({ error: 'Investment failed', isLoading: false });
      return false;
    }
  },
  
  loadPortfolio: async () => {
    set({ isLoading: true, error: null });
    try {
      const { user } = get();
      if (!user) {
        set({ error: 'User not logged in', isLoading: false });
        return;
      }
      const data = await fetchUserPortfolio(user.id);
      // Map raw supabase data to Investment interface
      const formatted = (data as any[])
        .filter(inv => inv.status !== 'sold')
        .map(inv => {
          // Extract startup from Supabase relation, support both plural and singular keys
          let raw = (inv as any).startups ?? (inv as any).startup;
          // Normalize to single object
          let startupObj: any;
          if (Array.isArray(raw) && raw.length > 0) startupObj = raw[0];
          else startupObj = raw;
          // Fallback to global startups state if absent
          if (!startupObj) {
            startupObj = get().startups.find((s: any) => s.id === inv.startup_id);
          }
          return {
            id: inv.id,
            userId: inv.user_id,
            startupId: inv.startup_id,
            investedAmount: inv.amount,
            equity: inv.equity,
            currentValue: inv.current_value,
            changePercent: inv.amount
              ? ((inv.current_value - inv.amount) / inv.amount) * 100
              : 0,
            status: inv.status,
            startup: startupObj as Startup,
          };
        });
      const totalValue = formatted.reduce((sum, inv) => sum + inv.currentValue, 0);
      set({
        portfolio: formatted,
        user: user ? { ...user, portfolioValue: totalValue } : user,
        isLoading: false,
      });
    } catch (error: any) {
      set({ error: 'Failed to load portfolio', isLoading: false });
    }
  },
  
  simulateMarket: () => {
    const { portfolio, user } = get();
    if (!portfolio || portfolio.length === 0) return;
    // Box-Muller transform for normal distribution
    const randNormal = (): number => {
      let u = 0, v = 0;
      while (u === 0) u = Math.random();
      while (v === 0) v = Math.random();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    };
    const μ = 0.0005; // drift (~0.05% per update)
    const σ = 0.01;   // volatility (~1% per update)
    const updatedPortfolio = portfolio.map(inv => {
      const oldVal = inv.currentValue;
      const Δ = randNormal() * σ + μ;
      const newVal = oldVal * (1 + Δ);
      const changePercent = oldVal > 0
        ? ((newVal - oldVal) / oldVal) * 100
        : inv.changePercent;
      return { ...inv, currentValue: newVal, changePercent };
    });
    const newTotal = updatedPortfolio.reduce((sum, inv) => sum + inv.currentValue, 0);
    set({
      portfolio: updatedPortfolio,
      user: user ? { ...user, portfolioValue: newTotal } : user,
    });
  },
})); 