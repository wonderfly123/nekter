'use client';

import { createContext, useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { getUserApprovalStatus } from './check-approval';
import type { AuthState, UserRole } from './types';

interface AuthContextValue extends AuthState {
  signOut: () => Promise<void>;
  refreshAuthState: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    role: null,
    isLoading: true,
    isApproved: false,
  });
  const router = useRouter();

  const loadAuthState = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        setState({
          user: null,
          role: null,
          isLoading: false,
          isApproved: false,
        });
        return;
      }

      const { isApproved, role } = await getUserApprovalStatus(session.user.email!);

      setState({
        user: session.user,
        role,
        isLoading: false,
        isApproved,
      });
    } catch (error) {
      console.error('Error loading auth state:', error);
      setState({
        user: null,
        role: null,
        isLoading: false,
        isApproved: false,
      });
    }
  };

  useEffect(() => {
    loadAuthState();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            const { isApproved, role } = await getUserApprovalStatus(session.user.email!);
            setState({
              user: session.user,
              role,
              isLoading: false,
              isApproved,
            });
          }
        } else if (event === 'SIGNED_OUT') {
          setState({
            user: null,
            role: null,
            isLoading: false,
            isApproved: false,
          });
          router.push('/login');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const refreshAuthState = async () => {
    await loadAuthState();
  };

  return (
    <AuthContext.Provider value={{ ...state, signOut, refreshAuthState }}>
      {children}
    </AuthContext.Provider>
  );
}
