# Customer Success Command Center - Implementation Plan

**Date:** December 22, 2025 (Updated: December 23, 2025)
**Demo Date:** December 18, 2025
**Status:** In Progress - Part 4 Complete ✅
**Progress:** 4 of 5 parts complete (80%)

## Overview

Building a Next.js 14 Customer Success dashboard that connects to existing Supabase database to help CSMs monitor account health, prioritize at-risk accounts, and track customer interactions.

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (existing database)
- TanStack Query (React Query)
- Zustand (state management)
- Recharts (charts)
- date-fns (date utilities)

## Key Design Decisions

1. **Demo Date**: December 18, 2025 - All date calculations use this as "today"
2. **Signal Priority**: Sentiment > Churn > Tickets > Inactivity (sentiment is most important)
3. **Priority Scoring**: Critical accounts get 2x ARR multiplier for sorting
4. **Caching**: React Query with 1-5 minute stale times

## Implementation Phases

### Part 1: Foundation ✅ COMPLETE
- [x] Project initialization (Next.js 14 + TypeScript + Tailwind)
- [x] Dependencies installed (shadcn/ui, Supabase, React Query, Zustand, Recharts, date-fns)
- [x] Supabase client created (`lib/supabase/client.ts`)
- [x] TypeScript types defined (`lib/supabase/types.ts`)
- [x] Demo date utilities (`lib/config/demo.ts` - Dec 18, 2025)
- [x] Health calculation utilities (`lib/utils/health-calculations.ts` - Sentiment > Churn > Tickets > Inactivity)
- [x] Formatters (`lib/utils/formatters.ts` - currency, numbers, percentages)
- [x] Date utilities (`lib/utils/date-utils.ts`)
- [x] Shared components:
  - [x] HealthBadge (`components/shared/health-badge.tsx`)
  - [x] TrendIndicator (`components/shared/trend-indicator.tsx`)
  - [x] Loading skeletons (`components/shared/loading-skeleton.tsx`)
- [x] Layout components:
  - [x] AppHeader (`components/layout/app-header.tsx`)
  - [x] TabNavigation (`components/layout/tab-navigation.tsx`)
  - [x] PageContainer (`components/layout/page-container.tsx`)
- [x] React Query provider (`app/providers.tsx`)
- [x] Root layout updated (`app/layout.tsx`)
- [x] Home page redirect (`app/page.tsx` → `/priority`)
- [x] Test API endpoint (`app/api/health/route.ts`) ✅ Connection verified
- [x] Zustand filter store (`lib/stores/filter-store.ts`)
- [x] Placeholder pages created (all-accounts, team, priority, portfolio, account/[id])

**Files Created:** 25+ files
**Server Status:** ✅ Running at http://localhost:3000
**Supabase Connection:** ✅ Verified via /api/health endpoint

### Part 2: Priority Tab ✅ COMPLETE
- [x] Database queries implemented (`lib/supabase/queries.ts`)
  - [x] `getPriorityAccounts()` - fetches Critical & At Risk with health data
  - [x] `getDashboardStats()` - aggregates counts and ARR by status
  - [x] Queries use demo date and support renewals filtering
- [x] React Query hooks (`hooks/`)
  - [x] `usePriorityAccounts()` - manages priority accounts with caching
  - [x] `useDashboardStats()` - manages dashboard stats with caching
- [x] Filter cards component (`components/priority/filter-cards.tsx`)
  - [x] Critical card (red) with count and ARR
  - [x] At Risk card (yellow) with count and ARR
  - [x] Renewals card (clickable) with 90-day filter toggle
- [x] Account card component (`components/priority/account-card.tsx`)
  - [x] Compact view: health badge, name, ARR, CSM, health score, trend
  - [x] Top 2 signals displayed (Sentiment > Churn > Tickets > Inactivity)
  - [x] Expandable details: health status, risk signals, recent activity
  - [x] Click card to expand, click name to navigate
- [x] Account list component (`components/priority/account-list.tsx`)
- [x] Pagination component (`components/shared/pagination.tsx`)
  - [x] Shows 5 accounts per page
  - [x] Prev/Next navigation with page numbers
- [x] Priority scoring (Critical = 2x ARR, At Risk = 1x ARR)
- [x] Renewals filter functionality (90-day window)

**Files Created:** 7 files (queries, hooks, components)
**Features Working:** Filter cards, expandable account cards, pagination, renewals toggle

### Part 3: Account Detail Page ✅ COMPLETE
- [x] Account detail query (`getAccountDetail()` - 8 parallel queries)
- [x] Account header component (`components/account/account-header.tsx`)
- [x] 6 metric cards grid (`components/account/metrics-grid.tsx`)
- [x] 90-day health trend chart (`components/account/health-trend-chart.tsx`)
- [x] Auto-generated action items (`components/account/action-items.tsx`)
- [x] Interaction timeline (`components/account/interaction-timeline.tsx`)
- [x] Account tabs component with Overview, Contacts, Tickets, Opportunities (`components/account/account-tabs.tsx`)

