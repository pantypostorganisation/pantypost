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
 : 'border-line bg-surface text-ink-muted';

  return (
    // No panel. The page background is the surface; wrapping this form in
    // a bordered card only to place two more bordered cards inside it was
    // boxes within a box. Structure now comes from the two-column split
    // and the hairline above the totals.
    <section>
 <div className="flex flex-col gap-4">
 {/* Header row */}
 <div>
                <h2 className="text-base font-semibold text-white">Add funds</h2>
              </div>

 <SecureForm
 onSubmit={handleSubmit}
 rateLimitKey="deposit"
 rateLimitConfig={RATE_LIMITS.DEPOSIT}
 className="space-y-6"
 >
        {/* TWO COLUMNS.
            Left: the card, the amount, the quick picks -- everything
            about HOW MUCH. Right: cardholder, the SegPay entry point,
            the totals and the submit -- everything about PAYING.

            Stacked, this ran well past a laptop viewport. Side by side it
            fits, and the split matches the two decisions being made. */}
        <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
          <div className="space-y-5">
 {/* Credit Card Preview - Now Larger and Centered */}
 <div className="flex justify-center lg:justify-start">
 <div className="w-full max-w-[400px]">
 {/* Animated Card with Brand Colors - Actual Credit Card Size Ratio */}
 <div className="relative">
 {/* Subtle glow effect */}
 
 {/* Card - Actual credit card aspect ratio (1.586:1) */}
 <div className="relative bg-surface-raised rounded-lg overflow-hidden transition-all duration-300 hover:scale-[1.02] border border-line" style={{ aspectRatio: '1.586' }}>
 {/* Subtle background pattern */}
 <div className="absolute inset-0 opacity-[0.03]">
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

 {/* Card Number (masked) - Back to text with responsive sizing */}
 <div className="font-mono font-semibold text-ink-muted whitespace-nowrap">
 <span className="inline-block text-sm sm:text-base md:text-lg lg:text-xl">
 •••• •••• •••• ••••
 </span>
 </div>

 {/* Bottom Info */}
 <div className="flex justify-between items-end">
 <div className="flex-1">
 <p className="text-[9px] sm:text-[10px] md:text-xs uppercase text-ink-faint tracking-wider mb-0.5 sm:mb-1">
 Cardholder
 </p>
 <p className="text-xs sm:text-sm md:text-base font-semibold text-gray-200 truncate">
 {cardholderName || 'YOUR NAME'}
 </p>
 </div>
 
 <div className="text-right">
 <p className="text-[9px] sm:text-[10px] md:text-xs uppercase text-ink-faint tracking-wider mb-0.5 sm:mb-1">
 Balance
 </p>
 <p className="text-base sm:text-lg md:text-xl font-bold text-primary">
 ${balance.toFixed(2)}
 </p>
 <p className="text-[8px] sm:text-[9px] md:text-[10px] text-ink-faint">Available</p>
 </div>
 </div>
 </div>
 </div>

 {/* Card shadow */}
 </div>
 </div>
 </div>

 {/* Form Section */}
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
 className="rounded-md border border-line py-2.5 text-sm font-semibold text-ink-muted transition-colors duration-200 hover:border-primary hover:text-ink disabled:opacity-50"
 disabled={isLoading}
 >
 ${quickAmount}
 </button>
 ))}
 </div>

          </div>

          <div className="space-y-5">
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
            <div className="rounded-md border border-dashed border-line px-4 py-6 text-center">
              <p className="text-sm font-medium text-ink-muted">Secure card entry</p>
              <p className="mx-auto mt-1 max-w-sm text-xs text-ink-faint">
                SegPay&rsquo;s payment form appears here. No card data touches our servers.
              </p>
            </div>

 {/* Summary */}
            <div className="border-t border-line pt-4">
              <div className="space-y-2 text-sm">
 <div className="flex justify-between">
 <span className="text-ink-muted">Deposit amount</span>
 <span className="text-white font-medium">${displayAmount}</span>
 </div>
 <div className="flex justify-between">
 <span className="text-ink-muted">Processing fee</span>
 <span className="text-green-400 font-medium">$0.00</span>
 </div>
 <div className="h-px bg-gray-800 my-2" />
 <div className="flex justify-between">
 <span className="text-white font-semibold">Total to pay</span>
                <span className="font-bold text-primary">${displayAmount}</span>
                </div>
              </div>
            </div>

 {/* Message */}
 {message && (
 <div className={`mt-2 flex items-start gap-2 rounded-lg border p-4 text-sm ${messageClasses}`}>
 {messageType === 'success' ? (
 <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
 ) : messageType === 'error' ? (
 <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
 ) : null}
 <SecureMessageDisplay content={message} allowBasicFormatting={false} className="font-medium" />
 </div>
 )}

 {/* Submit */}
 <div className="flex justify-center lg:justify-start">
 <button
 type="submit"
 className="flex items-center justify-center rounded-md bg-primary px-10 py-3.5 font-semibold text-black transition-colors duration-200 hover:bg-primary-press disabled:cursor-not-allowed disabled:opacity-50"
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
          </div>
        </div>
 </SecureForm>

          {/* One line instead of three chips.
              They were bordered pills in green, blue and purple -- three
              more colour families on a page that has one accent -- and
              they said the same thing three ways. */}
          <p className="flex items-center justify-center gap-1.5 text-xs text-ink-faint">
            <Shield className="h-3 w-3" aria-hidden="true" />
            Fast &amp; secure payments powered by SegPay
          </p>
 </div>
 </section>
 );
}