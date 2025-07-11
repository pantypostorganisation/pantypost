// src/components/admin/wallet/ConfirmationModal.tsx
'use client';

import { AlertTriangle, XCircle, Info, Loader2 } from 'lucide-react';
import { SecureMessageDisplay } from '@/components/ui/SecureMessageDisplay';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  type?: 'warning' | 'danger' | 'info';
  isLoading?: boolean;
}

export default function ConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  type = 'warning',
  isLoading = false 
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger': return <XCircle className="h-6 w-6 text-red-500" />;
      case 'info': return <Info className="h-6 w-6 text-blue-500" />;
      default: return <AlertTriangle className="h-6 w-6 text-orange-500" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6 max-w-md w-full shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          {getIcon()}
          <h3 className="text-lg font-semibold text-white">
            <SecureMessageDisplay 
              content={title} 
              allowBasicFormatting={false}
              className="inline"
            />
          </h3>
        </div>
        <div className="text-gray-300 mb-6">
          <SecureMessageDisplay 
            content={message} 
            allowBasicFormatting={false}
          />
        </div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