**Files Created:** 6 components + updated queries
**Features Working:** Full account detail page with all metrics, health trends, action items, and tabbed sections

### Part 4: Metrics Refactoring ✅ COMPLETE
- [x] Created metrics calculation utility (`lib/utils/metrics-calculations.ts`)
- [x] Separated database fields (health_score, trend) from calculated metrics
- [x] Updated `AccountHealth` type to use `health_score` instead of `avg_sentiment`
- [x] Refactored `getPriorityAccounts()` to calculate metrics on-the-fly
- [x] Refactored `getAccountDetail()` to calculate metrics on-the-fly
- [x] Updated all components to use new calculated metrics structure
- [x] Created SQL script for health_score population (`scripts/populate-health-scores.sql`)
- [x] Fixed sidebar CSM bubble collapse behavior

**Key Changes:**
- Metrics now calculated from source data: avgSentiment (from interaction_insights), interactionCount, churnSignals, expansionSignals, openTicketCount, daysSinceActivity
- Database stores only: health_status, health_score, trend
- Consistent 90-day time windows across all metrics

### Part 5: Portfolio Tab (In Progress)
**Purpose:** High-level executive dashboard with CSM filtering

**Components to Build:**
- [ ] Portfolio stats query (`getPortfolioStats()`)
  - Total ARR with account count
  - Average health score (portfolio average)
  - Churn risk % = (Critical ARR + At Risk ARR) / Total ARR × 100
- [ ] Health history query (`getPortfolioHealthHistory()`)
  - 90-day timeline for average health score chart
- [ ] Renewal forecast query (`getRenewalForecast()`)
  - Health status breakdown of accounts with renewals in next 90 days
- [ ] Portfolio stats cards (`components/portfolio/stats-cards.tsx`)
- [ ] Health score distribution chart (`components/portfolio/health-score-chart.tsx`)
  - Time series showing average health score over time
  - Filter buttons: 90D / 30D / 7D
- [ ] Renewal forecast chart (`components/portfolio/renewal-forecast.tsx`)
  - Horizontal bars showing Healthy/At Risk/Critical breakdown
  - Shows ARR and percentages for each status
- [ ] CSM filter dropdown (`components/portfolio/csm-filter.tsx`)
- [ ] React Query hooks (`hooks/usePortfolioStats.ts`, `usePortfolioHealthHistory.ts`, `useRenewalForecast.ts`)
- [ ] Portfolio page (`app/portfolio/page.tsx`)

**Design Decisions:**
- **Hybrid query approach**: 3 focused queries (stats, health history, renewals) for balanced caching
- **CSM filter only**: Keep filtering simple, show all CSMs by default
- **90-day renewal window**: Matches Priority tab behavior
- **Time series chart**: Shows portfolio health trend over time (not histogram)
- **ARR-based churn risk**: More meaningful than account count for business decisions

## Database Schema (Existing)

**Core Tables:**
- `accounts` - Customer companies
- `account_health_history` - Daily health snapshots
- `interaction_insights` - AI-analyzed interactions
- `opportunities` - Sales opportunities/renewals
- `contacts` - Customer contacts
- `zendesk_tickets` - Support tickets
- `call_transcripts` - Call data
- `email_threads` - Email data

## Pages Status

1. ✅ `/priority` - Priority accounts view (Critical + At Risk) - **COMPLETE**
2. ✅ `/account/[id]` - Account detail page - **COMPLETE**
3. 🚧 `/portfolio` - Portfolio overview - **IN PROGRESS**
4. `/all-accounts` - All accounts (future)
5. `/analytics` - Analytics dashboard (future)

## Success Criteria

**Foundation (Part 1):**
- [x] All tabs navigate correctly
- [x] Supabase connection established and verified
- [x] Demo date (Dec 18, 2025) configured
- [x] Layout and navigation working
- [x] Shared components created and ready

**Priority Tab (Part 2):**
- [x] Priority tab shows sorted accounts with health signals
- [x] Renewals filter works
- [x] Account cards expand to show detailed information
- [x] Pagination displays with prev/next controls
- [x] Filter cards show real-time stats from database

**Account Detail (Part 3):**
- [x] Account detail page loads with all metrics
- [x] Health trend chart displays 90 days
- [x] Action items generate correctly
- [x] Interaction timeline shows recent activity
- [x] Tabbed sections work (Overview, Contacts, Tickets, Opportunities)

**Metrics Refactoring (Part 4):**
- [x] Metrics calculated on-the-fly from source data
- [x] Consistent 90-day time windows
- [x] Priority tab and Account Detail both use new structure
- [x] No NaN or N/A values in UI

**Portfolio Tab (Part 5):**
- [ ] Portfolio page shows aggregate stats (Total ARR, Avg Health Score, Churn Risk)
- [ ] CSM filter works correctly
- [ ] Health score distribution chart shows time series
- [ ] Renewal forecast chart shows health breakdown
- [ ] All metrics update when CSM filter changes
