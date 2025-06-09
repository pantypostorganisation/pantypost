// src/components/seller-profile/modals/TipModal.tsx
'use client';

import { Gift, DollarSign, X } from 'lucide-react';

interface TipModalProps {
  show: boolean;
  username: string;
  tipAmount: string;
  tipSuccess: boolean;
  tipError: string;
  onAmountChange: (amount: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export default function TipModal({
  show,
  username,
  tipAmount,
  tipSuccess,
  tipError,
  onAmountChange,
  onClose,
  onSubmit,
}: TipModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4">
      <div className="bg-[#1a1a1a] p-6 sm:p-8 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[#ff950e] flex items-center gap-2">
            <Gift className="w-6 h-6" />
            Send Tip
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {tipSuccess ? (
          <div className="text-center py-8">
            <div className="text-green-500 text-5xl mb-4">✓</div>
            <p className="text-xl text-white">Tip sent successfully!</p>
            <p className="text-gray-400 mt-2">Thank you for supporting {username}</p>
          </div>
        ) : (
          <>
            <p className="mb-6 text-center text-white">
              Show your appreciation for <strong className="text-[#ff950e]">{username}</strong>
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2 text-gray-300">
                Amount ($)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <DollarSign className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  value={tipAmount}
                  onChange={(e) => onAmountChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-black text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
                  placeholder="Enter amount"
                  min="0.01"
                  step="0.01"
                />
              </div>
              {tipError && (
                <p className="mt-2 text-sm text-red-500">{tipError}</p>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={onSubmit}
                disabled={!tipAmount || parseFloat(tipAmount) <= 0}
                className="w-full bg-[#ff950e] text-black font-bold py-3 rounded-full hover:bg-[#e0850d] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send Tip
              </button>
              <button
                onClick={onClose}
                className="w-full bg-gray-700 text-white font-medium py-3 rounded-full hover:bg-gray-600 transition"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}