// src/components/seller/wallet/SellerWithdrawForm.tsx
'use client';

import { 
  ArrowDownCircle,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';

interface SellerWithdrawFormProps {
  balance: number;
  withdrawAmount: string;
  setWithdrawAmount: (amount: string) => void;
  message: string;
  messageType: 'success' | 'error' | '';
  isLoading: boolean;
  handleWithdrawClick: () => void;
}

export default function SellerWithdrawForm({
  balance,
  withdrawAmount,
  setWithdrawAmount,
  message,
  messageType,
  isLoading,
  handleWithdrawClick
}: SellerWithdrawFormProps) {
  return (
    <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#333] shadow-lg mb-8">
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <ArrowDownCircle className="w-5 h-5 mr-2 text-[#ff950e]" />
        Withdraw Funds
      </h2>
      
      <div className="mb-6">
        <div className="flex items-center mb-4 p-3 bg-[#222] rounded-lg border border-[#444] text-sm text-gray-300">
          <Info className="w-5 h-5 mr-2 text-[#ff950e]" />
          <p>This reflects your total earnings after the 10% platform fee.</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="amount" className="block text-sm font-medium text-gray-400 mb-1">
              Amount to withdraw
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500">$</span>
              </div>
              <input
                type="number"
                id="amount"
                step="0.01"
                min="0"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-[#222] border border-[#444] rounded-lg py-3 pl-8 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e] focus:border-transparent"
                disabled={balance <= 0}
              />
            </div>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleWithdrawClick}
              className={`px-6 py-3 rounded-lg font-medium flex items-center justify-center min-w-[180px] ${
                balance <= 0
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
                  Withdraw Funds
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Status message */}
      {message && (
        <div className={`p-4 rounded-lg ${
          messageType === 'success' ? 'bg-green-900 bg-opacity-20 text-green-400' : 
          messageType === 'error' ? 'bg-red-900 bg-opacity-20 text-red-400' : ''
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