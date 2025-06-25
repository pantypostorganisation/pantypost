// src/components/ui/ErrorFallback.tsx
'use client';

import React from 'react';
import { AppError, ErrorType } from '@/utils/errorHandling';

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

  return (
    <div className="p-6 text-center">
      <div className="text-4xl mb-4">{getErrorIcon()}</div>
      <h3 className="text-lg font-semibold mb-2">{error.message}</h3>
      {error.details && (
        <p className="text-sm text-gray-400 mb-4">
          {JSON.stringify(error.details)}
        </p>
      )}
      {children}
      {resetError && error.retryable && (
        <button
          onClick={resetError}
          className="mt-4 px-4 py-2 bg-[#ff950e] text-black rounded-lg hover:bg-[#e88800] transition"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
