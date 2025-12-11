# CS Command Center Dashboard - Design Document

**Date:** December 10, 2025
**Author:** Design Session with Claude
**Status:** Approved - Ready for Implementation

---

## Executive Summary

Building a Customer Success Command Center dashboard that helps CSMs prioritize their day by surfacing accounts needing attention, combining AI-generated health scores with real-time activity metrics.

**MVP Focus:** Priority accounts list with expandable details, delivering immediate value while keeping scope manageable.

**Tech Stack:** Next.js 14, TypeScript, Supabase, shadcn/ui, Tailwind CSS, TanStack Query, Recharts, Zustand, Zod, date-fns, Lucide React, Vercel

**Timeline:** Phase 1 MVP (Weeks 1-2), Enhanced features (Weeks 3-4), Advanced features (Weeks 5-6)

---

## Table of Contents

1. [Architecture & Tech Stack](#1-architecture--tech-stack)
2. [MVP Feature Set](#2-mvp-feature-set)
3. [Data Model & Queries](#3-data-model--queries)
4. [Real-Time Metrics](#4-real-time-metrics)
5. [AI Integration](#5-ai-integration)
6. [Component Structure](#6-component-structure)
7. [State Management](#7-state-management)
8. [Error Handling](#8-error-handling)
9. [Future Phases](#9-future-phases)

---

## 1. Architecture & Tech Stack

### High-Level Architecture

```
┌─────────────────┐
│   Next.js 14    │ ← React Server Components + Client Components
│   TypeScript    │
└────────┬────────┘
         │
    ┌────┴─────┐
    ↓          ↓
┌─────────┐ ┌──────────┐
│Supabase │ │ Vercel   │
│(Data +  │ │(Hosting) │
│Auth)    │ └──────────┘
└─────────┘
```

### Tech Stack Rationale

- **Next.js 14 App Router**: Server-side rendering for fast initial loads, React Server Components for data fetching close to database
- **Supabase**: PostgreSQL database + eventual auth with Row Level Security (RLS) for multi-tenancy
- **TanStack Query**: Client-side caching, background refetching, optimistic updates
- **Zustand**: Lightweight global state for UI (filters, selected account, etc.)
- **shadcn/ui + Tailwind**: Rapid UI development with accessible components
- **Recharts**: Charts for health score trends, portfolio analytics
- **Zod**: Type-safe validation for API responses and form inputs

### Data Flow

1. Overnight batch process updates Supabase tables (external process)
2. Next.js Server Components fetch data directly from Supabase
3. Client components use TanStack Query for interactive updates
4. Zustand manages UI state (selected filters, expanded accounts)

---

## 2. MVP Feature Set

### Scope

**Single Page Dashboard with:**

```
/dashboard
├── Header (logo, search, user profile)
├── Stats Bar (4 metric cards)
│   ├── Healthy Accounts (count + ARR)
│   ├── At Risk (count + ARR)
│   ├── Critical (count + ARR)
│   └── Renewals in 90 Days (count + ARR)
└── Priority Accounts List (8-12 accounts)
    └── Expandable Account Cards
```

### Priority Accounts List Features

- **Ranked by urgency** - Algorithm combines health score drop, renewal proximity, critical insights
- **Visual health indicators** - Red/yellow/green status dots with pulse animation
- **Key metrics per account**:
  - Account name + ARR
  - Current health score + 7-day trend (↓ 15pts)
  - Most critical insight preview
  - Days until renewal (if < 90 days)
- **Expandable details** - Click to expand inline:
  - All AI insights with confidence scores
  - Health score trend mini-chart (30 days)
  - Recent activity summary (calls, emails, tickets)
  - Action buttons: "Open in Salesforce", "View Zendesk Tickets"

### Out of Scope for MVP

- Portfolio/Analytics tabs (Phase 2)
- Dedicated account detail page (Phase 2)
- Inline actions like "Mark as contacted" (Phase 2)
- Real-time updates (Phase 2)
- Multi-user permissions UI (Phase 2, but design data model for it)

### Success Criteria

CSM opens dashboard → sees 8-12 priority accounts → understands why each needs attention → takes action in < 2 minutes

---

## 3. Data Model & Queries

### Primary Tables (Existing Supabase Schema)

**Core Tables:**
- `accounts` - Customer accounts with ARR, CSM assignments, activity tracking
- `account_ai_scores` - AI-generated scores (sentiment, churn risk, expansion, engagement, champion strength)
- `account_insights` - AI-generated text insights with confidence scores
- `call_transcripts` - Sales call recordings with transcripts and metrics
- `email_threads` - Email communications
- `contacts` - Stakeholder information
- `opportunities` - Pipeline and renewals
- `zendesk_tickets` + `zendesk_ticket_comments` - Support data
- `zendesk_org_mapping` - Maps Zendesk orgs to SF accounts

### Priority Score Algorithm

```typescript
priority_score =
  // AI Scores (70% of weight) - Strategic view
  churn_risk_score * 1.5
  + (100 - sentiment_score) * 1.0
  + (100 - engagement_quality_score) * 0.8
  + (100 - champion_strength_score) * 1.2

  // Real-Time Metrics (30% of weight) - Tactical adjustments
  + (no_contact_60d ? 40 : 0)
  + (high_priority_tickets * 10)
  + (champion_left ? 50 : 0)
  + (ticket_spike ? 35 : 0)
  + (days_until_renewal < 90 ? 50 : 0)
  + (stalled_opportunities > 0 ? 25 : 0)
```

### Main Dashboard Query

```sql
WITH account_metrics AS (
  SELECT
    a.sf_account_id,

    -- Call metrics
    COUNT(DISTINCT c.id) FILTER (WHERE c.created_at >= NOW() - INTERVAL '30 days') as calls_last_30d,
    DATE_PART('day', NOW() - MAX(c.created_at)) as days_since_last_call,

    -- Email metrics
    COUNT(DISTINCT e.id) FILTER (WHERE e.sent_time >= NOW() - INTERVAL '30 days') as emails_last_30d,
    DATE_PART('day', NOW() - MAX(e.sent_time)) as days_since_last_email,

    -- Ticket metrics
    COUNT(DISTINCT t.id) FILTER (WHERE t.status NOT IN ('solved', 'closed')) as open_tickets_count,
    COUNT(DISTINCT t.id) FILTER (WHERE t.priority IN ('high', 'urgent')
      AND t.status NOT IN ('solved', 'closed')) as high_priority_tickets,
    AVG(COUNT(t.id)) OVER (PARTITION BY a.sf_account_id) as avg_tickets_30d,

    -- Contact metrics
    COUNT(DISTINCT ct.id) as total_contacts,
    COUNT(DISTINCT ct.id) FILTER (WHERE ct.is_active_user = true) as active_contacts,
    COUNT(DISTINCT ct.id) FILTER (WHERE ct.left_company = true) as contacts_left

  FROM accounts a
  LEFT JOIN call_transcripts c ON a.sf_account_id = c.sf_account_id
  LEFT JOIN email_threads e ON a.sf_account_id = e.sf_account_id
  LEFT JOIN zendesk_tickets t ON a.sf_account_id = t.sf_account_id
  LEFT JOIN contacts ct ON a.sf_account_id = ct.sf_account_id
  GROUP BY a.sf_account_id
)
SELECT
  a.sf_account_id,
  a.name,
  a.arr,
  a.csm_email,
  a.last_activity_date,

  -- AI Scores
  s.sentiment_score,
  s.churn_risk_score,
  s.expansion_score,
  s.engagement_quality_score,
  s.champion_strength_score,
  s.analyzed_at as score_date,

  -- Metrics
  m.*,

  -- Risk flags
  (m.days_since_last_call > 60 OR m.days_since_last_email > 60) as no_contact_60d,
  (m.active_contacts = 1) as single_threaded,
  (m.open_tickets_count > m.avg_tickets_30d * 3) as ticket_spike,
  (m.contacts_left > 0) as champion_left,

  -- Critical insights (top 3)
  json_agg(i.*) FILTER (WHERE i.insight_type IN ('risk', 'churn_signal')) as insights,

  -- Next renewal
  o.close_date as renewal_date,
  o.amount as renewal_amount

FROM accounts a
LEFT JOIN account_ai_scores s ON a.sf_account_id = s.sf_account_id
LEFT JOIN account_metrics m USING (sf_account_id)
LEFT JOIN account_insights i ON a.sf_account_id = i.sf_account_id
  AND i.detected_at > NOW() - INTERVAL '30 days'
LEFT JOIN opportunities o ON a.sf_account_id = o.sf_account_id
  AND o.type = 'Renewal'
  AND o.close_date > NOW()

WHERE a.csm_email = $current_user_email  -- Future: filter by logged-in CSM
ORDER BY [priority_score_calculation] DESC
LIMIT 20;
```

### Performance Considerations

- Create Postgres view for priority score calculation
- Index on `csm_email`, `sf_account_id`, `churn_risk_score`
- Consider materialized view for stats bar (refresh daily)

---

## 4. Real-Time Metrics

### Calculated On-The-Fly (No Storage)

These are simple aggregations from existing tables:

**From call_transcripts:**
- `calls_last_30d` - COUNT(*) where created_at >= 30 days ago
- `calls_last_60d` - COUNT(*) where created_at >= 60 days ago
- `days_since_last_call` - Today minus MAX(created_at)

**From email_threads:**
- `emails_last_30d` - COUNT(*) where sent_time >= 30 days ago
- `days_since_last_email` - Today minus MAX(sent_time)

**From zendesk_tickets:**
- `open_tickets_count` - COUNT(*) where status NOT IN ('solved', 'closed')
- `high_priority_tickets` - COUNT(*) where priority IN ('high', 'urgent')
- `tickets_last_30d` - COUNT(*) where created_at >= 30 days ago

**From opportunities:**
- `active_opportunities` - COUNT(*) where is_closed = false
- `total_pipeline_value` - SUM(amount) where is_closed = false
- `stalled_opportunities` - COUNT(*) where updated_at > 30 days old

**From contacts:**
- `total_contacts` - COUNT(*)
- `active_contacts` - COUNT(*) where is_active_user = true
- `executive_contacts` - COUNT(*) where title contains 'VP' or 'Chief'
- `contacts_left` - COUNT(*) where left_company = true

**Risk Flags (Boolean Checks):**
- `no_contact_60d` - Is days_since_activity > 60?
- `single_threaded` - Only 1 contact engaged in last 90 days?
- `ticket_spike` - Current tickets > 3x average?
- `champion_left` - Any contacts_left > 0?

---

## 5. AI Integration

### Relationship Between AI Scores and Real-Time Metrics

```
Real-Time Metrics          AI Scores & Insights         Dashboard Display
(Raw Activity Data)   →    (Processed Intelligence) →   (Actionable View)
─────────────────────      ────────────────────────     ────────────────
• calls_last_30d: 2        • churn_risk_score: 72       Priority Card:
• emails_last_30d: 8       • sentiment_score: 45        "⚠️ At Risk"
• open_tickets: 3          • engagement_quality: 60
• high_pri_tickets: 1                                   Risk Flags:
• days_since_call: 18      AI Insights generated:       "• No contact 18d"
• contacts_left: 1         • "Negative sentiment        "• Champion left"
                             detected in calls"         "• 3 open tickets"
                           • "Champion left company"
                           • "Budget concerns           Action:
                             mentioned"                 "Schedule exec
                                                         check-in"
```

### Integration Strategy

**1. AI Scores = Strategic Intelligence (70% weight)**
- Stored in `account_ai_scores` table
- Updated daily by batch AI process
- Primary health indicators:
  - `churn_risk_score` (0-100): Overall risk of losing account
  - `sentiment_score` (0-100): Emotional tone from communications
  - `engagement_quality_score` (0-100): Depth of relationship
  - `champion_strength_score` (0-100): Strength of internal advocates

**2. Real-Time Metrics = Tactical Evidence (30% weight)**
- Calculated on-demand from activity tables
- Provide immediate, objective context
- Catch things that happened TODAY (AI scores are from last night)

**3. AI Insights = Human-Readable Explanations**
- Text descriptions from `account_insights` table
- Explain the "why" behind the scores
- Include confidence scores

**4. Display Integration**

```typescript
{
  accountName: "Acme Corp",
  arr: "$250K",

  // PRIMARY: AI Score
  healthStatus: "critical",  // from churn_risk_score > 70
  healthScore: 45,            // sentiment_score or composite
  healthTrend: "↓ 15pts",     // 7-day change

  // CONTEXT: Real-Time Metrics
  activityMetrics: {
    daysSinceLastCall: 18,
    openTickets: 3,
    highPriorityTickets: 1
  },

  // EXPLANATION: AI Insight (top 1)
  primaryInsight: {
    type: "churn_signal",
    text: "Negative call sentiment detected (2 days ago)",
    confidence: 0.89
  },

  // RISK FLAGS: Combination
  riskFlags: [
    { source: "ai_insight", text: "Champion left company" },
    { source: "metric", text: "No contact in 18 days" },
    { source: "metric", text: "Ticket spike (3x average)" }
  ],

  // ACTION: AI-Generated
  suggestedAction: "Schedule executive check-in call"
}
```

### Key Principles

1. **AI Scores = Source of Truth** for overall health
2. **Real-Time Metrics = Supporting Evidence** for what's happening NOW
3. **AI Insights = The Story** explaining why
4. **Risk Flags = Combination** of both AI and metric thresholds
5. **When They Disagree**: Real-time metrics can override for urgency

---

## 6. Component Structure

### Next.js 14 App Router Structure

```
app/
├── layout.tsx                    # Root layout with providers
├── page.tsx                      # Landing/login
└── dashboard/
    ├── layout.tsx                # Dashboard shell (sidebar, header)
    ├── page.tsx                  # Main dashboard (Server Component)
    └── components/
        ├── StatsBar.tsx
        ├── PriorityAccountsList.tsx
        ├── AccountCard.tsx
        ├── AccountCardExpanded.tsx
        ├── HealthScoreBadge.tsx
        ├── RiskFlagBadge.tsx
        ├── TrendIndicator.tsx
        └── HealthTrendChart.tsx

components/
└── ui/                           # shadcn/ui components
    ├── card.tsx
    ├── badge.tsx
    ├── button.tsx
    └── ...

lib/
├── supabase/
│   ├── client.ts                 # Browser client
│   ├── server.ts                 # Server client (for RSC)
│   └── queries.ts                # Reusable query functions
├── stores/
│   └── dashboardStore.ts         # Zustand store (UI state)
├── types/
│   └── database.ts               # Generated Supabase types
└── utils/
    ├── priorityScore.ts          # Priority calculation logic
    └── riskFlags.ts              # Risk detection functions
```

### Key Component Patterns

**Dashboard Page (Server Component):**
```typescript
// Fast initial load, no loading state
export default async function DashboardPage() {
  const supabase = createServerClient();
  const [accounts, stats] = await Promise.all([
    getPriorityAccounts(supabase),
    getStats(supabase)
  ]);

  return (
    <div className="p-6 space-y-6">
      <StatsBar stats={stats} />
      <PriorityAccountsList initialAccounts={accounts} />
    </div>
  );
}
```

**Priority List (Client Component):**
```typescript
'use client';

export default function PriorityAccountsList({ initialAccounts }) {
  const [expandedId, setExpandedId] = useState(null);

  // React Query hydrates with initialData, refetches in background
  const { data: accounts } = useQuery({
    queryKey: ['priority-accounts'],
    queryFn: fetchAccounts,
    initialData: initialAccounts,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="space-y-3">
      {accounts.map(account => (
        <AccountCard
          key={account.sf_account_id}
          account={account}
          isExpanded={expandedId === account.sf_account_id}
          onToggle={() => setExpandedId(
            expandedId === account.sf_account_id ? null : account.sf_account_id
          )}
        />
      ))}
    </div>
  );
}
```

**Account Card (Expandable):**
```typescript
export default function AccountCard({ account, isExpanded, onToggle }) {
  return (
    <Card className="p-6 cursor-pointer" onClick={onToggle}>
      {/* Collapsed View */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <HealthScoreBadge status={account.healthStatus} />
            <div>
              <h3 className="text-lg font-semibold">{account.name}</h3>
              <p className="text-sm text-muted">${account.arr / 1000}K ARR</p>
            </div>
          </div>
          <TrendIndicator score={account.healthScore} trend={account.healthTrend} />
        </div>

        <div className="flex flex-wrap gap-2">
          {account.riskFlags.map(flag => (
            <RiskFlagBadge key={flag.text} flag={flag} />
          ))}
          <Badge>📞 {account.daysSinceLastCall}d ago</Badge>
          <Badge>🎫 {account.openTickets} open</Badge>
        </div>

        <div className="text-sm text-muted">{account.primaryInsight.text}</div>

        <div className="flex items-center gap-2 text-sm font-medium text-amber-600 bg-amber-50 p-3 rounded-lg">
          <span>→</span>
          <span>Action: {account.suggestedAction}</span>
        </div>
      </div>

      {/* Expanded View */}
      {isExpanded && (
        <AccountCardExpanded account={account} className="mt-6 pt-6 border-t" />
      )}
    </Card>
  );
}
```

### Design System

**Health Status Colors:**
```typescript
const healthStatusConfig = {
  critical: {
    dot: 'bg-red-500',
    text: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-200',
  },
  at_risk: {
    dot: 'bg-amber-500',
    text: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  },
  healthy: {
    dot: 'bg-green-500',
    text: 'text-green-700',
    bg: 'bg-green-50',
    border: 'border-green-200',
  },
};
```

---

## 7. State Management

### Three Layers of State

1. **Server State (TanStack Query)** - API data, cached with smart refetch
2. **UI State (Zustand)** - Ephemeral interactions (expanded cards, filters)
3. **URL State (Next.js searchParams)** - Shareable state (future: filters)

### TanStack Query Setup

```typescript
// app/providers.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // 5 minutes fresh
      gcTime: 10 * 60 * 1000,         // 10 minutes cache
      refetchOnWindowFocus: false,    // Data changes daily
      retry: 1,
    },
  },
});
```

### Query Hooks

```typescript
// lib/hooks/useAccounts.ts
export function usePriorityAccounts() {
  const supabase = createBrowserClient();
  return useQuery({
    queryKey: ['accounts', 'priority'],
    queryFn: () => getPriorityAccounts(supabase),
    staleTime: 5 * 60 * 1000,
  });
}
```

### Zustand Store

```typescript
// lib/stores/dashboardStore.ts
export const useDashboardStore = create<DashboardState>()(
  devtools((set) => ({
    expandedAccountId: null,
    setExpandedAccountId: (id) => set({ expandedAccountId: id }),

    filters: {
      healthStatus: 'all',
      sortBy: 'priority',
    },
    setFilters: (newFilters) => set((state) => ({
      filters: { ...state.filters, ...newFilters }
    })),
  }))
);
```

### Data Flow

```
Initial Load:
1. Server fetches from Supabase (fast, no loading)
2. Renders page with data
3. Hydrates to client with initialData
4. React Query caches data
5. Background refetch if stale

User Interaction:
1. Click to expand account
2. Zustand updates expandedAccountId
3. Component re-renders with expanded view
```

---

## 8. Error Handling

### Error Boundaries

```typescript
// app/error.tsx
export default function Error({ error, reset }) {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold">Something went wrong</h2>
        <p className="text-muted">We encountered an error loading the dashboard</p>
        <Button onClick={reset}>Try again</Button>
      </div>
    </div>
  );
}
```

### Loading States

```typescript
// Skeleton components for initial load
export default function AccountListSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <Card key={i} className="p-6 animate-pulse">
          <div className="h-6 w-48 bg-gray-200 rounded" />
          <div className="h-4 w-full bg-gray-200 rounded mt-4" />
        </Card>
      ))}
    </div>
  );
}
```

### Empty States

```typescript
<EmptyState
  icon="🎉"
  title="All accounts are healthy"
  message="No accounts need immediate attention. Great work!"
/>
```

### Edge Cases

```typescript
// Handle missing data gracefully
export function getHealthStatus(churnRiskScore: number | null): HealthStatus {
  if (churnRiskScore === null) return 'unknown';
  if (churnRiskScore >= 70) return 'critical';
  if (churnRiskScore >= 40) return 'at_risk';
  return 'healthy';
}

export function formatARR(arr: number | null): string {
  if (arr === null) return 'N/A';
  if (arr === 0) return 'No ARR';
  if (arr < 1000) return `$${arr}`;
  return `$${(arr / 1000).toFixed(0)}K`;
}

export function getDaysSince(date: string | null): string {
  if (!date) return 'Never';
  const days = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}
```

### Graceful Degradation

```typescript
export default function AccountCard({ account }) {
  const hasAIScores = account.healthScore !== null;
  const hasInsights = account.insights?.length > 0;

  return (
    <Card>
      {/* Always show name and ARR */}
      <h3>{account.name}</h3>
      <span>{formatARR(account.arr)}</span>

      {/* Conditionally render based on available data */}
      {hasAIScores ? (
        <HealthScore score={account.healthScore} />
      ) : (
        <div className="text-sm text-muted">AI analysis pending</div>
      )}

      {hasInsights ? (
        <InsightsList insights={account.insights} />
      ) : (
        <div className="text-sm text-muted">No recent insights</div>
      )}
    </Card>
  );
}
```

---

## 9. Future Phases

### Phase 2: Enhanced Features (Weeks 3-4)

**Authentication & Multi-User:**
- Supabase Auth + Row Level Security (RLS)
- Filter accounts by logged-in CSM
- Admin role to assign CSMs to accounts

**Portfolio & Analytics Tabs:**
- Tab navigation (Priority | Portfolio | Analytics)
- Portfolio: Health distribution chart, renewal forecast
- Analytics: Trend charts, CSM performance metrics

**Account Detail Page:**
- Dedicated `/dashboard/accounts/[id]` route
- Full activity timeline
- Relationship map visualization
- Call transcripts viewer

**Inline Quick Actions:**
- "Mark insight as reviewed"
- "Snooze account for 7 days"
- "Add note"
- Optimistic updates with rollback

### Phase 3: Advanced Features (Weeks 5-6)

**Real-Time Updates:**
- Supabase Realtime subscriptions
- Live health score changes
- Instant notifications for critical events

**Advanced Filtering:**
- Filter by health status, ARR range, days until renewal
- Full-text search across accounts, contacts, insights
- Saved filter presets

**Manager Dashboard:**
- Team rollup view (all CSMs)
- CSM performance leaderboard
- Portfolio health trends over time
- Risk alerts aggregated across team

**Notifications:**
- In-app notifications (bell icon)
- Email digest (daily summary)
- Critical alerts for health drops, champion departures

**Playbooks:**
```typescript
interface Playbook {
  trigger: 'champion_left' | 'health_drop' | 'ticket_spike';
  steps: Action[];
  status: 'not_started' | 'in_progress' | 'completed';
}
```

### Phase 4: AI Enhancements (Future)

**Conversational Interface:**
- Natural language queries: "Show me at-risk enterprise accounts"
- AI-powered Q&A over account data

**Predictive Actions:**
- AI suggests optimal outreach timing
- Generates contextual email templates
- Recommends which stakeholder to contact

**Outcome Tracking:**
- Did suggested action improve health?
- Which actions correlate with retention?
- Feedback loop to improve AI recommendations

### Architecture Evolution

```
MVP (Phase 1):
Next.js 14 → Supabase (daily batch)

Phase 2-3:
Next.js 14 → Supabase + Realtime
           → Supabase Auth + RLS
           → Background jobs (Vercel Cron)

Phase 4:
Next.js 14 → Supabase
           → AI API (LLM inference)
           → Vector DB (semantic search)
           → Event streaming
```

---

## Success Metrics

### MVP (Phase 1)
- CSMs log in daily
- Average 5+ accounts reviewed per day
- Time to identify priority accounts < 2 minutes

### Phase 2
- 90%+ of CSMs using daily
- 30% reduction in time spent triaging accounts
- Positive CSAT from CSM team

### Phase 3
- Measurable improvement in churn prediction accuracy
- 50% of priority accounts addressed within 48 hours
- Manager adoption for team oversight

---

## Implementation Notes

### Development Workflow

1. **Setup** (Day 1)
   - Initialize Next.js 14 project
   - Configure Supabase connection
   - Install dependencies (shadcn/ui, TanStack Query, etc.)
   - Generate TypeScript types from Supabase schema

2. **Data Layer** (Days 2-3)
   - Write Supabase query functions
   - Test priority score calculation
   - Verify data transformations

3. **UI Components** (Days 4-7)
   - Build shadcn/ui design system
   - Implement Stats Bar
   - Build AccountCard component
   - Create expanded view
   - Add animations

4. **Integration** (Days 8-10)
   - Connect components to data
   - Implement state management
   - Add error handling
   - Test edge cases

5. **Polish** (Days 11-14)
   - Performance optimization
   - Responsive design
   - Loading states
   - User testing and feedback

### Key Files to Create

```
app/
  layout.tsx
  providers.tsx
  dashboard/
    page.tsx
    layout.tsx
    components/
      StatsBar.tsx
      PriorityAccountsList.tsx
      AccountCard.tsx
      AccountCardExpanded.tsx
      HealthScoreBadge.tsx
      RiskFlagBadge.tsx

lib/
  supabase/
    client.ts
    server.ts
    queries.ts
  hooks/
    useAccounts.ts
    useDashboardStats.ts
  stores/
    dashboardStore.ts
  types/
    database.ts
  utils/
    priorityScore.ts
    riskFlags.ts
    formatters.ts

components/
  ui/
    [shadcn components]
```

---

## Questions & Decisions

### Resolved
- ✅ Tech stack: Next.js 14 + Supabase
- ✅ MVP scope: Priority accounts list only
- ✅ User workflow: Expandable cards + link out to existing tools
- ✅ Data freshness: Daily batch updates
- ✅ AI + Metrics integration: 70/30 weight in priority score

### To Be Determined
- Authentication implementation timeline (MVP or Phase 2?)
- Exact Salesforce/Zendesk deep-link URL formats
- Monitoring/observability tooling (Sentry, Vercel Analytics?)
- CI/CD pipeline and deployment strategy

---

## Appendix

### Supabase Schema Reference

**Key Tables:**
- `accounts` - Core account data
- `account_ai_scores` - AI health metrics
- `account_insights` - AI-generated insights
- `call_transcripts` - Call recordings
- `email_threads` - Email data
- `contacts` - Stakeholder info
- `opportunities` - Pipeline/renewals
- `zendesk_tickets` - Support tickets
- `zendesk_ticket_comments` - Ticket comments
- `zendesk_org_mapping` - Zendesk to SF mapping

### Design References

- Original mockup: `/assets/cs-dashboard-minimal-amber.html`
- Supabase schema: `/assets/supabase_schema.json`

---

**Next Steps:** Ready to proceed with detailed implementation plan? Use `superpowers:writing-plans` skill to create step-by-step implementation tasks.
