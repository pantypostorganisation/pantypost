// src/utils/security/validation.ts

import { z } from 'zod';

/**
 * Common validation functions for forms and inputs
 */

/**
 * Validates an email address
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates a username
 */
export function isValidUsername(username: string): boolean {
  const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
  return usernameRegex.test(username);
}

/**
 * Validates password strength
 */
export interface PasswordStrength {
  isValid: boolean;
  score: number; // 0-5
  feedback: string[];
}

export function validatePasswordStrength(password: string): PasswordStrength {
  const feedback: string[] = [];
  let score = 0;

  if (!password) {
    return {
      isValid: false,
      score: 0,
      feedback: ['Password is required'],
    };
  }

  // Length check
  if (password.length >= 8) {
    score++;
  } else {
    feedback.push('Must be at least 8 characters');
  }

  if (password.length >= 12) {
    score++;
  }

  // Uppercase check
  if (/[A-Z]/.test(password)) {
    score++;
  } else {
    feedback.push('Include at least one uppercase letter');
  }

  // Lowercase check
  if (/[a-z]/.test(password)) {
    score++;
  } else {
    feedback.push('Include at least one lowercase letter');
  }

  // Number check
  if (/\d/.test(password)) {
    score++;
  } else {
    feedback.push('Include at least one number');
  }

  // Special character check
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score++;
    feedback.push('Great! Contains special characters');
  }

  // Common patterns to avoid
  const commonPatterns = [
    /^12345/,
    /^password/i,
    /^qwerty/i,
    /^abc123/i,
    /^admin/i,
  ];

  const hasCommonPattern = commonPatterns.some(pattern => pattern.test(password));
  if (hasCommonPattern) {
    score = Math.max(0, score - 2);
    feedback.push('Avoid common patterns');
  }

  const isValid = password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password);

  return {
    isValid,
    score: Math.min(5, score),
    feedback: isValid && feedback.length === 0 ? ['Strong password!'] : feedback,
  };
}

/**
 * Validates a URL
 */
export function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
}

/**
 * Validates a phone number (international format)
 */
export function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s-()]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
}

/**
 * Validates a credit card number using Luhn algorithm
 */
export function isValidCreditCard(cardNumber: string): boolean {
  const cleaned = cardNumber.replace(/\s/g, '');
  
  if (!/^\d{13,19}$/.test(cleaned)) {
    return false;
  }

  let sum = 0;
  let isEven = false;

  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i]);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

/**
 * Validates an image file
 */
export interface ImageValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateImageFile(file: File): ImageValidationResult {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!file) {
    return { isValid: false, error: 'No file selected' };
  }

  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'Only JPEG, PNG, and WebP images are allowed' };
  }

  if (file.size > maxSize) {
    return { isValid: false, error: 'File size must be less than 5MB' };
  }

  return { isValid: true };
}

/**
 * Validates listing price
 */
export function isValidPrice(price: string | number): boolean {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  if (isNaN(numPrice) || !isFinite(numPrice)) {
    return false;
  }

  return numPrice >= 0.01 && numPrice <= 10000;
}

/**
 * Validates a date is in the future
 */
export function isFutureDate(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj > new Date();
}

/**
 * Validates age (must be 18+)
 */
export function isValidAge(birthDate: Date | string): boolean {
  const date = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
  const today = new Date();
  const age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    return age - 1 >= 18;
  }
  
  return age >= 18;
}

/**
 * Validates Bitcoin address
 */
export function isValidBitcoinAddress(address: string): boolean {
  // Basic Bitcoin address validation (simplified)
  const btcRegex = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/;
  return btcRegex.test(address);
}

/**
 * Validates Ethereum address
 */
export function isValidEthereumAddress(address: string): boolean {
  const ethRegex = /^0x[a-fA-F0-9]{40}$/;
  return ethRegex.test(address);
}

/**
 * Validates bank account number (US)
 */
export function isValidBankAccount(accountNumber: string): boolean {
  const cleaned = accountNumber.replace(/\D/g, '');
  return cleaned.length >= 8 && cleaned.length <= 17;
}

/**
 * Validates routing number (US)
 */
