// src/components/seller-settings/utils/SaveButton.tsx
'use client';

import { sanitizeStrict } from '@/utils/security/sanitization';

interface SaveButtonProps {
  onClick: () => void | Promise<void> | Promise<boolean> | Promise<any>; // Accept various async return types
  showSuccess?: boolean;
  showError?: string | boolean; // Accept both string and boolean
  isLoading?: boolean;
}

export default function SaveButton({
  onClick,
  showSuccess = false,
  showError,
  isLoading = false
}: SaveButtonProps) {
  // Convert boolean error to string if needed
  let errorMessage: string | undefined;
  if (typeof showError === 'string') {
    errorMessage = sanitizeStrict(showError);
  } else if (showError === true) {
    errorMessage = 'An error occurred';
  }

  // Handle click with proper async handling
  const handleClick = () => {
    // Call onClick and handle any potential promise
    Promise.resolve(onClick()).catch(console.error);
  };

  return (
    <div className="flex flex-col items-center">
      {/* Save Button (image inside an accessible button) or Loading State */}
      {isLoading ? (
        <div
          className="w-24 h-auto flex flex-col items-center justify-center p-3 bg-gray-800 rounded-lg"
          role="status"
          aria-live="polite"
        >
          <div className="w-6 h-6 border-2 border-[#ff950e] border-t-transparent rounded-full animate-spin mb-2" />
          <span className="text-xs text-[#ff950e]">Saving...</span>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          className="cursor-pointer hover:scale-[1.02] transition-transform duration-200"
          aria-label="Save all profile changes"
        >
          <img
            src="/Save_All_Button.png"
            alt="Save All Profile Changes"
            className="w-24 h-auto object-contain"
            draggable={false}
          />
        </button>
      )}

      {/* Success Message */}
      {showSuccess && !isLoading && (
        <div
          className="bg-green-900 text-green-100 p-3 rounded-lg mt-3 text-center"
          role="status"
          aria-live="polite"
        >
          ✅ Profile updated successfully!
        </div>
      )}

      {/* Error Message */}
      {errorMessage && !isLoading && (
        <div
          className="bg-red-900 text-red-100 p-3 rounded-lg mt-3 text-center max-w-xs"
          role="alert"
          aria-live="assertive"
        >
          ❌ {errorMessage}
        </div>
      )}
    </div>
  );
}
