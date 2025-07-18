// src/services/storage.service.ts

import { FEATURES, ApiResponse } from './api.config';
import { sanitizeStrict, sanitizeObject } from '@/utils/security/sanitization';
import { getRateLimiter, RATE_LIMITS } from '@/utils/security/rate-limiter';
import { z } from 'zod';

/**
 * Enhanced Storage Service with transaction support and error recovery
 */

interface StorageTransaction {
  operations: Array<{
    type: 'set' | 'remove';
    key: string;
    value?: any;
  }>;
  backup: Map<string, string | null>;
}

// Constants for security limits
const STORAGE_LIMITS = {
  MAX_KEY_LENGTH: 100,
  MAX_VALUE_SIZE: 1 * 1024 * 1024, // 1MB per value
  MAX_TOTAL_SIZE: 5 * 1024 * 1024, // 5MB total
  MAX_KEYS: 1000,
  MAX_BATCH_SIZE: 50,
  ALLOWED_KEY_PATTERN: /^[a-zA-Z0-9_-]+$/,
  RESERVED_PREFIXES: ['system_', 'internal_'],
  // Allow these specific system keys that the app uses
  ALLOWED_SYSTEM_KEYS: ['__walletMockDataCleared__', '__lastSyncTime__', '__initialized__', 'currentUser', 'session_fingerprint', 'auth_token', 'refresh_token', 'auth_token_data', 'panty_custom_requests'],
};

// Validation schemas
const storageKeySchema = z.string()
  .min(1, 'Key cannot be empty')
  .max(STORAGE_LIMITS.MAX_KEY_LENGTH, `Key cannot exceed ${STORAGE_LIMITS.MAX_KEY_LENGTH} characters`)
  .regex(STORAGE_LIMITS.ALLOWED_KEY_PATTERN, 'Key contains invalid characters')
  .refine(key => {
    // Allow specific system keys
    if (STORAGE_LIMITS.ALLOWED_SYSTEM_KEYS.includes(key)) {
      return true;
    }
    // Otherwise check for reserved prefixes
    return !STORAGE_LIMITS.RESERVED_PREFIXES.some(prefix => key.startsWith(prefix));
  }, {
    message: 'Key uses reserved prefix'
  });

export class StorageService {
  private static transactionInProgress = false;
  private static operationQueue: Array<() => Promise<void>> = [];
  private static isProcessingQueue = false;
  private rateLimiter = getRateLimiter();
  // Track auth-related operations separately with more lenient limits
  private static authOperationCount = 0;
  private static authOperationResetTime = 0;

  /**
   * Validate storage key
   */
  private validateKey(key: string): string {
    const result = storageKeySchema.safeParse(key);
    if (!result.success) {
      throw new Error(`Invalid storage key: ${result.error.errors[0]?.message}`);
    }
    return sanitizeStrict(result.data);
  }

  /**
   * Check if value size is within limits
   */
  private validateValueSize(value: any): void {
    const serialized = JSON.stringify(value);
    if (serialized.length > STORAGE_LIMITS.MAX_VALUE_SIZE) {
      throw new Error(`Value size exceeds limit of ${STORAGE_LIMITS.MAX_VALUE_SIZE / 1024}KB`);
    }
  }

  /**
   * Check storage quota before writing
   */
  private async checkStorageQuota(): Promise<void> {
    const info = await this.getStorageInfo();
    if (info.percentage > 90) {
      throw new Error('Storage quota exceeded (90% full)');
    }
  }

  /**
   * Check if this is an auth-related operation
   */
  private isAuthOperation(key: string): boolean {
    const authKeys = ['currentUser', 'auth_token', 'refresh_token', 'auth_token_data', 'session_fingerprint'];
    return authKeys.includes(key);
  }

