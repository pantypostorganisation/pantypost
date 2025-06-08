// src/components/admin/wallet/BulkActionModal.tsx
'use client';

import { X, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface BulkActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedUsers: string[];
  onAction: (action: 'credit' | 'debit', amount: number, reason: string) => void;
  isLoading?: boolean;
}

export default function BulkActionModal({ 
  isOpen, 
  onClose, 
  selectedUsers, 
  onAction,
  isLoading = false 
}: BulkActionModalProps) {
  const [actionType, setActionType] = useState<'credit' | 'debit'>('credit');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0 || !reason.trim()) return;
    onAction(actionType, numAmount, reason);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6 max-w-md w-full shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Bulk Action</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="mb-4">
          <p className="text-sm text-gray-300 mb-2">
            Selected Users: {selectedUsers.length}
          </p>
          <div className="max-h-20 overflow-y-auto bg-black/30 rounded-lg p-2">
            {selectedUsers.map(user => (
              <span key={user} className="inline-block bg-[#ff950e]/20 text-[#ff950e] px-2 py-1 rounded text-xs mr-1 mb-1">
                {user}
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Action Type</label>
            <div className="flex gap-2">
              <button
                onClick={() => setActionType('credit')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  actionType === 'credit' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Credit
              </button>
              <button
                onClick={() => setActionType('debit')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  actionType === 'debit' 
                    ? 'bg-red-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Debit
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Amount ($)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              step="0.01"
              min="0"
              className="w-full px-3 py-2 bg-black/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#ff950e]"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Reason</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 bg-black/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#ff950e] resize-none"
              rows={3}
              placeholder="Reason for this action..."
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end mt-6">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || !amount || !reason.trim()}
            className="px-4 py-2 bg-[#ff950e] hover:bg-[#ff6b00] text-black rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Apply to {selectedUsers.length} users
          </button>
        </div>
      </div>
    </div>
  );
}
