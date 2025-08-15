// src/components/admin/wallet/WalletToast.tsx
'use client';

import { CheckCircle, XCircle } from 'lucide-react';
import { SecureMessageDisplay } from '@/components/ui/SecureMessageDisplay';

interface WalletToastProps {
  message: string;
  type: 'success' | 'error';
  isVisible: boolean;
}

export default function WalletToast({ message, type, isVisible }: WalletToastProps) {
  if (!isVisible) return null;

  const isError = type === 'error';

  return (
    <div
      className="fixed bottom-4 right-4 z-40"
      aria-live={isError ? 'assertive' : 'polite'}
      aria-atomic="true"
    >
      <div
        role={isError ? 'alert' : 'status'}
        className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg transition-all duration-300 ${
          isError ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
        }`}
      >
        {isError ? <XCircle className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
        <div className="text-sm font-medium">
          <SecureMessageDisplay
            content={message || ''}
            allowBasicFormatting={false}
            className="inline"
            maxLength={300}
          />
        </div>
      </div>
    </div>
  );
}
