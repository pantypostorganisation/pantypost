// src/components/admin/resolved/RestoreModal.tsx
'use client';

import { RotateCcw, AlertTriangle } from 'lucide-react';
import type { RestoreModalProps } from '@/types/resolved';

export default function RestoreModal({
  isOpen,
  report,
  onClose,
  onConfirm
}: RestoreModalProps) {
  if (!isOpen || !report) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6 max-w-md w-full">
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
              <span className="text-white font-medium">{report.reporter}</span> → 
              <span className="text-white font-medium ml-1">{report.reportee}</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Resolved on {new Date(report.date).toLocaleDateString()}
            </p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-[#222] text-white rounded-lg hover:bg-[#333] transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition"
          >
            Restore Report
          </button>
        </div>
      </div>
    </div>
  );
}
