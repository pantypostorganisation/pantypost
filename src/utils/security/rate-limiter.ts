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
    this.clearStaleSignupBlocks();
    this.cleanupExpired();
  }

  /* Blocks are stored with an absolute expiry timestamp, so a seller
     locked out under the OLD one-hour signup rule stays locked out for
     the full hour even after the rule is relaxed -- the fix does not
     reach the block already sitting in their browser.

     Signup and password reset are the two places where an inherited
     lockout costs a real user, so any block on those longer than their
     current maximum is dropped on load. Financial and messaging limits
     are left alone. */
  private clearStaleSignupBlocks(): void {
    const now = Date.now();
    const maxBlock: Record<string, number> = {
      SIGNUP: RATE_LIMITS.SIGNUP.blockDuration,
      PASSWORD_RESET: RATE_LIMITS.PASSWORD_RESET.blockDuration,
    };

    let changed = false;
    this.limits.forEach((entry, key) => {
      const action = key.split(':')[0];
      const limit = maxBlock[action];
      if (!limit || !entry.blockedUntil) return;
      if (entry.blockedUntil - now > limit) {
        this.limits.delete(key);
        changed = true;
      }
    });

    if (changed) this.saveToStorage();
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
      /* Default block: thirty seconds.
       *
       * This used to fall back to the whole window, so any caller that
       * set windowMs to an hour and forgot blockDuration locked the
       * user out for an hour. A seller hit it on the listing form --
       * her attempts were FAILING because of a validation bug, each
       * failure counted, and the reward for trying to fix her own
       * listing was "wait 3600 seconds".
       *
       * A limiter exists to stop a script hammering the API. Thirty
       * seconds does that -- no automated run survives a pause every
       * handful of requests -- while a person who hits it barely
       * notices. Longer blocks were costing real sellers real
       * listings, which is a far more expensive failure than a slow
       * bot. Callers that genuinely need longer set blockDuration
       * explicitly. */
      const blockDuration = config.blockDuration || 30 * 1000;
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
  /**
   * Gives back one attempt.
   *
   * The counter increments when a submission is ATTEMPTED, which is
   * right for stopping a script and wrong for everything else: a
   * seller whose listing is rejected tries again, reasonably, and the
   * limiter treats her like an attacker. Two sellers hit this and one
   * gave up.
   *
   * So a submission that never reached the server -- failed
   * validation, a rejected upload -- hands its attempt back. Only
   * genuine traffic counts toward the limit, which is what the limit
   * was supposed to measure.
   */
  refundAttempt(action: string, identifier?: string): void {
    const key = this.getKey(action, identifier);
    const entry = this.limits.get(key);
    if (!entry) return;

    entry.attempts = Math.max(0, entry.attempts - 1);

    /* Lift any active block as well. If the attempt that triggered it
       never counted, neither should the block it caused -- otherwise a
       seller refunded back under the limit is still locked out. */
    entry.blockedUntil = undefined;

    this.saveToStorage();
  }

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
    /* Was 3 per hour with a 1 hour block, which locked real sellers out
       of signing up: every failed attempt counts, so three typos in the
       form -- a taken username, a weak password, a mistyped email --
       banned them for an hour on their first visit. That is the single
       worst moment in the product to add friction. The backend still
       enforces its own per-IP signup limit, so bot floods remain
       capped; this client-side check only exists to stop someone
       hammering the button. */
    maxAttempts: 30,
    windowMs: 60 * 60 * 1000, // 1 hour
    blockDuration: 2 * 60 * 1000, // Block for 2 minutes
  },
  PASSWORD_RESET: {
    // Same reasoning as SIGNUP: a locked-out password reset is a lost
    // user. The backend limiter is the real protection here.
    maxAttempts: 10,
    windowMs: 60 * 60 * 1000, // 1 hour
    blockDuration: 5 * 60 * 1000, // Block for 5 minutes
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
  /* Five attempts then a FULL HOUR locked out was written for a rail
     that moves real money to a bank. It fires on failed attempts too,
     so a seller who has not added payout details yet -- the most
     common reason a withdrawal is refused -- burns the budget on
     errors and is then locked out for an hour without ever having
     requested anything.

     The request still goes to a human for approval, so the limit is
     not what protects the money; the review is. Ten attempts and five
     minutes. */
  WITHDRAWAL: {
    maxAttempts: 30,
    windowMs: 15 * 60 * 1000, // 15 minutes
    blockDuration: 30 * 1000, // Block for 30 seconds
  },
  /* A crypto deposit "attempt" is generating an address, not spending
     money -- a buyer comparing networks or coming back later racks them
     up without doing anything wrong. Ten of those bought a
     THIRTY-MINUTE lockout, which is a long time to be told nothing
     while trying to hand us money.

     The count is unchanged; the punishment is not. Five minutes is
     enough to stop a script and short enough that a real buyer waits
     rather than leaves. */
  DEPOSIT: {
    maxAttempts: 30,
    windowMs: 60 * 60 * 1000, // 1 hour
    blockDuration: 30 * 1000, // Block for 30 seconds
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
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
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





