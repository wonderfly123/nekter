# Authentication System Implementation

**Last Updated:** 2025-12-24

**Status:** ✅ Implemented and Deployed

## Overview

Role-based authentication system using Supabase Auth with email/password and Google OAuth providers. User approvals managed via Supabase Auth metadata with admin panel for user management.

**Architecture Decision:** Uses Supabase Auth's built-in metadata system (`user_metadata` + `app_metadata`) instead of custom approval tables for simplicity and to follow Supabase best practices.

**Important:** All RLS (Row Level Security) is currently **DISABLED** on data tables (`accounts`, `account_health_history`, `opportunities`, `interaction_insights`, `zendesk_tickets`, `contacts`) for development simplicity. Access control relies entirely on authentication state.

---

## Architecture

### Auth Flow

```
┌─────────────────────┐
│   User Signs Up     │
│ (Email or Google)   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────────┐
│ Database Trigger Sets           │
│ app_metadata.role = 'pending'   │
└──────────┬──────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│ User Completes Profile          │
│ (if OAuth, fills in required    │
│  fields: name, company, reason) │
└──────────┬──────────────────────┘
           │
           ▼
┌─────────────────────┐
│ Pending Approval    │
│ Screen Shown        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────────┐
│ Admin Approves User             │
│ (Sets role to 'user' or 'admin'│
│  via API route)                 │
└──────────┬──────────────────────┘
           │
           ▼
┌─────────────────────┐
│ User Can Access     │
│ Dashboard           │
└─────────────────────┘
```

### Data Storage

**User Metadata (`user_metadata`):**
- `first_name`: String
- `last_name`: String
- `company`: String
- `signup_reason`: String

**App Metadata (`app_metadata`):**
- `role`: 'pending' | 'user' | 'admin'

### Key Components

1. **Database Trigger**: Automatically sets `app_metadata.role = 'pending'` for new users
2. **Auth Context**: Provides global auth state via React Context
3. **Auth Guards**: Protect routes based on authentication/approval status
4. **API Routes**: Admin operations using Supabase service role key
5. **Profile Completion**: Collects missing metadata for OAuth users
6. **Admin Panel**: Manage user approvals, roles, and deletions

---

## Implementation Details

### 1. Database Setup

**Database Trigger for Auto-Pending Role:**

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  NEW.raw_app_meta_data = jsonb_set(
    COALESCE(NEW.raw_app_meta_data, '{}'::jsonb),
    '{role}',
    '"pending"'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

**RLS Status (All DISABLED):**

```sql
-- All data tables have RLS disabled for development
ALTER TABLE public.accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_health_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.interaction_insights DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.zendesk_tickets DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts DISABLE ROW LEVEL SECURITY;
```

**Note:** Access control currently relies entirely on authentication. Users must be logged in and approved to access the dashboard. Future enhancement could re-enable RLS for defense-in-depth.

### 2. Auth Types

**File:** `dashboard/lib/auth/types.ts`

```typescript
export type UserRole = 'pending' | 'user' | 'admin';

export interface ApprovedUser {
  id: number;
  email: string;
  role: UserRole;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  signup_reason: string | null;
  approved_by: string | null;
  approved_at: string | null;
  notes: string | null;
  created_at: string | null;
}

export interface AuthState {
  user: User | null;
  role: UserRole | null;
  isLoading: boolean;
  isApproved: boolean;
}
```

### 3. Approval Check Utility

**File:** `dashboard/lib/auth/check-approval.ts`

**Key Features:**
- **UserId-based** (not email-based) for better performance
- **5-minute cache** to reduce database queries
- **Request deduplication** to prevent concurrent identical queries
- **No timeouts** (removed to prevent false negatives)
- Reads `app_metadata.role` to determine approval status

```typescript
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const approvalCache = new Map<string, CachedApproval>();
const pendingRequests = new Map<string, Promise<ApprovalResult>>();

export async function getUserApprovalStatus(userId: string): Promise<{
  isApproved: boolean;
  role: UserRole | null;
}> {
  // Check cache first
  const cached = approvalCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return { isApproved: cached.isApproved, role: cached.role };
  }

  // Deduplicate concurrent requests
  if (pendingRequests.has(userId)) {
    return pendingRequests.get(userId)!;
  }

  const promise = (async () => {
    const { data: { user }, error } = await supabase.auth.getUser();

    const role = (user.app_metadata?.role as UserRole) || 'pending';
    const isApproved = role === 'user' || role === 'admin';

    const result = { isApproved, role };

    // Cache the result
    approvalCache.set(userId, { ...result, timestamp: Date.now() });
    return result;
  })();

  pendingRequests.set(userId, promise);
  const result = await promise;
  pendingRequests.delete(userId);

  return result;
}

export function clearApprovalCache(): void {
  approvalCache.clear();
}
```

### 4. Auth Context Provider

**File:** `dashboard/lib/auth/auth-context.tsx`

**Key Features:**
- Provides global auth state via React Context
- **No timeout wrappers** (removed to prevent false logouts)
- Listens to Supabase auth state changes
- Provides `refreshAuthState()` for manual refresh
- Uses userId-based approval checks

```typescript
const loadAuthState = async () => {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    setState({ user: null, role: null, isLoading: false, isApproved: false });
    return;
  }

  const { isApproved, role } = await getUserApprovalStatus(session.user.id);

  setState({
    user: session.user,
    role,
    isLoading: false,
    isApproved,
  });
};
```

### 5. Login/Signup Page

**File:** `dashboard/app/login/page.tsx`

**Features:**
- Email/password authentication
- Google OAuth integration
- Profile data collection on signup (first_name, last_name, company, signup_reason)
- Email confirmation flow
- OAuth redirects to `/complete-profile` for additional data

**Email Signup:**
```typescript
const { data: authData, error: signUpError } = await supabase.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: `${window.location.origin}/portfolio`,
    data: {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      company: company.trim(),
      signup_reason: signupReason.trim(),
    }
  }
});
```

**Google OAuth:**
```typescript
const { error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/complete-profile`,
  },
});
```

### 6. Profile Completion Page

**File:** `dashboard/app/complete-profile/page.tsx`

**Purpose:** Collect missing profile data for OAuth users (Google auth doesn't provide company, signup reason)

**Key Features:**
- Auto-redirects if profile is already complete
- Collects: first_name, last_name, company, signup_reason
- Shows success message before redirect
- **Refreshes auth state** before redirect to prevent loops
- Provides logout option

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  const { error: updateError } = await supabase.auth.updateUser({
    data: {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      company: company.trim(),
      signup_reason: signupReason.trim(),
    }
  });

  if (updateError) throw updateError;

  setSuccess(true);

  // CRITICAL: Refresh auth state to get updated user metadata
  if (refreshAuthState) {
    await refreshAuthState();
  }

  await new Promise(resolve => setTimeout(resolve, 1000));
  router.push('/portfolio');
};
```

