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
    <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-[#111111]/90 via-[#0b0b0b]/70 to-[#050505]/70 p-6 shadow-[0_20px_45px_rgba(0,0,0,0.5)]">
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-3 rounded-full border border-[#ff950e]/40 bg-[#ff950e]/10 px-4 py-2 text-sm font-medium text-[#ffb347]">
            <Wallet className="h-5 w-5" />
            Wallet Command Center
          </div>
          <h1 className="text-3xl font-semibold text-white md:text-4xl">Keep the platform cashflow razor sharp</h1>
          <p className="max-w-xl text-sm text-gray-300">
            Oversee every buyer and seller balance, monitor liquidity at a glance, and deploy credits or debits with precision.
          </p>
        </div>

        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="group flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-medium text-white shadow-inner transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
            aria-busy={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 text-[#ff950e] transition-transform duration-300 group-hover:rotate-180 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>

          <button
            onClick={onExport}
            className="flex items-center justify-center gap-2 rounded-xl border border-[#ff950e]/40 bg-gradient-to-r from-[#ff950e]/20 via-[#ffb347]/10 to-transparent px-5 py-3 text-sm font-medium text-[#ffb347] transition hover:from-[#ff950e]/30 hover:via-[#ffb347]/20 hover:text-[#ffd79a]"
          >
            <Download className="h-4 w-4" />
            Export Snapshot
          </button>

          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-gray-200">
            <Crown className="h-5 w-5 text-[#ff950e]" />
            Elite Admin Access
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-gray-200">
            <Users className="h-5 w-5 text-[#ff950e]" />
            {safeTotalUsers} wallets live
          </div>
        </div>
      </div>
    </div>
  );
}
