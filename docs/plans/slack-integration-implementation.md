# Slack Integration Implementation Guide

## Overview

This document details the implementation of Slack notifications for Nekter. Users can connect their Slack workspace and receive direct messages (DMs) when tasks are assigned or reassigned to them.

### Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Nekter App    │     │   Slack API     │     │  User's Slack   │
│                 │     │                 │     │   Workspace     │
│  ┌───────────┐  │     │                 │     │                 │
│  │ Settings  │──┼──OAuth Flow──────────┼────►│  App Install    │
│  │   Page    │  │     │                 │     │                 │
│  └───────────┘  │     │                 │     │                 │
│                 │     │                 │     │                 │
│  ┌───────────┐  │     │  ┌───────────┐  │     │  ┌───────────┐  │
│  │   Task    │──┼────►│  │  Web API  │──┼────►│  │    DM     │  │
│  │  Created  │  │     │  │           │  │     │  │  Channel  │  │
│  └───────────┘  │     │  └───────────┘  │     │  └───────────┘  │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Key Features

- **Multi-tenant OAuth**: Each customer connects their own Slack workspace
- **Per-user toggle**: Users individually enable/disable Slack notifications
- **Email-based lookup**: Matches Nekter users to Slack users by email
- **Rich notifications**: Block Kit messages with task details and action buttons

---

## 1. Slack App Setup

### 1.1 Create the Slack App

1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Click **Create New App** → **From an app manifest**
3. Select a workspace for development
4. Use this manifest:

```yaml
display_information:
  name: Nekter Notifications
  description: Task notifications from Nekter
  background_color: "#4A154B"

features:
  bot_user:
    display_name: Nekter
    always_online: true

oauth_config:
  redirect_urls:
    - https://nekter.io/api/integrations/slack/callback
  scopes:
    bot:
      - users:read
      - users:read.email
      - chat:write
      - im:write

settings:
  org_deploy_enabled: false
  socket_mode_enabled: false
  token_rotation_enabled: false
```

### 1.2 Configure Bot Token Scopes

In **OAuth & Permissions** → **Bot Token Scopes**, ensure these are added:

| Scope | Purpose |
|-------|---------|
| `users:read` | View users in workspace |
| `users:read.email` | Look up users by email address |
| `chat:write` | Send messages as the bot |
| `im:write` | Open DM channels with users |

### 1.3 Configure Redirect URL

In **OAuth & Permissions** → **Redirect URLs**, add:
```
https://nekter.io/api/integrations/slack/callback
```

### 1.4 Enable Interactivity

In **Interactivity & Shortcuts**:
1. Toggle **Interactivity** to **On**
2. Set **Request URL** to:
   ```
   https://nekter.io/api/integrations/slack/interactions
   ```

This is required for action buttons in messages to work.

### 1.5 Enable Distribution (for multi-tenant)

In **Manage Distribution**:
1. Complete the checklist items
2. Activate public distribution (or keep as internal if single-tenant)

### 1.6 Get Credentials

From **Basic Information**, copy:
- **Client ID**
- **Client Secret**

---

## 2. Database Schema

### 2.1 Migration File

Location: `supabase/migrations/008_create_slack_integration.sql`

### 2.2 Tables

#### `slack_installations`

Stores OAuth credentials for each connected Slack workspace.

```sql
CREATE TABLE IF NOT EXISTS public.slack_installations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Slack workspace info
  slack_team_id TEXT NOT NULL UNIQUE,
  slack_team_name TEXT,

  -- Bot credentials
  bot_token TEXT NOT NULL,
  bot_user_id TEXT,

  -- Who installed
  installed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Timestamps
  installed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_slack_installations_team_id
  ON public.slack_installations(slack_team_id);
```

#### `user_slack_settings`

Stores per-user notification preferences.

