import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { sendTaskAssignmentEmail } from '@/lib/email/send-task-email';
import { sendTaskSlackNotification } from '@/lib/slack';

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

// GET - Get single task
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization');
    const authCheck = await verifyAuth(authHeader);

    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { id } = await params;

    const { data: task, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching task:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({ task });
  } catch (error: any) {
    console.error('Error in GET /api/tasks/[id]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - Update task
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization');
    const authCheck = await verifyAuth(authHeader);

    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { user } = authCheck;
    const { id } = await params;
    const body = await request.json();

    const {
      title,
      description,
      priority,
      dueDate,
      assigneeId,
      tags,
      status
    } = body;

    // Get the existing task to check if assignee changed
    const { data: oldTask } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();

    // Build update object with only provided fields
    const updates: any = {};

    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (priority !== undefined) {
      if (!['low', 'medium', 'high'].includes(priority)) {
        return NextResponse.json({
          error: 'Invalid priority. Must be: low, medium, or high'
        }, { status: 400 });
      }
      updates.priority = priority;
    }
    if (dueDate !== undefined) updates.due_date = dueDate;
    if (assigneeId !== undefined) updates.assignee_id = assigneeId;
    if (tags !== undefined) updates.tags = tags;
    if (status !== undefined) {
      if (!['active', 'completed', 'archived'].includes(status)) {
        return NextResponse.json({
          error: 'Invalid status. Must be: active, completed, or archived'
        }, { status: 400 });
      }
      updates.status = status;

      // Set completed_at if status is completed
      if (status === 'completed' && !updates.completed_at) {
        updates.completed_at = new Date().toISOString();
      }

      // Set archived_at if status is archived
      if (status === 'archived' && !updates.archived_at) {
        updates.archived_at = new Date().toISOString();
      }
    }

    // Update task
    const { data: task, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating task:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Send email if assignee changed
    if (oldTask && assigneeId && assigneeId !== oldTask.assignee_id) {
      try {
        const { data: newAssigneeData } = await supabase.auth.admin.getUserById(assigneeId);
        const { data: accountData } = await supabase
          .from('accounts')
          .select('sf_account_id, name')
          .eq('sf_account_id', task.sf_account_id)
          .single();

        if (newAssigneeData?.user && accountData) {
          // Send assignment email to new assignee
          await sendTaskAssignmentEmail({
            task,
            assignee: newAssigneeData.user as any,
            account: accountData,
            createdBy: user as any,
          });

          // Create notification for task reassignment
          try {
            const reassignerName = user.user_metadata?.first_name && user.user_metadata?.last_name
              ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
              : user.email || 'Someone';

            await supabase
              .from('notifications')
              .insert({
                user_id: assigneeId,
                type: 'task_reassigned',
                title: 'Task Assigned to You',
                message: `${reassignerName} assigned you a task: ${task.title}`,
                related_entity_type: 'task',
                related_entity_id: task.id
              });

            // Send Slack notification
            await sendTaskSlackNotification(
              assigneeId,
              newAssigneeData.user.email || '',
              {
                type: 'task_reassigned',
                taskTitle: task.title,
                taskId: task.id,
                accountId: task.sf_account_id,
                assignerName: reassignerName,
                accountName: accountData.name,
                priority: task.priority,
                dueDate: task.due_date ? new Date(task.due_date).toLocaleDateString() : undefined,
              }
            );
          } catch (notifError) {
            console.error('Error creating notification:', notifError);
            // Don't fail the request if notification creation fails
          }
        }
      } catch (emailError) {
        console.error('Error sending task reassignment email:', emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({ task });
  } catch (error: any) {
    console.error('Error in PATCH /api/tasks/[id]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete task
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization');
    const authCheck = await verifyAuth(authHeader);

    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { id } = await params;

    // Delete related notifications first
    await supabase
      .from('notifications')
      .delete()
      .eq('related_entity_type', 'task')
      .eq('related_entity_id', id);

    // Delete the task
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting task:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in DELETE /api/tasks/[id]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
