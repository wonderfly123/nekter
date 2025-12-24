'use client';

import { useState } from 'react';
import { PageContainer } from '@/components/layout/page-container';
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
