import type { BadInteractionAlertPayload } from '../alerts/types';

function formatInteractionType(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
}

function getSentimentEmoji(score: number): string {
  if (score >= 70) return '🟢';
  if (score >= 50) return '🟡';
  return '🔴';
}

/**
 * Build Block Kit blocks for bad interaction Slack notification
 */
export function buildBadInteractionSlackBlocks(payload: BadInteractionAlertPayload): any[] {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nekter.io';
  const accountUrl = `${appUrl}/account/${payload.accountId}?tab=interactions&interactionId=${payload.details.interactionId}`;

  const sentimentEmoji = getSentimentEmoji(payload.details.sentimentScore);

  const blocks: any[] = [
    // Header
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '⚠️ Bad Interaction Detected',
        emoji: true,
      },
    },
    // Divider
    {
      type: 'divider',
    },
    // Account name
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Account:* ${payload.accountName}`,
      },
    },
    // Interaction details - two column layout
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Type*\n${formatInteractionType(payload.details.interactionType)}`,
        },
        {
          type: 'mrkdwn',
          text: `*Date*\n${payload.details.interactionDate}`,
        },
        {
          type: 'mrkdwn',
          text: `*Sentiment*\n${sentimentEmoji} ${payload.details.sentimentScore}/100`,
        },
        {
          type: 'mrkdwn',
          text: `*Churn Risk*\n${payload.details.churnRisk ? '🔴 Yes' : '🟢 No'}`,
        },
      ],
    },
  ];

  // Add churn reasons if present
  if (payload.details.churnRisk && payload.details.churnReasons && payload.details.churnReasons.length > 0) {
    const reasonsList = payload.details.churnReasons
      .slice(0, 3)
      .map(reason => `• ${reason}`)
      .join('\n');

    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Churn Signals:*\n${reasonsList}`,
      },
    });
  }

  // Add summary if present
  if (payload.details.summary) {
    const truncatedSummary = payload.details.summary.length > 200
      ? payload.details.summary.slice(0, 197) + '...'
      : payload.details.summary;

    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Summary:*\n>${truncatedSummary}`,
      },
    });
  }

  // Divider before button
  blocks.push({
    type: 'divider',
  });

  // Action button
  blocks.push({
    type: 'actions',
    elements: [
      {
        type: 'button',
        text: {
          type: 'plain_text',
          text: 'View Account',
          emoji: false,
        },
        url: accountUrl,
        style: 'primary',
      },
    ],
  });

  return blocks;
}

/**
 * Build fallback text for bad interaction notification
 */
export function buildBadInteractionSlackText(payload: BadInteractionAlertPayload): string {
  const reasons: string[] = [];
  if (payload.details.churnRisk) reasons.push('churn risk');
  if (payload.details.sentimentScore < 60) reasons.push(`low sentiment (${payload.details.sentimentScore})`);

  return `Interaction Alert: ${payload.accountName} - ${reasons.join(', ')} detected in ${payload.details.interactionType}`;
}
