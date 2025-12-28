'use client';

import { Pin, Edit2, Trash2, Clock } from 'lucide-react';

interface Note {
  id: string;
  title: string;
  content: string | null;
  sf_account_id: string;
  created_by: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

interface NoteItemProps {
  note: Note;
  onPin: (noteId: string) => void;
  onEdit: (note: Note) => void;
  onDelete: (noteId: string) => void;
}

export function NoteItem({ note, onPin, onEdit, onDelete }: NoteItemProps) {
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
    }
    if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months === 1 ? '' : 's'} ago`;
    }
    const years = Math.floor(diffDays / 365);
    return `${years} year${years === 1 ? '' : 's'} ago`;
  };

  return (
    <div className={`p-4 hover:bg-gray-50 transition-colors ${note.is_pinned ? 'bg-yellow-50' : ''}`}>
      <div className="flex items-start gap-4">
        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <div className="flex items-start gap-2 mb-2">
            <h3 className="flex-1 font-semibold text-gray-900 truncate">
              {note.title}
            </h3>
          </div>

          {/* Content Preview */}
          {note.content && (
            <p className="text-sm text-gray-600 mb-2 line-clamp-3 whitespace-pre-wrap">
              {note.content}
            </p>
          )}

          {/* Timestamp */}
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span>{formatRelativeTime(note.created_at)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPin(note.id)}
            className={`p-1.5 rounded transition-colors ${
              note.is_pinned
                ? 'text-orange-600 hover:text-orange-700 hover:bg-orange-100'
                : 'text-gray-400 hover:text-orange-600 hover:bg-orange-50'
            }`}
            title={note.is_pinned ? 'Unpin note' : 'Pin note'}
          >
            <Pin className={`w-4 h-4 ${note.is_pinned ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={() => onEdit(note)}
            className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
            title="Edit note"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(note.id)}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Delete note"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
