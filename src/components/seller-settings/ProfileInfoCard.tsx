// src/components/seller-settings/ProfileInfoCard.tsx
'use client';

import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import React, { RefObject, useState, useEffect, useCallback } from 'react';
import { SecureInput, SecureTextarea } from '@/components/ui/SecureInput';
import { SecureImage } from '@/components/ui/SecureMessageDisplay';
import { sanitizeStrict, sanitizeCurrency } from '@/utils/security/sanitization';
import { securityService } from '@/services/security.service';
import { useProfileSave } from '@/hooks/seller-settings/useProfileSave';
import { z } from 'zod';

const PropsSchema = z.object({
  username: z.string().optional(),
  bio: z.string().default(''),
  setBio: z.function().args(z.string()).returns(z.void()),
  preview: z.string().nullable().optional(),
  profilePic: z.string().nullable().optional(),
  subscriptionPrice: z.string().default(''),
  setSubscriptionPrice: z.function().args(z.string()).returns(z.void()),
  handleProfilePicChange: z.function().args(z.any()).returns(z.void()),
  removeProfilePic: z.function().args().returns(z.void()),
  profilePicInputRef: z.any(),
  isUploading: z.boolean().optional(),
  onSave: z.function().args().returns(z.promise(z.boolean())).optional(),
});

interface ProfileInfoCardProps extends z.infer<typeof PropsSchema> {}

