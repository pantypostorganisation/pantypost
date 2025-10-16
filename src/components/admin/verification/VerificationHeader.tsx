// src/components/admin/verification/VerificationHeader.tsx
'use client';

import { Shield, RefreshCw } from 'lucide-react';
import type { VerificationHeaderProps } from '@/types/verification';

export default function VerificationHeader({ onRefresh }: VerificationHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/5 bg-[#050505]/95 backdrop-blur">
      <div className="max-w-7xl mx-auto flex flex-col gap-4 px-4 md:px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#ff950e]/40 bg-[#ff950e]/15">
            <Shield className="h-5 w-5 text-[#ff950e]" />
          </div>
          <div>
            <p className="text-[0.65rem] uppercase tracking-[0.35em] text-white/40">Admin</p>
            <h1 className="text-2xl font-semibold text-white">Verification Center</h1>
          </div>
        </div>
        {typeof onRefresh === 'function' && (
          <button
            type="button"
            onClick={() => { onRefresh(); }}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-colors hover:border-[#ff950e]/60 hover:text-[#ff950e]"
            aria-label="Refresh verification list"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        )}
      </div>
    </header>
  );
}
