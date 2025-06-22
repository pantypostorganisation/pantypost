// src/utils/storage.ts
/**
 * Enhanced storage utilities with error handling, quotas and compression
 * MIGRATED TO USE DSAL via storageService
 */

import { storageService } from '@/services';

// Maximum localStorage size targets (in bytes)
const MAX_STORAGE_BYTES = 4.5 * 1024 * 1024; // ~4.5MB
const STORAGE_WARNING_THRESHOLD = 0.8; // 80% of max

/**
 * Get localStorage usage information
 * NOTE: This remains synchronous for backward compatibility
 * Use getStorageInfo() for async version with more details
 * @returns Object with used bytes and percentage
 */
export const getStorageUsage = (): { bytes: number; percent: number } => {
  try {
    let totalBytes = 0;

    // Calculate total size of all items
    // This is one of the few places we still access localStorage directly
    // because it needs to be synchronous for backward compatibility
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key) || '';
        totalBytes += key.length + value.length;
      }
    }

    return {
      bytes: totalBytes,
      percent: totalBytes / MAX_STORAGE_BYTES
    };
  } catch (error) {
    console.error('Error calculating storage usage:', error);
    return { bytes: 0, percent: 0 };
  }
};

/**
 * Get async storage usage information via DSAL
 * @returns Promise with storage info
 */
export const getStorageInfo = async (): Promise<{ 
  used: number; 
  quota: number; 
  percentage: number;
  bytes: number;
  percent: number;
}> => {
  try {
    const info = await storageService.getStorageInfo();
    return {
      ...info,
      bytes: info.used,
      percent: info.percentage / 100
    };
  } catch (error) {
    console.error('Error getting storage info:', error);
    // Fallback to synchronous calculation
    const fallback = getStorageUsage();
    return {
      used: fallback.bytes,
      quota: MAX_STORAGE_BYTES,
      percentage: fallback.percent * 100,
      bytes: fallback.bytes,
      percent: fallback.percent
    };
  }
};

/**
 * Check if localStorage is near capacity
 * @returns True if storage is over the warning threshold
 */
export const isStorageNearCapacity = (): boolean => {
  const { percent } = getStorageUsage();
  return percent > STORAGE_WARNING_THRESHOLD;
};

/**
 * Basic LRU (Least Recently Used) cache implementation for storage
 */
class StorageLRU {
  private cache: Map<string, { timestamp: number; size: number }>;

  constructor() {
    this.cache = new Map();
    this.loadMetadata();
  }

  /**
   * Load cache metadata from localStorage
   */
  private async loadMetadata(): Promise<void> {
    try {
      const metadata = await storageService.getItem<Array<[string, { timestamp: number; size: number }]>>(
        '_storage_lru_metadata',
        []
      );
      this.cache = new Map(metadata);
    } catch (error) {
      console.error('Error loading LRU metadata:', error);
      this.cache = new Map();
    }
  }

  /**
   * Save cache metadata to localStorage
   */
  private async saveMetadata(): Promise<void> {
    try {
      await storageService.setItem(
        '_storage_lru_metadata',
        Array.from(this.cache.entries())
      );
    } catch (error) {
      console.error('Error saving LRU metadata:', error);
    }
  }

  /**
   * Record access to a key
   * @param key - The key that was accessed
   * @param size - The size of the item in bytes
   */
  public async recordAccess(key: string, size?: number): Promise<void> {
    const existingSize = this.cache.get(key)?.size || 0;
    this.cache.set(key, {
      timestamp: Date.now(),
      size: size || existingSize
    });
    await this.saveMetadata();
  }

  /**
   * Get least recently used keys to free up space
   * @param bytesNeeded - Amount of space to free up
   * @returns Array of keys to remove
   */
  public getKeysToEvict(bytesNeeded: number): string[] {
    // Sort by access time (oldest first)
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);

    const keysToEvict: string[] = [];
    let bytesFreed = 0;

    // Find keys to evict until we have enough space
    for (const [key, { size }] of entries) {
      // Skip important keys that shouldn't be evicted
      if (this.isProtectedKey(key)) continue;

      keysToEvict.push(key);
      bytesFreed += size;

      if (bytesFreed >= bytesNeeded) break;
    }

    return keysToEvict;
  }

  /**
   * Check if a key should be protected from eviction
   * @param key - The key to check
   * @returns True if the key should not be evicted
   */
  private isProtectedKey(key: string): boolean {
    // Define keys that should never be evicted
    const protectedKeys = [
      'user',
      'all_users_v2',
      '_storage_lru_metadata',
      'ageVerified',
      'wallet_admin',
      'currentUser'
    ];

    // Protect by exact match
    if (protectedKeys.includes(key)) return true;

    // Protect by prefix
    const protectedPrefixes = ['auth_', 'critical_', 'wallet_'];
    if (protectedPrefixes.some(prefix => key.startsWith(prefix))) {
      return true;
    }

    return false;
  }

  /**
   * Initialize the LRU cache asynchronously
   */
  public async initialize(): Promise<void> {
    await this.loadMetadata();
  }
}

// Create a singleton instance
const lruCache = new StorageLRU();

