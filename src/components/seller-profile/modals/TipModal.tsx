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
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4">
      <div className="bg-[#1a1a1a] p-6 sm:p-8 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[#ff950e] flex items-center gap-2">
            <Gift className="w-6 h-6" />
            Send Tip
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
            aria-label="Close"
            type="button"
            disabled={isProcessing}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {displaySuccess ? (
          <div className="text-center py-8">
            <div className="text-green-500 text-5xl mb-4">✓</div>
            <p className="text-xl text-white">Tip sent successfully!</p>
            <p className="text-gray-400 mt-2">Thank you for supporting {sanitizedUsername}</p>
          </div>
        ) : (
          <SecureForm
            onSubmit={handleSecureSubmit}
            rateLimitKey="tip_send"
            rateLimitConfig={{ maxAttempts: 20, windowMs: 60 * 60 * 1000 }}
          >
            <p className="mb-6 text-center text-white">
              Show your appreciation for <strong className="text-[#ff950e]">{sanitizedUsername}</strong>
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-gray-300">
                Amount ($)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none z-10">
                  <DollarSign className="w-5 h-5 text-gray-400" />
                </div>
                <SecureInput
                  type="number"
                  value={tipAmount}
                  onChange={handleSecureAmountChange}
                  onBlur={() => setTouched(true)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-black text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
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
              
              {/* Quick amount buttons */}
              <div className="flex gap-2 mt-3">
                {[5, 10, 20, 50].map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => {
                      onAmountChange(amount.toString());
                      setTouched(true);
                    }}
                    disabled={isProcessing || userBalance < amount}
                    className={`flex-1 px-3 py-1.5 rounded-lg transition-colors text-sm ${
                      userBalance >= amount 
                        ? 'bg-gray-800 text-white hover:bg-gray-700'
                        : 'bg-gray-900 text-gray-600 cursor-not-allowed'
                    }`}
                  >
                    ${amount}
                  </button>
                ))}
              </div>
            </div>

            {/* Balance info */}
            {user && (
              <div className="mb-4 p-3 bg-gray-900 rounded-lg text-sm">
                <div className="flex justify-between mb-1">
                  <span className="text-gray-400">Your Balance:</span>
                  <span className="text-white font-medium">${userBalance.toFixed(2)}</span>
                </div>
                {tipAmount && parseFloat(tipAmount) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">After Tip:</span>
                    <span className={`font-medium ${
                      userBalance - parseFloat(tipAmount) >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      ${(userBalance - parseFloat(tipAmount)).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button
                type="submit"
                disabled={disabled || userBalance < parseFloat(tipAmount || '0')}
                className={`w-full font-bold py-3 rounded-full transition flex items-center justify-center gap-2 ${
                  !disabled && userBalance >= parseFloat(tipAmount || '0')
                    ? 'bg-[#ff950e] text-black hover:bg-[#e0850d]'
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  'Send Tip'
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="w-full bg-gray-700 text-white font-medium py-3 rounded-full hover:bg-gray-600 transition disabled:opacity-50"
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