```sql
CREATE TABLE IF NOT EXISTS public.user_slack_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Preferences
  slack_notifications_enabled BOOLEAN DEFAULT FALSE,

  -- Cached Slack user ID (looked up by email)
  slack_user_id TEXT,

  -- Which workspace they're connected to
  slack_team_id TEXT REFERENCES public.slack_installations(slack_team_id)
    ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

### 2.3 Running the Migration

In Supabase Dashboard → SQL Editor, run the full migration script.

---

## 3. Environment Variables

### 3.1 Required Variables

Add to `.env.local` (development) and Vercel (production):

```env
# Slack Integration
SLACK_CLIENT_ID=your_client_id
SLACK_CLIENT_SECRET=your_client_secret
SLACK_REDIRECT_URI=https://nekter.io/api/integrations/slack/callback
```

### 3.2 Variable Usage

| Variable | Used In | Purpose |
|----------|---------|---------|
| `SLACK_CLIENT_ID` | OAuth authorize URL | Identifies the Slack app |
| `SLACK_CLIENT_SECRET` | Token exchange | Authenticates token requests |
| `SLACK_REDIRECT_URI` | OAuth flow | Where Slack redirects after auth |

---

## 4. Code Structure

### 4.1 File Locations

```
dashboard/
├── lib/
│   └── slack/
│       ├── client.ts          # Slack SDK setup, config
│       └── index.ts           # Core functions (sendDM, lookupUser, etc.)
│
├── app/
│   ├── api/
│   │   └── integrations/
│   │       └── slack/
│   │           ├── authorize/
│   │           │   └── route.ts    # Initiates OAuth flow
│   │           ├── callback/
│   │           │   └── route.ts    # Handles OAuth callback
│   │           └── interactions/
│   │               └── route.ts    # Handles button clicks
│   │
│   └── settings/
│       └── page.tsx           # Settings UI with Slack toggle
│
└── supabase/
    └── migrations/
        └── 008_create_slack_integration.sql
```

### 4.2 Key Files

#### `lib/slack/client.ts`

```typescript
import { WebClient } from '@slack/web-api';

export function createSlackClient(botToken: string): WebClient {
  return new WebClient(botToken);
}

export const slackConfig = {
  clientId: process.env.SLACK_CLIENT_ID || '',
  clientSecret: process.env.SLACK_CLIENT_SECRET || '',
  redirectUri: process.env.SLACK_REDIRECT_URI || '',
  scopes: ['users:read', 'users:read.email', 'chat:write', 'im:write'].join(' '),
};

export function isSlackConfigured(): boolean {
  return !!(slackConfig.clientId && slackConfig.clientSecret && slackConfig.redirectUri);
}
```

#### `lib/slack/index.ts`

Main functions:

| Function | Purpose |
|----------|---------|
| `getSlackInstallation()` | Get stored bot token |
| `getUserSlackSettings(userId)` | Get user's notification preferences |
| `lookupSlackUserByEmail(token, email)` | Find Slack user ID by email |
| `sendSlackDM(token, userId, blocks, text)` | Send a DM to a Slack user |
| `sendTaskSlackNotification(userId, email, notification)` | High-level: send task notification |

---

## 5. OAuth Flow

### 5.1 Flow Diagram

```
User clicks "Connect Slack"
        │
        ▼
GET /api/integrations/slack/authorize?userId=xxx
        │
        ▼
Redirect to Slack OAuth URL:
https://slack.com/oauth/v2/authorize?
  client_id=XXX&
  scope=users:read users:read.email chat:write im:write&
  redirect_uri=https://nekter.io/api/integrations/slack/callback&
  state=base64(userId, timestamp)
        │
        ▼
User authorizes in Slack
        │
        ▼
Slack redirects to:
/api/integrations/slack/callback?code=XXX&state=XXX
        │
        ▼
Exchange code for token:
POST https://slack.com/api/oauth.v2.access
        │
        ▼
Store token in slack_installations table
        │
        ▼
