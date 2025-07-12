// src/components/ui/ErrorFallback.tsx
'use client';

import React from 'react';
import { AppError, ErrorType } from '@/utils/errorHandling';
import { SecureMessageDisplay } from '@/components/ui/SecureMessageDisplay';
import { sanitizeStrict } from '@/utils/security/sanitization';

// Error fallback component
export function ErrorFallback({
  error,
  resetError,
  children,
}: {
  error?: AppError | null;
  resetError?: () => void;
  children?: React.ReactNode;
}) {
  if (!error) return null;

  const getErrorIcon = () => {
    switch (error.type) {
      case ErrorType.NETWORK:
        return '🌐';
      case ErrorType.AUTHENTICATION:
      case ErrorType.AUTHORIZATION:
        return '🔒';
      case ErrorType.NOT_FOUND:
        return '🔍';
      case ErrorType.SERVER:
        return '⚠️';
      default:
        return '❌';
    }
  };

  // Sanitize error details to prevent information leakage
  const getSafeErrorDetails = () => {
    if (!error.details) return null;

    // Only show details in development
    if (process.env.NODE_ENV === 'development') {
      // Even in dev, sanitize the output
      const sanitizedDetails = typeof error.details === 'string' 
        ? sanitizeStrict(error.details)
        : sanitizeStrict(JSON.stringify(error.details));
      
      return sanitizedDetails;
    }

    // In production, show generic message
    return 'Additional error information has been logged.';
  };

  const safeErrorDetails = getSafeErrorDetails();

  return (
    <div className="p-6 text-center">
      <div className="text-4xl mb-4">{getErrorIcon()}</div>
      <h3 className="text-lg font-semibold mb-2">
        <SecureMessageDisplay 
          content={error.message} 
          allowBasicFormatting={false}
        />
      </h3>
      {safeErrorDetails && (
        <p className="text-sm text-gray-400 mb-4">
          <SecureMessageDisplay 
            content={safeErrorDetails} 
            allowBasicFormatting={false}
            maxLength={200}
          />
        </p>
      )}
      {children}
      {resetError && error.retryable && (
        <button
          onClick={resetError}
          className="mt-4 px-4 py-2 bg-[#ff950e] text-black rounded-lg hover:bg-[#e88800] transition"
          aria-label="Try again"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
