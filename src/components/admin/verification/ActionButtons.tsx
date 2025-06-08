// src/components/admin/verification/ActionButtons.tsx
'use client';

import { CheckCircle, XCircle } from 'lucide-react';
import type { ActionButtonsProps } from '@/types/verification';

export default function ActionButtons({
  showRejectInput,
  rejectReason,
  onApprove,
  onReject,
  onRejectInputShow,
  onRejectInputCancel,
  onRejectReasonChange
}: ActionButtonsProps) {
  if (!showRejectInput) {
    return (
      <div className="flex gap-3">
        <button
          onClick={onApprove}
          className="flex-1 px-3 py-2 sm:py-2.5 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-green-900/30"
        >
          <CheckCircle className="w-4 h-4" />
          <span>Approve</span>
        </button>
        <button
          onClick={onRejectInputShow}
          className="flex-1 px-3 py-2 sm:py-2.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-red-900/30"
        >
          <XCircle className="w-4 h-4" />
          <span>Reject</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <textarea
        className="w-full p-3 border border-[#2a2a2a] rounded-lg bg-[#121212] text-white resize-none focus:ring-2 focus:ring-[#ff950e] focus:border-transparent focus:outline-none transition-all text-sm"
        placeholder="Provide a reason for rejection..."
        value={rejectReason}
        onChange={e => onRejectReasonChange(e.target.value)}
        rows={2}
        autoFocus
      />
      <div className="flex gap-2">
        <button
          className="flex-1 bg-red-600 hover:bg-red-500 text-white font-medium px-3 py-2.5 rounded-lg transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          onClick={onReject}
          disabled={!rejectReason.trim()}
        >
          <span>Confirm Rejection</span>
        </button>
        <button
          className="px-3 py-2.5 bg-[#1a1a1a] hover:bg-[#252525] text-white font-medium rounded-lg transition-colors border border-[#333]"
          onClick={onRejectInputCancel}
        >
          <span>Cancel</span>
        </button>
      </div>
    </div>
  );
}