### 7. Auth Guards

**AuthGuard** (`dashboard/components/auth/auth-guard.tsx`):
- Redirects unauthenticated users to `/login`
- Shows pending approval screen for pending users
- **Checks profile completion** for approved users
- Redirects incomplete profiles to `/complete-profile`

**RoleGuard** (`dashboard/components/auth/role-guard.tsx`):
- Restricts access based on user role
- Used to protect admin-only routes

**PendingApproval** (`dashboard/components/auth/pending-approval.tsx`):
- Shown to users with `role='pending'`
- Displays user email and logout button
- **Rendered outside dashboard chrome** (no sidebar/header)

### 8. Layout Integration

**File:** `dashboard/components/layout/app-layout.tsx`

**Key Feature:** Hides sidebar/header for:
- Public routes (`/login`, `/reset-password`, `/complete-profile`)
- **Pending users** (not approved yet)
- **Users with incomplete profiles**

```typescript
const publicRoutes = ['/login', '/reset-password', '/complete-profile'];
const { isApproved, isLoading } = useAuth();

// Hide layout for public routes OR pending users
if (isPublicRoute || (!isLoading && !isApproved)) {
  return <>{children}</>;
}
```

### 9. Admin Panel

**File:** `dashboard/app/admin/page.tsx`

**Protected By:** `<RoleGuard allowedRoles={['admin']}>`

**Features:**
- **Fetches users from `auth.users`** via API route (not custom table)
- Displays pending users separately from approved users
- Shows user metadata (name, company, signup reason, email confirmation status)
- Approve as 'user' or 'admin'
- Change user roles
- Delete users
- **Prevents admin self-deletion** (UI + backend check)
- Success/error messages with visual feedback
- Clears approval cache after changes

**UI Highlights:**
- Pending users shown in cards with approve buttons
- Approved users shown in table with role dropdown
- "You" badge for current user
- Orange branding (buttons, badges, colors)

### 10. Admin API Routes

**Purpose:** Admin operations require service role key to modify `auth.users` table

#### List Users
**File:** `dashboard/app/api/admin/users/route.ts`

