// src/components/admin/bans/UnbanModal.tsx
'use client';

import { useState } from 'react';
import { UserCheck } from 'lucide-react';
import { SecureTextarea } from '@/components/ui/SecureInput';
import { sanitizeStrict } from '@/utils/security/sanitization';
import { BanEntry } from '@/types/ban';
import { getBanReasonDisplay } from '@/utils/banUtils';

interface UnbanModalProps {
  ban: BanEntry | null;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export default function UnbanModal({ ban, isLoading, onClose, onConfirm }: UnbanModalProps) {
  const [unbanReason, setUnbanReason] = useState('');
  
  if (!ban) return null;
  
  const handleConfirm = () => {
    onConfirm(unbanReason);
    setUnbanReason('');
  };
  
  const handleClose = () => {
    onClose();
    setUnbanReason('');
  };
  
  const handleReasonChange = (value: string) => {
    // Sanitize unban reason
    const sanitizedValue = sanitizeStrict(value);
    setUnbanReason(sanitizedValue);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6 max-w-md w-full">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center">
          <UserCheck className="mr-2 text-green-400" />
          Unban User
        </h3>

        <div className="mb-4">
          <p className="text-gray-300 mb-2">
            Are you sure you want to unban <strong>{ban.username}</strong>?
          </p>
          <div className="text-sm text-gray-400 space-y-1">
            <div>Original reason: {getBanReasonDisplay(ban.reason, ban.customReason)}</div>
            <div>Banned by: {ban.bannedBy || 'Unknown'}</div>
            <div>Ban type: {ban.banType || 'Unknown'}</div>
          </div>
        </div>

        <div className="mb-4">
          <SecureTextarea
            label="Reason for unbanning (optional)"
            value={unbanReason}
            onChange={handleReasonChange}
            placeholder="Reason for lifting this ban..."
            maxLength={500}
            characterCount={true}
            rows={3}
            sanitize={true}
            sanitizer={sanitizeStrict}
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center justify-center transition-colors"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Unbanning...
              </>
            ) : (
              <>
                <UserCheck size={16} className="mr-2" />
                Unban User
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
