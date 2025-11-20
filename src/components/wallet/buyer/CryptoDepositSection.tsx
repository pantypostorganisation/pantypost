// src/components/wallet/buyer/CryptoDepositSection.tsx
"use client";

import React, { useState } from "react";
import {
  Wallet,
  Bitcoin,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Copy,
  Info,
  Shield,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useWallet } from "@/context/WalletContext";

interface CryptoDepositSectionProps {
  minAmount?: number;
  maxAmount?: number;
}

interface DepositDetails {
  depositId: string;
  walletAddress: string;
  cryptoAmount: string;
  displayAmount: string;
  cryptoCurrency: string;
  usdAmount: number;
  networkFeeRange: string;
  estimatedNetworkFee: string;
  qrCode: string | null;
  expiresAt: Date;
  expiryMinutes: number;
  instructions: any;
  network: string;
  exchangeRate: number;
  uniqueCode?: number;
}

export default function CryptoDepositSection({
  minAmount = 10,
  maxAmount = 10000,
}: CryptoDepositSectionProps) {
  const { user } = useAuth();
  const { reloadData } = useWallet();
  
  const [amount, setAmount] = useState<string>("25");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [depositDetails, setDepositDetails] = useState<DepositDetails | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  // Quick amount buttons
  const quickAmounts = [25, 50, 100, 250, 500, 1000];

  // Countdown timer
  React.useEffect(() => {
    if (!depositDetails?.expiresAt) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const expiry = new Date(depositDetails.expiresAt).getTime();
      const remaining = Math.max(0, Math.floor((expiry - now) / 1000));
      
      setTimeRemaining(remaining);

      if (remaining === 0) {
        clearInterval(timer);
        setDepositDetails(null);
        setError('Deposit expired. Please create a new one.');
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [depositDetails]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Validate amount
  const validateAmount = (value: string): string | null => {
    const num = Number(value);
    if (isNaN(num) || num <= 0) {
      return "Please enter a valid amount";
    }
    if (num < minAmount) {
      return `Minimum deposit is $${minAmount}`;
    }
    if (num > maxAmount) {
      return `Maximum deposit is $${maxAmount.toLocaleString()}`;
    }
    return null;
  }

  // Copy to clipboard
  const copyToClipboard = async (text: string, type: 'address' | 'amount' = 'address') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'address') {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        setCopiedAmount(true);
        setTimeout(() => setCopiedAmount(false), 2000);
      }
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Create crypto deposit
  const startCryptoDeposit = async () => {
    setError(null);
    setDepositDetails(null);

    const validationError = validateAmount(amount);
    if (validationError) {
      setError(validationError);
      return;
    }

    const numericAmount = Number(amount);
    
    setLoading(true);
    try {
      const res = await fetch("/api/crypto/create-deposit", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          amount: numericAmount,
          currency: 'USDT_POLYGON' // Always use Polygon for lowest fees
        }),
      });

      const data = await res.json();

      if (data?.success && data?.data) {
        setDepositDetails(data.data);
        console.log('Deposit created with unique amount:', data.data.displayAmount);
      } else {
        setError(data?.error || "Unable to create deposit. Please try again.");
      }
      
    } catch (err: any) {
      console.error("[CryptoDepositSection] Error:", err);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  // Confirm payment sent
  const confirmPaymentSent = async () => {
    if (!depositDetails) return;

    setConfirming(true);
    setError(null);

    try {
      const res = await fetch("/api/crypto/confirm-deposit", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          depositId: depositDetails.depositId,
          txHash: '' // User can optionally provide this
        }),
      });

      const data = await res.json();

      if (data?.success) {
        alert('Payment confirmation received! Your deposit will be automatically verified within 2-5 minutes.');
        setDepositDetails(null);
        setAmount('');
        
        // Reload wallet data after a delay
        setTimeout(() => {
          reloadData();
        }, 5000);
      } else {
        setError(data?.error || "Failed to confirm payment.");
      }
      
    } catch (err: any) {
      console.error("[CryptoDepositSection] Confirm error:", err);
      setError("Failed to confirm payment. Please try again.");
    } finally {
      setConfirming(false);
    }
  };

  // If showing deposit details
  if (depositDetails) {
    return (
      <div className="rounded-2xl border border-gray-800 bg-[#111] p-6 sm:p-8 transition-all">
        {/* Header with Timer */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#ff950e]/40 bg-[#ff950e]/10">
              <Bitcoin className="h-6 w-6 text-[#ff950e]" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">
                Complete Your Deposit
              </h2>
              <p className="text-sm text-gray-400">
                Send USDT on Polygon Network
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Time Remaining</p>
            <p className={`text-lg font-mono font-semibold ${timeRemaining < 300 ? 'text-red-400' : 'text-white'}`}>
              {formatTime(timeRemaining)}
            </p>
          </div>
        </div>

        {/* CRITICAL: Exact Amount Box with Brand Color */}
        <div className="bg-[#ff950e]/10 border-2 border-[#ff950e] p-4 rounded-xl mb-6">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-[#ff950e] flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-bold text-[#ff950e] mb-2">
                SEND EXACTLY THIS AMOUNT - ALL DECIMALS MATTER!
              </p>
              <div className="bg-black/30 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-mono font-bold text-white">
                    {depositDetails.displayAmount} USDT
                  </p>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(depositDetails.displayAmount, 'amount')}
                    className="text-[#ff950e] hover:text-white transition-colors p-2"
                    title="Copy exact amount"
                  >
                    {copiedAmount ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Copy className="h-5 w-5" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  This exact amount (including all 4 decimals) uniquely identifies YOUR deposit
                </p>
              </div>
              <div className="mt-3 space-y-1">
                <p className="text-xs text-[#ff950e]/80">
                  • Sending even 0.0001 USDT more or less may cause issues
                </p>
                <p className="text-xs text-[#ff950e]/80">
                  • Copy the amount above to ensure accuracy
                </p>
                <p className="text-xs text-[#ff950e]/80">
                  • We accept deposits within 2.5% of the exact amount
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Wallet Address */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Send to this Polygon address:
          </label>
          <div className="flex items-center gap-2 bg-black/30 rounded-lg p-3">
            <input
              type="text"
              readOnly
              value={depositDetails.walletAddress}
              className="flex-1 bg-transparent text-sm font-mono text-white outline-none"
            />
            <button
              type="button"
              onClick={() => copyToClipboard(depositDetails.walletAddress)}
              className="text-gray-400 hover:text-white transition-colors flex-shrink-0 p-1"
              title="Copy address"
            >
              {copied ? (
                <CheckCircle2 className="h-4 w-4 text-green-400" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* QR Code if available */}
        {depositDetails.qrCode && (
          <div className="mb-6 flex justify-center">
            <div className="bg-white p-4 rounded-xl">
              <img
                src={depositDetails.qrCode}
                alt="Deposit QR Code"
                className="w-48 h-48"
              />
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-gray-800/30 rounded-xl p-4 mb-6">
          <h3 className="text-sm font-semibold text-white mb-3">
            {depositDetails.instructions?.title || 'Deposit Instructions'}
          </h3>
          <ol className="space-y-2">
            {depositDetails.instructions?.steps?.map((step: string, index: number) => (
              <li key={index} className="text-xs text-gray-300 flex">
                <span className="text-[#ff950e] mr-2">{index + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Network Info */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-black/30 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Network</p>
            <p className="text-sm text-white font-medium">
              Polygon (MATIC)
            </p>
          </div>
          <div className="bg-black/30 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Network Fee</p>
            <p className="text-sm text-white font-medium">
              ~$0.01-0.05
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-start gap-2 rounded-xl bg-red-500/10 border border-red-500/30 p-4 mb-6">
            <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-red-300">{error}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={confirmPaymentSent}
            disabled={confirming}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#ff950e] px-6 py-3.5 text-sm font-semibold text-black transition-all hover:bg-[#e0850d] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {confirming ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                I've Sent The Payment
              </>
            )}
          </button>
          <button
            onClick={() => {
              setDepositDetails(null);
              setError(null);
            }}
            className="px-6 py-3.5 rounded-xl border border-gray-700 text-sm font-medium text-gray-300 hover:bg-gray-800 transition-all"
          >
            Cancel
          </button>
        </div>

        {/* Warning */}
        <div className="mt-6 text-center">
          <p className="text-xs text-red-400">
            ⚠️ Only send USDT on Polygon Network! Wrong network = lost funds!
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Your deposit will be auto-verified within 2-5 minutes after blockchain confirmation
          </p>
        </div>
      </div>
    );
  }

  // Initial deposit form
  return (
    <div className="rounded-2xl border border-gray-800 bg-[#111] p-6 sm:p-8 transition-all">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#ff950e]/40 bg-[#ff950e]/10">
          <Bitcoin className="h-6 w-6 text-[#ff950e]" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white sm:text-2xl">
            Crypto Deposit
          </h2>
          <p className="text-sm text-gray-400">
            USDT on Polygon Network - Lowest Fees!
          </p>
        </div>
      </div>

      {/* Security Badge */}
      <div className="flex items-center gap-2 mb-6 p-3 rounded-xl bg-green-500/10 border border-green-500/30">
        <Shield className="h-4 w-4 text-green-400" />
        <span className="text-xs text-green-300">
          Secure blockchain deposits with automatic verification
        </span>
      </div>

      <div className="space-y-6">
        {/* Network Info */}
        <div className="p-4 rounded-xl bg-[#ff950e]/10 border border-[#ff950e]/30">
          <div className="flex items-center gap-2 mb-2">
            <Info className="h-4 w-4 text-[#ff950e]" />
            <span className="text-sm font-medium text-[#ff950e]">
              USDT on Polygon Network
            </span>
          </div>
          <p className="text-xs text-gray-400">
            • Network fees: $0.01-0.05 (cheapest option!)
          </p>
          <p className="text-xs text-gray-400">
            • Confirmation time: 30-60 seconds
          </p>
          <p className="text-xs text-gray-400">
            • Auto-verification within 2-5 minutes
          </p>
          <p className="text-xs text-gray-400">
            • Each deposit gets a unique amount for accurate tracking
          </p>
        </div>

        {/* Amount Input */}
        <div className="space-y-2">
          <label className="flex items-center justify-between text-sm font-medium text-gray-300">
            <span>Deposit Amount (USD)</span>
            <span className="text-xs text-gray-500">
              Min ${minAmount} • Max ${maxAmount.toLocaleString()}
            </span>
          </label>
          <div className="flex rounded-xl border border-gray-800 bg-[#0c0c0c] focus-within:border-[#ff950e]/50 focus-within:ring-2 focus-within:ring-[#ff950e]/10">
            <span className="flex items-center px-4 text-gray-400">$</span>
            <input
              type="number"
              min={minAmount}
              max={maxAmount}
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1 bg-transparent py-3 pr-4 text-white outline-none placeholder:text-gray-600"
              placeholder="0.00"
              disabled={loading}
            />
          </div>
        </div>

        {/* Quick Amount Buttons */}
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {quickAmounts.map((quickAmount) => (
            <button
              key={quickAmount}
              type="button"
              onClick={() => setAmount(quickAmount.toString())}
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                amount === quickAmount.toString()
                  ? "border-[#ff950e] bg-[#ff950e]/10 text-[#ff950e]"
                  : "border-gray-800 bg-[#0c0c0c] text-gray-400 hover:border-gray-700"
              }`}
              disabled={loading}
            >
              ${quickAmount}
            </button>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-start gap-2 rounded-xl bg-red-500/10 border border-red-500/30 p-4">
            <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-red-300">{error}</p>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={startCryptoDeposit}
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#ff950e] px-6 py-3.5 text-sm font-semibold text-black transition-all hover:bg-[#e0850d] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating deposit...
            </>
          ) : (
            <>
              <Wallet className="h-4 w-4" />
              Generate Deposit Address
            </>
          )}
        </button>

        {/* Info Text */}
        <div className="text-center text-xs text-gray-500">
          <p>Secure blockchain payment processing</p>
          <p className="mt-1">
            Each deposit receives a unique amount for accurate tracking
          </p>
          <p className="mt-2 text-[#ff950e]">
            Polygon Network • Ultra-low fees • Fast confirmations
          </p>
        </div>
      </div>
    </div>
  );
}
