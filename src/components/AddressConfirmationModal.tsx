// src/components/AddressConfirmationModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { X, MapPin, CheckCircle } from 'lucide-react';
import { SecureInput, SecureTextarea } from '@/components/ui/SecureInput';
import { SecureForm } from '@/components/ui/SecureForm';
import type { DeliveryAddress } from '@/types/order';

// Re-export for backward compatibility
export type { DeliveryAddress };

type AddressConfirmationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (address: DeliveryAddress) => void;
  existingAddress?: DeliveryAddress | null;
  orderId: string;
};

// Validation function for postal codes
const isValidPostalCode = (postalCode: string, country: string): boolean => {
  const patterns: { [key: string]: RegExp } = {
    'United States': /^\d{5}(-\d{4})?$/,
    Canada: /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/,
    'United Kingdom': /^[A-Za-z]{1,2}\d{1,2}[A-Za-z]?\s?\d[A-Za-z]{2}$/,
    Australia: /^\d{4}$/,
    Default: /^[\w\s-]{3,10}$/,
  };

  const pattern = patterns[country] || patterns.Default;
  return pattern.test(postalCode);
};

// Validation function for names and city/country
const isValidName = (name: string): boolean => {
  const validNamePattern = /^[a-zA-Z\s\-'.]{2,100}$/;
  return validNamePattern.test(name);
};

export default function AddressConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  existingAddress,
  orderId,
}: AddressConfirmationModalProps): React.ReactElement | null {
  const [address, setAddress] = useState<DeliveryAddress>({
    fullName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    specialInstructions: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Load existing address if available
  useEffect(() => {
    if (existingAddress) {
      setAddress({
        fullName: existingAddress.fullName || '',
        addressLine1: existingAddress.addressLine1 || '',
        addressLine2: existingAddress.addressLine2 || '',
        city: existingAddress.city || '',
        state: existingAddress.state || '',
        postalCode: existingAddress.postalCode || '',
        country: existingAddress.country || '',
        specialInstructions: existingAddress.specialInstructions || '',
      });
    }
  }, [existingAddress]);

  if (!isOpen) return null;

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate full name
    if (!address.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (!isValidName(address.fullName)) {
      newErrors.fullName = 'Please enter a valid name (letters, spaces, hyphens, and apostrophes only)';
    }

    // Validate address line 1
    if (!address.addressLine1.trim()) {
      newErrors.addressLine1 = 'Address line 1 is required';
    } else if (address.addressLine1.length < 5) {
      newErrors.addressLine1 = 'Address must be at least 5 characters long';
    }

    // Validate city
    if (!address.city.trim()) {
      newErrors.city = 'City is required';
    } else if (!isValidName(address.city)) {
      newErrors.city = 'Please enter a valid city name';
    }

    // Validate state/province
    if (!address.state.trim()) {
      newErrors.state = 'State/Province is required';
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
    }

    setErrors(newErrors);
    // Mark all fields as touched
    setTouched({
      fullName: true,
      addressLine1: true,
      city: true,
      state: true,
      postalCode: true,
      country: true,
    });

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      setIsSubmitting(true);

      // Create address object for submission (SecureInput already sanitizes)
      const submissionAddress: DeliveryAddress = {
        fullName: address.fullName,
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2 || undefined,
        city: address.city,
        state: address.state,
        postalCode: address.postalCode,
        country: address.country,
        specialInstructions: address.specialInstructions || undefined,
      };

      // Simulate a slight delay for better UX
      setTimeout(() => {
        onConfirm(submissionAddress);
        setSubmitSuccess(true);

        setTimeout(() => {
          onClose();
          setIsSubmitting(false);
          setSubmitSuccess(false);
          setTouched({});
        }, 1000);
      }, 800);
    }
  };

  const handleChange =
    (field: keyof DeliveryAddress) =>
    (value: string): void => {
      setAddress((prev) => ({
        ...prev,
        [field]: value,
      }));

      // Clear error for this field if it exists
      if (errors[field as string]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field as string];
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

            <SecureForm
              onSubmit={handleSubmit}
              rateLimitKey="address_confirmation"
              rateLimitConfig={{ maxAttempts: 10, windowMs: 60 * 1000 }}
            >
              <div className="space-y-4">
                {/* Full Name */}
                <SecureInput
                  label="Full Name"
                  type="text"
                  value={address.fullName}
                  onChange={handleChange('fullName')}
                  onBlur={() => setTouched((prev) => ({ ...prev, fullName: true }))}
                  error={errors.fullName}
                  touched={touched.fullName}
                  placeholder="John Doe"
                  maxLength={100}
                  required
                />

                {/* Address Line 1 */}
                <SecureInput
                  label="Address Line 1"
                  type="text"
                  value={address.addressLine1}
                  onChange={handleChange('addressLine1')}
                  onBlur={() => setTouched((prev) => ({ ...prev, addressLine1: true }))}
                  error={errors.addressLine1}
                  touched={touched.addressLine1}
                  placeholder="123 Main Street"
                  maxLength={200}
                  required
                />

                {/* Address Line 2 */}
                <SecureInput
                  label="Address Line 2"
                  type="text"
                  value={address.addressLine2 || ''}
                  onChange={handleChange('addressLine2')}
                  placeholder="Apartment, suite, etc. (optional)"
                  maxLength={200}
                />

                {/* City and State */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <SecureInput
                    label="City"
                    type="text"
                    value={address.city}
                    onChange={handleChange('city')}
                    onBlur={() => setTouched((prev) => ({ ...prev, city: true }))}
                    error={errors.city}
                    touched={touched.city}
                    placeholder="New York"
                    maxLength={100}
                    required
                  />

                  <SecureInput
                    label="State/Province"
                    type="text"
                    value={address.state}
                    onChange={handleChange('state')}
                    onBlur={() => setTouched((prev) => ({ ...prev, state: true }))}
                    error={errors.state}
                    touched={touched.state}
                    placeholder="NY"
                    maxLength={100}
                    required
                  />
                </div>

                {/* Postal Code and Country */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <SecureInput
                    label="Postal/ZIP Code"
                    type="text"
                    value={address.postalCode}
                    onChange={handleChange('postalCode')}
                    onBlur={() => setTouched((prev) => ({ ...prev, postalCode: true }))}
                    error={errors.postalCode}
                    touched={touched.postalCode}
                    placeholder="10001"
                    maxLength={20}
                    required
                  />

                  <SecureInput
                    label="Country"
                    type="text"
                    value={address.country}
                    onChange={handleChange('country')}
                    onBlur={() => setTouched((prev) => ({ ...prev, country: true }))}
                    error={errors.country}
                    touched={touched.country}
                    placeholder="United States"
                    maxLength={100}
                    required
                  />
                </div>

                {/* Special Instructions */}
                <SecureTextarea
                  label="Special Instructions"
                  value={address.specialInstructions || ''}
                  onChange={handleChange('specialInstructions')}
                  className="w-full p-3 rounded-lg bg-[#222] border border-gray-700 text-white focus:outline-none focus:ring-1 focus:ring-[#ff950e] h-20 resize-none"
                  placeholder="Delivery instructions, gate codes, etc."
                  maxLength={500}
                  characterCount={true}
                  helpText="Optional"
                />

                <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 bg-[#333] text-white rounded-lg hover:bg-[#444] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 bg-[#ff950e] text-black font-bold rounded-lg hover:bg-[#e88800] transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      'Confirm Address'
                    )}
                  </button>
                </div>
              </div>
            </SecureForm>
          </>
        )}
      </div>
    </div>
  );
}
