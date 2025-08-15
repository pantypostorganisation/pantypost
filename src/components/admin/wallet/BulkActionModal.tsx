// src/components/admin/wallet/BulkActionModal.tsx
'use client';

import { X, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { SecureInput, SecureTextarea } from '@/components/ui/SecureInput';
import { SecureForm } from '@/components/ui/SecureForm';
import { sanitizeCurrency, sanitizeStrict } from '@/utils/security/sanitization';
import { SecureMessageDisplay } from '@/components/ui/SecureMessageDisplay';

interface BulkActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedUsers: string[];
  onAction: (action: 'credit' | 'debit', amount: number, reason: string) => void | Promise<void>;
  isLoading?: boolean;
}

export default function BulkActionModal({
  isOpen,
  onClose,
  selectedUsers = [],
  onAction,
  isLoading = false
}: BulkActionModalProps) {
  const [actionType, setActionType] = useState<'credit' | 'debit'>('credit');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState({ amount: false, reason: false });
  const [errors, setErrors] = useState<{ amount?: string; reason?: string }>({});

  if (!isOpen) return null;

  // Handle secure amount change
  const handleSecureAmountChange = (value: string) => {
    if (value === '') {
      setAmount('');
      return;
    }
    const sanitized = sanitizeCurrency(value);
    setAmount(sanitized.toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const numAmount = parseFloat(amount);
    const sanitizedReason = sanitizeStrict(reason).trim();
    const validationErrors: typeof errors = {};

    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      validationErrors.amount = 'Please enter a valid amount greater than 0';
    }

    if (!sanitizedReason) {
      validationErrors.reason = 'Please provide a reason';
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setTouched({ amount: true, reason: true });
      return;
    }

    await onAction(actionType, numAmount, sanitizedReason);

    // Reset form on success
    setAmount('');
    setReason('');
    setTouched({ amount: false, reason: false });
  };

  const handleClose = () => {
    // Reset form when closing
    setAmount('');
    setReason('');
    setTouched({ amount: false, reason: false });
    setErrors({});
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Bulk wallet action">
      <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6 max-w-md w-full shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Bulk Action</h3>
          <button onClick={handleClose} className="text-gray-400 hover:text-white" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-300 mb-2">Selected Users: {selectedUsers.length}</p>
          <div className="max-h-20 overflow-y-auto bg-black/30 rounded-lg p-2">
            {selectedUsers.map((user) => (
              <span key={user} className="inline-block bg-[#ff950e]/20 text-[#ff950e] px-2 py-1 rounded text-xs mr-1 mb-1">
                <SecureMessageDisplay content={user} allowBasicFormatting={false} className="inline" />
              </span>
            ))}
          </div>
        </div>

        <SecureForm onSubmit={handleSubmit} rateLimitKey="bulk_wallet_action" rateLimitConfig={{ maxAttempts: 10, windowMs: 60 * 1000 }}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Action Type</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActionType('credit')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    actionType === 'credit' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                  aria-pressed={actionType === 'credit'}
                >
                  Credit
                </button>
                <button
                  type="button"
                  onClick={() => setActionType('debit')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    actionType === 'debit' ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                  aria-pressed={actionType === 'debit'}
                >
                  Debit
                </button>
              </div>
            </div>

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
                error={errors.amount}
                touched={touched.amount}
                sanitize={false}
                required
              />
            </div>

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
                error={errors.reason}
                touched={touched.reason}
                sanitize={true}
                sanitizer={sanitizeStrict}
                required
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end mt-6">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !amount || !sanitizeStrict(reason).trim()}
              className="px-4 py-2 bg-[#ff950e] hover:bg-[#ff6b00] text-black rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Apply to {selectedUsers.length} {selectedUsers.length === 1 ? 'user' : 'users'}
            </button>
          </div>
        </SecureForm>
      </div>
    </div>
  );
}
