// src/components/admin/verification/ActionButtons.tsx
'use client';

import { useState, useCallback } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { SecureTextarea } from '@/components/ui/SecureInput';
import { sanitizeStrict } from '@/utils/security/sanitization';
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
  const [busy, setBusy] = useState<'none' | 'approve' | 'reject'>('none');

  const handleRejectReasonChange = useCallback((value: string) => {
    onRejectReasonChange(sanitizeStrict(value));
  }, [onRejectReasonChange]);

  const handleApprove = useCallback(async () => {
    if (busy !== 'none') return;
    setBusy('approve');
    try {
      await Promise.resolve(onApprove());
    } finally {
      setBusy('none');
    }
  }, [onApprove, busy]);

  const handleReject = useCallback(async () => {
    if (busy !== 'none') return;
    setBusy('reject');
    try {
      await Promise.resolve(onReject());
    } finally {
      setBusy('none');
    }
  }, [onReject, busy]);

  if (!showRejectInput) {
    return (
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleApprove}
          disabled={busy !== 'none'}
          className="flex-1 px-3 py-2 sm:py-2.5 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-green-900/30 disabled:opacity-60 disabled:cursor-not-allowed"
          aria-label="Approve verification"
        >
          <CheckCircle className="w-4 h-4" />
          <span>{busy === 'approve' ? 'Approving…' : 'Approve'}</span>
        </button>
        <button
          type="button"
          onClick={onRejectInputShow}
          className="flex-1 px-3 py-2 sm:py-2.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-red-900/30"
          aria-label="Reject verification and add reason"
        >
          <XCircle className="w-4 h-4" />
          <span>Reject</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <SecureTextarea
        placeholder="Provide a reason for rejection..."
        value={rejectReason}
        onChange={handleRejectReasonChange}
        rows={2}
        maxLength={500}
        characterCount={true}
        sanitize={true}
        sanitizer={sanitizeStrict}
        className="w-full p-3 border border-[#2a2a2a] rounded-lg bg-[#121212] text-white resize-none focus:ring-2 focus:ring-[#ff950e] focus:border-transparent focus:outline-none transition-all text-sm"
        aria-label="Rejection reason"
      />
      <div className="flex gap-2">
        <button
          type="button"
          className="flex-1 bg-red-600 hover:bg-red-500 text-white font-medium px-3 py-2.5 rounded-lg transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          onClick={handleReject}
          disabled={!rejectReason.trim() || busy !== 'none'}
          aria-label="Confirm rejection"
        >
          <span>{busy === 'reject' ? 'Rejecting…' : 'Confirm Rejection'}</span>
        </button>
        <button
          type="button"
          className="px-3 py-2.5 bg-[#1a1a1a] hover:bg-[#252525] text-white font-medium rounded-lg transition-colors border border-[#333]"
          onClick={onRejectInputCancel}
          aria-label="Cancel rejection"
        >
          <span>Cancel</span>
        </button>
      </div>
    </div>
  );
}
