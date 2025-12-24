# Authentication System Design

**Date**: 2025-12-24
**Status**: Design Complete - Ready for Implementation
**Context**: Internal demo instance with role-based access control

## Overview

Authentication system for the Customer Success Dashboard using Supabase Auth with approval-based access control and role-based permissions. Users can sign up via email/password or Google OAuth, but only approved users can access dashboard data. Admins have additional access to user management features.

## Architecture

### Core Components

1. **Supabase Auth**: Handles user authentication, password hashing, session management, and OAuth flows
2. **Approved Users Table**: Allowlist of email addresses with dashboard access and role assignments
3. **Row Level Security (RLS)**: Database-level security preventing unapproved users from querying data
4. **Role-Based Access Control**: Admin vs User roles with different permissions
5. **Auth Guard Components**: UI-level protection for pages and routes
6. **User Menu**: Top-right dropdown for settings and admin access
7. **Login/Signup Pages**: User-facing authentication interface

### User Roles

**Initial Roles:**
- `admin`: Full access to dashboard + user management
- `user`: Access to dashboard only (Priority, Portfolio, Account pages)

**Future Roles** (easy to add later):
- `csm`: CSM-specific features
- `viewer`: Read-only access
- `analyst`: Advanced analytics access

### Authentication Flow

```
User visits dashboard
  ↓
Not authenticated? → Redirect to /login
  ↓
User signs up (email/password or Google OAuth)
  ↓
Supabase Auth creates account + session
  ↓
Check: Is user.email in approved_users table?
  ↓
YES → Check role → Redirect to dashboard
NO  → Show "Waiting for approval" screen
```

### Security Model

**Multi-Layer Protection:**
1. **UI Layer**: Auth guard redirects unauthenticated users to login
2. **Application Layer**: Check approved status and role before rendering
3. **Database Layer**: RLS policies block queries if user not in approved_users table
4. **Route Layer**: Role guard prevents access to unauthorized routes

## Database Schema

### New Table: `approved_users`

```sql
CREATE TABLE approved_users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'user', -- 'admin' or 'user'
  approved_by TEXT,
  approved_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast email lookups
CREATE INDEX idx_approved_users_email ON approved_users(email);

-- RLS: Users can read their own record
ALTER TABLE approved_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own record"
ON approved_users FOR SELECT
USING (auth.email() = email);

-- Admin can read all records
CREATE POLICY "Admins can read all records"
ON approved_users FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM approved_users
    WHERE email = auth.email() AND role = 'admin'
  )
);

-- Admin can insert/update records
CREATE POLICY "Admins can manage approved users"
ON approved_users FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM approved_users
    WHERE email = auth.email() AND role = 'admin'
  )
);
```

### RLS Policy Pattern for Data Tables

Apply to all existing data tables (`accounts`, `account_health_history`, `interaction_insights`, etc.):

```sql
-- Example for accounts table
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only approved users can read accounts"
ON accounts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM approved_users
    WHERE email = auth.email()
  )
);
```

## Supabase Auth Configuration

### Email/Password Setup
- Enable email provider in Supabase dashboard
- Configure email templates (confirmation, password reset)
- Set site URL to dashboard domain
- Disable email confirmation for demo (faster testing)

### Google OAuth Setup
- Create Google OAuth app in Google Cloud Console
- Add authorized redirect URIs: `https://[project-ref].supabase.co/auth/v1/callback`
- Add OAuth client ID and secret to Supabase dashboard
- Enable Google provider in Supabase Auth settings

### Session Configuration
- Session timeout: 7 days (default)
- Refresh token rotation: enabled
- JWT expiry: 1 hour

## User Interface

### Navigation Structure

```
┌─────────────────────────────────────────────────────┐
│ [Logo] Customer Success Dashboard    [User Menu ▼] │
└─────────────────────────────────────────────────────┘
│ SIDEBAR │
│ Priority     │
│ Portfolio    │
│              │
│ (Admin       │  ← Only visible to admins in UI
│  section     │     via User Menu, not sidebar
│  hidden)     │
```

### User Menu (Top-Right Dropdown)

**For Regular Users:**
```
┌─────────────────────┐
│ user@company.com    │
├─────────────────────┤
│ Settings            │
├─────────────────────┤
│ Logout              │
└─────────────────────┘
```

**For Admins:**
```
┌─────────────────────┐
│ admin@company.com   │
├─────────────────────┤
│ Settings            │
│ Admin Panel         │  ← Only admins see this
├─────────────────────┤
│ Logout              │
└─────────────────────┘
```

### Routes

**Public Routes:**
- `/login` - Login/signup page

