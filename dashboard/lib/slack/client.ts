import { WebClient } from '@slack/web-api';

// Create a Slack client with a specific bot token
export function createSlackClient(botToken: string): WebClient {
  return new WebClient(botToken);
}

// Environment variables for OAuth
export const slackConfig = {
  clientId: process.env.SLACK_CLIENT_ID || '',
  clientSecret: process.env.SLACK_CLIENT_SECRET || '',
  redirectUri: process.env.SLACK_REDIRECT_URI || '',
  scopes: ['users:read.email', 'chat:write', 'im:write'].join(','),
};

// Check if Slack is configured
export function isSlackConfigured(): boolean {
  return !!(slackConfig.clientId && slackConfig.clientSecret && slackConfig.redirectUri);
}
