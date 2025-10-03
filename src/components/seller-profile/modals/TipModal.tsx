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
  const userBalance = user && walletContext ? walletContext.getBuyerBalance(user.username) : 0;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-black via-[#15070a] to-black p-px shadow-[0_30px_90px_rgba(0,0,0,0.65)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,149,14,0.25),_transparent_70%)]" aria-hidden="true" />
        <div className="relative rounded-[26px] bg-black/85 p-8">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h2 className="flex items-center gap-2 text-2xl font-semibold text-white">
                <Gift className="h-6 w-6 text-[#ff950e]" />
                Send a tip
              </h2>
              <p className="mt-2 text-sm text-gray-400">
                Surprise <span className="text-[#ff950e]">{sanitizedUsername}</span> with a little extra love.
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-full border border-white/10 bg-white/5 p-1 text-gray-400 transition hover:text-white"
              aria-label="Close"
              type="button"
              disabled={isProcessing}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {displaySuccess ? (
            <div className="mt-6 rounded-2xl border border-green-500/40 bg-green-500/10 p-8 text-center text-green-200">
              <div className="text-4xl">✓</div>
              <p className="mt-3 text-lg font-semibold text-green-100">Tip sent successfully!</p>
              <p className="mt-1 text-sm text-green-100/70">{sanitizedUsername} just felt your appreciation.</p>
            </div>
          ) : (
            <SecureForm
              onSubmit={handleSecureSubmit}
              rateLimitKey="tip_send"
              rateLimitConfig={{ maxAttempts: 20, windowMs: 60 * 60 * 1000 }}
            >
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-300">Amount ($)</label>
                <div className="relative mt-2">
                  <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[#ff950e]">
                    <DollarSign className="h-5 w-5" />
                  </div>
                  <SecureInput
                    type="number"
                    value={tipAmount}
                    onChange={handleSecureAmountChange}
                    onBlur={() => setTouched(true)}
                    className="w-full rounded-xl border border-white/10 bg-black/60 pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
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
                  {[5, 10, 20, 50].map((amount) => {
                    const canUse = userBalance >= amount && !isProcessing;
                    return (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => {
                          onAmountChange(amount.toString());
                          setTouched(true);
                        }}
                        disabled={!canUse}
                        className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                          canUse
                            ? 'border border-[#ff950e]/30 bg-[#ff950e]/10 text-[#ff950e] hover:bg-[#ff950e]/20'
                            : 'border border-white/5 bg-white/5 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        ${amount}
                      </button>
                    );
                  })}
                </div>
              </div>

              {user && (
                <div className="mt-5 rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-gray-300">
                  <div className="flex justify-between">
                    <span>Wallet balance</span>
                    <span className="font-semibold text-white">${userBalance.toFixed(2)}</span>
                  </div>
                  {tipAmount && parseFloat(tipAmount) > 0 && (
                    <div className="mt-2 flex justify-between">
                      <span>After tip</span>
                      <span
                        className={`${
                          userBalance - parseFloat(tipAmount) >= 0 ? 'text-green-300' : 'text-red-300'
                        } font-semibold`}
                      >
                        ${(userBalance - parseFloat(tipAmount)).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-8 flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={disabled || userBalance < parseFloat(tipAmount || '0')}
                  className={`inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-base font-semibold transition ${
                    !disabled && userBalance >= parseFloat(tipAmount || '0')
                      ? 'bg-[#ff950e] text-black shadow-lg shadow-[#ff950e33] hover:bg-[#e0850d]'
                      : 'bg-white/10 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    'Send tip'
                  )}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isProcessing}
                  className="w-full rounded-full border border-white/10 bg-white/5 px-6 py-3 text-base font-semibold text-gray-200 transition hover:bg-white/10 disabled:opacity-60"
                >
                  Cancel
                </button>
              </div>
            </SecureForm>
          )}
        </div>
      </div>
    </div>
  );
}
