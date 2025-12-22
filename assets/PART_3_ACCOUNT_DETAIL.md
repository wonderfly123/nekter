# Customer Success Dashboard - Part 3: Account Detail Page

## Overview

Build the Account Detail page that shows deep-dive health metrics, 90-day trends, recent interactions, and recommended actions for a single account.

**Prerequisites:** Complete Parts 1 & 2 (foundation and priority tab)

---

## What You're Building

### Visual Layout

```
┌─────────────────────────────────────────────────────────┐
│  Apex Logistics                                          │
│  $890K ARR • CSM: Sarah Chen • Logistics                │
│                                      🔴 Critical  ↓ Declining │
└─────────────────────────────────────────────────────────┘

┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
│Sent: │ │Inter:│ │Churn │ │Expan │ │Open  │ │Last  │ │Cont: │
│ 65   │ │  2   │ │  0   │ │  0   │ │  0   │ │ 51d  │ │  2   │
└──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘

┌─────────────────────────┐  ┌─────────────────────────┐
│ Health Trend (90 Days)  │  │ Recommended Actions     │
│                         │  │                         │
│ [Line Chart]            │  │ 🔴 HIGH PRIORITY        │
│                         │  │ Reach out to check in   │
│                         │  │ No contact in 51 days   │
└─────────────────────────┘  └─────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Recent Interactions (30 Days)                           │
│                                                          │
│ 📞 transcript • 32 days ago                             │
│ Customer expressed frustration with response times...   │
│ Sentiment: 45 • Engagement: 65 • 🔴 Churn Risk         │
│ Churn Signals: evaluating alternatives, budget concerns│
└─────────────────────────────────────────────────────────┘
```

---

## Phase 1: Database Query

### Account Detail Query
**File:** `lib/supabase/queries.ts` (add function)

**Function:** `getAccountDetail(sfAccountId)`

**Logic - Execute 6 Queries in Parallel:**

**1. Get Account Base Data**
- Table: `accounts`
- Filter: `sf_account_id = sfAccountId`
- Returns: name, ARR, CSM, industry, etc.

**2. Get Current Health Status**
- Table: `account_health_history`
- Filter: `sf_account_id = sfAccountId`
- Filter: `created_at = Dec 20, 2025` (today)
- Returns: Current health_status, trend, avg_sentiment, counts

**3. Get 90-Day Health History**
- Table: `account_health_history`
- Filter: `sf_account_id = sfAccountId`
- Filter: `created_at >= 90 days ago`
- Sort: By date ascending
- Returns: Array of daily health snapshots

**4. Get Recent Interactions (30 Days)**
- Table: `interaction_insights`
- Filter: `sf_account_id = sfAccountId`
- Filter: `created_at >= 30 days ago`
- Sort: By date descending (newest first)
- Returns: Array of interaction insights with AI analysis

**5. Get Open Ticket Count**
- Table: `zendesk_tickets`
- Filter: `sf_account_id = sfAccountId`
- Filter: `status IN ('open', 'pending')`
- Returns: Count of open tickets

**6. Get Contact Info**
- Table: `contacts`
- Filter: `sf_account_id = sfAccountId`
- Returns: Count of contacts + whether any have `left_company = true`

**Combine Results:**
```
AccountDetailData {
  // From accounts
  name, arr, csm_name, industry, etc.
  
  // From account_health_history
  currentHealth: {...}
  healthHistory: [...]  // 90 days
  
  // From interaction_insights
  recentInteractions: [...]  // 30 days
  
  // Calculated
  openTicketCount: 0
  contactCount: 2
  championLeft: false
}
```

---

## Phase 2: React Query Hook

### Account Detail Hook
**File:** `hooks/use-account-detail.ts`

**Hook:** `useAccountDetail(sfAccountId)`

**Purpose:** Wraps the `getAccountDetail()` query in React Query

**Behavior:**
- Query key: `['account-detail', sfAccountId]`
- Stale time: 2 minutes (more frequent refresh than other pages)
- Enabled: Only when `sfAccountId` exists (for URL parameter)

