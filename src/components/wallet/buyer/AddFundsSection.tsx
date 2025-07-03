// src/components/wallet/buyer/AddFundsSection.tsx
'use client';

import { PlusCircle, CreditCard, CheckCircle, AlertCircle, Zap } from 'lucide-react';

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
    <div className="bg-[#1a1a1a] rounded-2xl p-8 border border-gray-800 hover:border-gray-700 transition-all duration-300 mb-8 relative overflow-hidden group">
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#ff950e]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative z-10">
        <h2 className="text-2xl font-bold mb-6 flex items-center text-white">
          <div className="bg-gradient-to-r from-[#ff950e] to-orange-600 p-2 rounded-lg mr-3 shadow-lg shadow-orange-500/20">
            <PlusCircle className="w-6 h-6 text-white" />
          </div>
          Add Funds
        </h2>
        
        <div className="mb-6">
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-600/10 to-cyan-600/10 border border-blue-500/30 rounded-xl">
            <div className="flex items-start">
              <div className="bg-blue-500/20 p-2 rounded-lg mr-3">
                <Zap className="w-5 h-5 text-blue-400" />
              </div>
              <div className="text-sm">
                <p className="font-semibold text-blue-300 mb-1">Instant Processing</p>
                <p className="text-blue-200/80">Funds are added immediately and ready to use for any purchase</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-300 mb-2">
                Amount to add (USD)
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
                  className="w-full bg-black/50 border border-gray-700 rounded-xl py-4 pl-10 pr-4 text-white text-lg focus:outline-none focus:ring-2 focus:ring-[#ff950e] focus:border-transparent transition-all placeholder-gray-600"
                  disabled={isLoading}
                />
              </div>
              
              {/* Quick amount buttons */}
              <div className="grid grid-cols-4 gap-3 mt-4">
                {[25, 50, 100, 200].map((quickAmount) => (
                  <button
                    key={quickAmount}
                    onClick={() => onQuickAmountSelect(quickAmount.toString())}
                    className="py-3 px-4 bg-black/50 hover:bg-black/70 border border-gray-700 hover:border-[#ff950e]/50 text-gray-300 hover:text-white rounded-xl transition-all duration-200 font-medium"
                    disabled={isLoading}
                  >
                    ${quickAmount}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex justify-center">
              <button
                onClick={onAddFunds}
                className="px-8 py-3 rounded-xl font-semibold flex items-center justify-center bg-gradient-to-r from-[#ff950e] to-orange-600 hover:from-[#e88800] hover:to-orange-700 text-black shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-300"
                disabled={isLoading || !amountToAdd || parseFloat(amountToAdd) <= 0}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
                    Processing Transaction...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Add ${amountToAdd || '0.00'} to Wallet
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {message && (
          <div className={`mt-6 p-4 rounded-xl flex items-start ${
            messageType === 'success' 
              ? 'bg-green-500/10 text-green-400 border border-green-500/30' 
              : 'bg-red-500/10 text-red-400 border border-red-500/30'
          }`}>
            {messageType === 'success' ? (
              <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
            )}
            <span className="text-sm font-medium">{message}</span>
          </div>
        )}
      </div>
    </div>
  );
}