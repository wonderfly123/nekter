# Authentication System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement role-based authentication system with email/password + Google OAuth, user approvals, and admin panel.

**Architecture:** Supabase Auth handles authentication; `approved_users` table with role column controls access; RLS policies enforce security at database level; React context provides auth state throughout app; user menu provides role-based UI.

**Tech Stack:** Next.js 15 App Router, Supabase Auth, TypeScript, Tailwind CSS, React Query

---

## Task 1: Database Schema Setup

**Files:**
- Create: `database/migrations/002_approved_users.sql`

**Step 1: Create approved_users table migration**

Create the SQL migration file:

```sql
-- Create approved_users table for access control
CREATE TABLE approved_users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  approved_by TEXT,
  approved_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast email lookups
CREATE INDEX idx_approved_users_email ON approved_users(email);

-- Enable RLS
ALTER TABLE approved_users ENABLE ROW LEVEL SECURITY;

-- Users can read their own record
CREATE POLICY "Users can read their own record"
ON approved_users FOR SELECT
USING (auth.email() = email);

-- Admins can read all records
CREATE POLICY "Admins can read all records"
ON approved_users FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM approved_users
    WHERE email = auth.email() AND role = 'admin'
  )
);

-- Admins can manage all records
CREATE POLICY "Admins can manage approved users"
ON approved_users FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM approved_users
    WHERE email = auth.email() AND role = 'admin'
  )
);
```

**Step 2: Run migration in Supabase**

1. Open Supabase dashboard → SQL Editor
2. Paste the migration SQL
3. Click "Run"
4. Verify table created in Table Editor

**Step 3: Add your admin account**

In Supabase SQL Editor, run:

```sql
INSERT INTO approved_users (email, role, approved_by)
VALUES ('jordan@company.com', 'admin', 'system');
```

Replace with your actual email address.

**Step 4: Enable RLS on existing data tables**

In Supabase SQL Editor, run:

```sql
-- Enable RLS on all data tables
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_health_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE interaction_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE zendesk_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_threads ENABLE ROW LEVEL SECURITY;

-- Create policy for each table (example for accounts)
CREATE POLICY "Only approved users can read accounts"
ON accounts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM approved_users
    WHERE email = auth.email()
  )
);

-- Repeat for other tables
CREATE POLICY "Only approved users can read account_health_history"
ON account_health_history FOR SELECT
USING (EXISTS (SELECT 1 FROM approved_users WHERE email = auth.email()));

CREATE POLICY "Only approved users can read interaction_insights"
ON interaction_insights FOR SELECT
USING (EXISTS (SELECT 1 FROM approved_users WHERE email = auth.email()));

CREATE POLICY "Only approved users can read opportunities"
ON opportunities FOR SELECT
USING (EXISTS (SELECT 1 FROM approved_users WHERE email = auth.email()));

CREATE POLICY "Only approved users can read contacts"
ON contacts FOR SELECT
USING (EXISTS (SELECT 1 FROM approved_users WHERE email = auth.email()));

CREATE POLICY "Only approved users can read zendesk_tickets"
ON zendesk_tickets FOR SELECT
USING (EXISTS (SELECT 1 FROM approved_users WHERE email = auth.email()));

CREATE POLICY "Only approved users can read call_transcripts"
ON call_transcripts FOR SELECT
USING (EXISTS (SELECT 1 FROM approved_users WHERE email = auth.email()));

CREATE POLICY "Only approved users can read email_threads"
ON email_threads FOR SELECT
USING (EXISTS (SELECT 1 FROM approved_users WHERE email = auth.email()));
```

**Step 5: Commit**

```bash
git add database/migrations/002_approved_users.sql
git commit -m "feat: add approved_users table and RLS policies"
```

---

## Task 2: Configure Supabase Auth

**Manual Configuration Steps:**

**Step 1: Enable Email Provider**

1. Supabase dashboard → Authentication → Providers
2. Ensure "Email" is enabled
3. Set "Confirm email" to OFF (for demo - faster testing)
4. Save

**Step 2: Configure Google OAuth**