  /**
   * Check rate limit for auth operations (more lenient)
   */
  private checkAuthRateLimit(): boolean {
    const now = Date.now();
    
    // Reset counter every minute
    if (now - StorageService.authOperationResetTime > 60000) {
      StorageService.authOperationCount = 0;
      StorageService.authOperationResetTime = now;
    }
    
    // Allow up to 50 auth operations per minute (very lenient)
    if (StorageService.authOperationCount >= 50) {
      return false;
    }
    
    StorageService.authOperationCount++;
    return true;
  }

  /**
   * Execute a function with retry logic
   */
  private async withRetry<T>(
    operation: () => T,
    maxRetries: number = 3,
    delay: number = 100
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return operation();
      } catch (error) {
        lastError = error as Error;
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
        }
      }
    }
    
    throw lastError || new Error('Operation failed after retries');
  }

  /**
   * Process queued operations sequentially
   */
  private async processQueue(): Promise<void> {
    if (StorageService.isProcessingQueue || StorageService.operationQueue.length === 0) {
      return;
    }

    StorageService.isProcessingQueue = true;

    while (StorageService.operationQueue.length > 0) {
      const operation = StorageService.operationQueue.shift();
      if (operation) {
        try {
          await operation();
        } catch (error) {
          console.error('Queue operation failed:', error);
        }
      }
    }

    StorageService.isProcessingQueue = false;
  }

  /**
   * Queue an operation to prevent race conditions
   */
  private async queueOperation<T>(operation: () => Promise<T>, key?: string): Promise<T> {
    // For auth operations, use more lenient rate limiting
    if (key && this.isAuthOperation(key)) {
      if (!this.checkAuthRateLimit()) {
        throw new Error('Auth operation rate limit exceeded. Please wait a moment.');
      }
    } else {
      // Check rate limit for non-auth storage operations
      const rateLimitResult = this.rateLimiter.check('API_CALL', {
        ...RATE_LIMITS.API_CALL,
        maxAttempts: 200, // More lenient for storage operations
        windowMs: 60 * 1000 // 1 minute window
      });
      
      if (!rateLimitResult.allowed) {
        throw new Error(`Rate limit exceeded. Please wait ${rateLimitResult.waitTime} seconds.`);
      }
    }

    return new Promise((resolve, reject) => {
      StorageService.operationQueue.push(async () => {
        try {
          const result = await operation();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      // Start processing queue if not already processing
      this.processQueue();
    });
  }

  /**
   * Get item from storage with validation
   */
  async getItem<T>(key: string, defaultValue: T): Promise<T> {
    try {
      // Validate key
      const validatedKey = this.validateKey(key);

      if (FEATURES.USE_MOCK_API) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      const item = await this.withRetry(() => localStorage.getItem(validatedKey));
      
      if (item === null) {
        return defaultValue;
      }

      try {
        const parsed = JSON.parse(item);
        
        // Sanitize the retrieved data
        const sanitized = this.sanitizeStoredData(parsed);
        
        // Validate the parsed data matches expected type structure
        if (this.isValidData(sanitized, defaultValue)) {
          return sanitized as T;
        } else {
          console.warn(`Invalid data structure for key "${validatedKey}", using default`);
          return defaultValue;
        }
      } catch (parseError) {
        console.error(`Error parsing item "${validatedKey}":`, parseError);
        
        // Try to parse as number for backward compatibility
        if (typeof defaultValue === 'number' && !isNaN(Number(item))) {
          return Number(item) as T;
        }
        
        return defaultValue;
      }
    } catch (error) {
      console.error(`Error getting item "${key}" from storage:`, error);
      return defaultValue;
    }
  }

  /**
   * Set item in storage with queuing
   */
  async setItem<T>(key: string, value: T): Promise<boolean> {
    return this.queueOperation(async () => {
      try {
        // Validate key
        const validatedKey = this.validateKey(key);
        
        // Validate value size
        this.validateValueSize(value);
        
        // Check storage quota
        await this.checkStorageQuota();

        if (FEATURES.USE_MOCK_API) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }

        const serialized = JSON.stringify(value);
        
        await this.withRetry(() => {
          localStorage.setItem(validatedKey, serialized);
          
          // Verify write was successful
          const verification = localStorage.getItem(validatedKey);
          if (verification !== serialized) {
            throw new Error('Storage write verification failed');
          }
        });

        return true;
      } catch (error) {
        console.error(`Error setting item "${key}" in storage:`, error);
        return false;
      }
    }, key);
  }

  /**
   * Remove item from storage
   */
  async removeItem(key: string): Promise<boolean> {
    return this.queueOperation(async () => {
      try {
        // Validate key
        const validatedKey = this.validateKey(key);

        if (FEATURES.USE_MOCK_API) {
          await new Promise(resolve => setTimeout(resolve, 20));
        }

        await this.withRetry(() => localStorage.removeItem(validatedKey));
        return true;
      } catch (error) {
        console.error(`Error removing item "${key}" from storage:`, error);
        return false;
      }
    }, key);
  }

  /**
   * Begin a transaction for atomic operations
   */
  beginTransaction(): StorageTransaction {
    if (StorageService.transactionInProgress) {
      throw new Error('Another transaction is already in progress');
    }
    
    StorageService.transactionInProgress = true;
    
    return {
      operations: [],
      backup: new Map()
    };
  }

  /**
   * Commit a transaction atomically
   */
  async commitTransaction(transaction: StorageTransaction): Promise<boolean> {
    try {
      // Validate all operations first
      for (const op of transaction.operations) {
        this.validateKey(op.key);
        if (op.type === 'set' && op.value !== undefined) {
          this.validateValueSize(op.value);
        }
      }

      // Check storage quota
      await this.checkStorageQuota();

      // Backup current values
      for (const op of transaction.operations) {
        if (op.type === 'set' || op.type === 'remove') {
          const currentValue = localStorage.getItem(op.key);
          transaction.backup.set(op.key, currentValue);
        }
      }

      // Execute all operations
      for (const op of transaction.operations) {
        if (op.type === 'set') {
          localStorage.setItem(op.key, JSON.stringify(op.value));
        } else if (op.type === 'remove') {
          localStorage.removeItem(op.key);
        }
      }

      return true;
    } catch (error) {
      // Rollback on error
      console.error('Transaction failed, rolling back:', error);
      await this.rollbackTransaction(transaction);
      return false;
    } finally {
      StorageService.transactionInProgress = false;
    }
  }

  /**
   * Rollback a transaction
   */
  private async rollbackTransaction(transaction: StorageTransaction): Promise<void> {
    try {
      for (const [key, value] of transaction.backup.entries()) {
        if (value === null) {
          localStorage.removeItem(key);
        } else {
          localStorage.setItem(key, value);
        }
      }
    } catch (error) {
      console.error('Rollback failed:', error);
    }
  }

  /**
   * Update specific fields of an object in storage atomically
   */
  async updateItem<T extends object>(
    key: string,
    updates: Partial<T>
  ): Promise<boolean> {
    return this.queueOperation(async () => {
      try {
        // Validate key
        const validatedKey = this.validateKey(key);
        
        const current = await this.getItem<T | null>(validatedKey, null);
        
        if (current === null) {
          return await this.setItem(validatedKey, updates as T);
        }

        const updated = { ...current, ...updates };
        return await this.setItem(validatedKey, updated);
      } catch (error) {
        console.error(`Error updating item "${key}" in storage:`, error);
        return false;
      }
    }, key);
  }

  /**
   * Get all keys matching a pattern
   */
  async getKeys(pattern?: string): Promise<string[]> {
    try {
      // Validate and sanitize pattern to prevent regex injection
      const sanitizedPattern = pattern ? sanitizeStrict(pattern).substring(0, 50) : undefined;
      
      if (FEATURES.USE_MOCK_API) {
        await new Promise(resolve => setTimeout(resolve, 20));
      }

      const keys: string[] = [];
      const totalKeys = localStorage.length;
      
      // Limit the number of keys to prevent DoS
      if (totalKeys > STORAGE_LIMITS.MAX_KEYS) {
        console.warn(`Storage contains ${totalKeys} keys, limiting to ${STORAGE_LIMITS.MAX_KEYS}`);
      }

      for (let i = 0; i < Math.min(totalKeys, STORAGE_LIMITS.MAX_KEYS); i++) {
        const key = localStorage.key(i);
        if (key && (!sanitizedPattern || key.includes(sanitizedPattern))) {
          // Only return keys that pass validation
          try {
            this.validateKey(key);
            keys.push(key);
          } catch {
            // Skip invalid keys
          }
        }
      }
      return keys;
    } catch (error) {
      console.error('Error getting keys from storage:', error);
      return [];
    }
  }

  /**
   * Check if key exists
   */
  async hasKey(key: string): Promise<boolean> {
    try {
      // Validate key
      const validatedKey = this.validateKey(key);

      if (FEATURES.USE_MOCK_API) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      return localStorage.getItem(validatedKey) !== null;
    } catch (error) {
      console.error(`Error checking if key "${key}" exists:`, error);
      return false;
    }
  }

  /**
   * Clear all storage
   */
  async clear(preserveKeys?: string[]): Promise<boolean> {
    return this.queueOperation(async () => {
      try {
        // Validate preserve keys
        const validatedPreserveKeys = preserveKeys?.map(key => this.validateKey(key));

        if (FEATURES.USE_MOCK_API) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        if (validatedPreserveKeys && validatedPreserveKeys.length > 0) {
          // Preserve specified keys
          const preserved: { [key: string]: any } = {};
          for (const key of validatedPreserveKeys) {
            const value = localStorage.getItem(key);
            if (value !== null) {
              preserved[key] = value;
            }
          }

          localStorage.clear();

          // Restore preserved keys
          for (const [key, value] of Object.entries(preserved)) {
            localStorage.setItem(key, value);
          }
        } else {
          localStorage.clear();
        }

        return true;
      } catch (error) {
        console.error('Error clearing storage:', error);
        return false;
      }
    });
  }

  /**
   * Get storage size information
   */
  async getStorageInfo(): Promise<{
    used: number;
    quota: number;
    percentage: number;
  }> {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        return {
          used: estimate.usage || 0,
          quota: estimate.quota || 0,
          percentage: estimate.quota ? ((estimate.usage || 0) / estimate.quota) * 100 : 0,
        };
      }

      // Fallback calculation
      let totalSize = 0;
      let keyCount = 0;
      
      for (let i = 0; i < localStorage.length && i < STORAGE_LIMITS.MAX_KEYS; i++) {
        const key = localStorage.key(i);
        if (key) {
          totalSize += key.length + (localStorage.getItem(key) || '').length;
          keyCount++;
        }
      }

      return {
        used: totalSize,
        quota: STORAGE_LIMITS.MAX_TOTAL_SIZE,
        percentage: (totalSize / STORAGE_LIMITS.MAX_TOTAL_SIZE) * 100,
      };
    } catch (error) {
      console.error('Error getting storage info:', error);
      return { used: 0, quota: 0, percentage: 0 };
    }
  }

  /**
   * Batch set multiple items atomically
   */
  async batchSet(items: Array<{ key: string; value: any }>): Promise<boolean> {
    // Limit batch size to prevent DoS
    if (items.length > STORAGE_LIMITS.MAX_BATCH_SIZE) {
      throw new Error(`Batch size exceeds limit of ${STORAGE_LIMITS.MAX_BATCH_SIZE} items`);
    }

    const transaction = this.beginTransaction();
    
    for (const item of items) {
      transaction.operations.push({
        type: 'set',
        key: item.key,
        value: item.value
      });
    }
    
    return this.commitTransaction(transaction);
  }

  /**
   * Validate data structure matches expected type
   */
  private isValidData<T>(data: any, defaultValue: T): boolean {
    // If default is null, accept any non-null value
    if (defaultValue === null) {
      return data !== null && data !== undefined;
    }
    
    // For primitive types (string, number, boolean), just check type
    const primitiveTypes = ['string', 'number', 'boolean'];
    if (primitiveTypes.includes(typeof defaultValue)) {
      return typeof data === typeof defaultValue;
    }

    // Array validation
    if (Array.isArray(defaultValue)) {
      return Array.isArray(data);
    }

    // Object validation
    if (typeof defaultValue === 'object') {
      if (data === null || typeof data !== 'object') {
        return false;
      }
      
      // Check if critical keys exist
      const defaultKeys = Object.keys(defaultValue);
      
      // Allow data to have more keys than default (for backward compatibility)
      // but it must have at least the default keys
      for (const key of defaultKeys) {
        if (!(key in data)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Sanitize data retrieved from storage
   */
  private sanitizeStoredData(data: any): any {
    if (data === null || data === undefined) {
      return data;
    }

    if (typeof data === 'string') {
      return sanitizeStrict(data);
    }

    if (typeof data === 'object') {
      return sanitizeObject(data, {
        maxDepth: 10,
        keySanitizer: (key) => sanitizeStrict(key),
        valueSanitizer: (value) => {
          if (typeof value === 'string') {
            return sanitizeStrict(value);
          }
          return value;
        },
      });
    }

    return data;
  }

  /**
   * Export all wallet data for backup
   */
  async exportWalletData(): Promise<any> {
    // Check rate limit for export operations
    const rateLimitResult = this.rateLimiter.check('API_CALL', {
      maxAttempts: 5,
      windowMs: 60 * 60 * 1000 // 5 exports per hour
    });
    if (!rateLimitResult.allowed) {
      throw new Error(`Export rate limit exceeded. Please wait ${rateLimitResult.waitTime} seconds.`);
    }

    const walletKeys = await this.getKeys('wallet_');
    const data: any = {};
    
    // Limit export size
    let exportSize = 0;
    const maxExportSize = 2 * 1024 * 1024; // 2MB limit for exports
    
    for (const key of walletKeys) {
      const value = await this.getItem(key, null);
      if (value !== null) {
        const serialized = JSON.stringify(value);
        exportSize += serialized.length;
        
        if (exportSize > maxExportSize) {
          throw new Error('Export size exceeds 2MB limit');
        }
        
        data[key] = value;
      }
    }
    
    return data;
  }

  /**
   * Import wallet data from backup
   */
  async importWalletData(data: any): Promise<boolean> {
    try {
      // Validate import data structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid import data format');
      }

      // Check rate limit for import operations
      const rateLimitResult = this.rateLimiter.check('API_CALL', {
        maxAttempts: 3,
        windowMs: 60 * 60 * 1000 // 3 imports per hour
      });
      if (!rateLimitResult.allowed) {
        throw new Error(`Import rate limit exceeded. Please wait ${rateLimitResult.waitTime} seconds.`);
      }

      // Validate and sanitize all keys and values
      const items: Array<{ key: string; value: any }> = [];
      
      for (const [key, value] of Object.entries(data)) {
        // Only allow wallet_ prefixed keys
        if (!key.startsWith('wallet_')) {
          console.warn(`Skipping non-wallet key during import: ${key}`);
          continue;
        }
        
        try {
          const validatedKey = this.validateKey(key);
          const sanitizedValue = this.sanitizeStoredData(value);
          
          items.push({
            key: validatedKey,
            value: sanitizedValue
          });
        } catch (error) {
          console.error(`Failed to import key "${key}":`, error);
        }
      }
      
      if (items.length === 0) {
        throw new Error('No valid data to import');
      }
      
      return await this.batchSet(items);
    } catch (error) {
      console.error('Error importing wallet data:', error);
      return false;
    }
  }
}

// Export singleton instance
export const storageService = new StorageService();