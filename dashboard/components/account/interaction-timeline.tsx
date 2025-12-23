'use client';

import { formatDate } from '@/lib/utils/date-utils';
import { Mail, Phone, MessageSquare, TrendingUp, TrendingDown } from 'lucide-react';
import type { InteractionInsight } from '@/lib/supabase/types';

interface InteractionTimelineProps {
  interactions: InteractionInsight[];
}

export function InteractionTimeline({ interactions }: InteractionTimelineProps) {
  const getInteractionIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'email':
        return Mail;
      case 'call':
        return Phone;
      default:
        return MessageSquare;
    }
  };

  const getSentimentColor = (score: number) => {
    if (score >= 70) return 'text-green-600 bg-green-50';
    if (score >= 50) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Recent Interactions (90 days)
      </h2>
      {interactions.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600">No recent interactions</p>
        </div>
      ) : (
        <div className="space-y-4">
          {interactions.map((interaction) => {
            const Icon = getInteractionIcon(interaction.interaction_type);
            const sentimentColor = getSentimentColor(interaction.sentiment_score);

            return (
              <div
                key={interaction.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:border-amber-500 transition-colors"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Icon className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 capitalize">
                        {interaction.interaction_type}
                      </div>
                      {interaction.created_at && (
                        <div className="text-xs text-gray-500">
                          {formatDate(interaction.created_at)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div
                    className={`${sentimentColor} px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1`}
                  >
                    {interaction.sentiment_score >= 50 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {interaction.sentiment_score}
                  </div>
                </div>

                {/* Summary */}
                {interaction.insight_summary && (
                  <div className="text-sm text-gray-700 mb-3">
                    {interaction.insight_summary}
                  </div>
                )}

                {/* Signals */}
                <div className="flex flex-wrap gap-2">
                  {interaction.churn_risk && interaction.churn_reasons && (
                    <div className="bg-red-50 text-red-700 px-2 py-1 rounded text-xs">
                      Churn Risk: {interaction.churn_reasons[0]}
                    </div>
                  )}
                  {interaction.expansion_opportunity &&
                    interaction.expansion_reasons && (
                      <div className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs">
                        Expansion: {interaction.expansion_reasons[0]}
                      </div>
                    )}
                  {interaction.sentiment_reasons &&
                    interaction.sentiment_reasons.length > 0 && (
                      <div className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">
                        {interaction.sentiment_reasons[0]}
                      </div>
                    )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
