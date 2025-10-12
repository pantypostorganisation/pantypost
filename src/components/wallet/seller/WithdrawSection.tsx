'use client';

import React, { useState } from 'react';
import { ArrowDownCircle, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { SecureInput } from '@/components/ui/SecureInput';
import { SecureForm } from '@/components/ui/SecureForm';
import { SecureMessageDisplay } from '@/components/ui/SecureMessageDisplay';
import { RATE_LIMITS } from '@/utils/security/rate-limiter';

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
  remainingDailyLimit: number;
  todaysWithdrawals: number;
  withdrawalLimits: {
    MIN_AMOUNT: number;
    MAX_AMOUNT: number;
    DAILY_LIMIT: number;
    MIN_BALANCE_REMAINING: number;
  };
  validationError?: string | null;
}

const MIN_WITHDRAWAL = 20;

export default function WithdrawSection({
  balance,
  withdrawAmount,
  message,
  messageType,
  isLoading,
  onAmountChange,
  onKeyPress,
  onWithdraw,
  onQuickAmountSelect,
  remainingDailyLimit,
  todaysWithdrawals,
  withdrawalLimits,
  validationError,
}: WithdrawSectionProps): React.ReactElement {
  const quickAmounts = [25, 50, 100, 250];
  const [amountError, setAmountError] = useState<string>('');

  // Handle amount change with validation
  const handleAmountChange = (value: string) => {
    setAmountError('');

    // Allow empty string
    if (value === '') {
      const syntheticEvent = { target: { value: '' } } as React.ChangeEvent<HTMLInputElement>;
      onAmountChange(syntheticEvent);
      return;
    }

    // Check valid number format
    const regex = /^\d*\.?\d{0,2}$/;
    if (!regex.test(value)) {
      setAmountError('Please enter a valid amount');
      return;
    }

    const numValue = parseFloat(value);

    // Validate amount
    if (!isNaN(numValue)) {
      if (numValue < MIN_WITHDRAWAL) {
        setAmountError(`Minimum withdrawal is $${MIN_WITHDRAWAL.toFixed(2)}`);
      } else if (numValue > balance) {
        setAmountError(`Cannot exceed balance of $${balance.toFixed(2)}`);
      }
    }

    // Create synthetic event for compatibility
    const syntheticEvent = { target: { value } } as React.ChangeEvent<HTMLInputElement>;
    onAmountChange(syntheticEvent);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const numValue = parseFloat(withdrawAmount);
    if (isNaN(numValue) || numValue < MIN_WITHDRAWAL || numValue > balance) {
      return;
    }

    onWithdraw();
  };

  return (
    <section className="rounded-2xl border border-gray-800 bg-[#111] p-6 transition-colors sm:p-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#ff950e]/30 bg-[#ff950e]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-[#ff950e]">
              Withdraw
            </span>
            <h2 className="text-2xl font-semibold text-white">Move earnings to your account</h2>
            <p className="text-sm text-gray-400">
              Available funds are ready to send. Secure, rate-limited withdrawals keep your payouts protected.
            </p>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#ff950e]/30 bg-[#ff950e]/10">
            <ArrowDownCircle className="h-6 w-6 text-[#ff950e]" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-gray-800 bg-[#0c0c0c] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Remaining today</p>
            <p className="mt-2 text-xl font-semibold text-white">${Math.max(0, remainingDailyLimit).toFixed(2)}</p>
            <p className="mt-1 text-xs text-gray-500">
              {todaysWithdrawals > 0
                ? `You've already withdrawn $${Math.max(0, todaysWithdrawals).toFixed(2)} today.`
                : 'No withdrawals taken yet today.'}
            </p>
          </div>
          <div className="rounded-2xl border border-gray-800 bg-[#0c0c0c] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Withdrawal limits</p>
            <p className="mt-2 text-sm text-gray-300">
              Min ${withdrawalLimits.MIN_AMOUNT.toFixed(2)} • Max ${withdrawalLimits.MAX_AMOUNT.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Daily cap ${withdrawalLimits.DAILY_LIMIT.toLocaleString()} keeps payouts compliant.
            </p>
          </div>
        </div>

        <SecureForm
          onSubmit={handleSubmit}
          rateLimitKey="withdrawal"
          rateLimitConfig={RATE_LIMITS.WITHDRAWAL}
          className="flex flex-col gap-6"
        >
          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-300" />
              <div className="text-sm text-blue-100">
                <p className="font-medium">Fast withdrawals</p>
                <p className="mt-1">
                  Funds typically arrive within 1-2 business days after the 10% platform fee is applied.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <label htmlFor="amount" className="block text-sm font-medium text-gray-300">
              Amount to withdraw
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="text-gray-500">$</span>
                </div>
                <SecureInput
                  id="amount"
                  type="text"
                  inputMode="decimal"
                  pattern="^\\d*\\.?\\d{0,2}$"
                  value={withdrawAmount}
                  onChange={handleAmountChange}
                  onKeyDown={onKeyPress}
                  placeholder="0.00"
                  error={amountError}
                  touched={!!withdrawAmount}
                  disabled={balance <= 0 || isLoading}
                  className="pl-8"
                  sanitize={false}
                />
              </div>
              <button
                type="submit"
                className={`flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold transition-colors ${
                  balance <= 0 ||
                  isLoading ||
                  !!amountError ||
                  !withdrawAmount ||
                  Number.isNaN(parseFloat(withdrawAmount)) ||
                  parseFloat(withdrawAmount) <= 0
                    ? 'cursor-not-allowed border border-gray-800 bg-[#1c1c1c] text-gray-500'
                    : 'border border-transparent bg-[#ff950e] text-black hover:bg-[#e88800]'
                }`}
                disabled={
                  balance <= 0 ||
                  isLoading ||
                  !!amountError ||
                  !withdrawAmount ||
                  Number.isNaN(parseFloat(withdrawAmount)) ||
                  parseFloat(withdrawAmount) <= 0
                }
              >
                {isLoading ? (
                  <>
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent" />
                    Processing
                  </>
                ) : (
                  <>
                    <ArrowDownCircle className="h-5 w-5" />
                    Withdraw
                  </>
                )}
              </button>
            </div>
            {(amountError || validationError) && (
              <p className="text-sm text-red-400">{amountError || validationError}</p>
            )}

            <div className="flex flex-wrap items-center gap-2">
              {quickAmounts.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => onQuickAmountSelect(amount.toString())}
                  disabled={amount > balance || isLoading}
                  className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                    amount > balance
                      ? 'cursor-not-allowed border-gray-800 bg-[#151515] text-gray-600'
                      : 'border-gray-800 bg-[#0c0c0c] text-gray-300 hover:border-[#ff950e] hover:text-[#ff950e]'
                  }`}
                >
                  ${amount}
                </button>
              ))}
              <button
                type="button"
                onClick={() => onQuickAmountSelect(balance.toFixed(2))}
                disabled={balance <= 0 || isLoading}
                className="rounded-full border border-[#ff950e]/40 bg-[#ff950e]/10 px-4 py-2 text-sm font-semibold text-[#ff950e] transition-colors hover:border-[#ff950e] hover:bg-[#ff950e]/20 disabled:cursor-not-allowed disabled:border-gray-800 disabled:bg-[#151515] disabled:text-gray-600"
              >
                Max
              </button>
            </div>
          </div>
        </SecureForm>

        {message && (
          <div
            className={`flex items-start gap-3 rounded-2xl border p-4 text-sm ${
              messageType === 'success'
                ? 'border-green-500/30 bg-green-500/10 text-green-300'
                : 'border-red-500/30 bg-red-500/10 text-red-300'
            }`}
          >
            {messageType === 'success' ? (
              <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
            )}
            <SecureMessageDisplay content={message} allowBasicFormatting={false} />
          </div>
        )}

        {!message && !amountError && !validationError && (
          <div className="flex items-start gap-3 rounded-2xl border border-gray-800 bg-[#0c0c0c] p-4 text-xs text-gray-400">
            <Info className="mt-0.5 h-4 w-4 text-[#ff950e]" />
            <span>
              Need to adjust a withdrawal? You can cancel within 30 minutes by contacting support. Keep your payout details up to date
              for zero disruptions.
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
