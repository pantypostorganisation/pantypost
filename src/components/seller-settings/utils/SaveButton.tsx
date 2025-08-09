// src/components/seller-settings/utils/SaveButton.tsx
'use client';

interface SaveButtonProps {
  onClick: () => void;
  showSuccess: boolean;
  showError?: string;
  isLoading?: boolean;
}

export default function SaveButton({ 
  onClick, 
  showSuccess, 
  showError,
  isLoading = false 
}: SaveButtonProps) {
  return (
    <div className="flex flex-col items-center">
      {/* Save Button Image or Loading State */}
      {isLoading ? (
        <div className="w-24 h-auto flex flex-col items-center justify-center p-3 bg-gray-800 rounded-lg">
          <div className="w-6 h-6 border-3 border-[#ff950e] border-t-transparent rounded-full animate-spin mb-2"></div>
          <span className="text-xs text-[#ff950e]">Saving...</span>
        </div>
      ) : (
        <img
          src="/Save_All_Button.png"
          alt="Save All Profile Changes"
          onClick={onClick}
          className="w-24 h-auto object-contain cursor-pointer hover:scale-[1.02] transition-transform duration-200"
        />
      )}
      
      {/* Success Message */}
      {showSuccess && !isLoading && (
        <div className="bg-green-900 text-green-100 p-3 rounded-lg mt-3 text-center">
          ✅ Profile updated successfully!
        </div>
      )}
      
      {/* Error Message */}
      {showError && !isLoading && (
        <div className="bg-red-900 text-red-100 p-3 rounded-lg mt-3 text-center max-w-xs">
          ❌ {showError}
        </div>
      )}
    </div>
  );
}
