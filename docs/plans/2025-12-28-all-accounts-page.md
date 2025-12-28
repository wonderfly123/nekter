# All Accounts Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a sortable, filterable table view of all customer accounts with health scores, ARR, signals, search, and pagination.

**Architecture:** Reuse Priority page patterns (queries.ts, React Query hooks) but render as table instead of cards. Server-side pagination via new `/api/accounts/all` endpoint. URL-based state management for filters.

**Tech Stack:** Next.js 14, React Query, Supabase, Tailwind CSS, TypeScript

---

## Task 1: Database Query Function

**Files:**
- Modify: `dashboard/lib/supabase/queries.ts` (add at end)
- Reference: Line 20 (`getPriorityAccounts`) for pattern

**Step 1: Add TypeScript interfaces**

Add after existing interfaces in `queries.ts`:

```typescript
export interface AllAccountsFilters {
  page: number;
  limit: number;
  search?: string;
  healthStatus?: string[];
  sortBy?: 'name' | 'health_score' | 'arr' | 'renewal_date' | 'last_activity';
  sortOrder?: 'asc' | 'desc';
}

export interface AllAccountsResponse {
  accounts: AllAccount[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AllAccount {
  sf_account_id: string;
  name: string;
  health_status: string;
  health_score: number;
  arr: number | null;
  renewal_date: string | null;
  last_activity_date: string | null;
  churn_signals_count: number;
  expansion_signals_count: number;
}
```

**Step 2: Write getAllAccounts query function**

Add after `getPriorityAccounts` function:

```typescript
export async function getAllAccounts(
  filters: AllAccountsFilters
): Promise<AllAccountsResponse> {
  const { page, limit, search, healthStatus, sortBy = 'health_score', sortOrder = 'asc' } = filters;
  const offset = (page - 1) * limit;

  try {
    // 1. Get all latest health snapshots
    const { data: healthData, error: healthError } = await supabase
      .from('account_health_history')
      .select('health_status, health_score, trend, id, sf_account_id, created_at')
      .order('created_at', { ascending: false });

    if (healthError) throw healthError;
    if (!healthData || healthData.length === 0) {
      return { accounts: [], pagination: { total: 0, page, limit, totalPages: 0 } };
    }

    // Get most recent health record per account
    const latestHealthMap = new Map<string, AccountHealth>();
    healthData.forEach((h) => {
      if (!latestHealthMap.has(h.sf_account_id)) {
        latestHealthMap.set(h.sf_account_id, h);
      }
    });

    let accountIds = Array.from(latestHealthMap.keys());

    // 2. Filter by health status if specified
    if (healthStatus && healthStatus.length > 0) {
      accountIds = accountIds.filter((id) => {
        const health = latestHealthMap.get(id);
        return health && healthStatus.includes(health.health_status);
      });
    }

    // 3. Get account details
    let accountsQuery = supabase
      .from('accounts')
      .select('*')
      .in('sf_account_id', accountIds);

    // Apply search filter
    if (search) {
      accountsQuery = accountsQuery.ilike('name', `%${search}%`);
    }

    const { data: accounts, error: accountsError } = await accountsQuery;

    if (accountsError) throw accountsError;
    if (!accounts || accounts.length === 0) {
      return { accounts: [], pagination: { total: 0, page, limit, totalPages: 0 } };
    }

    // 4. Get renewal opportunities for all accounts
    const { data: renewals } = await supabase
      .from('opportunities')
      .select('sf_account_id, close_date')
      .in('sf_account_id', accounts.map(a => a.sf_account_id))
      .eq('type', 'Renewal')
      .eq('is_closed', false)
      .order('close_date', { ascending: true });

    const renewalMap = new Map(
      renewals?.map(r => [r.sf_account_id, r.close_date]) || []
    );

    // 5. Get signal counts from last 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const { data: insights } = await supabase
      .from('interaction_insights')
      .select('sf_account_id, signal_summary')
      .in('sf_account_id', accounts.map(a => a.sf_account_id))
      .gte('created_at', ninetyDaysAgo.toISOString());

    // Count signals per account
    const signalCounts = new Map<string, { churn: number; expansion: number }>();

    insights?.forEach((insight) => {
      if (!insight.signal_summary) return;

      const current = signalCounts.get(insight.sf_account_id) || { churn: 0, expansion: 0 };

      const churnSignals = ['churn_risk', 'disengaged', 'negative_sentiment'];
      const expansionSignals = ['expansion_opportunity', 'upsell_potential'];

      if (churnSignals.some(sig => insight.signal_summary.includes(sig))) {
        current.churn++;
      }
      if (expansionSignals.some(sig => insight.signal_summary.includes(sig))) {
        current.expansion++;
      }

      signalCounts.set(insight.sf_account_id, current);
    });

    // 6. Build result accounts
    let resultAccounts: AllAccount[] = accounts.map((account) => {
      const health = latestHealthMap.get(account.sf_account_id);
      const signals = signalCounts.get(account.sf_account_id) || { churn: 0, expansion: 0 };

      return {
        sf_account_id: account.sf_account_id,
        name: account.name,
        health_status: health?.health_status || 'Unknown',
        health_score: health?.health_score || 0,
        arr: account.arr,
        renewal_date: renewalMap.get(account.sf_account_id) || null,
        last_activity_date: account.last_activity_date,
        churn_signals_count: signals.churn,
        expansion_signals_count: signals.expansion,
      };
    });

    // 7. Sort results
    resultAccounts.sort((a, b) => {
      let aVal: any = a[sortBy];
      let bVal: any = b[sortBy];

      // Handle null values
      if (aVal === null) return 1;
      if (bVal === null) return -1;

      // Compare
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    // 8. Apply pagination
    const total = resultAccounts.length;
    const totalPages = Math.ceil(total / limit);
    const paginatedAccounts = resultAccounts.slice(offset, offset + limit);

    return {
      accounts: paginatedAccounts,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  } catch (error) {
    console.error('Error fetching all accounts:', error);
    throw error;
  }
}
```

