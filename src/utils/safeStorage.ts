// src/utils/safeStorage.ts
/**
 * Safe storage utility that handles all localStorage operations
 * with proper error handling, type safety, and SSR support
 */

import { useState, useCallback } from 'react';

interface StorageOptions {
  compress?: boolean;
  encrypt?: boolean;
  ttl?: number; // Time to live in milliseconds
}

class SafeStorage {
  private prefix = 'panty_'; // Prefix for all keys to avoid conflicts
  
  /**
   * Check if we're in a browser environment
   */
  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  }

  /**
   * Get an item from localStorage with error handling
   * @param key - The key to retrieve
   * @param defaultValue - Default value if key doesn't exist or error occurs
   * @returns The stored value or default value
   */
  getItem<T = any>(key: string, defaultValue: T | null = null): T | null {
    if (!this.isBrowser()) {
      return defaultValue;
    }

    try {
      const prefixedKey = this.prefix + key;
      const item = localStorage.getItem(prefixedKey);
      
      if (item === null) {
        return defaultValue;
      }

      // Check if it's a TTL item
      if (item.startsWith('{"_ttl":')) {
        const parsed = JSON.parse(item);
        if (Date.now() > parsed._ttl) {
          // Item has expired
          this.removeItem(key);
          return defaultValue;
        }
        return parsed.value as T;
      }

      // Try to parse as JSON
      try {
        return JSON.parse(item) as T;
      } catch {
        // If parsing fails, return as string
        return item as unknown as T;
      }
    } catch (error) {
      console.error(`[SafeStorage] Error reading key "${key}":`, error);
      return defaultValue;
    }
  }

  /**
   * Set an item in localStorage with error handling
   * @param key - The key to store
   * @param value - The value to store
   * @param options - Storage options
   * @returns True if successful, false otherwise
   */
  setItem<T = any>(key: string, value: T, options?: StorageOptions): boolean {
    if (!this.isBrowser()) {
      return false;
    }

    try {
      const prefixedKey = this.prefix + key;
      let dataToStore: any = value;

      // Handle TTL option
      if (options?.ttl) {
        dataToStore = {
          _ttl: Date.now() + options.ttl,
          value: value
        };
      }

      // Convert to string
      const serialized = typeof dataToStore === 'string' 
        ? dataToStore 
        : JSON.stringify(dataToStore);

      // Try to store
      localStorage.setItem(prefixedKey, serialized);
      return true;
    } catch (error) {
      // Handle quota exceeded error
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.warn('[SafeStorage] Storage quota exceeded, attempting cleanup...');
        
        // Try to free up space by removing expired items
        this.cleanup();
        
        // Try one more time
        try {
          const prefixedKey = this.prefix + key;
          const serialized = typeof value === 'string' ? value : JSON.stringify(value);
          localStorage.setItem(prefixedKey, serialized);
          return true;
        } catch (retryError) {
          console.error('[SafeStorage] Failed to store after cleanup:', retryError);
          return false;
        }
      }
      
      console.error(`[SafeStorage] Error setting key "${key}":`, error);
      return false;
    }
  }

  /**
   * Remove an item from localStorage
   * @param key - The key to remove
   * @returns True if successful, false otherwise
   */
  removeItem(key: string): boolean {
    if (!this.isBrowser()) {
      return false;
    }

    try {
      const prefixedKey = this.prefix + key;
      localStorage.removeItem(prefixedKey);
      return true;
    } catch (error) {
      console.error(`[SafeStorage] Error removing key "${key}":`, error);
      return false;
    }
  }

  /**
   * Clear all items with our prefix from localStorage
   * @param preserveKeys - Array of keys to preserve (without prefix)
   * @returns True if successful, false otherwise
   */
  clear(preserveKeys: string[] = []): boolean {
    if (!this.isBrowser()) {
      return false;
    }

    try {
      const preserved: Record<string, string> = {};
      
      // Save items to preserve
      preserveKeys.forEach(key => {
        const value = this.getItem(key);
        if (value !== null) {
          preserved[key] = value;
        }
      });

      // Remove all items with our prefix
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.prefix)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));

      // Restore preserved items
      Object.entries(preserved).forEach(([key, value]) => {
        this.setItem(key, value);
      });

      return true;
    } catch (error) {
      console.error('[SafeStorage] Error clearing storage:', error);
      return false;
    }
  }

  /**
   * Check if a key exists in localStorage
   * @param key - The key to check
   * @returns True if the key exists
   */
  hasItem(key: string): boolean {
    if (!this.isBrowser()) {
      return false;
    }

    try {
      const prefixedKey = this.prefix + key;
      return localStorage.getItem(prefixedKey) !== null;
    } catch (error) {
      console.error(`[SafeStorage] Error checking key "${key}":`, error);
      return false;
    }
  }

  /**
   * Get all keys that belong to our app
   * @returns Array of keys (without prefix)
   */
  getAllKeys(): string[] {
    if (!this.isBrowser()) {
      return [];
    }

    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.prefix)) {
          keys.push(key.substring(this.prefix.length));
        }
      }
      return keys;
    } catch (error) {
      console.error('[SafeStorage] Error getting all keys:', error);
      return [];
    }
  }

  /**
   * Get storage size used by our app
   * @returns Size in bytes
   */
  getSize(): number {
    if (!this.isBrowser()) {
      return 0;
    }

    try {
      let totalSize = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.prefix)) {
          const value = localStorage.getItem(key);
          if (value) {
            totalSize += key.length + value.length;
          }
        }
      }
      return totalSize;
    } catch (error) {
      console.error('[SafeStorage] Error calculating size:', error);
      return 0;
    }
  }

  /**
   * Clean up expired items and old data
   */
  cleanup(): void {
    if (!this.isBrowser()) {
      return;
    }

    try {
      const keysToRemove: string[] = [];
      
      // Check all our keys for expired items
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.prefix)) {
          const value = localStorage.getItem(key);
          if (value && value.startsWith('{"_ttl":')) {
            try {
              const parsed = JSON.parse(value);
              if (Date.now() > parsed._ttl) {
                keysToRemove.push(key);
              }
            } catch {
              // Invalid JSON, remove it
              keysToRemove.push(key);
            }
          }
        }
      }
      
      // Remove expired items
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      console.log(`[SafeStorage] Cleaned up ${keysToRemove.length} expired items`);
    } catch (error) {
      console.error('[SafeStorage] Error during cleanup:', error);
    }
  }

  /**
   * Migrate from old localStorage keys to new prefixed keys
   * @param oldKeys - Array of old keys to migrate
   */
  migrate(oldKeys: string[]): void {
    if (!this.isBrowser()) {
      return;
    }

    let migrated = 0;
    oldKeys.forEach(oldKey => {
      try {
        const value = localStorage.getItem(oldKey);
        if (value !== null) {
          // Store with new key
          this.setItem(oldKey, value);
          // Remove old key
          localStorage.removeItem(oldKey);
          migrated++;
        }
      } catch (error) {
        console.error(`[SafeStorage] Error migrating key "${oldKey}":`, error);
      }
    });

    if (migrated > 0) {
      console.log(`[SafeStorage] Migrated ${migrated} keys to new storage`);
    }
  }
}

