// src/components/myListings/ListingForm.tsx
'use client';

import { ListingFormProps } from '@/types/myListings';
import {
  Sparkles,
  Gavel,
  Lock as LockIcon,
  ImagePlus as ImageIcon,
  Upload,
  X,
  MoveVertical,
  Edit,
  AlertCircle,
  Crown,
  CheckCircle,
} from 'lucide-react';
import Link from 'next/link';
import { SecureInput, SecureTextarea } from '@/components/ui/SecureInput';
import { SecureForm } from '@/components/ui/SecureForm';
import { SecureImage } from '@/components/ui/SecureMessageDisplay';
import { useState, useCallback, useMemo } from 'react';
import { sanitizeStrict, sanitizeNumber, sanitizeCurrency } from '@/utils/security/sanitization';
import { securityService } from '@/services/security.service';
import { listingSchemas } from '@/utils/validation/schemas';
import { validateSchema } from '@/utils/validation/schemas';

// Character requirements from schemas
const VALIDATION_REQUIREMENTS = {
  title: { min: 5, max: 100 },
  description: { min: 20, max: 2000 },
  price: { min: 0.01, max: 10000 },
  tags: { max: 200 },
  hoursWorn: { min: 0, max: 999 }
};

interface ValidationState {
  title: { isValid: boolean; message: string; count: number };
  description: { isValid: boolean; message: string; count: number };
  price: { isValid: boolean; message: string };
  startingPrice: { isValid: boolean; message: string };
  reservePrice: { isValid: boolean; message: string };
  images: { isValid: boolean; message: string };
  tags: { isValid: boolean; message: string; count: number };
}

