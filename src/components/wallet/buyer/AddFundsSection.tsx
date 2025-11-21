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
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[#ff950e]/40 bg-[#ff950e]/10">
              <PlusCircle className="h-5 w-5 text-[#ff950e]" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white sm:text-2xl">Add Funds</h2>
              <p className="text-sm text-gray-400">Secure card payment powered by SegPay</p>
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap gap-2">
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

        {/* Two Column Layout */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
          {/* Left: Form */}
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

          {/* Right: Card Preview */}
          <div className="space-y-4">
            {/* Animated Card with Brand Colors */}
            <div className="relative">
              {/* Subtle glow effect */}
              <div className="absolute inset-0 bg-[#ff950e]/10 blur-3xl animate-pulse" />
              
              {/* Card - Dark grey to black gradient (NW to SE) with subtle accent */}
              <div className="relative bg-gradient-to-br from-[#2a2a2a] via-[#1a1a1a] to-black rounded-3xl p-6 shadow-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] border border-gray-800">
                {/* Subtle background pattern */}
                <div className="absolute inset-0 opacity-[0.02]">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-[#ff950e] rounded-full blur-3xl -translate-y-24 translate-x-24" />
                </div>

                <div className="relative flex flex-col gap-6">
                  {/* Header with Logos */}
                  <div className="flex justify-between items-start">
                    {/* PantyPost Logo - 70% of header size */}
                    <div className="flex flex-col">
                      <Image
                        src="/logo.png"
                        alt="PantyPost"
                        width={67}
                        height={67}
                        quality={90}
                        className="w-[67px] h-auto"
                      />
                      <p className="text-[8px] text-gray-500 mt-1">
                        Secured Payment
                      </p>
                    </div>

                    {/* SegPay Logo */}
                    <div className="flex flex-col items-end">
                      <Image
                        src="/SegPayLogo.png"
                        alt="SegPay"
                        width={80}
                        height={32}
                        quality={90}
                        className="h-8 w-auto"
                      />
                      <div className="flex items-center gap-1.5 bg-white/5 backdrop-blur-sm rounded-full px-2.5 py-1 mt-1.5 border border-gray-700">
                        <Sparkles className="h-2.5 w-2.5 text-gray-400" />
                        <span className="text-[9px] font-semibold text-gray-400">Secure</span>
                      </div>
                    </div>
                  </div>

                  {/* Chip with subtle gradient */}
                  <div className="w-12 h-9 rounded-lg bg-gradient-to-br from-[#212121] to-[#000000] shadow-lg border border-gray-800" />

                  {/* Card Number (masked) */}
                  <div className="text-xl font-mono font-semibold tracking-[0.3em] text-gray-300">
                    •••• •••• •••• ••••
                  </div>

                  {/* Bottom Info */}
                  <div className="flex justify-between items-end">
                    <div className="flex-1">
                      <p className="text-[10px] uppercase text-gray-500 tracking-wider mb-1">
                        Cardholder
                      </p>
                      <p className="text-sm font-semibold text-gray-200 truncate">
                        {cardholderName || 'YOUR NAME'}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-[10px] uppercase text-gray-500 tracking-wider mb-1">
                        Amount
                      </p>
                      <p className="text-lg font-bold text-[#ff950e]">
                        {numAmount > 0 ? `$${numAmount.toFixed(2)}` : '—'}
                      </p>
                      <p className="text-[10px] text-gray-500">USD</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Subtle card shadow */}
              <div className="absolute -bottom-2 left-4 right-4 h-4 bg-gradient-to-r from-transparent via-black/30 to-transparent blur-xl rounded-full" />
            </div>

            {/* Summary Card */}
            <div className="rounded-xl border border-gray-800 bg-[#0c0c0c] p-4">
              <h3 className="text-sm font-semibold text-white mb-3">
                Deposit Summary
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Deposit amount</span>
                  <span className="text-white font-medium">
                    ${displayAmount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Processing fee</span>
                  <span className="text-green-400 font-medium">$0.00</span>
                </div>
                <div className="h-px bg-gray-800 my-2" />
                <div className="flex justify-between">
                  <span className="text-white font-semibold">Total to pay</span>
                  <span className="text-[#ff950e] font-bold">
                    ${displayAmount}
                  </span>
                </div>
              </div>
            </div>

            {/* Security Notice */}
            <div className="rounded-xl border border-gray-800 bg-[#0c0c0c] p-4">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-[#ff950e] flex-shrink-0 mt-0.5" />
                <div className="text-xs text-gray-400 leading-relaxed">
                  <p className="font-medium text-gray-300 mb-1">Your Security Matters</p>
                  <p>
                    Card details are processed directly by SegPay. We never store your 
                    full card number or CVV.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
