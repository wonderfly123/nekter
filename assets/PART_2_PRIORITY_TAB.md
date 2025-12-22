# Customer Success Dashboard - Part 2: Priority Tab

## Overview

Build the Priority tab that displays Critical and At Risk accounts sorted by importance, with filtering by renewal status.

**Prerequisites:** Complete Part 1 (foundation must be built first)

---

## What You're Building

### Visual Layout

```
┌─────────────────────────────────────────────────────────┐
│  CRITICAL        │  AT RISK         │  RENEWALS (90D)  │
│     7            │     18           │     23 ☑️         │
│  $890K ARR       │  $1.8M ARR       │  $3.2M ARR       │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 🔴 Apex Logistics              $890K ARR    Sarah Chen  │
│ Health: 65 ↓ Declining    Last Interaction: 51d ago     │
│ • No contact in 51 days                                  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 🟡 Northstar Manufacturing     $125K ARR    Mike Johnson│
│ Health: 32 ↓ Declining    Last Interaction: 22d ago     │
│ • 8 Churn Signals: budget concerns, evaluating...        │
│ • 5 open tickets                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Phase 1: Database Queries

### Priority Accounts Query
**File:** `lib/supabase/queries.ts` (add function)

**Function:** `getPriorityAccounts(includeRenewalsOnly)`

**Logic:**
1. Get today's health snapshot from `account_health_history` table
   - Filter: `created_at = December 20, 2025` (using demo date)
   - Filter: `health_status IN ('Critical', 'At Risk')`
2. Join with `accounts` table to get company details
3. Calculate priority score for each: `ARR × multiplier`
   - Critical accounts: multiply by 2
   - At Risk accounts: multiply by 1
4. Sort by priority score descending
5. For each account, fetch recent `interaction_insights` (last 5)
6. Extract top signals using `getTopSignals()` helper
7. If `includeRenewalsOnly = true`:
   - Query `opportunities` table for renewals in next 90 days
   - Filter accounts to only those with upcoming renewals

**Returns:** Array of `PriorityAccount` objects

**Data Structure:**
```
PriorityAccount {
  // From accounts table
  sf_account_id: "001ACC003"
  name: "Apex Logistics"
  arr: 890000
  csm_name: "Sarah Chen"
  
  // From account_health_history
  health: {
    health_status: "Critical"
    trend: "Declining"
    avg_sentiment: 65
    churn_signals: 0
    days_since_activity: 51
    open_ticket_count: 0
  }
  
  // Calculated from interaction_insights
  topSignals: [
    "No contact in 51 days"
  ]
}
```

### Dashboard Stats Query
**File:** `lib/supabase/queries.ts` (add function)

**Function:** `getDashboardStats()`

**Logic:**
1. Get today's health snapshot for ALL accounts
2. Group by `health_status`
3. Count accounts per status
4. Sum ARR per status
5. Separately query `opportunities` for renewals:
   - Filter: `type = 'Renewal'`
   - Filter: `close_date <= 90 days from now`
   - Filter: `is_closed = false`
6. Count renewal opportunities
7. Sum renewal ARR

**Returns:** `PortfolioStats` object

**Data Structure:**
```
PortfolioStats {
  criticalCount: 3
  criticalARR: 890000
  atRiskCount: 3
  atRiskARR: 1800000
  renewalsCount: 23
  renewalsARR: 3200000
  healthyCount: 4
  healthyARR: 2500000
}
```

---

## Phase 2: React Query Hooks

### Priority Accounts Hook
**File:** `hooks/use-priority-accounts.ts`

**Hook:** `usePriorityAccounts(includeRenewalsOnly)`

**Purpose:** Wraps the `getPriorityAccounts()` query in React Query

**Behavior:**
- Accepts `includeRenewalsOnly` boolean parameter
- Query key: `['priority-accounts', includeRenewalsOnly]`
- Stale time: 5 minutes (data stays fresh for 5 min)
- Automatically refetches when `includeRenewalsOnly` changes

**Returns:** `{ data, isLoading, error }`

### Dashboard Stats Hook
**File:** `hooks/use-dashboard-stats.ts`

**Hook:** `useDashboardStats()`

**Purpose:** Wraps the `getDashboardStats()` query in React Query

**Behavior:**
- Query key: `['dashboard-stats']`
- Stale time: 5 minutes
- No parameters needed

**Returns:** `{ data, isLoading, error }`

---

## Phase 3: Filter Cards Component

### Component Structure
**File:** `components/priority/filter-cards.tsx`

**Props:**
- `stats` - PortfolioStats object

**Layout:** 3 cards in a grid

**Card 1: CRITICAL**
- Display: Count of critical accounts
- Display: Total ARR of critical accounts
- Styling: Red border, red accent
- Behavior: Display-only (not clickable)

**Card 2: AT RISK**
- Display: Count of at-risk accounts
- Display: Total ARR of at-risk accounts
- Styling: Yellow border, yellow accent
- Behavior: Display-only (not clickable)

**Card 3: RENEWALS (90D)**
- Display: Count of renewal opportunities
- Display: Total ARR of renewals
- Display: Checkbox in top-right
- Styling: Gray border by default, blue border when checked
- Behavior: Clickable - toggles filter

**Renewals Card Interaction:**
1. User clicks card (or checkbox)
2. Calls Zustand action: `setShowRenewalsOnly(!showRenewalsOnly)`
3. Priority tab re-renders with filtered data
4. Card changes to blue border to show active filter

---

## Phase 4: Account Card Component

### Component Structure
**File:** `components/priority/account-card.tsx`

**Props:**
- `account` - PriorityAccount object

**Layout:** 3 lines of information

**Line 1:**
- Left side:
  - Health badge (🔴 Critical or 🟡 At Risk)
  - Company name (bold, large)
- Right side:
  - ARR (formatted: "$890K")
  - CSM name

**Line 2:**
- Health score (from `avg_sentiment`)
- Trend indicator (↓ Declining, ↑ Improving, → Stable)
- Last interaction: "51d ago"

**Line 3:**
- Bullet list of top signals (max 2)
- Examples:
  - "8 Churn Signals: budget concerns, evaluating competitors"
  - "5 open tickets"
  - "No contact in 51 days"
  - "Sentiment: 32 (concerning)"

**Behavior:**
- Entire card is clickable
- On click: Navigate to `/account/{sf_account_id}`
- Hover: Show shadow effect

**Styling:**
- White background
- Border
- Rounded corners
- Padding

---

## Phase 5: Account List Component

### Component Structure
**File:** `components/priority/account-list.tsx`

**Props:**
- `accounts` - Array of PriorityAccount objects

**Layout:** Vertical stack of AccountCard components

**Behavior:**
- Maps over accounts array
- Renders one AccountCard per account
- Maintains spacing between cards

**Empty State:**
- If `accounts.length === 0`
- Display: "No accounts match the current filters."
- Centered, gray text

---

## Phase 6: Priority Page

### Page Structure
**File:** `app/priority/page.tsx`

**Data Flow:**
1. Component renders
2. Calls `useFilterStore()` to get current `showRenewalsOnly` state
3. Calls `usePriorityAccounts(showRenewalsOnly)` hook
4. Calls `useDashboardStats()` hook
5. Both hooks fetch data from Supabase
6. React Query returns data + loading states

**Render Logic:**

**While loading stats:**
- Show 3 `StatCardSkeleton` components

**When stats loaded:**
- Render `<FilterCards stats={stats} />`

**While loading accounts:**
- Show 5 `CardSkeleton` components

**When accounts loaded:**
- Render `<AccountList accounts={accounts} />`

**Layout:**
- Wrapped in `<PageContainer>`
- No title (filter cards serve as header)
- Filter cards on top
- Account list below

---

## How It All Works Together

### Initial Page Load

```
1. User navigates to /priority
   ↓
