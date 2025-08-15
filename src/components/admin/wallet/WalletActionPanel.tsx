// src/components/admin/wallet/WalletActionPanel.tsx
'use client';

import { useState } from 'react';
import { DollarSign, ArrowUpRight, ArrowDownRight, UserCheck, Loader2 } from 'lucide-react';
import { SecureInput, SecureTextarea } from '@/components/ui/SecureInput';
import { sanitizeCurrency, sanitizeStrict } from '@/utils/security/sanitization';
import { SecureMessageDisplay } from '@/components/ui/SecureMessageDisplay';

interface WalletActionPanelProps {
  selectedUser: string | null;
  selectedUserRole: 'buyer' | 'seller' | 'admin';
  actionType: 'credit' | 'debit';
  setActionType: (type: 'credit' | 'debit') => void;
  amount: string;
  setAmount: (amount: string) => void;
  reason: string;
  setReason: (reason: string) => void;
  isLoading: boolean;
  handleAction: () => void;
  clearSelection: () => void;
  getUserBalance: (username: string) => number;
  getRoleBadgeColor: (role: string) => string;
  getBalanceColor: (balance: number) => string;
  formatRole: (role: string) => string;
}

export default function WalletActionPanel({
  selectedUser,
  selectedUserRole,
  actionType,
  setActionType,
  amount,
  setAmount,
  reason,
  setReason,
  isLoading,
  handleAction,
  clearSelection,
  getUserBalance,
  getRoleBadgeColor,
  getBalanceColor,
  formatRole
}: WalletActionPanelProps) {
  const [touched, setTouched] = useState({ amount: false, reason: false });

  const handleSecureAmountChange = (value: string) => {
    if (value === '') {
      setAmount('');
    } else {
      const sanitized = sanitizeCurrency(value);
      setAmount(sanitized.toString());
    }
  };

  const canSubmit = Boolean(amount) && Boolean(sanitizeStrict(reason).trim()) && !isLoading;

  return (
    <div className="bg-[#1a1a1a] p-6 rounded-xl border border-gray-800 shadow-lg h-fit">
      <h2 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
        <DollarSign className="h-5 w-5 text-[#ff950e]" />
        Wallet Actions
      </h2>

      {selectedUser ? (
        <div className="space-y-4">
          {/* Selected User Info */}
          <div className="bg-black/30 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-white">
                <SecureMessageDisplay content={selectedUser} allowBasicFormatting={false} className="inline" />
              </span>
              <span className={`px-2 py-1 rounded text-xs border ${getRoleBadgeColor(selectedUserRole)}`}>
                {formatRole(selectedUserRole)}
              </span>
            </div>
            <div className="text-sm text-gray-400">
              Current Balance:{' '}
              <span className={getBalanceColor(getUserBalance(selectedUser))}>
                ${Number(getUserBalance(selectedUser)).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Action Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Action Type</label>
            <div className="flex gap-2">
              <button
                onClick={() => setActionType('credit')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  actionType === 'credit' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
                aria-pressed={actionType === 'credit'}
              >
                <ArrowUpRight className="h-4 w-4" />
                Credit
              </button>
              <button
                onClick={() => setActionType('debit')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  actionType === 'debit' ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
                aria-pressed={actionType === 'debit'}
              >
                <ArrowDownRight className="h-4 w-4" />
                Debit
              </button>
            </div>
          </div>

          {/* Amount */}
          <div>
            <SecureInput
              label="Amount ($)"
              type="number"
              value={amount}
              onChange={handleSecureAmountChange}
              onBlur={() => setTouched((prev) => ({ ...prev, amount: true }))}
              step="0.01"
              min="0"
              max="999999.99"
              className="w-full px-3 py-2 bg-black/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#ff950e]"
              placeholder="0.00"
              touched={touched.amount}
              sanitize={false}
            />
          </div>

          {/* Reason */}
          <div>
            <SecureTextarea
              label="Reason"
              value={reason}
              onChange={setReason}
              onBlur={() => setTouched((prev) => ({ ...prev, reason: true }))}
              className="w-full px-3 py-2 bg-black/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#ff950e] resize-none"
              rows={3}
              placeholder="Reason for this action..."
              maxLength={500}
              characterCount={true}
              touched={touched.reason}
              sanitize={true}
              sanitizer={sanitizeStrict}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                clearSelection();
                setTouched({ amount: false, reason: false });
              }}
              className="flex-1 py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Clear
            </button>
            <button
              onClick={handleAction}
              disabled={!canSubmit}
              className="flex-1 py-2 px-4 bg-[#ff950e] hover:bg-[#ff6b00] disabled:bg-gray-600 disabled:cursor-not-allowed text-black disabled:text-gray-400 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {actionType === 'credit' ? 'Credit' : 'Debit'} Account
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <UserCheck className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 mb-2">No user selected</p>
          <p className="text-sm text-gray-500">Select a user from the list to manage their wallet</p>
        </div>
      )}
    </div>
  );
}
