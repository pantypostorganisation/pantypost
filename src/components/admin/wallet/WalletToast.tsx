// src/components/admin/wallet/WalletToast.tsx
'use client';

import { CheckCircle, XCircle } from 'lucide-react';

interface WalletToastProps {
  message: string;
  type: 'success' | 'error';
  isVisible: boolean;
}

export default function WalletToast({ message, type, isVisible }: WalletToastProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg transition-all duration-300 ${
        type === 'success' 
          ? 'bg-green-600 text-white' 
          : 'bg-red-600 text-white'
      }`}>
        {type === 'success' ? (
          <CheckCircle className="h-5 w-5" />
        ) : (
          <XCircle className="h-5 w-5" />
        )}
        <p className="text-sm font-medium">{message}</p>
      </div>
    </div>
  );
}
