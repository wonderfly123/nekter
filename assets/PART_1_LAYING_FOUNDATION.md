# Customer Success Dashboard - Part 1: Laying Foundation

## Overview

Set up the Next.js project, connect to your existing Supabase database, and build reusable components that all pages will share.

**Goal:** Have a working app skeleton with navigation, shared utilities, and database connection before building any functional pages.

---

## Phase 1: Project Setup

### Initialize Next.js Project
- Create new Next.js 14 app with TypeScript and Tailwind CSS
- Use App Router (not Pages Router)
- No src/ directory - use root-level app/ folder

### Install Dependencies
**UI Libraries:**
- Radix UI primitives (headless components)
- shadcn/ui (pre-built components)
- Lucide React (icons)
- Tailwind CSS (styling)

**State & Data:**
- TanStack Query (React Query) - handles data fetching from Supabase
- Zustand - simple state management for filters
- Supabase JS client - connects to your database

**Utilities:**
- Recharts - for portfolio charts
- date-fns - date formatting

### Setup shadcn/ui
- Initialize shadcn with default theme
- Install required components: button, card, badge, tabs, tooltip, dialog, dropdown

### Environment Variables
Create `.env.local` with:
- Supabase URL (from your project)
- Supabase anon key (from your project)
- Demo date: December 20, 2025
- Demo mode: true

---

## Phase 2: Connect to Supabase

### Supabase Client
**File:** `lib/supabase/client.ts`

Create a Supabase client using your environment variables. This singleton instance will be imported by all query functions.

**Purpose:** Single point of connection to your database.

### TypeScript Types
**File:** `lib/supabase/types.ts`

Define TypeScript interfaces that match your Supabase tables:

**Core Database Tables:**
- `Account` - matches accounts table
- `AccountHealth` - matches account_health_history table
- `InteractionInsight` - matches interaction_insights table
- `Opportunity` - matches opportunities table
- `Contact` - matches contacts table

**Helper Types:**
- `HealthStatus` - 'Healthy' | 'At Risk' | 'Critical'
- `TrendStatus` - 'Improving' | 'Declining' | 'Stable' | null

**Composite Types (for UI):**
- `PriorityAccount` - Account + current health + top signals
- `PortfolioStats` - Aggregated counts and ARR totals by status
- `AccountDetailData` - Account + health history + interactions + metrics

### Test Connection
**File:** `app/api/health/route.ts`

Create a simple API endpoint that queries Supabase to verify connection works.

**Test:** Visit `/api/health` - should return `{"status":"ok"}`

---

## Phase 3: Core Utilities

### Demo Date Configuration
**File:** `lib/config/demo.ts`

**Functions:**
- `getCurrentDate()` - Returns Dec 20, 2025 in demo mode, or real date in production
- `calculateDaysSince(date)` - Calculates days between given date and "current" date

**Why:** All date calculations throughout the app use this to maintain consistency with your test data.

### Health Calculations
**File:** `lib/utils/health-calculations.ts`

**Functions:**
- `getHealthStatusColor(status)` - Returns Tailwind classes for health badge colors
- `getHealthStatusIcon(status)` - Returns emoji (🔴🟡🟢)
- `getTrendIcon(trend)` - Returns arrow (↑↓→)
- `getTrendText(trend)` - Returns text ("Improving", "Declining", "Stable")
- `getTrendColor(trend)` - Returns Tailwind color classes
- `calculatePriorityScore(arr, status)` - ARR × multiplier (Critical=2x, At Risk=1x)
- `getTopSignals(health, interactions)` - Extracts top 2 signals to display on cards

**Purpose:** Centralize all health-related display logic so it's consistent everywhere.

### Formatting Utilities
**File:** `lib/utils/formatters.ts`

**Functions:**
- `formatCurrency(450000)` → "$450,000"
- `formatCompactCurrency(450000)` → "$450K"
- `formatCompactCurrency(1500000)` → "$1.5M"
- `formatNumber(1234567)` → "1,234,567"
- `formatPercentage(87.5)` → "88%"

