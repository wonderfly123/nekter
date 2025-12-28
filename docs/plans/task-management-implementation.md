# Task Management System - Implementation Plan

**Created:** 2025-12-27
**Last Updated:** 2025-12-27
**Status:** In Progress - Core Features Implemented, Email Notifications Pending

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
- ✅ Filter by priority
- ✅ Filter by assignee
- ✅ Search by title/description
- ✅ Sort by: due date, priority, created date, title
- ✅ View toggle: Active vs Completed (replaces status filter)

### Notifications & Reminders
- ⏳ **Email notification on task assignment** (TODO)
- ⏳ **Email notification on task reassignment** (TODO)
- ⏳ **Automatic reminders** (TODO):
  - 3 days before due date
  - 1 day before due date
  - When task becomes overdue
  - Immediate notification for tasks created overdue/due today

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
2. Uses existing: **`accounts`**, **`auth.users`**

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

-- Disable RLS for development
ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;

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

### Phase 2: API Routes
Create Next.js API routes:

**`/api/tasks`**
- ✅ `GET` - List tasks (with filters: sfAccountId, priority, assignee, search)
- ✅ `POST` - Create new task (⏳ TODO: add email notification)

**`/api/tasks/[id]`**
- ✅ `GET` - Get task details
- ✅ `PATCH` - Update task (⏳ TODO: add email on reassignment)
- ✅ `DELETE` - Delete task

**`/api/tasks/[id]/complete`**
- ✅ `POST` - Mark task complete (set completed_at)

**`/api/tasks/stats/[sfAccountId]`**
- ⏳ `GET` - Get task statistics (currently calculated in GET /api/tasks)

### Phase 3: Frontend Components

**Created components:**
1. ✅ `TasksList` - Main task list with filters, stats, and view toggle
2. ✅ `TaskItem` - Individual task row with completion, edit, delete
3. ✅ `TaskModal` - Create/edit task form
4. ✅ Statistics cards (integrated in TasksList)
5. ✅ Completion checkbox (integrated in TaskItem)

**Integration:**
- ✅ Account detail page "Tasks" tab
- ⏳ Standalone tasks page (optional future enhancement)

### Phase 4: Email Notifications (TODO - Not Yet Implemented)

**Required Email Service Setup:**
1. Email provider: **SendGrid**
2. Add API key to `.env.local`:
   ```
   SENDGRID_API_KEY=your_sendgrid_api_key_here
   ```
3. Set sender email in environment:
   ```
   EMAIL_FROM=tasks@yourdomain.com
   EMAIL_FROM_NAME=Task Management System
   ```

**Email Templates to Create:**
1. **Task Assignment Email** - Sent immediately when task is created
2. **Task Reassignment Email** - Sent when assignee is changed
3. **3-Day Reminder Email** - Sent by cron job
4. **1-Day Reminder Email** - Sent by cron job
5. **Overdue Email** - Sent by cron job
6. **Immediate Overdue Email** - Sent when task is created with past due date

**Email Content Structure:**
Each email should include:
- Task title and description
- Account name (context for the task)
- Priority level (High/Medium/Low) with color coding
- Due date (formatted, with urgency indicator)
- Assignee name
- Created by (user who created the task)
- Link to task (deep link to account page with task expanded)
- Call-to-action button

**Implementation Files Needed:**

```
dashboard/
├── lib/
│   └── email/
│       ├── client.ts                   # SendGrid client setup
│       ├── send-task-email.ts          # Main email sending function
│       └── templates/
│           ├── task-assigned.tsx       # Assignment email template
│           ├── task-reassigned.tsx     # Reassignment email template
│           ├── task-reminder-3d.tsx    # 3-day reminder template
│           ├── task-reminder-1d.tsx    # 1-day reminder template
│           └── task-overdue.tsx        # Overdue reminder template
└── app/
    └── api/
        └── cron/
            └── send-reminders/
                └── route.ts            # Cron job endpoint
```

**Cron Job Setup:**
- Use Vercel Cron Jobs (add to `vercel.json`)
- Run daily at 9 AM UTC
- Call `get_tasks_needing_reminders()` database function
- Send emails via SendGrid
- Mark reminders sent with `mark_reminder_sent()`

**Vercel Cron Configuration:**
```json
{
  "crons": [{
    "path": "/api/cron/send-reminders",
    "schedule": "0 9 * * *"
  }]
}
```

**API Route Updates Needed:**

