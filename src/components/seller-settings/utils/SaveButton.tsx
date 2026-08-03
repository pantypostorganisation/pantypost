// src/components/seller-settings/utils/SaveButton.tsx
'use client';

import { Check, Loader2, AlertCircle } from 'lucide-react';
import { sanitizeStrict } from '@/utils/security/sanitization';

interface SaveButtonProps {
  onClick: () => void | Promise<void> | Promise<boolean> | Promise<unknown>;
  showSuccess?: boolean;
  showError?: string | boolean;
  isLoading?: boolean;
  /** Disables the button when there is nothing to save. */
  disabled?: boolean;
}

export default function SaveButton({
  onClick,
  showSuccess = false,
  showError,
  isLoading = false,
  disabled = false,
}: SaveButtonProps) {
  let errorMessage: string | undefined;
  if (typeof showError === 'string') {
    errorMessage = sanitizeStrict(showError);
  } else if (showError === true) {
    errorMessage = 'An error occurred';
  }

  const handleClick = () => {
    Promise.resolve(onClick()).catch(console.error);
  };

  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
      {/* Status sits beside the button rather than below it, so the bar
          does not change height when a message appears. */}
      {errorMessage && !isLoading && (
        <span className="inline-flex items-center gap-1.5 text-sm text-danger" role="alert">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {errorMessage}
        </span>
      )}

      {showSuccess && !isLoading && !errorMessage && (
        <span className="inline-flex items-center gap-1.5 text-sm text-success" role="status">
          <Check className="h-4 w-4 shrink-0" />
          Saved
        </span>
      )}

      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading || disabled}
        /* Black on the accent is 9.56:1. White would be 2.20:1. */
        className="inline-flex min-w-[7.5rem] items-center justify-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Save profile changes"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving
          </>
        ) : (
          'Save changes'
        )}
      </button>
    </div>
  );
}
