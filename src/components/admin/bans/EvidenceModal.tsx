// src/components/admin/bans/EvidenceModal.tsx
'use client';

import { XCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { useState } from 'react';
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
  onClose
}: EvidenceModalProps) {
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

  if (!evidence.length) return null;

  // Validate and clamp index
  const safeIndex = Math.max(0, Math.min(evidenceIndex, evidence.length - 1));
  
  const handleImageError = (index: number) => {
    setImageErrors(prev => new Set(prev).add(index));
  };

  const navigateTo = (newIndex: number) => {
    const safeNewIndex = Math.max(0, Math.min(newIndex, evidence.length - 1));
    setEvidenceIndex(safeNewIndex);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div className="relative max-w-4xl w-full max-h-[90vh] bg-[#1a1a1a] rounded-lg overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-gray-800">
          <h3 className="text-lg font-bold text-white">
            Appeal Evidence ({safeIndex + 1} of {evidence.length})
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <XCircle size={24} />
          </button>
        </div>

        <div className="p-4 flex flex-col items-center">
          {imageErrors.has(safeIndex) ? (
            <div className="text-gray-400 text-center p-8">
              Unable to load image
            </div>
          ) : (
            <img 
              src={sanitizeUrl(evidence[safeIndex])} 
              alt={`Evidence ${safeIndex + 1}`}
              className="max-w-full max-h-[60vh] object-contain rounded"
              onError={() => handleImageError(safeIndex)}
            />
          )}

          {evidence.length > 1 && (
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => navigateTo(safeIndex - 1)}
                disabled={safeIndex === 0}
                className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                <ArrowLeft size={14} className="mr-1" />
                Previous
              </button>
              <span className="px-3 py-1 bg-gray-800 text-gray-300 rounded">
                {safeIndex + 1} / {evidence.length}
              </span>
              <button
                onClick={() => navigateTo(safeIndex + 1)}
                disabled={safeIndex === evidence.length - 1}
                className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
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
