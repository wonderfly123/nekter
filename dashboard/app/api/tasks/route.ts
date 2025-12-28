import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { sendTaskAssignmentEmail, sendImmediateReminderEmail } from '@/lib/email/send-task-email';

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

// GET - List tasks with filters
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const authCheck = await verifyAuth(authHeader);

    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { searchParams } = new URL(request.url);
    const sfAccountId = searchParams.get('sfAccountId');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const assigneeId = searchParams.get('assigneeId');
    const search = searchParams.get('search');

    // Build query
    let query = supabase
      .from('tasks')
      .select('*');

    // Apply filters
    if (sfAccountId) {
      query = query.eq('sf_account_id', sfAccountId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (priority) {
      query = query.eq('priority', priority);
    }

    if (assigneeId) {
      query = query.eq('assignee_id', assigneeId);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Order by due date (soonest first)
    query = query.order('due_date', { ascending: true });

    const { data: tasks, error } = await query;

    if (error) {
      console.error('Error fetching tasks:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Calculate statistics
    const total = tasks?.length || 0;
    const overdue = tasks?.filter(t =>
      t.status === 'active' && new Date(t.due_date) < new Date()
    ).length || 0;
    const dueToday = tasks?.filter(t => {
      if (t.status !== 'active') return false;
      const today = new Date().toDateString();
      const taskDate = new Date(t.due_date).toDateString();
      return today === taskDate;
    }).length || 0;

    return NextResponse.json({
      tasks: tasks || [],
      total,
      overdue,
      dueToday
    });
  } catch (error: any) {
    console.error('Error in GET /api/tasks:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create new task
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const authCheck = await verifyAuth(authHeader);

    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { user } = authCheck;
    const body = await request.json();

    const {
      sfAccountId,
      title,
      description,
      priority = 'medium',
      dueDate,
      assigneeId,
      tags = []
    } = body;

    // Validate required fields
    if (!sfAccountId || !title || !dueDate || !assigneeId) {
      return NextResponse.json({
        error: 'Missing required fields: sfAccountId, title, dueDate, assigneeId'
      }, { status: 400 });
    }

    // Validate priority
    if (!['low', 'medium', 'high'].includes(priority)) {
      return NextResponse.json({
        error: 'Invalid priority. Must be: low, medium, or high'
      }, { status: 400 });
    }

    // Create task
    const { data: task, error } = await supabase
      .from('tasks')
      .insert({
        sf_account_id: sfAccountId,
        title,
        description,
        priority,
        due_date: dueDate,
        assignee_id: assigneeId,
        created_by: user.id,
        tags,
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating task:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch assignee and account details for email
    try {
      const { data: assigneeData } = await supabase.auth.admin.getUserById(assigneeId);
      const { data: accountData } = await supabase
        .from('accounts')
        .select('sf_account_id, name')
        .eq('sf_account_id', sfAccountId)
        .single();

      if (assigneeData?.user && accountData) {
        // Send assignment email
        await sendTaskAssignmentEmail({
          task,
          assignee: assigneeData.user,
          account: accountData,
          createdBy: user,
        });

        // Send immediate reminder if task is overdue or due today
        await sendImmediateReminderEmail({
          task,
          assignee: assigneeData.user,
          account: accountData,
        });
      }
    } catch (emailError) {
      console.error('Error sending task assignment email:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({ task }, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/tasks:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
