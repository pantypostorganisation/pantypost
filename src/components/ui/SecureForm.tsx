// src/components/ui/SecureForm.tsx
'use client';

import React, { FormEvent, useState, useEffect } from 'react';
import { AlertCircle, ShieldCheck, Loader2 } from 'lucide-react';
import { getRateLimiter, getRateLimitMessage } from '@/utils/security/rate-limiter';

interface SecureFormProps {
  children: React.ReactNode;
  onSubmit: (e: FormEvent) => Promise<void> | void;
  className?: string;
  rateLimitKey?: string;
  rateLimitConfig?: { maxAttempts: number; windowMs: number };
  showSecurityBadge?: boolean;
  csrfProtection?: boolean;
  isRateLimited?: boolean;
  rateLimitWaitTime?: number;
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
  isRateLimited = false,
  rateLimitWaitTime = 0,
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

  // Update rate limit error when props change
  useEffect(() => {
    if (isRateLimited && rateLimitWaitTime > 0) {
      setRateLimitError(
        `Too many attempts. Please wait ${rateLimitWaitTime} seconds before trying again.`
      );
    } else {
      setRateLimitError(null);
    }
  }, [isRateLimited, rateLimitWaitTime]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Don't submit if externally rate limited
    if (isRateLimited) {
      return;
    }

    // Clear previous errors
    setRateLimitError(null);

    // Check rate limit if configured and not already checked externally
    if (rateLimitKey && rateLimitConfig && !isRateLimited) {
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
      {csrfProtection && csrfToken && <input type="hidden" name="_csrf" value={csrfToken} />}

      {/* Security Badge */}
      {showSecurityBadge && (
        <div className="mb-4 flex items-center gap-2 text-xs text-gray-500">
          <ShieldCheck className="w-4 h-4" />
          <span>Secure form with protection against attacks</span>
        </div>
      )}

      {/* Rate Limit Error - only show if not handled externally */}
      {rateLimitError && !isRateLimited && (
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
}) => (
  <div className={className}>
    {children}
    {touched && error && (
      <div className="mt-1 flex items-center gap-1 text-xs text-red-400">
        <AlertCircle className="w-3 h-3 flex-shrink-0" />
        <span>{error}</span>
      </div>
    )}
  </div>
);

/**
 * Secure submit button with loading state
 */
interface SecureSubmitButtonProps {
  children: React.ReactNode;
  isLoading?: boolean;
  isDisabled?: boolean;
  className?: string;
  loadingText?: string;
  type?: 'submit' | 'button';
  disabled?: boolean;
}

export const SecureSubmitButton: React.FC<SecureSubmitButtonProps> = ({
  children,
  isLoading = false,
  isDisabled = false,
  disabled = false,
  className = '',
  loadingText = 'Processing...',
  type = 'submit',
}) => (
  <button
    type={type}
    disabled={isLoading || isDisabled || disabled}
    className={`relative ${className} ${
      isLoading || isDisabled || disabled ? 'opacity-50 cursor-not-allowed' : ''
    }`}
  >
    {isLoading ? (
      <span className="flex items-center justify-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        {loadingText}
      </span>
    ) : (
      children
    )}
  </button>
);

/**
 * CSRF Token Manager for form protection
 */
class CSRFTokenManager {
  private tokenKey = 'csrf_token';
  private tokenExpiry = 60 * 60 * 1000; // 1 hour

  generateToken(): string {
    const token = this.createSecureToken();
    const expiry = Date.now() + this.tokenExpiry;

    if (typeof window !== 'undefined') {
      sessionStorage.setItem(this.tokenKey, JSON.stringify({ token, expiry }));
    }

    return token;
  }

  validateToken(token: string): boolean {
    if (typeof window === 'undefined') return false;

    try {
      const stored = sessionStorage.getItem(this.tokenKey);
      if (!stored) return false;

      const { token: storedToken, expiry } = JSON.parse(stored);

      if (Date.now() > expiry) {
        sessionStorage.removeItem(this.tokenKey);
        return false;
      }

      return token === storedToken;
    } catch {
      return false;
    }
  }

  private createSecureToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }
}
