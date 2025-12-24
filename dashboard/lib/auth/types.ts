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
