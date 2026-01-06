# Health Drop & Bad Interaction Alerts

## Overview

Real-time notifications for CSMs when their accounts experience health drops or bad interactions, delivered via email, Slack, and in-app bell.

## Requirements

- **Health Drops**: Notify when account status downgrades (Healthy → At Risk, or At Risk → Critical)
- **Bad Interactions**: Notify when `churn_risk = true` OR `sentiment_score < 60`
- **Recipient**: Assigned CSM only
- **Timing**: Real-time (on data insert)
- **Channels**: Email, Slack, Bell - each independently toggleable per event type

## Design

### 1. Database Schema

New table for user alert preferences:

```sql
CREATE TABLE user_alert_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('health_drop', 'bad_interaction')),
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  slack_enabled BOOLEAN NOT NULL DEFAULT true,
  bell_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, alert_type)
);

-- RLS policies
ALTER TABLE user_alert_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own alert settings"
  ON user_alert_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own alert settings"
  ON user_alert_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own alert settings"
  ON user_alert_settings FOR UPDATE
  USING (auth.uid() = user_id);
```

### 2. Notification Types

Add to existing notification type system:

```typescript
type AlertNotificationType =
  | 'health_drop'      // Account health status downgraded
  | 'bad_interaction'; // Churn risk or low sentiment detected
```

### 3. Detection Logic

#### Health Drops
Hook into wherever `account_health_history` is updated. Compare new status to previous status:
- If previous was 'Healthy' and new is 'At Risk' → trigger
- If previous was 'At Risk' and new is 'Critical' → trigger

#### Bad Interactions
Hook into wherever `interaction_insights` rows are inserted. Check:
- `churn_risk === true` → trigger
- `sentiment_score < 60` → trigger

### 4. Alert Service

New unified service at `/lib/alerts/index.ts`:

```typescript
interface AlertPayload {
  type: 'health_drop' | 'bad_interaction';
  accountId: string;
  accountName: string;
  csmUserId: string;
  csmEmail: string;
  details: HealthDropDetails | BadInteractionDetails;
}

interface HealthDropDetails {
  previousStatus: HealthStatus;
  newStatus: HealthStatus;
  healthScore: number;
}

interface BadInteractionDetails {
  interactionType: string;
  sentimentScore: number;
  churnRisk: boolean;
  churnReasons: string[];
  summary: string;
  interactionDate: string;
}

async function sendAlert(payload: AlertPayload): Promise<void> {
  const settings = await getUserAlertSettings(payload.csmUserId, payload.type);

  // Default to all enabled if no settings exist
  const emailEnabled = settings?.email_enabled ?? true;
  const slackEnabled = settings?.slack_enabled ?? true;
  const bellEnabled = settings?.bell_enabled ?? true;

  await Promise.all([
    emailEnabled && sendAlertEmail(payload),
    slackEnabled && sendAlertSlack(payload),
    bellEnabled && createAlertNotification(payload),
  ]);
}
```

### 5. Email Templates

Two new templates in `/lib/email/templates/`:

#### health-drop.ts
- Header: "Health Alert: {Account Name}"
- Body: Status badge transition (e.g., "Healthy → At Risk")
- Health score display
- CTA button: "View Account"

#### bad-interaction.ts
- Header: "Interaction Alert: {Account Name}"
- Body: Interaction type, date, sentiment score
- Churn risk reasons if applicable
- Summary excerpt
- CTA button: "View Interaction"

### 6. Slack Block Kit Messages

Two new message builders in `/lib/slack/`:

#### Health Drop Message
```
🔴 Health Drop Alert
━━━━━━━━━━━━━━━━━━━
Account: Acme Corp
Status Change: Healthy → At Risk
Health Score: 45

[View Account]
```

#### Bad Interaction Message
```
⚠️ Bad Interaction Detected
━━━━━━━━━━━━━━━━━━━━━━━━━
Account: Acme Corp
Type: Call | Jan 6, 2026
Sentiment: 42/100
Churn Risk: Yes
• Mentioned competitor pricing
• Expressed frustration with support

[View Account]
```

### 7. Bell Notifications

New notification records in existing `notifications` table:
- `type`: 'health_drop' or 'bad_interaction'
- `title`: Alert summary
- `message`: Brief details
- `link`: Deep link to account page (interactions tab for bad interactions)

### 8. Settings UI

Add "Alerts" card to `/settings` page below existing Slack section:

```
┌─────────────────────────────────────────┐
│ Alert Notifications                      │
├─────────────────────────────────────────┤
│ Health Drop Alerts                       │
│ When an account's health status drops    │
│ ☑ Email  ☑ Slack  ☑ Bell               │
├─────────────────────────────────────────┤
│ Bad Interaction Alerts                   │
│ Churn risk or low sentiment detected     │
│ ☑ Email  ☑ Slack  ☑ Bell               │
└─────────────────────────────────────────┘
```

### 9. API Endpoints

#### GET /api/settings/alerts
Returns user's alert settings (both types)

#### PUT /api/settings/alerts
Updates alert settings for a specific type

```typescript
// Request body
{
  alertType: 'health_drop' | 'bad_interaction',
  emailEnabled: boolean,
  slackEnabled: boolean,
  bellEnabled: boolean
}
```

## Implementation Steps

1. **Database Migration** - Create `user_alert_settings` table with RLS
2. **Alert Service** - Core `sendAlert()` function and settings queries
3. **Email Templates** - Health drop and bad interaction templates
4. **Slack Messages** - Block Kit builders for both alert types
5. **Bell Notifications** - Create notification records
6. **API Endpoints** - GET/PUT for alert settings
7. **Settings UI** - Alert preferences card with toggles
8. **Hook into Data Flow** - Connect detection logic to alert service
9. **Testing** - End-to-end test of all channels

## File Structure

```
/lib/
  /alerts/
    index.ts          # Main sendAlert service
    types.ts          # Alert type definitions
    settings.ts       # User settings queries
  /email/templates/
    health-drop.ts    # Email template
    bad-interaction.ts
  /slack/
    health-drop.ts    # Slack Block Kit builder
    bad-interaction.ts

/app/api/
  /settings/alerts/
    route.ts          # GET/PUT alert settings
  /webhooks/alert-trigger/
    route.ts          # Webhook for external data sync

/app/settings/
  page.tsx            # Add AlertSettings component

/components/settings/
  AlertSettings.tsx   # New component

/supabase/migrations/
  009_create_alert_settings.sql
```

## Webhook Integration

Since `interaction_insights` and `account_health_history` data is inserted by external systems, a webhook endpoint is provided:

### POST /api/webhooks/alert-trigger

Called by external data sync services when new data is inserted.

**Headers:**
- `x-webhook-secret`: Matches `ALERT_WEBHOOK_SECRET` env var

**Health Drop Payload:**
```json
{
  "type": "health_drop",
  "sf_account_id": "001ABC123",
  "health_status": "At Risk",
  "health_score": 45
}
```

**Bad Interaction Payload:**
```json
{
  "type": "bad_interaction",
  "sf_account_id": "001ABC123",
  "interaction_id": 12345,
  "interaction_type": "transcript",
  "sentiment_score": 42,
  "churn_risk": true,
  "churn_reasons": ["Mentioned competitor pricing"],
  "insight_summary": "Customer expressed frustration...",
  "created_at": "2026-01-06T10:30:00Z"
}
```

**Environment Variables:**
- `ALERT_WEBHOOK_SECRET`: Secret for webhook authentication (optional in dev)
