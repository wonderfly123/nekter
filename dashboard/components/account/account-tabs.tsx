'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { MetricsGrid } from './metrics-grid';
import { HealthTrendChart } from './health-trend-chart';
import { ActionItems } from './action-items';
import { InteractionTimeline } from './interaction-timeline';
import { TasksList } from '@/components/tasks/TasksList';
import { NotesList } from '@/components/notes/NotesList';
import type { AccountDetailData } from '@/lib/supabase/types';

interface AccountTabsProps {
  data: AccountDetailData;
}

type TabType = 'overview' | 'interactions' | 'tasks' | 'notes';

export function AccountTabs({ data }: AccountTabsProps) {
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get('tab') as TabType | null;
  const [activeTab, setActiveTab] = useState<TabType>(tabFromUrl || 'overview');

  // Update active tab when URL changes
  useEffect(() => {
    if (tabFromUrl && ['overview', 'interactions', 'tasks', 'notes'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview' },
    { id: 'interactions' as TabType, label: 'Interactions' },
    { id: 'tasks' as TabType, label: 'Tasks' },
    { id: 'notes' as TabType, label: 'Notes' },
  ];

  return (
    <div className="flex flex-col h-full flex-1 min-w-0">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex gap-1 px-8 pt-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white border-b-2 border-amber-500'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
        {activeTab === 'overview' && (
          <div className="p-8 space-y-8">
            {/* Health Overview Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Health Overview
                </h2>
              </div>

              {/* Current Status Card */}
              <div className={`rounded-lg p-6 mb-6 ${
                data.currentHealth.health_status === 'Critical'
                  ? 'bg-status-error-bg border border-status-error-border'
                  : data.currentHealth.health_status === 'At Risk'
                  ? 'bg-status-warning-bg border border-status-warning-border'
                  : 'bg-status-success-bg border border-status-success-border'
              }`}>
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-full flex-shrink-0 ${
                    data.currentHealth.health_status === 'Critical'
                      ? 'bg-red-600'
                      : data.currentHealth.health_status === 'At Risk'
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}></div>
                  <div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">
                      CURRENT STATUS
                    </div>
                    <div className={`text-2xl font-bold mb-1 ${
                      data.currentHealth.health_status === 'Critical'
                        ? 'text-red-600 dark:text-red-400'
                        : data.currentHealth.health_status === 'At Risk'
                        ? 'text-yellow-600 dark:text-yellow-400'
                        : 'text-green-600 dark:text-green-400'
                    }`}>
                      {data.currentHealth.health_status}
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1">
                      {data.currentHealth.trend === 'Declining' && (
                        <span className="text-red-600 dark:text-red-400">↓</span>
                      )}
                      {data.currentHealth.trend === 'Improving' && (
                        <span className="text-green-600 dark:text-green-400">↑</span>
                      )}
                      {data.currentHealth.trend === 'Stable' && (
                        <span className="text-gray-600 dark:text-gray-400">→</span>
                      )}
                      {data.currentHealth.trend || 'Unknown'} trend
                    </div>
                  </div>
                </div>
              </div>

              {/* Metrics Grid */}
              <MetricsGrid data={data} />
            </div>

            {/* Health Trend Chart */}
            <HealthTrendChart healthHistory={data.healthHistory} />
          </div>
        )}

        {activeTab === 'interactions' && (
          <div className="p-8">
            <InteractionTimeline interactions={data.recentInteractions} />
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="p-8">
            <TasksList sfAccountId={data.account.sf_account_id} />
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="p-8">
            <NotesList sfAccountId={data.account.sf_account_id} />
          </div>
        )}
      </div>
    </div>
  );
}