**Protected Routes (All Users):**
- `/priority` - Priority accounts
- `/portfolio` - Portfolio overview
- `/account/[id]` - Account detail
- `/settings` - User settings (Coming Soon placeholder)

**Admin-Only Routes:**
- `/admin` - Admin dashboard with user approvals

## User Flows

### 1. Sign Up Flow (New User)

```
User lands on /login
  ↓
Clicks "Sign up" or "Continue with Google"
  ↓
Email/Password: Fills form → Creates account
Google OAuth: Redirects to Google → Authorizes → Returns to app
  ↓
Supabase creates user + session
  ↓
App checks approved_users table
  ↓
IF NOT APPROVED:
  Show screen: "Your account is pending approval"
  Display: user's email
  Button: "Logout"

IF APPROVED:
  Check role
  Redirect to /priority (main dashboard)
```

### 2. Login Flow (Returning User)

```
User lands on /login
  ↓
Enters credentials or clicks "Continue with Google"
  ↓
Supabase authenticates → Creates session
  ↓
App checks approved_users table + role
  ↓
IF NOT APPROVED: Show pending approval screen
IF APPROVED: Redirect to /priority
```

### 3. Password Reset Flow

```
User clicks "Forgot password?" on /login
  ↓
Enters email → Submits
  ↓
Supabase sends password reset email
  ↓
User clicks link in email
  ↓
Redirects to /reset-password?token=...
  ↓
User enters new password → Submits
  ↓
Redirects to /login with success message
```

### 4. Admin Approval Workflow

```
New user signs up
  ↓
User sees "Pending approval" screen
  ↓
Admin logs in → Clicks User Menu → Admin Panel
  ↓
Sees list of pending users (in auth.users but not in approved_users)
  ↓
For each user:
  - View email, sign-up date
  - Assign role (admin or user)
  - Click "Approve"
  ↓
Row inserted into approved_users table
  ↓
User refreshes page → Gains access with assigned role
```

### 5. Admin Accessing Admin Panel

```
Admin user logged in
  ↓
Clicks on name/avatar in top-right
  ↓
Sees dropdown with "Admin Panel" option
  ↓
Clicks "Admin Panel"
  ↓
Navigates to /admin
  ↓
Sees user approvals interface:
  - Pending users list
  - Approved users list (with role management)
```

## UI Components

### `/app/login/page.tsx` - Login/Signup Page
- Centered card layout
- Email + password form
- "Continue with Google" button
- "Forgot password?" link
- Toggle between login/signup modes
- Error message display
- Loading states
- Clean, professional design

### `/app/reset-password/page.tsx` - Password Reset
- New password input form
- Password strength indicator
- Submit button with loading state
- Success/error messages
- Link back to login

### `/components/auth/auth-guard.tsx` - Protected Route Wrapper
- Checks if user is authenticated
- Checks if user is approved
- Redirects to /login if not authenticated
- Shows pending approval screen if not approved
- Renders children if authenticated + approved

### `/components/auth/role-guard.tsx` - Role-Based Protection
- Checks user's role against allowed roles
- Silently redirects to /priority if unauthorized
- No visible "Access Denied" - users never see routes they can't access

### `/components/auth/pending-approval.tsx` - Waiting Screen
- Displays user's email
- Message: "Your account is pending approval. You'll receive access once approved."
- Logout button
- Clean, centered layout

### `/components/user-menu.tsx` - User Dropdown Menu
- Avatar or initials in top-right
- Click to open dropdown
- Shows user email
- Settings link (everyone)
- Admin Panel link (admins only)
- Logout button

### `/app/settings/page.tsx` - User Settings
- Protected route (all authenticated users)
- Shows "Coming Soon" placeholder
- Future: Profile editing, notification preferences, password change

### `/app/admin/page.tsx` - Admin Panel
- Protected route (admins only)
- Two sections:
  1. **Pending Users**: List of users in auth.users but not in approved_users
     - Email, sign-up date
     - Role selector (admin/user)
     - "Approve" button
  2. **Approved Users**: List of users in approved_users
     - Email, role, approved date
     - "Change Role" dropdown
     - "Revoke Access" button (removes from approved_users)

## Implementation Details

### Auth Context & Hooks

```typescript
// lib/auth/auth-context.tsx
export interface AuthContextValue {
  user: User | null;
  role: UserRole | null;
  isLoading: boolean;
  isApproved: boolean;
  signOut: () => Promise<void>;
}

export function AuthProvider({ children }) {
  // Manages auth state, user session, role
  // Provides context to entire app
}

export function useAuth() {
  return useContext(AuthContext);
}
```

### Approval & Role Checking

