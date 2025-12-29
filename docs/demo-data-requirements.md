# Nekter Demo Data Requirements

## Overview
Generate realistic demo data for a Customer Success platform over a 365-day timeline, showing business transformation narratives before, during, and after implementing Nekter.

## Timeline Structure

**Total Duration:** 365 days (ending 2025-12-18)
- **Start Date:** 2023-12-19
- **End Date:** 2025-12-18

### Phases

1. **Phase 1 - Decline (Days 1-120):** 4 months of business problems
   - High support ticket frequency
   - Negative sentiment in communications
   - Declining health scores
   - Demonstrates pain points before Nekter

2. **Phase 2 - Implementation (Days 121-180):** 2 months of transition
   - **Day 150:** Nekter deployment (inflection point)
   - Learning curve and system adoption
   - Stabilizing metrics

3. **Phase 3 - Growth (Days 181-365):** 6 months of sustained success
   - Lower ticket frequency
   - Positive sentiment
   - Improving health scores
   - Proves long-term value and ROI

## Account Narratives

Generate data for **20 accounts** across 3 narrative types:

### 6 Recover Accounts
- Start healthy (health score ~75)
- Decline to critical (health score ~45) by day 120
- Stabilize during implementation (health score ~55)
- Recover strongly (health score ~85) by day 365
- ARR grows 30% after recovery

### 12 Stable Accounts
- Start healthy (health score ~75)
- Slight decline (health score ~58) by day 120
- Maintain stability during implementation
- Gradual improvement (health score ~75) by day 365
- ARR maintains baseline

### 2 Churn Accounts
- Start healthy (health score ~75)
- Steady decline throughout entire period
- End critical (health score ~20) by day 365
- ARR goes to zero (lost customer)

## Database Schema

### Core Tables

#### accounts
```sql
sf_account_id text PRIMARY KEY
name text NOT NULL
type text                    -- 'Customer' or 'Former Customer'
arr numeric
industry text
employee_count integer
owner_email text
owner_name text
owner_id text
csm_email text
csm_name text
csm_id text
last_activity_date date
created_at timestamp
updated_at timestamp
```

#### contacts
```sql
sf_contact_id text PRIMARY KEY
sf_account_id text REFERENCES accounts
first_name text
last_name text
email text
title text
customer_role text           -- 'Champion', 'Decision Maker', 'User'
left_company boolean
created_at timestamp
```

#### opportunities
```sql
sf_opp_id text PRIMARY KEY
sf_account_id text REFERENCES accounts
name text
type text                    -- 'New Business', 'Renewal', 'Expansion'
amount numeric
stage text
close_date date
is_closed boolean
is_won boolean
lost_reason text
created_at timestamp
```

#### call_transcripts
```sql
engagement_id text PRIMARY KEY
sf_account_id text REFERENCES accounts
engagement_type text
calendar_meeting_name text
duration double precision
transcript jsonb            -- { description: string }
participants jsonb          -- [{ name: string, role: string }]
metrics jsonb               -- { talk_ratio: number }
created_at timestamp
```

#### email_threads
```sql
engagement_id text PRIMARY KEY
sf_account_id text REFERENCES accounts
email_subject text
body text
sent_time timestamp
initiator_email text
participants jsonb          -- string[]
created_at timestamp
```

#### zendesk_tickets
```sql
zendesk_ticket_id bigint PRIMARY KEY
zendesk_org_id bigint
sf_account_id text REFERENCES accounts
subject text
description text
status text                 -- 'open', 'pending', 'solved', 'closed'
priority text              -- 'low', 'normal', 'high', 'urgent'
ticket_type text           -- 'question', 'incident', 'problem', 'task'
created_at timestamp
updated_at timestamp
```

#### zendesk_ticket_comments
```sql
comment_id bigint PRIMARY KEY
zendesk_ticket_id bigint REFERENCES zendesk_tickets
zendesk_org_id bigint
body text
is_public boolean
type text
created_at timestamp
```

#### interaction_insights
```sql
sf_account_id text REFERENCES accounts
interaction_type text       -- 'transcript', 'email', 'zendesk_comment'
source_id text             -- Links to engagement_id or comment_id
sentiment_score integer    -- 0-100
sentiment_reasons text[]
engagement_quality_score integer  -- 0-100
engagement_reasons text[]
churn_risk boolean
churn_reasons text[]
expansion_opportunity boolean
expansion_reasons text[]
insight_summary text
created_at timestamp
```

#### account_health_history
```sql
sf_account_id text REFERENCES accounts
health_score numeric       -- 0-100
health_status text         -- 'Healthy', 'At Risk', 'Critical'
trend text                 -- 'Improving', 'Stable', 'Declining'
created_at timestamp
```

## Metric Calculations

### Churn Risk
```
churnRiskPercent = ((criticalARR + atRiskARR) / totalARR) * 100
```
- Based on health status of accounts
- Critical: health_score < 50
- At Risk: 50 ≤ health_score < 70
- Healthy: health_score ≥ 70

### GRR (Gross Revenue Retention)
```
grr = 100 - (churnRiskPercent / 2)
```
- Clamped between 85% and 100%
- Inverse relationship with churn risk

## Data Generation Requirements

### Critical: AI-Generated Content Needed

