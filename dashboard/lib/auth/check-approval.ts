import type { User } from '@supabase/supabase-js';
import type { UserRole } from './types';

// Cache approval status to prevent redundant checks
const approvalCache = new Map<string, {
  isApproved: boolean;
  role: UserRole | null;
  timestamp: number;
}>();

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Clear cache for a specific user ID (useful after admin changes)
export function clearApprovalCache(userId?: string) {
  if (userId) {
    console.log('Clearing approval cache for:', userId);
    approvalCache.delete(userId);
  } else {
    console.log('Clearing all approval cache');
    approvalCache.clear();
  }
}

// Get approval status directly from user object (no API calls)
export function getUserApprovalStatus(user: User | null): {
  isApproved: boolean;
  role: UserRole | null;
} {
  if (!user) {
    return { isApproved: false, role: null };
  }

  console.log('getUserApprovalStatus called for userId:', user.id);

  // Check cache first
  const cached = approvalCache.get(user.id);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log('Returning cached approval status:', cached);
    return { isApproved: cached.isApproved, role: cached.role };
  }

  // Get role directly from app_metadata (no API call needed)
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
  approvalCache.set(user.id, { ...result, timestamp: Date.now() });
  return result;
}
