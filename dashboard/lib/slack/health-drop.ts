import type { HealthDropAlertPayload } from '../alerts/types';
import type { HealthStatus } from '../supabase/types';

const statusEmoji: Record<HealthStatus, string> = {
  'Healthy': '🟢',
  'At Risk': '🟡',
  'Critical': '🔴',
};

/**
 * Build Block Kit blocks for health drop Slack notification
 */
export function buildHealthDropSlackBlocks(payload: HealthDropAlertPayload): any[] {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nekter.io';
  const accountUrl = `${appUrl}/account/${payload.accountId}`;

  const prevEmoji = statusEmoji[payload.details.previousStatus];
  const newEmoji = statusEmoji[payload.details.newStatus];

  const blocks: any[] = [
    // Header
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '⚠️ Health Drop Alert',
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
    // Status change
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Status Change:*\n${prevEmoji} ${payload.details.previousStatus}  →  ${newEmoji} ${payload.details.newStatus}`,
      },
    },
  ];

  // Add health score if available
  if (payload.details.healthScore !== null) {
    blocks.push({
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Health Score*\n${payload.details.healthScore}/100`,
        },
      ],
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
 * Build fallback text for health drop notification
 */
export function buildHealthDropSlackText(payload: HealthDropAlertPayload): string {
  return `Health Alert: ${payload.accountName} dropped from ${payload.details.previousStatus} to ${payload.details.newStatus}`;
}