1. **`POST /api/tasks`** - Add email notification on creation:
   ```typescript
   // After task creation
   await sendTaskAssignmentEmail({
     task,
     assignee,
     account,
     createdBy: user
   });

   // If task is overdue or due today, send immediate reminder
   if (isOverdueOrDueToday(task.due_date)) {
     await sendImmediateReminderEmail({
       task,
       assignee,
       account
     });
   }
   ```

2. **`PATCH /api/tasks/[id]`** - Add email on reassignment:
   ```typescript
   // If assignee changed
   if (body.assigneeId && body.assigneeId !== oldTask.assignee_id) {
     await sendTaskReassignmentEmail({
       task: updatedTask,
       newAssignee,
       oldAssignee,
       account,
       updatedBy: user
     });
   }
   ```

**Email Edge Cases to Handle:**
1. **Task created with past due date**: Send immediate overdue notification
2. **Task created due today**: Send immediate "due today" notification
3. **Task created due tomorrow**: Will get 1-day reminder on next cron run (missed 3-day reminder)
4. **Task reassigned**: Both old and new assignee should be notified
5. **Task completed**: No more reminders (checked by status in cron query)
6. **Task deleted**: No notification needed
7. **Demo/test mode**: Add flag to prevent sending emails in development

### Phase 5: Testing & Polish

**Completed:**
1. ✅ Test create/edit/delete
2. ✅ Test filters and search
3. ✅ Test completion flow
4. ✅ Test statistics accuracy
5. ✅ Mobile responsive check

**Pending:**
1. ⏳ Verify email sending (once implemented)
2. ⏳ Test RLS policies (currently disabled for development)
3. ⏳ Test all email templates
4. ⏳ Test cron job execution
5. ⏳ Test edge cases (overdue tasks, reassignments)

---

## Implementation Status

### ✅ Completed (MVP)
- [x] Database schema and migrations
- [x] Create tasks
- [x] Edit tasks
- [x] Delete tasks
- [x] List tasks by account
- [x] Mark complete/uncomplete
- [x] Filter by priority/assignee
- [x] Search by title/description
- [x] Sort by due date, priority, created date, title
- [x] Due date tracking with overdue/due today indicators
- [x] Statistics display (total, overdue, due today, completed)
- [x] Active/Completed view toggle
- [x] Priority badges (High/Medium/Low)
- [x] User display names (first name + last name)
- [x] Task tags
- [x] Responsive UI

### ⏳ In Progress / TODO
- [ ] **Email notifications on task assignment**
- [ ] **Email notifications on task reassignment**
- [ ] **Automated reminder emails (cron job)**
- [ ] **Email templates (5 types)**
- [ ] **SendGrid email service integration**
- [ ] Enable RLS policies for production
- [ ] Task statistics dedicated API endpoint

### 🎯 Next Priority (Post-MVP)
- [ ] Task comments/notes
- [ ] Task history/audit log
- [ ] Bulk actions (bulk complete, bulk delete, bulk reassign)
- [ ] Export to CSV
- [ ] Recurring tasks
- [ ] Subtasks
- [ ] Task attachments

### 🚀 Future Enhancements
- [ ] Task templates
- [ ] Time tracking
- [ ] Task dependencies
- [ ] Gantt chart view
- [ ] Team workload view
- [ ] Custom fields
- [ ] Task categories/types
- [ ] Advanced filtering (date ranges, multiple tags)
- [ ] Task duplication
- [ ] Slack integration

---

## Tech Stack

- **Frontend**: React, Next.js 15, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase PostgreSQL
- **Auth**: Supabase Auth
- **Emails**: SendGrid
- **Cron**: Vercel Cron Jobs

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

## Current File Structure

```
dashboard/
├── app/
│   └── api/
│       └── tasks/
│           ├── route.ts                    # ✅ List, Create (TODO: add email)
│           └── [id]/
│               ├── route.ts                # ✅ Get, Update, Delete (TODO: add email on reassign)
│               └── complete/
│                   └── route.ts            # ✅ Mark complete
├── components/
│   └── tasks/
│       ├── TasksList.tsx                   # ✅ Main list with filters, stats, toggle
│       ├── TaskItem.tsx                    # ✅ Individual task row
│       └── TaskModal.tsx                   # ✅ Create/edit form
└── supabase/
    └── migrations/
        └── 001_create_tasks.sql            # ✅ Database schema

# TODO: Files to Create for Email System
dashboard/
├── app/
│   └── api/
│       └── cron/
│           └── send-reminders/
│               └── route.ts                # ⏳ Cron job for automated reminders
├── lib/
│   └── email/
│       ├── client.ts                       # ⏳ SendGrid client setup
│       ├── send-task-email.ts              # ⏳ Email sending functions
│       └── templates/
│           ├── task-assigned.tsx           # ⏳ Assignment email
│           ├── task-reassigned.tsx         # ⏳ Reassignment email
│           ├── task-reminder-3d.tsx        # ⏳ 3-day reminder
│           ├── task-reminder-1d.tsx        # ⏳ 1-day reminder
│           └── task-overdue.tsx            # ⏳ Overdue reminder
└── vercel.json                             # ⏳ Cron job configuration
```

