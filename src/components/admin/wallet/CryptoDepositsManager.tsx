// src/components/admin/wallet/CryptoDepositsManager.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  Bitcoin,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Search,
  RefreshCw,
  ExternalLink,
  Copy,
  Filter,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

interface CryptoDeposit {
  depositId: string;
  username: string;
  userEmail?: string;
  status: 'pending' | 'confirming' | 'completed' | 'rejected' | 'expired';
  amountUSD: number;
  cryptoCurrency: string;
  expectedCryptoAmount: number;
  walletAddress: string;
  txHash?: string;
  createdAt: string;
  expiresAt: string;
  isExpired: boolean;
}

export default function CryptoDepositsManager() {
  const { user } = useAuth();
  const { error: showError, success: showSuccess, info: showInfo } = useToast();
  
  const [deposits, setDeposits] = useState<CryptoDeposit[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirming'>('confirming');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeposit, setSelectedDeposit] = useState<CryptoDeposit | null>(null);
  const [verifyAmount, setVerifyAmount] = useState('');
  const [verifyNotes, setVerifyNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [stats, setStats] = useState({
    totalPending: 0,
    totalConfirming: 0,
    totalToday: 0,
    volumeToday: 0
  });

  // Load deposits
  const loadDeposits = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/crypto/admin/pending-deposits');
      const data = await res.json();
      
      if (data.success) {
        setDeposits(data.data);
        
        // Calculate stats
        const today = new Date().setHours(0, 0, 0, 0);
        const todayDeposits = data.data.filter((d: CryptoDeposit) => 
          new Date(d.createdAt).setHours(0, 0, 0, 0) === today
        );
        
        setStats({
          totalPending: data.data.filter((d: CryptoDeposit) => d.status === 'pending').length,
          totalConfirming: data.data.filter((d: CryptoDeposit) => d.status === 'confirming').length,
          totalToday: todayDeposits.length,
          volumeToday: todayDeposits.reduce((sum: number, d: CryptoDeposit) => sum + d.amountUSD, 0)
        });
      }
    } catch (error) {
      console.error('Error loading deposits:', error);
      // FIXED: Using the error convenience method
      showError('Failed to load deposits');
    } finally {
      setLoading(false);
    }
  };

  // Verify deposit
  const verifyDeposit = async () => {
    if (!selectedDeposit) return;
    
    setProcessing(true);
    try {
      const res = await fetch('/api/crypto/admin/verify-deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          depositId: selectedDeposit.depositId,
          actualAmount: verifyAmount || selectedDeposit.expectedCryptoAmount,
          notes: verifyNotes
        })
      });
      
      const data = await res.json();
      
      if (data.success) {
        // FIXED: Using the success convenience method
        showSuccess(
          'Deposit verified!', 
          `$${data.data.amountCredited} credited to ${selectedDeposit.username}`
        );
        setSelectedDeposit(null);
        setVerifyAmount('');
        setVerifyNotes('');
        loadDeposits();
      } else {
        // FIXED: Using the error convenience method
        showError('Verification failed', data.error || 'Failed to verify deposit');
      }
    } catch (error) {
      console.error('Error verifying deposit:', error);
      // FIXED: Using the error convenience method
      showError('Failed to verify deposit');
    } finally {
      setProcessing(false);
    }
  };

  // Reject deposit
  const rejectDeposit = async () => {
    if (!selectedDeposit || !rejectReason) return;
    
    setProcessing(true);
    try {
      const res = await fetch('/api/crypto/admin/reject-deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          depositId: selectedDeposit.depositId,
          reason: rejectReason
        })
      });
      
      const data = await res.json();
      
      if (data.success) {
        // FIXED: Using the success convenience method
        showSuccess('Deposit rejected', 'The deposit has been marked as rejected');
        setSelectedDeposit(null);
        setRejectReason('');
        loadDeposits();
      } else {
        // FIXED: Using the error convenience method
        showError('Rejection failed', data.error || 'Failed to reject deposit');
      }
    } catch (error) {
      console.error('Error rejecting deposit:', error);
      // FIXED: Using the error convenience method
      showError('Failed to reject deposit');
    } finally {
      setProcessing(false);
    }
  };

  // Copy to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // FIXED: Using the info convenience method
      showInfo('Copied to clipboard');
    } catch (err) {
      // FIXED: Using the error convenience method
      showError('Failed to copy');
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

  // Filter deposits
  const filteredDeposits = deposits.filter(d => {
    if (filter !== 'all' && d.status !== filter) return false;
    if (searchTerm && !d.username.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !d.txHash?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  // Load on mount
  useEffect(() => {
    loadDeposits();
    // Refresh every 30 seconds
    const interval = setInterval(loadDeposits, 30000);
    return () => clearInterval(interval);
  }, []); // Empty dependency array

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Crypto Deposits</h2>
          <p className="text-sm text-gray-400 mt-1">
            Verify direct wallet deposits
          </p>
        </div>
        <button
          onClick={loadDeposits}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-gray-800 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-xl border border-gray-800 bg-[#111] p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-400" />
              <span className="text-xs text-gray-400">Pending</span>
            </div>
            <span className="text-lg font-bold text-white">{stats.totalPending}</span>
          </div>
        </div>
        
        <div className="rounded-xl border border-gray-800 bg-[#111] p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-400" />
              <span className="text-xs text-gray-400">Confirming</span>
            </div>
            <span className="text-lg font-bold text-white">{stats.totalConfirming}</span>
          </div>
        </div>
        
        <div className="rounded-xl border border-gray-800 bg-[#111] p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-400" />
              <span className="text-xs text-gray-400">Today</span>
            </div>
            <span className="text-lg font-bold text-white">{stats.totalToday}</span>
          </div>
        </div>
        
        <div className="rounded-xl border border-gray-800 bg-[#111] p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-400" />
              <span className="text-xs text-gray-400">Volume</span>
            </div>
            <span className="text-lg font-bold text-white">
              ${stats.volumeToday.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex gap-2">
          {['all', 'pending', 'confirming'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-[#ff950e] text-black'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by username or transaction hash..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-gray-800 bg-[#0c0c0c] pl-10 pr-4 py-2 text-white outline-none focus:border-[#ff950e]/50"
            />
          </div>
        </div>
      </div>

      {/* Deposits List */}
      <div className="space-y-2">
        {filteredDeposits.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            No deposits found
          </div>
        ) : (
          filteredDeposits.map((deposit) => (
            <div
              key={deposit.depositId}
              className="rounded-xl border border-gray-800 bg-[#111] p-4 hover:border-gray-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-medium text-white">{deposit.username}</p>
                      {deposit.userEmail && (
                        <p className="text-xs text-gray-400">{deposit.userEmail}</p>
                      )}
                    </div>
                    
                    <div className={`px-2 py-1 rounded-lg text-xs font-medium ${
                      deposit.status === 'confirming' 
                        ? 'bg-orange-500/10 text-orange-400 border border-orange-500/30'
                        : deposit.status === 'pending'
                        ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30'
                        : 'bg-gray-500/10 text-gray-400 border border-gray-500/30'
                    }`}>
                      {deposit.status}
                    </div>
                    
                    {deposit.isExpired && (
                      <span className="text-xs text-red-400">Expired</span>
                    )}
                  </div>
                  
                  <div className="mt-2 flex items-center gap-6 text-sm text-gray-400">
                    <span>${deposit.amountUSD}</span>
                    <span>{deposit.expectedCryptoAmount} {deposit.cryptoCurrency}</span>
                    <span>{new Date(deposit.createdAt).toLocaleString()}</span>
                  </div>
                  
                  {deposit.txHash && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs text-gray-500">TX:</span>
                      <code className="text-xs text-gray-300">{deposit.txHash.substring(0, 20)}...</code>
                      <button
                        onClick={() => copyToClipboard(deposit.txHash!)}
                        className="text-gray-400 hover:text-white"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                      {getExplorerUrl(deposit.txHash, deposit.cryptoCurrency) && (
                        <a
                          href={getExplorerUrl(deposit.txHash, deposit.cryptoCurrency)!}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-400 hover:text-blue-300"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedDeposit(deposit);
                      setVerifyAmount(deposit.expectedCryptoAmount.toString());
                    }}
                    className="p-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedDeposit(deposit);
                      setRejectReason('');
                    }}
                    className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Verify Modal */}
      {selectedDeposit && !rejectReason && verifyAmount !== undefined && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#111] border border-gray-800 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Verify Deposit
            </h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-400">User</p>
                <p className="text-white">{selectedDeposit.username}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-400">Expected Amount</p>
                <p className="text-white">
                  ${selectedDeposit.amountUSD} ({selectedDeposit.expectedCryptoAmount} {selectedDeposit.cryptoCurrency})
                </p>
              </div>
              
              {selectedDeposit.txHash && (
                <div>
                  <p className="text-sm text-gray-400">Transaction Hash</p>
                  <p className="text-xs text-white font-mono break-all">{selectedDeposit.txHash}</p>
                </div>
              )}
              
              <div>
                <label className="text-sm text-gray-400">Actual Amount Received</label>
                <input
                  type="text"
                  value={verifyAmount}
                  onChange={(e) => setVerifyAmount(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-800 bg-[#0c0c0c] px-3 py-2 text-white"
                  placeholder="Enter actual amount"
                />
              </div>
              
              <div>
                <label className="text-sm text-gray-400">Notes (Optional)</label>
                <textarea
                  value={verifyNotes}
                  onChange={(e) => setVerifyNotes(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-800 bg-[#0c0c0c] px-3 py-2 text-white"
                  rows={3}
                  placeholder="Any notes about this verification..."
                />
              </div>
            </div>
            
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setSelectedDeposit(null)}
                className="flex-1 rounded-xl border border-gray-800 bg-[#0c0c0c] px-4 py-2 text-sm font-medium text-gray-300 hover:border-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={verifyDeposit}
                disabled={processing}
                className="flex-1 rounded-xl bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600 disabled:opacity-50"
              >
                {processing ? 'Processing...' : 'Verify & Credit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {selectedDeposit && rejectReason !== undefined && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#111] border border-gray-800 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Reject Deposit
            </h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-400">User</p>
                <p className="text-white">{selectedDeposit.username}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-400">Amount</p>
                <p className="text-white">
                  ${selectedDeposit.amountUSD} ({selectedDeposit.expectedCryptoAmount} {selectedDeposit.cryptoCurrency})
                </p>
              </div>
              
              <div>
                <label className="text-sm text-gray-400">Rejection Reason</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-800 bg-[#0c0c0c] px-3 py-2 text-white"
                  rows={4}
                  placeholder="Explain why this deposit is being rejected..."
                  required
                />
              </div>
            </div>
            
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setSelectedDeposit(null);
                  setRejectReason('');
                }}
                className="flex-1 rounded-xl border border-gray-800 bg-[#0c0c0c] px-4 py-2 text-sm font-medium text-gray-300 hover:border-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={rejectDeposit}
                disabled={processing || rejectReason.length < 10}
                className="flex-1 rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
              >
                {processing ? 'Processing...' : 'Reject Deposit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}