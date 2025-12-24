import { supabase } from '@/lib/supabase/client';
import type { UserRole } from './types';

// Cache approval status to prevent redundant checks
const approvalCache = new Map<string, {
  isApproved: boolean;
  role: UserRole | null;
  timestamp: number;
}>();

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Clear cache for a specific email (useful after admin changes)
export function clearApprovalCache(email?: string) {
  if (email) {
    console.log('Clearing approval cache for:', email);
    approvalCache.delete(email);
  } else {
    console.log('Clearing all approval cache');
    approvalCache.clear();
  }
}

export async function getUserApprovalStatus(userId: string): Promise<{
  isApproved: boolean;
  role: UserRole | null;
}> {
  console.log('getUserApprovalStatus called for userId:', userId);

  // Check cache first
  const cached = approvalCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log('Returning cached approval status:', cached);
    return { isApproved: cached.isApproved, role: cached.role };
  }

  try {
    const startTime = Date.now();

    console.log('Fetching user from Supabase Auth...');
    const { data: { user }, error } = await supabase.auth.getUser();

    const duration = Date.now() - startTime;
    console.log(`Auth check completed in ${duration}ms`);

    if (error || !user) {
      console.error('Error fetching user:', error);
      return { isApproved: false, role: null };
    }

    // Get role from app_metadata (set by admin via API)
    const role = (user.app_metadata?.role as UserRole) || 'pending';

    console.log('User metadata:', {
      userId: user.id,
      email: user.email,
      role,
      email_confirmed: user.email_confirmed_at ? 'Yes' : 'No'
    });

    // Only approve if role is 'user' or 'admin', not 'pending'
    const isApproved = role === 'user' || role === 'admin';

    const result = {
      isApproved,
      role
    };

    console.log('Approval status:', result);

    // Cache the result
    approvalCache.set(userId, { ...result, timestamp: Date.now() });
    return result;
  } catch (error) {
    console.error('Error in getUserApprovalStatus:', error);
    return { isApproved: false, role: null };
  }
}