```typescript
export async function GET(request: Request) {
  // Verify admin role via bearer token
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  const { data: { user } } = await supabaseAdmin.auth.getUser(token);

  if (user.app_metadata?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Fetch all users using service role
  const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();

  // Transform to include metadata
  const transformedUsers = users.map(u => ({
    id: u.id,
    email: u.email,
    created_at: u.created_at,
    email_confirmed_at: u.email_confirmed_at,
    role: u.app_metadata?.role || 'pending',
    first_name: u.user_metadata?.first_name,
    last_name: u.user_metadata?.last_name,
    company: u.user_metadata?.company,
    signup_reason: u.user_metadata?.signup_reason,
  }));

  return NextResponse.json({ users: transformedUsers });
}
```

#### Update User Role
**File:** `dashboard/app/api/admin/users/[id]/route.ts`

**Important:** Next.js 15 made `params` async, must await before use

```typescript
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }  // Next.js 15: params is async
) {
  const { id: userId } = await params;  // Must await params
  const { role } = await request.json();

  // Verify admin
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  const { data: { user: admin } } = await supabaseAdmin.auth.getUser(token);

  if (admin.app_metadata?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Update user's app_metadata
  const { data } = await supabaseAdmin.auth.admin.updateUserById(
    userId,
    { app_metadata: { role } }
  );

  return NextResponse.json({ success: true, user: data.user });
}
```

#### Delete User
**File:** `dashboard/app/api/admin/users/[id]/route.ts`

```typescript
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: userId } = await params;

  // Verify admin and prevent self-deletion
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  const { data: { user: admin } } = await supabaseAdmin.auth.getUser(token);

  if (admin.app_metadata?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (userId === admin.id) {
    return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });
  }

  await supabaseAdmin.auth.admin.deleteUser(userId);
  return NextResponse.json({ success: true });
}
```

**Frontend Calls API Routes:**
```typescript
const { data: { session } } = await supabase.auth.getSession();

const response = await fetch('/api/admin/users', {
  headers: { 'Authorization': `Bearer ${session.access_token}` },
});
```

### 11. User Menu

**File:** `dashboard/components/user-menu.tsx`

**Features:**
- Shows user email and avatar (first letter)
- Dropdown menu with:
  - Settings (placeholder page)
  - **Admin Panel** (only for admins)
  - Logout
- Click-outside to close
- Orange accent color

---

## Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...  # For API routes (DO NOT expose to client)

# App Config
NEXT_PUBLIC_IS_DEMO_MODE=false
NEXT_PUBLIC_DEMO_DATE=2024-01-15
```

**Important:** `SUPABASE_SERVICE_ROLE_KEY` must be kept secret and only used in API routes (server-side).

---

## Supabase Configuration

### Authentication Providers

**Email Provider:**
- Enabled
- Email confirmation: ENABLED (users must confirm email)
- Redirect URL: `https://your-domain.com/portfolio`

**Google OAuth:**
- Enabled
- Client ID: From Google Cloud Console
- Client Secret: From Google Cloud Console
- Redirect URL: `https://[project-ref].supabase.co/auth/v1/callback`
- App redirect: `https://your-domain.com/complete-profile`

### URL Configuration

**Site URL:** `https://your-domain.com`

**Redirect URLs:**
- `http://localhost:3000/**` (development)
- `https://your-domain.com/**` (production)

---

## User Flows

### Email/Password Signup

1. User visits `/login`
2. Switches to signup mode
3. Fills in: email, password, first name, last name, company, signup reason
4. Submits form
5. **Database trigger sets role to 'pending'**
6. User sees "Check your email" message
7. User clicks confirmation link in email
8. Redirects to `/portfolio`
9. **AuthGuard checks approval status**
10. User sees "Pending Approval" screen
11. Admin approves user via admin panel
12. User refreshes → gains access to dashboard

### Google OAuth Signup

1. User visits `/login`
2. Clicks "Continue with Google"
3. Completes Google auth flow
4. **Database trigger sets role to 'pending'**
5. Redirects to `/complete-profile`
6. User fills in: first name, last name, company, signup reason
7. Submits form
8. Success message shown
9. **Auth state refreshed** to get updated metadata
10. Redirects to `/portfolio`
11. **AuthGuard checks approval status**
12. User sees "Pending Approval" screen
13. Admin approves user
14. User refreshes → gains access to dashboard

### Admin Approval Flow

1. Admin logs in
2. Clicks user menu → Admin Panel
3. Sees list of pending users with:
   - Name
   - Email
   - Company
   - Signup reason
   - Email confirmation status
4. Clicks "Approve as User" or "Approve as Admin"
5. Success message shown
6. **Approval cache cleared**
7. Pending user removed from pending list
8. User added to approved users table
9. Pending user can now refresh and access dashboard

### Role Change Flow

