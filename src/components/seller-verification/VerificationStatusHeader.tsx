// src/components/seller-verification/VerificationStatusHeader.tsx
'use client';

import { Shield } from 'lucide-react';
import { sanitizeStrict } from '@/utils/security/sanitization';

interface VerificationStatusHeaderProps {
  status: 'verified' | 'pending' | 'rejected' | 'unverified';
  title: string;
}

export default function VerificationStatusHeader({ status, title }: VerificationStatusHeaderProps) {
  const getBackgroundGradient = () => {
    switch (status) {
      case 'verified':
        return 'from-green-900 to-green-800';
      case 'pending':
        return 'from-yellow-900 to-yellow-800';
      case 'rejected':
        return 'from-red-900 to-red-800';
      default:
        return 'from-[#ff950e] to-yellow-600';
    }
  };

  const iconColor =
    status === 'verified' ? 'text-green-400' : status === 'pending' ? 'text-yellow-400' : status === 'rejected' ? 'text-red-400' : 'text-black';

  const safeTitle = sanitizeStrict(title);

  return (
    <div className={`bg-gradient-to-r ${getBackgroundGradient()} px-6 py-5 flex items-center`}>
      <Shield className={`w-8 h-8 ${iconColor} mr-3`} aria-hidden="true" />
      <h1 className={`text-2xl font-bold ${status === 'unverified' ? 'text-black' : 'text-white'}`}>{safeTitle}</h1>
    </div>
  );
}
