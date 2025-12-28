# All Accounts Page - Design Document

**Created:** 2025-12-28
**Status:** Approved - Ready for Implementation

## Overview

Implement a comprehensive "All Accounts" page featuring a sortable, filterable table view of all customer accounts with health scores, ARR, signals, and pagination. Follows existing app design patterns from the Priority page.

## Design Approach

**Selected:** Approach 1 - Adapt Priority Page Pattern

Reuse the Priority page structure (hooks, queries, layout) but render accounts in a table instead of cards. This approach:
- Leverages proven patterns and existing code
- Maintains consistency with current architecture
- Delivers fastest time to implementation (~2-3 hours)
- Reuses health calculations, signal counting, filtering logic

## Section 1: Data Layer & API

### Database Query

**Function:** `getAllAccounts(filters)` in `lib/supabase/queries.ts`

**Parameters:**
```typescript
{
  page: number,
  limit: number,
  search?: string,           // Account name search
  healthStatus?: string[],   // Filter by health status
  sortBy?: string,          // Column to sort by
  sortOrder?: 'asc' | 'desc'
}
```

**Data Sources:**
- `accounts` table - All accounts (not just Critical/At Risk)
- `account_health_history` - Latest health snapshot per account
- `interaction_insights` - Last 90 days for signal counting
- `opportunities` - Renewal opportunities (type='Renewal', is_closed=false)

**Signal Calculation:**
Count occurrences in `interaction_insights.signal_summary`:
- **Churn signals:** 'churn_risk', 'disengaged', 'negative_sentiment'
- **Expansion signals:** 'expansion_opportunity', 'upsell_potential'

### API Endpoint

**Route:** `GET /api/accounts/all`

**Query Parameters:**
- `page` - Current page number
- `limit` - Items per page (default: 20)
- `search` - Search term for account name
- `status` - Health status filter (comma-separated)
- `sort` - Column to sort by
- `order` - Sort direction (asc/desc)

**Response:**
```json
{
  "accounts": [
    {
      "sf_account_id": "001ACC003",
      "name": "DataCore Solutions",
      "health_status": "At Risk",
      "health_score": 42,
      "arr": 420000,
      "renewal_date": "2025-03-15",
      "last_activity_date": "2025-12-26",
      "churn_signals_count": 3,
      "expansion_signals_count": 1
    }
  ],
  "pagination": {
    "total": 147,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

## Section 2: Component Architecture

### File Structure

```
/app/all-accounts/page.tsx          ← Main page with AuthGuard
/components/all-accounts/
  ├── AccountsTable.tsx              ← Main table wrapper
  ├── AccountsTableRow.tsx           ← Individual row component
  ├── AccountsTableHeader.tsx        ← Sortable column headers
  ├── AccountsToolbar.tsx            ← Search + Filter + Sort controls
  └── AccountsPagination.tsx         ← Page controls (reuse existing)
```

### AccountsTable Component

**Responsibilities:**
- Renders HTML `<table>` with fixed headers
- Maps accounts to `AccountsTableRow` components
- Handles loading state (skeleton rows)
- Handles empty state ("No accounts found")
- Follows existing app styling

**Key Features:**
- Sticky header on scroll
- Hover states on rows
- Click row to navigate to account detail

### AccountsTableRow Component

**Table Columns (in order):**

1. **Account Name**
   - Avatar with initials (2 letters, orange gradient)
   - Account name text
   - Click entire cell to navigate to `/account/{id}`

2. **Renewal Date**
   - Format: "Mar 15, 2025"
   - From opportunities.close_date
   - Shows "—" if no renewal opportunity

3. **Status**
   - Badge component matching Priority page
   - Colors: Healthy (green), At Risk (orange), Critical (red)

4. **Health Score**
   - Number display (0-100)
   - Progress bar visualization
   - Color coded: >70 green, 40-70 orange, <40 red

5. **ARR**
   - Formatted currency: "$420,000"
   - Right-aligned
   - Monospace font for number alignment

6. **Churn Signals (90D)**
   - Red count badge if > 0
   - Shows "—" if 0

7. **Expansion Signals (90D)**
   - Green count badge if > 0
   - Shows "—" if 0

8. **Last Activity**
   - Relative time: "2 days ago", "1 hour ago", "Yesterday"
   - Grayed out text

9. **Actions**
   - "View" link with right arrow icon
   - Orange hover color

### Styling Consistency

**Reused Components:**
- Health badges from `/components/priority/account-card.tsx`
- Avatar with initials (same gradient)
- Loading skeletons from `/components/shared/loading-skeleton.tsx`
- Pagination from `/components/shared/pagination.tsx`

**Table Styling:**
```css
table: bg-white border border-gray-200 rounded-lg shadow-sm
thead: bg-gray-50 border-b border-gray-200
th: text-gray-600 text-xs uppercase font-semibold px-6 py-3
tbody tr: border-b border-gray-100 hover:bg-gray-50 cursor-pointer
td: py-4 px-6 text-sm
```

## Section 3: Search, Filter & Sort

### AccountsToolbar Component

**Layout:** Horizontal bar above table with three controls

#### 1. Search Box (Left, flex-1)

```typescript
<input
  type="text"
  placeholder="Search accounts..."
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  className="w-full pl-10 pr-4 py-2 border rounded-lg"
/>
```

**Features:**
- Search icon on left
- Searches account name (case-insensitive)
- 300ms debounce before API call
- Clear button (X) appears when typing

#### 2. Filter Dropdown (Middle)

```typescript
<select value={statusFilter} onChange={handleFilterChange}>
  <option value="all">All Statuses</option>
  <option value="healthy">Healthy</option>
  <option value="at-risk">At Risk</option>
  <option value="critical">Critical</option>
