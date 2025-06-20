// src/components/seller-verification/VerificationStatusHeader.tsx
'use client';

import { Shield } from 'lucide-react';

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

  const getTextColor = () => {
    return status === 'unverified' ? 'text-black' : 'text-white';
  };

  return (
    <div className={`bg-gradient-to-r ${getBackgroundGradient()} px-6 py-5 flex items-center`}>
      <Shield className={`w-8 h-8 ${status === 'verified' ? 'text-green-400' : status === 'pending' ? 'text-yellow-400' : status === 'rejected' ? 'text-red-400' : 'text-black'} mr-3`} />
      <h1 className={`text-2xl font-bold ${getTextColor()}`}>{title}</h1>
    </div>
  );
}
