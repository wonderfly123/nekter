import type { User } from '@supabase/supabase-js';

export type UserRole = 'pending' | 'user' | 'admin';

export interface ApprovedUser {
  id: number;
  email: string;
  role: UserRole;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  signup_reason: string | null;
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