---

## Implementation Notes

### Current Behavior
- Tasks are scoped to accounts (each task belongs to one account via `sf_account_id`)
- RLS is **currently disabled** for development (`ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY`)
- User display names show `first_name + last_name` from `user_metadata`, fallback to email
- Status filter removed from UI (uses Active/Completed toggle instead)
- Tags stored as PostgreSQL array for easy filtering
- Auto-archive function exists in DB but not scheduled yet

### Email System TODO
- Reminders will be sent via cron job (not real-time) running daily at 9 AM UTC
- Need to add demo/test mode flag to disable actual email sending in development
- Edge case handling needed for tasks created overdue or due within 24 hours
- Consider immediate notifications for urgent tasks vs. waiting for next cron run

### Database Schema Notes
- `reminder_3d_sent`, `reminder_1d_sent`, `overdue_reminder_sent` track which reminders have been sent
- `reminder_1h_sent` field exists but 1-hour reminder not implemented (removed from scope)
- `last_reminder_sent_at` timestamp tracks most recent reminder
- Database functions `get_tasks_needing_reminders()` and `mark_reminder_sent()` ready to use

### Future Considerations
- May need to enable RLS before production deployment
- Consider adding email preferences (allow users to opt out of certain reminders)
- Consider adding task watchers (CC other team members on task updates)
- May want to add email digest option (daily summary instead of individual emails)

---

## Success Criteria

### ✅ Completed
- ✅ CSMs can create and assign tasks
- ✅ CSMs can edit and delete tasks
- ✅ Tasks visible on account detail page in dedicated "Tasks" tab
- ✅ Overdue tasks highlighted in red with alert indicator
- ✅ Due today tasks highlighted in orange
- ✅ Statistics accurate (total, overdue, due today, completed counts)
- ✅ Filters work (priority, assignee, search)
- ✅ Sort options work (due date, priority, created date, title)
- ✅ Mobile responsive design
- ✅ User names display correctly (first name + last name)
- ✅ Task completion with checkbox interaction
- ✅ Active/Completed view toggle

### ⏳ Pending
- ⏳ Email notifications sent on task assignment
- ⏳ Email notifications sent on task reassignment
- ⏳ Automated reminder emails via cron job
- ⏳ RLS policies enabled for production security

## Quick Start for Email Implementation

1. **Install SendGrid package:**
   ```bash
   cd dashboard
   npm install @sendgrid/mail
   ```

2. **Add environment variables to `.env.local`:**
   ```env
   SENDGRID_API_KEY=your_sendgrid_api_key
   EMAIL_FROM=tasks@yourdomain.com
   EMAIL_FROM_NAME="Task Management System"
   CRON_SECRET=your_random_secret_for_cron_auth
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

3. **Create SendGrid client** (`dashboard/lib/email/client.ts`):
   ```typescript
   import sgMail from '@sendgrid/mail';

   sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

   export { sgMail };
   ```

4. **Create email templates** (5 templates in `dashboard/lib/email/templates/`)
   - Use SendGrid's dynamic template format
   - Or build HTML templates with React Email

5. **Create email sending functions** (`dashboard/lib/email/send-task-email.ts`):
   - `sendTaskAssignmentEmail()`
   - `sendTaskReassignmentEmail()`
   - `sendTaskReminderEmail()`
   - `sendImmediateReminderEmail()`

6. **Update API routes:**
   - `POST /api/tasks` - Add `await sendTaskAssignmentEmail()`
   - `PATCH /api/tasks/[id]` - Add reassignment email logic

7. **Create cron endpoint** (`dashboard/app/api/cron/send-reminders/route.ts`)

8. **Add Vercel cron config** (`vercel.json`):
   ```json
   {
     "crons": [{
       "path": "/api/cron/send-reminders",
       "schedule": "0 9 * * *"
     }]
   }
   ```

9. **Test thoroughly:**
   - Test in development with real email to yourself
   - Test all 5 email types
   - Test edge cases (overdue, due today, reassignment)
   - Verify SendGrid dashboard shows sent emails
   - Deploy to staging/preview environment
   - Enable in production