</select>
```

**Features:**
- Filters by health_status
- Shows count badge next to each option (e.g., "Healthy (42)")
- Multi-select support (Ctrl/Cmd to select multiple)

#### 3. Sort Dropdown (Right)

```typescript
<select value={sortBy} onChange={handleSortChange}>
  <option value="name">Account Name</option>
  <option value="health_score">Health Score</option>
  <option value="arr">ARR (Highest)</option>
  <option value="renewal_date">Renewal Date</option>
  <option value="last_activity">Last Activity</option>
</select>
```

**Features:**
- Toggle button for ascending/descending order
- Default sort: Health Score (lowest first, showing at-risk first)

### State Management

**URL Parameters for Shareability:**
```
/all-accounts?page=2&search=tech&status=at-risk&sort=arr&order=desc
```

All filter states stored in URL:
- Enables sharing filtered views
- Preserves state on page refresh
- Browser back/forward works correctly

## Section 4: Pagination

### AccountsPagination Component

**Reuse:** Existing `Pagination` component from `/components/shared/pagination.tsx`

**Layout:**
```
┌─────────────────────────────────────────────────┐
│ Showing 1-20 of 147 accounts    [←] 1 2 3 ... 8 [→] │
└─────────────────────────────────────────────────┘
```

**Left Side - Info:**
```tsx
<div className="text-sm text-gray-600">
  Showing {start}-{end} of {total} accounts
</div>
```

**Right Side - Controls:**
- Previous button (disabled on page 1)
- Page number buttons (show first 3, ellipsis, last page)
- Active page: orange background
- Next button (disabled on last page)

**Pagination Settings:**
- Default: 20 accounts per page
- Hardcoded for MVP (can add dropdown later)

**Behavior:**
- Updates URL param: `?page=2`
- Shows skeleton rows while fetching
- Scrolls to top of table on page change
- Disables controls during loading

## Section 5: Styling & Polish

### Color Palette (Match Current App)

```css
Primary orange: bg-orange-600, text-orange-600, border-orange-500
Health colors:
  - Healthy: bg-green-50 text-green-600
  - At Risk: bg-orange-50 text-orange-600
  - Critical: bg-red-50 text-red-600
Gray scale: gray-50, gray-200, gray-600, gray-900
```

### Responsive Behavior

**Desktop (>1024px):** Show all columns

**Tablet (768-1024px):** Hide "Churn Signals" and "Expansion Signals" columns

**Mobile (<768px):**
- Keep table format
- Enable horizontal scroll
- Sticky first column (Account Name)

### Empty States

**No Results:**
```tsx
<div className="text-center py-12">
  <Users className="w-12 h-12 mx-auto text-gray-400" />
  <h3 className="text-lg font-semibold text-gray-900">No accounts found</h3>
  <p className="text-gray-600 mt-2">Try adjusting your search or filters</p>
</div>
```

**Loading State:**
- Show 5 skeleton rows
- Animate pulse effect
- Maintain table structure

**Error State:**
```tsx
<div className="text-center py-12">
  <AlertCircle className="w-12 h-12 mx-auto text-red-500" />
  <h3>Failed to load accounts</h3>
  <button onClick={retry}>Try Again</button>
</div>
```

## Implementation Checklist

### Phase 1: Data Layer
- [ ] Create `getAllAccounts()` query function
- [ ] Add signal counting logic
- [ ] Create `/api/accounts/all` endpoint
- [ ] Test pagination and filtering
- [ ] Add error handling

### Phase 2: Components
- [ ] Create AccountsTable component
- [ ] Create AccountsTableRow component
- [ ] Create AccountsTableHeader component
- [ ] Add loading skeletons
- [ ] Add empty states

### Phase 3: Interactions
- [ ] Create AccountsToolbar component
- [ ] Implement search with debounce
- [ ] Add filter dropdown
- [ ] Add sort dropdown
- [ ] Wire up pagination controls

### Phase 4: Styling
- [ ] Match existing app colors
- [ ] Add hover states
- [ ] Ensure responsive behavior
- [ ] Test on mobile/tablet
- [ ] Add transitions/animations

### Phase 5: Testing
- [ ] Test with large dataset (100+ accounts)
- [ ] Test search functionality
- [ ] Test all filter combinations
- [ ] Test sorting each column
- [ ] Test pagination edge cases
- [ ] Verify navigation to account detail

## Success Criteria

- ✅ Shows all accounts in sortable table format
- ✅ Search filters accounts in real-time
- ✅ Filter by health status works
- ✅ Sort by any column works
- ✅ Pagination handles 100+ accounts smoothly
- ✅ Clicking account navigates to detail page
- ✅ Matches existing app design patterns
- ✅ Responsive on all screen sizes
- ✅ Loading states are smooth
- ✅ Error states are handled gracefully

## Future Enhancements (Post-MVP)

- Add "Items per page" selector (10/20/50/100)
- Filter by renewal date range
- Export to CSV functionality
- Bulk actions (select multiple accounts)
- Save custom views/filters
- Column visibility toggles
- Advanced search (by industry, ARR range, etc.)
