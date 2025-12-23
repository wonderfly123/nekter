'use client';

import { AlertCircle, CheckCircle2 } from 'lucide-react';
import type { AccountDetailData } from '@/lib/supabase/types';

interface ActionItemsProps {
  data: AccountDetailData;
}

interface ActionItem {
  priority: 'high' | 'medium' | 'low';
  text: string;
}

function generateActionItems(data: AccountDetailData): ActionItem[] {
  const actions: ActionItem[] = [];
  const { currentHealth, championLeft, recentInteractions } = data;

  // Priority 1: Low Sentiment (most important)
  if (currentHealth.avg_sentiment !== null && currentHealth.avg_sentiment < 50) {
    actions.push({
      priority: 'high',
      text: `Schedule urgent check-in call - sentiment at ${Math.round(
        currentHealth.avg_sentiment
      )}`,
    });

    // Look for sentiment reasons in recent interactions
    const recentNegative = recentInteractions.find(
      (i) => i.sentiment_score < 50 && i.sentiment_reasons
    );
    if (recentNegative?.sentiment_reasons && recentNegative.sentiment_reasons.length > 0) {
      actions.push({
        priority: 'high',
        text: `Address concerns: ${recentNegative.sentiment_reasons[0]}`,
      });
    }
  }

  // Priority 2: Churn Signals
  if (currentHealth.churn_signals !== null && currentHealth.churn_signals > 0) {
    actions.push({
      priority: 'high',
      text: `Review ${currentHealth.churn_signals} churn signal${
        currentHealth.churn_signals > 1 ? 's' : ''
      } and create mitigation plan`,
    });

    // Look for specific churn reasons
    const churnInteraction = recentInteractions.find(
      (i) => i.churn_risk && i.churn_reasons
    );
    if (churnInteraction?.churn_reasons && churnInteraction.churn_reasons.length > 0) {
      actions.push({
        priority: 'high',
        text: `Address churn risk: ${churnInteraction.churn_reasons[0]}`,
      });
    }
  }

  // Champion Left
  if (championLeft) {
    actions.push({
      priority: 'high',
      text: 'Champion has left - identify and onboard new champion',
    });
  }

  // Priority 3: Open Tickets
  if (currentHealth.open_ticket_count !== null && currentHealth.open_ticket_count > 0) {
    if (currentHealth.open_ticket_count >= 3) {
      actions.push({
        priority: 'medium',
        text: `Follow up on ${currentHealth.open_ticket_count} open support tickets`,
      });
    } else {
      actions.push({
        priority: 'low',
        text: `Monitor ${currentHealth.open_ticket_count} open ticket${
          currentHealth.open_ticket_count > 1 ? 's' : ''
        }`,
      });
    }
  }

  // Priority 4: Inactivity
  if (currentHealth.days_since_activity !== null && currentHealth.days_since_activity > 30) {
    if (currentHealth.days_since_activity > 60) {
      actions.push({
        priority: 'high',
        text: `No contact in ${currentHealth.days_since_activity} days - schedule immediate outreach`,
      });
    } else {
      actions.push({
        priority: 'medium',
        text: `Plan proactive check-in - ${currentHealth.days_since_activity} days since last contact`,
      });
    }
  }

  // Low Interaction Count
  if (currentHealth.interaction_count !== null && currentHealth.interaction_count < 2) {
    actions.push({
      priority: 'medium',
      text: 'Increase engagement frequency - only ' +
        currentHealth.interaction_count +
        ' interaction' +
        (currentHealth.interaction_count === 1 ? '' : 's') +
        ' in 30 days',
    });
  }

  // Expansion Opportunities
  if (
    currentHealth.expansion_signals !== null &&
    currentHealth.expansion_signals > 0
  ) {
    actions.push({
      priority: 'low',
      text: `Explore ${currentHealth.expansion_signals} expansion opportunity${
        currentHealth.expansion_signals > 1 ? 'ies' : ''
      }`,
    });
  }

  // If everything is good
  if (actions.length === 0 && currentHealth.health_status === 'Healthy') {
    actions.push({
      priority: 'low',
      text: 'Continue regular touchpoints and monitor health',
    });
  }

  return actions;
}

export function ActionItems({ data }: ActionItemsProps) {
  const actionItems = generateActionItems(data);

  const getPriorityColor = (priority: ActionItem['priority']) => {
    switch (priority) {
      case 'high':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          icon: 'text-red-600',
          text: 'text-red-900',
        };
      case 'medium':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          icon: 'text-yellow-600',
          text: 'text-yellow-900',
        };
      case 'low':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          icon: 'text-green-600',
          text: 'text-green-900',
        };
    }
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Recommended Actions
      </h2>
      <div className="space-y-3">
        {actionItems.map((item, index) => {
          const colors = getPriorityColor(item.priority);
          const Icon = item.priority === 'low' ? CheckCircle2 : AlertCircle;

          return (
            <div
              key={index}
              className={`${colors.bg} ${colors.border} border rounded-lg p-4 flex items-start gap-3`}
            >
              <Icon className={`w-5 h-5 ${colors.icon} flex-shrink-0 mt-0.5`} />
              <div className={`flex-1 text-sm ${colors.text}`}>{item.text}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
