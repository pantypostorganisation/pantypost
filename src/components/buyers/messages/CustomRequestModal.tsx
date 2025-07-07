// src/components/buyers/messages/CustomRequestModal.tsx
'use client';

import React from 'react';
import {
  X,
  AlertTriangle,
  DollarSign,
  Package
} from 'lucide-react';
import { SecureInput, SecureTextarea } from '@/components/ui/SecureInput';
import { SecureForm } from '@/components/ui/SecureForm';
import { sanitizeStrict, sanitizeCurrency } from '@/utils/security/sanitization';
import { RATE_LIMITS } from '@/utils/security/rate-limiter';

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

  // Title sanitizer
  const titleSanitizer = (value: string): string => {
    return sanitizeStrict(value).slice(0, 100);
  };

  // Price sanitizer that returns string
  const priceSanitizer = (value: string): string => {
    // Remove any non-numeric characters except decimal point
    const cleaned = value.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Limit to 2 decimal places
    if (parts.length === 2 && parts[1].length > 2) {
      return parts[0] + '.' + parts[1].slice(0, 2);
    }
    
    return cleaned;
  };

  // Description sanitizer
  const descriptionSanitizer = (value: string): string => {
    return sanitizeStrict(value).slice(0, 500);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

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
              <p className="text-sm text-gray-400">Send to {sanitizeStrict(activeThread)}</p>
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
        <SecureForm
          onSubmit={handleFormSubmit}
          className="relative"
          rateLimitKey="custom_request"
          rateLimitConfig={RATE_LIMITS.CUSTOM_REQUEST}
        >
          <div className="p-6 space-y-4">
            {/* Title Field - SECURED */}
            <SecureInput
              label="Request Title *"
              type="text"
              value={customRequestForm.title}
              onChange={(value) => setCustomRequestForm((prev: CustomRequestForm) => ({ ...prev, title: value }))}
              placeholder="e.g., Custom worn panties with special requests"
              className="w-full !bg-[#222] !text-white !border-gray-700 focus:!ring-[#ff950e]"
              error={customRequestErrors.title}
              touched={!!customRequestForm.title}
              sanitizer={titleSanitizer}
              maxLength={100}
              characterCount={false}
            />
            
            {/* Price Field with Total Display - SECURED */}
            <div>
              <div className="relative">
                <SecureInput
                  label="Your Price *"
                  type="text"
                  value={customRequestForm.price}
                  onChange={(value) => setCustomRequestForm((prev: CustomRequestForm) => ({ ...prev, price: value }))}
                  placeholder="0.00"
                  className="w-full pl-10 !bg-[#222] !text-white !border-gray-700 focus:!ring-[#ff950e]"
                  error={customRequestErrors.price}
                  touched={!!customRequestForm.price}
                  sanitizer={priceSanitizer}
                />
                <div className="absolute left-3 top-[38px] pointer-events-none">
                  <DollarSign size={16} className="text-gray-400" />
                </div>
              </div>
              
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
            
            {/* Description Field - SECURED */}
            <div>
              <SecureTextarea
                label="Request Details *"
                value={customRequestForm.description}
                onChange={(value) => setCustomRequestForm((prev: CustomRequestForm) => ({ ...prev, description: value }))}
                placeholder="Describe exactly what you're looking for, including any special requests, wearing time, activities, etc."
                rows={4}
                className="w-full !bg-[#222] !text-white !border-gray-700 focus:!ring-[#ff950e]"
                error={customRequestErrors.description}
                touched={!!customRequestForm.description}
                sanitizer={descriptionSanitizer}
                maxLength={500}
                characterCount={true}
              />
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
              type="button"
              onClick={onClose}
              disabled={isSubmittingRequest}
              className="px-6 py-2 bg-[#333] text-white rounded-lg hover:bg-[#444] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
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
        </SecureForm>
      </div>
    </div>
  );
}