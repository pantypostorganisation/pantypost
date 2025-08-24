// src/components/seller-settings/utils/SaveButton.tsx
'use client';

import { z } from 'zod';
import { sanitizeStrict } from '@/utils/security/sanitization';

const PropsSchema = z.object({
  onClick: z.function().args().returns(z.void()),
  showSuccess: z.boolean().default(false),
  showError: z.string().optional(),
  isLoading: z.boolean().optional(),
});

interface SaveButtonProps extends z.infer<typeof PropsSchema> {}

export default function SaveButton(rawProps: SaveButtonProps) {
  const parsed = PropsSchema.safeParse(rawProps);
  const {
    onClick,
    showSuccess = false,
    showError,
    isLoading = false,
  } = parsed.success
    ? parsed.data
    : {
        onClick: () => {},
        showSuccess: false,
        showError: undefined,
        isLoading: false,
      };

  const cleanedError = showError ? sanitizeStrict(showError) : undefined;

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
          onClick={onClick}
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
      {cleanedError && !isLoading && (
        <div
          className="bg-red-900 text-red-100 p-3 rounded-lg mt-3 text-center max-w-xs"
          role="alert"
          aria-live="assertive"
        >
          ❌ {cleanedError}
        </div>
      )}
    </div>
  );
}
