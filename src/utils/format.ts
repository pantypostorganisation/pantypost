// src/utils/format.ts
/**
 * Utility functions for formatting values consistently across the application
 */

/**
 * Format a price in dollars
 * @param price The price to format (can be number or undefined)
 * @returns A formatted price string with $ symbol
 */
export function formatPrice(price?: number): string {
  if (price === undefined || price === null) {
    return '$0.00';
  }
  return formatCurrency(price);
}

/**
 * Format a date string to a relative time (e.g., "2 hours ago")
 * @param dateString The date string to format
 * @returns A human-readable relative time string
 */
export function formatTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  
  // Check for invalid date
  if (isNaN(date.getTime())) {
    return 'Invalid date';
  }
  
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  // Handle future dates
  if (seconds < 0) {
    return 'in the future';
  }
  
  // Time intervals in seconds
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
    second: 1
  };
  
  // Find the appropriate interval
  let counter;
  let interval: keyof typeof intervals;
  
  if (seconds < intervals.minute) {
    return 'just now';
  } else if (seconds < intervals.hour) {
    counter = Math.floor(seconds / intervals.minute);
    interval = 'minute';
  } else if (seconds < intervals.day) {
    counter = Math.floor(seconds / intervals.hour);
    interval = 'hour';
  } else if (seconds < intervals.week) {
    counter = Math.floor(seconds / intervals.day);
    interval = 'day';
  } else if (seconds < intervals.month) {
    counter = Math.floor(seconds / intervals.week);
    interval = 'week';
  } else if (seconds < intervals.year) {
    counter = Math.floor(seconds / intervals.month);
    interval = 'month';
  } else {
    counter = Math.floor(seconds / intervals.year);
    interval = 'year';
  }
  
  // Return formatted string with plural handling
  return `${counter} ${interval}${counter !== 1 ? 's' : ''} ago`;
}

/**
 * Format a date string to a short format (e.g., "Apr 5, 2023")
 * @param dateString The date string to format
 * @returns A formatted date string
 */
export function formatShortDate(dateString: string): string {
  const date = new Date(dateString);
  
  // Check for invalid date
  if (isNaN(date.getTime())) {
    return 'Invalid date';
  }
  
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  };
  
  return date.toLocaleDateString(undefined, options);
}

/**
 * Format a date string to a time format (e.g., "2:30 PM")
 * @param dateString The date string to format
 * @returns A formatted time string
 */
export function formatTime(dateString: string): string {
  const date = new Date(dateString);
  
  // Check for invalid date
  if (isNaN(date.getTime())) {
    return 'Invalid time';
  }
  
  const options: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  };
  
  return date.toLocaleTimeString(undefined, options);
}

/**
 * Format a number as currency with the specified locale and currency
 * @param amount The amount to format
 * @param locale The locale to use (default: 'en-US')
 * @param currency The currency code to use (default: 'USD')
 * @returns A formatted currency string
 */
export function formatCurrency(
  amount: number,
  locale: string = 'en-US',
  currency: string = 'USD'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Truncate a string to a specified length and add an ellipsis if needed
 * @param str The string to truncate
 * @param maxLength The maximum length of the truncated string
 * @returns The truncated string
 */
export function truncateString(str: string, maxLength: number): string {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  
  return `${str.substring(0, maxLength)}...`;
}

/**
 * Format a file size in bytes to a human-readable string
 * @param bytes The file size in bytes
 * @param decimals The number of decimal places to show (default: 1)
 * @returns A formatted file size string
 */
export function formatFileSize(bytes: number, decimals: number = 1): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

/**
 * Generate initials from a name (e.g., "John Doe" -> "JD")
 * @param name The name to generate initials from
 * @param maxInitials The maximum number of initials to return (default: 2)
 * @returns The generated initials
 */
export function getInitials(name: string, maxInitials: number = 2): string {
  if (!name) return '';
  
  const parts = name.trim().split(/\s+/);
  const initials = parts.map(part => part.charAt(0).toUpperCase());
  
  return initials.slice(0, maxInitials).join('');
}

/**
 * Format a phone number to a standard format
 * @param phoneNumber The phone number to format
 * @returns A formatted phone number string
 */
export function formatPhoneNumber(phoneNumber: string): string {
  // Remove all non-digit characters
  const digitsOnly = phoneNumber.replace(/\D/g, '');
  
  // Format based on length
  if (digitsOnly.length === 10) {
    return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6)}`;
  } else if (digitsOnly.length === 11 && digitsOnly.charAt(0) === '1') {
    return `+1 (${digitsOnly.slice(1, 4)}) ${digitsOnly.slice(4, 7)}-${digitsOnly.slice(7)}`;
  }
  
  // If it doesn't match known formats, return as is with dashes
  return digitsOnly.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
}

/**
 * Format a number with commas as thousands separators
 * @param number The number to format
 * @returns A formatted number string
 */
export function formatNumber(number: number): string {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