1. Admin goes to Admin Panel
2. Finds user in approved users table
3. Changes role dropdown from 'user' to 'admin' (or vice versa)
4. Success message shown
5. **Approval cache cleared**
6. Target user's auth state refreshes on next page load
7. Target user gains/loses admin features

### User Deletion Flow

1. Admin goes to Admin Panel
2. Finds user in approved users table
3. Clicks "Delete" button
4. **UI checks:** Cannot delete self (button disabled)
5. **Backend checks:** Cannot delete self (API returns 400)
6. Confirms deletion dialog
7. User deleted from `auth.users` table
8. Success message shown
9. **Approval cache cleared**
10. User removed from list
11. Deleted user is immediately logged out (next auth check fails)

---

## Security Considerations

### Current State

**Access Control:**
- ✅ Authentication required for all dashboard pages
- ✅ Approval required to access any data
- ✅ Admin role required for admin panel
- ✅ Bearer token authentication for API routes
- ✅ Service role key kept secret (server-side only)
- ✅ Admin cannot delete themselves
- ⚠️ RLS **DISABLED** on all data tables

**Why RLS is Disabled:**
- Simplified development
- Faster iteration
- Access control handled at application layer
- All users see all data (acceptable for internal tool)

### Future Enhancements

**If Multi-Tenancy Needed:**
1. Re-enable RLS on data tables
2. Add `user_id` or `team_id` columns to data tables
3. Create RLS policies filtering by user/team
4. Example policy:
```sql
CREATE POLICY "Users can only see their data"
ON accounts FOR SELECT
USING (user_id = auth.uid());
```

**Defense in Depth:**
Even with application-level auth, RLS provides backup security if:
- Application bugs allow unauthorized queries
- Direct database access occurs
- API routes have vulnerabilities

---

## Testing Checklist

### Manual Testing

- [x] Email signup creates pending user
- [x] Email confirmation required before access
- [x] Google OAuth redirects to profile completion
- [x] Profile completion form works
- [x] Success message shows before redirect
- [x] Auth state refreshes after profile completion
- [x] Pending approval screen shows for unapproved users
- [x] Pending screen is outside dashboard chrome (no sidebar)
- [x] Admin can approve users as 'user' or 'admin'
- [x] Admin can change user roles
- [x] Admin cannot delete themselves (UI disabled)
- [x] Admin cannot delete themselves (API blocks)
- [x] Success messages show for admin actions
- [x] Approval cache clears after admin actions
- [x] User menu shows role-appropriate options
- [x] Settings page shows placeholder
- [x] Logout works correctly
- [x] Sessions persist across refreshes
- [x] No infinite redirects
- [x] No timeout errors

### Automated Testing

Currently no automated tests. Future considerations:
- E2E tests with Playwright
- API route tests with Jest
- Auth flow tests

---

## Known Issues and Limitations

### Current Limitations

1. **No RLS on data tables**
   - All approved users can see all data
   - Acceptable for internal tool
   - Future: Add RLS if multi-tenancy needed

2. **No password strength requirements**
   - Supabase default: 6 character minimum
   - Future: Add custom validation

3. **No rate limiting**
   - Supabase has built-in rate limits
   - Future: Add custom rate limiting for admin actions

4. **No audit log**
   - Admin actions not logged
   - Future: Add audit trail for approvals/deletions/role changes

5. **No user self-service password reset from settings**
   - Password reset only via forgot password flow
   - Future: Add password change in settings

6. **No email notifications**
   - Users not notified when approved
   - Admins not notified of new signups
   - Future: Add email notifications

### Resolved Issues

- ✅ **Timeout errors:** Removed all timeout wrappers that caused false negatives
- ✅ **Redirect loops:** Added auth state refresh before redirects
- ✅ **Email vs userId lookups:** Changed to userId-based for performance
- ✅ **RLS complexity:** Disabled RLS, simplified to auth-only access control
- ✅ **Admin self-deletion:** Added checks in UI and backend
- ✅ **Next.js 15 async params:** Updated API routes to await params
- ✅ **Profile completion stuck:** Added success message and auth state refresh
- ✅ **Pending users see sidebar:** Layout hides chrome for pending users

---

## Deployment

### Vercel Configuration

