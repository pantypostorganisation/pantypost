// src/components/buyers/messages/PaymentModal.tsx
'use client';

import React, { useContext, useMemo, useRef } from 'react';
import { X, DollarSign, AlertCircle, Check } from 'lucide-react';
import { WalletContext } from '@/context/WalletContext';

interface PaymentModalProps {
  show: boolean;
  onClose: () => void;
  payingRequest: any;
  wallet: { [username: string]: number };
  user: any;
  onConfirmPay: () => Promise<void> | void;
}

export default function PaymentModal({
  show,
  onClose,
  payingRequest,
  wallet,
  user,
  onConfirmPay
}: PaymentModalProps) {
  // Get fresh wallet balance directly from context
  const walletContext = useContext(WalletContext);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  
  // Use a ref to track if we've already reloaded for this modal open
  const hasReloadedRef = useRef(false);
  
  // Force reload wallet when modal opens - FIXED to prevent infinite loops
  React.useEffect(() => {
    if (show && walletContext && walletContext.reloadData && !hasReloadedRef.current && !walletContext.isLoading) {
      console.log('PaymentModal: Reloading wallet data...');
      hasReloadedRef.current = true;
      walletContext.reloadData().catch(error => {
        console.error('PaymentModal: Error reloading wallet data:', error);
      });
    }
    
    // Reset the ref when modal closes
    if (!show) {
      hasReloadedRef.current = false;
      setErrorMsg(null);
      setIsProcessing(false);
    }
  }, [show]); // intentionally omit walletContext to avoid loops
  
  if (!show || !payingRequest) return null;

  const basePrice = payingRequest.price || 0;
  const markupPrice = Math.round(basePrice * 1.1 * 100) / 100;
  const platformFee = Math.round((markupPrice - basePrice) * 100) / 100;
  
  // Check if wallet is still loading
  const isWalletLoading = walletContext?.isLoading || false;
  
  // FIXED: Get fresh balance with multiple fallbacks
  const userBalance = useMemo(() => {
    if (!user) {
      console.log('PaymentModal: No user');
      return 0;
    }
    
    // Don't calculate if still loading
    if (isWalletLoading) {
      console.log('PaymentModal: Wallet still loading');
      return 0;
    }
    
    // Try to get from wallet context first
    if (walletContext && walletContext.getBuyerBalance) {
      const contextBalance = walletContext.getBuyerBalance(user.username);
      console.log('PaymentModal: Got balance from context', contextBalance);
      if (contextBalance >= 0) return contextBalance; // allow zero balance
    }
    
    // Fallback to wallet prop
    const propBalance = wallet[user.username] || 0;
    console.log('PaymentModal: Wallet prop balance', propBalance);
    if (propBalance >= 0) return propBalance; // allow zero balance
    
    // Last resort: try to get from localStorage
    try {
      const walletBuyers = localStorage.getItem('wallet_buyers');
      if (walletBuyers) {
        const buyers = JSON.parse(walletBuyers);
        const localBalance = buyers[user.username] || 0;
        console.log('PaymentModal: LocalStorage balance', localBalance);
        return localBalance;
      }
      
      // Also check individual key
      const individualKey = localStorage.getItem(`wallet_buyer_${user.username}`);
      if (individualKey) {
        const balanceInCents = parseInt(individualKey);
        const balanceInDollars = balanceInCents / 100;
        console.log('PaymentModal: Individual key balance', balanceInDollars);
        return balanceInDollars;
      }
    } catch (error) {
      console.error('PaymentModal: Error reading localStorage', error);
    }
    
    return 0;
  }, [user, walletContext, wallet, isWalletLoading]);
  
  const canAfford = userBalance >= markupPrice;

  const handleConfirm = async () => {
    if (isProcessing || !canAfford) return;
    
    setErrorMsg(null);
    setIsProcessing(true);
    try {
      await onConfirmPay();
      // parent is expected to close modal; if it doesn't, keep processing true is OK
      // but we could also reset here if desired:
      // setIsProcessing(false);
    } catch (err) {
      console.error('PaymentModal: onConfirmPay failed:', err);
      setErrorMsg('Payment failed. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] rounded-xl w-full max-w-md border border-gray-800 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-[#ff950e]" />
            Confirm Payment
          </h2>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-2 hover:bg-[#222] rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Request Details */}
          <div className="bg-[#222] rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-white">{payingRequest.title}</h3>
            <p className="text-sm text-gray-400">{payingRequest.description}</p>
            <p className="text-sm text-gray-500">Seller: {payingRequest.seller}</p>
          </div>
          
          {/* Price Breakdown */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Item Price:</span>
              <span className="text-white">${basePrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Platform Fee (10%):</span>
              <span className="text-white">${platformFee.toFixed(2)}</span>
            </div>
            <div className="border-t border-gray-700 pt-2 flex justify-between font-semibold">
              <span className="text-white">Total:</span>
              <span className="text-[#ff950e]">${markupPrice.toFixed(2)}</span>
            </div>
          </div>

          {/* Error message */}
          {errorMsg && (
            <div className="rounded-lg p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <p>{errorMsg}</p>
              </div>
            </div>
          )}
          
          {/* Balance Info */}
          {isWalletLoading ? (
            <div className="rounded-lg p-3 bg-gray-500/10 border border-gray-500/30">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-400 text-sm">Loading wallet balance...</p>
              </div>
            </div>
          ) : (
            <div className={`rounded-lg p-3 ${canAfford ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
              <div className="flex items-center gap-2">
                {canAfford ? (
                  <>
                    <Check className="w-4 h-4 text-green-400" />
                    <div className="text-sm">
                      <p className="text-green-400 font-medium">Sufficient Balance</p>
                      <p className="text-gray-400">Current: ${userBalance.toFixed(2)} | After: ${(userBalance - markupPrice).toFixed(2)}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    <div className="text-sm">
                      <p className="text-red-400 font-medium">Insufficient Balance</p>
                      <p className="text-gray-400">
                        Current: ${userBalance.toFixed(2)} | Need ${(markupPrice - userBalance).toFixed(2)} more
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
          
          {/* Info */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-xs text-blue-400">
            <p className="font-medium mb-1">Payment Info:</p>
            <ul className="space-y-0.5">
              <li>• The seller will be notified immediately</li>
              <li>• Your order will appear in "My Orders"</li>
              <li>• The seller has 7 days to fulfill the order</li>
            </ul>
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-800">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canAfford || isWalletLoading || isProcessing}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
              canAfford && !isWalletLoading && !isProcessing
                ? 'bg-[#ff950e] text-black hover:bg-[#e88800]'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>Processing...</span>
              </>
            ) : isWalletLoading ? (
              'Loading...'
            ) : canAfford ? (
              `Pay $${markupPrice.toFixed(2)}`
            ) : (
              'Insufficient Funds'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
