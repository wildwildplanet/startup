import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, fetchUserProfile } from './supabaseClient';
import { useStore } from '../store/useStore';
import { Session } from '@supabase/supabase-js';

// Create context for Supabase session
type SupabaseContextType = {
  session: Session | null;
  isLoading: boolean;
};

const SupabaseContext = createContext<SupabaseContextType>({
  session: null,
  isLoading: true,
});

// Hook to use the Supabase context
export const useSupabase = () => useContext(SupabaseContext);

// Provider component
export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Only run this on the client side
    if (typeof window === 'undefined') {
      return;
    }

    // Get initial session and log the user object
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Supabase initial session:', session);
      if (session?.user) console.log('Supabase initial user:', session.user);
      setSession(session);
      setIsLoading(false);
    });

    // Listen for auth changes and log updates
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Supabase auth event:', event, 'session:', session);
        if (session?.user) console.log('Supabase user after auth change:', session.user);
        setSession(session);
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sync user_profile row into the Zustand store on every session change
  useEffect(() => {
    if (!session?.user) {
      useStore.setState({ user: null });
      return;
    }
    (async () => {
      try {
        // Fetch existing profile row
        let prof = await fetchUserProfile(session.user.id);
        const metadata = session.user.user_metadata || {};
        // If no profile exists, insert default row with $1M starting cash
        if (!prof) {
          const defaultRow = {
            id: session.user.id,
            name: metadata.full_name || metadata.name || '',
            username: (metadata.email?.split('@')[0] as string) || '',
            email: session.user.email || '',
            avatar: metadata.avatar_url || metadata.picture || '',
            bio: '',
            cashavailable: 1000000,
            portfoliovalue: 0,
            level: 0,
            experiencepoints: 0,
            experiencetonextlevel: 1000,
            rank: 0,
            achievements: [] as any[],
          };
          const { data: inserted, error: insertErr } = await supabase
            .from('user_profiles')
            .insert(defaultRow)
            .select()
            .single();
          if (insertErr) console.error('Error creating default profile:', insertErr);
          else prof = inserted;
        }
        // Hydrate the Zustand store with DB values
        useStore.setState({
          user: {
            id: prof.id,
            name: prof.name,
            username: prof.username,
            email: prof.email,
            avatar: prof.avatar,
            level: prof.level ?? 0,
            experiencePoints: prof.experiencepoints ?? 0,
            experienceToNextLevel: prof.experiencetonextlevel ?? 1000,
            rank: prof.rank?.toString() || '',
            portfolioValue: prof.portfoliovalue ?? 0,
            cashAvailable: prof.cashavailable ?? 0,
            achievements: (prof.achievements || []).map((a: any) => ({ id: a.id, title: a.name, description: a.description, completed: true })),
          }
        });
      } catch (err) {
        console.error('Error syncing profile:', err);
      }
    })();
  }, [session]);

  // When rendering on server, provide empty session
  if (typeof window === 'undefined') {
    return (
      <SupabaseContext.Provider value={{ session: null, isLoading: false }}>
        {children}
      </SupabaseContext.Provider>
    );
  }

  return (
    <SupabaseContext.Provider value={{ session, isLoading }}>
      {children}
    </SupabaseContext.Provider>
  );
} 