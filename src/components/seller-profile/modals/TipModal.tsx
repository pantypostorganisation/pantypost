// src/components/seller-profile/modals/TipModal.tsx
'use client';

import { useState, useContext } from 'react';
import { Gift, DollarSign, X } from 'lucide-react';
import { SecureInput } from '@/components/ui/SecureInput';
import { SecureForm } from '@/components/ui/SecureForm';
import { sanitizeStrict, sanitizeCurrency } from '@/utils/security/sanitization';
import { tipService } from '@/services/tip.service';
import { WalletContext } from '@/context/WalletContext';
import { useAuth } from '@/context/AuthContext';

interface TipModalProps {
  show: boolean;
  username: string;
  tipAmount: string;
  tipSuccess: boolean;
  tipError: string;
  onAmountChange: (amount: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export default function TipModal({
  show,
  username,
  tipAmount,
  tipSuccess: parentTipSuccess,
  tipError: parentTipError,
  onAmountChange,
  onClose,
  onSubmit: parentOnSubmit,
}: TipModalProps) {
  const [touched, setTouched] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [localTipSuccess, setLocalTipSuccess] = useState(false);
  const [localTipError, setLocalTipError] = useState('');
  
  const walletContext = useContext(WalletContext);
  const { user } = useAuth();

  if (!show) return null;

  const sanitizedUsername = sanitizeStrict(username);
  
  // Get user balance from wallet context
  const userBalance = user && walletContext 
    ? walletContext.getBuyerBalance(user.username) 
    : 0;

  const handleSecureAmountChange = (value: string) => {
    if (value === '') {
      onAmountChange('');
      setLocalTipError('');
    } else {
      const sanitized = sanitizeCurrency(value);
      onAmountChange(sanitized.toString());
      setLocalTipError('');
    }
  };

  const handleSecureSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double submission
    if (isProcessing) {
      return;
    }
    
    if (!user) {
      setLocalTipError('You must be logged in to send tips');
      return;
    }
    
    if (user.role !== 'buyer') {
      setLocalTipError('Only buyers can send tips');
      return;
    }
    
    setIsProcessing(true);
    setLocalTipError('');
    setLocalTipSuccess(false);
    
    try {
      const amount = parseFloat(tipAmount);
      
      // Validate amount
      if (isNaN(amount) || amount < 1 || amount > 500) {
        setLocalTipError('Tip amount must be between $1 and $500');
        setIsProcessing(false);
        return;
      }
      
      // Check balance
      if (amount > userBalance) {
        setLocalTipError('Insufficient balance');
        setIsProcessing(false);
        return;
      }
      
      // Send tip via service - only once
      const result = await tipService.sendTip(username, amount);
      
      if (result.success) {
        setLocalTipSuccess(true);
        
        // Reload wallet data to reflect new balance
        if (walletContext && walletContext.reloadData) {
          await walletContext.reloadData();
        }
        
        // REMOVED: parentOnSubmit() call that was causing double sending
        // The parent component should handle success through props or context
        
        // Auto-close after success
        setTimeout(() => {
          onAmountChange('');
          setLocalTipSuccess(false);
          onClose();
        }, 2000);
      } else {
        setLocalTipError(result.message || 'Failed to send tip');
      }
    } catch (error) {
      console.error('Error sending tip:', error);
      setLocalTipError(error instanceof Error ? error.message : 'Failed to send tip. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const disabled = !tipAmount || Number.parseFloat(tipAmount) <= 0 || isProcessing;
  const displaySuccess = localTipSuccess || parentTipSuccess;
  const displayError = localTipError || parentTipError;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur p-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-black/70 p-6 sm:p-8 shadow-[0_25px_70px_-40px_rgba(0,0,0,0.9)]">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#ff950e]/40 bg-[#ff950e]/10">
              <Gift className="h-5 w-5 text-[#ff950e]" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Send a tip</h2>
              <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Support {sanitizedUsername}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-white/20 bg-white/5 p-2 text-gray-300 transition hover:text-white"
            aria-label="Close"
            type="button"
            disabled={isProcessing}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {displaySuccess ? (
          <div className="rounded-2xl border border-emerald-400/40 bg-emerald-500/10 p-8 text-center text-emerald-100">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-500/20 text-3xl">
              ✓
            </div>
            <p className="mt-4 text-lg font-semibold">Tip sent successfully!</p>
            <p className="mt-2 text-sm text-emerald-100/80">Thank you for supporting {sanitizedUsername}</p>
          </div>
        ) : (
          <SecureForm
            onSubmit={handleSecureSubmit}
            rateLimitKey="tip_send"
            rateLimitConfig={{ maxAttempts: 20, windowMs: 60 * 60 * 1000 }}
          >
            <p className="mb-6 text-center text-sm text-gray-300">
              Choose a custom amount or tap a quick suggestion to send instant appreciation.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-white/80">Amount ($)</label>
                <div className="relative mt-2">
                  <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[#ff950e]">
                    <DollarSign className="h-4 w-4" />
                  </div>
                  <SecureInput
                    type="number"
                    value={tipAmount}
                    onChange={handleSecureAmountChange}
                    onBlur={() => setTouched(true)}
                    className="w-full rounded-2xl border border-white/15 bg-black/60 py-3 pl-9 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
                    placeholder="Enter amount"
                    min="0.01"
                    max="500"
                    step="0.01"
                    error={displayError}
                    touched={touched}
                    sanitize={false}
                    disabled={isProcessing}
                  />
                </div>

                <div className="mt-3 grid grid-cols-4 gap-2">
                  {[5, 10, 20, 50].map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => {
                        onAmountChange(amount.toString());
                        setTouched(true);
                      }}
                      disabled={isProcessing || userBalance < amount}
                      className={`rounded-xl border px-2 py-2 text-sm font-semibold transition ${
                        userBalance >= amount
                          ? 'border-[#ff950e]/30 bg-[#ff950e]/10 text-[#ff950e] hover:border-[#ff950e]/50'
                          : 'border-white/10 bg-white/5 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      ${amount}
                    </button>
                  ))}
                </div>
              </div>

              {user && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-gray-300">
                  <div className="flex items-center justify-between">
                    <span>Wallet balance</span>
                    <span className="text-white font-semibold">${userBalance.toFixed(2)}</span>
                  </div>
                  {tipAmount && parseFloat(tipAmount) > 0 && (
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span>After tip</span>
                      <span
                        className={`font-semibold ${
                          userBalance - parseFloat(tipAmount) >= 0 ? 'text-emerald-300' : 'text-red-300'
                        }`}
                      >
                        ${(userBalance - parseFloat(tipAmount)).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {displayError && (
                <div className="rounded-2xl border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-200">
                  {displayError}
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <button
                type="submit"
                disabled={disabled || userBalance < parseFloat(tipAmount || '0')}
                className={`inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition ${
                  !disabled && userBalance >= parseFloat(tipAmount || '0')
                    ? 'bg-gradient-to-r from-[#ff950e] to-[#fb923c] text-black hover:from-[#ffa733] hover:to-[#ffb347]'
                    : 'border border-white/10 bg-white/5 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isProcessing ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                    Sending...
                  </>
                ) : (
                  'Send Tip'
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="w-full rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/30 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </SecureForm>
        )}
      </div>
    </div>
  );
}
