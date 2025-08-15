// src/components/admin/resolved/BulkActions.tsx
'use client';

import { useState, useCallback } from 'react';
import { RotateCcw, Trash2 } from 'lucide-react';
import type { BulkActionsProps } from '@/types/resolved';

export default function BulkActions({
  selectedCount,
  totalCount,
  onSelectAll,
  onClearSelection,
  onBulkRestore,
  onBulkDelete
}: BulkActionsProps) {
  const [busy, setBusy] = useState<'none' | 'restore' | 'delete'>('none');

  if (!Number.isFinite(selectedCount) || selectedCount <= 0) return null;

  const handleBulkRestore = useCallback(async () => {
    if (busy !== 'none') return;
    setBusy('restore');
    try {
      await Promise.resolve(onBulkRestore());
    } finally {
      setBusy('none');
    }
  }, [onBulkRestore, busy]);

  const handleBulkDelete = useCallback(async () => {
    if (busy !== 'none') return;
    setBusy('delete');
    try {
      await Promise.resolve(onBulkDelete());
    } finally {
      setBusy('none');
    }
  }, [onBulkDelete, busy]);

  return (
    <div
      className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 mb-6 flex items-center justify-between"
      role="region"
      aria-label="Bulk actions"
    >
      <div className="flex items-center gap-4">
        <input
          type="checkbox"
          checked={selectedCount === totalCount && totalCount > 0}
          onChange={onSelectAll}
          className="w-4 h-4 text-[#ff950e] bg-gray-700 border-gray-600 rounded focus:ring-[#ff950e]"
          aria-label="Select all"
        />
        <span className="text-white">
          {Math.max(0, selectedCount)} of {Math.max(0, totalCount)} selected
        </span>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onClearSelection}
          className="px-3 py-1.5 bg-[#222] text-white rounded hover:bg-[#333] transition"
          aria-label="Clear selection"
        >
          Clear Selection
        </button>
        <button
          type="button"
          onClick={handleBulkRestore}
          disabled={busy !== 'none'}
          className="px-3 py-1.5 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          aria-label="Restore selected"
        >
          <RotateCcw size={16} />
          {busy === 'restore' ? 'Restoring…' : 'Restore Selected'}
        </button>
        <button
          type="button"
          onClick={handleBulkDelete}
          disabled={busy !== 'none'}
          className="px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 transition flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          aria-label="Delete selected permanently"
        >
          <Trash2 size={16} />
          {busy === 'delete' ? 'Deleting…' : 'Delete Selected'}
        </button>
      </div>
    </div>
  );
}