export default function ProfileInfoCard(rawProps: ProfileInfoCardProps) {
  const parsed = PropsSchema.safeParse(rawProps);
  const {
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
    isUploading = false,
    onSave,
  } = parsed.success
    ? parsed.data
    : {
        username: '',
        bio: '',
        setBio: () => {},
        preview: null,
        profilePic: null,
        subscriptionPrice: '',
        setSubscriptionPrice: () => {},
        handleProfilePicChange: () => {},
        removeProfilePic: () => {},
        profilePicInputRef: { current: null } as RefObject<HTMLInputElement | null>,
        isUploading: false,
        onSave: undefined,
      };

  const { debouncedSave, isSaving, saveSuccess, saveError } = useProfileSave();
  const [fileError, setFileError] = useState<string>('');
  const [touched, setTouched] = useState<{ bio?: boolean; price?: boolean }>({});
  const [lastSavedPrice, setLastSavedPrice] = useState(subscriptionPrice);
  const [showPriceSaving, setShowPriceSaving] = useState(false);

  // Sanitize username for display
  const sanitizedUsername = username ? sanitizeStrict(username) : '';

  // Handle secure file selection
  const handleSecureFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError('');
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = securityService.validateFileUpload(file, {
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
      allowedExtensions: ['jpg', 'jpeg', 'png', 'webp'],
    });

    if (!validation.valid) {
      setFileError(validation.error || 'Invalid file');
      try {
        if (e.target) e.target.value = '';
      } catch {
        /* ignore */
      }
      return;
    }

    // If valid, proceed with the original handler
    handleProfilePicChange(e);
  };

  // Handle price change with auto-save
  const handlePriceChange = useCallback((value: string) => {
    if (value === '') {
      setSubscriptionPrice('');
      setShowPriceSaving(true);
      debouncedSave({ subscriptionPrice: '0' });
    } else {
      const sanitized = sanitizeCurrency(value);
      const sanitizedStr = sanitized.toString();
      setSubscriptionPrice(sanitizedStr);
      setShowPriceSaving(true);
      debouncedSave({ subscriptionPrice: sanitizedStr });
    }
  }, [setSubscriptionPrice, debouncedSave]);

  // Handle bio change with auto-save
  const handleBioChange = useCallback((value: string) => {
    setBio(value);
    debouncedSave({ bio: value });
  }, [setBio, debouncedSave]);

  // Track when price is actually saved
  useEffect(() => {
    if (saveSuccess && showPriceSaving) {
      setLastSavedPrice(subscriptionPrice);
      setShowPriceSaving(false);
    }
  }, [saveSuccess, subscriptionPrice, showPriceSaving]);

  // Clear saving indicator when error occurs
  useEffect(() => {
    if (saveError && showPriceSaving) {
      setShowPriceSaving(false);
    }
  }, [saveError, showPriceSaving]);

  // Keyboard access for overlay
  const onOverlayKey = (ev: React.KeyboardEvent) => {
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      profilePicInputRef.current?.click();
    }
  };

  // Calculate if there are unsaved changes
  const hasUnsavedChanges = subscriptionPrice !== lastSavedPrice;

  return (
    <div className="bg-[#1a1a1a] rounded-xl shadow-lg border border-gray-800 p-6 relative">
      {/* Save Status Indicator */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        {isSaving && (
          <div className="flex items-center gap-2 text-yellow-500 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Saving...</span>
          </div>
        )}
        {saveSuccess && !isSaving && (
          <div className="flex items-center gap-2 text-green-500 text-sm animate-fade-in">
            <CheckCircle className="w-4 h-4" />
            <span>Saved</span>
          </div>
        )}
        {saveError && !isSaving && (
          <div className="flex items-center gap-2 text-red-500 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{sanitizeStrict(saveError)}</span>
          </div>
        )}
      </div>

      <h2 className="text-xl font-bold mb-6 text-white">Profile Info</h2>

      {/* Profile Picture Section */}
      <div className="flex flex-col items-center mb-6">
        <div className="w-32 h-32 rounded-full border-4 border-[#ff950e] bg-black flex items-center justify-center overflow-hidden mb-4 shadow-lg relative group">
          {isUploading ? (
            <div className="flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-2 border-[#ff950e] border-t-transparent rounded-full animate-spin mb-2"></div>
              <span className="text-xs text-[#ff950e]">Uploading...</span>
            </div>
          ) : preview || profilePic ? (
            <SecureImage src={preview || profilePic || ''} alt="Profile preview" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gray-700 flex items-center justify-center text-gray-400 text-4xl font-bold">
              {sanitizedUsername ? sanitizedUsername.charAt(0).toUpperCase() : '?'}
            </div>
          )}

          {!isUploading && (
            <div
              className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
              onClick={() => profilePicInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={onOverlayKey}
              aria-label="Change profile photo"
            >
              <div className="text-white text-xs font-medium bg-[#ff950e] rounded-full px-3 py-1">Change Photo</div>
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
          className={`w-24 h-auto object-contain transition-transform duration-200 ${
            isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-[1.02]'
          }`}
        />

        {/* File error message */}
        {fileError && (
          <p className="mt-2 text-xs text-red-400 flex items-center gap-1" role="alert" aria-live="assertive">
            <AlertCircle className="w-3 h-3" />
            {sanitizeStrict(fileError)}
          </p>
        )}
      </div>

      {/* Bio Section */}
      <div className="mb-6 w-full">
        <SecureTextarea
          label="Bio"
          id="bio"
          name="bio"
          value={bio}
          onChange={handleBioChange}
          onBlur={() => setTouched((prev) => ({ ...prev, bio: true }))}
          className="w-full p-3 border border-gray-700 rounded-lg bg-black text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ff950e] h-28 resize-none"
          placeholder="Tell buyers about yourself..."
          maxLength={500}
          characterCount={true}
          helpText="Describe yourself, your style, and what makes your items special"
          touched={touched.bio}
        />
        {isSaving && touched.bio && (
          <p className="text-xs text-yellow-500 mt-1">Auto-saving bio...</p>
        )}
      </div>

      {/* Subscription Price */}
      <div className="mb-4 w-full">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Subscription Price ($/month)
          {showPriceSaving && (
            <span className="ml-2 text-yellow-500 text-xs">
              <Loader2 className="inline w-3 h-3 animate-spin mr-1" />
              Saving...
            </span>
          )}
          {!showPriceSaving && hasUnsavedChanges && !isSaving && (
            <span className="ml-2 text-orange-500 text-xs">• Unsaved</span>
          )}
        </label>
        <SecureInput
          id="subscriptionPrice"
          name="subscriptionPrice"
          type="number"
          value={subscriptionPrice}
          onChange={handlePriceChange}
          onBlur={() => setTouched((prev) => ({ ...prev, price: true }))}
          className="w-full px-4 py-3 border border-gray-700 rounded-lg bg-black text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
          placeholder="19.99"
          min="0"
          max="999.99"
          step="0.01"
          touched={touched.price}
          helpText="This is what buyers will pay to access your premium content (auto-saves as you type)"
        />
      </div>

      {/* Save notification for manual save button if onSave is provided */}
      {onSave && hasUnsavedChanges && (
        <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-600/30 rounded-lg">
          <p className="text-sm text-yellow-500 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            You have unsaved changes. Click "Save Profile" to save all changes.
          </p>
        </div>
      )}
    </div>
  );
}
