// src/components/buyers/messages/EditRequestForm.tsx
'use client';

import React from 'react';
import { Save, X } from 'lucide-react';

interface EditRequestFormProps {
  editTitle: string;
  setEditTitle: (title: string) => void;
  editPrice: number | '';
  setEditPrice: (price: number | '') => void;
  editTags: string;
  setEditTags: (tags: string) => void;
  editMessage: string;
  setEditMessage: (message: string) => void;
  handleEditSubmit: () => void;
  setEditRequestId: (id: string | null) => void;
}

export default function EditRequestForm({
  editTitle,
  setEditTitle,
  editPrice,
  setEditPrice,
  editTags,
  setEditTags,
  editMessage,
  setEditMessage,
  handleEditSubmit,
  setEditRequestId
}: EditRequestFormProps) {
  return (
    <div className="bg-[#222] p-4 rounded-lg border border-[#ff950e]/30">
      <h4 className="font-semibold text-white mb-3">Edit Custom Request</h4>
      
      <div className="space-y-3">
        <div>
          <label className="text-sm text-gray-400">Title</label>
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full bg-[#1a1a1a] text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
            placeholder="Request title..."
          />
        </div>
        
        <div>
          <label className="text-sm text-gray-400">Price ($)</label>
          <input
            type="number"
            value={editPrice}
            onChange={(e) => setEditPrice(e.target.value ? Number(e.target.value) : '')}
            className="w-full bg-[#1a1a1a] text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
            placeholder="0.00"
            min="0"
            step="0.01"
          />
        </div>
        
        <div>
          <label className="text-sm text-gray-400">Tags (comma separated)</label>
          <input
            type="text"
            value={editTags}
            onChange={(e) => setEditTags(e.target.value)}
            className="w-full bg-[#1a1a1a] text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
            placeholder="tag1, tag2, tag3"
          />
        </div>
        
        <div>
          <label className="text-sm text-gray-400">Description</label>
          <textarea
            value={editMessage}
            onChange={(e) => setEditMessage(e.target.value)}
            className="w-full bg-[#1a1a1a] text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff950e] resize-none"
            rows={3}
            placeholder="Describe your request..."
          />
        </div>
        
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => setEditRequestId(null)}
            className="px-3 py-1.5 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors flex items-center gap-1"
          >
            <X size={14} />
            Cancel
          </button>
          <button
            onClick={handleEditSubmit}
            className="px-3 py-1.5 bg-[#ff950e] text-black rounded text-sm hover:bg-[#e88800] transition-colors flex items-center gap-1 font-medium"
          >
            <Save size={14} />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
