// src/components/admin/resolved/RestoreModal.tsx
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { RotateCcw, AlertTriangle } from 'lucide-react';
import type { RestoreModalProps } from '@/types/resolved';
import { SecureMessageDisplay } from '@/components/ui/SecureMessageDisplay';

export default function RestoreModal({
  isOpen,
  report,
  onClose,
  onConfirm
}: RestoreModalProps) {
  const [busy, setBusy] = useState(false);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const confirmBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const t = setTimeout(() => confirmBtnRef.current?.focus(), 0);
    return () => {
      clearTimeout(t);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  const handleConfirm = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      await Promise.resolve(onConfirm());
    } finally {
      setBusy(false);
    }
  }, [onConfirm, busy]);

  if (!isOpen || !report) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onMouseDown={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Restore resolved report"
    >
      <div
        ref={dialogRef}
        className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6 max-w-md w-full"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <RotateCcw className="text-yellow-500" size={24} />
          Restore Report
        </h3>

        <div className="mb-6">
          <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-4 mb-4">
            <div className="flex gap-3">
              <AlertTriangle className="text-yellow-500 flex-shrink-0" size={20} />
              <div className="text-sm text-yellow-400">
                This will move the report back to active reports for re-processing.
              </div>
            </div>
          </div>

          <div className="bg-[#222] border border-gray-700 rounded-lg p-3">
            <p className="text-sm text-gray-400">
              <span className="text-white font-medium">
                <SecureMessageDisplay
                  content={report.reporter}
                  className="inline"
                  allowBasicFormatting={false}
                  maxLength={120}
                />
              </span>{' '}
              &rarr;{' '}
              <span className="text-white font-medium ml-1">
                <SecureMessageDisplay
                  content={report.reportee}
                  className="inline"
                  allowBasicFormatting={false}
                  maxLength={120}
                />
              </span>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Resolved on {new Date(report.date).toLocaleDateString?.() || '—'}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-[#222] text-white rounded-lg hover:bg-[#333] transition"
            aria-label="Cancel restore"
          >
            Cancel
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            onClick={handleConfirm}
            disabled={busy}
            className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
            aria-label="Confirm restore report"
          >
            {busy ? 'Restoring…' : 'Restore Report'}
          </button>
        </div>
      </div>
    </div>
  );
}
