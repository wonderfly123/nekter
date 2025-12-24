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
