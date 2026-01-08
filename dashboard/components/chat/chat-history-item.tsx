'use client';

import { useState, useEffect, useRef } from 'react';
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChatSessionWithPreview } from '@/lib/supabase/types';
import { DeleteChatModal } from './delete-chat-modal';

interface ChatHistoryItemProps {
  session: ChatSessionWithPreview;
  isActive: boolean;
  onClick: () => void;
  onDelete: (sessionId: string) => void;
  onRename: (sessionId: string, newTitle: string) => void;
}

export function ChatHistoryItem({ session, isActive, onClick, onDelete, onRename }: ChatHistoryItemProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(session.title);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu]);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteModal(true);
    setShowMenu(false);
  };

  const handleConfirmDelete = () => {
    onDelete(session.id);
  };

  const handleRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditTitle(session.title); // Sync with current title before editing
    setIsEditing(true);
    setShowMenu(false);
  };

  const handleSaveRename = (e?: React.FormEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (editTitle.trim() && editTitle !== session.title) {
      onRename(session.id, editTitle.trim());
    } else if (!editTitle.trim()) {
      // Reset to original if empty
      setEditTitle(session.title);
    }
    setIsEditing(false);
  };

  return (
    <div className="relative group" ref={menuRef}>
      <button
        onClick={onClick}
        className={cn(
          'w-full text-left px-3 py-3 rounded-lg mb-2 bg-gray-50 dark:bg-gray-800 border-2 transition-all duration-300 cursor-pointer hover:bg-white dark:hover:bg-gray-700 hover:border-amber-500 hover:shadow-lg hover:-translate-y-0.5',
          isActive ? 'bg-white dark:bg-gray-700 border-amber-500 shadow-md' : 'border-gray-200 dark:border-gray-700'
        )}
      >
        {isEditing ? (
          <form onSubmit={handleSaveRename} className="flex gap-1" onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={() => handleSaveRename()}
              autoFocus
              className="flex-1 px-2 py-1 text-sm border border-amber-500 rounded focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              onClick={(e) => e.stopPropagation()}
            />
          </form>
        ) : (
          <>
            <div className="font-semibold text-sm text-gray-900 dark:text-white mb-1 truncate pr-8">
              {session.title}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {session.preview}
            </div>
          </>
        )}
      </button>

      {/* Menu Button */}
      {!isEditing && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="absolute right-2 top-3 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-600 transition-opacity"
        >
          <MoreVertical className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>
      )}

      {/* Dropdown Menu */}
      {showMenu && (
        <div className="absolute right-2 top-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 py-1 min-w-[120px]">
          <button
            onClick={handleRename}
            className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
          >
            <Pencil className="w-3.5 h-3.5" />
            Rename
          </button>
          <button
            onClick={handleDelete}
            className="w-full px-3 py-2 text-left text-sm hover:bg-status-error-bg text-status-error-text flex items-center gap-2"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <DeleteChatModal
          chatTitle={session.title}
          onConfirm={handleConfirmDelete}
          onClose={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
}
