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
      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
      : messageType === 'error'
      ? 'border-red-500/40 bg-red-500/10 text-red-200'
      : 'border-white/10 bg-black/40 text-gray-300';

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] p-6 shadow-[0_30px_90px_-70px_rgba(66,153,255,0.6)] transition-colors hover:border-white/20 sm:p-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.18),transparent_55%)]" />

      <div className="relative z-10 flex flex-col gap-6">
        {/* Header row */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-400/40 bg-blue-500/15">
              <PlusCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white sm:text-2xl">Add Funds</h2>
              <p className="text-sm text-gray-400">Choose an amount, confirm, and spend immediately.</p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 self-start rounded-full border border-blue-500/30 bg-blue-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-blue-200 md:self-center">
            <Zap className="h-3.5 w-3.5" />
            Instant processing
          </span>
        </div>

        {/* Form */}
        <SecureForm
          onSubmit={handleSubmit}
          rateLimitKey="deposit"
          rateLimitConfig={RATE_LIMITS.DEPOSIT}
          className="space-y-6"
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
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[25, 50, 100, 200].map((quickAmount) => (
              <button
                key={quickAmount}
                type="button"
                onClick={() => onQuickAmountSelect(quickAmount.toString())}
                className="rounded-xl border border-white/10 bg-black/40 py-2.5 text-sm font-semibold text-gray-200 transition-all duration-200 hover:border-blue-400/40 hover:bg-black/60 hover:text-white disabled:opacity-50"
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
                         bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500
                         text-white shadow-md shadow-blue-500/30
                         transition-all duration-300
                         hover:scale-105 hover:shadow-blue-500/50
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
          <div className={`mt-2 flex items-start gap-2 rounded-2xl border p-4 text-sm ${messageClasses}`}>
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