1. Go to Google Cloud Console: https://console.cloud.google.com/
2. Create new project or select existing
3. Enable Google+ API
4. Go to Credentials → Create Credentials → OAuth 2.0 Client ID
5. Application type: Web application
6. Add Authorized redirect URI: `https://[your-project-ref].supabase.co/auth/v1/callback`
   - Get your project ref from Supabase dashboard URL
7. Copy Client ID and Client Secret

8. Back in Supabase dashboard → Authentication → Providers
9. Enable "Google" provider
10. Paste Client ID and Client Secret
11. Save

**Step 3: Configure Site URL**

1. Supabase dashboard → Authentication → URL Configuration
2. Set Site URL: `http://localhost:3000` (development)
3. Add Redirect URLs: `http://localhost:3000/auth/callback`
4. Save

Note: Update these for production deployment later

**Step 4: Document completion**

No git commit needed - configuration is in Supabase dashboard.

---

## Task 3: Auth Types and Utilities

**Files:**
- Create: `dashboard/lib/auth/types.ts`
- Create: `dashboard/lib/auth/roles.ts`
- Create: `dashboard/lib/auth/check-approval.ts`

**Step 1: Create auth types**

File: `dashboard/lib/auth/types.ts`

```typescript
import type { User } from '@supabase/supabase-js';

export type UserRole = 'admin' | 'user';

export interface ApprovedUser {
  id: number;
  email: string;
  role: UserRole;
  approved_by: string | null;
  approved_at: string | null;
  notes: string | null;
  created_at: string | null;
}

export interface AuthState {
  user: User | null;
  role: UserRole | null;
  isLoading: boolean;
  isApproved: boolean;
}
```

**Step 2: Create role utilities**

File: `dashboard/lib/auth/roles.ts`

```typescript
import type { UserRole } from './types';

export const ADMIN_ROUTES = ['/admin'];

export function canAccessRoute(userRole: UserRole | null, path: string): boolean {
  if (!userRole) return false;

  // Check if path is admin route
  const isAdminRoute = ADMIN_ROUTES.some(route => path.startsWith(route));

  if (isAdminRoute) {
    return userRole === 'admin';
  }

  return true; // All approved users can access other routes
}

export function isAdmin(role: UserRole | null): boolean {
  return role === 'admin';
}
```

**Step 3: Create approval check utility**

File: `dashboard/lib/auth/check-approval.ts`

```typescript
import { supabase } from '@/lib/supabase/client';
import type { UserRole } from './types';

export async function getUserApprovalStatus(email: string): Promise<{
  isApproved: boolean;
  role: UserRole | null;
}> {
  const { data, error } = await supabase
    .from('approved_users')
    .select('role')
    .eq('email', email)
    .single();

  if (error || !data) {
    return { isApproved: false, role: null };
  }

  return {
    isApproved: true,
    role: data.role as UserRole
  };
}

export async function getPendingUsers(): Promise<Array<{
  id: string;
  email: string;
  created_at: string;
}>> {
  // Get all users from auth.users
  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();

  if (usersError || !users) {
    return [];
  }

  // Get all approved emails
  const { data: approvedUsers, error: approvedError } = await supabase
    .from('approved_users')
    .select('email');

  if (approvedError) {
    return [];
  }

  const approvedEmails = new Set(approvedUsers?.map(u => u.email) || []);

  // Filter to only pending users
  return users
    .filter(user => user.email && !approvedEmails.has(user.email))
    .map(user => ({
      id: user.id,
      email: user.email!,
      created_at: user.created_at,
    }));
}
```

**Step 4: Commit**

```bash
git add dashboard/lib/auth/types.ts dashboard/lib/auth/roles.ts dashboard/lib/auth/check-approval.ts
git commit -m "feat: add auth types and utility functions"
```

---

## Task 4: Auth Context Provider

**Files:**
- Create: `dashboard/lib/auth/auth-context.tsx`
- Create: `dashboard/lib/auth/use-auth.ts`

**Step 1: Create auth context**

File: `dashboard/lib/auth/auth-context.tsx`

```typescript
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
```

**Step 2: Create useAuth hook**

File: `dashboard/lib/auth/use-auth.ts`

```typescript
'use client';

import { useContext } from 'react';
import { AuthContext } from './auth-context';

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
```

