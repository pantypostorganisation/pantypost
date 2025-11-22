// src/components/wallet/buyer/AddFundsSection.tsx
'use client';

import { PlusCircle, CreditCard, CheckCircle, AlertCircle, Sparkles, Shield } from 'lucide-react';
import { SecureInput } from '@/components/ui/SecureInput';
import { SecureForm } from '@/components/ui/SecureForm';
import { SecureMessageDisplay } from '@/components/ui/SecureMessageDisplay';
import { sanitizeCurrency } from '@/utils/security/sanitization';
import { RATE_LIMITS } from '@/utils/security/rate-limiter';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';

interface AddFundsSectionProps {
  balance: number;
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
  balance,
  amountToAdd,
  message,
  messageType,
  isLoading,
  onAmountChange,
  onKeyPress,
  onAddFunds,
  onQuickAmountSelect,
}: AddFundsSectionProps) {
  const { user } = useAuth();
  const [amountError, setAmountError] = useState<string>('');
  const [cardholderName, setCardholderName] = useState('');

  // Initialize cardholder name from user
  useEffect(() => {
    if (user?.username) {
      setCardholderName(user.username);
    }
  }, [user]);

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
  const numAmount = parseFloat(amountToAdd) || 0;

  const messageClasses =
    messageType === 'success'
      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
      : messageType === 'error'
      ? 'border-red-500/40 bg-red-500/10 text-red-200'
      : 'border-gray-800 bg-[#0c0c0c] text-gray-300';

  return (
    <section className="rounded-2xl border border-gray-800 bg-[#111] p-6 transition-colors sm:p-8">
      <div className="flex flex-col gap-6">
        {/* Header row */}
        <div className="flex items-center gap-3">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[#ff950e]/40 bg-[#ff950e]/10">
            <CreditCard className="h-5 w-5 text-[#ff950e]" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white sm:text-2xl">Card Deposit</h2>
            <p className="text-sm text-gray-400">Secure payment powered by SegPay</p>
          </div>
        </div>

        {/* Credit Card Preview - Now Larger and Centered */}
        <div className="flex justify-center">
          <div className="w-full max-w-md">
            {/* Animated Card with Brand Colors - Actual Credit Card Size Ratio */}
            <div className="relative">
              {/* Subtle glow effect */}
              <div className="absolute inset-0 bg-[#ff950e]/10 blur-3xl animate-pulse" />
              
              {/* Card - Actual credit card aspect ratio (1.586:1) */}
              <div className="relative bg-gradient-to-br from-[#2a2a2a] via-[#1a1a1a] to-black rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] border border-gray-800" style={{ aspectRatio: '1.586' }}>
                {/* Subtle background pattern */}
                <div className="absolute inset-0 opacity-[0.03]">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-[#ff950e] rounded-full blur-3xl -translate-y-24 translate-x-24" />
                </div>

                {/* Logos positioned at top of card */}
                <div className="absolute top-4 sm:top-6 left-4 sm:left-6 right-4 sm:right-6 flex justify-between items-center">
                  {/* PantyPost Logo */}
                  <Image
                    src="/logo.png"
                    alt="PantyPost"
                    width={70}
                    height={70}
                    quality={90}
                    className="w-12 h-12 sm:w-16 sm:h-16 md:w-[70px] md:h-[70px] object-contain"
                  />

                  {/* SegPay Logo */}
                  <Image
                    src="/SegPayLogo.png"
                    alt="SegPay"
                    width={110}
                    height={25}
                    quality={90}
                    className="h-5 sm:h-6 md:h-7 w-auto object-contain"
                    style={{ maxWidth: '90px' }}
                  />
                </div>

                {/* Contactless Payment Waves - Positioned in upper-right middle */}
                <div className="absolute" style={{ right: '30px', top: '45%' }}>
                  <Image
                    src="/CreditCardWaves.png"
                    alt="Contactless"
                    width={37}
                    height={47}
                    quality={90}
                    className="w-[15px] h-[19px] sm:w-[18px] sm:h-[23px] object-contain opacity-80"
                  />
                </div>

                <div className="relative flex flex-col gap-0 p-4 sm:p-5 md:p-6 h-full justify-between">
                  {/* Spacer for logos */}
                  <div className="h-12 sm:h-14 md:h-16"></div>

                  {/* Credit Card Chip - 30% smaller */}
                  <div className="flex items-center">
                    <Image
                      src="/CreditCardChip.png"
                      alt="Chip"
                      width={73}
                      height={53}
                      quality={90}
                      className="w-[35px] h-[25px] sm:w-[40px] sm:h-[29px] md:w-[45px] md:h-[33px] object-contain"
                    />
                  </div>

                  {/* Card Number (masked) - Responsive sizing */}
                  <div className="flex gap-2 sm:gap-3 md:gap-4">
                    <span className="text-base sm:text-lg md:text-xl lg:text-2xl font-mono font-semibold text-gray-300">••••</span>
                    <span className="text-base sm:text-lg md:text-xl lg:text-2xl font-mono font-semibold text-gray-300">••••</span>
                    <span className="text-base sm:text-lg md:text-xl lg:text-2xl font-mono font-semibold text-gray-300">••••</span>
                    <span className="text-base sm:text-lg md:text-xl lg:text-2xl font-mono font-semibold text-gray-300">••••</span>
                  </div>

                  {/* Bottom Info */}
                  <div className="flex justify-between items-end">
                    <div className="flex-1">
                      <p className="text-[9px] sm:text-[10px] md:text-xs uppercase text-gray-500 tracking-wider mb-0.5 sm:mb-1">
                        Cardholder
                      </p>
                      <p className="text-xs sm:text-sm md:text-base font-semibold text-gray-200 truncate">
                        {cardholderName || 'YOUR NAME'}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-[9px] sm:text-[10px] md:text-xs uppercase text-gray-500 tracking-wider mb-0.5 sm:mb-1">
                        Balance
                      </p>
                      <p className="text-base sm:text-lg md:text-xl font-bold text-[#ff950e]">
                        ${balance.toFixed(2)}
                      </p>
                      <p className="text-[8px] sm:text-[9px] md:text-[10px] text-gray-500">Available</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card shadow */}
              <div className="absolute -bottom-2 left-4 right-4 h-4 bg-gradient-to-r from-transparent via-black/30 to-transparent blur-xl rounded-full" />
            </div>
          </div>
        </div>

        {/* Form Section */}
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
                className="rounded-xl border border-gray-800 bg-[#0c0c0c] py-2.5 text-sm font-semibold text-gray-200 transition-colors duration-200 hover:border-[#ff950e] hover:text-white disabled:opacity-50"
                disabled={isLoading}
              >
                ${quickAmount}
              </button>
            ))}
          </div>

          {/* Cardholder Name */}
          <SecureInput
            id="cardholderName"
            type="text"
            label="Cardholder Name"
            value={cardholderName}
            onChange={setCardholderName}
            placeholder="Full name on card"
            touched={!!cardholderName}
            disabled={isLoading}
            sanitize={true}
          />

          {/* SegPay Iframe Placeholder */}
          <div className="rounded-xl border-2 border-dashed border-gray-800 bg-[#0c0c0c] p-6">
            <div className="text-center">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-700 bg-gray-800/50 mb-3">
                <CreditCard className="h-7 w-7 text-gray-500" />
              </div>
              <p className="text-sm font-medium text-gray-400 mb-2">
                Secure Card Entry
              </p>
              <p className="text-xs text-gray-600 max-w-sm mx-auto">
                SegPay's secure payment form will appear here. No card data touches our servers.
              </p>
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-xl border border-gray-800 bg-[#0c0c0c] p-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Deposit amount</span>
                <span className="text-white font-medium">${displayAmount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Processing fee</span>
                <span className="text-green-400 font-medium">$0.00</span>
              </div>
              <div className="h-px bg-gray-800 my-2" />
              <div className="flex justify-between">
                <span className="text-white font-semibold">Total to pay</span>
                <span className="text-[#ff950e] font-bold">${displayAmount}</span>
              </div>
            </div>
          </div>

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

          {/* Submit */}
          <div className="flex justify-center">
            <button
              type="submit"
              className="flex items-center justify-center rounded-full bg-[#ff950e] px-10 py-3.5 font-semibold text-black transition-colors duration-200 hover:bg-[#e0850d] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={
                isLoading ||
                !amountToAdd ||
                Number.isNaN(parseFloat(amountToAdd)) ||
                parseFloat(amountToAdd) <= 0 ||
                !!amountError
              }
            >
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

        {/* Trust Badges */}
        <div className="flex flex-wrap gap-2 justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-400">
            <Shield className="h-3 w-3" />
            PCI-DSS Compliant
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-400">
            <Shield className="h-3 w-3" />
            256-bit SSL
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 text-xs font-medium text-purple-400">
            <CheckCircle className="h-3 w-3" />
            Instant Deposit
          </div>
        </div>
      </div>
    </section>
  );
}