// Initialize LRU cache when module loads
let lruInitialized = false;
const initializeLRU = async () => {
  if (!lruInitialized) {
    await lruCache.initialize();
    lruInitialized = true;
  }
};

/**
 * Enhanced localStorage get with error handling and LRU tracking
 * @param key - Key to retrieve
 * @param defaultValue - Default value if key doesn't exist
 * @returns The stored value or default value
 */
export async function getItem<T>(key: string, defaultValue: T): Promise<T> {
  try {
    await initializeLRU();
    
    const value = await storageService.getItem<T>(key, defaultValue);
    
    // Record access for LRU (estimate size based on JSON string)
    const size = JSON.stringify(value).length;
    await lruCache.recordAccess(key, size);
    
    return value;
  } catch (error) {
    console.error(`Error getting item "${key}" from storage:`, error);
    return defaultValue;
  }
}

/**
 * Enhanced localStorage set with error handling, LRU tracking and space management
 * @param key - Key to store
 * @param value - Value to store
 * @returns True if successful, false otherwise
 */
export async function setItem<T>(key: string, value: T): Promise<boolean> {
  try {
    await initializeLRU();
    
    const serialized = JSON.stringify(value);
    const success = await storageService.setItem(key, value);
    
    if (success) {
      // Record in LRU cache
      await lruCache.recordAccess(key, serialized.length);
      return true;
    }
    
    // If storage failed, it might be due to quota
    if (isStorageNearCapacity()) {
      console.warn('Storage near capacity, attempting to free space...');
      
      // Calculate how much space we need
      const bytesNeeded = serialized.length + key.length + 50; // Add some buffer
      
      // Get keys to evict
      const keysToEvict = lruCache.getKeysToEvict(bytesNeeded);
      
      // Remove them
      for (const k of keysToEvict) {
        await storageService.removeItem(k);
      }
      console.log(`Evicted ${keysToEvict.length} items from storage`);
      
      // Try again
      const retrySuccess = await storageService.setItem(key, value);
      if (retrySuccess) {
        await lruCache.recordAccess(key, serialized.length);
      }
      return retrySuccess;
    }
    
    return false;
  } catch (error) {
    console.error(`Error setting item "${key}" in storage:`, error);
    return false;
  }
}

/**
 * Enhanced localStorage remove with error handling
 * @param key - Key to remove
 * @returns True if successful, false otherwise
 */
export async function removeItem(key: string): Promise<boolean> {
  try {
    return await storageService.removeItem(key);
  } catch (error) {
    console.error(`Error removing item "${key}" from storage:`, error);
    return false;
  }
}

/**
 * Update only specific fields of an object in localStorage
 * @param key - The key of the object to update
 * @param updates - Object with fields to update
 * @returns True if successful, false otherwise
 */
export async function updateItem<T extends object>(
  key: string,
  updates: Partial<T>
): Promise<boolean> {
  try {
    return await storageService.updateItem(key, updates);
  } catch (error) {
    console.error(`Error updating item "${key}" in storage:`, error);
    return false;
  }
}

/**
 * Get all keys in localStorage
 * @returns Array of keys
 */
export async function getAllKeys(): Promise<string[]> {
  try {
    return await storageService.getKeys();
  } catch (error) {
    console.error('Error getting all keys from storage:', error);
    return [];
  }
}

/**
 * Check if a key exists in localStorage
 * @param key - The key to check
 * @returns True if the key exists
 */
export async function hasKey(key: string): Promise<boolean> {
  try {
    return await storageService.hasKey(key);
  } catch (error) {
    console.error(`Error checking if key "${key}" exists in storage:`, error);
    return false;
  }
}

/**
 * Clear all items from localStorage
 * @param preserveKeys - Array of keys to preserve
 * @returns True if successful, false otherwise
 */
export async function clearAll(preserveKeys: string[] = []): Promise<boolean> {
  try {
    return await storageService.clear(preserveKeys);
  } catch (error) {
    console.error('Error clearing storage:', error);
    return false;
  }
}

/**
 * Set item with expiration time
 * @param key - Key to store
 * @param value - Value to store
 * @param ttlMs - Time to live in milliseconds
 * @returns True if successful, false otherwise
 */
export async function setItemWithExpiry<T>(
  key: string,
  value: T,
  ttlMs: number
): Promise<boolean> {
  const item = {
    value,
    expiry: Date.now() + ttlMs
  };

  return await setItem(`expiry_${key}`, item);
}

/**
 * Get item with expiration check
 * @param key - Key to retrieve
 * @param defaultValue - Default value if key doesn't exist or is expired
 * @returns The stored value or default value
 */
export async function getItemWithExpiry<T>(
  key: string,
  defaultValue: T
): Promise<T> {
  const item = await getItem<{ value: T; expiry: number } | null>(
    `expiry_${key}`,
    null
  );

  // Return default value if not found or expired
  if (item === null || Date.now() > item.expiry) {
    // Clean up expired item
    if (item !== null) {
      await removeItem(`expiry_${key}`);
    }
    return defaultValue;
  }

  return item.value;
}

/**
 * Get estimated size of localStorage in use
 * @returns Size in KB
 */
export async function getStorageSizeKB(): Promise<number> {
  const info = await storageService.getStorageInfo();
  return Math.round(info.used / 1024);
}
