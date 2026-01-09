'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageContainer } from '@/components/layout/page-container';
import { useAuth } from '@/lib/auth/use-auth';
import { supabase } from '@/lib/supabase/client';
import { User, Mail, Building2, Check, MessageSquare, Loader2, Sun, Moon, Monitor } from 'lucide-react';
import { AlertSettings } from '@/components/settings/AlertSettings';
import { useTheme } from '@/lib/theme/theme-context';

interface SlackInstallation {
  slack_team_id: string;
  slack_team_name: string | null;
}

interface UserSlackSettings {
  slack_notifications_enabled: boolean;
  slack_user_id: string | null;
  slack_team_id: string | null;
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsLoading />}>
      <SettingsContent />
    </Suspense>
  );
}

function SettingsLoading() {
  return (
    <PageContainer>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Settings</h1>
      <div className="max-w-2xl">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading settings...
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

function SettingsContent() {
  const { user, refreshAuthState } = useAuth();
  const { theme, setTheme } = useTheme();
  const searchParams = useSearchParams();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [company, setCompany] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Slack state
  const [slackInstallation, setSlackInstallation] = useState<SlackInstallation | null>(null);
  const [slackSettings, setSlackSettings] = useState<UserSlackSettings | null>(null);
  const [slackLoading, setSlackLoading] = useState(true);
  const [slackError, setSlackError] = useState<string | null>(null);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);

  useEffect(() => {
    if (user) {
      setFirstName(user.user_metadata?.first_name || '');
      setLastName(user.user_metadata?.last_name || '');
      setCompany(user.user_metadata?.company || '');
      loadSlackData();
    }
  }, [user]);

  // Handle OAuth callback messages
  useEffect(() => {
    const slackStatus = searchParams.get('slack');
    if (slackStatus === 'success') {
      loadSlackData();
      window.history.replaceState({}, '', '/settings');
    } else if (slackStatus === 'error') {
      const message = searchParams.get('message') || 'Failed to connect Slack';
      setSlackError(message);
      setTimeout(() => setSlackError(null), 5000);
      window.history.replaceState({}, '', '/settings');
    }
  }, [searchParams]);

  const loadSlackData = async () => {
    setSlackLoading(true);
    try {
      // First, load user's Slack settings to see if they're linked to a team
      if (user) {
        const { data: settings } = await supabase
          .from('user_slack_settings')
          .select('slack_notifications_enabled, slack_user_id, slack_team_id')
          .eq('user_id', user.id)
          .single();

        setSlackSettings(settings);

        // Only load the Slack installation if user has a linked team
        if (settings?.slack_team_id) {
          const { data: installation } = await supabase
            .from('slack_installations')
            .select('slack_team_id, slack_team_name')
            .eq('slack_team_id', settings.slack_team_id)
            .single();

          setSlackInstallation(installation);
        } else {
          // User has no linked team - show "Connect Slack" button
          setSlackInstallation(null);
        }
      }
    } catch (err) {
      console.error('Error loading Slack data:', err);
    } finally {
      setSlackLoading(false);
    }
  };

  const handleSlackToggle = async () => {
    if (!user || !slackInstallation) return;

    const newEnabled = !slackSettings?.slack_notifications_enabled;
    const previousSettings = slackSettings;

    // Optimistically update UI
    setSlackError(null);
    setSlackSettings(prev => ({
      ...prev,
      slack_notifications_enabled: newEnabled,
      slack_team_id: slackInstallation.slack_team_id,
      slack_user_id: prev?.slack_user_id || null,
    }));

    try {
      const { error: upsertError } = await supabase
        .from('user_slack_settings')
        .upsert({
          user_id: user.id,
          slack_notifications_enabled: newEnabled,
          slack_team_id: slackInstallation.slack_team_id,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (upsertError) throw upsertError;
    } catch (err: any) {
      console.error('Error toggling Slack notifications:', err);
      // Revert on error
      setSlackSettings(previousSettings);
      setSlackError('Failed to update notification settings');
      setTimeout(() => setSlackError(null), 5000);
    }
  };

  const handleConnectSlack = () => {
    if (!user) return;
    window.location.href = `/api/integrations/slack/authorize?userId=${user.id}`;
  };

  const handleDisconnectSlack = async () => {
    if (!user) return;

    setShowDisconnectModal(false);
    setSlackLoading(true);
    setSlackError(null);

    try {
      const response = await fetch('/api/integrations/slack/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      if (response.ok) {
        setSlackInstallation(null);
        setSlackSettings(null);
      } else {
        throw new Error('Failed to disconnect');
      }
    } catch (err) {
      console.error('Error disconnecting Slack:', err);
      setSlackError('Failed to disconnect Slack');
      setTimeout(() => setSlackError(null), 5000);
    } finally {
      setSlackLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          company: company.trim(),
        },
      });

      if (updateError) throw updateError;

      setSuccess(true);
      if (refreshAuthState) {
        await refreshAuthState();
      }

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Settings</h1>

      <div className="max-w-2xl">
        {/* Profile Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Profile</h2>
            </div>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Manage your personal information
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                <Check className="w-4 h-4" />
                Profile updated successfully
              </div>
            )}

            {/* Email (read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Contact support to change your email address
              </p>
            </div>

            {/* Name fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  First Name
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Last Name
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Company */}
            <div>
              <label
                htmlFor="company"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Company
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="company"
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Appearance Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm mt-6">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Appearance</h2>
            </div>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Customize how the dashboard looks
            </p>
          </div>

          <div className="p-6">
            <div className="flex flex-col gap-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Theme</label>
              <div className="flex gap-3">
                <button
                  onClick={() => setTheme('light')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                    theme === 'light'
                      ? 'border-orange-500 bg-hover-accent text-link'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <Sun className="w-5 h-5" />
                  <span className="text-sm font-medium">Light</span>
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                    theme === 'dark'
                      ? 'border-orange-500 bg-hover-accent text-link'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <Moon className="w-5 h-5" />
                  <span className="text-sm font-medium">Dark</span>
                </button>
                <button
                  onClick={() => setTheme('system')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                    theme === 'system'
                      ? 'border-orange-500 bg-hover-accent text-link'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <Monitor className="w-5 h-5" />
                  <span className="text-sm font-medium">System</span>
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                System will automatically switch between light and dark based on your device settings.
              </p>
            </div>
          </div>
        </div>

        {/* Slack Integration Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm mt-6">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Slack Integration</h2>
              </div>
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Slack_icon_2019.svg/2048px-Slack_icon_2019.svg.png"
                alt="Slack"
                className="w-8 h-8"
              />
            </div>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Receive notifications via Slack DM
            </p>
          </div>

          <div className="p-6 space-y-4">
            {slackError && (
              <div className="px-4 py-3 rounded-lg text-sm bg-status-error-bg border border-status-error-border text-status-error-text">
                {slackError}
              </div>
            )}

            {slackLoading ? (
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading Slack settings...
              </div>
            ) : !slackInstallation ? (
              // No workspace connected - show connect button
              <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Connect your Slack workspace to enable notifications for you and your team.
                </p>
                <button
                  onClick={handleConnectSlack}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#4A154B] text-white text-sm font-medium rounded-lg hover:bg-[#3a1139] transition-colors"
                >
                  Connect Slack
                </button>
              </div>
            ) : (
              // Workspace connected - show toggle
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Connected to: {slackInstallation.slack_team_name || 'Slack Workspace'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {slackSettings?.slack_notifications_enabled
                        ? 'You will receive notifications via Slack DM'
                        : 'Enable to receive notifications via Slack DM'}
                    </p>
                  </div>
                  <button
                    onClick={handleSlackToggle}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
                      slackSettings?.slack_notifications_enabled ? 'bg-orange-600' : 'bg-gray-200 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        slackSettings?.slack_notifications_enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <button
                    onClick={handleConnectSlack}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white underline"
                  >
                    Reconnect workspace
                  </button>
                  <button
                    onClick={() => setShowDisconnectModal(true)}
                    className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Alert Notifications Section */}
        <AlertSettings
          hasSlackInstallation={!!slackInstallation}
          slackEnabled={!!slackSettings?.slack_notifications_enabled}
        />
      </div>

      {/* Disconnect Slack Modal */}
      {showDisconnectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Disconnect Slack</h3>
            </div>
            <div className="px-6 py-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Are you sure you want to disconnect Slack? You will no longer receive notifications via Slack DM.
              </p>
            </div>
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 flex justify-end gap-3">
              <button
                onClick={() => setShowDisconnectModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDisconnectSlack}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