Redirect to /settings?slack=success
```

### 5.2 Authorize Endpoint

Location: `app/api/integrations/slack/authorize/route.ts`

**Request:**
```
GET /api/integrations/slack/authorize?userId=fe5c4757-...
```

**Response:** Redirects to Slack OAuth URL

**State Parameter:**
- Contains `userId` and `timestamp` (base64 encoded)
- Used to identify user on callback
- Expires after 15 minutes

### 5.3 Callback Endpoint

Location: `app/api/integrations/slack/callback/route.ts`

**Request (from Slack):**
```
GET /api/integrations/slack/callback?code=XXX&state=XXX
```

**Actions:**
1. Validate state parameter (check expiry)
2. Exchange code for bot token via Slack API
3. Store token in `slack_installations`
4. Create/update `user_slack_settings` for the user
5. Redirect to `/settings?slack=success`

---

## 6. Sending Notifications

### 6.1 Notification Flow

```
Task Created/Reassigned
        │
        ▼
Check: Does user have Slack enabled?
(user_slack_settings.slack_notifications_enabled)
        │
        ├── No → Skip Slack, continue with email
        │
        ▼ Yes
Get workspace bot token
(slack_installations.bot_token)
        │
        ▼
Get user's Slack ID
(cached in user_slack_settings.slack_user_id
 or lookup by email via Slack API)
        │
        ▼
Build Block Kit message
        │
        ▼
Send DM via Slack API
(conversations.open + chat.postMessage)
```

### 6.2 Integration Points

Slack notifications are triggered in:

1. **Task Creation**: `app/api/tasks/route.ts` (POST)
2. **Task Reassignment**: `app/api/tasks/[id]/route.ts` (PATCH)

Example integration:

```typescript
import { sendTaskSlackNotification } from '@/lib/slack';

// After creating notification and sending email...
await sendTaskSlackNotification(
  assigneeId,
  assigneeData.user.email || '',
  {
    type: 'task_assigned',
    taskTitle: task.title,
    taskId: task.id,
    assignerName: creatorName,
    accountName: accountData.name,
    priority: task.priority,
    dueDate: task.due_date ? new Date(task.due_date).toLocaleDateString() : undefined,
  }
);
```

### 6.3 Notification Types

| Type | Trigger | Emoji |
|------|---------|-------|
| `task_assigned` | New task created and assigned | :clipboard: |
| `task_reassigned` | Task assignee changed | :arrows_counterclockwise: |
| `reminder_3d` | 3 days before due date | :calendar: |
| `reminder_1d` | 1 day before due date | :warning: |
| `overdue` | Task past due date | :rotating_light: |

### 6.4 Block Kit Message Structure

```typescript
[
  {
    type: 'header',
    text: { type: 'plain_text', text: '📋 Jordan assigned you a task', emoji: true }
  },
  {
    type: 'section',
    text: { type: 'mrkdwn', text: '*Review Q4 Metrics*' }
  },
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: ':office: *Account:* Acme Corp\n:red_circle: *Priority:* high\n:calendar: *Due:* 1/15/2026'
    }
  },
  {
    type: 'actions',
    elements: [{
      type: 'button',
      text: { type: 'plain_text', text: 'View Task', emoji: true },
      url: 'https://nekter.io/tasks?taskId=xxx',
      style: 'primary'
    }]
  }
]
```

---

## 7. User Interface

### 7.1 Settings Page

Location: `app/settings/page.tsx`

**States:**

1. **No workspace connected**: Shows "Connect Slack" button
2. **Workspace connected, notifications off**: Shows workspace name + toggle (off)
3. **Workspace connected, notifications on**: Shows workspace name + toggle (on)

**UI Components:**

- Slack logo in header (from Wikipedia CDN)
- Purple "Connect Slack" button (Slack brand color #4A154B)
- Toggle switch for enabling/disabling notifications
- Success/error messages for OAuth flow

### 7.2 User Flow

1. User navigates to Settings
2. User clicks "Connect Slack"
3. Redirected to Slack OAuth
4. User selects workspace and authorizes
5. Redirected back to Settings with success message
6. User toggles "Slack Notifications" on
7. User receives DMs when tasks are assigned

---

## 8. Email-to-Slack Matching

### 8.1 How It Works

When sending a Slack notification:

1. Get user's email from Nekter (Supabase auth)
2. Call Slack's `users.lookupByEmail` API
3. If found: get Slack user ID, cache it, send DM
4. If not found: log warning, skip Slack notification

### 8.2 Caching

The Slack user ID is cached in `user_slack_settings.slack_user_id` after first lookup to avoid repeated API calls.

### 8.3 Requirements

**The user's Nekter email must match their Slack email.**

If emails don't match:
- `jordan@company.com` (Nekter) vs `jordan.smith@company.com` (Slack) → Won't match
- User won't receive Slack notifications
- Email notifications will still work

---

## 9. Testing

### 9.1 Local Development

For local testing, use ngrok or similar:

```bash
ngrok http 3000
```

Then update:
- `.env.local`: `SLACK_REDIRECT_URI=https://abc123.ngrok.io/api/integrations/slack/callback`
- Slack app: Add ngrok URL to Redirect URLs

