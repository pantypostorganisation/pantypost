'use client';

import { Shield, RefreshCw, AlertTriangle } from 'lucide-react';
import { ReportsHeaderProps } from './types';
import { SecureMessageDisplay } from '@/components/ui/SecureMessageDisplay';

export default function ReportsHeader({ banContextError, lastRefresh, onRefresh }: ReportsHeaderProps) {
  const last = lastRefresh instanceof Date ? lastRefresh : new Date();

  return (
    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
      <div>
        <h1 className="text-3xl font-bold text-[#ff950e] flex items-center">
          <Shield className="mr-3" />
          Reports & Moderation
        </h1>
        <p className="text-gray-400 mt-1">
          Review user reports and make manual ban decisions
        </p>
        {banContextError && (
          <p className="text-red-400 text-sm mt-2 flex items-center">
            <AlertTriangle size={14} className="mr-1" />
            <SecureMessageDisplay
              content={banContextError}
              allowBasicFormatting={false}
              maxLength={200}
            />
          </p>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="text-sm text-gray-400">
          Last refresh: {last.toLocaleTimeString()}
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="px-4 py-2 bg-[#ff950e] text-black rounded-lg hover:bg-[#e88800] flex items-center font-medium transition-colors"
          aria-label="Refresh reports"
        >
          <RefreshCw size={16} className="mr-2" />
          Refresh
        </button>
      </div>
    </div>
  );
}
