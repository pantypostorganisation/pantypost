// src/services/storage.service.ts

import { FEATURES, ApiResponse } from './api.config';

/**
 * Storage Service
 * Provides abstraction over localStorage with future API support
 */

export class StorageService {
  /**
   * Get item from storage
   */
  async getItem<T>(key: string, defaultValue: T): Promise<T> {
    try {
      if (FEATURES.USE_MOCK_API) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const item = localStorage.getItem(key);
      if (item === null) {
        return defaultValue;
      }

      return JSON.parse(item) as T;
    } catch (error) {
      console.error(`Error getting item "${key}" from storage:`, error);
      return defaultValue;
    }
  }

  /**
   * Set item in storage
   */
  async setItem<T>(key: string, value: T): Promise<boolean> {
    try {
      if (FEATURES.USE_MOCK_API) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
      return true;
    } catch (error) {
      console.error(`Error setting item "${key}" in storage:`, error);
      return false;
    }
  }

  /**
   * Remove item from storage
   */
  async removeItem(key: string): Promise<boolean> {
    try {
      if (FEATURES.USE_MOCK_API) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing item "${key}" from storage:`, error);
      return false;
    }
  }

  /**
   * Update specific fields of an object in storage
   */
  async updateItem<T extends object>(
    key: string,
    updates: Partial<T>
  ): Promise<boolean> {
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
  }

  /**
   * Get all keys matching a pattern
   */
  async getKeys(pattern?: string): Promise<string[]> {
    try {
      if (FEATURES.USE_MOCK_API) {
        await new Promise(resolve => setTimeout(resolve, 50));
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
        await new Promise(resolve => setTimeout(resolve, 20));
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
}

// Export singleton instance
export const storageService = new StorageService();