### Date Utilities
**File:** `lib/utils/date-utils.ts`

**Functions:**
- `formatDate(date)` → "Dec 9, 2025"
- `formatRelativeDate(date)` → "32 days ago"
- `formatDaysAgo(11)` → "11d ago"

**Uses:** date-fns library + your demo date configuration

---

## Phase 4: Shared UI Components

### Health Badge Component
**File:** `components/shared/health-badge.tsx`

**Display:**
- 🔴 Critical (red background)
- 🟡 At Risk (yellow background)
- 🟢 Healthy (green background)

**Props:**
- `status` - which health status to display
- `size` - sm, md, or lg

**Used in:** Priority cards, account detail header, portfolio charts

### Trend Indicator Component
**File:** `components/shared/trend-indicator.tsx`

**Display:**
- ↑ Improving (green text)
- ↓ Declining (red text)
- → Stable (gray text)
- — N/A (gray text)

**Props:**
- `trend` - which trend to display
- `showText` - whether to show text label next to arrow

**Used in:** Priority cards, account detail header

### Loading Skeletons
**File:** `components/shared/loading-skeleton.tsx`

**Components:**
- `CardSkeleton` - animated placeholder for account cards
- `StatCardSkeleton` - animated placeholder for stat cards
- `ChartSkeleton` - animated placeholder for charts

**Purpose:** Show users something is loading instead of blank page

---

## Phase 5: Layout Components

### React Query Provider
**File:** `app/providers.tsx`

Wraps the entire app to enable React Query for data fetching.

**Configuration:**
- Stale time: 1 minute (data is considered fresh for 60 seconds)
- Refetch on window focus: disabled
- Automatic retries on failure

### App Header
**File:** `components/layout/app-header.tsx`

**Display:**
- Left: "Customer Success Command Center" title
- Right: "Demo Mode: Dec 20, 2025" label

**Styling:** White background, bottom border, fixed height

### Tab Navigation
**File:** `components/layout/tab-navigation.tsx`

**Tabs:**
1. Priority
2. Portfolio
3. All Accounts (placeholder)
4. Team Performance (placeholder)

**Behavior:**
- Highlights current active tab
- Uses Next.js Link for navigation
- Reads current pathname to determine active tab

### Page Container
**File:** `components/layout/page-container.tsx`

**Purpose:** Consistent wrapper for all pages

**Features:**
- Max width container
- Consistent padding
- Optional title and description props

**Usage:** Every page wraps its content in this component

### Root Layout
**File:** `app/layout.tsx`

**Structure:**
```
<html>
  <body>
    <Providers>
      <AppHeader />
      <TabNavigation />
      <main>{children}</main>
    </Providers>
  </body>
</html>
```

**Purpose:** Defines the overall app structure that appears on every page

### Home Page Redirect
**File:** `app/page.tsx`

Simply redirects from `/` to `/priority` automatically.

---

## Phase 6: State Management Setup

### React Query Hooks (Placeholder)
**Files to create:**
- `hooks/use-priority-accounts.ts`
- `hooks/use-dashboard-stats.ts`
- `hooks/use-portfolio-data.ts`
- `hooks/use-account-detail.ts`

**Purpose:** Each hook encapsulates a specific data fetching operation

**Pattern:**
- Takes parameters (like account ID, filter options)
- Returns: `{ data, isLoading, error }` from React Query
- Handles caching automatically

**Note:** You'll implement these in Parts 2 and 3.

### Zustand Store
**File:** `lib/stores/filter-store.ts`

**State:**
- `showRenewalsOnly` - boolean

**Actions:**
- `setShowRenewalsOnly(value)` - updates the filter

**Purpose:** Manages the renewals filter toggle on Priority tab

**Why Zustand:** Simple, lightweight state management without Redux boilerplate

---

## Phase 7: Placeholder Pages

Create simple placeholder pages so navigation works:

### All Accounts Page
**File:** `app/all-accounts/page.tsx`

