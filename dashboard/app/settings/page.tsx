'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageContainer } from '@/components/layout/page-container';
import { useAuth } from '@/lib/auth/use-auth';
import { supabase } from '@/lib/supabase/client';
import { User, Mail, Building2, Check, MessageSquare, ExternalLink, Loader2 } from 'lucide-react';

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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>
      <div className="max-w-2xl">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-2 text-gray-500">
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
  const [slackToggleLoading, setSlackToggleLoading] = useState(false);
  const [slackMessage, setSlackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
      const teamName = searchParams.get('team');
      setSlackMessage({ type: 'success', text: `Connected to Slack workspace: ${teamName}` });
      loadSlackData();
      // Clear URL params
      window.history.replaceState({}, '', '/settings');
    } else if (slackStatus === 'error') {
      const message = searchParams.get('message') || 'Failed to connect Slack';
      setSlackMessage({ type: 'error', text: message });
      window.history.replaceState({}, '', '/settings');
    }
  }, [searchParams]);

  const loadSlackData = async () => {
    setSlackLoading(true);
    try {
      // Load Slack installation
      const { data: installation } = await supabase
        .from('slack_installations')
        .select('slack_team_id, slack_team_name')
        .limit(1)
        .single();

      setSlackInstallation(installation);

      // Load user's Slack settings
      if (user) {
        const { data: settings } = await supabase
          .from('user_slack_settings')
          .select('slack_notifications_enabled, slack_user_id, slack_team_id')
          .eq('user_id', user.id)
          .single();

        setSlackSettings(settings);
      }
    } catch (err) {
      console.error('Error loading Slack data:', err);
    } finally {
      setSlackLoading(false);
    }
  };

  const handleSlackToggle = async () => {
    if (!user || !slackInstallation) return;

    setSlackToggleLoading(true);
    try {
      const newEnabled = !slackSettings?.slack_notifications_enabled;

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

      setSlackSettings(prev => ({
        ...prev,
        slack_notifications_enabled: newEnabled,
        slack_team_id: slackInstallation.slack_team_id,
        slack_user_id: prev?.slack_user_id || null,
      }));

      setSlackMessage({
        type: 'success',
        text: newEnabled ? 'Slack notifications enabled' : 'Slack notifications disabled',
      });

      setTimeout(() => setSlackMessage(null), 3000);
    } catch (err: any) {
      console.error('Error toggling Slack notifications:', err);
      setSlackMessage({ type: 'error', text: 'Failed to update notification settings' });
    } finally {
      setSlackToggleLoading(false);
    }
  };

  const handleConnectSlack = () => {
    if (!user) return;
    window.location.href = `/api/integrations/slack/authorize?userId=${user.id}`;
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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      <div className="max-w-2xl">
        {/* Profile Section */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Profile</h2>
            </div>
            <p className="mt-1 text-sm text-gray-600">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Contact support to change your email address
              </p>
            </div>

            {/* Name fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  First Name
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Last Name
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Company */}
            <div>
              <label
                htmlFor="company"
                className="block text-sm font-medium text-gray-700 mb-1"
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
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-gray-200">
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

        {/* Slack Integration Section */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm mt-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Slack Integration</h2>
            </div>
            <p className="mt-1 text-sm text-gray-600">
              Receive task notifications via Slack DM
            </p>
          </div>

          <div className="p-6 space-y-4">
            {slackMessage && (
              <div
                className={`px-4 py-3 rounded-lg text-sm flex items-center gap-2 ${
                  slackMessage.type === 'success'
                    ? 'bg-green-50 border border-green-200 text-green-700'
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}
              >
                {slackMessage.type === 'success' && <Check className="w-4 h-4" />}
                {slackMessage.text}
              </div>
            )}

            {slackLoading ? (
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading Slack settings...
              </div>
            ) : !slackInstallation ? (
              // No workspace connected - show connect button
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Connect your Slack workspace to enable notifications for you and your team.
                </p>
                <button
                  onClick={handleConnectSlack}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#4A154B] text-white text-sm font-medium rounded-lg hover:bg-[#3a1139] transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
                  </svg>
                  Add to Slack
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            ) : (
              // Workspace connected - show toggle
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Connected to: {slackInstallation.slack_team_name || 'Slack Workspace'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {slackSettings?.slack_notifications_enabled
                        ? 'You will receive task notifications via Slack DM'
                        : 'Enable to receive task notifications via Slack DM'}
                    </p>
                  </div>
                  <button
                    onClick={handleSlackToggle}
                    disabled={slackToggleLoading}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 ${
                      slackSettings?.slack_notifications_enabled ? 'bg-orange-600' : 'bg-gray-200'
                    } ${slackToggleLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        slackSettings?.slack_notifications_enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={handleConnectSlack}
                    className="text-sm text-gray-600 hover:text-gray-900 underline"
                  >
                    Reconnect Slack workspace
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
