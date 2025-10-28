// src/utils/security/sanitization.ts

import DOMPurify from 'dompurify';

/**
 * Configuration for DOMPurify to prevent XSS attacks
 */
const DOMPURIFY_CONFIG = {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br', 'p', 'span'],
  ALLOWED_ATTR: [],
  KEEP_CONTENT: true,
  RETURN_TRUSTED_TYPE: false,
};

/**
 * Strict configuration - no HTML allowed at all
 */
const STRICT_CONFIG = {
  ALLOWED_TAGS: [],
  ALLOWED_ATTR: [],
  KEEP_CONTENT: true,
};

/**
 * Sanitizes HTML content to prevent XSS attacks
 * Allows only basic formatting tags
 */
export function sanitizeHtml(dirty: string): string {
  if (!dirty || typeof dirty !== 'string') {
    return '';
  }
  
  // Use DOMPurify with our config
  if (typeof window !== 'undefined') {
    return DOMPurify.sanitize(dirty, DOMPURIFY_CONFIG);
  }
  
  // Fallback for server-side (removes all HTML)
  return dirty.replace(/<[^>]*>/g, '');
}

/**
 * Strict sanitization - removes ALL HTML
 */
export function sanitizeStrict(dirty: string): string {
  if (!dirty || typeof dirty !== 'string') {
    return '';
  }
  
  if (typeof window !== 'undefined') {
    return DOMPurify.sanitize(dirty, STRICT_CONFIG);
  }
  
  return dirty.replace(/<[^>]*>/g, '');
}

/**
 * Sanitizes user input for display in HTML attributes
 * Prevents attribute-based XSS attacks
 */
export function sanitizeAttribute(value: string): string {
  if (!value || typeof value !== 'string') {
    return '';
  }
  
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitizes URLs to prevent javascript: and dangerous data: URIs
 * But allows safe image data URLs for verification images
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return '';
  }
  
  const trimmedUrl = url.trim().toLowerCase();
  
  // Allow safe image data URLs
  if (trimmedUrl.startsWith('data:')) {
    // Only allow image data URLs with safe formats
    const safeImageDataUrlPattern = /^data:image\/(jpeg|jpg|png|gif|webp|svg\+xml);base64,/i;
    if (safeImageDataUrlPattern.test(url)) {
      return url; // Return original URL to preserve base64 data
    }
    return ''; // Block other data URLs
  }
  
  // Block other dangerous protocols
  const dangerousProtocols = [
    'javascript:',
    'vbscript:',
    'file:',
    'about:',
  ];
  
  for (const protocol of dangerousProtocols) {
    if (trimmedUrl.startsWith(protocol)) {
      return '';
    }
  }
  
  // Allow only http, https, and relative URLs
  if (
    !trimmedUrl.startsWith('http://') &&
    !trimmedUrl.startsWith('https://') &&
    !trimmedUrl.startsWith('/') &&
    !trimmedUrl.startsWith('#')
  ) {
    return '';
  }
  
  return encodeURI(url);
}

/**
 * Sanitizes file names to prevent directory traversal attacks
 */
export function sanitizeFileName(fileName: string): string {
  if (!fileName || typeof fileName !== 'string') {
    return '';
  }
  
  // Remove path components
  const baseName = fileName.split(/[/\\]/).pop() || '';
  
  // Remove dangerous characters
  return baseName
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.{2,}/g, '_')
    .substring(0, 255); // Limit length
}

/**
 * Sanitizes search queries to prevent injection attacks
 */
export function sanitizeSearchQuery(query: string): string {
  if (!query || typeof query !== 'string') {
    return '';
  }
  
  return query
    .replace(/[<>\"'`;(){}]/g, '') // Remove potentially dangerous characters
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim()
    .substring(0, 100); // Limit length
}

/**
 * Sanitizes usernames
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
 * Sanitizes email addresses
 */
export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== 'string') {
    return '';
  }
  
  // Convert to lowercase and trim
  let sanitized = email.toLowerCase().trim();
  
  // Remove dangerous characters while keeping valid email chars
  sanitized = sanitized.replace(/[<>\"'`;(){}]/g, '');
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitized)) {
    return '';
  }
  
  return sanitized;
}

/**
 * Sanitizes numeric input and ensures it's within bounds
 */
export function sanitizeNumber(
  input: string | number,
  min: number = 0,
  max: number = Number.MAX_SAFE_INTEGER,
  decimals: number = 2
): number {
  let num: number;
  
  if (typeof input === 'string') {
    // Remove non-numeric characters except . and -
    const cleaned = input.replace(/[^0-9.-]/g, '');
    num = parseFloat(cleaned);
  } else {
    num = input;
  }
  
  // Check if valid number
  if (isNaN(num) || !isFinite(num)) {
    return min;
  }
  
  // Apply bounds
  if (num < min) return min;
  if (num > max) return max;
  
  // Round to specified decimals
  const factor = Math.pow(10, decimals);
  return Math.round(num * factor) / factor;
}

/**
 * Sanitizes currency amounts
 * Ensures proper decimal precision for money and avoids floating point issues
 */
export function sanitizeCurrency(amount: string | number): number {
  let num: number;
  
  if (typeof amount === 'string') {
    // Remove non-numeric characters except . and -
    const cleaned = amount.replace(/[^0-9.-]/g, '');
    num = parseFloat(cleaned);
  } else {
    num = amount;
  }
  
  // Check if valid number
  if (isNaN(num) || !isFinite(num)) {
    return 0;
  }
  
  // Apply bounds
  if (num < 0) return 0;
  if (num > 1000000) return 1000000;
  
  // FIXED: Round to 2 decimal places using proper technique to avoid floating point issues
  return Math.round(num * 100) / 100;
}

