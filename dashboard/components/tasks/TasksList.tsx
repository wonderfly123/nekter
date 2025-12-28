'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { TaskItem } from './TaskItem';
import { TaskModal } from './TaskModal';
import { Plus, Search } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'completed' | 'archived';
  priority: 'low' | 'medium' | 'high';
  sf_account_id: string;
  assignee_id: string;
  created_by: string;
  due_date: string;
  completed_at: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  tags: string[];
}

interface TasksListProps {
  sfAccountId: string;
}

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

export function TasksList({ sfAccountId }: TasksListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'created' | 'title'>('dueDate');

  // View toggle
  const [currentView, setCurrentView] = useState<'active' | 'completed'>('active');

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    overdue: 0,
    dueToday: 0,
    completed: 0,
    activeCount: 0,
    completedCount: 0
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [sfAccountId, statusFilter, priorityFilter, assigneeFilter, searchQuery, sortBy]);

  const fetchUsers = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const params = new URLSearchParams({
        sfAccountId
      });

      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      if (priorityFilter !== 'all') {
        params.append('priority', priorityFilter);
      }

      if (assigneeFilter !== 'all') {
        params.append('assigneeId', assigneeFilter);
      }

      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await fetch(`/api/tasks?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }

      const data = await response.json();
      let fetchedTasks = data.tasks || [];

      // Sort tasks
      fetchedTasks = sortTasks(fetchedTasks, sortBy);

      setTasks(fetchedTasks);

      // Calculate stats
      const activeTasks = fetchedTasks.filter((t: Task) => t.status === 'active');
      const completedTasks = fetchedTasks.filter((t: Task) => t.status === 'completed');

      setStats({
        total: data.total || 0,
        overdue: data.overdue || 0,
        dueToday: data.dueToday || 0,
        completed: completedTasks.length,
        activeCount: activeTasks.length,
        completedCount: completedTasks.length
      });
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const sortTasks = (tasksList: Task[], sortField: string) => {
    return [...tasksList].sort((a, b) => {
      switch (sortField) {
        case 'dueDate':
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        case 'priority':
          const priorityOrder = { high: 1, medium: 2, low: 3 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        case 'title':
          return a.title.localeCompare(b.title);
        case 'created':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });
  };

  const handleCreateTask = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleTaskComplete = async (taskId: string) => {
    // Optimistic update - update UI immediately
    setTasks(prevTasks =>
      prevTasks.map(task => {
        if (task.id === taskId) {
          const isCompleted = task.status === 'completed';
          return {
            ...task,
            status: isCompleted ? 'active' : 'completed',
            completed_at: isCompleted ? null : new Date().toISOString()
          } as Task;
        }
        return task;
      })
    );

    // Update stats optimistically
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      const isCompleted = task.status === 'completed';
      setStats(prev => ({
        ...prev,
        completed: isCompleted ? prev.completed - 1 : prev.completed + 1,
        activeCount: isCompleted ? prev.activeCount + 1 : prev.activeCount - 1,
        completedCount: isCompleted ? prev.completedCount - 1 : prev.completedCount + 1
      }));
    }

    // Then sync with server
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Revert on auth failure
        fetchTasks();
        return;
      }

      const response = await fetch(`/api/tasks/${taskId}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to toggle task completion');
      }

      // Success - optimistic update already applied, no need to refresh
    } catch (error) {
      console.error('Error toggling task completion:', error);
      // Revert on error
      fetchTasks();
    }
  };

  const handleTaskDelete = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete task');
      }

      fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };


  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingTask(null);
    fetchTasks();
  };


  const filteredTasks = tasks.filter(task => task.status === currentView);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Total Tasks</div>
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Overdue</div>
          <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Due Today</div>
          <div className="text-2xl font-bold text-orange-600">{stats.dueToday}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Completed</div>
          <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col gap-3">
          {/* First Row: Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            {/* Priority Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 font-medium">Priority:</span>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="all">All Priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            {/* Assignee Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 font-medium">Assigned to:</span>
              <select
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent min-w-[150px]"
              >
                <option value="all">All Team</option>
                {users.map(user => {
                  const firstName = user.first_name || '';
                  const lastName = user.last_name || '';
                  let displayName = user.email;

                  if (firstName && lastName) {
                    displayName = `${firstName} ${lastName}`;
                  } else if (firstName) {
                    displayName = firstName;
                  } else if (lastName) {
                    displayName = lastName;
                  }

                  return (
                    <option key={user.id} value={user.id}>
                      {displayName}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Second Row: Search and Create */}
          <div className="flex gap-3 items-center">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            {/* Create Button */}
            <button
              onClick={handleCreateTask}
              className="flex items-center gap-2 px-4 py-1.5 bg-orange-600 text-white text-sm rounded hover:bg-orange-700 transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              New Task
            </button>
          </div>
        </div>
      </div>

      {/* Tasks Section */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Header with View Toggle and Sort */}
        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-base font-semibold text-gray-900">Tasks</div>
            <div className="flex gap-1 bg-gray-100 p-1 rounded">
              <button
                onClick={() => setCurrentView('active')}
                className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                  currentView === 'active'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Active <span className="ml-1 font-semibold">{stats.activeCount}</span>
              </button>
              <button
                onClick={() => setCurrentView('completed')}
                className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                  currentView === 'completed'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Completed <span className="ml-1 font-semibold">{stats.completedCount}</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Sort By */}
            <span className="text-sm text-gray-500">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="dueDate">Due Date</option>
              <option value="priority">Priority</option>
              <option value="created">Created Date</option>
              <option value="title">Title</option>
            </select>
          </div>
        </div>

        {/* Tasks List */}
        <div className="max-h-[600px] overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading tasks...</div>
          ) : filteredTasks.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No {currentView} tasks found. {currentView === 'active' && 'Create your first task to get started.'}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  users={users}
                  onComplete={handleTaskComplete}
                  onEdit={handleEditTask}
                  onDelete={handleTaskDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Task Modal */}
      {isModalOpen && (
        <TaskModal
          sfAccountId={sfAccountId}
          task={editingTask}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}
