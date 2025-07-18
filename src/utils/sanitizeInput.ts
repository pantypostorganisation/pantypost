// src/utils/sanitizeInput.ts

/**
 * Sanitizes a string input by removing potentially harmful characters
 * and trimming whitespace
 * @param input - The string to sanitize
 * @returns The sanitized string
 */
export function sanitizeString(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remove any HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');
  
  // Remove any script tags more thoroughly
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove potentially dangerous characters while keeping common punctuation
  sanitized = sanitized.replace(/[<>\"\'`;(){}]/g, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  // Limit length to prevent extremely long inputs
  const MAX_LENGTH = 5000;
  if (sanitized.length > MAX_LENGTH) {
    sanitized = sanitized.substring(0, MAX_LENGTH);
  }
  
  return sanitized;
}

/**
 * Sanitizes a username by removing special characters
 * and ensuring it meets username requirements
 * @param username - The username to sanitize
 * @returns The sanitized username
 */
export function sanitizeUsername(username: string): string {
  if (!username || typeof username !== 'string') {
    return '';
  }

  // Convert to lowercase
  let sanitized = username.toLowerCase();
  
  // Remove any non-alphanumeric characters except underscores and hyphens
  sanitized = sanitized.replace(/[^a-z0-9_-]/g, '');
  
  // Remove leading/trailing underscores or hyphens
  sanitized = sanitized.replace(/^[_-]+|[_-]+$/g, '');
  
  // Limit length
  const MAX_USERNAME_LENGTH = 30;
  if (sanitized.length > MAX_USERNAME_LENGTH) {
    sanitized = sanitized.substring(0, MAX_USERNAME_LENGTH);
  }
  
  return sanitized;
}

/**
 * Sanitizes a number input and ensures it's a valid positive number
 * @param input - The input to sanitize
 * @param min - Minimum allowed value (default: 0)
 * @param max - Maximum allowed value (default: 999999)
 * @returns The sanitized number or 0 if invalid
 */
export function sanitizeNumber(input: any, min: number = 0, max: number = 999999): number {
  const num = parseFloat(input);
  
  if (isNaN(num) || !isFinite(num)) {
    return min;
  }
  
  if (num < min) return min;
  if (num > max) return max;
  
  // Round to 2 decimal places for currency
  return Math.round(num * 100) / 100;
}

/**
 * Sanitizes an email address
 * @param email - The email to sanitize
 * @returns The sanitized email or empty string if invalid
 */
export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== 'string') {
    return '';
  }

  // Basic email sanitization
  let sanitized = email.toLowerCase().trim();
  
  // Remove any obviously invalid characters
  sanitized = sanitized.replace(/[<>\"\'`;(){}]/g, '');
  
  // Very basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitized)) {
    return '';
  }
  
  return sanitized;
}

/**
 * Sanitizes an array of tags
 * @param tags - Array of tags to sanitize
 * @returns Array of sanitized tags
 */
export function sanitizeTags(tags: string[]): string[] {
  if (!Array.isArray(tags)) {
    return [];
  }

  return tags
    .map(tag => sanitizeString(tag))
    .filter(tag => tag.length > 0)
    .slice(0, 10); // Limit to 10 tags
}

/**
 * Sanitizes object keys and values recursively
 * @param obj - Object to sanitize
 * @returns Sanitized object
 */
export function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }

  if (typeof obj === 'number') {
    return sanitizeNumber(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const sanitizedKey = sanitizeString(key);
      if (sanitizedKey) {
        sanitized[sanitizedKey] = sanitizeObject(value);
      }
    }
    return sanitized;
  }

  return obj;
}