**Environment Variables (Vercel Dashboard):**
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
NEXT_PUBLIC_IS_DEMO_MODE=false
NEXT_PUBLIC_DEMO_DATE=2024-01-15
```

### First Admin Setup

**After first deployment:**
1. Sign up via production UI with your email
2. In Supabase dashboard, run:
```sql
UPDATE auth.users
SET raw_app_meta_data = jsonb_set(
  raw_app_meta_data,
  '{role}',
  '"admin"'
)
WHERE email = 'your@email.com';
```
3. Refresh production app
4. You now have admin access

---

## File Structure

```
dashboard/
├── app/
│   ├── admin/
│   │   └── page.tsx                    # Admin panel
│   ├── complete-profile/
│   │   └── page.tsx                    # Profile completion for OAuth
│   ├── login/
│   │   └── page.tsx                    # Login/signup page
│   ├── reset-password/
│   │   └── page.tsx                    # Password reset
│   ├── settings/
│   │   └── page.tsx                    # Settings (placeholder)
│   └── api/
│       └── admin/
│           └── users/
│               ├── route.ts            # List users (GET)
│               └── [id]/
│                   └── route.ts        # Update role (PATCH), Delete user (DELETE)
├── components/
│   ├── auth/
│   │   ├── auth-guard.tsx              # Auth + approval guard
│   │   ├── role-guard.tsx              # Role-based guard
│   │   └── pending-approval.tsx        # Pending screen
│   ├── layout/
│   │   ├── app-layout.tsx              # Layout wrapper (hides chrome for pending)
│   │   ├── sidebar.tsx                 # Sidebar navigation
│   │   └── app-header.tsx              # Header with user menu
│   └── user-menu.tsx                   # User dropdown menu
└── lib/
    ├── auth/
    │   ├── auth-context.tsx            # Auth provider
    │   ├── use-auth.ts                 # Auth hook
    │   ├── check-approval.ts           # Approval status utility
    │   ├── types.ts                    # Auth types
    │   └── roles.ts                    # Role utilities
    └── supabase/
        └── client.ts                   # Supabase client
```

---

## Success Metrics

✅ **Implemented:**
- Email/password authentication
- Google OAuth authentication
- User approval workflow
- Profile completion for OAuth users
- Role-based access control (pending, user, admin)
- Admin panel for user management
- Prevent admin self-deletion
- Success/error messages with visual feedback
- Approval status caching
- Request deduplication
- Auth state refresh
- Layout adaptation for pending users
- User menu with role-specific options

✅ **Deployed:**
- Production deployment on Vercel
- Supabase Auth configured
- Environment variables set
- First admin user created

---

## Future Enhancements

### Short Term
1. Add email notifications (approval, signup)
2. Add audit log for admin actions
3. Add user profile editing in settings
4. Add password change in settings
5. Improve loading states

### Long Term
1. Re-enable RLS for multi-tenancy support
2. Add team/organization support
3. Add custom password strength requirements
4. Add rate limiting for admin actions
5. Add 2FA support
6. Add automated testing
7. Add user activity tracking

---

## Maintenance Notes

### Cache Management

**Approval cache duration:** 5 minutes

**Clear cache when:**
- Admin approves user
- Admin changes user role
- Admin deletes user

**Clear cache manually:**
```typescript
import { clearApprovalCache } from '@/lib/auth/check-approval';
clearApprovalCache();
```

### Database Maintenance

**View all users and roles:**
```sql
SELECT
  id,
  email,
  raw_app_meta_data->>'role' as role,
  raw_user_meta_data->>'first_name' as first_name,
  raw_user_meta_data->>'last_name' as last_name,
  raw_user_meta_data->>'company' as company,
  created_at,
  email_confirmed_at
FROM auth.users
ORDER BY created_at DESC;
```

**Manually approve user:**
```sql
UPDATE auth.users
SET raw_app_meta_data = jsonb_set(
  COALESCE(raw_app_meta_data, '{}'::jsonb),
  '{role}',
  '"user"'
)
WHERE email = 'user@example.com';
```

**Manually promote to admin:**
```sql
UPDATE auth.users
SET raw_app_meta_data = jsonb_set(
  COALESCE(raw_app_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'admin@example.com';
```

### Troubleshooting

**User stuck on pending approval after approval:**
- Check that `app_metadata.role` was actually updated
- Clear approval cache: `clearApprovalCache()`
- Check browser console for errors
- Verify API route authentication

**Profile completion redirect loop:**
- Ensure `refreshAuthState()` is called after profile update
- Check that all required fields are present in `user_metadata`
- Verify no conflicting redirects in AuthGuard

**Admin actions failing:**
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set in Vercel
- Check API route logs for errors
- Verify bearer token is being sent correctly
- Check Supabase logs for auth errors

**Cannot delete user:**
- Check if trying to delete self (prevented)
- Verify admin role in request
- Check Supabase logs for deletion errors

---

## Related Documentation

- [MVP Implementation Plan](./mvp-implementation-2025-12-22.md)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Next.js 15 Documentation](https://nextjs.org/docs)
