'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { NoteItem } from './NoteItem';
import { NoteModal } from './NoteModal';
import { DeleteNoteModal } from './DeleteNoteModal';
import { Plus, Search } from 'lucide-react';

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

interface NotesListProps {
  sfAccountId: string;
}

export function NotesList({ sfAccountId }: NotesListProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingNote, setDeletingNote] = useState<Note | null>(null);

  useEffect(() => {
    fetchNotes();
  }, [sfAccountId, searchQuery]);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const params = new URLSearchParams({
        sfAccountId
      });

      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await fetch(`/api/notes?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notes');
      }

      const data = await response.json();
      setNotes(data.notes || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = () => {
    setEditingNote(null);
    setIsModalOpen(true);
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setIsModalOpen(true);
  };

  const handlePinToggle = async (noteId: string) => {
    // Optimistic update - update UI immediately
    setNotes(prevNotes =>
      prevNotes.map(note =>
        note.id === noteId
          ? { ...note, is_pinned: !note.is_pinned }
          : note
      ).sort((a, b) => {
        // Re-sort: pinned first, then by date
        if (a.is_pinned !== b.is_pinned) {
          return a.is_pinned ? -1 : 1;
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      })
    );

    // Then sync with server
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Revert on auth failure
        fetchNotes();
        return;
      }

      const response = await fetch(`/api/notes/${noteId}/pin`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to toggle note pin');
      }

      // Success - optimistic update already applied, no need to refresh
    } catch (error) {
      console.error('Error toggling note pin:', error);
      // Revert on error
      fetchNotes();
    }
  };

  const handleDeleteNote = (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (note) {
      setDeletingNote(note);
    }
  };

  const confirmDeleteNote = async () => {
    if (!deletingNote) return;

    // Optimistic update - remove note from UI immediately
    const noteId = deletingNote.id;
    setNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Revert on auth failure
        setNotes(prevNotes => [...prevNotes, deletingNote]);
        return;
      }

      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete note');
      }

      // Success - optimistic update already applied, no need to refresh
    } catch (error) {
      console.error('Error deleting note:', error);
      // Revert on error
      fetchNotes();
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingNote(null);
    fetchNotes();
  };

  // Split notes into pinned and regular
  const pinnedNotes = notes.filter(note => note.is_pinned);
  const regularNotes = notes.filter(note => !note.is_pinned);

  return (
    <div className="space-y-6">
      {/* Search and Create */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex gap-3 items-center">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {/* Create Button */}
          <button
            onClick={handleCreateNote}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white text-sm rounded hover:bg-orange-700 transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            New Note
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
          Loading notes...
        </div>
      ) : (
        <>
          {/* Pinned Notes Section */}
          {pinnedNotes.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-5 py-3 bg-yellow-50 border-b border-yellow-200">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                  Pinned Notes
                </h3>
              </div>
              <div className="divide-y divide-gray-200">
                {pinnedNotes.map((note) => (
                  <NoteItem
                    key={note.id}
                    note={note}
                    onPin={handlePinToggle}
                    onEdit={handleEditNote}
                    onDelete={handleDeleteNote}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Regular Notes Section */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                Notes
              </h3>
            </div>
            {regularNotes.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                {searchQuery
                  ? 'No notes found matching your search.'
                  : pinnedNotes.length > 0
                  ? 'No more notes. All notes are pinned.'
                  : 'No notes yet. Create your first note to get started.'}
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {regularNotes.map((note) => (
                  <NoteItem
                    key={note.id}
                    note={note}
                    onPin={handlePinToggle}
                    onEdit={handleEditNote}
                    onDelete={handleDeleteNote}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Note Modal */}
      {isModalOpen && (
        <NoteModal
          sfAccountId={sfAccountId}
          note={editingNote}
          onClose={handleModalClose}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingNote && (
        <DeleteNoteModal
          noteTitle={deletingNote.title}
          onConfirm={confirmDeleteNote}
          onClose={() => setDeletingNote(null)}
        />
      )}
    </div>
  );
}
