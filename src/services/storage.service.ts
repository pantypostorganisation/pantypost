// src/services/storage.service.ts

/**
 * Enhanced Storage Service
 * Provides reliable localStorage access with error handling
 */

export class StorageService {
  private static instance: StorageService;
  private isClient: boolean;

  constructor() {
    this.isClient = typeof window !== 'undefined';
  }

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  /**
   * Get item from localStorage with default value
   */
  async getItem<T>(key: string, defaultValue: T): Promise<T> {
    if (!this.isClient) {
      return defaultValue;
    }

    try {
      const item = localStorage.getItem(key);
      if (item === null) {
        return defaultValue;
      }

      // Try to parse as JSON, fall back to string
      try {
        return JSON.parse(item);
      } catch {
        // If it's not JSON, return as string if T is string, otherwise default
        return typeof defaultValue === 'string' ? (item as unknown as T) : defaultValue;
      }
    } catch (error) {
      console.error(`Storage get error for key "${key}":`, error);
      return defaultValue;
    }
  }

  /**
   * Set item in localStorage
   */
  async setItem<T>(key: string, value: T): Promise<boolean> {
    if (!this.isClient) {
      return false;
    }

    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      localStorage.setItem(key, stringValue);
      return true;
    } catch (error) {
      console.error(`Storage set error for key "${key}":`, error);
      return false;
    }
  }

  /**
   * Remove item from localStorage
   */
  async removeItem(key: string): Promise<boolean> {
    if (!this.isClient) {
      return false;
    }

    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Storage remove error for key "${key}":`, error);
      return false;
    }
  }

  /**
   * Update item in localStorage (merge with existing object)
   */
  async updateItem<T>(key: string, updates: Partial<T>): Promise<boolean> {
    if (!this.isClient) {
      return false;
    }

    try {
      const existing = await this.getItem<T>(key, {} as T);
      const updated = { ...existing, ...updates };
      return await this.setItem(key, updated);
    } catch (error) {
      console.error(`Storage update error for key "${key}":`, error);
      return false;
    }
  }

  /**
   * Check if key exists in localStorage
   */
  async hasKey(key: string): Promise<boolean> {
    if (!this.isClient) {
      return false;
    }

    try {
      return localStorage.getItem(key) !== null;
    } catch (error) {
      console.error(`Storage hasKey error for key "${key}":`, error);
      return false;
    }
  }

  /**
   * Get all keys from localStorage
   */
  async getKeys(): Promise<string[]> {
    if (!this.isClient) {
      return [];
    }

    try {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          keys.push(key);
        }
      }
      return keys;
    } catch (error) {
      console.error('Storage getKeys error:', error);
      return [];
    }
  }

  /**
   * Clear localStorage with optional preserve keys
   */
  async clear(preserveKeys: string[] = []): Promise<boolean> {
    if (!this.isClient) {
      return false;
    }

    try {
      if (preserveKeys.length === 0) {
        localStorage.clear();
      } else {
        // Clear all except preserved keys
        const allKeys = await this.getKeys();
        for (const key of allKeys) {
          if (!preserveKeys.includes(key)) {
            localStorage.removeItem(key);
          }
        }
      }
      return true;
    } catch (error) {
      console.error('Storage clear error:', error);
      return false;
    }
  }

  /**
   * Get all keys with a prefix
   */
  async getKeysWithPrefix(prefix: string): Promise<string[]> {
    if (!this.isClient) {
      return [];
    }

    try {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          keys.push(key);
        }
      }
      return keys;
    } catch (error) {
      console.error('Storage getKeysWithPrefix error:', error);
      return [];
    }
  }

  /**
   * Get storage size estimate (in bytes)
   */
  getStorageSize(): number {
    if (!this.isClient) {
      return 0;
    }

    try {
      let total = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          if (value) {
            total += key.length + value.length;
          }
        }
      }
      return total;
    } catch (error) {
      console.error('Storage size calculation error:', error);
      return 0;
    }
  }

  /**
   * Get storage info
   */
  getStorageInfo(): {
    totalItems: number;
    estimatedSize: number;
    isAvailable: boolean;
    used?: number;
    quota?: number;
    percentage?: number;
  } {
    if (!this.isClient) {
      return {
        totalItems: 0,
        estimatedSize: 0,
        isAvailable: false,
      };
    }

    try {
      const estimatedSize = this.getStorageSize();
      const totalItems = localStorage.length;
      
      // Estimate quota (typical browser limit is 5-10MB)
      const estimatedQuota = 5 * 1024 * 1024; // 5MB
      const percentage = (estimatedSize / estimatedQuota) * 100;

      return {
        totalItems,
        estimatedSize,
        isAvailable: true,
        used: estimatedSize,
        quota: estimatedQuota,
        percentage,
      };
    } catch (error) {
      console.error('Storage info error:', error);
      return {
        totalItems: 0,
        estimatedSize: 0,
        isAvailable: false,
      };
    }
  }

  /**
   * Validate localStorage is working
   */
  async validateStorage(): Promise<boolean> {
    if (!this.isClient) {
      return false;
    }

    try {
      const testKey = '__storage_test_' + Date.now();
      const testValue = { test: true, timestamp: Date.now() };
      
      const setSuccess = await this.setItem(testKey, testValue);
      if (!setSuccess) return false;
      
      const retrieved = await this.getItem(testKey, null);
      const removeSuccess = await this.removeItem(testKey);
      
      return retrieved !== null && 
             typeof retrieved === 'object' && 
             (retrieved as any).test === true &&
             removeSuccess;
    } catch (error) {
      console.error('Storage validation error:', error);
      return false;
    }
  }

  /**
   * Backup all data to JSON string
   */
  async createBackup(): Promise<string> {
    if (!this.isClient) {
      return '{}';
    }

    try {
      const backup: { [key: string]: any } = {};
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          backup[key] = localStorage.getItem(key);
        }
      }
      
      return JSON.stringify({
        timestamp: new Date().toISOString(),
        data: backup,
      }, null, 2);
    } catch (error) {
      console.error('Storage backup error:', error);
      return '{}';
    }
  }

  /**
   * Restore from backup JSON string
   */
  async restoreFromBackup(backupString: string): Promise<boolean> {
    if (!this.isClient) {
      return false;
    }

    try {
      const backup = JSON.parse(backupString);
      
      if (!backup.data || typeof backup.data !== 'object') {
        throw new Error('Invalid backup format');
      }

      // Clear existing data first
      const clearSuccess = await this.clear();
      if (!clearSuccess) return false;

      // Restore data
      let successCount = 0;
      for (const [key, value] of Object.entries(backup.data)) {
        if (typeof value === 'string') {
          localStorage.setItem(key, value);
          successCount++;
        }
      }

      return successCount > 0;
    } catch (error) {
      console.error('Storage restore error:', error);
      return false;
    }
  }

  /**
   * Get items in bulk
   */
  async getBulk<T>(keys: string[], defaultValue: T): Promise<{ [key: string]: T }> {
    const result: { [key: string]: T } = {};
    
    for (const key of keys) {
      result[key] = await this.getItem(key, defaultValue);
    }
    
    return result;
  }

  /**
   * Set items in bulk
   */
  async setBulk<T>(items: { [key: string]: T }): Promise<boolean> {
    try {
      for (const [key, value] of Object.entries(items)) {
        const success = await this.setItem(key, value);
        if (!success) return false;
      }
      return true;
    } catch (error) {
      console.error('Storage setBulk error:', error);
      return false;
    }
  }
}

// Export singleton instance
export const storageService = StorageService.getInstance();