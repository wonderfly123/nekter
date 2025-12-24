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
    console.log('Loading auth state...');
    try {
      console.log('Getting session...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('Session error:', sessionError);
        throw sessionError;
      }

      if (!session?.user) {
        console.log('No session found');
        setState({
          user: null,
          role: null,
          isLoading: false,
          isApproved: false,
        });
        return;
      }

      console.log('Session found for:', session.user.email);
      console.log('Checking approval status...');
      const { isApproved, role } = await getUserApprovalStatus(session.user.id);
      console.log('Approval status:', { isApproved, role });

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
        console.log('Auth state change:', event, session?.user?.email);

        try {
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            if (session?.user) {
              const { isApproved, role } = await getUserApprovalStatus(session.user.id);
              console.log('User approval status:', { isApproved, role });
              setState({
                user: session.user,
                role,
                isLoading: false,
                isApproved,
              });
            }
          } else if (event === 'SIGNED_OUT') {
            console.log('User signed out, redirecting to login');
            setState({
              user: null,
              role: null,
              isLoading: false,
              isApproved: false,
            });
            router.push('/login');
          } else if (event === 'INITIAL_SESSION') {
            // Handle initial session load
            if (session?.user) {
              const { isApproved, role } = await getUserApprovalStatus(session.user.id);
              setState({
                user: session.user,
                role,
                isLoading: false,
                isApproved,
              });
            } else {
              setState({
                user: null,
                role: null,
                isLoading: false,
                isApproved: false,
              });
            }
          }
        } catch (error) {
          console.error('Error in auth state change handler:', error);
          setState({
            user: null,
            role: null,
            isLoading: false,
            isApproved: false,
          });
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
