# Customer Success Command Center - Implementation Plan

**Date:** December 22, 2025
**Demo Date:** December 18, 2025
**Status:** In Progress - Part 2 Complete ✅
**Progress:** 2 of 3 parts complete (67%)

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

### Part 3: Account Detail Page (90-120 min)
- [ ] Account detail query (6 parallel queries)
- [ ] Account header component
- [ ] 7 metric cards grid
- [ ] 90-day health trend chart
- [ ] Auto-generated action items
- [ ] Interaction timeline (30 days)

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

## Pages to Build

1. `/priority` - Priority accounts view (Critical + At Risk)
2. `/account/[id]` - Account detail page
3. `/portfolio` - Portfolio overview (placeholder for now)
4. `/all-accounts` - All accounts (placeholder)
5. `/team` - Team performance (placeholder)

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
- [ ] Account detail page loads with all metrics
- [ ] Health trend chart displays 90 days
- [ ] Action items generate correctly
- [ ] Interaction timeline shows recent activity
