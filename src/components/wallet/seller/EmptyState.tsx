'use client';

import React from 'react';
import { Wallet, ArrowUpRight } from 'lucide-react';

interface EmptyStateProps {
  showEmptyState: boolean;
}

export default function EmptyState({ showEmptyState }: EmptyStateProps): React.ReactElement | null {
  if (!showEmptyState) return null;

  return (
    <section className="flex h-full flex-col items-center justify-center rounded-2xl border border-gray-800 bg-[#111] p-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#ff950e]/30 bg-[#ff950e]/10">
        <Wallet className="h-8 w-8 text-[#ff950e]" />
      </div>
      <h3 className="mt-6 text-2xl font-semibold text-white">No withdrawals yet</h3>
      <p className="mt-3 max-w-md text-sm text-gray-400">
        As soon as you start transferring earnings, your payout history will populate with real-time updates.
      </p>
      <span className="mt-6 inline-flex items-center gap-2 rounded-full border border-gray-800 bg-[#0c0c0c] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">
        Seller insights
      </span>
      <p className="mt-4 text-xs text-gray-500">
        Ready to cash out? Head to the withdraw panel to initiate your first payout.
      </p>
      <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#ff950e]">
        <ArrowUpRight className="h-4 w-4" />
        Withdraw earnings
      </div>
    </section>
  );
}
