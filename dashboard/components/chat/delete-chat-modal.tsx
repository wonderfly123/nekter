'use client';

import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface DeleteChatModalProps {
  chatTitle: string;
  onConfirm: () => void;
  onClose: () => void;
}

export function DeleteChatModal({ chatTitle, onConfirm, onClose }: DeleteChatModalProps) {
  const [confirmText, setConfirmText] = useState('');
  const isDeleteEnabled = confirmText.toLowerCase() === 'delete';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isDeleteEnabled) {
      onConfirm();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Delete Chat</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">
              Are you sure you want to delete this chat? This action cannot be undone.
            </p>
            <p className="text-sm font-medium text-gray-900 bg-gray-50 p-3 rounded border border-gray-200">
              {chatTitle}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-700 mb-2">
              Type <span className="font-semibold text-red-600">delete</span> to confirm:
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Type delete"
              autoFocus
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!isDeleteEnabled}
            >
              Delete Chat
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
