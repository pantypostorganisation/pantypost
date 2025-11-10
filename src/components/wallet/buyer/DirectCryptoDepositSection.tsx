// src/components/wallet/buyer/DirectCryptoDepositSection.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  Wallet,
  Bitcoin,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Info,
  Shield,
  AlertTriangle,
  Clock,
  QrCode,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useWallet } from "@/context/WalletContext";

interface DirectCryptoDepositSectionProps {
  minAmount?: number;
  maxAmount?: number;
}

interface DepositRequest {
  depositId: string;
  walletAddress: string;
  cryptoAmount: string;
  cryptoCurrency: string;
  usdAmount: number;
  networkFeeRange: string;
  estimatedNetworkFee: string;
  qrCode: string;
  expiresAt: string;
  expiryMinutes: number;
  instructions: {
    title: string;
    steps: string[];
    warning: string;
    confirmations: string;
  };
  network: string;
  exchangeRate: number;
}

export default function DirectCryptoDepositSection({
  minAmount = 10,
  maxAmount = 10000,
}: DirectCryptoDepositSectionProps) {
  const { user } = useAuth();
  const { reloadData } = useWallet();
  
  const [amount, setAmount] = useState<string>("50");
  const [currency, setCurrency] = useState<string>("USDT_POLYGON"); // Default to cheapest!
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [depositRequest, setDepositRequest] = useState<DepositRequest | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [txHash, setTxHash] = useState<string>("");
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [depositHistory, setDepositHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Get the API URL from environment or fallback
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.pantypost.com/api';
  
  // Get auth token
  const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {})
    };
  };

  // Currency options with more accurate fee ranges - Polygon is the WINNER!
  const currencies = [
    // ULTRA-LOW FEE OPTIONS (Recommended!)
    { 
      value: "USDT_POLYGON", 
      label: "USDT (Polygon)", 
      network: "Polygon", 
      fee: "$0.01-$0.05",
      badge: "CHEAPEST! 🏆",
      recommended: true
    },
    { 
      value: "USDC_POLYGON", 
      label: "USDC (Polygon)", 
      network: "Polygon", 
      fee: "$0.01-$0.05",
      badge: "CHEAPEST! 🏆",
      recommended: true
    },
    
    // Moderate fee option
    { 
      value: "USDT_TRC20", 
      label: "USDT (TRC-20)", 
      network: "Tron", 
      fee: "$0.50-$2",
      recommended: false
    },
    
    // Higher fee options (kept for users who prefer them)
    { 
      value: "BTC", 
      label: "Bitcoin", 
      network: "Bitcoin", 
      fee: "$1-$10",
      recommended: false
    },
  ];

  // Quick amount buttons
  const quickAmounts = [25, 50, 100, 250, 500, 1000];

  // Countdown timer
  useEffect(() => {
    if (depositRequest && !confirmed) {
      const timer = setInterval(() => {
        const expiresAt = new Date(depositRequest.expiresAt).getTime();
        const now = Date.now();
        const difference = Math.max(0, expiresAt - now);
        setTimeLeft(Math.floor(difference / 1000));

        if (difference <= 0) {
          setDepositRequest(null);
          setError("Deposit request expired. Please create a new one.");
        }
      }, 1000);

      return () => clearInterval(timer);
    }
    // Return undefined when condition is not met
    return undefined;
  }, [depositRequest, confirmed]);

  // Format time left
  const formatTimeLeft = (seconds: number) => {
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
  };

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

  // Create deposit request - FIXED with proper API URL
  const createDepositRequest = async () => {
    setError(null);
    setDepositRequest(null);
    setConfirmed(false);

    const validationError = validateAmount(amount);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      // FIXED: Use the full backend API URL
      const res = await fetch(`${API_URL}/crypto/create-deposit`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          amount: Number(amount),
          currency
        }),
      });

      const data = await res.json();

      if (data.success) {
        setDepositRequest(data.data);
        setTxHash("");
      } else {
        setError(data.error || "Failed to create deposit request");
      }
    } catch (err) {
      console.error("Error creating deposit:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Confirm payment sent - FIXED with proper API URL
  const confirmPaymentSent = async () => {
    if (!depositRequest || !txHash) return;

    setConfirming(true);
    setError(null);

    try {
      // FIXED: Use the full backend API URL
      const res = await fetch(`${API_URL}/crypto/confirm-deposit`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          depositId: depositRequest.depositId,
          txHash
        }),
      });

      const data = await res.json();

      if (data.success) {
        setConfirmed(true);
        // Refresh wallet data after a delay
        setTimeout(() => {
          reloadData();
        }, 5000);
      } else {
        setError(data.error || "Failed to confirm payment");
      }
    } catch (err) {
      console.error("Error confirming payment:", err);
      setError("Network error. Please try again.");
    } finally {
      setConfirming(false);
    }
  };

  // Load deposit history - FIXED with proper API URL
  const loadDepositHistory = async () => {
    try {
      // FIXED: Use the full backend API URL
      const res = await fetch(`${API_URL}/crypto/my-deposits`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setDepositHistory(data.data);
      }
    } catch (err) {
      console.error("Error loading deposit history:", err);
    }
  };

  // Get blockchain explorer URL
  const getExplorerUrl = (txHash: string, currency: string) => {
    if (!txHash) return null;
    
    if (currency === 'USDT_POLYGON' || currency === 'USDC_POLYGON') {
      return `https://polygonscan.com/tx/${txHash}`;
    } else if (currency === 'USDT_TRC20') {
      return `https://tronscan.org/#/transaction/${txHash}`;
    } else if (currency === 'BTC') {
      return `https://blockchair.com/bitcoin/transaction/${txHash}`;
    } else if (currency === 'ETH' || currency === 'USDT_ERC20') {
      return `https://etherscan.io/tx/${txHash}`;
    }
    return null;
  };

  return (
    <div className="rounded-2xl border border-gray-800 bg-[#111] p-6 sm:p-8 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#ff950e]/40 bg-[#ff950e]/10">
            <Bitcoin className="h-6 w-6 text-[#ff950e]" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white sm:text-2xl">
              Direct Crypto Deposit
            </h2>
            <p className="text-sm text-gray-400">
              Send crypto directly to our wallets - No middleman fees!
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            loadDepositHistory();
            setShowHistory(!showHistory);
          }}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          History
        </button>
      </div>

      {/* Security Badge */}
      <div className="flex items-center gap-2 mb-6 p-3 rounded-xl bg-green-500/10 border border-green-500/30">
        <Shield className="h-4 w-4 text-green-400" />
        <span className="text-xs text-green-300">
          Direct wallet deposits - 0% processing fees
        </span>
      </div>

      {!depositRequest ? (
        // Step 1: Create Deposit Request
        <div className="space-y-6">
          {/* Currency Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">
              Select Cryptocurrency
            </label>
            
            {/* Recommended Options */}
            <div className="mb-3">
              <p className="text-xs text-green-400 mb-2 flex items-center gap-1">
                <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                Recommended - Lowest Fees!
              </p>
              <div className="grid grid-cols-2 gap-2">
                {currencies.filter(c => c.recommended).map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setCurrency(c.value)}
                    className={`relative p-3 rounded-xl border text-left transition-all ${
                      currency === c.value
                        ? "border-green-500 bg-green-500/10 ring-2 ring-green-500/30"
                        : "border-gray-800 bg-[#0c0c0c] hover:border-green-500/50"
                    }`}
                  >
                    {c.badge && (
                      <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-green-500 text-black text-[10px] font-bold rounded-full">
                        {c.badge}
                      </span>
                    )}
                    <div className="font-medium text-sm text-white">{c.label}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {c.network} • Fee: <span className="text-green-400 font-medium">{c.fee}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Other Options */}
            <div>
              <p className="text-xs text-gray-500 mb-2">Other Options</p>
              <div className="grid grid-cols-2 gap-2">
                {currencies.filter(c => !c.recommended).map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setCurrency(c.value)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      currency === c.value
                        ? "border-[#ff950e] bg-[#ff950e]/10"
                        : "border-gray-800 bg-[#0c0c0c] hover:border-gray-700"
                    }`}
                  >
                    <div className="font-medium text-sm text-white">{c.label}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {c.network} • Fee: {c.fee}
                    </div>
                  </button>
                ))}
              </div>
            </div>
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

          {/* Create Button */}
          <button
            onClick={createDepositRequest}
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#ff950e] px-6 py-3.5 text-sm font-semibold text-black transition-all hover:bg-[#e0850d] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating deposit request...
              </>
            ) : (
              <>
                <QrCode className="h-4 w-4" />
                Generate Deposit Address
              </>
            )}
          </button>

          {/* Info */}
          <div className="text-center text-xs text-gray-500">
            <p>Direct wallet transfers • No processing fees</p>
            <p className="mt-1">Manual verification by admin within 1-2 hours</p>
          </div>
        </div>
      ) : confirmed ? (
        // Step 3: Payment Confirmed
        <div className="space-y-6">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
            <CheckCircle2 className="h-6 w-6 text-emerald-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-emerald-300">Payment Confirmation Received!</p>
              <p className="text-sm text-emerald-300/80 mt-2">
                Your deposit is being verified by our admin team. This usually takes 1-2 hours.
              </p>
              <div className="mt-3 space-y-1 text-xs text-gray-400">
                <p>Deposit ID: {depositRequest.depositId}</p>
                <p>Transaction Hash: {txHash}</p>
                <p>Amount: ${depositRequest.usdAmount}</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              setDepositRequest(null);
              setConfirmed(false);
              setTxHash("");
            }}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-gray-800 bg-[#0c0c0c] px-6 py-3 text-sm font-semibold text-gray-300 hover:border-gray-700 hover:text-white transition-all"
          >
            Create New Deposit
          </button>
        </div>
      ) : (
        // Step 2: Show Deposit Instructions
        <div className="space-y-6">
          {/* Timer */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-400" />
              <span className="text-sm text-yellow-300">Time remaining</span>
            </div>
            <span className="font-mono text-yellow-400 font-medium">
              {formatTimeLeft(timeLeft)}
            </span>
          </div>

          {/* QR Code */}
          {depositRequest.qrCode && (
            <div className="flex justify-center p-4 bg-white rounded-xl">
              <img 
                src={depositRequest.qrCode} 
                alt="Deposit QR Code" 
                className="w-48 h-48"
              />
            </div>
          )}

          {/* Amount to Send */}
          <div className="rounded-lg bg-black/30 p-4">
            <p className="text-xs text-gray-500 mb-2">Amount to Send (Click to Copy)</p>
            <div className="flex items-center justify-between">
              <p className="text-lg font-mono text-white font-medium">
                {depositRequest.cryptoAmount} {depositRequest.cryptoCurrency.replace('_', ' ')}
              </p>
              <button
                onClick={() => copyToClipboard(depositRequest.cryptoAmount, 'amount')}
                className="text-gray-400 hover:text-white transition-colors p-2"
              >
                {copiedAmount ? (
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                ) : (
                  <Copy className="h-5 w-5" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Network fee: {depositRequest.networkFeeRange} (paid by you)
            </p>
          </div>

          {/* Wallet Address */}
          <div className="rounded-lg bg-black/30 p-4">
            <p className="text-xs text-gray-500 mb-2">
              {depositRequest.network} Address (Click to Copy)
            </p>
            <div className="flex items-center gap-2">
              <p className="flex-1 text-xs font-mono text-white break-all">
                {depositRequest.walletAddress}
              </p>
              <button
                onClick={() => copyToClipboard(depositRequest.walletAddress)}
                className="text-gray-400 hover:text-white transition-colors p-2 flex-shrink-0"
              >
                {copied ? (
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                ) : (
                  <Copy className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-white">
              {depositRequest.instructions.title}
            </h3>
            <ol className="space-y-2">
              {depositRequest.instructions.steps.map((step, idx) => (
                <li key={idx} className="flex gap-2 text-xs text-gray-400">
                  <span className="text-[#ff950e] font-medium">{idx + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Warning */}
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-300">
                {depositRequest.instructions.warning}
              </p>
            </div>
          </div>

          {/* Transaction Hash Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">
              Transaction Hash (After Sending)
            </label>
            <input
              type="text"
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              placeholder="Enter transaction hash after sending payment"
              className="w-full rounded-xl border border-gray-800 bg-[#0c0c0c] px-4 py-3 text-white outline-none focus:border-[#ff950e]/50 focus:ring-2 focus:ring-[#ff950e]/10 placeholder:text-gray-600"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                setDepositRequest(null);
                setTxHash("");
              }}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-gray-800 bg-[#0c0c0c] px-6 py-3 text-sm font-semibold text-gray-300 hover:border-gray-700 hover:text-white transition-all"
            >
              Cancel
            </button>
            <button
              onClick={confirmPaymentSent}
              disabled={!txHash || confirming}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#ff950e] px-6 py-3.5 text-sm font-semibold text-black transition-all hover:bg-[#e0850d] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {confirming ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Confirming...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  I've Sent Payment
                </>
              )}
            </button>
          </div>

          {/* Additional Info */}
          <div className="text-center text-xs text-gray-500">
            <p>Confirmations needed: {depositRequest.instructions.confirmations}</p>
            <p className="mt-1">Exchange rate: 1 USD = {depositRequest.exchangeRate} {depositRequest.cryptoCurrency.split('_')[0]}</p>
          </div>
        </div>
      )}

      {/* Deposit History Modal */}
      {showHistory && depositHistory.length > 0 && (
        <div className="mt-6 p-4 rounded-xl bg-black/30 border border-gray-800">
          <h3 className="text-sm font-medium text-white mb-3">Recent Deposits</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {depositHistory.map((deposit) => (
              <div
                key={deposit.depositId}
                className="flex items-center justify-between p-2 rounded-lg bg-[#0c0c0c] text-xs"
              >
                <div>
                  <p className="text-gray-300">${deposit.amountUSD}</p>
                  <p className="text-gray-500">
                    {new Date(deposit.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-medium ${
                    deposit.status === 'completed' ? 'text-green-400' :
                    deposit.status === 'confirming' ? 'text-yellow-400' :
                    deposit.status === 'rejected' ? 'text-red-400' :
                    'text-gray-400'
                  }`}>
                    {deposit.status}
                  </p>
                  {deposit.txHash && getExplorerUrl(deposit.txHash, deposit.cryptoCurrency) && (
                    <button
                      onClick={() => window.open(getExplorerUrl(deposit.txHash, deposit.cryptoCurrency)!, '_blank')}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      View TX
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}