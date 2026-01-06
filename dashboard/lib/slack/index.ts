import { createSlackClient } from './client';
import { createClient } from '@supabase/supabase-js';

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

interface SlackInstallation {
  id: string;
  slack_team_id: string;
  slack_team_name: string | null;
  bot_token: string;
  bot_user_id: string | null;
}

interface UserSlackSettings {
  user_id: string;
  slack_notifications_enabled: boolean;
  slack_user_id: string | null;
  slack_team_id: string | null;
}

// Get the Slack installation (for now, just get the first one)
export async function getSlackInstallation(): Promise<SlackInstallation | null> {
  const { data, error } = await supabase
    .from('slack_installations')
    .select('*')
    .limit(1)
    .single();

  if (error || !data) {
    return null;
  }

  return data as SlackInstallation;
}

// Get user's Slack settings
export async function getUserSlackSettings(userId: string): Promise<UserSlackSettings | null> {
  const { data, error } = await supabase
    .from('user_slack_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return null;
  }

  return data as UserSlackSettings;
}

// Look up a Slack user by email
export async function lookupSlackUserByEmail(
  botToken: string,
  email: string
): Promise<string | null> {
  try {
    const client = createSlackClient(botToken);
    const result = await client.users.lookupByEmail({ email });

    if (result.ok && result.user) {
      return result.user.id || null;
    }
    return null;
  } catch (error) {
    console.error('Error looking up Slack user by email:', error);
    return null;
  }
}

// Send a DM to a Slack user
export async function sendSlackDM(
  botToken: string,
  slackUserId: string,
  blocks: any[],
  text: string // Fallback text for notifications
): Promise<boolean> {
  try {
    const client = createSlackClient(botToken);

    // Open a DM channel with the user
    const conversation = await client.conversations.open({
      users: slackUserId,
    });

    if (!conversation.ok || !conversation.channel?.id) {
      console.error('Failed to open DM channel');
      return false;
    }

    // Send the message
    const result = await client.chat.postMessage({
      channel: conversation.channel.id,
      blocks,
      text, // Fallback for notifications
    });

    return result.ok || false;
  } catch (error) {
    console.error('Error sending Slack DM:', error);
    return false;
  }
}

// Send task notification via Slack
export async function sendTaskSlackNotification(
  userId: string,
  userEmail: string,
  notification: {
    type: 'task_assigned' | 'task_reassigned' | 'reminder_3d' | 'reminder_1d' | 'overdue';
    taskTitle: string;
    taskId: string;
    assignerName?: string;
    accountName?: string;
    priority?: string;
    dueDate?: string;
  }
): Promise<boolean> {
  try {
    // Check if user has Slack notifications enabled
    const userSettings = await getUserSlackSettings(userId);
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
      slackUserId = await lookupSlackUserByEmail(installation.bot_token, userEmail);
      if (!slackUserId) {
        console.warn(`Could not find Slack user for email: ${userEmail}`);
        return false;
      }

      // Cache the Slack user ID
      await supabase
        .from('user_slack_settings')
        .update({ slack_user_id: slackUserId })
        .eq('user_id', userId);
    }

    // Build the Block Kit message
    const blocks = buildTaskNotificationBlocks(notification);
    const text = buildTaskNotificationText(notification);

    return await sendSlackDM(installation.bot_token, slackUserId, blocks, text);
  } catch (error) {
    console.error('Error sending task Slack notification:', error);
    return false;
  }
}

// Build Block Kit blocks for task notification
function buildTaskNotificationBlocks(notification: {
  type: 'task_assigned' | 'task_reassigned' | 'reminder_3d' | 'reminder_1d' | 'overdue';
  taskTitle: string;
  taskId: string;
  assignerName?: string;
  accountName?: string;
  priority?: string;
  dueDate?: string;
}): any[] {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nekter.io';
  const taskUrl = `${appUrl}/tasks?taskId=${notification.taskId}`;

  // Determine header and color based on type
  let header: string;
  let emoji: string;

  switch (notification.type) {
    case 'task_assigned':
      header = notification.assignerName
        ? `${notification.assignerName} assigned you a task`
        : 'New task assigned to you';
      emoji = ':clipboard:';
      break;
    case 'task_reassigned':
      header = notification.assignerName
        ? `${notification.assignerName} reassigned a task to you`
        : 'Task reassigned to you';
      emoji = ':arrows_counterclockwise:';
      break;
    case 'reminder_3d':
      header = 'Task due in 3 days';
      emoji = ':calendar:';
      break;
    case 'reminder_1d':
      header = 'Task due tomorrow';
      emoji = ':warning:';
      break;
    case 'overdue':
      header = 'Task is overdue';
      emoji = ':rotating_light:';
      break;
  }

  const blocks: any[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `${emoji} ${header}`,
        emoji: true,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${notification.taskTitle}*`,
      },
    },
  ];

  // Add details section
  const details: string[] = [];
  if (notification.accountName) {
    details.push(`:office: *Account:* ${notification.accountName}`);
  }
  if (notification.priority) {
    const priorityEmoji = notification.priority === 'high' ? ':red_circle:'
      : notification.priority === 'medium' ? ':large_yellow_circle:'
      : ':white_circle:';
    details.push(`${priorityEmoji} *Priority:* ${notification.priority}`);
  }
  if (notification.dueDate) {
    details.push(`:calendar: *Due:* ${notification.dueDate}`);
  }

  if (details.length > 0) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: details.join('\n'),
      },
    });
  }

  // Add action button
  blocks.push({
    type: 'actions',
    elements: [
      {
        type: 'button',
        text: {
          type: 'plain_text',
          text: 'View Task',
          emoji: true,
        },
        url: taskUrl,
        style: 'primary',
      },
    ],
  });

  return blocks;
}

// Build fallback text for notifications
function buildTaskNotificationText(notification: {
  type: 'task_assigned' | 'task_reassigned' | 'reminder_3d' | 'reminder_1d' | 'overdue';
  taskTitle: string;
  assignerName?: string;
}): string {
  switch (notification.type) {
    case 'task_assigned':
      return notification.assignerName
        ? `${notification.assignerName} assigned you a task: ${notification.taskTitle}`
        : `New task assigned: ${notification.taskTitle}`;
    case 'task_reassigned':
      return notification.assignerName
        ? `${notification.assignerName} reassigned a task to you: ${notification.taskTitle}`
        : `Task reassigned to you: ${notification.taskTitle}`;
    case 'reminder_3d':
      return `Task due in 3 days: ${notification.taskTitle}`;
    case 'reminder_1d':
      return `Task due tomorrow: ${notification.taskTitle}`;
    case 'overdue':
      return `Task is overdue: ${notification.taskTitle}`;
  }
}