2. PriorityPage component renders
   ↓
3. useFilterStore() returns: { showRenewalsOnly: false }
   ↓
4. usePriorityAccounts(false) fires
   ↓
5. React Query checks cache - MISS
   ↓
6. Calls getPriorityAccounts(false)
   ↓
7. Query executes against Supabase:
   - SELECT from account_health_history WHERE created_at = '2025-12-20' AND status IN ('Critical', 'At Risk')
   - JOIN with accounts table
   - Calculate priority scores
   - Sort by priority
   ↓
8. For each account (top 10):
   - SELECT from interaction_insights WHERE sf_account_id = ? LIMIT 5
   - Extract signals with getTopSignals()
   ↓
9. Return array of PriorityAccount objects
   ↓
10. React Query caches result with key ['priority-accounts', false]
    ↓
11. PriorityPage receives data
    ↓
12. Renders FilterCards with stats
    ↓
13. Renders AccountList with accounts
    ↓
14. Each AccountCard renders with health badge, signals
```

### User Toggles Renewals Filter

```
1. User clicks RENEWALS card
   ↓
2. onClick fires: setShowRenewalsOnly(true)
   ↓
3. Zustand store updates: { showRenewalsOnly: true }
   ↓
4. PriorityPage re-renders
   ↓
5. usePriorityAccounts(true) fires with new parameter
   ↓
6. React Query checks cache for key ['priority-accounts', true]
   ↓
7. Cache MISS (different key than before)
   ↓
8. Calls getPriorityAccounts(true)
   ↓
9. Query executes:
   - Get critical/at-risk accounts (same as before)
   - ADDITIONALLY: Query opportunities table for renewals
   - Filter accounts to only those with renewals
   ↓
