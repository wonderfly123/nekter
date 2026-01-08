import type {
  HealthStatus,
  TrendStatus,
  AccountHealth,
  InteractionInsight,
} from '../supabase/types';

/**
 * Returns Tailwind classes for health status badge colors
 * Uses semantic tokens that automatically switch in dark mode
 */
export function getHealthStatusColor(status: HealthStatus): string {
  switch (status) {
    case 'Critical':
      return 'bg-status-error-bg text-status-error-text border-status-error-border';
    case 'At Risk':
      return 'bg-status-warning-bg text-status-warning-text border-status-warning-border';
    case 'Healthy':
      return 'bg-status-success-bg text-status-success-text border-status-success-border';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
}

/**
 * Returns emoji icon for health status
 */
export function getHealthStatusIcon(status: HealthStatus): string {
  switch (status) {
    case 'Critical':
      return '🔴';
    case 'At Risk':
      return '🟡';
    case 'Healthy':
      return '🟢';
    default:
      return '⚪';
  }
}

/**
 * Returns arrow icon for trend
 */
export function getTrendIcon(trend: TrendStatus): string {
  switch (trend) {
    case 'Improving':
      return '↑';
    case 'Declining':
      return '↓';
    case 'Stable':
      return '→';
    default:
      return '—';
  }
}

/**
 * Returns text label for trend
 */
export function getTrendText(trend: TrendStatus): string {
  switch (trend) {
    case 'Improving':
      return 'Improving';
    case 'Declining':
      return 'Declining';
    case 'Stable':
      return 'Stable';
    default:
      return 'N/A';
  }
}

/**
 * Returns Tailwind color classes for trend
 */
export function getTrendColor(trend: TrendStatus): string {
  switch (trend) {
    case 'Improving':
      return 'text-green-600 dark:text-green-400';
    case 'Declining':
      return 'text-red-600 dark:text-red-400';
    case 'Stable':
      return 'text-gray-600 dark:text-gray-400';
    default:
      return 'text-gray-400';
  }
}

/**
 * Calculates priority score for sorting
 * Critical accounts get 2x multiplier, At Risk get 1x
 */
export function calculatePriorityScore(
  arr: number | null,
  status: HealthStatus
): number {
  const baseArr = arr || 0;
  const multiplier = status === 'Critical' ? 2 : status === 'At Risk' ? 1 : 0;
  return baseArr * multiplier;
}

/**
 * Extracts top 2 signals from calculated metrics and interactions
 * Priority: Sentiment > Churn > Tickets > Inactivity
 */
export function getTopSignals(
  avgSentiment: number | null,
  churnSignals: number,
  openTicketCount: number,
  daysSinceActivity: number | null,
  interactions: InteractionInsight[]
): string[] {
  const signals: string[] = [];

  // Priority 1: Low Sentiment (most important)
  if (avgSentiment !== null && avgSentiment < 50) {
    signals.push(`Sentiment: ${Math.round(avgSentiment)} (concerning)`);
  }

  // Priority 2: Churn Signals
  if (churnSignals > 0) {
    // Find latest interaction with churn risk to get reasons
    const churnInteraction = interactions.find((i) => i.churn_risk);
    if (churnInteraction && churnInteraction.churn_reasons) {
      const reasons = churnInteraction.churn_reasons.slice(0, 2).join(', ');
      signals.push(`${churnSignals} Churn Signals: ${reasons}`);
    } else {
      signals.push(`${churnSignals} Churn Signals detected`);
    }
  }

  // Priority 3: Open Tickets
  if (openTicketCount >= 2) {
    signals.push(`${openTicketCount} open tickets`);
  }

  // Priority 4: Inactivity
  if (daysSinceActivity !== null && daysSinceActivity > 30) {
    signals.push(`No contact in ${daysSinceActivity} days`);
  }

  // Return top 2 signals only
  return signals.slice(0, 2);
}
