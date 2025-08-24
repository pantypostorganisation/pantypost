'use client';

import { ArrowDownCircle, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { SecureInput } from '@/components/ui/SecureInput';
import { SecureForm } from '@/components/ui/SecureForm';
import { SecureMessageDisplay } from '@/components/ui/SecureMessageDisplay';
import { RATE_LIMITS } from '@/utils/security/rate-limiter';
import { useState } from 'react';

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
  handleWithdrawClick,
}: SellerWithdrawFormProps) {
  const [amountError, setAmountError] = useState<string>('');

  // Handle amount change with validation
  const handleAmountChange = (value: string) => {
    setAmountError('');

    // Allow empty string
    if (value === '') {
      setWithdrawAmount('');
      return;
    }

    // Check valid number format (2 decimals)
    const regex = /^\d*\.?\d{0,2}$/;
    if (!regex.test(value)) {
      setAmountError('Please enter a valid amount');
      return;
    }

    const numValue = parseFloat(value);

    // Validate amount
    if (!isNaN(numValue)) {
      if (numValue < 10 && value !== '') {
        setAmountError('Minimum withdrawal is $10.00');
      } else if (numValue > balance) {
        setAmountError(`Cannot exceed balance of $${balance.toFixed(2)}`);
      }
    }

    setWithdrawAmount(value);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const numValue = parseFloat(withdrawAmount);
    if (isNaN(numValue) || numValue < 10 || numValue > balance) {
      return;
    }

    handleWithdrawClick();
  };

  const disabled =
    balance <= 0 ||
    isLoading ||
    !!amountError ||
    !withdrawAmount ||
    parseFloat(withdrawAmount) <= 0;

  return (
    <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#333] shadow-lg mb-8">
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <ArrowDownCircle className="w-5 h-5 mr-2 text-[#ff950e]" />
        Withdraw Funds
      </h2>

      <SecureForm
        onSubmit={handleSubmit}
        rateLimitKey="withdrawal"
        rateLimitConfig={RATE_LIMITS.WITHDRAWAL}
        className="mb-6"
      >
        <div className="flex items-center mb-4 p-3 bg-[#222] rounded-lg border border-[#444] text-sm text-gray-300">
          <Info className="w-5 h-5 mr-2 text-[#ff950e]" />
          <p>This reflects your total earnings after the 10% platform fee.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <div
                className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                style={{ paddingTop: '28px' }}
              >
                <span className="text-gray-500">$</span>
              </div>
              <SecureInput
                id="amount"
                type="text"
                label="Amount to withdraw"
                value={withdrawAmount}
                onChange={handleAmountChange}
                placeholder="0.00"
                error={amountError}
                touched={!!withdrawAmount}
                disabled={balance <= 0 || isLoading}
                className="pl-8"
                sanitize={false}
              />
            </div>
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className={`px-6 py-3 rounded-lg font-medium flex items-center justify-center min-w-[180px] ${
                disabled
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-[#ff950e] hover:bg-[#e88800] text-black'
              }`}
              disabled={disabled}
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
      </SecureForm>

      {/* Status message */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            messageType === 'success'
              ? 'bg-green-900 bg-opacity-20 text-green-400'
              : messageType === 'error'
              ? 'bg-red-900 bg-opacity-20 text-red-400'
              : ''
          }`}
        >
          <div className="flex items-center">
            {messageType === 'success' && <CheckCircle className="w-5 h-5 mr-2" />}
            {messageType === 'error' && <AlertCircle className="w-5 h-5 mr-2" />}
            <SecureMessageDisplay content={message} allowBasicFormatting={false} />
          </div>
        </div>
      )}
    </div>
  );
}