export function isValidRoutingNumber(routingNumber: string): boolean {
  const cleaned = routingNumber.replace(/\D/g, '');
  
  if (cleaned.length !== 9) {
    return false;
  }

  // Checksum validation for US routing numbers
  let sum = 0;
  for (let i = 0; i < 9; i += 3) {
    sum += parseInt(cleaned[i]) * 3;
    sum += parseInt(cleaned[i + 1]) * 7;
    sum += parseInt(cleaned[i + 2]) * 1;
  }

  return sum % 10 === 0;
}

/**
 * Validates a color hex code
 */
export function isValidHexColor(color: string): boolean {
  const hexRegex = /^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return hexRegex.test(color);
}

/**
 * Validates file extension
 */
export function hasValidExtension(filename: string, allowedExtensions: string[]): boolean {
  const ext = filename.split('.').pop()?.toLowerCase();
  return ext ? allowedExtensions.includes(ext) : false;
}

/**
 * Validates a UUID
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Rate limiting helper
 */
export class RateLimiter {
  private attempts: Map<string, { count: number; firstAttempt: number }> = new Map();
  private readonly maxAttempts: number;
  private readonly windowMs: number;

  constructor(maxAttempts: number = 5, windowMs: number = 60000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    const attempt = this.attempts.get(key);

    if (!attempt) {
      this.attempts.set(key, { count: 1, firstAttempt: now });
      return true;
    }

    if (now - attempt.firstAttempt > this.windowMs) {
      // Reset window
      this.attempts.set(key, { count: 1, firstAttempt: now });
      return true;
    }

    if (attempt.count >= this.maxAttempts) {
      return false;
    }

    attempt.count++;
    return true;
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }

  getRemainingAttempts(key: string): number {
    const attempt = this.attempts.get(key);
    if (!attempt) return this.maxAttempts;
    
    const now = Date.now();
    if (now - attempt.firstAttempt > this.windowMs) {
      return this.maxAttempts;
    }
    
    return Math.max(0, this.maxAttempts - attempt.count);
  }

  getResetTime(key: string): number | null {
    const attempt = this.attempts.get(key);
    if (!attempt) return null;
    
    return attempt.firstAttempt + this.windowMs;
  }
}

/**
 * CSRF token management (client-side preparation)
 */
export class CSRFTokenManager {
  private token: string | null = null;
  private readonly tokenKey = 'csrf_token';

  generateToken(): string {
    if (typeof window === 'undefined') {
      return '';
    }

    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    const token = btoa(String.fromCharCode(...array));
    
    this.token = token;
    sessionStorage.setItem(this.tokenKey, token);
    
    return token;
  }

  getToken(): string | null {
    if (this.token) {
      return this.token;
    }

    if (typeof window !== 'undefined') {
      this.token = sessionStorage.getItem(this.tokenKey);
    }

    return this.token;
  }

  validateToken(token: string): boolean {
    const storedToken = this.getToken();
    return storedToken !== null && storedToken === token;
  }

  clearToken(): void {
    this.token = null;
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(this.tokenKey);
    }
  }
}

/**
 * Input debouncing for validation
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(later, wait);
  };
}

/**
 * Safe JSON parse with validation
 */
export function safeJsonParse<T>(
  json: string,
  schema?: z.ZodSchema<T>
): { success: boolean; data?: T; error?: string } {
  try {
    const parsed = JSON.parse(json);
    
    if (schema) {
      const result = schema.safeParse(parsed);
      if (!result.success) {
        return { success: false, error: 'Invalid data format' };
      }
      return { success: true, data: result.data };
    }
    
    return { success: true, data: parsed };
  } catch (error) {
    return { success: false, error: 'Invalid JSON' };
  }
}

/**
 * Validates form data against schema
 */
export async function validateFormData<T>(
  data: unknown,
  schema: z.ZodSchema<T>
): Promise<{ isValid: boolean; data?: T; errors?: Record<string, string> }> {
  try {
    const validData = await schema.parseAsync(data);
    return { isValid: true, data: validData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return { isValid: false, errors };
    }
    return { isValid: false, errors: { general: 'Validation failed' } };
  }
}
