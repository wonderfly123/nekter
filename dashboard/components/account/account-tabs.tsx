'use client';

import { useState } from 'react';
import { MetricsGrid } from './metrics-grid';
import { HealthTrendChart } from './health-trend-chart';
import { ActionItems } from './action-items';
import { InteractionTimeline } from './interaction-timeline';
import type { AccountDetailData } from '@/lib/supabase/types';

interface AccountTabsProps {
  data: AccountDetailData;
}

type TabType = 'overview' | 'interactions' | 'tasks';

export function AccountTabs({ data }: AccountTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview' },
    { id: 'interactions' as TabType, label: 'Interactions' },
    { id: 'tasks' as TabType, label: 'Tasks' },
  ];

  return (
    <div className="flex flex-col h-full flex-1 min-w-0">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 bg-white">
        <div className="flex gap-1 px-8 pt-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-gray-50 text-gray-900 border-b-2 border-amber-500'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {activeTab === 'overview' && (
          <div className="p-8 space-y-8">
            {/* Health Overview Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Health Overview
                </h2>
              </div>

              {/* Current Status Card */}
              <div className={`rounded-lg p-6 mb-6 ${
                data.currentHealth.health_status === 'Critical'
                  ? 'bg-red-50 border border-red-200'
                  : data.currentHealth.health_status === 'At Risk'
                  ? 'bg-yellow-50 border border-yellow-200'
                  : 'bg-green-50 border border-green-200'
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
                    <div className="text-xs text-gray-600 uppercase tracking-wide mb-1">
                      CURRENT STATUS
                    </div>
                    <div className={`text-2xl font-bold mb-1 ${
                      data.currentHealth.health_status === 'Critical'
                        ? 'text-red-600'
                        : data.currentHealth.health_status === 'At Risk'
                        ? 'text-yellow-600'
                        : 'text-green-600'
                    }`}>
                      {data.currentHealth.health_status}
                    </div>
                    <div className="text-sm text-gray-700 flex items-center gap-1">
                      {data.currentHealth.trend === 'Declining' && (
                        <span className="text-red-600">↓</span>
                      )}
                      {data.currentHealth.trend === 'Improving' && (
                        <span className="text-green-600">↑</span>
                      )}
                      {data.currentHealth.trend === 'Stable' && (
                        <span className="text-gray-600">→</span>
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
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Tasks
              </h3>
              <p className="text-gray-600">Task management coming soon</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
