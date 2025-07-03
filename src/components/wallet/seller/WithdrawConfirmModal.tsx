// src/components/wallet/seller/WithdrawConfirmModal.tsx
'use client';

import { AlertCircle } from 'lucide-react';

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
  handleConfirmWithdraw
}: WithdrawConfirmModalProps) {
  if (!showConfirmation) return null;

  const amount = parseFloat(withdrawAmount);
  const formattedAmount = isNaN(amount) ? '0.00' : amount.toFixed(2);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] rounded-xl p-6 max-w-md w-full border border-[#333] shadow-2xl">
        <div className="flex items-center mb-4">
          <div className="p-2 bg-yellow-500/20 rounded-lg mr-3">
            <AlertCircle className="w-6 h-6 text-yellow-500" />
          </div>
          <h3 className="text-xl font-bold text-white">Confirm Withdrawal</h3>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-300 mb-4">
            Are you sure you want to withdraw <span className="font-bold text-[#ff950e]">${formattedAmount}</span> from your seller balance?
          </p>
          <div className="bg-[#222] rounded-lg p-3 text-sm text-gray-400">
            <p>• Funds will be sent to your registered account</p>
            <p>• Processing typically takes 1-2 business days</p>
            <p>• You'll receive a confirmation email</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => setShowConfirmation(false)}
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-[#444] rounded-lg font-medium text-gray-300 hover:bg-[#222] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmWithdraw}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-[#ff950e] text-black rounded-lg font-medium hover:bg-[#e88800] transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
                Processing...
              </>
            ) : (
              'Confirm Withdrawal'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}