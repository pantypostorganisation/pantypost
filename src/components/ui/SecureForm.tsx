// src/components/ui/SecureForm.tsx

import React, { FormEvent, useState, useEffect } from 'react';
import { AlertCircle, ShieldCheck, Loader2 } from 'lucide-react';
import { getRateLimiter, RATE_LIMITS, getRateLimitMessage } from '@/utils/security/rate-limiter';
import { CSRFTokenManager } from '@/utils/security/validation';

interface SecureFormProps {
  children: React.ReactNode;
  onSubmit: (e: FormEvent) => Promise<void> | void;
  className?: string;
  rateLimitKey?: string;
  rateLimitConfig?: { maxAttempts: number; windowMs: number };
  showSecurityBadge?: boolean;
  csrfProtection?: boolean;
}

/**
 * Secure form wrapper with CSRF protection and rate limiting
 */
export const SecureForm: React.FC<SecureFormProps> = ({
  children,
  onSubmit,
  className = '',
  rateLimitKey,
  rateLimitConfig,
  showSecurityBadge = false,
  csrfProtection = true,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);
  const [csrfToken, setCsrfToken] = useState<string>('');

  // Initialize CSRF token
  useEffect(() => {
    if (csrfProtection && typeof window !== 'undefined') {
      const tokenManager = new CSRFTokenManager();
      const token = tokenManager.generateToken();
      setCsrfToken(token);
    }
  }, [csrfProtection]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setRateLimitError(null);

    // Check rate limit if configured
    if (rateLimitKey && rateLimitConfig) {
      const limiter = getRateLimiter();
      const result = limiter.check(rateLimitKey, rateLimitConfig);
      
      if (!result.allowed) {
        setRateLimitError(getRateLimitMessage(result));
        return;
      }
    }

    setIsSubmitting(true);

    try {
      await onSubmit(e);
    } catch (error) {
      console.error('Form submission error:', error);
      
      // If it's a rate limit error, reset the attempt
      if (rateLimitKey && error instanceof Error && error.message.includes('Rate limit')) {
        const limiter = getRateLimiter();
        limiter.reset(rateLimitKey);
      }
      
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={className} noValidate>
      {/* CSRF Token (hidden) */}
      {csrfProtection && csrfToken && (
        <input type="hidden" name="_csrf" value={csrfToken} />
      )}

      {/* Security Badge */}
      {showSecurityBadge && (
        <div className="mb-4 flex items-center gap-2 text-xs text-gray-500">
          <ShieldCheck className="w-4 h-4" />
          <span>Secure form with protection against attacks</span>
        </div>
      )}

      {/* Rate Limit Error */}
      {rateLimitError && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-red-400">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{rateLimitError}</span>
          </div>
        </div>
      )}

      {/* Form Content */}
      {children}
    </form>
  );
};

/**
 * Field wrapper for consistent styling and error handling
 */
interface SecureFieldWrapperProps {
  children: React.ReactNode;
  error?: string;
  touched?: boolean;
  className?: string;
}

export const SecureFieldWrapper: React.FC<SecureFieldWrapperProps> = ({
  children,
  error,
  touched,
  className = '',
}) => {
  return (
    <div className={`mb-4 ${className}`}>
      {children}
      {touched && error && (
        <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
};

/**
 * Submit button with loading state
 */
interface SecureSubmitButtonProps {
  children: React.ReactNode;
  isSubmitting?: boolean;
  disabled?: boolean;
  className?: string;
  loadingText?: string;
}

export const SecureSubmitButton: React.FC<SecureSubmitButtonProps> = ({
  children,
  isSubmitting = false,
  disabled = false,
  className = '',
  loadingText = 'Processing...',
}) => {
  return (
    <button
      type="submit"
      disabled={disabled || isSubmitting}
      className={`
        relative px-4 py-2 font-medium rounded-lg transition-all
        ${disabled || isSubmitting 
          ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
          : 'bg-[#ff950e] text-white hover:bg-[#ff950e]/90'
        }
        ${className}
      `}
    >
      {isSubmitting ? (
        <span className="flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          {loadingText}
        </span>
      ) : (
        children
      )}
    </button>
  );
};
