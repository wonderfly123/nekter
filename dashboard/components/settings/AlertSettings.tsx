'use client';

import { useState, useEffect } from 'react';
import { Bell, Mail, MessageSquare, AlertTriangle, TrendingDown, TrendingUp, Loader2, Check } from 'lucide-react';
import { useAuth } from '@/lib/auth/use-auth';

interface AlertTypeSettings {
  email_enabled: boolean;
  slack_enabled: boolean;
  bell_enabled: boolean;
}

interface AlertSettings {
  health_drop: AlertTypeSettings;
  bad_interaction: AlertTypeSettings;
  expansion_opportunity: AlertTypeSettings;
}

interface ToggleProps {
  enabled: boolean;
  onChange: () => void;
  disabled?: boolean;
}

function Toggle({ enabled, onChange, disabled }: ToggleProps) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 ${
        enabled ? 'bg-orange-600' : 'bg-gray-200'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-5' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

interface AlertRowProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  settings: AlertTypeSettings;
  onToggle: (channel: 'email' | 'slack' | 'bell') => void;
  loading: boolean;
  hasSlack: boolean;
}

function AlertRow({ icon, title, description, settings, onToggle, loading, hasSlack }: AlertRowProps) {
  return (
    <div className="py-4 first:pt-0 last:pb-0">
      <div className="flex items-start gap-3 mb-3">
        <div className="p-2 bg-gray-100 rounded-lg">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900">{title}</h4>
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-6 ml-11">
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <Mail className="w-4 h-4" />
          <span>Email</span>
          <Toggle
            enabled={settings.email_enabled}
            onChange={() => onToggle('email')}
            disabled={loading}
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <MessageSquare className="w-4 h-4" />
          <span>Slack</span>
          <Toggle
            enabled={settings.slack_enabled && hasSlack}
            onChange={() => onToggle('slack')}
            disabled={loading || !hasSlack}
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <Bell className="w-4 h-4" />
          <span>Bell</span>
          <Toggle
            enabled={settings.bell_enabled}
            onChange={() => onToggle('bell')}
            disabled={loading}
          />
        </label>
      </div>
    </div>
  );
}

interface AlertSettingsProps {
  hasSlackInstallation: boolean;
}

export function AlertSettings({ hasSlackInstallation }: AlertSettingsProps) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<AlertSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      loadSettings();
    }
  }, [user]);

  const loadSettings = async () => {
    try {
      const { data: { session } } = await (await import('@/lib/supabase/client')).supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/settings/alerts', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Error loading alert settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (alertType: 'health_drop' | 'bad_interaction' | 'expansion_opportunity', channel: 'email' | 'slack' | 'bell') => {
    if (!settings || !user) return;

    // Optimistically update UI
    const currentSettings = settings[alertType];
    const channelKey = `${channel}_enabled` as keyof AlertTypeSettings;
    const newValue = !currentSettings[channelKey];

    setSettings({
      ...settings,
      [alertType]: {
        ...currentSettings,
        [channelKey]: newValue,
      },
    });

    setUpdating(true);
    try {
      const { data: { session } } = await (await import('@/lib/supabase/client')).supabase.auth.getSession();
      if (!session) return;

      // Get the current settings for this alert type
      const typeSettings = settings[alertType];

      const response = await fetch('/api/settings/alerts', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          alertType,
          emailEnabled: channel === 'email' ? newValue : typeSettings.email_enabled,
          slackEnabled: channel === 'slack' ? newValue : typeSettings.slack_enabled,
          bellEnabled: channel === 'bell' ? newValue : typeSettings.bell_enabled,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update settings');
      }

      setMessage({ type: 'success', text: 'Settings updated' });
      setTimeout(() => setMessage(null), 2000);
    } catch (error) {
      console.error('Error updating alert settings:', error);
      // Revert on error
      setSettings({
        ...settings,
        [alertType]: currentSettings,
      });
      setMessage({ type: 'error', text: 'Failed to update settings' });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm mt-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Alert Notifications</h2>
          </div>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading alert settings...
          </div>
        </div>
      </div>
    );
  }

  if (!settings) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm mt-6">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Alert Notifications</h2>
        </div>
        <p className="mt-1 text-sm text-gray-600">
          Get notified about health changes and concerning interactions
        </p>
      </div>

      <div className="p-6">
        {message && (
          <div
            className={`mb-4 px-4 py-3 rounded-lg text-sm flex items-center gap-2 ${
              message.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}
          >
            {message.type === 'success' && <Check className="w-4 h-4" />}
            {message.text}
          </div>
        )}

        {!hasSlackInstallation && (
          <div className="mb-4 px-4 py-3 rounded-lg text-sm bg-amber-50 border border-amber-200 text-amber-700">
            Connect Slack above to enable Slack notifications
          </div>
        )}

        <div className="divide-y divide-gray-100">
          <AlertRow
            icon={<TrendingDown className="w-4 h-4 text-red-600" />}
            title="Health Drop Alerts"
            description="When an account's health status drops (Healthy → At Risk or At Risk → Critical)"
            settings={settings.health_drop}
            onToggle={(channel) => handleToggle('health_drop', channel)}
            loading={updating}
            hasSlack={hasSlackInstallation}
          />
          <AlertRow
            icon={<AlertTriangle className="w-4 h-4 text-amber-600" />}
            title="Bad Interaction Alerts"
            description="Churn risk detected or sentiment score below 60"
            settings={settings.bad_interaction}
            onToggle={(channel) => handleToggle('bad_interaction', channel)}
            loading={updating}
            hasSlack={hasSlackInstallation}
          />
          <AlertRow
            icon={<TrendingUp className="w-4 h-4 text-green-600" />}
            title="Expansion Opportunity Alerts"
            description="Growth signals detected in customer interactions"
            settings={settings.expansion_opportunity}
            onToggle={(channel) => handleToggle('expansion_opportunity', channel)}
            loading={updating}
            hasSlack={hasSlackInstallation}
          />
        </div>
      </div>
    </div>
  );
}
