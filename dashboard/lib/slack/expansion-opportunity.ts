import type { ExpansionOpportunityAlertPayload } from '../alerts/types';

function formatInteractionType(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
}

function getSentimentEmoji(score: number): string {
  if (score >= 70) return '🟢';
  if (score >= 50) return '🟡';
  return '🔴';
}

/**
 * Build Block Kit blocks for expansion opportunity Slack notification
 */
export function buildExpansionOpportunitySlackBlocks(payload: ExpansionOpportunityAlertPayload): any[] {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nekter.io';
  const accountUrl = `${appUrl}/account/${payload.accountId}?tab=interactions&interactionId=${payload.details.interactionId}`;

  const sentimentEmoji = getSentimentEmoji(payload.details.sentimentScore);

  const blocks: any[] = [
    // Header
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '🚀 Expansion Opportunity',
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
      ],
    },
  ];

  // Add expansion reasons if present
  if (payload.details.expansionReasons && payload.details.expansionReasons.length > 0) {
    const reasonsList = payload.details.expansionReasons
      .slice(0, 3)
      .map(reason => `• ${reason}`)
      .join('\n');

    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Expansion Signals:*\n${reasonsList}`,
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
 * Build fallback text for expansion opportunity notification
 */
export function buildExpansionOpportunitySlackText(payload: ExpansionOpportunityAlertPayload): string {
  return `Expansion Opportunity: ${payload.accountName} - growth signals detected in ${payload.details.interactionType}`;
}
