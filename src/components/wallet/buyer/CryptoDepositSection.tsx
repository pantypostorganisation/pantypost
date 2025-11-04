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

interface ManualPaymentInfo {
  payment_id: string;
  pay_address: string;
  pay_amount: number;
  pay_currency: string;
  instructions: string;
}

export default function CryptoDepositSection({
  minAmount = 10,
  maxAmount = 10000,
}: CryptoDepositSectionProps) {
  const { user } = useAuth();
  const { reloadData } = useWallet();
  
  const [amount, setAmount] = useState<string>("25");
  const [loading, setLoading] = useState(false);
  const [successUrl, setSuccessUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manualPayment, setManualPayment] = useState<ManualPaymentInfo | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);

  // Quick amount buttons
  const quickAmounts = [25, 50, 100, 250, 500, 1000];

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

  // Copy address to clipboard
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

  // Start crypto deposit
  const startCryptoDeposit = async () => {
    setError(null);
    setSuccessUrl(null);
    setManualPayment(null);

    const validationError = validateAmount(amount);
    if (validationError) {
      setError(validationError);
      return;
    }

    const numericAmount = Number(amount);
    
    setLoading(true);
    try {
      // Generate order ID with username
      const orderId = user?.username 
        ? `pp-deposit-${user.username}-${Date.now()}`
        : `pp-deposit-guest-${Date.now()}`;

      // Call the API (backend now forces USDT only)
      const res = await fetch("/api/crypto/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: numericAmount,
          order_id: orderId,
          description: `Wallet deposit for ${user?.username || 'user'}`,
        }),
      });

      const data = await res.json().catch(() => ({} as any));

      // Handle different response scenarios
      if (data?.success && data?.data?.payment_url) {
        // Success - got hosted checkout URL
        setSuccessUrl(data.data.payment_url);
        
        // Open in new tab
        if (typeof window !== "undefined") {
          window.open(data.data.payment_url, "_blank", "noopener,noreferrer");
        }
        
        // Reload wallet data after a delay (webhook might process payment)
        setTimeout(() => {
          reloadData();
        }, 5000);
        
      } else if (data?.success && data?.data?.type === "manual_payment") {
        // Manual payment required
        setManualPayment(data.data);
        setError(null);
        
      } else {
        // Error occurred
        setError(
          data?.error || "Unable to create payment. Please try again."
        );
      }
      
    } catch (err: any) {
      console.error("[CryptoDepositSection] Error:", err);
      setError(
        "Network error. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-800 bg-[#111] p-6 sm:p-8 transition-all">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#ff950e]/40 bg-[#ff950e]/10">
          <Bitcoin className="h-6 w-6 text-[#ff950e]" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white sm:text-2xl">
            USDT Deposit
          </h2>
          <p className="text-sm text-gray-400">
            Secure payment via NOWPayments - USDT (TRC-20) Only
          </p>
        </div>
      </div>

      {/* Security Badge */}
      <div className="flex items-center gap-2 mb-6 p-3 rounded-xl bg-green-500/10 border border-green-500/30">
        <Shield className="h-4 w-4 text-green-400" />
        <span className="text-xs text-green-300">
          Secure & encrypted USDT payment processing
        </span>
      </div>

      <div className="space-y-6">
        {/* Payment Method Info */}
        <div className="p-4 rounded-xl bg-[#ff950e]/10 border border-[#ff950e]/30">
          <div className="flex items-center gap-2 mb-2">
            <Info className="h-4 w-4 text-[#ff950e]" />
            <span className="text-sm font-medium text-[#ff950e]">
              USDT (TRC-20) Network Only
            </span>
          </div>
          <p className="text-xs text-gray-400">
            We only accept USDT on the TRC-20 network for fast, low-fee transactions.
            Your USD deposit will be converted to USDT automatically.
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

        {/* Success Message */}
        {successUrl && (
          <div className="flex items-start gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <p className="text-sm font-medium text-emerald-300">
                Payment page opened successfully!
              </p>
              <p className="text-xs text-emerald-300/80">
                Complete your USDT payment in the new tab. Your balance will update automatically.
              </p>
              <a
                href={successUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 underline underline-offset-2"
              >
                Open payment page again
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        )}

        {/* Manual Payment Instructions */}
        {manualPayment && (
          <div className="rounded-xl border border-[#ff950e]/30 bg-[#ff950e]/5 p-4 space-y-4">
            <div className="flex items-start gap-2">
              <Info className="h-5 w-5 text-[#ff950e] mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-[#ff950e]">
                  Manual USDT Transfer Required
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Send the exact USDT amount (TRC-20) to the address below
                </p>
              </div>
            </div>

            {/* IMPORTANT: Exact Amount Warning */}
            <div className="bg-yellow-500/10 border border-yellow-500/30 p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-yellow-400 font-medium">
                    Send EXACTLY {manualPayment.pay_amount} USDT
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    • Include network fees in your wallet balance
                  </p>
                  <p className="text-xs text-gray-400">
                    • Sending less may cause payment to fail
                  </p>
                  <p className="text-xs text-gray-400">
                    • We accept payments within 0.1% of the required amount
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="rounded-lg bg-black/30 p-3">
                <p className="text-xs text-gray-500 mb-1">Amount to Send (Click to Copy)</p>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-mono text-white font-medium">
                    {manualPayment.pay_amount} USDT
                  </p>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(manualPayment.pay_amount.toString(), 'amount')}
                    className="text-gray-400 hover:text-white transition-colors"
                    title="Copy amount"
                  >
                    {copiedAmount ? (
                      <CheckCircle2 className="h-4 w-4 text-green-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              
              <div className="rounded-lg bg-black/30 p-3">
                <p className="text-xs text-gray-500 mb-1">TRC-20 Address (Click to Copy)</p>
                <div className="flex items-center gap-2">
                  <p className="flex-1 text-xs font-mono text-white break-all">
                    {manualPayment.pay_address}
                  </p>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(manualPayment.pay_address, 'address')}
                    className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
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
              
              <div className="text-xs text-gray-400 space-y-1">
                <p>• Payment ID: {manualPayment.payment_id}</p>
                <p>• Network: TRC-20 (Tron Network)</p>
                <p>• Payment expires in 20 minutes</p>
                <p>• Your balance will update automatically after 1-3 confirmations</p>
                <p className="text-yellow-400 font-medium">
                  ⚠️ Only send USDT on TRC-20 network! Other tokens or networks will be lost!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={startCryptoDeposit}
          disabled={loading || !!successUrl}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#ff950e] px-6 py-3.5 text-sm font-semibold text-black transition-all hover:bg-[#e0850d] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating USDT checkout...
            </>
          ) : successUrl ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Payment in progress
            </>
          ) : (
            <>
              <Wallet className="h-4 w-4" />
              Create USDT Deposit
            </>
          )}
        </button>

        {/* Info Text */}
        <div className="text-center text-xs text-gray-500">
          <p>Secure USDT payment processing by NOWPayments</p>
          <p className="mt-1">
            TRC-20 Network • Low fees • Fast confirmations
          </p>
          <p className="mt-2 text-gray-600">
            Payments within 0.1% of the required amount are automatically accepted
          </p>
        </div>
      </div>
    </div>
  );
}
