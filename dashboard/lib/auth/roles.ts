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
