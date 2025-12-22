# Customer Success Command Center - Implementation Plan

**Date:** December 22, 2025
**Demo Date:** December 18, 2025
**Status:** In Progress

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

### Part 1: Foundation (45-60 min)
- [ ] Project initialization
- [ ] Supabase connection
- [ ] Core utilities and helpers
- [ ] Shared UI components
- [ ] Layout and navigation
- [ ] Test connection endpoint

### Part 2: Priority Tab (60-90 min)
- [ ] Database queries for priority accounts
- [ ] Filter cards (Critical, At Risk, Renewals)
- [ ] Account card component
- [ ] Account list with signals
- [ ] Renewals filter functionality
- [ ] Priority scoring and sorting

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

- [ ] All tabs navigate correctly
- [ ] Priority tab shows sorted accounts with health signals
- [ ] Renewals filter works
- [ ] Account detail page loads with all metrics
- [ ] Health trend chart displays 90 days
- [ ] Action items generate correctly
- [ ] Interaction timeline shows recent activity
- [ ] Demo date (Dec 18, 2025) is used throughout
