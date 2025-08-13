// src/components/admin/bans/AppealReviewModal.tsx
'use client';

import { useCallback } from 'react';
import { MessageSquare, CheckCircle, XCircle, AlertTriangle, Eye } from 'lucide-react';
import { SecureTextarea } from '@/components/ui/SecureInput';
import { SecureMessageDisplay } from '@/components/ui/SecureMessageDisplay';
import { sanitizeStrict } from '@/utils/security/sanitization';
import { BanEntry } from '@/types/ban';

interface AppealReviewModalProps {
  ban: BanEntry | null;
  appealReviewNotes: string;
  setAppealReviewNotes: (notes: string) => void;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: (decision: 'approve' | 'reject' | 'escalate') => void;
  onShowEvidence: (evidence: string[]) => void;
}

const safeDate = (val: unknown): string => {
  const d = new Date(String(val));
  return isNaN(d.getTime()) ? 'Unknown' : d.toLocaleString();
};

const humanize = (s: string) =>
  sanitizeStrict(s)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

export default function AppealReviewModal({
  ban,
  appealReviewNotes,
  setAppealReviewNotes,
  isLoading,
  onClose,
  onConfirm,
  onShowEvidence
}: AppealReviewModalProps) {
  if (!ban) return null;

  const handleDecision = (decision: 'approve' | 'reject' | 'escalate') => {
    if (!appealReviewNotes.trim()) {
      alert('Please provide review notes explaining your decision');
      return;
    }
    onConfirm(decision);
  };

  const handleNotesChange = (value: string) => {
    setAppealReviewNotes(sanitizeStrict(value));
  };

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Escape' && !isLoading) {
        e.stopPropagation();
        onClose();
      }
    },
    [isLoading, onClose]
  );

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.currentTarget === e.target && !isLoading) onClose();
    },
    [isLoading, onClose]
  );

  // Sanitize fields rendered directly
  const safeUsername = sanitizeStrict(ban.username || '');
  const safeBanType = humanize(ban.banType || '');
  const safeBannedBy = sanitizeStrict(ban.bannedBy || '');

  // Build a guaranteed-string reason for display (avoid getBanReasonDisplay returning elements)
  const rawReason =
    ban.reason === 'other'
      ? ban.customReason || 'Unknown Reason'
      : typeof ban.reason === 'string'
      ? ban.reason
      : 'Unknown Reason';
  const safeReasonDisplay = humanize(rawReason);

  // Evidence: pass a definite string[] only
  const evidenceList: string[] = Array.isArray(ban.appealEvidence)
    ? ban.appealEvidence.filter((x): x is string => typeof x === 'string')
    : [];
  const hasEvidence = evidenceList.length > 0;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="appeal-review-title"
      onKeyDown={handleKeyDown}
      onMouseDown={handleOverlayClick}
    >
      <div
        className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h3 id="appeal-review-title" className="text-xl font-bold text-white mb-4 flex items-center">
          <MessageSquare className="mr-2 text-blue-400" />
          Review Appeal - <span className="ml-1">{safeUsername}</span>
        </h3>

        {/* Original Ban Details */}
        <div className="bg-[#222] border border-gray-700 rounded-lg p-4 mb-4">
          <h4 className="text-lg font-semibold text-white mb-2">Original Ban</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Reason:</span>
              <div className="text-gray-300">
                <SecureMessageDisplay content={safeReasonDisplay} allowBasicFormatting={false} />
              </div>
            </div>
            <div>
              <span className="text-gray-400">Type:</span>
              <div className="text-gray-300">
                <SecureMessageDisplay content={safeBanType} allowBasicFormatting={false} />
              </div>
            </div>
            <div>
              <span className="text-gray-400">Banned by:</span>
              <div className="text-gray-300">
                <SecureMessageDisplay content={safeBannedBy} allowBasicFormatting={false} />
              </div>
            </div>
            <div>
              <span className="text-gray-400">Date:</span>
              <div className="text-gray-300">{safeDate(ban.startTime)}</div>
            </div>
          </div>
          {ban.notes && (
            <div className="mt-2">
              <span className="text-gray-400">Original Notes:</span>
              <SecureMessageDisplay content={ban.notes} className="text-gray-300 mt-1" allowBasicFormatting={false} />
            </div>
          )}
        </div>

        {/* Appeal Details */}
        <div className="bg-orange-900/10 border border-orange-800 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-lg font-semibold text-orange-400">User&apos;s Appeal</h4>
            {hasEvidence && (
              <button
                onClick={() => onShowEvidence(evidenceList)}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center gap-1 transition-colors"
              >
                <Eye size={14} />
                View Evidence ({evidenceList.length})
              </button>
            )}
          </div>

          <SecureMessageDisplay
            content={ban.appealText || 'No appeal text provided'}
            className="text-sm text-gray-300 mb-2"
            allowBasicFormatting={false}
            maxLength={500}
          />

          <div className="text-xs text-gray-500">Submitted: {ban.appealDate ? safeDate(ban.appealDate) : 'Unknown'}</div>
        </div>

        {/* Review Notes */}
        <div className="mb-6">
          <SecureTextarea
            label="Review Notes"
            value={appealReviewNotes}
            onChange={handleNotesChange}
            placeholder="Explain your decision and reasoning..."
            maxLength={1000}
            characterCount={true}
            required
            rows={4}
            sanitize={true}
            sanitizer={sanitizeStrict}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>

          <button
            onClick={() => handleDecision('reject')}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center justify-center transition-colors"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <XCircle size={16} className="mr-2" />
                Reject
              </>
            )}
          </button>

          <button
            onClick={() => handleDecision('escalate')}
            className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 flex items-center justify-center transition-colors"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <AlertTriangle size={16} className="mr-2" />
                Escalate
              </>
            )}
          </button>

          <button
            onClick={() => handleDecision('approve')}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center justify-center transition-colors"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle size={16} className="mr-2" />
                Approve
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