**Step 3: Commit**

```bash
git add dashboard/lib/supabase/queries.ts
git commit -m "feat(data): add getAllAccounts query with filters and pagination"
```

---

## Task 2: API Endpoint

**Files:**
- Create: `dashboard/app/api/accounts/all/route.ts`

**Step 1: Create API route**

```typescript
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAllAccounts, type AllAccountsFilters } from '@/lib/supabase/queries';

// Create Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Verify user authentication
async function verifyAuth(authHeader: string | null) {
  if (!authHeader) {
    return { error: 'Unauthorized', status: 401 };
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return { error: 'Unauthorized', status: 401 };
  }

  return { user };
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const authCheck = await verifyAuth(authHeader);

    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { searchParams } = new URL(request.url);

    const filters: AllAccountsFilters = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      search: searchParams.get('search') || undefined,
      healthStatus: searchParams.get('status')?.split(',').filter(Boolean) || undefined,
      sortBy: (searchParams.get('sort') as any) || 'health_score',
      sortOrder: (searchParams.get('order') as 'asc' | 'desc') || 'asc',
    };

    const result = await getAllAccounts(filters);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in GET /api/accounts/all:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

**Step 2: Test API manually**

```bash
# In browser or with curl (after server restart):
# http://localhost:3000/api/accounts/all?page=1&limit=5
# Should return accounts with pagination
```

**Step 3: Commit**

```bash
git add dashboard/app/api/accounts/all/route.ts
git commit -m "feat(api): add /api/accounts/all endpoint with filters"
```

---

## Task 3: React Query Hook

**Files:**
- Create: `dashboard/hooks/use-all-accounts.ts`

**Step 1: Create hook**

```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';

