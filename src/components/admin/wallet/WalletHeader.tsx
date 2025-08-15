// src/components/admin/wallet/WalletHeader.tsx
'use client';

import { Crown, Users, Wallet, RefreshCw, Download } from 'lucide-react';

interface WalletHeaderProps {
  totalUsers: number;
  onRefresh: () => void;
  onExport: () => void;
  isRefreshing: boolean;
}

export default function WalletHeader({ totalUsers, onRefresh, onExport, isRefreshing }: WalletHeaderProps) {
  const safeTotalUsers = Number.isFinite(Number(totalUsers)) && Number(totalUsers) >= 0 ? Number(totalUsers) : 0;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
      <div>
        <h1 className="text-3xl font-bold text-[#ff950e] flex items-center gap-3">
          <Wallet className="h-8 w-8" />
          Wallet Management
        </h1>
        <p className="text-gray-400 mt-1">Manage user wallet balances and view transaction history</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="bg-[#1a1a1a] px-4 py-2 rounded-lg border border-gray-800 flex items-center gap-2 hover:bg-[#2a2a2a] transition-colors disabled:opacity-50"
          aria-busy={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 text-[#ff950e] ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="text-sm font-medium text-white">Refresh</span>
        </button>

        <button
          onClick={onExport}
          className="bg-[#1a1a1a] px-4 py-2 rounded-lg border border-gray-800 flex items-center gap-2 hover:bg-[#2a2a2a] transition-colors"
        >
          <Download className="h-4 w-4 text-[#ff950e]" />
          <span className="text-sm font-medium text-white">Export</span>
        </button>

        <div className="bg-[#1a1a1a] px-4 py-2 rounded-lg border border-gray-800 flex items-center gap-2">
          <Crown className="h-5 w-5 text-[#ff950e]" />
          <span className="text-sm font-medium text-white">Admin Panel</span>
        </div>

        <div className="bg-[#1a1a1a] px-4 py-2 rounded-lg border border-gray-800 flex items-center gap-2">
          <Users className="h-5 w-5 text-[#ff950e]" />
          <span className="text-sm font-medium text-white">{safeTotalUsers} Users</span>
        </div>
      </div>
    </div>
  );
}
