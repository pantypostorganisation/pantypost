// src/components/buyers/messages/CustomRequestModal.tsx
'use client';

import React from 'react';
import { X, Package, Send } from 'lucide-react';

interface CustomRequestModalProps {
  show: boolean;
  onClose: () => void;
  activeThread: string;
  customRequestForm: {
    title: string;
    price: string;
    description: string;
  };
  setCustomRequestForm: (form: { title: string; price: string; description: string }) => void;
  customRequestErrors: Record<string, string>;
  isSubmittingRequest: boolean;
  onSubmit: () => void;
}

export default function CustomRequestModal({
  show,
  onClose,
  activeThread,
  customRequestForm,
  setCustomRequestForm,
  customRequestErrors,
  isSubmittingRequest,
  onSubmit
}: CustomRequestModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] rounded-xl w-full max-w-lg border border-gray-800 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#ff950e]/20 rounded-full flex items-center justify-center">
              <Package className="w-5 h-5 text-[#ff950e]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Custom Request</h2>
              <p className="text-sm text-gray-400">To: {activeThread}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#222] rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        {/* Form */}
        <div className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Request Title *
            </label>
            <input
              type="text"
              value={customRequestForm.title}
              onChange={(e) => setCustomRequestForm({
                ...customRequestForm,
                title: e.target.value
              })}
              placeholder="What are you looking for?"
              className={`w-full bg-[#222] text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 ${
                customRequestErrors.title ? 'ring-2 ring-red-500' : 'focus:ring-[#ff950e]'
              }`}
            />
            {customRequestErrors.title && (
              <p className="mt-1 text-sm text-red-400">{customRequestErrors.title}</p>
            )}
          </div>
          
          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Offered Price ($) *
            </label>
            <input
              type="number"
              value={customRequestForm.price}
              onChange={(e) => setCustomRequestForm({
                ...customRequestForm,
                price: e.target.value
              })}
              placeholder="0.00"
              min="0"
              step="0.01"
              className={`w-full bg-[#222] text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 ${
                customRequestErrors.price ? 'ring-2 ring-red-500' : 'focus:ring-[#ff950e]'
              }`}
            />
            {customRequestErrors.price && (
              <p className="mt-1 text-sm text-red-400">{customRequestErrors.price}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              A 10% platform fee will be added to your payment
            </p>
          </div>
          
          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description *
            </label>
            <textarea
              value={customRequestForm.description}
              onChange={(e) => setCustomRequestForm({
                ...customRequestForm,
                description: e.target.value
              })}
              placeholder="Describe your request in detail..."
              rows={4}
              className={`w-full bg-[#222] text-white rounded-lg px-4 py-2 resize-none focus:outline-none focus:ring-2 ${
                customRequestErrors.description ? 'ring-2 ring-red-500' : 'focus:ring-[#ff950e]'
              }`}
            />
            {customRequestErrors.description && (
              <p className="mt-1 text-sm text-red-400">{customRequestErrors.description}</p>
            )}
          </div>
          
          {/* Info box */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-sm text-blue-400">
            <p className="font-medium mb-1">How Custom Requests Work:</p>
            <ul className="space-y-1 text-xs">
              <li>• The seller can accept, decline, or negotiate your request</li>
              <li>• You can edit your request until the seller accepts</li>
              <li>• Payment is only processed after you both agree</li>
              <li>• All communication stays within the platform</li>
            </ul>
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-800">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            disabled={isSubmittingRequest}
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={isSubmittingRequest}
            className="flex-1 px-4 py-2 bg-[#ff950e] text-black rounded-lg hover:bg-[#e88800] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmittingRequest ? (
              <>
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send size={16} />
                Send Request
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
