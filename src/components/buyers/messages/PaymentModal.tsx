// src/components/buyers/messages/PaymentModal.tsx
'use client';

import React from 'react';
import { X, DollarSign, AlertCircle, Check } from 'lucide-react';

interface PaymentModalProps {
  show: boolean;
  onClose: () => void;
  payingRequest: any;
  wallet: { [username: string]: number };
  user: any;
  onConfirmPay: () => void;
}

export default function PaymentModal({
  show,
  onClose,
  payingRequest,
  wallet,
  user,
  onConfirmPay
}: PaymentModalProps) {
  if (!show || !payingRequest) return null;

  const basePrice = payingRequest.price || 0;
  const markupPrice = Math.round(basePrice * 1.1 * 100) / 100;
  const platformFee = Math.round((markupPrice - basePrice) * 100) / 100;
  const userBalance = wallet[user?.username] || 0;
  const canAfford = userBalance >= markupPrice;

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
            className="p-2 hover:bg-[#222] rounded-lg transition-colors"
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
          
          {/* Balance Info */}
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
                    <p className="text-gray-400">Need ${(markupPrice - userBalance).toFixed(2)} more</p>
                  </div>
                </>
              )}
            </div>
          </div>
          
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
            className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirmPay}
            disabled={!canAfford}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              canAfford
                ? 'bg-[#ff950e] text-black hover:bg-[#e88800]'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            {canAfford ? `Pay $${markupPrice.toFixed(2)}` : 'Insufficient Funds'}
          </button>
        </div>
      </div>
    </div>
  );
}
