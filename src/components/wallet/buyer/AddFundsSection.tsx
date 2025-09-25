// src/components/wallet/buyer/AddFundsSection.tsx
'use client';

import { PlusCircle, CreditCard, CheckCircle, AlertCircle, Sparkles, ArrowRight } from 'lucide-react';
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
  onQuickAmountSelect,
}: AddFundsSectionProps) {
  const [amountError, setAmountError] = useState<string>('');

  const handleAmountChange = (value: string) => {
    setAmountError('');
    if (value === '') {
      const syntheticEvent = { target: { value: '' } } as React.ChangeEvent<HTMLInputElement>;
      onAmountChange(syntheticEvent);
      return;
    }
    const regex = /^\d*\.?\d{0,2}$/;
    if (!regex.test(value)) {
      setAmountError('Please enter a valid amount');
      return;
    }
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      if (numValue < 5) setAmountError('Minimum amount is $5.00');
      else if (numValue > 5000) setAmountError('Maximum amount is $5,000.00');
    }
    const syntheticEvent = { target: { value } } as React.ChangeEvent<HTMLInputElement>;
    onAmountChange(syntheticEvent);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numValue = parseFloat(amountToAdd);
    if (isNaN(numValue) || numValue < 5 || numValue > 5000) return;
    onAddFunds();
  };

  const displayAmount = amountToAdd ? sanitizeCurrency(amountToAdd).toFixed(2) : '0.00';

  return (
    <section className="h-full bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#141414] rounded-2xl border border-white/5 hover:border-[#ff950e]/20 transition-all duration-300 relative overflow-hidden group">
      {/* Animated accent line */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#ff950e] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-r from-[#ff950e] to-orange-600 shadow-lg shadow-orange-500/20">
              <PlusCircle className="w-5 h-5 text-white" />
            </div>
            Add Funds
          </h2>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#ff950e]/10 to-orange-600/10 px-3 py-1 text-xs text-[#ff950e] font-medium border border-[#ff950e]/20">
            <Sparkles className="w-3.5 h-3.5" />
            Instant Processing
          </span>
        </div>

        {/* Form */}
        <SecureForm
          onSubmit={handleSubmit}
          rateLimitKey="deposit"
          rateLimitConfig={RATE_LIMITS.DEPOSIT}
          className="space-y-5"
        >
          <SecureInput
            id="amount"
            type="text"
            inputMode="decimal"
            pattern="^\d*\.?\d{0,2}$"
            label="Amount to add (USD)"
            value={amountToAdd}
            onChange={handleAmountChange}
            onKeyDown={onKeyPress}
            placeholder="0.00"
            error={amountError}
            touched={!!amountToAdd}
            disabled={isLoading}
            className="text-lg"
            sanitize={false}
            helpText="Minimum $5.00 • Maximum $5,000.00"
          />

          {/* Quick amount buttons - Enhanced design */}
          <div className="grid grid-cols-4 gap-2">
            {[25, 50, 100, 200].map((quickAmount) => (
              <button
                key={quickAmount}
                type="button"
                onClick={() => onQuickAmountSelect(quickAmount.toString())}
                className="relative py-2.5 px-3 rounded-lg bg-black/30 hover:bg-black/50 border border-white/10 hover:border-[#ff950e]/30 text-gray-300 hover:text-white transition-all duration-200 text-sm font-medium disabled:opacity-50 group overflow-hidden"
                disabled={isLoading}
              >
                <span className="relative z-10">${quickAmount}</span>
                <div className="absolute inset-0 bg-gradient-to-r from-[#ff950e]/0 via-[#ff950e]/10 to-[#ff950e]/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
              </button>
            ))}
          </div>

          {/* Submit Button - Enhanced */}
          <div className="flex justify-center pt-2">
            <button
              type="submit"
              className="relative group px-8 py-3.5 rounded-full font-semibold
                         bg-gradient-to-r from-[#ff950e] via-orange-500 to-[#ff950e]
                         text-black shadow-lg shadow-orange-500/25
                         transition-all duration-300
                         hover:shadow-orange-500/40 hover:scale-105
                         disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                         overflow-hidden"
              disabled={
                isLoading ||
                !amountToAdd ||
                Number.isNaN(parseFloat(amountToAdd)) ||
                parseFloat(amountToAdd) <= 0 ||
                !!amountError
              }
            >
              {/* Animated background */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#ff950e] via-yellow-500 to-[#ff950e] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <span className="relative z-10 flex items-center">
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Deposit ${displayAmount}
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </span>
            </button>
          </div>
        </SecureForm>

        {/* Message */}
        {message && (
          <div className={`mt-5 p-4 rounded-lg flex items-start text-sm backdrop-blur-sm ${
            messageType === 'success'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : messageType === 'error'
              ? 'bg-red-500/10 text-red-400 border border-red-500/20'
              : 'bg-gray-800/50 text-gray-300 border border-gray-700/50'
          }`}>
            {messageType === 'success' ? (
              <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
            ) : messageType === 'error' ? (
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
            ) : null}
            <SecureMessageDisplay content={message} allowBasicFormatting={false} className="font-medium" />
          </div>
        )}
      </div>
    </section>
  );
}