export default function ListingForm({
  formState,
  isEditing,
  isVerified,
  selectedFiles,
  isUploading,
  uploadProgress = 0,
  onFormChange,
  onFileSelect,
  onRemoveFile,
  onUploadFiles,
  onRemoveImage,
  onImageReorder,
  onSave,
  onCancel
}: ListingFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Real-time validation
  const validation = useMemo((): ValidationState => {
    const titleLength = formState.title.length;
    const descriptionLength = formState.description.length;
    const tagsLength = formState.tags.length;
    const totalImages = formState.imageUrls.length + selectedFiles.length;

    return {
      title: {
        count: titleLength,
        isValid: titleLength >= VALIDATION_REQUIREMENTS.title.min && titleLength <= VALIDATION_REQUIREMENTS.title.max,
        message: titleLength < VALIDATION_REQUIREMENTS.title.min 
          ? `Title needs at least ${VALIDATION_REQUIREMENTS.title.min} characters`
          : titleLength > VALIDATION_REQUIREMENTS.title.max 
          ? `Title exceeds ${VALIDATION_REQUIREMENTS.title.max} characters`
          : 'Perfect title length!'
      },
      description: {
        count: descriptionLength,
        isValid: descriptionLength >= VALIDATION_REQUIREMENTS.description.min && descriptionLength <= VALIDATION_REQUIREMENTS.description.max,
        message: descriptionLength < VALIDATION_REQUIREMENTS.description.min 
          ? `Description needs at least ${VALIDATION_REQUIREMENTS.description.min} characters`
          : descriptionLength > VALIDATION_REQUIREMENTS.description.max 
          ? `Description exceeds ${VALIDATION_REQUIREMENTS.description.max} characters`
          : 'Great description length!'
      },
      price: {
        isValid: formState.isAuction ? true : (parseFloat(formState.price) >= VALIDATION_REQUIREMENTS.price.min && parseFloat(formState.price) <= VALIDATION_REQUIREMENTS.price.max),
        message: !formState.isAuction && (isNaN(parseFloat(formState.price)) || parseFloat(formState.price) < VALIDATION_REQUIREMENTS.price.min) 
          ? `Price must be at least $${VALIDATION_REQUIREMENTS.price.min}`
          : !formState.isAuction && parseFloat(formState.price) > VALIDATION_REQUIREMENTS.price.max 
          ? `Price cannot exceed $${VALIDATION_REQUIREMENTS.price.max.toLocaleString()}`
          : 'Valid price'
      },
      startingPrice: {
        isValid: !formState.isAuction || (parseFloat(formState.startingPrice) >= VALIDATION_REQUIREMENTS.price.min && parseFloat(formState.startingPrice) <= VALIDATION_REQUIREMENTS.price.max),
        message: formState.isAuction && (isNaN(parseFloat(formState.startingPrice)) || parseFloat(formState.startingPrice) < VALIDATION_REQUIREMENTS.price.min) 
          ? `Starting bid must be at least $${VALIDATION_REQUIREMENTS.price.min}`
          : formState.isAuction && parseFloat(formState.startingPrice) > VALIDATION_REQUIREMENTS.price.max 
          ? `Starting bid cannot exceed $${VALIDATION_REQUIREMENTS.price.max.toLocaleString()}`
          : 'Valid starting bid'
      },
      reservePrice: {
        isValid: !formState.isAuction || !formState.reservePrice || parseFloat(formState.reservePrice) >= parseFloat(formState.startingPrice),
        message: formState.isAuction && formState.reservePrice && parseFloat(formState.reservePrice) < parseFloat(formState.startingPrice)
          ? 'Reserve price must be at least the starting bid'
          : 'Valid reserve price'
      },
      images: {
        isValid: totalImages > 0,
        message: totalImages === 0 ? 'At least one image is required' : `${totalImages} image${totalImages === 1 ? '' : 's'} selected`
      },
      tags: {
        count: tagsLength,
        isValid: tagsLength <= VALIDATION_REQUIREMENTS.tags.max,
        message: tagsLength > VALIDATION_REQUIREMENTS.tags.max 
          ? `Tags exceed ${VALIDATION_REQUIREMENTS.tags.max} characters`
          : 'Valid tags'
      }
    };
  }, [formState, selectedFiles.length]);

  // Check if form is valid overall
  const isFormValid = useMemo(() => {
    return validation.title.isValid && 
           validation.description.isValid && 
           validation.price.isValid &&
           validation.startingPrice.isValid &&
           validation.reservePrice.isValid &&
           validation.images.isValid &&
           validation.tags.isValid;
  }, [validation]);

  // Handle file selection with validation
  const handleSecureFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles: File[] = [];
    let fileErrors: string[] = [];
    
    files.forEach(file => {
      const validation = securityService.validateFileUpload(file, {
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
        allowedExtensions: ['jpg', 'jpeg', 'png', 'webp']
      });
      
      if (validation.valid) {
        validFiles.push(file);
      } else {
        fileErrors.push(validation.error || 'Invalid file');
      }
    });
    
    if (validFiles.length > 0) {
      onFileSelect({ target: { files: validFiles } } as any);
    }
    
    if (fileErrors.length > 0) {
      setErrors(prev => ({ ...prev, files: fileErrors.join(', ') }));
    } else {
      setErrors(prev => {
        const { files, ...rest } = prev;
        return rest;
      });
    }
  }, [onFileSelect]);

  // Comprehensive form validation before submission
  const validateForm = useCallback((): { isValid: boolean; errors: Record<string, string> } => {
    const newErrors: Record<string, string> = {};

    // Title validation
    if (!validation.title.isValid) {
      newErrors.title = validation.title.message;
    }

    // Description validation
    if (!validation.description.isValid) {
      newErrors.description = validation.description.message;
    }

    // Price validation
    if (formState.isAuction) {
      if (!validation.startingPrice.isValid) {
        newErrors.startingPrice = validation.startingPrice.message;
      }
      if (!validation.reservePrice.isValid) {
        newErrors.reservePrice = validation.reservePrice.message;
      }
    } else {
      if (!validation.price.isValid) {
        newErrors.price = validation.price.message;
      }
    }

    // Images validation
    if (!validation.images.isValid) {
      newErrors.images = validation.images.message;
    }

    // Tags validation
    if (!validation.tags.isValid) {
      newErrors.tags = validation.tags.message;
    }

    return {
      isValid: Object.keys(newErrors).length === 0,
      errors: newErrors
    };
  }, [validation, formState.isAuction]);

  // Handle secure form submission
  const handleSecureSave = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setErrors({});
    
    try {
      // Validate form
      const formValidation = validateForm();
      
      if (!formValidation.isValid) {
        setErrors(formValidation.errors);
        // Mark all invalid fields as touched
        const touchedFields = Object.keys(formValidation.errors).reduce(
          (acc, key) => ({ ...acc, [key]: true }), 
          {}
        );
        setTouched(prev => ({ ...prev, ...touchedFields }));
        return;
      }

      // Additional schema validation for extra safety
      if (!formState.isAuction) {
        const listingData = {
          title: formState.title,
          description: formState.description,
          price: parseFloat(formState.price),
          images: [...formState.imageUrls], // Convert to array for validation
          category: 'panties' as const, // Default category
          condition: 'worn_once' as const, // Default condition
          size: 'm' as const, // Default size
          tags: formState.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
          wearDuration: formState.hoursWorn ? parseInt(formState.hoursWorn.toString()) : undefined,
          listingType: 'regular' as const
        };

        const schemaValidation = validateSchema(listingSchemas.createListingSchema, listingData);
        
        if (!schemaValidation.success && schemaValidation.errors) {
          console.error('Schema validation failed:', schemaValidation.errors);
          setErrors(schemaValidation.errors);
          return;
        }
      }

      // If all validations pass, submit the form
      await onSave();
      
    } catch (error) {
      console.error('Form submission error:', error);
      setErrors({ submit: 'An error occurred while saving. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  }, [formState, isSubmitting, validateForm, onSave]);

  // Handle field blur
  const handleFieldBlur = useCallback((fieldName: string) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
  }, []);

  return (
    <SecureForm 
      onSubmit={handleSecureSave}
      rateLimitKey="listing_create"
      rateLimitConfig={{ maxAttempts: 10, windowMs: 60 * 60 * 1000 }}
    >
      <h2 className="text-2xl font-bold mb-6 text-white">
        {isEditing ? 'Edit Listing' : 'Create New Listing'}
      </h2>

      {/* Form validation summary */}
      {!isFormValid && Object.keys(touched).length > 0 && (
        <div className="mb-6 p-4 bg-red-900 bg-opacity-30 border border-red-700 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <h3 className="font-semibold text-red-300">Please fix the following issues:</h3>
          </div>
          <ul className="text-sm text-red-200 space-y-1">
            {!validation.title.isValid && <li>• {validation.title.message}</li>}
            {!validation.description.isValid && <li>• {validation.description.message}</li>}
            {!validation.price.isValid && <li>• {validation.price.message}</li>}
            {!validation.startingPrice.isValid && <li>• {validation.startingPrice.message}</li>}
            {!validation.reservePrice.isValid && <li>• {validation.reservePrice.message}</li>}
            {!validation.images.isValid && <li>• {validation.images.message}</li>}
            {!validation.tags.isValid && <li>• {validation.tags.message}</li>}
          </ul>
        </div>
      )}

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Title *
            <div className="flex items-center justify-between mt-1">
              <span className={`text-xs ${
                validation.title.isValid ? 'text-green-400' : 'text-red-400'
              }`}>
                {validation.title.message}
              </span>
              <span className={`text-xs ${
                validation.title.count < VALIDATION_REQUIREMENTS.title.min ? 'text-red-400' : 
                validation.title.count > VALIDATION_REQUIREMENTS.title.max ? 'text-red-400' : 
                'text-green-400'
              }`}>
                {validation.title.count}/{VALIDATION_REQUIREMENTS.title.max}
              </span>
            </div>
          </label>
          <div className="relative">
            <SecureInput
              type="text"
              placeholder="e.g. 'Black Lace Panties Worn 24 Hours'"
              value={formState.title}
              onChange={(value) => onFormChange({ title: value })}
              onBlur={() => handleFieldBlur('title')}
              maxLength={VALIDATION_REQUIREMENTS.title.max}
              className={`w-full p-3 border rounded-lg bg-black text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition ${
                validation.title.isValid ? 'border-green-600 focus:ring-green-500' : 'border-red-600 focus:ring-red-500'
              }`}
            />
            {validation.title.isValid && (
              <CheckCircle className="absolute right-3 top-3 w-5 h-5 text-green-400" />
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Description *
            <div className="flex items-center justify-between mt-1">
              <span className={`text-xs ${
                validation.description.isValid ? 'text-green-400' : 'text-red-400'
              }`}>
                {validation.description.message}
              </span>
              <span className={`text-xs ${
                validation.description.count < VALIDATION_REQUIREMENTS.description.min ? 'text-red-400' : 
                validation.description.count > VALIDATION_REQUIREMENTS.description.max ? 'text-red-400' : 
                'text-green-400'
              }`}>
                {validation.description.count}/{VALIDATION_REQUIREMENTS.description.max}
              </span>
            </div>
          </label>
          <div className="relative">
            <SecureTextarea
              placeholder="Describe your item in detail to attract buyers. Include material, color, how long worn, special features, etc."
              value={formState.description}
              onChange={(value) => onFormChange({ description: value })}
              onBlur={() => handleFieldBlur('description')}
              maxLength={VALIDATION_REQUIREMENTS.description.max}
              className={`w-full p-3 border rounded-lg bg-black text-white placeholder-gray-500 focus:outline-none focus:ring-2 h-32 transition ${
                validation.description.isValid ? 'border-green-600 focus:ring-green-500' : 'border-red-600 focus:ring-red-500'
              }`}
            />
            {validation.description.isValid && (
              <CheckCircle className="absolute right-3 top-3 w-5 h-5 text-green-400" />
            )}
          </div>
        </div>
        
        {/* Listing Type Selection */}
        <div className="bg-[#121212] p-4 rounded-lg border border-gray-700">
          <h3 className="text-lg font-medium mb-3 text-white">Listing Type</h3>
          <div className="flex flex-col sm:flex-row gap-4">
            <label className={`flex items-center gap-3 py-3 px-4 rounded-lg cursor-pointer border-2 transition flex-1 ${!formState.isAuction ? 'border-[#ff950e] bg-[#ff950e] bg-opacity-10' : 'border-gray-700 bg-black'}`}>
              <input
                type="radio"
                checked={!formState.isAuction}
                onChange={() => onFormChange({ isAuction: false })}
                className="sr-only"
              />
              <Sparkles className={`w-5 h-5 ${!formState.isAuction ? 'text-[#ff950e]' : 'text-gray-500'}`} />
              <div>
                <span className="font-medium">Standard Listing</span>
                <p className="text-xs text-gray-400 mt-1">Fixed price, first come first served</p>
              </div>
            </label>
            
            <div className="relative flex-1">
              <label 
                className={`flex items-center gap-3 py-3 px-4 rounded-lg cursor-pointer border-2 transition ${
                  formState.isAuction 
                    ? 'border-purple-600 bg-purple-600 bg-opacity-10' 
                    : 'border-gray-700 bg-black'
                } ${
                  !isVerified 
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:border-purple-500'
                }`}
              >
                <input
                  type="radio"
                  checked={formState.isAuction}
                  onChange={() => {
                    if (isVerified) {
                      onFormChange({ isAuction: true });
                    }
                  }}
                  disabled={!isVerified}
                  className="sr-only"
                />
                <Gavel className={`w-5 h-5 ${formState.isAuction ? 'text-purple-500' : 'text-gray-500'}`} />
                <div>
                  <span className="font-medium">Auction</span>
                  <p className="text-xs text-gray-400 mt-1">Let buyers bid, highest wins</p>
                </div>
              </label>
              
              {/* Lock overlay for unverified sellers */}
              {!isVerified && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-70 rounded-lg px-3 py-2">
                  <LockIcon className="w-6 h-6 text-yellow-500 mb-1" />
                  <span className="text-xs text-yellow-400 font-medium text-center">Verify your account to unlock auctions</span>
                  <Link 
                    href="/sellers/verify" 
                    className="mt-1 text-xs text-white bg-yellow-600 hover:bg-yellow-500 px-3 py-1 rounded-full font-medium transition"
                  >
                    Get Verified
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Show different price fields based on listing type */}
        {formState.isAuction ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Starting Bid ($) *
                {!validation.startingPrice.isValid && (
                  <span className="text-xs text-red-400 ml-2">{validation.startingPrice.message}</span>
                )}
              </label>
              <div className="relative">
                <SecureInput
                  type="number"
                  step="0.01"
                  placeholder="e.g. 9.99"
                  value={formState.startingPrice}
                  onChange={(value) => {
                    const sanitized = sanitizeCurrency(value);
                    onFormChange({ startingPrice: sanitized.toString() });
                  }}
                  onBlur={() => handleFieldBlur('startingPrice')}
                  min="0.01"
                  max="9999.99"
                  className={`w-full p-3 border rounded-lg bg-black text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition ${
                    validation.startingPrice.isValid ? 'border-green-600 focus:ring-green-500' : 'border-red-600 focus:ring-red-500'
                  }`}
                />
                {validation.startingPrice.isValid && (
                  <CheckCircle className="absolute right-3 top-3 w-5 h-5 text-green-400" />
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">Minimum price to start bidding</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Reserve Price ($)
                {!validation.reservePrice.isValid && (
                  <span className="text-xs text-red-400 ml-2">{validation.reservePrice.message}</span>
                )}
              </label>
              <div className="relative">
                <SecureInput
                  type="number"
                  step="0.01"
                  placeholder="e.g. 19.99"
                  value={formState.reservePrice}
                  onChange={(value) => {
                    const sanitized = sanitizeCurrency(value);
                    onFormChange({ reservePrice: sanitized.toString() });
                  }}
                  onBlur={() => handleFieldBlur('reservePrice')}
                  min="0"
                  max="9999.99"
                  className={`w-full p-3 border rounded-lg bg-black text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition ${
                    validation.reservePrice.isValid ? 'border-gray-700 focus:ring-purple-600' : 'border-red-600 focus:ring-red-500'
                  }`}
                />
                {validation.reservePrice.isValid && formState.reservePrice && (
                  <CheckCircle className="absolute right-3 top-3 w-5 h-5 text-green-400" />
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">Minimum winning bid price (hidden from buyers)</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Auction Duration</label>
              <select
                value={formState.auctionDuration}
                onChange={(e) => onFormChange({ auctionDuration: e.target.value })}
                className="w-full p-3 border border-gray-700 rounded-lg bg-black text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
              >
                <option value="0.000694">1 Minute (Testing)</option>
                <option value="1">1 Day</option>
                <option value="3">3 Days</option>
                <option value="5">5 Days</option>
                <option value="7">7 Days</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">How long the auction will last</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Price ($) *
                {!validation.price.isValid && (
                  <span className="text-xs text-red-400 ml-2">{validation.price.message}</span>
                )}
              </label>
              <div className="relative">
                <SecureInput
                  type="number"
                  step="0.01"
                  placeholder="e.g. 29.99"
                  value={formState.price}
                  onChange={(value) => {
                    const sanitized = sanitizeCurrency(value);
                    onFormChange({ price: sanitized.toString() });
                  }}
                  onBlur={() => handleFieldBlur('price')}
                  min="0.01"
                  max="9999.99"
                  className={`w-full p-3 border rounded-lg bg-black text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition ${
                    validation.price.isValid ? 'border-green-600 focus:ring-green-500' : 'border-red-600 focus:ring-red-500'
                  }`}
                />
                {validation.price.isValid && (
                  <CheckCircle className="absolute right-3 top-3 w-5 h-5 text-green-400" />
                )}
              </div>
            </div>
            {/* Image Upload Section */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Add Images *
                <span className={`text-xs ml-2 ${
                  validation.images.isValid ? 'text-green-400' : 'text-red-400'
                }`}>
                  {validation.images.message}
                </span>
              </label>
              <label className={`flex items-center justify-center gap-2 p-3 border-2 border-dashed rounded-lg bg-black hover:border-[#ff950e] transition cursor-pointer ${
                validation.images.isValid ? 'border-green-600' : 'border-gray-700'
              }`}>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleSecureFileSelect}
                  className="hidden"
                />
                <ImageIcon className={`w-5 h-5 ${validation.images.isValid ? 'text-green-400' : 'text-[#ff950e]'}`} />
                <span className="text-gray-300">Select images from your computer</span>
              </label>
              {errors.files && (
                <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.files}
                </p>
              )}
            </div>
          </div>
        )}
        
        {/* Image upload section for auction type */}
        {formState.isAuction && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Add Images *
              <span className={`text-xs ml-2 ${
                validation.images.isValid ? 'text-green-400' : 'text-red-400'
              }`}>
                {validation.images.message}
              </span>
            </label>
            <label className={`flex items-center justify-center gap-2 p-3 border-2 border-dashed rounded-lg bg-black hover:border-purple-600 transition cursor-pointer ${
              validation.images.isValid ? 'border-green-600' : 'border-gray-700'
            }`}>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleSecureFileSelect}
                className="hidden"
              />
              <ImageIcon className={`w-5 h-5 ${validation.images.isValid ? 'text-green-400' : 'text-purple-500'}`} />
              <span className="text-gray-300">Select images from your computer</span>
            </label>
            {errors.files && (
              <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.files}
              </p>
            )}
          </div>
        )}
        
        {/* Selected Files Preview */}
        {selectedFiles.length > 0 && (
          <div className="mt-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-300">{selectedFiles.length} file(s) selected</span>
              <button
                type="button"
                onClick={onUploadFiles}
                disabled={isUploading}
                className={`text-black px-4 py-2 rounded-lg font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${formState.isAuction ? 'bg-purple-500 hover:bg-purple-600' : 'bg-[#ff950e] hover:bg-[#e0850d]'}`}
              >
                {isUploading ? (
                  <>Uploading...</>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Add to Listing
                  </>
                )}
              </button>
            </div>

            {/* Upload Progress Bar */}
            {isUploading && (
              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Uploading images...</span>
                  <span>{sanitizeNumber(uploadProgress, 0, 100)}%</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      formState.isAuction ? 'bg-purple-500' : 'bg-[#ff950e]'
                    }`}
                    style={{ width: `${sanitizeNumber(uploadProgress, 0, 100)}%` }}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {selectedFiles.map((file, index) => (
                <div key={index} className="relative border border-gray-700 rounded-lg overflow-hidden group">
                  <SecureImage
                    src={URL.createObjectURL(file)}
                    alt={`Selected ${index + 1}`}
                    className="w-full h-24 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => onRemoveFile(index)}
                    className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 py-1 px-2">
                    <p className="text-xs text-white truncate">{sanitizeStrict(file.name)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Image Preview and Reordering */}
        {formState.imageUrls.length > 0 && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">Images (Drag to reorder)</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {formState.imageUrls.map((url, index) => (
                <div
                  key={index}
                  draggable
                  onDragStart={() => onImageReorder(index, index)}
                  onDragEnter={() => onImageReorder(index, index)}
                  onDragEnd={() => onImageReorder(index, index)}
                  onDragOver={(e) => e.preventDefault()}
                  className={`relative border rounded-lg overflow-hidden cursor-grab active:cursor-grabbing group ${index === 0 ? 'border-2 border-[#ff950e] shadow-md' : 'border-gray-700'}`}
                >
                  <SecureImage
                    src={url}
                    alt={`Listing Image ${index + 1}`}
                    className={`w-full object-cover ${index === 0 ? 'h-32 sm:h-40' : 'h-24 sm:h-32'}`}
                  />
                  {index === 0 && (
                    <span className="absolute top-2 left-2 bg-[#ff950e] text-black text-xs px-2 py-0.5 rounded-full font-bold">
                      Main
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => onRemoveImage(url)}
                    className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                    aria-label="Remove image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black bg-opacity-20">
                    <MoveVertical className="w-6 h-6 text-white" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Tags (comma separated)
            <span className={`text-xs ml-2 ${
              validation.tags.isValid ? 'text-green-400' : 'text-red-400'
            }`}>
              {validation.tags.count}/{VALIDATION_REQUIREMENTS.tags.max}
            </span>
          </label>
          <SecureInput
            type="text"
            placeholder="e.g. thong, black, lace, cotton, gym"
            value={formState.tags}
            onChange={(value) => onFormChange({ tags: value })}
            onBlur={() => handleFieldBlur('tags')}
            maxLength={VALIDATION_REQUIREMENTS.tags.max}
            className={`w-full p-3 border rounded-lg bg-black text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition ${
              validation.tags.isValid ? 'border-gray-700 focus:ring-[#ff950e]' : 'border-red-600 focus:ring-red-500'
            }`}
          />
          <p className="text-xs text-gray-500 mt-1">Help buyers find your items with relevant tags</p>
        </div>

        <div>
          <SecureInput
            label="Hours Worn (optional)"
            type="number"
            placeholder="e.g. 24"
            value={formState.hoursWorn?.toString() || ''}
            onChange={(value) => {
              const num = value === '' ? '' : sanitizeNumber(value, 0, 999);
              onFormChange({ hoursWorn: num });
            }}
            min="0"
            max="999"
          />
        </div>
        
        {/* Only show premium option for standard listings */}
        {!formState.isAuction && (
          <div className="mt-4">
            <label className={`flex items-center gap-3 py-4 px-5 border-2 rounded-lg cursor-pointer transition ${formState.isPremium ? 'border-[#ff950e] bg-[#ff950e] bg-opacity-10' : 'border-gray-700 bg-black'}`}>
              <input
                type="checkbox"
                checked={formState.isPremium}
                onChange={() => onFormChange({ isPremium: !formState.isPremium })}
                className="h-5 w-5 text-[#ff950e] focus:ring-[#ff950e] rounded border-gray-600 bg-black checked:bg-[#ff950e]"
              />
              <Crown className={`w-6 h-6 ${formState.isPremium ? 'text-[#ff950e]' : 'text-gray-500'}`} />
              <div>
                <span className={`font-semibold text-lg ${formState.isPremium ? 'text-white' : 'text-gray-300'}`}>Make Premium Listing</span>
                <p className={`text-sm mt-0.5 ${formState.isPremium ? 'text-gray-200' : 'text-gray-400'}`}>Only available to your subscribers</p>
              </div>
            </label>
          </div>
        )}
        
        {/* Auction information notice */}
        {formState.isAuction && (
          <div className="bg-purple-900 bg-opacity-30 border border-purple-700 rounded-lg p-4 mt-4">
            <div className="flex gap-3">
              <AlertCircle className="w-6 h-6 text-purple-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-purple-300 mb-1">Auction Information</h4>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>
                    • Auctions run for {formState.auctionDuration === '0.000694' ? '1 minute' : `${formState.auctionDuration} day${parseInt(formState.auctionDuration) !== 1 ? 's' : ''}`} from the time you create the listing
                  </li>
                  <li>• Bidders must have sufficient funds in their wallet to place a bid</li>
                  <li>• If the reserve price is met, the highest bidder automatically purchases the item when the auction ends</li>
                  <li>• You can cancel an auction at any time before it ends</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Submit errors */}
        {errors.submit && (
          <div className="text-red-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {errors.submit}
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row gap-4 mt-6">
          <button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className={`w-full sm:flex-1 text-black px-6 py-3 rounded-lg font-bold text-lg transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
              formState.isAuction ? 'bg-purple-500 hover:bg-purple-600' : 'bg-[#ff950e] hover:bg-[#e0850d]'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : isEditing ? (
              <>
                <Edit className="w-5 h-5" />
                Save Changes
              </>
            ) : formState.isAuction ? (
              <>
                <Gavel className="w-5 h-5" />
                Create Auction
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Create Listing
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="w-full sm:flex-1 bg-gray-700 text-white px-6 py-3 rounded-lg hover:bg-gray-600 font-medium text-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </SecureForm>
  );
}
