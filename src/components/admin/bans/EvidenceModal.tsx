'use client';

import { XCircle, ArrowLeft, ArrowRight } from 'lucide-react';

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
  if (!evidence.length) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div className="relative max-w-4xl w-full max-h-[90vh] bg-[#1a1a1a] rounded-lg overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-gray-800">
          <h3 className="text-lg font-bold text-white">
            Appeal Evidence ({evidenceIndex + 1} of {evidence.length})
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <XCircle size={24} />
          </button>
        </div>

        <div className="p-4 flex flex-col items-center">
          <img 
            src={evidence[evidenceIndex]} 
            alt={`Evidence ${evidenceIndex + 1}`}
            className="max-w-full max-h-[60vh] object-contain rounded"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const errorDiv = document.createElement('div');
              errorDiv.className = 'text-gray-400 text-center p-8';
              errorDiv.textContent = 'Unable to load image';
              target.parentNode?.insertBefore(errorDiv, target);
            }}
          />

          {evidence.length > 1 && (
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setEvidenceIndex(Math.max(0, evidenceIndex - 1))}
                disabled={evidenceIndex === 0}
                className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                <ArrowLeft size={14} className="mr-1" />
                Previous
              </button>
              <span className="px-3 py-1 bg-gray-800 text-gray-300 rounded">
                {evidenceIndex + 1} / {evidence.length}
              </span>
              <button
                onClick={() => setEvidenceIndex(Math.min(evidence.length - 1, evidenceIndex + 1))}
                disabled={evidenceIndex === evidence.length - 1}
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
