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
  const [errors, setErrors] = useState<{ amount?: string; reason?: string }>({});

  const handleSecureAmountChange = (value: string) => {
    if (value === '') {
      setAmount('');
      setErrors(prev => ({ ...prev, amount: undefined }));
    } else {
      const sanitized = sanitizeCurrency(value);
      setAmount(sanitized.toString());
      
      // Validate amount
      const numAmount = parseFloat(sanitized.toString());
      if (isNaN(numAmount) || numAmount <= 0) {
        setErrors(prev => ({ ...prev, amount: 'Please enter a valid amount greater than 0' }));
      } else if (numAmount > 10000) {
        setErrors(prev => ({ ...prev, amount: 'Amount cannot exceed $10,000' }));
      } else {
        setErrors(prev => ({ ...prev, amount: undefined }));
      }
    }
  };

  const handleReasonChange = (value: string) => {
    setReason(value);
    
    // Validate reason - FIXED to match backend requirement (10 chars minimum)
    const sanitized = sanitizeStrict(value).trim();
    if (!sanitized || sanitized.length < 10) {
      setErrors(prev => ({ ...prev, reason: 'Reason must be at least 10 characters' }));
    } else if (sanitized.length > 500) {
      setErrors(prev => ({ ...prev, reason: 'Reason cannot exceed 500 characters' }));
    } else {
      setErrors(prev => ({ ...prev, reason: undefined }));
    }
  };

  const canSubmit = Boolean(amount) && 
                   Boolean(sanitizeStrict(reason).trim()) && 
                   sanitizeStrict(reason).trim().length >= 10 && // FIXED: Match backend requirement
                   !isLoading && 
                   !errors.amount && 
                   !errors.reason;

  return (
    <div className="h-fit rounded-2xl border border-white/5 bg-gradient-to-br from-[#111111]/85 via-[#0b0b0b]/70 to-[#050505]/70 p-6 shadow-[0_20px_45px_rgba(0,0,0,0.5)]">
      <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-white">
        <DollarSign className="h-5 w-5 text-[#ff950e]" />
        Wallet Actions
      </h2>

      {selectedUser ? (
        <div className="space-y-4">
          {/* Selected User Info */}
          <div className="rounded-xl border border-white/5 bg-white/5 p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-medium text-white">
                <SecureMessageDisplay content={selectedUser} allowBasicFormatting={false} className="inline" />
              </span>
              <span className={`px-2 py-1 rounded text-xs border ${getRoleBadgeColor(selectedUserRole)}`}>
                {formatRole(selectedUserRole)}
              </span>
            </div>
            <div className="text-sm text-gray-300">
              Current Balance:{' '}
              <span className={getBalanceColor(getUserBalance(selectedUser))}>
                ${Number(getUserBalance(selectedUser)).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Action Type */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">Action Type</label>
            <div className="flex gap-2">
              <button
                onClick={() => setActionType('credit')}
                className={`flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-all ${
                  actionType === 'credit'
                    ? 'flex border-green-500/60 bg-green-500/20 text-green-100 shadow-[0_10px_30px_rgba(16,185,129,0.25)]'
                    : 'flex border-white/10 bg-white/5 text-gray-300 hover:border-white/20 hover:bg-white/10'
                }`}
                aria-pressed={actionType === 'credit'}
              >
                <ArrowUpRight className="h-4 w-4" />
                Credit
              </button>
              <button
                onClick={() => setActionType('debit')}
                className={`flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-all ${
                  actionType === 'debit'
                    ? 'flex border-red-500/60 bg-red-500/20 text-red-100 shadow-[0_10px_30px_rgba(239,68,68,0.2)]'
                    : 'flex border-white/10 bg-white/5 text-gray-300 hover:border-white/20 hover:bg-white/10'
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
              max="10000"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white backdrop-blur placeholder-gray-500 focus:border-[#ff950e] focus:outline-none"
              placeholder="0.00"
              touched={touched.amount}
              error={errors.amount}
              sanitize={false}
            />
          </div>

          {/* Reason - FIXED with proper validation display */}
          <div>
            <SecureTextarea
              label="Reason (minimum 10 characters)"
              value={reason}
              onChange={handleReasonChange}
              onBlur={() => setTouched((prev) => ({ ...prev, reason: true }))}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white placeholder-gray-500 backdrop-blur focus:border-[#ff950e] focus:outline-none resize-none"
              rows={3}
              placeholder="Enter a detailed reason for this action (at least 10 characters)..."
              maxLength={500}
              characterCount={true}
              touched={touched.reason}
              error={errors.reason}
              sanitize={true}
              sanitizer={sanitizeStrict}
            />
            {/* Show character count helper */}
            <div className="mt-1 text-xs text-gray-400">
              {sanitizeStrict(reason).trim().length}/10 minimum characters
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                clearSelection();
                setTouched({ amount: false, reason: false });
                setErrors({});
              }}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-gray-200 transition hover:border-white/20 hover:bg-white/10"
            >
              Clear
            </button>
            <button
              onClick={handleAction}
              disabled={!canSubmit}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#ff950e] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#ff6b00] disabled:cursor-not-allowed disabled:bg-gray-600 disabled:text-gray-300"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {actionType === 'credit' ? 'Credit' : 'Debit'} Account
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-white/10 py-8 text-center text-gray-400">
          <UserCheck className="mx-auto mb-4 h-12 w-12 text-gray-600" />
          <p className="mb-2 text-sm">No user selected</p>
          <p className="text-xs text-gray-500">Choose a wallet on the left to begin.</p>
        </div>
      )}
    </div>
  );
}