```typescript
// lib/auth/check-approval.ts
export async function getUserApprovalStatus(email: string): Promise<{
  isApproved: boolean;
  role: UserRole | null;
}> {
  const { data, error } = await supabase
    .from('approved_users')
    .select('role')
    .eq('email', email)
    .single();

  if (error || !data) {
    return { isApproved: false, role: null };
  }

  return { isApproved: true, role: data.role as UserRole };
}
```

### Role-Based Route Guards

```typescript
// lib/auth/roles.ts
export type UserRole = 'admin' | 'user';

export const ADMIN_ROUTES = ['/admin'];

export function canAccessRoute(userRole: UserRole, path: string): boolean {
  if (ADMIN_ROUTES.some(route => path.startsWith(route))) {
    return userRole === 'admin';
  }
  return true; // All approved users can access other routes
}
```

### Layout Integration

```typescript
// app/layout.tsx (or dashboard layout)
export default function RootLayout({ children }) {
  return (
    <AuthProvider>
      <html>
        <body>
          <DashboardLayout>{children}</DashboardLayout>
        </body>
      </html>
    </AuthProvider>
  );
}

// components/dashboard-layout.tsx
export function DashboardLayout({ children }) {
  const { user, role } = useAuth();

  if (!user) {
    return <>{children}</>; // Login page handles redirect
  }

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1">
        <Header>
          <UserMenu user={user} role={role} />
        </Header>
        <main>{children}</main>
      </div>
    </div>
  );
}
```

## Testing Strategy

### Manual Testing Checklist
- [ ] Sign up with email/password (unapproved user)
- [ ] Verify pending approval screen shows
- [ ] Log in as admin
- [ ] Access admin panel from user menu
- [ ] Approve pending user with 'user' role
- [ ] Log in as approved user
- [ ] Verify dashboard access granted
- [ ] Verify "Admin Panel" NOT in user menu
- [ ] Sign up with Google OAuth (unapproved)
- [ ] Approve with 'admin' role
- [ ] Verify "Admin Panel" appears in user menu
- [ ] Test password reset flow
- [ ] Verify RLS blocks queries for unapproved users
- [ ] Test role changes (user → admin, admin → user)
- [ ] Test access revocation (remove from approved_users)

### Edge Cases
- User approved, then role changed → Should update on next page load
- User approved, then removed from approved_users → Should lose access
- Admin removes their own admin role → Should lose admin access
- Multiple tabs open when approval happens → Should update on refresh
- User tries to directly access /admin URL → Redirect to /priority

## Environment Variables

Add to `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: For demo mode
NEXT_PUBLIC_IS_DEMO_MODE=true
NEXT_PUBLIC_DEMO_DATE=2025-12-18
```

## Security Considerations

### What This Protects Against
✅ Unauthorized users accessing dashboard data
✅ Unapproved users querying database directly
✅ Regular users accessing admin features
✅ Session hijacking (Supabase handles JWT security)
✅ SQL injection (Supabase client uses parameterized queries)

### What This Doesn't Protect Against
❌ Brute force attacks on login (add rate limiting if needed)
❌ Email enumeration (Supabase Auth reveals if email exists)

### Recommendations for Production
- Enable email confirmation (verify email ownership)
- Add rate limiting on login attempts
- Set up monitoring for suspicious auth activity
- Rotate Supabase anon key periodically
- Use custom domain for auth callbacks
- Add 2FA when user base grows

## Migration Path

### Initial Setup
1. Create approved_users table with role column
2. Enable RLS on approved_users and all data tables
3. Deploy authentication system
4. Add your email as first admin:
   ```sql
   INSERT INTO approved_users (email, role, approved_by)
   VALUES ('your@email.com', 'admin', 'system');
   ```
5. Test complete flow

### Future Enhancements
- Email notifications when user is approved
- Bulk user import for approved_users
- Audit log for approvals and role changes
- User profile editing in /settings
- Password change in /settings
- Multi-tenancy support (organization-based access)
- Additional roles: CSM, Viewer, Analyst
- Fine-grained permissions within roles

## Success Criteria

- ✅ Users can sign up with email/password
- ✅ Users can sign up with Google OAuth
- ✅ Unapproved users see pending approval screen
- ✅ Approved users can access all dashboard pages
- ✅ User menu shows appropriate options based on role
- ✅ Admins can access Admin Panel
- ✅ Regular users cannot see or access admin features
- ✅ Admins can approve pending users
- ✅ Admins can assign roles (admin/user)
- ✅ RLS policies prevent unauthorized data access
- ✅ Password reset flow works correctly
- ✅ Sessions persist across browser refreshes
- ✅ Logout clears session and redirects to login
- ✅ Settings page shows "Coming Soon" placeholder
