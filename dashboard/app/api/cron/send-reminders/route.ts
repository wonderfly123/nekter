import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { sendTaskReminderEmail } from '@/lib/email/send-task-email';

// Create Supabase client with service role
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

interface TaskReminder {
  task_id: string;
  task_title: string;
  due_date: string;
  assignee_email: string;
  assignee_name: string;
  account_name: string;
  reminder_type: '3_days_before' | '1_day_before' | 'overdue';
}

export async function GET(request: Request) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Cron] Starting reminder email job...');

    // Get tasks needing reminders from database function
    const { data: reminders, error } = await supabase
      .rpc('get_tasks_needing_reminders') as { data: TaskReminder[] | null, error: any };

    if (error) {
      console.error('[Cron] Error fetching tasks needing reminders:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!reminders || reminders.length === 0) {
      console.log('[Cron] No tasks need reminders at this time');
      return NextResponse.json({ sent: 0, message: 'No reminders to send' });
    }

    console.log(`[Cron] Found ${reminders.length} tasks needing reminders`);

    let sentCount = 0;
    let errorCount = 0;

    // Send emails for each reminder
    for (const reminder of reminders) {
      try {
        // Fetch full task details
        const { data: task } = await supabase
          .from('tasks')
          .select('*')
          .eq('id', reminder.task_id)
          .single();

        if (!task) {
          console.error(`[Cron] Task ${reminder.task_id} not found`);
          continue;
        }

        // Fetch assignee details
        const { data: assigneeData } = await supabase.auth.admin.getUserById(task.assignee_id);

        // Fetch account details
        const { data: accountData } = await supabase
          .from('accounts')
          .select('sf_account_id, name')
          .eq('sf_account_id', task.sf_account_id)
          .single();

        if (!assigneeData?.user || !accountData) {
          console.error(`[Cron] Missing data for task ${reminder.task_id}`);
          continue;
        }

        // Send reminder email
        await sendTaskReminderEmail({
          task,
          assignee: assigneeData.user as any,
          account: accountData,
          reminderType: reminder.reminder_type,
        });

        // Mark reminder as sent in database
        const { error: markError } = await supabase.rpc('mark_reminder_sent', {
          p_task_id: reminder.task_id,
          p_reminder_type: reminder.reminder_type,
        });

        if (markError) {
          console.error(`[Cron] Error marking reminder as sent for task ${reminder.task_id}:`, markError);
        } else {
          sentCount++;
          console.log(`[Cron] Sent ${reminder.reminder_type} reminder for task ${reminder.task_id}`);
        }
      } catch (emailError) {
        errorCount++;
        console.error(`[Cron] Error sending reminder for task ${reminder.task_id}:`, emailError);
      }
    }

    console.log(`[Cron] Reminder job complete. Sent: ${sentCount}, Errors: ${errorCount}`);

    return NextResponse.json({
      sent: sentCount,
      errors: errorCount,
      total: reminders.length,
      message: `Successfully sent ${sentCount} reminders`
    });
  } catch (error: any) {
    console.error('[Cron] Fatal error in send-reminders job:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
