import type { InteractionInsight, ZendeskTicket, TrendStatus } from '@/lib/supabase/types';
import { getDemoDateString } from '@/lib/config/demo';

export interface CalculatedMetrics {
  avgSentiment: number | null;
  interactionCount: number;
  churnSignals: number;
  expansionSignals: number;
  openTicketCount: number;
  daysSinceActivity: number | null;
}

/**
 * Calculate metrics on-the-fly from source data
 *
 * @param interactions - All interaction_insights for the account (filtered to 90 days)
 * @param openTickets - Open zendesk tickets for the account
 * @param lastActivityDate - Last activity date from accounts table
 * @returns Calculated metrics
 */
export function calculateMetrics(
  interactions: InteractionInsight[],
  openTickets: ZendeskTicket[],
  lastActivityDate: string | null
): CalculatedMetrics {
  const demoDate = getDemoDateString();
  const ninetyDaysAgo = new Date(new Date(demoDate).getTime() - 90 * 24 * 60 * 60 * 1000);

  // Filter interactions to last 90 days
  const recentInteractions = interactions.filter((interaction) => {
    if (!interaction.created_at) return false;
    return new Date(interaction.created_at) >= ninetyDaysAgo;
  });

  // Calculate average sentiment from recent interactions
  const avgSentiment =
    recentInteractions.length > 0
      ? recentInteractions.reduce((sum, i) => sum + i.sentiment_score, 0) /
        recentInteractions.length
      : null;

  // Calculate interaction count
  const interactionCount = recentInteractions.length;

  // Calculate churn signals (interactions with churn_risk = true)
  const churnSignals = recentInteractions.filter((i) => i.churn_risk === true).length;

  // Calculate expansion signals (interactions with expansion_opportunity = true)
  const expansionSignals = recentInteractions.filter(
    (i) => i.expansion_opportunity === true
  ).length;

  // Count open tickets
  const openTicketCount = openTickets.length;

  // Calculate days since activity - check both interaction date and SF last activity date
  let daysSinceActivity: number | null = null;
  const today = new Date(demoDate);

  // Get most recent interaction date
  let mostRecentInteractionDate: Date | null = null;
  if (recentInteractions.length > 0) {
    const sortedInteractions = [...recentInteractions].sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });
    if (sortedInteractions[0].created_at) {
      mostRecentInteractionDate = new Date(sortedInteractions[0].created_at);
    }
  }

  // Get SF last activity date
  const sfLastActivityDate = lastActivityDate ? new Date(lastActivityDate) : null;

  // Use whichever date is more recent
  let mostRecentDate: Date | null = null;
  if (mostRecentInteractionDate && sfLastActivityDate) {
    mostRecentDate =
      mostRecentInteractionDate > sfLastActivityDate
        ? mostRecentInteractionDate
        : sfLastActivityDate;
  } else if (mostRecentInteractionDate) {
    mostRecentDate = mostRecentInteractionDate;
  } else if (sfLastActivityDate) {
    mostRecentDate = sfLastActivityDate;
  }

  // Calculate days since most recent activity
  if (mostRecentDate) {
    const diffTime = today.getTime() - mostRecentDate.getTime();
    daysSinceActivity = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  return {
    avgSentiment,
    interactionCount,
    churnSignals,
    expansionSignals,
    openTicketCount,
    daysSinceActivity,
  };
}
