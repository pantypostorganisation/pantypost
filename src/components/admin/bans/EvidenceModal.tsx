'use client';

import { XCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { sanitizeUrl } from '@/utils/security/sanitization';

interface EvidenceModalProps {
  evidence: string[];
  evidenceIndex: number;
  setEvidenceIndex: (index: number) => void;
  onClose: () => void;
}

export default function EvidenceModal({
  evidence,
  evidenceIndex,
  setEvidenceIndex,
  onClose,
}: EvidenceModalProps) {
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

  if (!Array.isArray(evidence) || evidence.length === 0) return null;

  const clampIndex = (idx: number) => Math.max(0, Math.min(idx, evidence.length - 1));
  const safeIndex = clampIndex(evidenceIndex);

  const handleImageError = (index: number) => {
    setImageErrors((prev) => new Set(prev).add(index));
  };

  const navigateTo = (newIndex: number) => {
    setEvidenceIndex(clampIndex(newIndex));
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        navigateTo(safeIndex - 1);
      } else if (e.key === 'ArrowRight') {
        navigateTo(safeIndex + 1);
      }
    },
    [onClose, safeIndex]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const src = sanitizeUrl(evidence[safeIndex]);
  const showImage = !!src && !imageErrors.has(safeIndex);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Appeal Evidence"
    >
      <div className="relative max-w-4xl w-full max-h-[90vh] bg-[#1a1a1a] rounded-lg overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-gray-800">
          <h3 className="text-lg font-bold text-white">
            Appeal Evidence ({safeIndex + 1} of {evidence.length})
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors" aria-label="Close evidence viewer">
            <XCircle size={24} />
          </button>
        </div>

        <div className="p-4 flex flex-col items-center">
          {showImage ? (
            <img
              src={src}
              alt={`Evidence ${safeIndex + 1}`}
              className="max-w-full max-h-[60vh] object-contain rounded"
              onError={() => handleImageError(safeIndex)}
            />
          ) : (
            <div className="text-gray-400 text-center p-8" role="status" aria-live="polite">
              Unable to load image
            </div>
          )}

          {evidence.length > 1 && (
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => navigateTo(safeIndex - 1)}
                disabled={safeIndex === 0}
                className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                aria-label="Previous evidence"
              >
                <ArrowLeft size={14} className="mr-1" />
                Previous
              </button>
              <span className="px-3 py-1 bg-gray-800 text-gray-300 rounded" aria-live="polite">
                {safeIndex + 1} / {evidence.length}
              </span>
              <button
                onClick={() => navigateTo(safeIndex + 1)}
                disabled={safeIndex === evidence.length - 1}
                className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                aria-label="Next evidence"
              >
                Next
                <ArrowRight size={14} className="ml-1" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
