// src/components/wallet/buyer/AddFundsSection.tsx

'use client';

import { PlusCircle, CreditCard, CheckCircle, AlertCircle, Zap } from 'lucide-react';
import { SecureInput } from '@/components/ui/SecureInput';
import { SecureForm } from '@/components/ui/SecureForm';
import { SecureMessageDisplay } from '@/components/ui/SecureMessageDisplay';
import { sanitizeCurrency } from '@/utils/security/sanitization';
import { RATE_LIMITS } from '@/utils/security/rate-limiter';
import { useState } from 'react';

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
  const [amountError, setAmountError] = useState<string>('');

  // Handle amount change with validation
  const handleAmountChange = (value: string) => {
    // Clear any previous errors
    setAmountError('');
    
    // Allow empty string or valid number format
    if (value === '') {
      // Create synthetic event to maintain compatibility
      const syntheticEvent = {
        target: { value: '' }
      } as React.ChangeEvent<HTMLInputElement>;
      onAmountChange(syntheticEvent);
      return;
    }
    
    // Check if it's a valid number format (including decimals)
    const regex = /^\d*\.?\d{0,2}$/;
    if (!regex.test(value)) {
      setAmountError('Please enter a valid amount');
      return;
    }
    
    const numValue = parseFloat(value);
    
    // Validate amount range
    if (!isNaN(numValue)) {
      if (numValue < 5 && value !== '') {
        setAmountError('Minimum amount is $5.00');
      } else if (numValue > 5000) {
        setAmountError('Maximum amount is $5,000.00');
      }
    }
    
    // Create synthetic event to maintain compatibility
    const syntheticEvent = {
      target: { value }
    } as React.ChangeEvent<HTMLInputElement>;
    onAmountChange(syntheticEvent);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Final validation before submission
    const numValue = parseFloat(amountToAdd);
    if (isNaN(numValue) || numValue < 5 || numValue > 5000) {
      return;
    }
    
    onAddFunds();
  };

  // Sanitize amount for display
  const displayAmount = amountToAdd ? sanitizeCurrency(amountToAdd).toFixed(2) : '0.00';

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
        
        <SecureForm
          onSubmit={handleSubmit}
          rateLimitKey="deposit"
          rateLimitConfig={RATE_LIMITS.DEPOSIT}
          className="mb-6"
        >
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
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10" style={{ paddingTop: '28px' }}>
                  <span className="text-gray-400 text-lg">$</span>
                </div>
                <SecureInput
                  id="amount"
                  type="text"
                  label="Amount to add (USD)"
                  value={amountToAdd}
                  onChange={handleAmountChange}
                  onKeyDown={onKeyPress}
                  placeholder="0.00"
                  error={amountError}
                  touched={!!amountToAdd}
                  disabled={isLoading}
                  className="pl-10 text-lg"
                  sanitize={false} // We handle sanitization in handleAmountChange
                  helpText="Minimum $5.00, Maximum $5,000.00"
                />
              </div>
              
              {/* Quick amount buttons */}
              <div className="grid grid-cols-4 gap-3 mt-4">
                {[25, 50, 100, 200].map((quickAmount) => (
                  <button
                    key={quickAmount}
                    type="button"
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
                type="submit"
                className="px-8 py-3 rounded-xl font-semibold flex items-center justify-center bg-gradient-to-r from-[#ff950e] to-orange-600 hover:from-[#e88800] hover:to-orange-700 text-black shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-300"
                disabled={isLoading || !amountToAdd || parseFloat(amountToAdd) <= 0 || !!amountError}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
                    Processing Transaction...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Add ${displayAmount} to Wallet
                  </>
                )}
              </button>
            </div>
          </div>
        </SecureForm>

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
            <SecureMessageDisplay 
              content={message}
              allowBasicFormatting={false}
              className="text-sm font-medium"
            />
          </div>
        )}
      </div>
    </div>
  );
}