10. Return filtered array (fewer accounts)
    ↓
11. React Query caches with new key ['priority-accounts', true]
    ↓
12. AccountList updates to show only renewal accounts
    ↓
13. RENEWALS card shows blue border (active state)
```

### User Clicks Account Card

```
1. User clicks on "Apex Logistics" card
   ↓
2. Next.js Link navigates to: /account/001ACC003
   ↓
3. Account Detail page loads (build in Part 3)
```

---

## Signal Priority Logic

**How Top Signals Are Chosen:**

The `getTopSignals()` function evaluates in this order:

**Priority 1: Churn Signals**
- If `health.churn_signals > 0`
- Find latest interaction where `churn_risk = true`
- Extract `churn_reasons` array (take first 2)
- Display: "8 Churn Signals: budget concerns, evaluating competitors"

**Priority 2: Open Tickets**
- If `health.open_ticket_count >= 2`
- Display: "5 open tickets"

**Priority 3: Low Sentiment**
- If `health.avg_sentiment < 50`
- Display: "Sentiment: 32 (concerning)"

**Priority 4: Inactivity**
- If `health.days_since_activity > 30`
- Display: "No contact in 51 days"

**Return top 2 signals only** (to keep cards compact)

---

## Testing the Priority Tab

### Verify Functionality Checklist

**✅ Filter Cards Display:**
- CRITICAL card shows correct count and ARR
- AT RISK card shows correct count and ARR
- RENEWALS card shows correct count and ARR
- Numbers match your Supabase data for Dec 20, 2025

**✅ Account Sorting:**
- Accounts are sorted by priority score
- Critical accounts with high ARR appear first
- At Risk accounts with lower ARR appear after Critical

**✅ Account Cards Display:**
- Health badge shows correct color (red/yellow)
- Company name is displayed
- ARR is formatted correctly ("$890K")
- CSM name appears
- Health score shows number (0-100)
- Trend indicator shows correct arrow and text
- Days since activity is accurate
- Top signals appear (max 2 per card)

**✅ Renewals Filter:**
- Clicking RENEWALS card toggles filter
- Card border turns blue when active
- Checkbox updates to checked state
- Account list filters to only renewal accounts
- Clicking again turns off filter
- Account list shows all accounts again

**✅ Navigation:**
- Clicking any account card navigates to detail page
- URL updates to `/account/{sf_account_id}`
- Browser back button works

**✅ Loading States:**
- Skeleton cards appear while data loads
- Loading doesn't freeze the UI
- Data appears smoothly when loaded

---

## Data Verification

### Compare Against Supabase

Run this query in Supabase SQL Editor:

```sql
SELECT 
  a.name,
  a.arr,
  h.health_status,
  h.avg_sentiment,
  h.churn_signals,
  h.days_since_activity
FROM accounts a
JOIN account_health_history h ON a.sf_account_id = h.sf_account_id
WHERE DATE(h.created_at) = '2025-12-20'
  AND h.health_status IN ('Critical', 'At Risk')
ORDER BY (a.arr * CASE WHEN h.health_status = 'Critical' THEN 2 ELSE 1 END) DESC;
```

**Dashboard should show accounts in same order with same data.**

---

## File Structure After Part 2

```
customer-success-dashboard/
├── app/
│   └── priority/
│       └── page.tsx                  # ✅ COMPLETE
│
├── components/
│   └── priority/
│       ├── filter-cards.tsx          # ✅ NEW
│       ├── account-card.tsx          # ✅ NEW
│       └── account-list.tsx          # ✅ NEW
│
├── lib/
│   └── supabase/
│       └── queries.ts                # ✅ UPDATED (2 new functions)
│
└── hooks/
    ├── use-priority-accounts.ts      # ✅ NEW
    └── use-dashboard-stats.ts        # ✅ NEW
```

---

## Common Issues & Solutions

**Issue:** No accounts appear
**Solution:** Check that your `account_health_history` table has data for Dec 20, 2025

**Issue:** Wrong sort order
**Solution:** Verify priority score calculation (Critical = ARR × 2, At Risk = ARR × 1)

**Issue:** Signals not showing
**Solution:** Check that `interaction_insights` table has data linked to accounts

**Issue:** Renewals filter shows no accounts
**Solution:** Verify `opportunities` table has renewals with `close_date` within 90 days

**Issue:** Filter toggle doesn't work
**Solution:** Make sure Zustand store is imported and `setShowRenewalsOnly` is called

**Issue:** Data shows "0 days ago" for everything
**Solution:** Verify demo date is set correctly in `.env.local`

---

## What's Next

**Part 3: Account Detail Page** will build:
- Account header with health and trend
- 7 metric cards
- 90-day health trend chart
- Recommended action items
- Interaction timeline

---

**END OF PART 2**
