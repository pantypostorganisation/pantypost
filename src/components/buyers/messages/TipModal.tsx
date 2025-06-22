// src/components/buyers/messages/TipModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { X, Heart, DollarSign, AlertCircle } from 'lucide-react';

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
  onSendTip
}: TipModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  
  if (!show) return null;

  const userBalance = wallet[user?.username] || 0;
  const tipValue = parseFloat(tipAmount) || 0;
  const canAfford = tipValue > 0 && userBalance >= tipValue;

  const quickAmounts = [5, 10, 20, 50];

  const handleSendTip = async () => {
    if (!canAfford || isProcessing) return;
    
    console.log('TipModal: Sending tip...');
    setIsProcessing(true);
    try {
      await onSendTip();
    } finally {
      setIsProcessing(false);
    }
  };

  // Clear result when modal closes
  useEffect(() => {
    if (!show && tipResult?.success) {
      setTipAmount('');
    }
  }, [show, tipResult, setTipAmount]);

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
        <div className="p-6 space-y-4">
          {/* Seller info */}
          <div className="text-center">
            <p className="text-gray-400">Sending tip to</p>
            <p className="text-xl font-semibold text-white">{activeThread}</p>
          </div>
          
          {/* Tip amount input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tip Amount
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="number"
                value={tipAmount}
                onChange={(e) => setTipAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                disabled={isProcessing}
                className="w-full bg-[#222] text-white rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#ff950e] disabled:opacity-50"
              />
            </div>
            
            {/* Quick amounts */}
            <div className="flex gap-2 mt-3">
              {quickAmounts.map((amount) => (
                <button
                  key={amount}
                  onClick={() => setTipAmount(amount.toString())}
                  disabled={isProcessing}
                  className="flex-1 px-3 py-1.5 bg-[#222] text-white rounded-lg hover:bg-[#333] transition-colors text-sm disabled:opacity-50"
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
          {tipResult && (
            <div className={`rounded-lg p-3 text-sm ${
              tipResult.success 
                ? 'bg-green-500/10 border border-green-500/30 text-green-400' 
                : 'bg-red-500/10 border border-red-500/30 text-red-400'
            }`}>
              <div className="flex items-center gap-2">
                {tipResult.success ? (
                  <Heart className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                <p>{tipResult.message}</p>
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
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSendTip}
            disabled={!canAfford || isProcessing}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
              canAfford && !isProcessing
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
                <span>{canAfford ? `Send ${tipValue.toFixed(2)}` : 'Enter Amount'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
