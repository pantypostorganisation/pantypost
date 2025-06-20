// src/components/wallet/buyer/AddFundsSection.tsx
'use client';

import { PlusCircle, CreditCard, CheckCircle, AlertCircle } from 'lucide-react';
import { AddFundsSectionProps } from '@/types/wallet';

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
  const quickAmounts = [25, 50, 100, 200];

  return (
    <div className="relative group mb-8">
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 rounded-2xl blur-md opacity-15 group-hover:opacity-25 transition-opacity duration-500"></div>
      <div className="relative bg-gradient-to-br from-[#1f1f1f] to-[#2a2a2a] rounded-2xl p-8 border border-purple-500/20 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl shadow-lg shadow-purple-500/10">
            <PlusCircle className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">Add Funds</h2>
        </div>
        
        <div className="mb-6">
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-xl backdrop-blur-sm">
            <div className="flex items-start">
              <CheckCircle className="w-5 h-5 text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-semibold text-blue-300 mb-1">SECURE TRANSACTIONS</p>
                <p className="text-blue-200/80">Instant deposits. Your funds are available immediately.</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              <label htmlFor="amount" className="block text-sm font-medium text-gray-300 mb-2">
                Deposit Amount
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-gray-400 text-lg">$</span>
                </div>
                <input
                  type="text"
                  id="amount"
                  value={amountToAdd}
                  onChange={onAmountChange}
                  onKeyPress={onKeyPress}
                  placeholder="0.00"
                  className="w-full bg-[#0a0a0a] border-2 border-purple-500/30 rounded-xl py-4 pl-10 pr-4 text-xl font-medium text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  disabled={isLoading}
                />
              </div>
              <div className="flex gap-3 mt-4">
                {quickAmounts.map((quickAmount) => (
                  <button
                    key={quickAmount}
                    onClick={() => onQuickAmountSelect(quickAmount.toString())}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600/20 to-pink-600/20 hover:from-purple-600/30 hover:to-pink-600/30 text-white rounded-lg font-medium transition-all duration-200 border border-purple-500/30"
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
                className="relative group/btn px-8 py-4 rounded-xl font-semibold text-lg flex items-center justify-center min-w-[220px] bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
                disabled={isLoading || !amountToAdd || parseFloat(amountToAdd) <= 0}
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5 mr-3" />
                    Add Funds
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Status message */}
        {message && (
          <div className={`p-4 rounded-xl backdrop-blur-sm ${
            messageType === 'success' ? 'bg-green-900/20 text-green-400 border border-green-500/30' : 
            messageType === 'error' ? 'bg-red-900/20 text-red-400 border border-red-500/30' : ''
          }`}>
            <div className="flex items-center">
              {messageType === 'success' && <CheckCircle className="w-5 h-5 mr-3" />}
              {messageType === 'error' && <AlertCircle className="w-5 h-5 mr-3" />}
              {message}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}