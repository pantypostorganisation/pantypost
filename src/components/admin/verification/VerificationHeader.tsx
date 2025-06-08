// src/components/admin/verification/VerificationHeader.tsx
'use client';

import { Shield, RefreshCw } from 'lucide-react';
import type { VerificationHeaderProps } from '@/types/verification';

export default function VerificationHeader({ onRefresh }: VerificationHeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-black bg-opacity-90 backdrop-blur-sm border-b border-[#2a2a2a] shadow-md">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center">
          <Shield className="w-6 h-6 text-[#ff950e] mr-3" />
          <h1 className="text-xl font-bold text-white">Verification Center</h1>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="px-4 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white hover:bg-[#222] transition flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        )}
      </div>
    </header>
  );
}