interface UseAllAccountsParams {
  page: number;
  limit?: number;
  search?: string;
  status?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export function useAllAccounts(params: UseAllAccountsParams) {
  const { page, limit = 20, search, status, sortBy = 'health_score', sortOrder = 'asc' } = params;

  return useQuery({
    queryKey: ['all-accounts', page, limit, search, status, sortBy, sortOrder],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const searchParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sort: sortBy,
        order: sortOrder,
      });

      if (search) searchParams.set('search', search);
      if (status && status.length > 0) searchParams.set('status', status.join(','));

      const response = await fetch(`/api/accounts/all?${searchParams}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch accounts');
      }

      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

**Step 2: Commit**

```bash
git add dashboard/hooks/use-all-accounts.ts
git commit -m "feat(hooks): add useAllAccounts React Query hook"
```

---

## Task 4: AccountsTableRow Component

**Files:**
- Create: `dashboard/components/all-accounts/AccountsTableRow.tsx`

**Step 1: Create row component**

```typescript
'use client';

import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';

interface Account {
  sf_account_id: string;
  name: string;
  health_status: string;
  health_score: number;
  arr: number | null;
  renewal_date: string | null;
  last_activity_date: string | null;
  churn_signals_count: number;
  expansion_signals_count: number;
}

interface AccountsTableRowProps {
  account: Account;
}

export function AccountsTableRow({ account }: AccountsTableRowProps) {
  const router = useRouter();

  // Get initials for avatar
  const getInitials = (name: string) => {
    const words = name.split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Format currency
  const formatARR = (arr: number | null) => {
    if (arr === null) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(arr);
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Format relative time
  const formatRelativeTime = (dateString: string | null) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Get health badge colors
  const getHealthBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy':
        return 'bg-green-50 text-green-600';
      case 'at risk':
        return 'bg-orange-50 text-orange-600';
      case 'critical':
        return 'bg-red-50 text-red-600';
      default:
        return 'bg-gray-50 text-gray-600';
    }
  };

  // Get health score color
  const getHealthScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getHealthBarColor = (score: number) => {
    if (score >= 70) return 'bg-green-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <tr
      onClick={() => router.push(`/account/${account.sf_account_id}`)}
      className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
    >
      {/* Account Name */}
      <td className="py-4 px-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
            {getInitials(account.name)}
          </div>
          <span className="font-semibold text-gray-900">{account.name}</span>
        </div>
      </td>

      {/* Renewal Date */}
      <td className="py-4 px-6 text-sm text-gray-600">
        {formatDate(account.renewal_date)}
      </td>

      {/* Status */}
      <td className="py-4 px-6">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold ${getHealthBadgeClass(account.health_status)}`}>
          {account.health_status}
        </span>
      </td>

      {/* Health Score */}
      <td className="py-4 px-6">
        <div className="flex items-center gap-2">
          <span className={`font-semibold ${getHealthScoreColor(account.health_score)}`}>
            {account.health_score}
          </span>
          <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${getHealthBarColor(account.health_score)}`}
              style={{ width: `${account.health_score}%` }}
            />
          </div>
        </div>
      </td>

      {/* ARR */}
      <td className="py-4 px-6 text-sm font-semibold text-gray-900 text-right font-mono">
        {formatARR(account.arr)}
      </td>

      {/* Churn Signals */}
      <td className="py-4 px-6 text-center">
        {account.churn_signals_count > 0 ? (
          <span className="inline-flex items-center justify-center w-6 h-6 bg-red-100 text-red-600 text-xs font-bold rounded">
            {account.churn_signals_count}
          </span>
        ) : (
          <span className="text-gray-400">—</span>
        )}
      </td>

      {/* Expansion Signals */}
      <td className="py-4 px-6 text-center">
        {account.expansion_signals_count > 0 ? (
          <span className="inline-flex items-center justify-center w-6 h-6 bg-green-100 text-green-600 text-xs font-bold rounded">
            {account.expansion_signals_count}
          </span>
        ) : (
          <span className="text-gray-400">—</span>
        )}
      </td>

      {/* Last Activity */}
      <td className="py-4 px-6 text-sm text-gray-500">
        {formatRelativeTime(account.last_activity_date)}
      </td>

      {/* Actions */}
      <td className="py-4 px-6">
        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/account/${account.sf_account_id}`);
          }}
          className="inline-flex items-center gap-1 text-orange-600 hover:text-orange-700 font-medium text-sm transition-colors"
        >
          View
          <ChevronRight className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
}
```

**Step 2: Commit**

```bash
git add dashboard/components/all-accounts/AccountsTableRow.tsx
git commit -m "feat(components): add AccountsTableRow with all columns"
```

---

## Task 5: AccountsTable Component

**Files:**
- Create: `dashboard/components/all-accounts/AccountsTable.tsx`

**Step 1: Create table component**

```typescript
'use client';

import { AccountsTableRow } from './AccountsTableRow';

interface Account {
  sf_account_id: string;
  name: string;
  health_status: string;
  health_score: number;
  arr: number | null;
  renewal_date: string | null;
  last_activity_date: string | null;
  churn_signals_count: number;
  expansion_signals_count: number;
}

interface AccountsTableProps {
  accounts: Account[];
  loading?: boolean;
}

export function AccountsTable({ accounts, loading }: AccountsTableProps) {
  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Account Name</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Renewal Date</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Health Score</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">ARR</th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Churn Signals</th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Expansion Signals</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Last Activity</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i} className="border-b border-gray-100">
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gray-200 rounded-lg animate-pulse" />
                    <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                  </div>
                </td>
                <td className="py-4 px-6">
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                </td>
                <td className="py-4 px-6">
                  <div className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
                </td>
                <td className="py-4 px-6">
                  <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                </td>
                <td className="py-4 px-6">
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse ml-auto" />
                </td>
                <td className="py-4 px-6">
                  <div className="h-6 w-6 bg-gray-200 rounded animate-pulse mx-auto" />
                </td>
                <td className="py-4 px-6">
                  <div className="h-6 w-6 bg-gray-200 rounded animate-pulse mx-auto" />
                </td>
                <td className="py-4 px-6">
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                </td>
                <td className="py-4 px-6">
                  <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <div className="text-center py-12">
          <svg
            className="w-12 h-12 mx-auto text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No accounts found</h3>
          <p className="text-gray-600">Try adjusting your search or filters</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Account Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Renewal Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Health Score
            </th>
            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
              ARR
            </th>
            <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Churn Signals (90D)
            </th>
            <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Expansion Signals (90D)
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Last Activity
            </th>
            <th className="px-6 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((account) => (
            <AccountsTableRow key={account.sf_account_id} account={account} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add dashboard/components/all-accounts/AccountsTable.tsx
git commit -m "feat(components): add AccountsTable with loading and empty states"
```

---

## Task 6: AccountsToolbar Component

**Files:**
- Create: `dashboard/components/all-accounts/AccountsToolbar.tsx`

**Step 1: Create toolbar component**

```typescript
'use client';

import { Search, Filter, ArrowUpDown } from 'lucide-react';

interface AccountsToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: string[];
  onStatusFilterChange: (status: string[]) => void;
  sortBy: string;
  onSortChange: (sortBy: string) => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: (order: 'asc' | 'desc') => void;
}

export function AccountsToolbar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortBy,
  onSortChange,
  sortOrder,
  onSortOrderChange,
}: AccountsToolbarProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 shadow-sm">
      <div className="flex gap-4 items-center">
        {/* Search Box */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search accounts..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <select
            value={statusFilter[0] || 'all'}
            onChange={(e) => {
              const value = e.target.value;
              onStatusFilterChange(value === 'all' ? [] : [value]);
            }}
            className="pl-3 pr-10 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none bg-white min-w-[140px]"
          >
            <option value="all">All Statuses</option>
            <option value="Healthy">Healthy</option>
            <option value="At Risk">At Risk</option>
            <option value="Critical">Critical</option>
          </select>
          <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>

        {/* Sort Dropdown */}
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="pl-3 pr-10 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none bg-white min-w-[160px]"
          >
            <option value="name">Account Name</option>
            <option value="health_score">Health Score</option>
            <option value="arr">ARR</option>
            <option value="renewal_date">Renewal Date</option>
            <option value="last_activity">Last Activity</option>
          </select>
          <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>

        {/* Sort Order Toggle */}
        <button
          onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
        >
          {sortOrder === 'asc' ? '↑' : '↓'}
        </button>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add dashboard/components/all-accounts/AccountsToolbar.tsx
git commit -m "feat(components): add AccountsToolbar with search, filter, sort"
```

---

## Task 7: Main All Accounts Page

**Files:**
- Modify: `dashboard/app/all-accounts/page.tsx`

**Step 1: Replace placeholder with real implementation**

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/auth/auth-guard';
import { PageContainer } from '@/components/layout/page-container';
import { AccountsTable } from '@/components/all-accounts/AccountsTable';
import { AccountsToolbar } from '@/components/all-accounts/AccountsToolbar';
import { Pagination } from '@/components/shared/pagination';
import { useAllAccounts } from '@/hooks/use-all-accounts';

export default function AllAccountsPage() {
  return (
    <AuthGuard>
      <AllAccountsContent />
    </AuthGuard>
  );
}

function AllAccountsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read state from URL
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  const [statusFilter, setStatusFilter] = useState<string[]>(
    searchParams.get('status')?.split(',').filter(Boolean) || []
  );
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'health_score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(
    (searchParams.get('order') as 'asc' | 'desc') || 'asc'
  );

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // Reset to page 1 on search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (statusFilter.length > 0) params.set('status', statusFilter.join(','));
    params.set('sort', sortBy);
    params.set('order', sortOrder);

    router.push(`/all-accounts?${params.toString()}`, { scroll: false });
  }, [page, debouncedSearch, statusFilter, sortBy, sortOrder, router]);