**Returns:** `{ data, isLoading, error }`

---

## Phase 3: Account Header Component

### Component Structure
**File:** `components/account-detail/account-header.tsx`

**Props:**
- `account` - AccountDetailData object

**Layout:** Single card at top of page

**Left Side:**
- Company name (large, bold)
- Metadata row: ARR • CSM name • Industry
  - Example: "$890K ARR • CSM: Sarah Chen • Logistics"
  - Separated by bullet points

**Right Side:**
- Health badge (large size: 🔴 Critical)
- Trend indicator below: ↓ Declining

**Styling:**
- White background
- Border
- Padding
- Flex layout (space-between)

---

## Phase 4: Metrics Grid Component

### Component Structure
**File:** `components/account-detail/metrics-grid.tsx`

**Props:**
- `account` - AccountDetailData object

**Layout:** 7 cards in a responsive grid

**Card Structure (all cards follow same pattern):**
- Label (small, gray)
- Value (large, bold)
- Subtitle (small, gray)

**Metric 1: Sentiment Score**
- Value: `currentHealth.avg_sentiment` (rounded)
- Subtitle: "Last 30 days average"
- Color: Default gray

**Metric 2: Interactions**
- Value: `currentHealth.interaction_count`
- Subtitle: "Last 30 days"
- Color: Default gray

**Metric 3: Churn Signals**
- Value: `currentHealth.churn_signals`
- Subtitle: "Requires attention" (if > 0) or "None detected"
- Color: Red if > 0, gray otherwise
- Border: Red if > 0

**Metric 4: Expansion Signals**
- Value: `currentHealth.expansion_signals`
- Subtitle: "Opportunity detected" (if > 0) or "None detected"
- Color: Green if > 0, gray otherwise
- Border: Green if > 0

**Metric 5: Open Tickets**
- Value: `account.openTicketCount`
- Subtitle: "Active support issues" (if > 0) or "No open tickets"
- Color: Default gray

**Metric 6: Last Contact**
- Value: `formatDaysAgo(days_since_activity)`
  - Examples: "Today", "Yesterday", "51d ago"
- Subtitle: "{X} days ago"
- Color: Default gray

**Metric 7: Contacts**
- Value: `account.contactCount`
- Subtitle: "⚠️ Champion left" (if true) or "Active contacts"
- Color: Red if champion left, gray otherwise
- Border: Red if champion left

**Grid Behavior:**
- Desktop: 4 columns
- Tablet: 2 columns
- Mobile: 1 column

---

## Phase 5: Health Trend Chart Component

### Component Structure
**File:** `components/account-detail/health-trend-chart.tsx`

**Props:**
- `history` - Array of AccountHealth objects (90 days)

**Chart Type:** Line chart using Recharts

**Data Preparation:**
- Map `history` array to chart data format
- X-axis: Date formatted as "MMM d" (e.g., "Oct 15")
- Y-axis: `avg_sentiment` value

