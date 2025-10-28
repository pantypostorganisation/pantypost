// src/utils/security/rate-limiter.ts

/**
 * Client-side rate limiting implementation
 * Helps prevent spam and abuse of forms/API calls
 */

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  identifier?: string;
  blockDuration?: number; // Add optional custom block duration
}

interface RateLimitEntry {
  attempts: number;
  firstAttemptTime: number;
  blockedUntil?: number;
}

/**
 * Rate limiter for different actions
 */
export class ActionRateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private readonly storageKey = 'rate_limits';

  constructor() {
    this.loadFromStorage();
    this.cleanupExpired();
  }

  /**
   * Check if an action is allowed
   */
  check(action: string, config: RateLimitConfig): {
    allowed: boolean;
    remainingAttempts: number;
    resetTime?: Date;
    waitTime?: number;
  } {
    const key = this.getKey(action, config.identifier);
    const now = Date.now();
    const entry = this.limits.get(key);

    // Clean up old entries periodically
    if (Math.random() < 0.1) {
      this.cleanupExpired();
    }

    // Check if blocked
    if (entry?.blockedUntil && entry.blockedUntil > now) {
      const waitTime = Math.ceil((entry.blockedUntil - now) / 1000);
      return {
        allowed: false,
        remainingAttempts: 0,
        resetTime: new Date(entry.blockedUntil),
        waitTime,
      };
    }

    // No entry or window expired
    if (!entry || now - entry.firstAttemptTime > config.windowMs) {
      this.limits.set(key, {
        attempts: 1,
        firstAttemptTime: now,
      });
      this.saveToStorage();
      
      return {
        allowed: true,
        remainingAttempts: config.maxAttempts - 1,
        resetTime: new Date(now + config.windowMs),
      };
    }

    // Within window
    if (entry.attempts >= config.maxAttempts) {
      // Use custom block duration or default to a reasonable time
      const blockDuration = config.blockDuration || Math.min(config.windowMs, 60 * 60 * 1000); // Max 1 hour default
      entry.blockedUntil = now + blockDuration;
      this.saveToStorage();
      
      return {
        allowed: false,
        remainingAttempts: 0,
        resetTime: new Date(entry.blockedUntil),
        waitTime: Math.ceil(blockDuration / 1000),
      };
    }

    // Increment attempts
    entry.attempts++;
    this.saveToStorage();
    
    return {
      allowed: true,
      remainingAttempts: config.maxAttempts - entry.attempts,
      resetTime: new Date(entry.firstAttemptTime + config.windowMs),
    };
  }

  /**
   * Reset rate limit for specific action
   */
  reset(action: string, identifier?: string): void {
    const key = this.getKey(action, identifier);
    this.limits.delete(key);
    this.saveToStorage();
  }

  /**
   * Get key for rate limit entry
   */
  private getKey(action: string, identifier?: string): string {
    return identifier ? `${action}:${identifier}` : action;
  }

  /**
   * Load rate limits from localStorage
   */
  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        this.limits = new Map(Object.entries(data));
      }
    } catch {
      // Ignore errors
    }
  }

  /**
   * Save rate limits to localStorage
   */
  private saveToStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const data: Record<string, RateLimitEntry> = {};
      this.limits.forEach((value, key) => {
        data[key] = value;
      });
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch {
      // Ignore errors
    }
  }

  /**
   * Clean up expired entries
   */
  private cleanupExpired(): void {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    this.limits.forEach((entry, key) => {
      if (now - entry.firstAttemptTime > maxAge) {
        this.limits.delete(key);
      }
    });

    this.saveToStorage();
  }
}

/**
 * Predefined rate limit configurations
 */