**Step 3: Commit**

```bash
git add dashboard/lib/auth/auth-context.tsx dashboard/lib/auth/use-auth.ts
git commit -m "feat: add auth context provider and hook"
```

---

## Task 5: Login/Signup Page

**Files:**
- Create: `dashboard/app/login/page.tsx`

**Step 1: Create login page**

File: `dashboard/app/login/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        router.push('/priority'); // Will redirect to pending if not approved
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push('/priority');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/priority`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div>
          <h2 className="text-3xl font-bold text-center text-gray-900">
            {mode === 'login' ? 'Sign in' : 'Sign up'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Customer Success Dashboard
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailAuth} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : mode === 'login' ? 'Sign in' : 'Sign up'}
            </button>
          </div>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>

        <div>
          <button
            onClick={handleGoogleAuth}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>
        </div>

        <div className="text-center">
          <button
            type="button"
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            {mode === 'login'
              ? "Don't have an account? Sign up"
              : 'Already have an account? Sign in'}
          </button>
        </div>

        {mode === 'login' && (
          <div className="text-center">
            <a
              href="/reset-password"
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              Forgot your password?
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Test in browser**

Run: `npm run dev`
Navigate to: `http://localhost:3000/login`
Expected: See login form with email/password fields and Google button

**Step 3: Commit**

```bash
git add dashboard/app/login/page.tsx
git commit -m "feat: add login/signup page"
```

---

## Task 6: Password Reset Page

**Files:**
- Create: `dashboard/app/reset-password/page.tsx`

**Step 1: Create password reset page**

File: `dashboard/app/reset-password/page.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check if this is a password reset link (has token)
    const token = searchParams.get('token');
    if (!token) {
      // No token - redirect to request password reset
      router.push('/login');
    }
  }, [searchParams, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-md">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="mt-4 text-2xl font-bold text-gray-900">
              Password Updated
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Redirecting to login...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div>
          <h2 className="text-3xl font-bold text-center text-gray-900">
            Reset Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your new password below
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>

        <div className="text-center">
          <a
            href="/login"
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            Back to login
          </a>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add dashboard/app/reset-password/page.tsx
git commit -m "feat: add password reset page"
```

---

## Task 7: Auth Guard Components

**Files:**
- Create: `dashboard/components/auth/auth-guard.tsx`
- Create: `dashboard/components/auth/role-guard.tsx`
- Create: `dashboard/components/auth/pending-approval.tsx`

**Step 1: Create pending approval page**

File: `dashboard/components/auth/pending-approval.tsx`

```typescript
'use client';

import { useAuth } from '@/lib/auth/use-auth';

export function PendingApproval() {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
            <svg
              className="h-6 w-6 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="mt-4 text-2xl font-bold text-gray-900">
            Pending Approval
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Your account is pending approval. You'll receive access once an administrator approves your account.
          </p>
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <p className="text-sm font-medium text-gray-700">{user?.email}</p>
          </div>
          <button
            onClick={signOut}
            className="mt-6 w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Create auth guard**

File: `dashboard/components/auth/auth-guard.tsx`

```typescript
'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/use-auth';
import { PendingApproval } from './pending-approval';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isApproved } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  if (!isApproved) {
    return <PendingApproval />;
  }

  return <>{children}</>;
}
```

**Step 3: Create role guard**

File: `dashboard/components/auth/role-guard.tsx`

```typescript
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/use-auth';
import type { UserRole } from '@/lib/auth/types';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { role, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && role && !allowedRoles.includes(role)) {
      router.push('/priority'); // Redirect to safe default
    }
  }, [role, isLoading, allowedRoles, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!role || !allowedRoles.includes(role)) {
    return null; // Will redirect
  }

  return <>{children}</>;
}
```

**Step 4: Commit**

```bash
git add dashboard/components/auth/
git commit -m "feat: add auth guard components"
```

---

## Task 8: User Menu Component

**Files:**
- Create: `dashboard/components/user-menu.tsx`
- Modify: `dashboard/components/sidebar.tsx` (add user menu to header)

**Step 1: Create user menu component**

File: `dashboard/components/user-menu.tsx`

```typescript
'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/use-auth';
import { isAdmin } from '@/lib/auth/roles';

