'use client';

import React from 'react';
import { AlertCircle, ShieldCheck, Clock } from 'lucide-react';

interface WithdrawConfirmModalProps {
  showConfirmation: boolean;
  setShowConfirmation: (show: boolean) => void;
  withdrawAmount: string;
  isLoading: boolean;
  handleConfirmWithdraw: () => void;
}

export default function WithdrawConfirmModal({
  showConfirmation,
  setShowConfirmation,
  withdrawAmount,
  isLoading,
  handleConfirmWithdraw,
}: WithdrawConfirmModalProps): React.ReactElement | null {
  if (!showConfirmation) return null;

  const amount = parseFloat(withdrawAmount);
  const formattedAmount = isNaN(amount) ? '0.00' : amount.toFixed(2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-3xl border border-gray-800 bg-[#111] p-6 shadow-2xl sm:p-8">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-400/30 bg-amber-400/10">
            <AlertCircle className="h-7 w-7 text-amber-300" />
          </div>
          <div>
            <h3 className="text-2xl font-semibold text-white">Confirm withdrawal</h3>
            <p className="mt-1 text-sm text-gray-400">Review the details below before submitting your payout.</p>
          </div>
        </div>

        <div className="mt-6 space-y-4 rounded-2xl border border-gray-800 bg-[#0c0c0c] p-5 text-sm text-gray-300">
          <p>
            You're about to withdraw{' '}
            <span className="font-semibold text-[#ff950e]">${formattedAmount}</span> from your seller balance.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-2xl border border-gray-800 bg-[#111] p-3 text-xs text-gray-400">
              <ShieldCheck className="h-4 w-4 text-[#ff950e]" />
              <span>Funds deposit to your verified payout method.</span>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-gray-800 bg-[#111] p-3 text-xs text-gray-400">
              <Clock className="h-4 w-4 text-[#ff950e]" />
              <span>Processing takes about 1-2 business days.</span>
            </div>
          </div>
          <p className="text-xs text-gray-500">A confirmation email will be sent once the transfer is initiated.</p>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => setShowConfirmation(false)}
            disabled={isLoading}
            className="flex-1 rounded-2xl border border-gray-800 px-4 py-3 text-sm font-semibold text-gray-300 transition-colors hover:bg-[#1b1b1b] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmWithdraw}
            disabled={isLoading}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl border border-transparent bg-[#ff950e] px-4 py-3 text-sm font-semibold text-black transition-colors hover:bg-[#e88800] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent" />
                Processing
              </>
            ) : (
              'Confirm withdrawal'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
