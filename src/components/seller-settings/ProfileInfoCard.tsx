// src/components/seller-settings/ProfileInfoCard.tsx
'use client';

import { Upload, X, AlertCircle } from 'lucide-react';
import { RefObject, useState } from 'react';
import { SecureInput, SecureTextarea } from '@/components/ui/SecureInput';
import { SecureImage } from '@/components/ui/SecureMessageDisplay';
import { sanitizeStrict, sanitizeCurrency } from '@/utils/security/sanitization';
import { securityService } from '@/services/security.service';

interface ProfileInfoCardProps {
  username?: string;
  bio: string;
  setBio: (bio: string) => void;
  preview: string | null;
  profilePic: string | null;
  subscriptionPrice: string;
  setSubscriptionPrice: (price: string) => void;
  handleProfilePicChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeProfilePic: () => void;
  profilePicInputRef: RefObject<HTMLInputElement | null>;
  isUploading?: boolean;
}

export default function ProfileInfoCard({
  username,
  bio,
  setBio,
  preview,
  profilePic,
  subscriptionPrice,
  setSubscriptionPrice,
  handleProfilePicChange,
  removeProfilePic,
  profilePicInputRef,
  isUploading = false
}: ProfileInfoCardProps) {
  const [fileError, setFileError] = useState<string>('');
  const [touched, setTouched] = useState<{ bio?: boolean; price?: boolean }>({});

  // Sanitize username for display
  const sanitizedUsername = username ? sanitizeStrict(username) : '';

  // Handle secure file selection
  const handleSecureFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError('');
    const file = e.target.files?.[0];
    
    if (!file) return;
    
    // Validate file
    const validation = securityService.validateFileUpload(file, {
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
      allowedExtensions: ['jpg', 'jpeg', 'png', 'webp']
    });
    
    if (!validation.valid) {
      setFileError(validation.error || 'Invalid file');
      // Clear the input
      if (e.target) e.target.value = '';
      return;
    }
    
    // If valid, proceed with the original handler
    handleProfilePicChange(e);
  };

  // Handle price change with sanitization
  const handlePriceChange = (value: string) => {
    if (value === '') {
      setSubscriptionPrice('');
    } else {
      const sanitized = sanitizeCurrency(value);
      setSubscriptionPrice(sanitized.toString());
    }
  };

  return (
    <div className="bg-[#1a1a1a] rounded-xl shadow-lg border border-gray-800 p-6">
      <h2 className="text-xl font-bold mb-6 text-white">Profile Info</h2>

      {/* Profile Picture Section */}
      <div className="flex flex-col items-center mb-6">
        <div className="w-32 h-32 rounded-full border-4 border-[#ff950e] bg-black flex items-center justify-center overflow-hidden mb-4 shadow-lg relative group">
          {isUploading ? (
            <div className="flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-3 border-[#ff950e] border-t-transparent rounded-full animate-spin mb-2"></div>
              <span className="text-xs text-[#ff950e]">Uploading...</span>
            </div>
          ) : preview || profilePic ? (
            <SecureImage
              src={preview || profilePic || ''}
              alt="Profile preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-700 flex items-center justify-center text-gray-400 text-4xl font-bold">
              {sanitizedUsername ? sanitizedUsername.charAt(0).toUpperCase() : '?'}
            </div>
          )}

          {!isUploading && (
            <div
              className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
              onClick={() => profilePicInputRef.current?.click()}
            >
              <div className="text-white text-xs font-medium bg-[#ff950e] rounded-full px-3 py-1">
                Change Photo
              </div>
            </div>
          )}
        </div>

        <input
          ref={profilePicInputRef}
          type="file"
          accept="image/*"
          onChange={handleSecureFileChange}
          className="hidden"
          disabled={isUploading}
        />

        <SecureImage
          src="/Upload_New_Picture.png"
          alt="Upload New Picture"
          onClick={() => !isUploading && profilePicInputRef.current?.click()}
          className={`w-24 h-auto object-contain cursor-pointer hover:scale-[1.02] transition-transform duration-200 ${
            isUploading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        />

        {/* File error message */}
        {fileError && (
          <p className="mt-2 text-xs text-red-400 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {fileError}
          </p>
        )}
      </div>

      {/* Bio Section */}
      <div className="mb-6">
        <SecureTextarea
          label="Bio"
          id="bio"
          name="bio"
          value={bio}
          onChange={setBio}
          onBlur={() => setTouched(prev => ({ ...prev, bio: true }))}
          className="w-full p-3 border border-gray-700 rounded-lg bg-black text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ff950e] h-28 resize-none"
          placeholder="Tell buyers about yourself..."
          maxLength={500}
          characterCount={true}
          helpText="Describe yourself, your style, and what makes your items special"
          touched={touched.bio}
        />
      </div>

      {/* Subscription Price */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Subscription Price ($/month)
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none z-10">
            <span className="text-gray-400">$</span>
          </div>
          <SecureInput
            id="subscriptionPrice"
            name="subscriptionPrice"
            type="number"
            value={subscriptionPrice}
            onChange={handlePriceChange}
            onBlur={() => setTouched(prev => ({ ...prev, price: true }))}
            className="w-full pl-8 p-3 border border-gray-700 rounded-lg bg-black text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
            placeholder="19.99"
            min="0"
            max="999.99"
            step="0.01"
            touched={touched.price}
            helpText="This is what buyers will pay to access your premium content"
          />
        </div>
      </div>
    </div>
  );
}
