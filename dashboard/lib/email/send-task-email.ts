import { sgMail } from './client';
import { generateTaskAssignedEmail, TaskAssignedEmailData } from './templates/task-assigned';
import { generateTaskReminderEmail, TaskReminderEmailData } from './templates/task-reminder';

const EMAIL_FROM = process.env.EMAIL_FROM || 'tasks@example.com';
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || 'Task Management System';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: 'low' | 'medium' | 'high';
  due_date: string;
  sf_account_id: string;
}

interface User {
  id: string;
  email?: string;
  user_metadata?: {
    first_name?: string;
    last_name?: string;
  };
}

interface Account {
  sf_account_id: string;
  name: string;
}

function getUserDisplayName(user: User): string {
  const firstName = user.user_metadata?.first_name;
  const lastName = user.user_metadata?.last_name;
  if (firstName || lastName) {
    return `${firstName || ''} ${lastName || ''}`.trim();
  }
  return user.email;
}

function formatDueDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export async function sendTaskAssignmentEmail(params: {
  task: Task;
  assignee: User;
  account: Account;
  createdBy: User;
}): Promise<void> {
  const { task, assignee, account, createdBy } = params;

  // Skip if SendGrid is not configured
  if (!process.env.SENDGRID_API_KEY) {
    console.log('[Email] Skipping task assignment email - SendGrid not configured');
    return;
  }

  // Skip if assignee has no email
  if (!assignee.email) {
    console.log('[Email] Skipping task assignment email - assignee has no email');
    return;
  }

  const taskUrl = `${APP_URL}/accounts/${task.sf_account_id}?tab=tasks`;

  const emailData: TaskAssignedEmailData = {
    taskTitle: task.title,
    taskDescription: task.description,
    accountName: account.name,
    priority: task.priority,
    dueDate: formatDueDate(task.due_date),
    assigneeName: getUserDisplayName(assignee),
    createdByName: getUserDisplayName(createdBy),
    taskUrl,
  };

  const htmlContent = generateTaskAssignedEmail(emailData);

  try {
    await sgMail.send({
      to: assignee.email,
      from: {
        email: EMAIL_FROM,
        name: EMAIL_FROM_NAME,
      },
      subject: `New Task Assigned: ${task.title}`,
      html: htmlContent,
    });

    console.log(`[Email] Task assignment email sent to ${assignee.email} for task ${task.id}`);
  } catch (error) {
    console.error('[Email] Failed to send task assignment email:', error);
    // Don't throw - we don't want to fail task creation if email fails
  }
}

export async function sendTaskReminderEmail(params: {
  task: Task & { id: string };
  assignee: User;
  account: Account;
  reminderType: '3_days_before' | '1_day_before' | 'overdue';
}): Promise<void> {
  const { task, assignee, account, reminderType } = params;

  // Skip if SendGrid is not configured
  if (!process.env.SENDGRID_API_KEY) {
    console.log('[Email] Skipping task reminder email - SendGrid not configured');
    return;
  }

  // Skip if assignee has no email
  if (!assignee.email) {
    console.log('[Email] Skipping task reminder email - assignee has no email');
    return;
  }

  const taskUrl = `${APP_URL}/accounts/${task.sf_account_id}?tab=tasks`;

  const emailData: TaskReminderEmailData = {
    taskTitle: task.title,
    taskDescription: task.description,
    accountName: account.name,
    priority: task.priority,
    dueDate: formatDueDate(task.due_date),
    assigneeName: getUserDisplayName(assignee),
    taskUrl,
    reminderType,
  };

  const htmlContent = generateTaskReminderEmail(emailData);

  const subjectMap = {
    '3_days_before': `Reminder: ${task.title} due in 3 days`,
    '1_day_before': `Reminder: ${task.title} due tomorrow`,
    'overdue': `OVERDUE: ${task.title}`,
  };

  try {
    await sgMail.send({
      to: assignee.email,
      from: {
        email: EMAIL_FROM,
        name: EMAIL_FROM_NAME,
      },
      subject: subjectMap[reminderType],
      html: htmlContent,
    });

    console.log(`[Email] Task reminder email (${reminderType}) sent to ${assignee.email} for task ${task.id}`);
  } catch (error) {
    console.error('[Email] Failed to send task reminder email:', error);
  }
}

export async function sendImmediateReminderEmail(params: {
  task: Task;
  assignee: User;
  account: Account;
}): Promise<void> {
  const { task, assignee, account } = params;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(task.due_date);
  dueDate.setHours(0, 0, 0, 0);

  let reminderType: '3_days_before' | '1_day_before' | 'overdue';

  if (dueDate < today) {
    reminderType = 'overdue';
  } else if (dueDate.getTime() === today.getTime()) {
    reminderType = '1_day_before'; // Reuse "due tomorrow" template for "due today"
  } else {
    // Don't send immediate reminder for future dates
    return;
  }

  await sendTaskReminderEmail({
    task: task as Task & { id: string },
    assignee,
    account,
    reminderType,
  });
}
