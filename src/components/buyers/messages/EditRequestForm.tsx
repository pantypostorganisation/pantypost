// src/components/buyers/messages/EditRequestForm.tsx
'use client';

import React from 'react';
import { Save, X } from 'lucide-react';
import { SecureInput, SecureTextarea } from '@/components/ui/SecureInput';
import { SecureForm } from '@/components/ui/SecureForm';
import { sanitizeStrict } from '@/utils/security/sanitization';

interface EditRequestFormProps {
  editTitle: string;
  setEditTitle: (title: string) => void;
  editPrice: number | '';
  setEditPrice: (price: number | '') => void;
  editTags: string;
  setEditTags: (tags: string) => void;
  editMessage: string;
  setEditMessage: (message: string) => void;
  handleEditSubmit: () => void;
  setEditRequestId: (id: string | null) => void;
}

export default function EditRequestForm({
  editTitle,
  setEditTitle,
  editPrice,
  setEditPrice,
  editTags,
  setEditTags,
  editMessage,
  setEditMessage,
  handleEditSubmit,
  setEditRequestId
}: EditRequestFormProps) {
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

  // Tags sanitizer
  const tagsSanitizer = (value: string): string => {
    // Allow alphanumeric, spaces, commas, and hyphens
    return value
      .replace(/[^a-zA-Z0-9\s,-]/g, '')
      .slice(0, 200);
  };

  // Description sanitizer
  const descriptionSanitizer = (value: string): string => {
    return sanitizeStrict(value).slice(0, 500);
  };

  // Handle price change to work with SecureInput
  const handlePriceChange = (value: string) => {
    setEditPrice(value ? Number(value) : '');
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleEditSubmit();
  };

  return (
    <div className="bg-[#222] p-4 rounded-lg border border-[#ff950e]/30">
      <h4 className="font-semibold text-white mb-3">Edit Custom Request</h4>
      
      <SecureForm
        onSubmit={handleFormSubmit}
        className="relative"
      >
        <div className="space-y-3">
          {/* Title Input - SECURED */}
          <SecureInput
            label="Title"
            type="text"
            value={editTitle}
            onChange={setEditTitle}
            placeholder="Request title..."
            className="w-full !bg-[#1a1a1a] !text-white !border-0 focus:!ring-2 focus:!ring-[#ff950e]"
            sanitizer={titleSanitizer}
            maxLength={100}
          />
          
          {/* Price Input - SECURED */}
          <SecureInput
            label="Price ($)"
            type="text"
            value={editPrice.toString()}
            onChange={handlePriceChange}
            placeholder="0.00"
            className="w-full !bg-[#1a1a1a] !text-white !border-0 focus:!ring-2 focus:!ring-[#ff950e]"
            sanitizer={priceSanitizer}
          />
          
          {/* Tags Input - SECURED */}
          <SecureInput
            label="Tags (comma separated)"
            type="text"
            value={editTags}
            onChange={setEditTags}
            placeholder="tag1, tag2, tag3"
            className="w-full !bg-[#1a1a1a] !text-white !border-0 focus:!ring-2 focus:!ring-[#ff950e]"
            sanitizer={tagsSanitizer}
            maxLength={200}
            helpText="Use commas to separate tags"
          />
          
          {/* Description Textarea - SECURED */}
          <SecureTextarea
            label="Description"
            value={editMessage}
            onChange={setEditMessage}
            placeholder="Describe your request..."
            rows={3}
            className="w-full !bg-[#1a1a1a] !text-white !border-0 focus:!ring-2 focus:!ring-[#ff950e]"
            sanitizer={descriptionSanitizer}
            maxLength={500}
            characterCount={true}
          />
          
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setEditRequestId(null)}
              className="px-3 py-1.5 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors flex items-center gap-1"
            >
              <X size={14} />
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 bg-[#ff950e] text-black rounded text-sm hover:bg-[#e88800] transition-colors flex items-center gap-1 font-medium"
            >
              <Save size={14} />
              Save Changes
            </button>
          </div>
        </div>
      </SecureForm>
    </div>
  );
}