// Create and export a singleton instance
export const safeStorage = new SafeStorage();

// Export type-safe storage hooks for React
export const useLocalStorage = <T>(key: string, defaultValue: T) => {
  const [value, setValue] = useState<T>(() => {
    return safeStorage.getItem<T>(key, defaultValue) ?? defaultValue;
  });

  const setStoredValue = useCallback((newValue: T | ((val: T) => T)) => {
    try {
      setValue((prevValue: T) => {
        const valueToStore = newValue instanceof Function ? newValue(prevValue) : newValue;
        safeStorage.setItem(key, valueToStore);
        return valueToStore;
      });
    } catch (error) {
      console.error(`[useLocalStorage] Error setting value for key "${key}":`, error);
    }
  }, [key]);

  return [value, setStoredValue] as const;
};

// Helper function to migrate all old keys at once
export const migrateOldStorage = () => {
  const oldKeys = [
    'user',
    'all_users_v2',
    'listings',
    'subscriptions',
    'seller_notifications_store',
    'wallet_buyers',
    'wallet_admin',
    'wallet_sellers',
    'wallet_orders',
    'wallet_sellerWithdrawals',
    'wallet_adminWithdrawals',
    'wallet_adminActions',
    'wallet_depositLogs',
    'panty_messages',
    'panty_blocked',
    'panty_reported',
    'panty_report_logs',
    'panty_message_notifications',
    'user_profiles',
    'listing_views',
    'reviews',
    'bans',
    'requests',
    'age_verified',
    'recent_emojis'
  ];

  safeStorage.migrate(oldKeys);
};