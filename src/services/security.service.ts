// src/services/security.service.ts

import { z } from 'zod';
import * as schemas from '@/utils/validation/schemas';
import * as sanitization from '@/utils/security/sanitization';
import { getRateLimiter, RATE_LIMITS } from '@/utils/security/rate-limiter';
import { CSRFTokenManager } from '@/utils/security/validation';

/**
 * Comprehensive security service for the application
 */
class SecurityService {
  private csrfManager: CSRFTokenManager;
  private rateLimiter: ReturnType<typeof getRateLimiter>;

  constructor() {
    this.csrfManager = new CSRFTokenManager();
    this.rateLimiter = getRateLimiter();
  }

  /**
   * Validate and sanitize user input
   */
  validateAndSanitize<T>(
    data: unknown,
    schema: z.ZodSchema<T>,
    sanitizers?: Partial<Record<keyof T, (value: any) => any>>
  ): { success: boolean; data?: T; errors?: Record<string, string> } {
    try {
      // First sanitize if sanitizers provided
      let processedData = data;
      if (sanitizers && typeof data === 'object' && data !== null) {
        processedData = { ...data } as Record<string, any>;
        for (const [key, sanitizer] of Object.entries(sanitizers)) {
          if (key in (processedData as Record<string, any>) && typeof sanitizer === 'function') {
            (processedData as Record<string, any>)[key] = sanitizer((processedData as Record<string, any>)[key]);
          }
        }
      }

      // Then validate
      const validated = schema.parse(processedData);
      return { success: true, data: validated };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          errors[path] = err.message;
        });
        return { success: false, errors };
      }
      return { success: false, errors: { general: 'Validation failed' } };
    }
  }

  /**
   * Check rate limit for an action
   */
  checkRateLimit(
    action: keyof typeof RATE_LIMITS,
    identifier?: string
  ): { allowed: boolean; message?: string; resetTime?: Date } {
    const config = RATE_LIMITS[action];
    const result = this.rateLimiter.check(action, { ...config, identifier });

    if (!result.allowed) {
      return {
        allowed: false,
        message: `Too many attempts. Please wait ${result.waitTime} seconds.`,
        resetTime: result.resetTime,
      };
    }

    return { allowed: true };
  }

  /**
   * Sanitize content for safe display
   */
  sanitizeForDisplay(content: string, options?: {
    allowHtml?: boolean;
    allowMarkdown?: boolean;
    maxLength?: number;
  }): string {
    const { allowHtml = false, allowMarkdown = false, maxLength } = options || {};

    let sanitized = content;

    if (maxLength && sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength) + '...';
    }

    if (allowMarkdown) {
      return sanitization.sanitizeMarkdown(sanitized);
    }

    if (allowHtml) {
      return sanitization.sanitizeHtml(sanitized);
    }

    return sanitization.sanitizeStrict(sanitized);
  }

  /**
   * Validate file upload
   */
  validateFileUpload(
    file: File,
    options: {
      maxSize?: number;
      allowedTypes?: string[];
      allowedExtensions?: string[];
    } = {}
  ): { valid: boolean; error?: string } {
    const {
      maxSize = 5 * 1024 * 1024, // 5MB default
      allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
      allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'],
    } = options;

    // Check file size
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`,
      };
    }

    // Check MIME type
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`,
      };
    }

    // Check extension
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !allowedExtensions.includes(extension)) {
      return {
        valid: false,
        error: `File extension not allowed. Allowed extensions: ${allowedExtensions.join(', ')}`,
      };
    }

    // Additional security: check if file content matches declared type
    // This would require reading file headers in production

    return { valid: true };
  }

  /**
   * Generate CSRF token
   */
  generateCSRFToken(): string {
    return this.csrfManager.generateToken();
  }

  /**
   * Validate CSRF token
   */
  validateCSRFToken(token: string): boolean {
    return this.csrfManager.validateToken(token);
  }

  /**
   * Sanitize object for API request
   */
  sanitizeForAPI<T extends Record<string, any>>(data: T): Partial<T> {
    return sanitization.sanitizeObject(data, {
      maxDepth: 5,
      keySanitizer: (key) => sanitization.sanitizeStrict(key),
      valueSanitizer: (value) => {
        if (typeof value === 'string') {
          return sanitization.sanitizeStrict(value);
        }
        return value;
      },
    });
  }

  /**
   * Validate and sanitize search query
   */
  sanitizeSearchQuery(query: string): string {
    return sanitization.sanitizeSearchQuery(query);
  }

  /**
   * Validate financial amount
   */
  validateAmount(
    amount: string | number,
    options: {
      min?: number;
      max?: number;
      allowDecimals?: boolean;
    } = {}
  ): { valid: boolean; value?: number; error?: string } {
    const { min = 0.01, max = 10000, allowDecimals = true } = options;

    const sanitized = sanitization.sanitizeCurrency(amount);

    if (sanitized < min) {
      return { valid: false, error: `Amount must be at least $${min}` };
    }

    if (sanitized > max) {
      return { valid: false, error: `Amount cannot exceed $${max}` };
    }

    if (!allowDecimals && sanitized % 1 !== 0) {
      return { valid: false, error: 'Amount must be a whole number' };
    }

    return { valid: true, value: sanitized };
  }

  /**
   * Check content for potential security issues
   */
  checkContentSecurity(content: string): {
    safe: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    // Check for script tags
    if (/<script[^>]*>.*?<\/script>/gi.test(content)) {
      issues.push('Script tags detected');
    }

    // Check for event handlers
    if (/on\w+\s*=/gi.test(content)) {
      issues.push('Event handlers detected');
    }

    // Check for iframes
    if (/<iframe/gi.test(content)) {
      issues.push('Iframe detected');
    }

    // Check for javascript: URLs
    if (/javascript:/gi.test(content)) {
      issues.push('JavaScript URL detected');
    }

    // Check for SQL-like patterns
    if (/\b(union|select|insert|update|delete|drop)\b.*\b(from|into|where)\b/gi.test(content)) {
      issues.push('SQL-like pattern detected');
    }

    return {
      safe: issues.length === 0,
      issues,
    };
  }

  /**
   * Create secure headers for API requests
   */
  getSecureHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'X-Requested-With': 'XMLHttpRequest',
      'X-Content-Type-Options': 'nosniff',
    };

    const csrfToken = this.csrfManager.getToken();
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }

    return headers;
  }

  /**
   * Validate password against common vulnerabilities
   */
  checkPasswordVulnerabilities(password: string, userData?: {
    username?: string;
    email?: string;
  }): { secure: boolean; warnings: string[] } {
    const warnings: string[] = [];

    // Check against common passwords
    const commonPasswords = [
      'password', '12345678', 'qwerty', 'abc123', 'password123',
      'admin', 'letmein', 'welcome', 'monkey', '1234567890'
    ];

    if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
      warnings.push('Password contains common patterns');
    }

    // Check if password contains username or email
    if (userData?.username && password.toLowerCase().includes(userData.username.toLowerCase())) {
      warnings.push('Password should not contain your username');
    }

    if (userData?.email) {
      const emailPart = userData.email.split('@')[0];
      if (password.toLowerCase().includes(emailPart.toLowerCase())) {
        warnings.push('Password should not contain parts of your email');
      }
    }

    // Check for repeated characters
    if (/(.)\1{3,}/.test(password)) {
      warnings.push('Password contains too many repeated characters');
    }

    // Check for sequential characters
    if (/(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i.test(password)) {
      warnings.push('Password contains sequential characters');
    }

    return {
      secure: warnings.length === 0,
      warnings,
    };
  }
}

// Export singleton instance
export const securityService = new SecurityService();

// Export schemas for convenience
export { schemas };

// Export sanitization functions
export const sanitize = {
  html: sanitization.sanitizeHtml,
  strict: sanitization.sanitizeStrict,
  email: sanitization.sanitizeEmail,
  username: sanitization.sanitizeUsername,
  url: sanitization.sanitizeUrl,
  fileName: sanitization.sanitizeFileName,
  number: sanitization.sanitizeNumber,
  currency: sanitization.sanitizeCurrency,
  searchQuery: sanitization.sanitizeSearchQuery,
  markdown: sanitization.sanitizeMarkdown,
};