/**
 * Helper function to add currency values safely
 * Avoids floating point precision issues
 */
export function addCurrency(a: number, b: number): number {
  return Math.round((a + b) * 100) / 100;
}

/**
 * Helper function to subtract currency values safely
 * Avoids floating point precision issues
 */
export function subtractCurrency(a: number, b: number): number {
  return Math.round((a - b) * 100) / 100;
}

/**
 * Helper function to multiply currency values safely
 * Avoids floating point precision issues
 */
export function multiplyCurrency(amount: number, multiplier: number): number {
  return Math.round(amount * multiplier * 100) / 100;
}

/**
 * Sanitizes an array of strings
 */
export function sanitizeStringArray(
  arr: string[],
  maxItems: number = 50,
  itemSanitizer: (item: string) => string = sanitizeStrict
): string[] {
  if (!Array.isArray(arr)) {
    return [];
  }
  
  return arr
    .slice(0, maxItems)
    .map(itemSanitizer)
    .filter(item => item.length > 0);
}

/**
 * Sanitizes object keys and values recursively
 * Prevents prototype pollution attacks
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  options: {
    maxDepth?: number;
    allowedKeys?: string[];
    keySanitizer?: (key: string) => string;
    valueSanitizer?: (value: unknown) => unknown;
  } = {}
): Partial<T> {
  const {
    maxDepth = 5,
    allowedKeys,
    keySanitizer = sanitizeStrict,
    valueSanitizer = (v: unknown) => (typeof v === 'string' ? sanitizeStrict(v) : v),
  } = options;
  
  function sanitizeRecursive(input: unknown, depth: number): unknown {
    if (depth > maxDepth) {
      return null;
    }
    
    if (input === null || input === undefined) {
      return input;
    }
    
    if (typeof input === 'string') {
      return valueSanitizer(input);
    }
    
    if (typeof input === 'number' || typeof input === 'boolean') {
      return input;
    }
    
    if (Array.isArray(input)) {
      return input.map(item => sanitizeRecursive(item, depth + 1));
    }
    
    if (typeof input === 'object') {
      const sanitized: Record<string, unknown> = {};
      
      for (const [key, value] of Object.entries(input)) {
        // Skip prototype properties
        if (!Object.prototype.hasOwnProperty.call(input, key)) continue;
        
        // Skip dangerous keys
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
          continue;
        }
        
        // Apply key allowlist if provided
        if (allowedKeys && !allowedKeys.includes(key)) {
          continue;
        }
        
        const sanitizedKey = keySanitizer(key);
        if (sanitizedKey) {
          sanitized[sanitizedKey] = sanitizeRecursive(value, depth + 1);
        }
      }
      
      return sanitized;
    }
    
    return null;
  }
  
  return sanitizeRecursive(obj, 0) as Partial<T>;
}

/**
 * Sanitizes JSON string input
 * Prevents JSON injection attacks
 */
export function sanitizeJson(jsonString: string): object | null {
  if (!jsonString || typeof jsonString !== 'string') {
    return null;
  }
  
  try {
    // Remove any non-JSON characters
    const cleaned = jsonString.trim();
    
    // Basic validation
    if (!cleaned.startsWith('{') && !cleaned.startsWith('[')) {
      return null;
    }
    
    const parsed = JSON.parse(cleaned);
    return sanitizeObject(parsed);
  } catch {
    return null;
  }
}

/**
 * Sanitizes SQL-like input to prevent injection
 * Note: This is for client-side validation only - always use parameterized queries on the server
 */
export function sanitizeSqlInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  return input
    .replace(/['";\\]/g, '') // Remove quotes and escape characters
    .replace(/--/g, '') // Remove SQL comments
    .replace(/\/\*/g, '') // Remove multi-line comments
    .replace(/\*\//g, '')
    .replace(/\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b/gi, '') // Remove SQL keywords
    .trim();
}

/**
 * Creates a content security policy nonce
 */
export function generateCSPNonce(): string {
  if (typeof window !== 'undefined' && window.crypto) {
    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array));
  }
  
  // Fallback for server-side
  return Math.random().toString(36).substring(2, 15);
}

/**
 * Validates and sanitizes image data URLs
 */
export function sanitizeImageDataUrl(dataUrl: string): string | null {
  if (!dataUrl || typeof dataUrl !== 'string') {
    return null;
  }
  
  // Check if it's a valid data URL
  const dataUrlRegex = /^data:image\/(jpeg|jpg|png|gif|webp);base64,/;
  if (!dataUrlRegex.test(dataUrl)) {
    return null;
  }
  
  // Limit size (e.g., 5MB)
  const maxSize = 5 * 1024 * 1024 * 1.37; // Base64 is ~37% larger
  if (dataUrl.length > maxSize) {
    return null;
  }
  
  return dataUrl;
}

/**
 * Escapes HTML entities for safe display
 */
export function escapeHtml(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  
  return text.replace(/[&<>"'/]/g, (char) => map[char] || char);
}

/**
 * Sanitizes Markdown content
 * Allows basic markdown but prevents XSS
 */
export function sanitizeMarkdown(markdown: string): string {
  if (!markdown || typeof markdown !== 'string') {
    return '';
  }
  
  // First, escape HTML to prevent XSS
  let safe = escapeHtml(markdown);
  
  // Then allow specific markdown patterns
  // Bold: **text** or __text__
  safe = safe.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  safe = safe.replace(/__(.+?)__/g, '<strong>$1</strong>');
  
  // Italic: *text* or _text_
  safe = safe.replace(/\*(.+?)\*/g, '<em>$1</em>');
  safe = safe.replace(/_(.+?)_/g, '<em>$1</em>');
  
  // Line breaks
  safe = safe.replace(/\n/g, '<br>');
  
  return safe;
}