**Chart Configuration:**
- Line color: Blue (#3b82f6)
- Line width: 2px
- Dots: Show on data points
- Y-axis range: 0-100
- Tooltip: Shows date + sentiment value
- Grid: Light gray dotted lines

**Card Wrapper:**
- Title: "Health Trend (90 Days)"
- White background
- Border
- Padding

**Empty State:**
- If `history.length === 0`
- Display: "No historical data available"

---

## Phase 6: Action Items Component

### Component Structure
**File:** `components/account-detail/action-items.tsx`

**Props:**
- `account` - AccountDetailData object

**Layout:** Card with list of recommended actions

**Action Generation Logic:**

Evaluate `currentHealth` to generate action items:

**Action 1: Churn Signals Detected**
- Condition: `currentHealth.churn_signals > 0`
- Priority: HIGH (red)
- Action: "Schedule executive business review"
- Reason: "{X} churn signal(s) detected"

**Action 2: Long Inactivity**
- Condition: `currentHealth.days_since_activity > 30`
- Priority: HIGH (red)
- Action: "Reach out to check in"
- Reason: "No contact in {X} days"

**Action 3: Multiple Open Tickets**
- Condition: `account.openTicketCount >= 2`
- Priority: MEDIUM (yellow)
- Action: "Review open support tickets"
- Reason: "{X} open tickets require attention"

**Action 4: Champion Left Company**
- Condition: `account.championLeft = true`
- Priority: HIGH (red)
- Action: "Identify new champion"
- Reason: "Previous champion has left the company"

**Action 5: Expansion Opportunity**
- Condition: `currentHealth.expansion_signals > 0`
- Priority: MEDIUM (yellow)
- Action: "Discuss expansion opportunities"
- Reason: "{X} expansion signal(s) identified"

**Action 6: Low Sentiment**
- Condition: `currentHealth.avg_sentiment < 50`
- Priority: HIGH (red)
- Action: "Address customer concerns"
- Reason: "Sentiment score is {X} (concerning)"

**Action Item Display:**
- Icon: 🔴 HIGH PRIORITY or 🟡 MEDIUM PRIORITY
- Action text (bold)
- Reason text (smaller)
- "Take Action" button (placeholder)
- Background color matches priority

**Empty State:**
- If no actions generated
- Display: "No critical actions required. Account is in good health!"

---

## Phase 7: Interaction Timeline Component

### Component Structure
**File:** `components/account-detail/interaction-timeline.tsx`

**Props:**
- `interactions` - Array of InteractionInsight objects

**Layout:** Vertical timeline with border-left

**Each Interaction Card:**

**Header Line:**
- Badge: Shows interaction_type
  - "transcript" = 📞
  - "email" = 📧
  - "zendesk_comment" = 💬
- Timestamp: Relative date ("32 days ago")

**Insight Summary:**
- Display `insight_summary` text
- Example: "Customer expressed frustration with response times and mentioned evaluating alternatives."

**Metrics Line:**
- Sentiment: {score}
- Engagement: {score}
- Badge: 🔴 Churn Risk (if `churn_risk = true`)
- Badge: 🟢 Expansion (if `expansion_opportunity = true`)

**Churn Signals Section:**
- Only show if `churn_reasons` exists and has items
- Display: "Churn Signals: {comma-separated reasons}"
- Text color: Red

**Expansion Signals Section:**
- Only show if `expansion_reasons` exists and has items
- Display: "Expansion Opportunities: {comma-separated reasons}"
- Text color: Green

**Styling:**
- Each card has blue left border (4px)
- Padding on left side
- Spacing between cards

**Empty State:**
- If `interactions.length === 0`
- Display: "No interactions in the last 30 days"

---

## Phase 8: Account Detail Page Assembly

### Page Structure
**File:** `app/account/[id]/page.tsx`

**URL Pattern:** `/account/001ACC003`

**Data Flow:**
1. Extract `id` from URL params
2. Call `useAccountDetail(id)` hook
3. Hook fetches all account data from Supabase
4. React Query returns combined data

**Render Logic:**

**While Loading:**
- Show CardSkeleton components in layout

**If Error or Account Not Found:**
- Display: "Account not found"
- Center aligned, gray text

**When Data Loaded:**

**Section 1: Header**
- `<AccountHeader account={account} />`

**Section 2: Metrics Grid**
- `<MetricsGrid account={account} />`

**Section 3: Two-Column Layout**
- Left column: `<HealthTrendChart history={account.healthHistory} />`
- Right column: `<ActionItems account={account} />`

**Section 4: Full Width**
- `<InteractionTimeline interactions={account.recentInteractions} />`

**Layout:**
- Wrapped in `<PageContainer>`
- No page title (header component serves as title)
- Consistent spacing between sections

---

## How It All Works Together

### User Clicks Account from Priority Tab

```
1. User clicks "Apex Logistics" card on Priority tab
   ↓
2. Next.js Link navigates to: /account/001ACC003
   ↓
3. AccountDetailPage component renders
   ↓
4. useParams() extracts id: "001ACC003"
   ↓
5. useAccountDetail("001ACC003") hook fires
   ↓
6. React Query checks cache - likely MISS (first visit)
   ↓
7. Calls getAccountDetail("001ACC003")
   ↓
8. Six Supabase queries execute in parallel:
   
   Query 1: SELECT * FROM accounts WHERE sf_account_id = '001ACC003'
   → Returns: {name: "Apex Logistics", arr: 890000, ...}
   
   Query 2: SELECT * FROM account_health_history 
            WHERE sf_account_id = '001ACC003' 
            AND created_at::date = '2025-12-20'
   → Returns: {health_status: "Critical", avg_sentiment: 65, ...}
   
   Query 3: SELECT * FROM account_health_history 
            WHERE sf_account_id = '001ACC003'
            AND created_at >= '2025-09-21'
            ORDER BY created_at ASC
   → Returns: Array of 90 daily snapshots
   
   Query 4: SELECT * FROM interaction_insights
            WHERE sf_account_id = '001ACC003'
            AND created_at >= '2025-11-20'
            ORDER BY created_at DESC
   → Returns: Array of recent interactions with AI insights
   
   Query 5: SELECT COUNT(*) FROM zendesk_tickets
            WHERE sf_account_id = '001ACC003'
            AND status IN ('open', 'pending')
   → Returns: {count: 0}
   
   Query 6: SELECT * FROM contacts
            WHERE sf_account_id = '001ACC003'
   → Returns: Array of contacts, check for left_company = true
   ↓
9. Combine all results into AccountDetailData object
   ↓
10. React Query caches with key ['account-detail', '001ACC003']
    ↓
11. AccountDetailPage receives data
    ↓
12. Components render in sequence:
    - AccountHeader: Shows name, ARR, health badge
    - MetricsGrid: Displays 7 metric cards
    - HealthTrendChart: Renders 90-day line chart
    - ActionItems: Generates 1 recommended action (inactivity)
    - InteractionTimeline: Shows 1 interaction from 32 days ago
```

### Recommended Action Generation Example

**For Apex Logistics (001ACC003):**

```
Current Health Data:
- churn_signals: 0
- days_since_activity: 51
- open_ticket_count: 0
- championLeft: false
- expansion_signals: 0
- avg_sentiment: 65

Actions Generated:
1. ✅ "Reach out to check in" 
   → Because days_since_activity (51) > 30
   → Priority: HIGH
   → Reason: "No contact in 51 days"

(No other conditions met, so only 1 action)
```

**For Northstar Manufacturing (001ACC002):**

```
Current Health Data:
- churn_signals: 8
- days_since_activity: 22
- open_ticket_count: 5
- championLeft: false
- expansion_signals: 0
- avg_sentiment: 32

Actions Generated:
1. ✅ "Schedule executive business review"
   → churn_signals (8) > 0
   → Priority: HIGH

2. ✅ "Review open support tickets"
   → open_ticket_count (5) >= 2
   → Priority: MEDIUM

3. ✅ "Address customer concerns"
   → avg_sentiment (32) < 50
   → Priority: HIGH

(3 total actions - sorted by priority, HIGH first)
```

---

## Testing the Account Detail Page

### Verify Functionality Checklist

**✅ Page Loads from Priority Tab:**
- Click account card on Priority tab
- URL updates to `/account/{id}`
- Page loads without errors

**✅ Account Header:**
- Company name displays correctly
- ARR is formatted properly
- CSM name appears
- Industry shows (if exists)
- Health badge shows correct status and color
- Trend indicator shows correct arrow and text

**✅ Metrics Grid:**
- All 7 cards render
- Values are accurate vs. Supabase data
- Cards with alerts (churn, champion left) show red borders
- Cards with positives (expansion) show green borders
- Grid is responsive (test different screen sizes)

**✅ Health Trend Chart:**
- Chart renders without errors
- 90 days of data points appear
- X-axis shows dates
- Y-axis ranges from 0-100
- Line is smooth and continuous
- Hovering shows tooltip with values

**✅ Action Items:**
- Actions generate based on health signals
- HIGH priority items show red background
- MEDIUM priority items show yellow background
- Reasons are specific and helpful
- If no actions needed, shows "good health" message

**✅ Interaction Timeline:**
- All interactions from last 30 days appear
- Sorted newest first (most recent at top)
- Each shows correct type badge (📞📧💬)
- Insight summaries are readable
- Sentiment and engagement scores display
- Churn risk badge appears when applicable
- Expansion badge appears when applicable
- Churn/expansion reasons show in detail

**✅ Loading States:**
- Skeletons appear while data loads
- Page doesn't freeze during load
- Data appears smoothly when ready

**✅ Error Handling:**
- Invalid account ID shows "Account not found"
- Network errors display appropriately

---

## Data Verification

### Compare Against Supabase

**Get account data:**
```sql
SELECT * FROM accounts WHERE sf_account_id = '001ACC003';
```

**Get current health:**
```sql
SELECT * FROM account_health_history 
WHERE sf_account_id = '001ACC003' 
AND DATE(created_at) = '2025-12-20';
```

**Get 90-day history:**
```sql
SELECT created_at, avg_sentiment 
FROM account_health_history 
WHERE sf_account_id = '001ACC003'
AND created_at >= '2025-09-21'
ORDER BY created_at ASC;
```

**Get recent interactions:**
```sql
SELECT * FROM interaction_insights
WHERE sf_account_id = '001ACC003'
AND created_at >= '2025-11-20'
ORDER BY created_at DESC;
```

**Dashboard should match this data exactly.**

---

## File Structure After Part 3

```
customer-success-dashboard/
├── app/
│   └── account/
│       └── [id]/
│           └── page.tsx              # ✅ COMPLETE
│
├── components/
│   └── account-detail/
│       ├── account-header.tsx        # ✅ NEW
│       ├── metrics-grid.tsx          # ✅ NEW
│       ├── health-trend-chart.tsx    # ✅ NEW
│       ├── action-items.tsx          # ✅ NEW
│       └── interaction-timeline.tsx  # ✅ NEW
│
├── lib/
│   └── supabase/
│       └── queries.ts                # ✅ UPDATED (1 new function)
│
└── hooks/
    └── use-account-detail.ts         # ✅ NEW
```

---

## Common Issues & Solutions

**Issue:** Chart doesn't render
**Solution:** Verify `healthHistory` array has data; check Recharts is imported correctly

**Issue:** No actions show
**Solution:** Check that `currentHealth` has triggering values (churn signals, inactivity, etc.)

**Issue:** Interactions timeline empty
**Solution:** Verify `interaction_insights` table has data for this account in last 30 days

**Issue:** Metrics show "0" for everything
**Solution:** Check that health history for Dec 20, 2025 exists for this account

**Issue:** "Account not found" error
**Solution:** Verify `sf_account_id` in URL matches an account in your database

**Issue:** Champion left warning not showing
**Solution:** Check `contacts` table - at least one contact needs `left_company = true`

**Issue:** Wrong account loads
**Solution:** Verify URL parameter extraction - should use `params.id` from Next.js

---

## What's Complete

After finishing Part 3, you have:

✅ **Foundation** (Part 1)
- Project setup
- Supabase connection
- Shared components
- Layout and navigation

✅ **Priority Tab** (Part 2)
- Filter cards
- Account list with signals
- Renewals filter
- Sorted by priority

✅ **Account Detail Page** (Part 3)
- Account header
- 7 metric cards
- 90-day health trend chart
- Auto-generated action items
- Interaction timeline

---

## Optional: Portfolio Tab (Not Covered)

If you want to build the Portfolio tab:
- Health distribution pie chart
- ARR breakdown bar chart
- Renewal calendar (next 10 renewals)
- Expansion opportunities list

**Similar pattern to Priority tab:**
1. Create query function in `lib/supabase/queries.ts`
2. Create React Query hook
3. Build chart components using Recharts
4. Assemble in `app/portfolio/page.tsx`

---

**END OF PART 3**

**END OF COMPLETE IMPLEMENTATION GUIDE**
