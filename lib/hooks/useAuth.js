'use client';

import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

const AuthContext = createContext(null);

/**
 * Wrap your layout (or specific subtree) with <AuthProvider>
 * to give all child components access to `useAuth()`.
 */
export function AuthProvider({ children, initialUser = null }) {
  const [user, setUser]       = useState(initialUser);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(!initialUser);
  const supabase = createClient();

  const fetchProfile = useCallback(
    async (userId) => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      setProfile(data ?? null);
    },
    [supabase]
  );

  useEffect(() => {
    // Initial session check
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user ?? null);
      if (user) fetchProfile(user.id);
      setLoading(false);
    });

    // Listen for auth state changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const sessionUser = session?.user ?? null;
      setUser(sessionUser);
      if (sessionUser) {
        await fetchProfile(sessionUser.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile, supabase]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, fetchProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth state in any Client Component.
 *
 * @example
 * const { user, profile, loading, signOut } = useAuth();
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an <AuthProvider>.');
  }
  return ctx;
}
