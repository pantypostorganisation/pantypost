'use client';

import React from 'react';
import { Clock, CheckCircle, ExternalLink } from 'lucide-react';

interface RecentWithdrawalsProps {
  withdrawals: Array<{
    amount: number;
    date: string;
    status?: string; // e.g., 'Completed', 'Pending'
    method?: string; // e.g., 'Bank', 'PayPal'
  }>;
}

export default function RecentWithdrawals({ withdrawals }: RecentWithdrawalsProps): React.ReactElement {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#333] shadow-lg">
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <Clock className="w-5 h-5 mr-2 text-[#ff950e]" />
        Recent Withdrawals
      </h2>

      <div className="space-y-3">
        {withdrawals.map((withdrawal, index) => {
          const status = withdrawal.status ?? 'Completed';
          return (
            <div
              key={index}
              className="bg-[#222] rounded-lg p-4 flex items-center justify-between hover:bg-[#252525] transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="font-medium text-white">${withdrawal.amount.toFixed(2)}</p>
                  <p className="text-sm text-gray-400">{formatDate(withdrawal.date)}</p>
                </div>
              </div>
              <div className="flex items-center text-sm text-green-400">
                <span className="hidden sm:inline mr-2">{status}</span>
                <ExternalLink className="w-4 h-4" />
              </div>
            </div>
          );
        })}
      </div>

      {withdrawals.length === 0 && (
        <p className="text-center text-gray-500 py-8">No withdrawals yet</p>
      )}
    </div>
  );
}
