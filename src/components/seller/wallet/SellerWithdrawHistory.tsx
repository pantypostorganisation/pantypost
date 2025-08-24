'use client';

import { Clock } from 'lucide-react';

interface Withdrawal {
  amount: number;
  date: string;
}

interface SellerWithdrawHistoryProps {
  sortedWithdrawals: Withdrawal[];
}

export default function SellerWithdrawHistory({ sortedWithdrawals }: SellerWithdrawHistoryProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (sortedWithdrawals.length === 0) {
    return null;
  }

  return (
    <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#333] shadow-lg">
      <h2 className="text-xl font-bold mb-6 flex items-center">
        <Clock className="w-5 h-5 mr-2 text-[#ff950e]" />
        Withdrawal History
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-gray-400 text-sm border-b border-[#333]">
              <th className="pb-3">Amount</th>
              <th className="pb-3">Date &amp; Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#333]">
            {sortedWithdrawals.map((withdrawal, index) => (
              <tr key={index} className="text-gray-300">
                <td className="py-4 font-medium">${withdrawal.amount.toFixed(2)}</td>
                <td className="py-4 text-gray-400">{formatDate(withdrawal.date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