**The key issue with script-based generation:** Repetitive, template-driven content that looks fake.

**What needs AI generation:**

1. **Email Content**
   - Real subject lines (not "Quick sync on next steps")
   - Actual email body content about specific business issues
   - Natural conversation flow
   - Phase-appropriate tone (frustrated → cautious → positive)

2. **Call Transcripts**
   - Realistic meeting descriptions
   - Actual discussion topics
   - Natural language, not "Discussed project status"
   - Phase-appropriate content

3. **Support Tickets**
   - Real problem descriptions
   - Specific technical issues
   - Natural support interactions
   - Realistic resolution notes

4. **Sentiment Analysis**
   - Varied sentiment reasons (not same 3-4 phrases)
   - Context-appropriate explanations
   - Natural language analysis

### Data Frequencies

- **Health Scores:** Every 3 days (122 records per account = 2,440 total)
- **Calls:**
  - Recover accounts: 1-2 per month = ~18 per account (108 total)
  - Stable accounts: 1 per month = ~12 per account (144 total)
  - Churn accounts: 2-3 per month = ~30 per account (60 total)
  - **Total: ~310 calls**
- **Emails:**
  - Recover accounts: 2-3 per month = ~30 per account (180 total)
  - Stable accounts: 1-2 per month = ~18 per account (216 total)
  - Churn accounts: 3-4 per month = ~42 per account (84 total)
  - **Total: ~480 emails**
- **Support Tickets:**
  - Recover accounts: ~9 per account over year (54 total)
    - Decline: 1/month, Implementation: 1/month, Growth: 1 every 2 months
  - Stable accounts: ~5 per account over year (60 total)
    - Decline: 1 every 2 months, Implementation: 1 total, Growth: 1 every 3 months
  - Churn accounts: ~30 per account over year (60 total)
    - Consistently 2-3/month throughout
  - **Total: ~175 tickets**
- **Ticket Comments:** 3-5 per ticket (average 4 = ~700 total)
  - Simple tickets: 2-3 comments (question → answer)
  - Complex tickets: 6-8 comments (extended back-and-forth)
- **Insights:** One per call/email/comment (~1,500 total)

### Phase-Based Patterns

**Decline Phase (Days 1-120):**
- High ticket frequency
- Urgent/high priority tickets
- Frustrated tone in emails
- Short, tense calls
- Negative sentiment (20-40 range)
- Low engagement (30-50 range)
- Declining health scores

**Implementation Phase (Days 121-180):**
- Medium ticket frequency
- Questions about new system
- Cautiously optimistic tone
- Training-focused calls
- Neutral sentiment (40-60 range)
- Medium engagement (50-70 range)
- Stabilizing health scores

**Growth Phase (Days 181-365):**
- Low ticket frequency
- Best practice questions
- Positive, collaborative tone
- Strategic planning calls
- Positive sentiment (70-90 range)
- High engagement (70-90 range)
- Improving health scores

## Sample Account Configuration

| Name | Narrative | Base ARR | Final ARR | Tier |
|------|-----------|----------|-----------|------|
| Acme Enterprise | Recover | $480K | $624K | Premium |
| GlobalTech Industries | Recover | $520K | $676K | Premium |
| DataFlow Systems | Recover | $380K | $494K | Standard |
| InnovateNow Corp | Recover | $280K | $364K | Standard |
| CloudScale Ventures | Recover | $220K | $286K | Standard |
| StartupBoost Inc | Recover | $120K | $156K | Basic |
| TechForward LLC | Stable | $340K | $340K | Standard |
| Digital Dynamics | Stable | $310K | $310K | Standard |
| NextGen Solutions | Stable | $260K | $260K | Standard |
| AgileWorks Tech | Stable | $230K | $230K | Basic |
| DevOps Pro | Stable | $200K | $200K | Basic |
| CodeCraft Studios | Stable | $180K | $180K | Basic |
| DataSmart Analytics | Stable | $160K | $160K | Basic |
| CloudOps Partners | Stable | $140K | $140K | Basic |
| InnovateLabs | Stable | $120K | $120K | Basic |
| ByteBuilder Co | Stable | $100K | $100K | Basic |
| AppForge Tech | Stable | $85K | $85K | Basic |
| TechLaunch | Stable | $70K | $70K | Basic |
| Legacy Systems Ltd | Churn | $250K | $0 | Standard |
| OldGuard Technologies | Churn | $180K | $0 | Basic |

## Output Format

Data should be generated as:
1. SQL INSERT statements, OR
2. CSV files per table, OR
3. TypeScript/JavaScript data generation scripts with realistic content

## Key Success Criteria

✅ Content looks realistic and varied (not templated)
✅ Narrative arcs are clear and believable
✅ Metrics calculated correctly from the data
✅ Relationships between tables are consistent
✅ Timeline progression makes logical sense
✅ Sentiment and engagement align with phase
✅ Account stories are cohesive and trackable

## Anti-Patterns to Avoid

❌ Template-based content ("Follow-up #1", "Quick sync")
❌ Repetitive sentiment reasons
❌ Generic email subjects
❌ Mechanical ticket descriptions
❌ Same phrases used thousands of times
❌ Content that doesn't match the phase/narrative
❌ Disconnected interactions that don't tell a story
