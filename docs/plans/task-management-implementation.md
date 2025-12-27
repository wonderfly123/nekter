# Task Management System - Implementation Plan

**Created:** 2025-12-27
**Status:** Ready for Implementation

## Overview

Account-level task management system for CSMs to track action items, follow-ups, and deliverables with automated reminders and email notifications.

---

## Features

### Core Functionality
- ✅ Create, edit, complete, delete tasks
- ✅ Assign tasks to team members
- ✅ Set priority (High, Medium, Low)
- ✅ Set due dates
- ✅ Add descriptions and tags
- ✅ Mark tasks complete with checkbox
- ✅ Archive old completed tasks (30+ days)

### Filtering & Organization
- ✅ Filter by status (Active/Completed)
- ✅ Filter by priority
- ✅ Filter by assignee
- ✅ Search by title/description
- ✅ Sort by: due date, priority, created date, title
- ✅ View toggle: Active vs Completed

### Notifications & Reminders
- ✅ Email notification on task assignment
- ✅ Automatic reminders:
  - 3 days before due date
  - 1 day before due date
  - 1 hour before due date
  - When task becomes overdue

### Statistics Dashboard
- ✅ Total tasks count
- ✅ Overdue tasks (red)
- ✅ Due today tasks (orange)
- ✅ Completed tasks (green)
- ✅ Overdue badge in tab navigation

---

## Database Schema

### Tables Required

1. **`tasks`** - Main task storage
2. **`task_comments`** - Optional: Comments/notes on tasks
3. Uses existing: **`accounts`**, **`auth.users`**

### SQL Schema

