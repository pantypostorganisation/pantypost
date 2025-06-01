'use client';

import { useState, useEffect } from 'react';
import { X, MapPin, Home, Building, CheckCircle, AlertCircle } from 'lucide-react';

type AddressConfirmationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (address: DeliveryAddress) => void;
  existingAddress?: DeliveryAddress | null;
  orderId: string;
};

export type DeliveryAddress = {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  specialInstructions?: string;
};

// Sanitization function to prevent XSS attacks
const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  // Remove any HTML tags and dangerous characters
  return input
    .replace(/[<>]/g, '') // Remove < and > to prevent HTML injection
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers like onclick=
    .replace(/script\s*:/gi, '') // Remove script: protocol
    .replace(/data:/gi, '') // Remove data: URLs
    .replace(/vbscript:/gi, '') // Remove vbscript: protocol
    .replace(/&(?!(amp|lt|gt|quot|#39|#x27|#x2F);)/g, '&amp;') // Escape & except for already escaped entities
    .replace(/"/g, '&quot;') // Escape quotes
    .replace(/'/g, '&#x27;') // Escape single quotes
    .replace(/\//g, '&#x2F;') // Escape forward slashes
    .trim()
    .slice(0, 500); // Limit length to prevent buffer overflow attacks
};

// Validation function for postal codes
const isValidPostalCode = (postalCode: string, country: string): boolean => {
  // Basic validation - can be expanded based on country
  const patterns: { [key: string]: RegExp } = {
    'United States': /^\d{5}(-\d{4})?$/,
    'Canada': /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/,
    'United Kingdom': /^[A-Za-z]{1,2}\d{1,2}[A-Za-z]?\s?\d[A-Za-z]{2}$/,
    'Australia': /^\d{4}$/,
    'Default': /^[\w\s-]{3,10}$/ // Generic pattern
  };
  
  const pattern = patterns[country] || patterns['Default'];
  return pattern.test(postalCode);
};

// Validation function for names
const isValidName = (name: string): boolean => {
  // Allow letters, spaces, hyphens, apostrophes, and periods
  // Block suspicious patterns
  const validNamePattern = /^[a-zA-Z\s\-'.]{2,100}$/;
  const suspiciousPatterns = [
    /script/i,
    /select.*from/i,
    /union.*select/i,
    /insert.*into/i,
    /drop.*table/i,
    /<[^>]*>/,
    /javascript:/i
  ];
  
  if (!validNamePattern.test(name)) return false;
  
  return !suspiciousPatterns.some(pattern => pattern.test(name));
};

export default function AddressConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  existingAddress,
  orderId
}: AddressConfirmationModalProps) {
  const [address, setAddress] = useState<DeliveryAddress>({
    fullName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    specialInstructions: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Load existing address if available
  useEffect(() => {
    if (existingAddress) {
      // Sanitize existing address data when loading
      setAddress({
        fullName: sanitizeInput(existingAddress.fullName || ''),
        addressLine1: sanitizeInput(existingAddress.addressLine1 || ''),
        addressLine2: sanitizeInput(existingAddress.addressLine2 || ''),
        city: sanitizeInput(existingAddress.city || ''),
        state: sanitizeInput(existingAddress.state || ''),
        postalCode: sanitizeInput(existingAddress.postalCode || ''),
        country: sanitizeInput(existingAddress.country || ''),
        specialInstructions: sanitizeInput(existingAddress.specialInstructions || '')
      });
    }
  }, [existingAddress]);

  if (!isOpen) return null;

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Validate and sanitize full name
    if (!address.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (!isValidName(address.fullName)) {
      newErrors.fullName = 'Please enter a valid name (letters, spaces, hyphens, and apostrophes only)';
    } else if (address.fullName.length < 2) {
      newErrors.fullName = 'Name must be at least 2 characters long';
    } else if (address.fullName.length > 100) {
      newErrors.fullName = 'Name must be less than 100 characters';
    }
    
    // Validate address line 1
    if (!address.addressLine1.trim()) {
      newErrors.addressLine1 = 'Address line 1 is required';
    } else if (address.addressLine1.length < 5) {
      newErrors.addressLine1 = 'Address must be at least 5 characters long';
    } else if (address.addressLine1.length > 200) {
      newErrors.addressLine1 = 'Address must be less than 200 characters';
    }
    
    // Validate city
    if (!address.city.trim()) {
      newErrors.city = 'City is required';
    } else if (!isValidName(address.city)) {
      newErrors.city = 'Please enter a valid city name';
    } else if (address.city.length < 2) {
      newErrors.city = 'City name must be at least 2 characters long';
    } else if (address.city.length > 100) {
      newErrors.city = 'City name must be less than 100 characters';
    }
    
    // Validate state/province
    if (!address.state.trim()) {
      newErrors.state = 'State/Province is required';
    } else if (address.state.length < 2) {
      newErrors.state = 'State/Province must be at least 2 characters long';
    } else if (address.state.length > 100) {
      newErrors.state = 'State/Province must be less than 100 characters';
    }
    
    // Validate postal code
    if (!address.postalCode.trim()) {
      newErrors.postalCode = 'Postal/ZIP code is required';
    } else if (!isValidPostalCode(address.postalCode, address.country)) {
      newErrors.postalCode = 'Please enter a valid postal/ZIP code for your country';
    }
    
    // Validate country
    if (!address.country.trim()) {
      newErrors.country = 'Country is required';
    } else if (!isValidName(address.country)) {
      newErrors.country = 'Please enter a valid country name';
    } else if (address.country.length < 2) {
      newErrors.country = 'Country name must be at least 2 characters long';
    } else if (address.country.length > 100) {
      newErrors.country = 'Country name must be less than 100 characters';
    }
    
    // Validate special instructions if provided
    if (address.specialInstructions && address.specialInstructions.length > 500) {
      newErrors.specialInstructions = 'Special instructions must be less than 500 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      setIsSubmitting(true);
      
      // Create sanitized address object for submission
      const sanitizedAddress: DeliveryAddress = {
        fullName: sanitizeInput(address.fullName),
        addressLine1: sanitizeInput(address.addressLine1),
        addressLine2: address.addressLine2 ? sanitizeInput(address.addressLine2) : undefined,
        city: sanitizeInput(address.city),
        state: sanitizeInput(address.state),
        postalCode: sanitizeInput(address.postalCode),
        country: sanitizeInput(address.country),
        specialInstructions: address.specialInstructions ? sanitizeInput(address.specialInstructions) : undefined
      };
      
      // Simulate a slight delay for better UX
      setTimeout(() => {
        onConfirm(sanitizedAddress);
        setSubmitSuccess(true);
        
        setTimeout(() => {
          onClose();
          setIsSubmitting(false);
          setSubmitSuccess(false);
        }, 1000);
      }, 800);
    }
  };

  const handleChange = (field: keyof DeliveryAddress, value: string) => {
    // Sanitize input in real-time with basic length limits
    const sanitizedValue = sanitizeInput(value);
    
    // Apply field-specific length limits
    const maxLengths: Record<keyof DeliveryAddress, number> = {
      fullName: 100,
      addressLine1: 200,
      addressLine2: 200,
      city: 100,
      state: 100,
      postalCode: 20,
      country: 100,
      specialInstructions: 500
    };
    
    const maxLength = maxLengths[field];
    const finalValue = sanitizedValue.slice(0, maxLength);
    
    setAddress(prev => ({
      ...prev,
      [field]: finalValue
    }));
    
    // Clear error for this field if it exists
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50 p-4">
      <div className="bg-[#1a1a1a] rounded-xl w-full max-w-lg shadow-2xl p-6 border border-gray-800 max-h-[90vh] overflow-y-auto">
        {submitSuccess ? (
          <div className="text-center py-10">
            <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Address Confirmed!</h2>
            <p className="text-gray-400">Your delivery information has been saved.</p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white flex items-center">
                <MapPin className="mr-2 text-[#ff950e]" />
                Confirm Delivery Address
              </h2>
              <button 
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={address.fullName}
                  onChange={(e) => handleChange('fullName', e.target.value)}
                  className={`w-full p-3 rounded-lg bg-[#222] border ${errors.fullName ? 'border-red-500' : 'border-gray-700'} text-white focus:outline-none focus:ring-1 focus:ring-[#ff950e]`}
                  placeholder="John Doe"
                  maxLength={100}
                  aria-invalid={!!errors.fullName}
                  aria-describedby={errors.fullName ? 'fullName-error' : undefined}
                />
                {errors.fullName && (
                  <p id="fullName-error" className="text-red-500 text-xs mt-1 flex items-center">
                    <AlertCircle size={12} className="mr-1" />
                    {errors.fullName}
                  </p>
                )}
              </div>
              
              {/* Address Line 1 */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Address Line 1
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={address.addressLine1}
                    onChange={(e) => handleChange('addressLine1', e.target.value)}
                    className={`w-full p-3 pl-10 rounded-lg bg-[#222] border ${errors.addressLine1 ? 'border-red-500' : 'border-gray-700'} text-white focus:outline-none focus:ring-1 focus:ring-[#ff950e]`}
                    placeholder="123 Main Street"
                    maxLength={200}
                    aria-invalid={!!errors.addressLine1}
                    aria-describedby={errors.addressLine1 ? 'addressLine1-error' : undefined}
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Home size={16} className="text-gray-500" />
                  </div>
                </div>
                {errors.addressLine1 && (
                  <p id="addressLine1-error" className="text-red-500 text-xs mt-1 flex items-center">
                    <AlertCircle size={12} className="mr-1" />
                    {errors.addressLine1}
                  </p>
                )}
              </div>
              
              {/* Address Line 2 */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Address Line 2 <span className="text-gray-500 text-xs">(Optional)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={address.addressLine2}
                    onChange={(e) => handleChange('addressLine2', e.target.value)}
                    className="w-full p-3 pl-10 rounded-lg bg-[#222] border border-gray-700 text-white focus:outline-none focus:ring-1 focus:ring-[#ff950e]"
                    placeholder="Apt 4B, Floor 2, etc."
                    maxLength={200}
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building size={16} className="text-gray-500" />
                  </div>
                </div>
              </div>
              
              {/* City, State, Postal Code */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={address.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    className={`w-full p-3 rounded-lg bg-[#222] border ${errors.city ? 'border-red-500' : 'border-gray-700'} text-white focus:outline-none focus:ring-1 focus:ring-[#ff950e]`}
                    placeholder="New York"
                    maxLength={100}
                    aria-invalid={!!errors.city}
                    aria-describedby={errors.city ? 'city-error' : undefined}
                  />
                  {errors.city && (
                    <p id="city-error" className="text-red-500 text-xs mt-1 flex items-center">
                      <AlertCircle size={12} className="mr-1" />
                      {errors.city}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    State/Province
                  </label>
                  <input
                    type="text"
                    value={address.state}
                    onChange={(e) => handleChange('state', e.target.value)}
                    className={`w-full p-3 rounded-lg bg-[#222] border ${errors.state ? 'border-red-500' : 'border-gray-700'} text-white focus:outline-none focus:ring-1 focus:ring-[#ff950e]`}
                    placeholder="NY"
                    maxLength={100}
                    aria-invalid={!!errors.state}
                    aria-describedby={errors.state ? 'state-error' : undefined}
                  />
                  {errors.state && (
                    <p id="state-error" className="text-red-500 text-xs mt-1 flex items-center">
                      <AlertCircle size={12} className="mr-1" />
                      {errors.state}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    ZIP/Postal Code
                  </label>
                  <input
                    type="text"
                    value={address.postalCode}
                    onChange={(e) => handleChange('postalCode', e.target.value)}
                    className={`w-full p-3 rounded-lg bg-[#222] border ${errors.postalCode ? 'border-red-500' : 'border-gray-700'} text-white focus:outline-none focus:ring-1 focus:ring-[#ff950e]`}
                    placeholder="10001"
                    maxLength={20}
                    aria-invalid={!!errors.postalCode}
                    aria-describedby={errors.postalCode ? 'postalCode-error' : undefined}
                  />
                  {errors.postalCode && (
                    <p id="postalCode-error" className="text-red-500 text-xs mt-1 flex items-center">
                      <AlertCircle size={12} className="mr-1" />
                      {errors.postalCode}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Country */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Country
                </label>
                <input
                  type="text"
                  value={address.country}
                  onChange={(e) => handleChange('country', e.target.value)}
                  className={`w-full p-3 rounded-lg bg-[#222] border ${errors.country ? 'border-red-500' : 'border-gray-700'} text-white focus:outline-none focus:ring-1 focus:ring-[#ff950e]`}
                  placeholder="United States"
                  maxLength={100}
                  aria-invalid={!!errors.country}
                  aria-describedby={errors.country ? 'country-error' : undefined}
                />
                {errors.country && (
                  <p id="country-error" className="text-red-500 text-xs mt-1 flex items-center">
                    <AlertCircle size={12} className="mr-1" />
                    {errors.country}
                  </p>
                )}
              </div>
              
              {/* Special Instructions */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Special Instructions <span className="text-gray-500 text-xs">(Optional)</span>
                </label>
                <textarea
                  value={address.specialInstructions}
                  onChange={(e) => handleChange('specialInstructions', e.target.value)}
                  className="w-full p-3 rounded-lg bg-[#222] border border-gray-700 text-white focus:outline-none focus:ring-1 focus:ring-[#ff950e] h-20 resize-none"
                  placeholder="Delivery instructions, gate codes, etc."
                  maxLength={500}
                />
                {address.specialInstructions && (
                  <p className="text-xs text-gray-400 mt-1">
                    {address.specialInstructions.length}/500 characters
                  </p>
                )}
                {errors.specialInstructions && (
                  <p className="text-red-500 text-xs mt-1 flex items-center">
                    <AlertCircle size={12} className="mr-1" />
                    {errors.specialInstructions}
                  </p>
                )}
              </div>
              
              <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 bg-[#333] text-white rounded-lg hover:bg-[#444] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-[#ff950e] text-black font-bold rounded-lg hover:bg-[#e88800] transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
                      Processing...
                    </>
                  ) : 'Confirm Address'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}