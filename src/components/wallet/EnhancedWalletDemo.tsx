// src/components/wallet/EnhancedWalletDemo.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useBuyerWallet } from '@/hooks/useBuyerWallet';
import { WalletValidation } from '@/services/wallet.validation';
import { WalletMockData } from '@/services/wallet.mock';
import { formatMoney, formatLimit, formatRiskScore, formatTransactionSummary } from '@/utils/format';
import { Money } from '@/types/common';
import { 
  Wallet, 
  CreditCard, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  Info,
  Download,
  Upload,
  Activity,
  Shield,
  DollarSign
} from 'lucide-react';

/**
 * Demo component showcasing enhanced wallet features
 */
export default function EnhancedWalletDemo() {
  const {
    balance,
    availableBalance,
    pendingBalance,
    amountToAdd,
    message,
    messageType,
    isLoading,
    dailyDepositLimit,
    remainingDepositLimit,
    transactionHistory,
    isLoadingHistory,
    validationErrors,
    lastSyncTime,
    buyerPurchases,
    recentPurchases,
    totalSpent,
    formattedBalance,
    formattedAvailableBalance,
    formattedTotalSpent,
    formattedRemainingLimit,
    handleAddFunds,
    handleAmountChange,
    handleKeyPress,
    handleQuickAmountSelect,
    loadTransactionHistory,
    syncBalance,
  } = useBuyerWallet();

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [riskScore, setRiskScore] = useState(0);
  const [mockMode, setMockMode] = useState(false);

  // Load transaction history on mount
  useEffect(() => {
    loadTransactionHistory();
  }, [loadTransactionHistory]);

  // Calculate risk score based on activity
  useEffect(() => {
    if (transactionHistory.length > 0) {
      // Simple risk calculation for demo
      const recentTransactions = transactionHistory.slice(0, 10);
      const highValueCount = recentTransactions.filter(t => 
        t.rawTransaction.amount > WalletValidation.LIMITS.MAX_TRANSACTION / 2
      ).length;
      
      const failedCount = recentTransactions.filter(t => 
        t.rawTransaction.status === 'failed'
      ).length;
      
      const score = Math.min(100, (highValueCount * 15) + (failedCount * 20));
      setRiskScore(score);
    }
  }, [transactionHistory]);

  // Generate mock data for testing
  const generateMockData = () => {
    setMockMode(true);
    const mockTransactions = WalletMockData.generateMockTransactions(20);
    console.log('Generated mock transactions:', mockTransactions);
    
    // In real implementation, these would be saved to storage
    setTimeout(() => {
      loadTransactionHistory();
      setMockMode(false);
    }, 1000);
  };

  // Calculate used amount correctly
  const usedAmount = Money.fromDollars(dailyDepositLimit - remainingDepositLimit) as Money;
  const limitDisplay = formatLimit(
    usedAmount,
    WalletValidation.LIMITS.DAILY_DEPOSIT_LIMIT
  );

  const riskDisplay = formatRiskScore(riskScore);
  const transactionSummary = formatTransactionSummary(
    transactionHistory.map(t => t.rawTransaction)
  );

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-white/20 rounded-xl backdrop-blur">
              <Wallet className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Enhanced Wallet</h1>
              <p className="text-white/80">Advanced financial management system</p>
            </div>
          </div>
          <button
            onClick={syncBalance}
            className="p-3 bg-white/20 rounded-xl hover:bg-white/30 transition-colors"
            title="Sync balance"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-white/10 backdrop-blur rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/70 text-sm">Total Balance</span>
              <DollarSign className="w-4 h-4 text-white/50" />
            </div>
            <div className="text-2xl font-bold">{formattedBalance}</div>
          </div>
          
          <div className="bg-white/10 backdrop-blur rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/70 text-sm">Available</span>
              <CheckCircle className="w-4 h-4 text-green-300" />
            </div>
            <div className="text-2xl font-bold">{formattedAvailableBalance}</div>
          </div>
          
          <div className="bg-white/10 backdrop-blur rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/70 text-sm">Total Spent</span>
              <TrendingUp className="w-4 h-4 text-white/50" />
            </div>
            <div className="text-2xl font-bold">{formattedTotalSpent}</div>
          </div>
        </div>
      </div>

      {/* Add Funds Section */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-purple-600" />
          Add Funds
        </h2>

        <div className="space-y-4">
          {/* Daily Limit Progress */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Daily Deposit Limit</span>
              <span className="text-sm font-medium">{limitDisplay.percentageFormatted}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all ${
                  limitDisplay.percentage > 80 ? 'bg-orange-500' : 'bg-purple-600'
                }`}
                style={{ width: `${Math.min(100, limitDisplay.percentage)}%` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-gray-500">Used: {limitDisplay.used}</span>
              <span className="text-xs text-gray-500">Remaining: {formattedRemainingLimit}</span>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount to Add
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="text"
                value={amountToAdd}
                onChange={handleAmountChange}
                onKeyPress={handleKeyPress}
                placeholder="0.00"
                className={`w-full pl-8 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                  validationErrors.length > 0 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-purple-500'
                }`}
                disabled={isLoading}
              />
            </div>
            {validationErrors.length > 0 && (
              <div className="mt-1 text-sm text-red-600">
                {validationErrors[0]}
              </div>
            )}
          </div>

          {/* Quick Amount Buttons */}
          <div className="grid grid-cols-4 gap-2">
            {['25', '50', '100', '200'].map(amount => (
              <button
                key={amount}
                onClick={() => handleQuickAmountSelect(amount)}
                className="px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors font-medium"
                disabled={isLoading}
              >
                ${amount}
              </button>
            ))}
          </div>

          {/* Add Funds Button */}
          <button
            onClick={handleAddFunds}
            disabled={isLoading || !amountToAdd || validationErrors.length > 0}
            className="w-full py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                Add Funds
              </>
            )}
          </button>

          {/* Status Message */}
          {message && (
            <div className={`p-4 rounded-lg flex items-center gap-2 ${
              messageType === 'success' 
                ? 'bg-green-50 text-green-800' 
                : 'bg-red-50 text-red-800'
            }`}>
              {messageType === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <XCircle className="w-5 h-5" />
              )}
              {message}
            </div>
          )}
        </div>
      </div>

      {/* Security & Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Risk Assessment */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-600" />
            Security Status
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Risk Score</p>
                <p className={`text-sm ${riskDisplay.color}`}>{riskDisplay.label}</p>
              </div>
              <div className="text-2xl font-bold">{riskDisplay.score}</div>
            </div>
            
            {lastSyncTime && (
              <div className="text-sm text-gray-500">
                <Info className="w-4 h-4 inline mr-1" />
                Last synced: {new Date(lastSyncTime).toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>

        {/* Transaction Summary */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-600" />
            Transaction Summary
          </h3>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total In:</span>
              <span className="font-medium text-green-600">{transactionSummary.totalIn}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Out:</span>
              <span className="font-medium text-red-600">{transactionSummary.totalOut}</span>
            </div>
            <div className="pt-3 border-t">
              <div className="flex justify-between">
                <span className="text-gray-600">Net Flow:</span>
                <span className="font-bold">{transactionSummary.netFlow}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-600" />
            Recent Transactions
          </h3>
          <button
            onClick={loadTransactionHistory}
            disabled={isLoadingHistory}
            className="text-purple-600 hover:text-purple-700 text-sm font-medium"
          >
            {isLoadingHistory ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {transactionHistory.length > 0 ? (
          <div className="space-y-2">
            {transactionHistory.slice(0, 5).map((transaction, index) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    transaction.isCredit ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {transaction.isCredit ? (
                      <Download className="w-4 h-4 text-green-600" />
                    ) : (
                      <Upload className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{transaction.displayType}</p>
                    <p className="text-sm text-gray-500">{transaction.displayDate}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${
                    transaction.isCredit ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.displayAmount}
                  </p>
                  <p className={`text-xs ${transaction.statusColor}`}>
                    {transaction.displayStatus}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Activity className="w-12 h-12 mx-auto mb-2 opacity-20" />
            <p>No transactions yet</p>
          </div>
        )}
      </div>

      {/* Advanced Features Toggle */}
      <div className="text-center">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-purple-600 hover:text-purple-700 font-medium"
        >
          {showAdvanced ? 'Hide' : 'Show'} Advanced Features
        </button>
      </div>

      {/* Advanced Features */}
      {showAdvanced && (
        <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
          <h3 className="text-lg font-semibold mb-4">Advanced Features</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={generateMockData}
              disabled={mockMode}
              className="p-4 bg-white rounded-lg hover:shadow-md transition-shadow flex items-center gap-3"
            >
              <Activity className="w-5 h-5 text-purple-600" />
              <div className="text-left">
                <p className="font-medium">Generate Test Data</p>
                <p className="text-sm text-gray-500">Create mock transactions for testing</p>
              </div>
            </button>
            
            <button
              onClick={() => console.log('Fee structure:', WalletValidation.FEES)}
              className="p-4 bg-white rounded-lg hover:shadow-md transition-shadow flex items-center gap-3"
            >
              <Info className="w-5 h-5 text-purple-600" />
              <div className="text-left">
                <p className="font-medium">View Fee Structure</p>
                <p className="text-sm text-gray-500">Check platform fees and limits</p>
              </div>
            </button>
          </div>
          
          <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-800">
              <AlertTriangle className="w-4 h-4 inline mr-1" />
              This demo showcases the enhanced wallet service with proper financial safety,
              comprehensive validation, and advanced features like risk assessment and reconciliation.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
