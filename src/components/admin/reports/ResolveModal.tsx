// src/components/admin/reports/ResolveModal.tsx
'use client';

import { useEffect, useCallback, useMemo, useRef, useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { ResolveModalProps } from './types';
import { SecureMessageDisplay } from '@/components/ui/SecureMessageDisplay';
import { sanitizeStrict } from '@/utils/security/sanitization';

const SEVERITIES = ['low', 'medium', 'high', 'critical'] as const;
type Severity = typeof SEVERITIES[number];

const CATEGORIES = ['harassment', 'spam', 'inappropriate_content', 'scam', 'other'] as const;
type Category = typeof CATEGORIES[number];

export default function ResolveModal({
  isOpen,
  report,
  onClose,
  onConfirm
}: ResolveModalProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const confirmBtnRef = useRef<HTMLButtonElement | null>(null);
  const [busy, setBusy] = useState(false);

  // Normalize/validate category & severity
  const safeCategory = useMemo<Category>(() => {
    const v = String(report?.category ?? '').toLowerCase();
    return (CATEGORIES as readonly string[]).includes(v) ? (v as Category) : 'other';
  }, [report?.category]);

  const safeSeverity = useMemo<Severity>(() => {
    const v = String(report?.severity ?? '').toLowerCase();
    return (SEVERITIES as readonly string[]).includes(v) ? (v as Severity) : 'medium';
  }, [report?.severity]);

  const prettyCategory = useMemo(() => {
    return safeCategory === 'inappropriate_content'
      ? 'Inappropriate Content'
      : safeCategory.charAt(0).toUpperCase() + safeCategory.slice(1);
  }, [safeCategory]);

  const prettySeverity = useMemo(() => {
    return safeSeverity.charAt(0).toUpperCase() + safeSeverity.slice(1);
  }, [safeSeverity]);

  // Close on ESC
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

  // Lock scroll + focus the confirm button on open
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const t = setTimeout(() => {
      confirmBtnRef.current?.focus();
    }, 0);
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
      // Works for both sync (void) and async (Promise<void>) handlers
      await Promise.resolve(onConfirm());
    } finally {
      setBusy(false);
    }
  }, [onConfirm, busy]);

  if (!isOpen || !report) return null;

  const titleId = 'resolve-modal-title';

  return (
    <div
      className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onMouseDown={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div
        ref={dialogRef}
        className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6 max-w-md w-full shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h3 id={titleId} className="text-xl font-bold text-white mb-4 flex items-center">
          <CheckCircle className="mr-2 text-green-400" />
          Resolve Report
        </h3>

        <p className="text-gray-300 mb-4">
          Are you sure you want to mark this report as resolved without applying a ban?
        </p>

        <div className="bg-[#222] rounded-lg p-3 mb-4">
          <p className="text-sm text-gray-400">Report Details:</p>

          <p className="text-white text-sm mt-1">
            <span className="text-gray-400">Reporter:</span>{' '}
            <SecureMessageDisplay
              content={report.reporter}
              allowBasicFormatting={false}
              className="inline"
              maxLength={120}
            />
          </p>

          <p className="text-white text-sm">
            <span className="text-gray-400">Reportee:</span>{' '}
            <SecureMessageDisplay
              content={report.reportee}
              allowBasicFormatting={false}
              className="inline"
              maxLength={120}
            />
          </p>

          <p className="text-white text-sm">
            <span className="text-gray-400">Category:</span>{' '}
            {sanitizeStrict(prettyCategory)}
          </p>

          <p className="text-white text-sm">
            <span className="text-gray-400">Severity:</span>{' '}
            {sanitizeStrict(prettySeverity)}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            aria-label="Cancel resolving report"
          >
            Cancel
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            onClick={handleConfirm}
            disabled={busy}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
            aria-label="Confirm resolve without ban"
          >
            <CheckCircle size={16} className="mr-2" />
            {busy ? 'Resolving…' : 'Resolve Without Ban'}
          </button>
        </div>
      </div>
    </div>
  );
}
