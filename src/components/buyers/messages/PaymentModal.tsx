// src/components/buyers/messages/PaymentModal.tsx
'use client';

import React, { useContext, useMemo, useRef } from 'react';
import { X, DollarSign, AlertCircle, Check } from 'lucide-react';
import { WalletContext } from '@/context/WalletContext';
import { SecureMessageDisplay } from '@/components/ui/SecureMessageDisplay';
import { sanitizeStrict } from '@/utils/security/sanitization';

interface PayingRequest {
  title: string;
  description: string;
  seller: string;
  price: number;
  // (optional) id, etc.
}

interface PaymentModalProps {
  show: boolean;
  onClose: () => void;
  payingRequest: PayingRequest | null;
  wallet: { [username: string]: number };
  user: { username: string } | null;
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
  const walletContext = useContext(WalletContext);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const hasReloadedRef = useRef(false);

  React.useEffect(() => {
    if (show && walletContext && walletContext.reloadData && !hasReloadedRef.current && !walletContext.isLoading) {
      hasReloadedRef.current = true;
      walletContext.reloadData().catch((error: unknown) => {
        console.error('PaymentModal: Error reloading wallet data:', error);
      });
    }
    if (!show) {
      hasReloadedRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  if (!show || !payingRequest) return null;

  // Ensure numeric math even if upstream passes strings
  const basePrice = Number(payingRequest.price) || 0;
  const markupPrice = Math.round(basePrice * 1.1 * 100) / 100;
  const platformFee = Math.round((markupPrice - basePrice) * 100) / 100;

  const isWalletLoading = walletContext?.isLoading || false;

  const userBalance = useMemo(() => {
    if (!user) return 0;
    if (isWalletLoading) return 0;

    if (walletContext?.getBuyerBalance) {
      const contextBalance = Number(walletContext.getBuyerBalance(user.username));
      if (!Number.isNaN(contextBalance) && contextBalance >= 0) return contextBalance;
    }

    const propBalance = Number(wallet[user.username] || 0);
    if (!Number.isNaN(propBalance) && propBalance >= 0) return propBalance;

    try {
      const walletBuyers = localStorage.getItem('wallet_buyers');
      if (walletBuyers) {
        const buyers = JSON.parse(walletBuyers) as Record<string, number>;
        const localBalance = Number(buyers[user.username] || 0);
        return Number.isNaN(localBalance) ? 0 : localBalance;
      }
      const individualKey = localStorage.getItem(`wallet_buyer_${user.username}`);
      if (individualKey) {
        const balanceInCents = parseInt(individualKey, 10);
        return Number.isNaN(balanceInCents) ? 0 : balanceInCents / 100;
      }
    } catch {
      // ignore localStorage parse errors
    }

    return 0;
  }, [user, walletContext, wallet, isWalletLoading]);

  const canAfford = userBalance >= markupPrice;

  const handleConfirm = async () => {
    if (isProcessing || !canAfford) return;
    setIsProcessing(true);
    try {
      await onConfirmPay();
    } finally {
      // parent decides when to close; keep processing state until then
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
          {/* Request Details (sanitized) */}
          <div className="bg-[#222] rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-white">
              <SecureMessageDisplay content={payingRequest.title} allowBasicFormatting={false} />
            </h3>
            <p className="text-sm text-gray-400">
              <SecureMessageDisplay content={payingRequest.description} allowBasicFormatting={false} />
            </p>
            <p className="text-sm text-gray-500">
              Seller: <span className="text-gray-300">{sanitizeStrict(payingRequest.seller)}</span>
            </p>
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

          {/* Balance Info */}
          {isWalletLoading ? (
            <div className="rounded-lg p-3 bg-gray-500/10 border border-gray-500/30">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-400 text-sm">Loading wallet balance...</p>
              </div>
            </div>
          ) : (
            <div
              className={`rounded-lg p-3 ${
                canAfford ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'
              }`}
            >
              <div className="flex items-center gap-2">
                {canAfford ? (
                  <>
                    <Check className="w-4 h-4 text-green-400" />
                    <div className="text-sm">
                      <p className="text-green-400 font-medium">Sufficient Balance</p>
                      <p className="text-gray-400">
                        Current: ${userBalance.toFixed(2)} | After: ${(userBalance - markupPrice).toFixed(2)}
                      </p>
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

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-xs text-blue-400">
            <p className="font-medium mb-1">Payment Info:</p>
            <ul className="space-y-0.5">
              <li>• The seller will be notified immediately</li>
              <li>• Your order will appear in &quot;My Orders&quot;</li>
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
