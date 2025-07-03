// src/components/wallet/seller/WithdrawSection.tsx
'use client';

import { ArrowDownCircle, AlertCircle, CheckCircle } from 'lucide-react';

interface WithdrawSectionProps {
  balance: number;
  withdrawAmount: string;
  message: string;
  messageType: 'success' | 'error' | '';
  isLoading: boolean;
  onAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onWithdraw: () => void;
  onQuickAmountSelect: (amount: string) => void;
}

export default function WithdrawSection({
  balance,
  withdrawAmount,
  message,
  messageType,
  isLoading,
  onAmountChange,
  onKeyPress,
  onWithdraw,
  onQuickAmountSelect
}: WithdrawSectionProps) {
  const quickAmounts = [25, 50, 100, 250];
  
  return (
    <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#333] shadow-lg mb-8">
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <ArrowDownCircle className="w-5 h-5 mr-2 text-[#ff950e]" />
        Withdraw Funds
      </h2>
      
      <div className="mb-6">
        <div className="mb-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
          <div className="flex items-start">
            <CheckCircle className="w-5 h-5 text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-200">
              <p className="font-medium mb-1">Fast Withdrawals</p>
              <p>Your earnings are available for withdrawal after the 10% platform fee. Funds typically arrive within 1-2 business days.</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-400 mb-1">
              Amount to withdraw
            </label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500">$</span>
                </div>
                <input
                  type="text"
                  id="amount"
                  value={withdrawAmount}
                  onChange={onAmountChange}
                  onKeyPress={onKeyPress}
                  placeholder="0.00"
                  className="w-full bg-[#222] border border-[#444] rounded-lg py-3 pl-8 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e] focus:border-transparent"
                  disabled={balance <= 0 || isLoading}
                />
              </div>
              <button
                onClick={onWithdraw}
                className={`px-6 py-3 rounded-lg font-medium flex items-center justify-center whitespace-nowrap transition-colors ${
                  balance <= 0 || isLoading
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-[#ff950e] hover:bg-[#e88800] text-black'
                }`}
                disabled={balance <= 0 || isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <ArrowDownCircle className="w-5 h-5 mr-2" />
                    Withdraw
                  </>
                )}
              </button>
            </div>
            <div className="mt-2 flex gap-2">
              {quickAmounts.map((amount) => (
                <button
                  key={amount}
                  onClick={() => onQuickAmountSelect(amount.toString())}
                  disabled={amount > balance || isLoading}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    amount > balance
                      ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                      : 'bg-[#222] text-gray-300 hover:bg-[#333] hover:text-white border border-[#444]'
                  }`}
                >
                  ${amount}
                </button>
              ))}
              <button
                onClick={() => onQuickAmountSelect(balance.toFixed(2))}
                disabled={balance <= 0 || isLoading}
                className="px-3 py-1 text-sm rounded-md bg-[#222] text-[#ff950e] hover:bg-[#333] border border-[#ff950e] transition-colors"
              >
                Max
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Status message */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center ${
          messageType === 'success' 
            ? 'bg-green-900/20 border border-green-500/30 text-green-400' 
            : 'bg-red-900/20 border border-red-500/30 text-red-400'
        }`}>
          {messageType === 'success' ? (
            <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
          )}
          {message}
        </div>
      )}
    </div>
  );
}