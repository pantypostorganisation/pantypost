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

  const messageClasses =
    messageType === 'success'
      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
      : messageType === 'error'
      ? 'bg-red-500/10 text-red-400 border border-red-500/30'
      : 'bg-gray-700/20 text-gray-300 border border-gray-600/30';

  return (
    <section className="bg-[#141414] rounded-2xl border border-gray-800/80 hover:border-gray-700 transition-colors relative overflow-hidden mb-8">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#ff950e]/5 to-transparent" />

      <div className="relative z-10 px-5 py-5 md:px-6 md:py-6">
        {/* Header row */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h2 className="text-xl font-semibold flex items-center text-white">
            <div className="bg-gradient-to-r from-[#ff950e] to-orange-600 p-2 rounded-lg mr-2 shadow-md shadow-orange-500/15">
              <PlusCircle className="w-5 h-5 text-white" />
            </div>
            Add Funds
          </h2>

          <span className="inline-flex items-center gap-1.5 self-start md:self-center rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs text-blue-300">
            <Zap className="w-3.5 h-3.5" />
            Instant Processing
          </span>
        </div>

        {/* Divider */}
        <div className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-gray-800 to-transparent" />

        {/* Form */}
        <SecureForm
          onSubmit={handleSubmit}
          rateLimitKey="deposit"
          rateLimitConfig={RATE_LIMITS.DEPOSIT}
          className="mt-6 space-y-6"
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
            helpText="Minimum $5.00, Maximum $5,000.00"
          />

          {/* Quick amount buttons */}
          <div className="grid grid-cols-4 gap-3">
            {[25, 50, 100, 200].map((quickAmount) => (
              <button
                key={quickAmount}
                type="button"
                onClick={() => onQuickAmountSelect(quickAmount.toString())}
                className="py-2.5 px-3 rounded-lg bg-black/40 hover:bg-black/60 border border-gray-700 hover:border-[#ff950e]/50 text-gray-300 hover:text-white transition-all duration-200 text-sm font-medium disabled:opacity-50"
                disabled={isLoading}
              >
                ${quickAmount}
              </button>
            ))}
          </div>

          {/* Submit */}
          <div className="flex justify-center">
            <button
              type="submit"
              className="relative overflow-hidden px-10 py-3.5 rounded-full font-semibold flex items-center justify-center
                         bg-gradient-to-r from-[#ff950e] via-orange-500 to-orange-600
                         text-black shadow-md shadow-orange-500/30
                         transition-all duration-300
                         hover:scale-105 hover:shadow-orange-500/50
                         disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              disabled={
                isLoading ||
                !amountToAdd ||
                Number.isNaN(parseFloat(amountToAdd)) ||
                parseFloat(amountToAdd) <= 0 ||
                !!amountError
              }
            >
              {/* Shimmer overlay */}
              <span className="absolute inset-0 rounded-full bg-gradient-to-r from-white/0 via-white/20 to-white/0 
                               translate-x-[-100%] animate-[shimmer_2s_infinite] pointer-events-none" />

              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Deposit ${displayAmount}
                </>
              )}
            </button>
          </div>
        </SecureForm>

        {/* Message */}
        {message && (
          <div className={`mt-6 p-4 rounded-lg flex items-start text-sm ${messageClasses}`}>
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
