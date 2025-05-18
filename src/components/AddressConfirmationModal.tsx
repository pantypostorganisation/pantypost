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
      setAddress(existingAddress);
    }
  }, [existingAddress]);

  if (!isOpen) return null;

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!address.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    
    if (!address.addressLine1.trim()) {
      newErrors.addressLine1 = 'Address line 1 is required';
    }
    
    if (!address.city.trim()) {
      newErrors.city = 'City is required';
    }
    
    if (!address.state.trim()) {
      newErrors.state = 'State/Province is required';
    }
    
    if (!address.postalCode.trim()) {
      newErrors.postalCode = 'Postal/ZIP code is required';
    }
    
    if (!address.country.trim()) {
      newErrors.country = 'Country is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      setIsSubmitting(true);
      
      // Simulate a slight delay for better UX
      setTimeout(() => {
        onConfirm(address);
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
    setAddress(prev => ({
      ...prev,
      [field]: value
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
                />
                {errors.fullName && (
                  <p className="text-red-500 text-xs mt-1 flex items-center">
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
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Home size={16} className="text-gray-500" />
                  </div>
                </div>
                {errors.addressLine1 && (
                  <p className="text-red-500 text-xs mt-1 flex items-center">
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
                  />
                  {errors.city && (
                    <p className="text-red-500 text-xs mt-1 flex items-center">
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
                  />
                  {errors.state && (
                    <p className="text-red-500 text-xs mt-1 flex items-center">
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
                  />
                  {errors.postalCode && (
                    <p className="text-red-500 text-xs mt-1 flex items-center">
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
                />
                {errors.country && (
                  <p className="text-red-500 text-xs mt-1 flex items-center">
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
                />
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
                  className="px-5 py-2.5 bg-[#ff950e] text-black font-bold rounded-lg hover:bg-[#e88800] transition-colors flex items-center justify-center"
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
