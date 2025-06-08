// src/components/admin/resolved/ResolvedHeader.tsx
'use client';

import { Archive, RefreshCw, Download, Upload, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { ResolvedHeaderProps } from '@/types/resolved';

export default function ResolvedHeader({
  lastRefresh,
  onRefresh,
  onExport,
  onImport
}: ResolvedHeaderProps) {
  const router = useRouter();

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/admin/reports')}
            className="p-2 hover:bg-[#1a1a1a] rounded-lg transition"
          >
            <ArrowLeft size={20} className="text-gray-400" />
          </button>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Archive className="text-[#ff950e]" />
            Resolved Reports
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            className="px-4 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white hover:bg-[#222] transition flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <button
            onClick={onExport}
            className="px-4 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white hover:bg-[#222] transition flex items-center gap-2"
          >
            <Download size={16} />
            Export
          </button>
          <label className="px-4 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white hover:bg-[#222] transition flex items-center gap-2 cursor-pointer">
            <Upload size={16} />
            Import
            <input
              type="file"
              accept=".json"
              onChange={onImport}
              className="hidden"
            />
          </label>
        </div>
      </div>

      <div className="text-sm text-gray-400 mb-6">
        Last refreshed: {lastRefresh.toLocaleString()}
      </div>
    </>
  );
}
