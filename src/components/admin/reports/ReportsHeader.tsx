// src/components/admin/reports/ReportsHeader.tsx
'use client';

import { Shield, RefreshCw, AlertTriangle } from 'lucide-react';
import { ReportsHeaderProps } from './types';
import { SecureMessageDisplay } from '@/components/ui/SecureMessageDisplay';

export default function ReportsHeader({ banContextError, lastRefresh, onRefresh }: ReportsHeaderProps) {
  const last = lastRefresh instanceof Date ? lastRefresh : new Date();

  return (
    <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
      <div className="space-y-2">
        <h1 className="flex items-center gap-3 text-3xl font-semibold text-white">
          <span className="rounded-full border border-[#ff950e]/30 bg-[#ff950e]/10 p-1.5 text-[#ff950e]">
            <Shield size={24} />
          </span>
          Reports & Moderation
        </h1>
        <p className="max-w-2xl text-sm text-zinc-400">
          Review user reports and make manual ban decisions
        </p>
        {banContextError && (
          <p className="flex items-start gap-2 text-sm text-red-400">
            <AlertTriangle size={16} className="mt-0.5" />
            <SecureMessageDisplay
              content={banContextError}
              allowBasicFormatting={false}
              maxLength={200}
            />
          </p>
        )}
      </div>

      <div className="flex w-full flex-col items-start gap-3 text-sm text-zinc-400 sm:flex-row sm:items-center sm:justify-end">
        <span>Last refresh: {last.toLocaleTimeString()}</span>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-2 rounded-lg border border-[#ff950e]/60 bg-[#ff950e] px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-[#e88800]"
          aria-label="Refresh reports"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>
    </div>
  );
}
