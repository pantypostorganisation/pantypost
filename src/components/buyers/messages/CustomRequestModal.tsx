// src/components/buyers/messages/CustomRequestModal.tsx
'use client';

import React from 'react';
import {
  X,
  AlertTriangle,
  DollarSign,
  Package
} from 'lucide-react';

// Calculate the total cost with platform fee
const calculateTotalCost = (basePrice: string) => {
  const price = parseFloat(basePrice);
  if (isNaN(price) || price <= 0) return 0;
  return Math.round(price * 1.1 * 100) / 100;
};

interface CustomRequestForm {
  title: string;
  price: string;
  description: string;
}

interface CustomRequestModalProps {
  show: boolean;
  onClose: () => void;
  activeThread: string;
  customRequestForm: CustomRequestForm;
  setCustomRequestForm: React.Dispatch<React.SetStateAction<CustomRequestForm>>;
  customRequestErrors: Record<string, string>;
  isSubmittingRequest: boolean;
  onSubmit: () => void;
  wallet: { [username: string]: number };
  user: { username: string } | null;
}

export default function CustomRequestModal({
  show,
  onClose,
  activeThread,
  customRequestForm,
  setCustomRequestForm,
  customRequestErrors,
  isSubmittingRequest,
  onSubmit,
  wallet,
  user
}: CustomRequestModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50 p-4">
      <div className="bg-[#1a1a1a] rounded-xl max-w-md w-full shadow-2xl border border-gray-800 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-800">
          <div className="flex items-center">
            <div className="relative mr-2 flex items-center justify-center">
              <div className="bg-white w-6 h-6 rounded-full absolute"></div>
              <img src="/Custom_Request_Icon.png" alt="Custom Request" className="w-8 h-8 relative z-10" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Custom Request</h3>
              <p className="text-sm text-gray-400">Send to {activeThread}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1"
          >
            <X size={24} />
          </button>
        </div>
        
        {/* Modal Content */}
        <div className="p-6 space-y-4">
          {/* Title Field */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Request Title *
            </label>
            <input
              type="text"
              value={customRequestForm.title}
              onChange={(e) => setCustomRequestForm((prev: CustomRequestForm) => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Custom worn panties with special requests"
              className={`w-full p-3 rounded-lg bg-[#222] border ${
                customRequestErrors.title ? 'border-red-500' : 'border-gray-700'
              } text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e]`}
              maxLength={100}
            />
            {customRequestErrors.title && (
              <p className="text-red-400 text-xs mt-1 flex items-center">
                <AlertTriangle size={12} className="mr-1" />
                {customRequestErrors.title}
              </p>
            )}
          </div>
          
          {/* Price Field with Total Display */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Your Price *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <DollarSign size={16} className="text-gray-400" />
              </div>
              <input
                type="number"
                value={customRequestForm.price}
                onChange={(e) => setCustomRequestForm((prev: CustomRequestForm) => ({ ...prev, price: e.target.value }))}
                placeholder="0.00"
                min="0.01"
                step="0.01"
                className={`w-full pl-10 pr-4 p-3 rounded-lg bg-[#222] border ${
                  customRequestErrors.price ? 'border-red-500' : 'border-gray-700'
                } text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e]`}
              />
            </div>
            {customRequestErrors.price && (
              <p className="text-red-400 text-xs mt-1 flex items-center">
                <AlertTriangle size={12} className="mr-1" />
                {customRequestErrors.price}
              </p>
            )}
            {/* Total cost display */}
            {customRequestForm.price && !isNaN(parseFloat(customRequestForm.price)) && parseFloat(customRequestForm.price) > 0 && (
              <div className="mt-2 p-3 bg-[#ff950e]/10 border border-[#ff950e]/30 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Base Price:</span>
                  <span className="text-white">${parseFloat(customRequestForm.price).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Platform Fee (10%):</span>
                  <span className="text-white">${(parseFloat(customRequestForm.price) * 0.1).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-[#ff950e]/30 pt-2 mt-2">
                  <span className="text-[#ff950e]">Total You'll Pay:</span>
                  <span className="text-[#ff950e]">${calculateTotalCost(customRequestForm.price).toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Description Field */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Request Details *
            </label>
            <textarea
              value={customRequestForm.description}
              onChange={(e) => setCustomRequestForm((prev: CustomRequestForm) => ({ ...prev, description: e.target.value }))}
              placeholder="Describe exactly what you're looking for, including any special requests, wearing time, activities, etc."
              rows={4}
              className={`w-full p-3 rounded-lg bg-[#222] border ${
                customRequestErrors.description ? 'border-red-500' : 'border-gray-700'
              } text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e] resize-none`}
              maxLength={500}
            />
            {customRequestErrors.description && (
              <p className="text-red-400 text-xs mt-1 flex items-center">
                <AlertTriangle size={12} className="mr-1" />
                {customRequestErrors.description}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              {customRequestForm.description.length}/500 characters
            </p>
          </div>
          
          {/* Balance Check */}
          {user && wallet && customRequestForm.price && !isNaN(parseFloat(customRequestForm.price)) && parseFloat(customRequestForm.price) > 0 && (
            <div className="p-3 bg-[#222] rounded-lg border border-gray-700">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Your Wallet Balance:</span>
                <span className="text-white font-medium">${(wallet[user.username] || 0).toFixed(2)}</span>
              </div>
              {wallet[user.username] < calculateTotalCost(customRequestForm.price) && (
                <p className="text-red-400 text-xs mt-2 flex items-center">
                  <AlertTriangle size={12} className="mr-1" />
                  Insufficient balance. You'll need ${(calculateTotalCost(customRequestForm.price) - (wallet[user.username] || 0)).toFixed(2)} more.
                </p>
              )}
            </div>
          )}
        </div>
        
        {/* Modal Footer */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 p-6 border-t border-gray-800">
          <button
            onClick={onClose}
            disabled={isSubmittingRequest}
            className="px-6 py-2 bg-[#333] text-white rounded-lg hover:bg-[#444] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={isSubmittingRequest || !customRequestForm.title.trim() || !customRequestForm.price.trim() || !customRequestForm.description.trim()}
            className="px-6 py-2 bg-[#ff950e] text-black font-bold rounded-lg hover:bg-[#e88800] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isSubmittingRequest ? (
              <>
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
                Sending...
              </>
            ) : (
              <>
                <Package size={16} className="mr-2" />
                Send Request
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
