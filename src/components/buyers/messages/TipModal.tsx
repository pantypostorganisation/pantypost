// src/components/buyers/messages/TipModal.tsx
'use client';

import React, { useState, useEffect, useContext } from 'react';
import { X, Heart, DollarSign, AlertCircle } from 'lucide-react';
import { SecureInput } from '@/components/ui/SecureInput';
import { SecureForm } from '@/components/ui/SecureForm';
import { sanitizeStrict } from '@/utils/security/sanitization';
import { RATE_LIMITS } from '@/utils/security/rate-limiter';
import { WalletContext } from '@/context/WalletContext';
import { tipService } from '@/services/tip.service';
import { useAuth } from '@/context/AuthContext';

interface TipModalProps {
  show: boolean;
  onClose: () => void;
  activeThread: string;
  tipAmount: string;
  setTipAmount: (amount: string) => void;
  tipResult: { success: boolean; message: string } | null;
  wallet: { [username: string]: number };
  user: any;
  onSendTip: () => void;
}

export default function TipModal({
  show,
  onClose,
  activeThread,
  tipAmount,
  setTipAmount,
  tipResult,
  wallet,
  user,
  onSendTip: parentCallback // Renamed to clarify it's just a callback, not the sender
}: TipModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [localTipResult, setLocalTipResult] = useState<{ success: boolean; message: string } | null>(null);
  
  // Get wallet context for balance and tip sending
  const walletContext = useContext(WalletContext);
  const { user: authUser } = useAuth();
  
  if (!show) return null;

  // Get current user balance from wallet context
  const userBalance = walletContext ? walletContext.getBuyerBalance(user?.username || '') : (wallet[user?.username] || 0);
  const tipValue = parseFloat(tipAmount) || 0;
  const canAfford = tipValue > 0 && userBalance >= tipValue;

  const quickAmounts = [5, 10, 20, 50];

  // Currency sanitizer that returns string
  const currencySanitizer = (value: string): string => {
    // Remove any non-numeric characters except decimal point
    const cleaned = value.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Limit to 2 decimal places
    if (parts.length === 2 && parts[1].length > 2) {
      return parts[0] + '.' + parts[1].slice(0, 2);
    }
    
    // Limit maximum tip amount to 500
    const numValue = parseFloat(cleaned);
    if (!isNaN(numValue) && numValue > 500) {
      return '500';
    }
    
    return cleaned;
  };

  const handleSendTip = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double submission
    if (!canAfford || isProcessing) return;
    
    console.log('TipModal: Sending tip...');
    setIsProcessing(true);
    setLocalTipResult(null);
    
    try {
      // Validate amount
      const amount = parseFloat(tipAmount);
      if (isNaN(amount) || amount <= 0 || amount > 500) {
        setLocalTipResult({
          success: false,
          message: 'Invalid tip amount. Must be between $1 and $500.'
        });
        setIsProcessing(false);
        return;
      }

      // Use the tip service to send the tip (only once!)
      const result = await tipService.sendTip(activeThread, amount);
      
      if (result.success) {
        // Update wallet context if available
        if (walletContext && walletContext.reloadData) {
          // Reload wallet data to reflect the new balance
          await walletContext.reloadData();
        }
        
        setLocalTipResult({
          success: true,
          message: result.message || `Successfully sent $${amount.toFixed(2)} tip!`
        });
        
        // Clear amount after successful tip
        setTimeout(() => {
          setTipAmount('');
          onClose();
        }, 2000);
        
        // Call parent callback to handle any UI updates (but NOT to send another tip!)
        if (parentCallback) {
          parentCallback();
        }
      } else {
        setLocalTipResult({
          success: false,
          message: result.message || 'Failed to send tip'
        });
      }
    } catch (error) {
      console.error('TipModal: Error sending tip:', error);
      setLocalTipResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to send tip. Please try again.'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Clear result when modal closes
  useEffect(() => {
    if (!show) {
      setLocalTipResult(null);
      if (tipResult?.success) {
        setTipAmount('');
      }
    }
  }, [show, tipResult, setTipAmount]);

  // Use local result if available, otherwise use parent result
  const displayResult = localTipResult || tipResult;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] rounded-xl w-full max-w-md border border-gray-800 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-500" />
            Send a Tip
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#222] rounded-lg transition-colors"
            disabled={isProcessing}
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        {/* Content */}
        <SecureForm
          onSubmit={handleSendTip}
          className="relative"
          rateLimitKey={`tip_${activeThread}`}
          rateLimitConfig={RATE_LIMITS.TIP}
        >
          <div className="p-6 space-y-4">
            {/* Seller info */}
            <div className="text-center">
              <p className="text-gray-400">Sending tip to</p>
              <p className="text-xl font-semibold text-white">{sanitizeStrict(activeThread)}</p>
            </div>
            
            {/* Tip amount input - SECURED */}
            <div>
              <div className="relative">
                <SecureInput
                  label="Tip Amount"
                  type="text"
                  value={tipAmount}
                  onChange={setTipAmount}
                  placeholder="0.00"
                  disabled={isProcessing}
                  className="w-full pl-9 !bg-[#222] !text-white !border-0 focus:!ring-2 focus:!ring-[#ff950e]"
                  sanitizer={currencySanitizer}
                  maxLength={6}
                  error={tipValue > 500 ? 'Maximum tip amount is $500' : tipValue > 0 && tipValue < 1 ? 'Minimum tip amount is $1' : undefined}
                  touched={tipAmount.length > 0}
                />
                <DollarSign className="absolute left-3 top-[38px] w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              
              {/* Quick amounts */}
              <div className="flex gap-2 mt-3">
                {quickAmounts.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setTipAmount(amount.toString())}
                    disabled={isProcessing || userBalance < amount}
                    className={`flex-1 px-3 py-1.5 rounded-lg transition-colors text-sm ${
                      userBalance >= amount 
                        ? 'bg-[#222] text-white hover:bg-[#333]'
                        : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    ${amount}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Balance info */}
            <div className="bg-[#222] rounded-lg p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Your Balance:</span>
                <span className="text-white font-medium">${userBalance.toFixed(2)}</span>
              </div>
              {tipValue > 0 && (
                <div className="flex justify-between mt-1">
                  <span className="text-gray-400">After Tip:</span>
                  <span className={`font-medium ${userBalance - tipValue >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ${(userBalance - tipValue).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
            
            {/* Result message */}
            {displayResult && (
              <div className={`rounded-lg p-3 text-sm ${
                displayResult.success 
                  ? 'bg-green-500/10 border border-green-500/30 text-green-400' 
                  : 'bg-red-500/10 border border-red-500/30 text-red-400'
              }`}>
                <div className="flex items-center gap-2">
                  {displayResult.success ? (
                    <Heart className="w-4 h-4" />
                  ) : (
                    <AlertCircle className="w-4 h-4" />
                  )}
                  <p>{sanitizeStrict(displayResult.message)}</p>
                </div>
              </div>
            )}
            
            {/* Info */}
            <div className="bg-pink-500/10 border border-pink-500/30 rounded-lg p-3 text-xs text-pink-400">
              <p className="font-medium mb-1">About Tips:</p>
              <ul className="space-y-0.5">
                <li>• Tips go directly to the seller</li>
                <li>• No platform fees on tips</li>
                <li>• Show appreciation for great service!</li>
              </ul>
            </div>
          </div>
          
          {/* Footer */}
          <div className="flex gap-3 p-6 border-t border-gray-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canAfford || isProcessing || tipValue > 500 || tipValue < 1}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                canAfford && !isProcessing && tipValue <= 500 && tipValue >= 1
                  ? 'bg-pink-500 text-white hover:bg-pink-600'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Heart size={16} />
                  <span>{canAfford && tipValue <= 500 && tipValue >= 1 ? `Send $${tipValue.toFixed(2)}` : 'Enter Amount'}</span>
                </>
              )}
            </button>
          </div>
        </SecureForm>
      </div>
    </div>
  );
}