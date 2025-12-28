'use client';

import { CheckCircle2, Circle, Calendar, AlertCircle, Edit2, Trash2, User } from 'lucide-react';

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

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

interface TaskItemProps {
  task: Task;
  users: User[];
  onComplete: (taskId: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

export function TaskItem({ task, users, onComplete, onEdit, onDelete }: TaskItemProps) {
  const isCompleted = task.status === 'completed';
  const dueDate = new Date(task.due_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isOverdue = !isCompleted && dueDate < today;
  const isDueToday = !isCompleted && dueDate.toDateString() === today.toDateString();

  const priorityColors = {
    high: 'text-red-600 bg-red-50 border-red-200',
    medium: 'text-orange-600 bg-orange-50 border-orange-200',
    low: 'text-blue-600 bg-blue-50 border-blue-200'
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;
    if (diffDays < 7) return `In ${diffDays} days`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Get assignee info
  const assignee = users.find(u => u.id === task.assignee_id);
  const getAssigneeName = () => {
    if (!assignee) return 'Unknown';
    const firstName = assignee.first_name;
    const lastName = assignee.last_name;
    if (firstName || lastName) {
      return `${firstName || ''} ${lastName || ''}`.trim();
    }
    return assignee.email;
  };

  const getAssigneeInitials = () => {
    if (!assignee) return 'U';
    const firstName = assignee.first_name;
    const lastName = assignee.last_name;
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    if (firstName) {
      return firstName.charAt(0).toUpperCase();
    }
    return (assignee.email || 'U').charAt(0).toUpperCase();
  };

  return (
    <div className={`p-4 hover:bg-gray-50 transition-colors ${isCompleted ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-4">
        {/* Checkbox */}
        <button
          onClick={() => onComplete(task.id)}
          className="mt-1 flex-shrink-0 cursor-pointer"
        >
          {isCompleted ? (
            <CheckCircle2 className="w-5 h-5 text-green-600 hover:text-green-700 transition-colors" />
          ) : (
            <Circle className="w-5 h-5 text-gray-400 hover:text-orange-600 transition-colors" />
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title and Priority */}
          <div className="flex items-start gap-2 mb-1">
            <h3 className={`flex-1 font-medium text-gray-900 ${isCompleted ? 'line-through' : ''}`}>
              {task.title}
            </h3>
            <span className={`px-2 py-0.5 text-xs font-semibold rounded border uppercase ${priorityColors[task.priority]}`}>
              {task.priority}
            </span>
          </div>

          {/* Description */}
          {task.description && (
            <p className="text-sm text-gray-600 mb-2 line-clamp-2">{task.description}</p>
          )}

          {/* Meta info */}
          <div className="flex items-center gap-4 text-sm">
            {/* Due Date */}
            <div className={`flex items-center gap-1 ${
              isOverdue ? 'text-red-600 font-medium' :
              isDueToday ? 'text-orange-600 font-medium' :
              'text-gray-600'
            }`}>
              {isOverdue && <AlertCircle className="w-4 h-4" />}
              <Calendar className="w-4 h-4" />
              <span>{formatDate(task.due_date)}</span>
              {isOverdue && <span className="ml-1">(Overdue)</span>}
              {isDueToday && <span className="ml-1">(Today)</span>}
            </div>

            {/* Assignee */}
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full bg-orange-600 text-white flex items-center justify-center text-xs font-semibold">
                {getAssigneeInitials()}
              </div>
              <span className="text-gray-600">{getAssigneeName()}</span>
            </div>

            {/* Tags */}
            {task.tags && task.tags.length > 0 && (
              <div className="flex gap-1">
                {task.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        {!isCompleted && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(task)}
              className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
              title="Edit task"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(task.id)}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Delete task"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
