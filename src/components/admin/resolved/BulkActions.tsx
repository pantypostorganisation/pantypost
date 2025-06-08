// src/components/admin/resolved/BulkActions.tsx
'use client';

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
  if (selectedCount === 0) return null;

  return (
    <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 mb-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <input
          type="checkbox"
          checked={selectedCount === totalCount}
          onChange={onSelectAll}
          className="w-4 h-4 text-[#ff950e] bg-gray-700 border-gray-600 rounded focus:ring-[#ff950e]"
        />
        <span className="text-white">
          {selectedCount} of {totalCount} selected
        </span>
      </div>
      
      <div className="flex gap-2">
        <button
          onClick={onClearSelection}
          className="px-3 py-1.5 bg-[#222] text-white rounded hover:bg-[#333] transition"
        >
          Clear Selection
        </button>
        <button
          onClick={onBulkRestore}
          className="px-3 py-1.5 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition flex items-center gap-2"
        >
          <RotateCcw size={16} />
          Restore Selected
        </button>
        <button
          onClick={onBulkDelete}
          className="px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 transition flex items-center gap-2"
        >
          <Trash2 size={16} />
          Delete Selected
        </button>
      </div>
    </div>
  );
}