```sql
-- =====================================================
-- TASKS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Core fields
  title TEXT NOT NULL,
  description TEXT,

  -- Status & Priority
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),

  -- Relationships
  sf_account_id TEXT NOT NULL REFERENCES public.accounts(sf_account_id) ON DELETE CASCADE,
  assignee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,

  -- Dates
  due_date DATE NOT NULL,
  completed_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Additional data
  tags TEXT[] DEFAULT '{}',

  -- Reminder tracking
  reminder_3d_sent BOOLEAN DEFAULT FALSE,
  reminder_1d_sent BOOLEAN DEFAULT FALSE,
  reminder_1h_sent BOOLEAN DEFAULT FALSE,
  overdue_reminder_sent BOOLEAN DEFAULT FALSE,
  last_reminder_sent_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX idx_tasks_sf_account_id ON public.tasks(sf_account_id);
CREATE INDEX idx_tasks_assignee_id ON public.tasks(assignee_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX idx_tasks_priority ON public.tasks(priority);
CREATE INDEX idx_tasks_created_at ON public.tasks(created_at);

-- Composite index for common queries
CREATE INDEX idx_tasks_account_status_due ON public.tasks(sf_account_id, status, due_date);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_tasks_updated_at();

-- Auto-archive completed tasks older than 90 days
CREATE OR REPLACE FUNCTION auto_archive_old_tasks()
RETURNS void AS $$
BEGIN
  UPDATE public.tasks
  SET status = 'archived',
      archived_at = NOW()
  WHERE status = 'completed'
    AND completed_at < NOW() - INTERVAL '90 days'
    AND archived_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TASK COMMENTS TABLE (Optional - for future)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.task_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_task_comments_task_id ON public.task_comments(task_id);
CREATE INDEX idx_task_comments_created_at ON public.task_comments(created_at);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

-- Tasks policies
CREATE POLICY "Users can view tasks for their accounts"
  ON public.tasks FOR SELECT
  USING (
    -- Users can see tasks for accounts they manage
    sf_account_id IN (
      SELECT sf_account_id FROM public.accounts
      WHERE csm_owner_id = auth.uid()
    )
    -- Or tasks assigned to them
    OR assignee_id = auth.uid()
    -- Or tasks they created
    OR created_by = auth.uid()
  );

CREATE POLICY "Users can create tasks for their accounts"
  ON public.tasks FOR INSERT
  WITH CHECK (
    sf_account_id IN (
      SELECT sf_account_id FROM public.accounts
      WHERE csm_owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their assigned tasks or tasks they created"
  ON public.tasks FOR UPDATE
  USING (
    assignee_id = auth.uid()
    OR created_by = auth.uid()
    OR sf_account_id IN (
      SELECT sf_account_id FROM public.accounts
      WHERE csm_owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete tasks they created or for their accounts"
  ON public.tasks FOR DELETE
  USING (
    created_by = auth.uid()
    OR sf_account_id IN (
      SELECT sf_account_id FROM public.accounts
      WHERE csm_owner_id = auth.uid()
    )
  );

-- Task comments policies
CREATE POLICY "Users can view comments on tasks they can see"
  ON public.task_comments FOR SELECT
  USING (
    task_id IN (
      SELECT id FROM public.tasks
      WHERE sf_account_id IN (
        SELECT sf_account_id FROM public.accounts
        WHERE csm_owner_id = auth.uid()
      )
      OR assignee_id = auth.uid()
      OR created_by = auth.uid()
    )
  );

CREATE POLICY "Users can create comments on tasks they can see"
  ON public.task_comments FOR INSERT
  WITH CHECK (
    task_id IN (
      SELECT id FROM public.tasks
      WHERE sf_account_id IN (
        SELECT sf_account_id FROM public.accounts
        WHERE csm_owner_id = auth.uid()
      )
      OR assignee_id = auth.uid()
      OR created_by = auth.uid()
    )
  );

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Get overdue tasks for reminder emails
CREATE OR REPLACE FUNCTION get_tasks_needing_reminders()
RETURNS TABLE (
  task_id UUID,
  task_title TEXT,
  due_date DATE,
  assignee_email TEXT,
  assignee_name TEXT,
  account_name TEXT,
  reminder_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  -- 3 days before
  SELECT
    t.id,
    t.title,
    t.due_date,
    u.email,
    COALESCE(u.user_metadata->>'first_name' || ' ' || u.user_metadata->>'last_name', u.email) as assignee_name,
    a.name as account_name,
    '3_days_before' as reminder_type
  FROM public.tasks t
  JOIN auth.users u ON t.assignee_id = u.id
  JOIN public.accounts a ON t.account_id = a.id
  WHERE t.status = 'active'
    AND t.due_date = CURRENT_DATE + INTERVAL '3 days'
    AND t.reminder_3d_sent = FALSE

  UNION ALL

  -- 1 day before
  SELECT
    t.id,
    t.title,
    t.due_date,
    u.email,
    COALESCE(u.user_metadata->>'first_name' || ' ' || u.user_metadata->>'last_name', u.email),
    a.name,
    '1_day_before'
  FROM public.tasks t
  JOIN auth.users u ON t.assignee_id = u.id
  JOIN public.accounts a ON t.account_id = a.id
  WHERE t.status = 'active'
    AND t.due_date = CURRENT_DATE + INTERVAL '1 day'
    AND t.reminder_1d_sent = FALSE

  UNION ALL

  -- Overdue
  SELECT
    t.id,
    t.title,
    t.due_date,
    u.email,
    COALESCE(u.user_metadata->>'first_name' || ' ' || u.user_metadata->>'last_name', u.email),
    a.name,
    'overdue'
  FROM public.tasks t
  JOIN auth.users u ON t.assignee_id = u.id
  JOIN public.accounts a ON t.account_id = a.id
  WHERE t.status = 'active'
    AND t.due_date < CURRENT_DATE
    AND t.overdue_reminder_sent = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mark reminder as sent
CREATE OR REPLACE FUNCTION mark_reminder_sent(
  p_task_id UUID,
  p_reminder_type TEXT
)
RETURNS void AS $$
BEGIN
  UPDATE public.tasks
  SET
    reminder_3d_sent = CASE WHEN p_reminder_type = '3_days_before' THEN TRUE ELSE reminder_3d_sent END,
    reminder_1d_sent = CASE WHEN p_reminder_type = '1_day_before' THEN TRUE ELSE reminder_1d_sent END,
    overdue_reminder_sent = CASE WHEN p_reminder_type = 'overdue' THEN TRUE ELSE overdue_reminder_sent END,
    last_reminder_sent_at = NOW()
  WHERE id = p_task_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Implementation Steps

### Phase 1: Database Setup (15 min)
1. ✅ Run SQL schema in Supabase SQL Editor
2. ✅ Verify tables created
3. ✅ Test RLS policies with sample data
4. ✅ Verify indexes created

### Phase 2: API Routes (1 hour)
Create Next.js API routes:

**`/api/tasks`**
- `GET` - List tasks (with filters: sfAccountId, status, priority, assignee, search)
- `POST` - Create new task (send email notification)

**`/api/tasks/[id]`**
- `GET` - Get task details
- `PATCH` - Update task (status, priority, assignee, etc.)
- `DELETE` - Delete task

**`/api/tasks/[id]/complete`**
- `POST` - Mark task complete (set completed_at)

**`/api/tasks/[id]/comments`**
- `GET` - Get task comments
- `POST` - Add comment

**`/api/tasks/stats/[sfAccountId]`**
- `GET` - Get task statistics (total, overdue, due today, completed)

### Phase 3: Frontend Components (2-3 hours)

**Create components:**
1. `TasksList` - Main task list with filters
2. `TaskItem` - Individual task row
3. `TaskModal` - Create/edit task form
4. `TaskFilters` - Filter toolbar
5. `TaskStats` - Statistics cards
6. `TaskCheckbox` - Completion checkbox

**Integrate into:**
- Account detail page (add "Tasks" tab)
- Optional: Standalone tasks page

### Phase 4: Email Notifications (1 hour)

**Email Templates:**
1. Task Assignment Email
2. 3-Day Reminder Email
3. 1-Day Reminder Email
4. Overdue Email

**Cron Job Setup:**
- Use Vercel Cron or Supabase Edge Functions
- Run daily at 9 AM
- Call `get_tasks_needing_reminders()`
- Send emails via Resend or SendGrid
- Mark reminders sent with `mark_reminder_sent()`

### Phase 5: Testing & Polish (30 min)
1. Test create/edit/delete
2. Test filters and search
3. Test completion flow
4. Test statistics accuracy
5. Verify email sending
6. Test RLS policies
7. Mobile responsive check

---

## Key Features to Implement

### Priority 1 (MVP)
- [x] Create tasks
- [x] List tasks by account
- [x] Mark complete
- [x] Filter by status/priority/assignee
- [x] Due date tracking
- [x] Statistics display

### Priority 2 (Nice to Have)
- [ ] Task comments
- [ ] Task history/audit log
- [ ] Bulk actions
- [ ] Export to CSV
- [ ] Recurring tasks
- [ ] Subtasks

### Priority 3 (Future)
- [ ] Task templates
- [ ] Time tracking
- [ ] Task dependencies
- [ ] Gantt chart view
- [ ] Team workload view

---

## Tech Stack

- **Frontend**: React, Next.js 15, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase PostgreSQL
- **Auth**: Supabase Auth
- **Emails**: Resend (or Supabase email triggers)
- **Cron**: Vercel Cron Jobs or Supabase Edge Functions

---

## API Examples

### Create Task
```typescript
POST /api/tasks
{
  "sfAccountId": "0011234567890ABC",
  "title": "Schedule renewal call",
  "description": "Discuss pricing and terms",
  "priority": "high",
  "dueDate": "2025-01-15",
  "assigneeId": "uuid",
  "tags": ["Renewal", "Churn Risk"]
}
```

### List Tasks
```typescript
GET /api/tasks?sfAccountId=0011234567890ABC&status=active&priority=high
{
  "tasks": [...],
  "total": 7,
  "overdue": 2,
  "dueToday": 1
}
```

### Mark Complete
```typescript
POST /api/tasks/uuid/complete
{
  "completedAt": "2025-12-27T10:30:00Z"
}
```

---

## Reminder Email Logic

**Cron Job (runs daily at 9 AM):**

```typescript
// pages/api/cron/send-reminders.ts
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Get tasks needing reminders
  const { data: tasks } = await supabase
    .rpc('get_tasks_needing_reminders');

  // Send emails
  for (const task of tasks) {
    await sendReminderEmail(task);

    // Mark reminder sent
    await supabase
      .rpc('mark_reminder_sent', {
        p_task_id: task.task_id,
        p_reminder_type: task.reminder_type
      });
  }

  return Response.json({ sent: tasks.length });
}
```

---

## File Structure

```
dashboard/
├── app/
│   ├── api/
│   │   ├── tasks/
│   │   │   ├── route.ts                    # List, Create
│   │   │   └── [id]/
│   │   │       ├── route.ts                # Get, Update, Delete
│   │   │       ├── complete/
│   │   │       │   └── route.ts            # Mark complete
│   │   │       └── comments/
│   │   │           └── route.ts            # Comments
│   │   └── cron/
│   │       └── send-reminders/
│   │           └── route.ts                # Email reminders
│   └── accounts/
│       └── [id]/
│           └── page.tsx                    # Add Tasks tab
├── components/
│   ├── tasks/
│   │   ├── TasksList.tsx
│   │   ├── TaskItem.tsx
│   │   ├── TaskModal.tsx
│   │   ├── TaskFilters.tsx
│   │   ├── TaskStats.tsx
│   │   └── TaskCheckbox.tsx
│   └── emails/
│       ├── TaskAssignmentEmail.tsx
│       └── TaskReminderEmail.tsx
└── lib/
    ├── supabase/
    │   └── tasks.ts                        # Task queries
    └── email/
        └── send-task-email.ts              # Email sending logic
```

---

## Notes

- Tasks are scoped to accounts (each task belongs to one account)
- RLS ensures users only see tasks for accounts they manage
- Reminders are sent via cron job (not real-time)
- Archive function runs manually or via scheduled job
- Tags stored as PostgreSQL array for easy filtering
- Use demo mode flag to disable actual email sending

---

## Success Criteria

✅ CSMs can create and assign tasks
✅ Tasks visible on account detail page
✅ Overdue tasks highlighted
✅ Email notifications sent
✅ Statistics accurate
✅ Filters and search work
✅ Mobile responsive
✅ RLS protects data