export function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, role, signOut } = useAuth();
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const getInitials = (email: string) => {
    return email.charAt(0).toUpperCase();
  };

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-medium">
          {getInitials(user.email || '')}
        </div>
        <span className="text-sm font-medium text-gray-700">{user.email}</span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>

          <button
            onClick={() => {
              router.push('/settings');
              setIsOpen(false);
            }}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Settings
          </button>

          {isAdmin(role) && (
            <button
              onClick={() => {
                router.push('/admin');
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              Admin Panel
            </button>
          )}

          <div className="border-t border-gray-100 mt-1 pt-1">
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Read current sidebar implementation**

Run: Read `dashboard/components/sidebar.tsx` to understand current structure

**Step 3: Add user menu to header section**

Based on the current sidebar structure, add the UserMenu to the top section. You'll need to:
1. Import UserMenu component
2. Add it to the header/top area of the sidebar or create a separate header component
3. Ensure it's positioned in top-right of the dashboard

Note: Specific implementation depends on current layout structure. The UserMenu should be placed in a header component that spans the top of the dashboard.

**Step 4: Commit**

```bash
git add dashboard/components/user-menu.tsx dashboard/components/sidebar.tsx
git commit -m "feat: add user menu with role-based options"
```

---

## Task 9: Settings Page (Placeholder)

**Files:**
- Create: `dashboard/app/settings/page.tsx`

**Step 1: Create settings page**

File: `dashboard/app/settings/page.tsx`

```typescript
import { PageContainer } from '@/components/page-container';

export default function SettingsPage() {
  return (
    <PageContainer>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Coming Soon</h2>
        <p className="text-gray-600">
          User settings and preferences will be available here.
        </p>
      </div>
    </PageContainer>
  );
}
```

**Step 2: Test in browser**

Run: `npm run dev`
Navigate to: `http://localhost:3000/settings`
Expected: See "Coming Soon" placeholder

**Step 3: Commit**

```bash
git add dashboard/app/settings/page.tsx
git commit -m "feat: add settings page placeholder"
```

---

## Task 10: Admin Panel - User Approvals

**Files:**
- Create: `dashboard/app/admin/page.tsx`
- Create: `dashboard/hooks/use-pending-users.ts`
- Create: `dashboard/hooks/use-approved-users.ts`

**Step 1: Create pending users hook**

File: `dashboard/hooks/use-pending-users.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';

interface PendingUser {
  id: string;
  email: string;
  created_at: string;
}

async function fetchPendingUsers(): Promise<PendingUser[]> {
  // This requires Supabase auth admin access
  // For now, we'll return empty array - needs proper implementation
  // In production, this should call a server-side API endpoint
  return [];
}

export function usePendingUsers() {
  return useQuery({
    queryKey: ['pending-users'],
    queryFn: fetchPendingUsers,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}
```

**Step 2: Create approved users hook**

File: `dashboard/hooks/use-approved-users.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import type { ApprovedUser } from '@/lib/auth/types';

async function fetchApprovedUsers(): Promise<ApprovedUser[]> {
  const { data, error } = await supabase
    .from('approved_users')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export function useApprovedUsers() {
  return useQuery({
    queryKey: ['approved-users'],
    queryFn: fetchApprovedUsers,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}
```

**Step 3: Create admin panel page**

File: `dashboard/app/admin/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { PageContainer } from '@/components/page-container';
import { RoleGuard } from '@/components/auth/role-guard';
import { useApprovedUsers } from '@/hooks/use-approved-users';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/use-auth';
import type { UserRole } from '@/lib/auth/types';

export default function AdminPage() {
  return (
    <RoleGuard allowedRoles={['admin']}>
      <AdminContent />
    </RoleGuard>
  );
}

function AdminContent() {
  const { data: approvedUsers, refetch } = useApprovedUsers();
  const { refreshAuthState } = useAuth();
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('user');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleApproveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { error: insertError } = await supabase
        .from('approved_users')
        .insert({
          email: newUserEmail,
          role: newUserRole,
          approved_by: 'admin', // Could get current user email
        });

      if (insertError) throw insertError;

      setSuccess(`Successfully approved ${newUserEmail} as ${newUserRole}`);
      setNewUserEmail('');
      setNewUserRole('user');
      refetch();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeAccess = async (email: string) => {
    if (!confirm(`Revoke access for ${email}?`)) return;

    setLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('approved_users')
        .delete()
        .eq('email', email);

      if (deleteError) throw deleteError;

      setSuccess(`Revoked access for ${email}`);
      refetch();

      // Refresh auth state in case current user revoked themselves
      refreshAuthState();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeRole = async (email: string, newRole: UserRole) => {
    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('approved_users')
        .update({ role: newRole })
        .eq('email', email);

      if (updateError) throw updateError;

      setSuccess(`Updated ${email} to ${newRole}`);
      refetch();

      // Refresh auth state in case current user changed their own role
      refreshAuthState();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Panel</h1>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded">
          {success}
        </div>
      )}

      {/* Approve New User */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Approve New User</h2>
        <form onSubmit={handleApproveUser} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="user@example.com"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                id="role"
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Approving...' : 'Approve User'}
          </button>
        </form>
      </div>

      {/* Approved Users List */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Approved Users</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Approved Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {approvedUsers?.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={user.role}
                      onChange={(e) => handleChangeRole(user.email, e.target.value as UserRole)}
                      disabled={loading}
                      className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.approved_at ? new Date(user.approved_at).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleRevokeAccess(user.email)}
                      disabled={loading}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50"
                    >
                      Revoke Access
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!approvedUsers || approvedUsers.length === 0) && (
            <div className="text-center py-8 text-gray-500">
              No approved users yet
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
```

**Step 4: Commit**

```bash
git add dashboard/hooks/use-pending-users.ts dashboard/hooks/use-approved-users.ts dashboard/app/admin/page.tsx
git commit -m "feat: add admin panel for user approvals"
```

---

## Task 11: Layout Integration with Auth

**Files:**
- Modify: `dashboard/app/layout.tsx`
- Modify: `dashboard/app/priority/page.tsx`
- Modify: `dashboard/app/portfolio/page.tsx`
- Modify: `dashboard/app/account/[id]/page.tsx`

**Step 1: Read current layout**

Run: Read `dashboard/app/layout.tsx`

**Step 2: Wrap layout with AuthProvider**

In `dashboard/app/layout.tsx`, import and wrap the app with AuthProvider:

```typescript
import { AuthProvider } from '@/lib/auth/auth-context';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            {children}
          </AuthProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
```

**Step 3: Protect dashboard pages with AuthGuard**

For each dashboard page (priority, portfolio, account detail), wrap with AuthGuard:

```typescript
// dashboard/app/priority/page.tsx
import { AuthGuard } from '@/components/auth/auth-guard';

export default function PriorityPage() {
  return (
    <AuthGuard>
      {/* existing page content */}
    </AuthGuard>
  );
}
```

Repeat for:
- `dashboard/app/portfolio/page.tsx`
- `dashboard/app/account/[id]/page.tsx`

**Step 4: Test auth flow**

Run: `npm run dev`

Test sequence:
1. Navigate to `/priority` → Should redirect to `/login`
2. Sign up with new email
3. Should see "Pending Approval" screen
4. In Supabase dashboard, approve user
5. Refresh page → Should see dashboard

**Step 5: Commit**

```bash
git add dashboard/app/layout.tsx dashboard/app/priority/page.tsx dashboard/app/portfolio/page.tsx dashboard/app/account/
git commit -m "feat: integrate auth guards with dashboard pages"
```

---

## Task 12: Testing and Verification

**Manual Testing Checklist:**

**Step 1: Test email/password signup**

1. Navigate to `/login`
2. Switch to "Sign up" mode
3. Enter email and password
4. Submit form
5. Expected: Redirects to pending approval screen

**Step 2: Verify pending approval state**

1. Should see pending approval message
2. Should show user's email
3. Logout button should work

**Step 3: Test admin approval**

1. Open Supabase dashboard
2. Navigate to approved_users table
3. Insert new row with test user's email and role='user'
4. Back in app, refresh page
5. Expected: Should now have access to dashboard

**Step 4: Test user menu (regular user)**

1. Click on user avatar/email in top-right
2. Expected: See Settings and Logout options
3. Expected: NO "Admin Panel" option
4. Click Settings → Should see "Coming Soon" page

**Step 5: Test admin role**

1. In Supabase, change user's role to 'admin'
2. Refresh app
3. Click user menu
4. Expected: Now see "Admin Panel" option
5. Click Admin Panel → Should see admin page

**Step 6: Test user approvals (admin)**

1. In admin panel, enter email and select role
2. Click "Approve User"
3. Expected: See success message
4. Expected: User appears in approved users list

**Step 7: Test role changes (admin)**

1. In approved users list, change a user's role dropdown
2. Expected: See success message
3. Verify in Supabase that role was updated

**Step 8: Test access revocation (admin)**

1. Click "Revoke Access" for a user
2. Confirm the action
3. Expected: User removed from list
4. Verify in Supabase that row was deleted

**Step 9: Test Google OAuth (if configured)**

1. Logout
2. On login page, click "Continue with Google"
3. Complete Google auth flow
4. Expected: Redirects back to app
5. Expected: Shows pending approval if not approved yet

**Step 10: Test password reset**

1. On login page, click "Forgot password?"
2. Enter email
3. Check email for reset link
4. Click link
5. Expected: Redirects to reset password page
6. Enter new password
7. Expected: Shows success and redirects to login

**Step 11: Test RLS policies**

1. Open browser console
2. Log in as unapproved user
3. Try to manually query data:
   ```javascript
   await supabase.from('accounts').select('*')
   ```
4. Expected: Returns empty array or error (RLS blocks access)

5. Log in as approved user
6. Run same query
7. Expected: Returns account data

**Step 12: Document any issues**

Create a file documenting any bugs or issues found during testing.

**Step 13: Commit**

```bash
git add .
git commit -m "test: complete manual testing of authentication system"
```

---

## Task 13: Deploy to Vercel

**Step 1: Ensure environment variables are set in Vercel**

1. Go to Vercel dashboard → Project Settings → Environment Variables
2. Verify these are set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_IS_DEMO_MODE`
   - `NEXT_PUBLIC_DEMO_DATE`

**Step 2: Push to GitHub**

```bash
git push origin master
```

**Step 3: Verify Vercel deployment**

1. Wait for deployment to complete
2. Visit deployed URL
3. Test login flow on production

**Step 4: Update Supabase auth settings for production**

1. Supabase dashboard → Authentication → URL Configuration
2. Add production URLs:
   - Site URL: `https://your-app.vercel.app`
   - Redirect URLs: `https://your-app.vercel.app/auth/callback`

3. If using Google OAuth:
   - Add production callback URL to Google Cloud Console
   - `https://[project-ref].supabase.co/auth/v1/callback`

**Step 5: Create first admin user in production**

1. Sign up on production with your email
2. In Supabase dashboard (production project):
   ```sql
   INSERT INTO approved_users (email, role, approved_by)
   VALUES ('your@email.com', 'admin', 'system');
   ```

**Step 6: Test production deployment**

1. Log in as admin
2. Verify all features work
3. Approve a test user
4. Log in as test user
5. Verify dashboard access

---

## Success Criteria

- ✅ Users can sign up with email/password
- ✅ Users can sign up with Google OAuth
- ✅ Unapproved users see pending approval screen
- ✅ Approved users can access dashboard pages
- ✅ User menu shows role-appropriate options
- ✅ Admins can access admin panel
- ✅ Admins can approve users with role assignment
- ✅ Admins can change user roles
- ✅ Admins can revoke access
- ✅ Regular users cannot see admin features
- ✅ RLS policies enforce data access control
- ✅ Password reset flow works
- ✅ Sessions persist across refreshes
- ✅ Logout clears session properly
- ✅ Settings page shows placeholder
- ✅ System deployed to production

---

## Plan Complete

**Next Steps:**
Use the `superpowers:executing-plans` skill to implement this plan step-by-step in a separate session, OR use `superpowers:subagent-driven-development` to execute tasks with fresh subagents in this session.
