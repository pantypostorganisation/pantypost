// src/components/wallet/seller/EmptyState.tsx
'use client';

import { Wallet } from 'lucide-react';

interface EmptyStateProps {
  showEmptyState: boolean;
}

export default function EmptyState({ showEmptyState }: EmptyStateProps) {
  if (!showEmptyState) return null;

  return (
    <div className="bg-[#1a1a1a] rounded-xl p-12 border border-[#333] shadow-lg text-center">
      <div className="flex justify-center mb-4">
        <div className="p-4 bg-[#222] rounded-full">
          <Wallet className="w-12 h-12 text-[#ff950e]" />
        </div>
      </div>
      <h3 className="text-xl font-semibold mb-2 text-white">No Withdrawals Yet</h3>
      <p className="text-gray-400 max-w-md mx-auto">
        Once you withdraw funds from your seller balance, your withdrawal history will appear here.
      </p>
    </div>
  );
}