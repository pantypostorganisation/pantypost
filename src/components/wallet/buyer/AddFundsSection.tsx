// src/components/wallet/buyer/AddFundsSection.tsx
'use client';

import { PlusCircle, CreditCard, CheckCircle, AlertCircle } from 'lucide-react';

interface AddFundsSectionProps {
  amountToAdd: string;
  message: string;
  messageType: 'success' | 'error' | '';
  isLoading: boolean;
  onAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onAddFunds: () => void;
  onQuickAmountSelect: (amount: string) => void;
}

export default function AddFundsSection({
  amountToAdd,
  message,
  messageType,
  isLoading,
  onAmountChange,
  onKeyPress,
  onAddFunds,
  onQuickAmountSelect
}: AddFundsSectionProps) {
  return (
    <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#333] shadow-lg mb-8">
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <PlusCircle className="w-5 h-5 mr-2 text-[#ff950e]" />
        Add Funds
      </h2>
      
      <div className="mb-6">
        <div className="mb-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
          <div className="flex items-start">
            <CheckCircle className="w-5 h-5 text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-200">
              <p className="font-medium mb-1">Instant Deposits</p>
              <p>Funds are added immediately to your account and available for purchases right away.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="amount" className="block text-sm font-medium text-gray-400 mb-1">
              Amount to add
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500">$</span>
              </div>
              <input
                type="text"
                id="amount"
                value={amountToAdd}
                onChange={onAmountChange}
                onKeyPress={onKeyPress}
                placeholder="0.00"
                className="w-full bg-[#222] border border-[#444] rounded-lg py-3 pl-8 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e] focus:border-transparent"
                disabled={isLoading}
              />
            </div>
            <div className="flex gap-2 mt-2">
              {[25, 50, 100, 200].map((quickAmount) => (
                <button
                  key={quickAmount}
                  onClick={() => onQuickAmountSelect(quickAmount.toString())}
                  className="text-xs px-2 py-1 bg-[#333] hover:bg-[#444] text-gray-300 rounded transition-colors"
                  disabled={isLoading}
                >
                  ${quickAmount}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-end">
            <button
              onClick={onAddFunds}
              className="px-6 py-3 rounded-lg font-medium flex items-center justify-center min-w-[180px] bg-[#ff950e] hover:bg-[#e88800] text-black disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              disabled={isLoading || !amountToAdd || parseFloat(amountToAdd) <= 0}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5 mr-2" />
                  Add Funds
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${
          messageType === 'success' ? 'bg-green-900 bg-opacity-20 text-green-400 border border-green-500/30' : 
          messageType === 'error' ? 'bg-red-900 bg-opacity-20 text-red-400 border border-red-500/30' : ''
        }`}>
          <div className="flex items-center">
            {messageType === 'success' && <CheckCircle className="w-5 h-5 mr-2" />}
            {messageType === 'error' && <AlertCircle className="w-5 h-5 mr-2" />}
            {message}
          </div>
        </div>
      )}
    </div>
  );
}