  // Fetch accounts
  const { data, isLoading, error } = useAllAccounts({
    page,
    limit: 20,
    search: debouncedSearch || undefined,
    status: statusFilter.length > 0 ? statusFilter : undefined,
    sortBy,
    sortOrder,
  });

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (error) {
    return (
      <PageContainer>
        <div className="text-center py-12">
          <svg
            className="w-12 h-12 mx-auto text-red-500 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load accounts</h3>
          <p className="text-gray-600 mb-4">There was an error loading the accounts data</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">All Accounts</h1>
        <p className="text-gray-600">Manage and monitor your customer accounts</p>
      </div>

      <AccountsToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        sortBy={sortBy}
        onSortChange={setSortBy}
        sortOrder={sortOrder}
        onSortOrderChange={setSortOrder}
      />

      <AccountsTable accounts={data?.accounts || []} loading={isLoading} />

      {data && data.pagination.totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={page}
            totalPages={data.pagination.totalPages}
            totalItems={data.pagination.total}
            itemsPerPage={20}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </PageContainer>
  );
}
```

**Step 2: Test in browser**

```bash
# Navigate to http://localhost:3000/all-accounts
# Should see accounts table with search, filter, sort, and pagination
```

**Step 3: Commit**

```bash
git add dashboard/app/all-accounts/page.tsx
git commit -m "feat(pages): implement All Accounts page with full functionality"
```

---

## Task 8: Final Testing & Polish

**Step 1: Test search functionality**
- Type in search box, wait 300ms
- Verify URL updates with `?search=`
- Verify results filter

**Step 2: Test status filter**
- Change status dropdown
- Verify URL updates with `?status=`
- Verify results filter

**Step 3: Test sorting**
- Change sort dropdown
- Toggle sort order button
- Verify URL updates with `?sort=` and `?order=`
- Verify results reorder

**Step 4: Test pagination**
- Click page numbers
- Click prev/next buttons
- Verify URL updates with `?page=`
- Verify page shows correct accounts

**Step 5: Test navigation**
- Click account row
- Verify navigates to `/account/{id}`
- Click "View" button
- Verify navigates to `/account/{id}`

**Step 6: Test responsive behavior**
- Resize browser to tablet width
- Verify table still usable
- Resize to mobile
- Verify horizontal scroll works

**Step 7: Final commit**

```bash
git add -A
git commit -m "feat: complete All Accounts page implementation

- Sortable table with 9 columns
- Real-time search with debounce
- Filter by health status
- Sort by multiple columns
- Server-side pagination (20 per page)
- Signal counting from interaction insights
- Matches existing app styling
- Fully responsive

Closes #[issue-number]"
```

---

## Success Criteria Checklist

- [ ] Shows all accounts in sortable table format
- [ ] Search filters accounts in real-time (300ms debounce)
- [ ] Filter by health status works (Healthy, At Risk, Critical)
- [ ] Sort by any column works (name, health, ARR, renewal, activity)
- [ ] Pagination handles accounts smoothly (20 per page)
- [ ] Clicking account navigates to detail page
- [ ] Matches existing app design patterns (colors, spacing, typography)
- [ ] Responsive on all screen sizes (desktop, tablet, mobile)
- [ ] Loading states are smooth (skeleton rows)
- [ ] Error states are handled gracefully (retry button)
- [ ] URL state management works (shareable filtered views)
- [ ] Signal counting accurate (churn and expansion from last 90 days)

---

## Notes

- **DRY:** Reuses existing Pagination component, health badge styling, avatar patterns
- **YAGNI:** No over-engineered features - just MVP as specified
- **TDD:** Not applicable for UI-heavy work, but manual testing checklist provided
- **Frequent commits:** 8 commit points throughout implementation

**Estimated Time:** 2-3 hours for complete implementation