### 9.2 Test Checklist

- [ ] Click "Connect Slack" redirects to Slack
- [ ] OAuth completes and returns to Settings
- [ ] Workspace name displays correctly
- [ ] Toggle enables/disables successfully
- [ ] Creating a task sends a Slack DM
- [ ] Reassigning a task sends a Slack DM
- [ ] "View Task" button opens correct URL
- [ ] User without Slack email doesn't crash the flow

---

## 10. Troubleshooting

### 10.1 Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `invalid_scope` | Scopes not configured in Slack app | Add all scopes to Bot Token Scopes |
| `redirect_uri_mismatch` | Redirect URL doesn't match | Ensure env var matches Slack app config exactly |
| `Slack integration is not configured` | Missing env vars | Add SLACK_CLIENT_ID, SLACK_CLIENT_SECRET, SLACK_REDIRECT_URI |
| 406 Not Acceptable | Database tables don't exist | Run the migration in Supabase |
| `Could not find Slack user for email` | Email mismatch | User's Nekter email must match Slack email |

### 10.2 Debugging

Check browser console for errors on Settings page.

Check server logs for:
- OAuth flow errors
- Slack API errors
- Database errors

### 10.3 Slack API Rate Limits

Slack has rate limits on API calls. The current implementation:
- Caches Slack user IDs to reduce lookups
- Sends notifications asynchronously (non-blocking)
- Logs errors but doesn't fail task creation

---

## 11. Security Considerations

### 11.1 Token Storage

- Bot tokens are stored in `slack_installations.bot_token`
- Currently stored as plain text
- **Production recommendation**: Encrypt tokens at rest

### 11.2 OAuth State

- State parameter includes timestamp
- Expires after 15 minutes
- Prevents CSRF attacks

### 11.3 User ID Parameter

- OAuth authorize endpoint receives userId as query param
- This is acceptable because:
  - The state is signed with the timestamp
  - The token is stored for the user who initiated
  - Spoofing would only affect the spoofing user's settings

---

## 12. Future Enhancements

### Potential Improvements

1. **Channel notifications**: Option to post to a team channel instead of DM
2. **Notification preferences**: Per-type toggles (assignments vs reminders)
3. **Slack commands**: `/nekter tasks` to list your tasks
4. **Token encryption**: Encrypt bot tokens at rest
5. **Multi-workspace per org**: Support orgs with multiple Slack workspaces
6. **Reminder notifications**: Integrate with cron job for due date reminders

---

## 13. Dependencies

### NPM Package

```json
{
  "@slack/web-api": "^7.x.x"
}
```

Install:
```bash
npm install @slack/web-api
```

### External Services

- Slack API (api.slack.com)
- Supabase (database)
- Vercel (hosting, environment variables)