export const RATE_LIMITS = {
  // Authentication - INCREASED FOR TESTING
  LOGIN: {
    maxAttempts: 300, // Increased from 5 to 300 for testing
    windowMs: 30 * 60 * 1000, // Changed to 30 minutes
    blockDuration: 30 * 60 * 1000, // Block for 30 minutes
  },
  SIGNUP: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    blockDuration: 60 * 60 * 1000, // Block for 1 hour
  },
  PASSWORD_RESET: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    blockDuration: 60 * 60 * 1000, // Block for 1 hour
  },

  // User actions
  MESSAGE_SEND: {
    maxAttempts: 30,
    windowMs: 60 * 1000, // 1 minute
    blockDuration: 5 * 60 * 1000, // Block for 5 minutes
  },
  LISTING_CREATE: {
    maxAttempts: 10,
    windowMs: 60 * 60 * 1000, // 1 hour
    blockDuration: 60 * 60 * 1000, // Block for 1 hour
  },
  CUSTOM_REQUEST: {
    maxAttempts: 5,
    windowMs: 60 * 60 * 1000, // 1 hour
    blockDuration: 60 * 60 * 1000, // Block for 1 hour
  },

  // Financial - More reasonable block times
  WITHDRAWAL: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    blockDuration: 60 * 60 * 1000, // Block for 1 hour if exceeded
  },
  DEPOSIT: {
    maxAttempts: 10,
    windowMs: 60 * 60 * 1000, // 1 hour
    blockDuration: 30 * 60 * 1000, // Block for 30 minutes
  },
  TIP: {
    maxAttempts: 20,
    windowMs: 60 * 60 * 1000, // 1 hour
    blockDuration: 30 * 60 * 1000, // Block for 30 minutes
  },

  // Search/Browse
  SEARCH: {
    maxAttempts: 60,
    windowMs: 60 * 1000, // 1 minute
    blockDuration: 5 * 60 * 1000, // Block for 5 minutes
  },
  API_CALL: {
    maxAttempts: 100,
    windowMs: 60 * 1000, // 1 minute
    blockDuration: 5 * 60 * 1000, // Block for 5 minutes
  },

  // File uploads
  IMAGE_UPLOAD: {
    maxAttempts: 20,
    windowMs: 60 * 60 * 1000, // 1 hour
    blockDuration: 30 * 60 * 1000, // Block for 30 minutes
  },
  DOCUMENT_UPLOAD: {
    maxAttempts: 5,
    windowMs: 60 * 60 * 1000, // 1 hour
    blockDuration: 60 * 60 * 1000, // Block for 1 hour
  },

  // Admin actions
  BAN_USER: {
    maxAttempts: 10,
    windowMs: 60 * 60 * 1000, // 1 hour
    blockDuration: 60 * 60 * 1000, // Block for 1 hour
  },
  REPORT_ACTION: {
    maxAttempts: 20,
    windowMs: 60 * 60 * 1000, // 1 hour
    blockDuration: 30 * 60 * 1000, // Block for 30 minutes
  },
};

/**
 * Global rate limiter instance
 */
let rateLimiterInstance: ActionRateLimiter | null = null;

export function getRateLimiter(): ActionRateLimiter {
  if (!rateLimiterInstance) {
    rateLimiterInstance = new ActionRateLimiter();
  }
  return rateLimiterInstance;
}

/**
 * Rate limit decorator for functions
 */
export function rateLimit(action: string, config: RateLimitConfig) {
  return function (target: Record<string, unknown>, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const limiter = getRateLimiter();
      const result = limiter.check(action, config);

      if (!result.allowed) {
        throw new Error(
          `Rate limit exceeded. Please wait ${result.waitTime} seconds before trying again.`
        );
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

/**
 * React hook for rate limiting
 */
export function useRateLimit(action: string, config: RateLimitConfig = RATE_LIMITS.API_CALL) {
  const limiter = getRateLimiter();

  const checkLimit = (identifier?: string) => {
    return limiter.check(action, { ...config, identifier });
  };

  const resetLimit = (identifier?: string) => {
    limiter.reset(action, identifier);
  };

  return { checkLimit, resetLimit };
}

/**
 * Middleware-style rate limit checker
 */
export async function withRateLimit<T>(
  action: string,
  config: RateLimitConfig,
  callback: () => Promise<T>
): Promise<T> {
  const limiter = getRateLimiter();
  const result = limiter.check(action, config);

  if (!result.allowed) {
    throw new Error(
      `Rate limit exceeded. Please wait ${result.waitTime} seconds before trying again.`
    );
  }

  try {
    return await callback();
  } catch (error) {
    // On error, give back one attempt
    limiter.reset(action, config.identifier);
    throw error;
  }
}

/**
 * Format wait time for user display
 */
export function formatWaitTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} second${seconds === 1 ? '' : 's'}`;
  }

  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? '' : 's'}`;
  }

  const hours = Math.ceil(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? '' : 's'}`;
  }

  const days = Math.ceil(hours / 24);
  return `${days} day${days === 1 ? '' : 's'}`;
}

/**
 * Get human-readable rate limit message
 */
export function getRateLimitMessage(result: ReturnType<ActionRateLimiter['check']>): string {
  if (result.allowed) {
    if (result.remainingAttempts <= 3) {
      return `You have ${result.remainingAttempts} attempt${
        result.remainingAttempts === 1 ? '' : 's'
      } remaining.`;
    }
    return '';
  }

  if (result.waitTime) {
    return `Too many attempts. Please wait ${formatWaitTime(result.waitTime)} before trying again.`;
  }

  return 'Rate limit exceeded. Please try again later.';
}
