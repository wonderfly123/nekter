import { createClient } from '@supabase/supabase-js';
import sgMail from '@sendgrid/mail';
import { getUserAlertSettings } from './settings';
import { getSlackInstallation, getUserSlackSettings, lookupSlackUserByEmail, sendSlackDM } from '../slack';
import { generateHealthDropEmail } from '../email/templates/health-drop';
import { generateBadInteractionEmail } from '../email/templates/bad-interaction';
import { buildHealthDropSlackBlocks, buildHealthDropSlackText } from '../slack/health-drop';
import { buildBadInteractionSlackBlocks, buildBadInteractionSlackText } from '../slack/bad-interaction';
import type { AlertPayload, HealthDropAlertPayload, BadInteractionAlertPayload } from './types';

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Create Supabase client with service role for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

/**
 * Main function to send an alert via all enabled channels
 */
export async function sendAlert(payload: AlertPayload): Promise<{
  email: boolean;
  slack: boolean;
  bell: boolean;
}> {
  const results = {
    email: false,
    slack: false,
    bell: false,
  };

  try {
    // Get user's alert settings for this alert type
    const settings = await getUserAlertSettings(payload.csmUserId, payload.type);

    // Send to enabled channels in parallel
    const [emailResult, slackResult, bellResult] = await Promise.all([
      settings.email_enabled ? sendAlertEmail(payload) : Promise.resolve(false),
      settings.slack_enabled ? sendAlertSlack(payload) : Promise.resolve(false),
      settings.bell_enabled ? createAlertNotification(payload) : Promise.resolve(false),
    ]);

    results.email = emailResult;
    results.slack = slackResult;
    results.bell = bellResult;
  } catch (error) {
    console.error('Error sending alert:', error);
  }

  return results;
}

/**
 * Send alert via email
 */
async function sendAlertEmail(payload: AlertPayload): Promise<boolean> {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      console.warn('SendGrid API key not configured');
      return false;
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nekter.io';
    const accountUrl = `${appUrl}/account/${payload.accountId}`;

    let subject: string;
    let html: string;

    if (payload.type === 'health_drop') {
      subject = `Health Alert: ${payload.accountName}`;
      html = generateHealthDropEmail({
        accountName: payload.accountName,
        previousStatus: payload.details.previousStatus,
        newStatus: payload.details.newStatus,
        healthScore: payload.details.healthScore,
        accountUrl,
      });
    } else {
      subject = `Interaction Alert: ${payload.accountName}`;
      html = generateBadInteractionEmail({
        accountName: payload.accountName,
        interactionType: payload.details.interactionType,
        sentimentScore: payload.details.sentimentScore,
        churnRisk: payload.details.churnRisk,
        churnReasons: payload.details.churnReasons,
        summary: payload.details.summary,
        interactionDate: payload.details.interactionDate,
        accountUrl: `${accountUrl}?tab=interactions`,
      });
    }

    await sgMail.send({
      to: payload.csmEmail,
      from: process.env.SENDGRID_FROM_EMAIL || 'notifications@nekter.io',
      subject,
      html,
      text: `${subject} - View at ${accountUrl}`,
    });

    return true;
  } catch (error) {
    console.error('Error sending alert email:', error);
    return false;
  }
}

/**
 * Send alert via Slack DM
 */
async function sendAlertSlack(payload: AlertPayload): Promise<boolean> {
  try {
    // Check if user has Slack notifications enabled
    const userSettings = await getUserSlackSettings(payload.csmUserId);
    if (!userSettings?.slack_notifications_enabled) {
      return false;
    }

    // Get Slack installation
    const installation = await getSlackInstallation();
    if (!installation) {
      console.warn('No Slack installation found');
      return false;
    }

    // Get or look up user's Slack ID
    let slackUserId = userSettings.slack_user_id;
    if (!slackUserId) {
      slackUserId = await lookupSlackUserByEmail(installation.bot_token, payload.csmEmail);
      if (!slackUserId) {
        console.warn(`Could not find Slack user for email: ${payload.csmEmail}`);
        return false;
      }

      // Cache the Slack user ID
      await supabase
        .from('user_slack_settings')
        .update({ slack_user_id: slackUserId })
        .eq('user_id', payload.csmUserId);
    }

    // Build the Block Kit message based on alert type
    let blocks: any[];
    let text: string;

    if (payload.type === 'health_drop') {
      blocks = buildHealthDropSlackBlocks(payload);
      text = buildHealthDropSlackText(payload);
    } else {
      blocks = buildBadInteractionSlackBlocks(payload);
      text = buildBadInteractionSlackText(payload);
    }

    return await sendSlackDM(installation.bot_token, slackUserId, blocks, text);
  } catch (error) {
    console.error('Error sending alert via Slack:', error);
    return false;
  }
}

/**
 * Create in-app bell notification
 */
async function createAlertNotification(payload: AlertPayload): Promise<boolean> {
  try {
    let title: string;
    let message: string;
    let relatedEntityType: string;
    let relatedEntityId: string;

    if (payload.type === 'health_drop') {
      title = `Health dropped: ${payload.accountName}`;
      message = `${payload.details.previousStatus} → ${payload.details.newStatus}`;
      relatedEntityType = 'account';
      relatedEntityId = payload.accountId;
    } else {
      title = `Bad interaction: ${payload.accountName}`;
      const reasons: string[] = [];
      if (payload.details.churnRisk) reasons.push('Churn risk');
      if (payload.details.sentimentScore < 60) reasons.push(`Low sentiment (${payload.details.sentimentScore})`);
      message = reasons.join(' • ') || 'Review recommended';
      relatedEntityType = 'interaction';
      relatedEntityId = String(payload.details.interactionId);
    }

    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: payload.csmUserId,
        type: payload.type,
        title,
        message,
        related_entity_type: relatedEntityType,
        related_entity_id: relatedEntityId,
      });

    if (error) {
      console.error('Error creating notification:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error creating alert notification:', error);
    return false;
  }
}

// Re-export types
export * from './types';
export * from './settings';
