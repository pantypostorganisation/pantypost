// src/components/admin/reports/ResolveModal.tsx
'use client';

import { CheckCircle } from 'lucide-react';
import { ResolveModalProps } from './types';
import { SecureMessageDisplay } from '@/components/ui/SecureMessageDisplay';

export default function ResolveModal({
  isOpen,
  report,
  onClose,
  onConfirm
}: ResolveModalProps) {
  
  if (!isOpen || !report) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6 max-w-md w-full">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center">
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
            />
          </p>
          <p className="text-white text-sm">
            <span className="text-gray-400">Reportee:</span>{' '}
            <SecureMessageDisplay 
              content={report.reportee}
              allowBasicFormatting={false}
              className="inline"
            />
          </p>
          <p className="text-white text-sm">
            <span className="text-gray-400">Category:</span> {report.category || 'uncategorized'}
          </p>
          <p className="text-white text-sm">
            <span className="text-gray-400">Severity:</span> {report.severity || 'medium'}
          </p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center justify-center transition-colors"
          >
            <CheckCircle size={16} className="mr-2" />
            Resolve Without Ban
          </button>
        </div>
      </div>
    </div>
  );
}
