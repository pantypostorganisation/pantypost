'use client';

import React, { useState } from 'react';
import { ArrowDownCircle, AlertCircle, CheckCircle } from 'lucide-react';
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
    <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#333] shadow-lg mb-8">
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <ArrowDownCircle className="w-5 h-5 mr-2 text-[#ff950e]" />
        Withdraw Funds
      </h2>

      <SecureForm onSubmit={handleSubmit} rateLimitKey="withdrawal" rateLimitConfig={RATE_LIMITS.WITHDRAWAL} className="mb-6">
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
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none" style={{ paddingTop: '12px' }}>
                  <span className="text-gray-500">$</span>
                </div>
                <SecureInput
                  id="amount"
                  type="text"
                  inputMode="decimal"
                  pattern="^\d*\.?\d{0,2}$"
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
                className={`px-6 py-3 rounded-lg font-medium flex items-center justify-center whitespace-nowrap transition-colors ${
                  balance <= 0 || isLoading || !!amountError || !withdrawAmount || Number.isNaN(parseFloat(withdrawAmount)) || parseFloat(withdrawAmount) <= 0
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-[#ff950e] hover:bg-[#e88800] text-black'
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
                  type="button"
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
                type="button"
                onClick={() => onQuickAmountSelect(balance.toFixed(2))}
                disabled={balance <= 0 || isLoading}
                className="px-3 py-1 text-sm rounded-md bg-[#222] text-[#ff950e] hover:bg-[#333] border border-[#ff950e] transition-colors"
              >
                Max
              </button>
            </div>
          </div>
        </div>
      </SecureForm>

      {/* Status message */}
      {message && (
        <div
          className={`p-4 rounded-lg flex items-center ${
            messageType === 'success'
              ? 'bg-green-900/20 border border-green-500/30 text-green-400'
              : 'bg-red-900/20 border border-red-500/30 text-red-400'
          }`}
        >
          {messageType === 'success' ? (
            <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
          )}
          <SecureMessageDisplay content={message} allowBasicFormatting={false} />
        </div>
      )}
    </div>
  );
}
