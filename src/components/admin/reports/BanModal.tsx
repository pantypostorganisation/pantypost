// src/components/admin/reports/BanModal.tsx
'use client';

import { Ban } from 'lucide-react';
import { BanModalProps } from './types';

export default function BanModal({
  isOpen,
  banForm,
  setBanForm,
  isProcessing,
  onClose,
  onConfirm
}: BanModalProps) {
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6 max-w-md w-full">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center">
          <Ban className="mr-2 text-red-400" />
          Manual Ban Decision
        </h3>
        
        <div className="space-y-4">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Username</label>
            <input
              type="text"
              value={banForm.username}
              onChange={(e) => setBanForm(prev => ({ ...prev, username: e.target.value }))}
              className="w-full px-3 py-2 bg-[#222] border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
              placeholder="Enter username to ban"
            />
          </div>

          {/* Ban Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Ban Type</label>
            <select
              value={banForm.banType}
              onChange={(e) => setBanForm(prev => ({ ...prev, banType: e.target.value as 'temporary' | 'permanent' }))}
              className="w-full px-3 py-2 bg-[#222] border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
            >
              <option value="temporary">Temporary</option>
              <option value="permanent">Permanent</option>
            </select>
          </div>

          {/* Duration (for temporary bans) */}
          {banForm.banType === 'temporary' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Duration (hours)</label>
              <input
                type="number"
                value={banForm.hours}
                onChange={(e) => setBanForm(prev => ({ ...prev, hours: e.target.value }))}
                className="w-full px-3 py-2 bg-[#222] border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
                min="1"
                placeholder="24"
              />
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Reason</label>
            <select
              value={banForm.reason}
              onChange={(e) => setBanForm(prev => ({ ...prev, reason: e.target.value as any }))}
              className="w-full px-3 py-2 bg-[#222] border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
            >
              <option value="harassment">Harassment</option>
              <option value="scam">Scam/Fraud</option>
              <option value="spam">Spam</option>
              <option value="inappropriate_content">Inappropriate Content</option>
              <option value="underage">Underage</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Custom Reason */}
          {banForm.reason === 'other' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Custom Reason</label>
              <input
                type="text"
                value={banForm.customReason}
                onChange={(e) => setBanForm(prev => ({ ...prev, customReason: e.target.value }))}
                className="w-full px-3 py-2 bg-[#222] border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
                placeholder="Specify reason..."
              />
            </div>
          )}

          {/* Additional Details */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Additional Details</label>
            <input
              type="text"
              value={banForm.notes.split('\n')[0] || ''}
              onChange={(e) => setBanForm(prev => ({ ...prev, notes: e.target.value + '\n' + (prev.notes.split('\n')[1] || '') }))}
              className="w-full px-3 py-2 bg-[#222] border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
              placeholder="Additional details..."
            />
          </div>
          
          {/* Admin Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Admin Notes</label>
            <textarea
              value={banForm.notes.split('\n').slice(1).join('\n')}
              onChange={(e) => setBanForm(prev => ({ ...prev, notes: (prev.notes.split('\n')[0] || '') + '\n' + e.target.value }))}
              className="w-full px-3 py-2 bg-[#222] border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
              rows={3}
              placeholder="Internal notes about this ban..."
            />
          </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            disabled={isProcessing}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center justify-center transition-colors"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Applying...
              </>
            ) : (
              <>
                <Ban size={16} className="mr-2" />
                Apply Ban
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