Shows: 🚧 "Coming Soon" message

### Team Performance Page
**File:** `app/team/page.tsx`

Shows: 📊 "Coming Soon" message

**Purpose:** Tab navigation won't break with 404s, but these pages don't have real functionality yet.

---

## Testing the Foundation

### Verify Setup Checklist
After completing this part, you should have:

**✅ Project runs without errors:**
```bash
npm run dev
# Visit http://localhost:3000
```

**✅ Supabase connection works:**
- Visit `http://localhost:3000/api/health`
- Should return: `{"status":"ok","message":"Connected to Supabase"}`

**✅ Navigation works:**
- All 4 tabs are clickable
- Priority and Portfolio go to empty pages (not built yet)
- All Accounts and Team Performance show "Coming Soon"

**✅ Layout renders:**
- Header appears with title
- Tab navigation appears below header
- Demo date shows in header

**✅ Shared components work:**
- Import `HealthBadge` component somewhere
- Should render colored badge with emoji

---

## File Structure After Part 1

```
customer-success-dashboard/
├── app/
│   ├── layout.tsx                    # Root layout ✅
│   ├── page.tsx                      # Redirect to /priority ✅
│   ├── providers.tsx                 # React Query provider ✅
│   ├── api/health/route.ts           # Test endpoint ✅
│   ├── priority/page.tsx             # Empty (build in Part 2)
│   ├── portfolio/page.tsx            # Empty (build later)
│   ├── account/[id]/page.tsx         # Empty (build in Part 3)
│   ├── all-accounts/page.tsx         # Placeholder ✅
│   └── team/page.tsx                 # Placeholder ✅
│
├── components/
│   ├── ui/                           # shadcn components ✅
│   ├── layout/
│   │   ├── app-header.tsx           # Header ✅
│   │   ├── tab-navigation.tsx       # Tabs ✅
│   │   └── page-container.tsx       # Wrapper ✅
│   └── shared/
│       ├── health-badge.tsx         # Health status badge ✅
│       ├── trend-indicator.tsx      # Trend arrow ✅
│       └── loading-skeleton.tsx     # Loading states ✅
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                # Supabase client ✅
│   │   ├── queries.ts               # Empty (build in Parts 2 & 3)
│   │   └── types.ts                 # TypeScript types ✅
│   ├── config/
│   │   └── demo.ts                  # Demo date config ✅
│   ├── utils/
│   │   ├── health-calculations.ts   # Health helpers ✅
│   │   ├── date-utils.ts            # Date formatters ✅
│   │   └── formatters.ts            # Number/currency formatters ✅
│   └── stores/
│       └── filter-store.ts          # Zustand store ✅
│
├── hooks/
│   ├── use-priority-accounts.ts     # Empty (build in Part 2)
│   ├── use-dashboard-stats.ts       # Empty (build in Part 2)
│   ├── use-portfolio-data.ts        # Empty (build later)
│   └── use-account-detail.ts        # Empty (build in Part 3)
│
└── .env.local                        # Environment variables ✅
```

---

## What's Next

**Part 2: Priority Tab** will build:
- Database queries for priority accounts
- Filter cards (CRITICAL / AT RISK / RENEWALS)
- Account cards with signals
- Renewals filter functionality

**Part 3: Account Detail Page** will build:
- Account header with health status
- 7 metric cards
- Health trend chart
- Action items
- Interaction timeline

---

## Common Issues & Solutions

**Issue:** Supabase connection fails
**Solution:** Double-check your `.env.local` has correct URL and anon key from Supabase dashboard

**Issue:** shadcn components not found
**Solution:** Make sure you ran `npx shadcn-ui@latest add button card badge tabs tooltip`

**Issue:** Type errors on Supabase queries
**Solution:** TypeScript types in `lib/supabase/types.ts` must exactly match your database schema

**Issue:** Demo date not working
**Solution:** Verify `NEXT_PUBLIC_IS_DEMO_MODE=true` in `.env.local`

---

**END OF PART 1**
