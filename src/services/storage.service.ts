// src/services/storage.service.ts

import { FEATURES, ApiResponse } from './api.config';

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

export class StorageService {
  private static transactionInProgress = false;
  private static operationQueue: Array<() => Promise<void>> = [];
  private static isProcessingQueue = false;

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
  private async queueOperation<T>(operation: () => Promise<T>): Promise<T> {
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
      if (FEATURES.USE_MOCK_API) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      const item = await this.withRetry(() => localStorage.getItem(key));
      
      if (item === null) {
        return defaultValue;
      }

      try {
        const parsed = JSON.parse(item);
        
        // Validate the parsed data matches expected type structure
        if (this.isValidData(parsed, defaultValue)) {
          return parsed as T;
        } else {
          console.warn(`Invalid data structure for key "${key}", using default`);
          return defaultValue;
        }
      } catch (parseError) {
        console.error(`Error parsing item "${key}":`, parseError);
        
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
        if (FEATURES.USE_MOCK_API) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }

        const serialized = JSON.stringify(value);
        
        await this.withRetry(() => {
          localStorage.setItem(key, serialized);
          
          // Verify write was successful
          const verification = localStorage.getItem(key);
          if (verification !== serialized) {
            throw new Error('Storage write verification failed');
          }
        });

        return true;
      } catch (error) {
        console.error(`Error setting item "${key}" in storage:`, error);
        return false;
      }
    });
  }

  /**
   * Remove item from storage
   */
  async removeItem(key: string): Promise<boolean> {
    return this.queueOperation(async () => {
      try {
        if (FEATURES.USE_MOCK_API) {
          await new Promise(resolve => setTimeout(resolve, 20));
        }

        await this.withRetry(() => localStorage.removeItem(key));
        return true;
      } catch (error) {
        console.error(`Error removing item "${key}" from storage:`, error);
        return false;
      }
    });
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
        const current = await this.getItem<T | null>(key, null);
        
        if (current === null) {
          return await this.setItem(key, updates as T);
        }

        const updated = { ...current, ...updates };
        return await this.setItem(key, updated);
      } catch (error) {
        console.error(`Error updating item "${key}" in storage:`, error);
        return false;
      }
    });
  }

  /**
   * Get all keys matching a pattern
   */
  async getKeys(pattern?: string): Promise<string[]> {
    try {
      if (FEATURES.USE_MOCK_API) {
        await new Promise(resolve => setTimeout(resolve, 20));
      }

      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (!pattern || key.includes(pattern))) {
          keys.push(key);
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
      if (FEATURES.USE_MOCK_API) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      return localStorage.getItem(key) !== null;
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
        if (FEATURES.USE_MOCK_API) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        if (preserveKeys && preserveKeys.length > 0) {
          // Preserve specified keys
          const preserved: { [key: string]: any } = {};
          for (const key of preserveKeys) {
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
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          totalSize += key.length + (localStorage.getItem(key) || '').length;
        }
      }

      return {
        used: totalSize,
        quota: 5 * 1024 * 1024, // 5MB estimate
        percentage: (totalSize / (5 * 1024 * 1024)) * 100,
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
   * Export all wallet data for backup
   */
  async exportWalletData(): Promise<any> {
    const walletKeys = await this.getKeys('wallet_');
    const data: any = {};
    
    for (const key of walletKeys) {
      const value = await this.getItem(key, null);
      if (value !== null) {
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
      const items = Object.entries(data).map(([key, value]) => ({
        key,
        value
      }));
      
      return await this.batchSet(items);
    } catch (error) {
      console.error('Error importing wallet data:', error);
      return false;
    }
  }
}

// Export singleton instance
export const storageService = new StorageService();