/**
 * Enhanced storage utilities with error handling, quotas and compression
 */

// Maximum localStorage size targets (in bytes)
const MAX_STORAGE_BYTES = 4.5 * 1024 * 1024; // ~4.5MB
const STORAGE_WARNING_THRESHOLD = 0.8; // 80% of max

/**
 * Get localStorage usage information
 * @returns Object with used bytes and percentage
 */
export const getStorageUsage = (): { bytes: number; percent: number } => {
  try {
    let totalBytes = 0;
    
    // Calculate total size of all items
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
  private loadMetadata(): void {
    try {
      const metadata = localStorage.getItem('_storage_lru_metadata');
      if (metadata) {
        this.cache = new Map(JSON.parse(metadata));
      }
    } catch (error) {
      console.error('Error loading LRU metadata:', error);
      this.cache = new Map();
    }
  }
  
  /**
   * Save cache metadata to localStorage
   */
  private saveMetadata(): void {
    try {
      localStorage.setItem(
        '_storage_lru_metadata',
        JSON.stringify(Array.from(this.cache.entries()))
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
  public recordAccess(key: string, size?: number): void {
    const existingSize = this.cache.get(key)?.size || 0;
    this.cache.set(key, {
      timestamp: Date.now(),
      size: size || existingSize
    });
    this.saveMetadata();
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
      'wallet_admin'
    ];
    
    // Protect by exact match
    if (protectedKeys.includes(key)) return true;
    
    // Protect by prefix
    const protectedPrefixes = ['auth_', 'critical_'];
    if (protectedPrefixes.some(prefix => key.startsWith(prefix))) {
      return true;
    }
    
    return false;
  }
}

// Create a singleton instance
const lruCache = new StorageLRU();

/**
 * Enhanced localStorage get with error handling and LRU tracking
 * @param key - Key to retrieve
 * @param defaultValue - Default value if key doesn't exist
 * @returns The stored value or default value
 */
export function getItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    
    if (item === null) {
      return defaultValue;
    }
    
    // Record access for LRU
    lruCache.recordAccess(key, item.length);
    
    return JSON.parse(item) as T;
  } catch (error) {
    console.error(`Error getting item "${key}" from localStorage:`, error);
    return defaultValue;
  }
}

/**
 * Enhanced localStorage set with error handling, LRU tracking and space management
 * @param key - Key to store
 * @param value - Value to store
 * @returns True if successful, false otherwise
 */
export function setItem<T>(key: string, value: T): boolean {
  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);
    
    // Record in LRU cache
    lruCache.recordAccess(key, serialized.length);
    
    return true;
  } catch (error) {
    // Handle quota exceeded error
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.warn('localStorage quota exceeded, attempting to free space...');
      
      try {
        // Calculate how much space we need
        const serialized = JSON.stringify(value);
        const bytesNeeded = serialized.length + key.length + 50; // Add some buffer
        
        // Get keys to evict
        const keysToEvict = lruCache.getKeysToEvict(bytesNeeded);
        
        // Remove them
        keysToEvict.forEach(k => localStorage.removeItem(k));
        console.log(`Evicted ${keysToEvict.length} items from localStorage`);
        
        // Try again
        localStorage.setItem(key, serialized);
        lruCache.recordAccess(key, serialized.length);
        
        return true;
      } catch (retryError) {
        console.error('Failed to make space in localStorage:', retryError);
        return false;
      }
    }
    
    console.error(`Error setting item "${key}" in localStorage:`, error);
    return false;
  }
}

/**
 * Enhanced localStorage remove with error handling
 * @param key - Key to remove
 * @returns True if successful, false otherwise
 */
export function removeItem(key: string): boolean {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing item "${key}" from localStorage:`, error);
    return false;
  }
}

/**
 * Update only specific fields of an object in localStorage
 * @param key - The key of the object to update
 * @param updates - Object with fields to update
 * @returns True if successful, false otherwise
 */
export function updateItem<T extends object>(
  key: string,
  updates: Partial<T>
): boolean {
  try {
    const current = getItem<T | null>(key, null);
    
    // If item doesn't exist, create it with updates
    if (current === null) {
      return setItem(key, updates as T);
    }
    
    // Merge existing data with updates
    const updated = { ...current, ...updates };
    return setItem(key, updated);
  } catch (error) {
    console.error(`Error updating item "${key}" in localStorage:`, error);
    return false;
  }
}

/**
 * Get all keys in localStorage
 * @returns Array of keys
 */
export function getAllKeys(): string[] {
  const keys: string[] = [];
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        keys.push(key);
      }
    }
  } catch (error) {
    console.error('Error getting all keys from localStorage:', error);
  }
  
  return keys;
}

/**
 * Check if a key exists in localStorage
 * @param key - The key to check
 * @returns True if the key exists
 */
export function hasKey(key: string): boolean {
  try {
    return localStorage.getItem(key) !== null;
  } catch (error) {
    console.error(`Error checking if key "${key}" exists in localStorage:`, error);
    return false;
  }
}

/**
 * Clear all items from localStorage
 * @param preserveKeys - Array of keys to preserve
 * @returns True if successful, false otherwise
 */
export function clearAll(preserveKeys: string[] = []): boolean {
  try {
    if (preserveKeys.length === 0) {
      localStorage.clear();
      return true;
    }
    
    // If preserving keys, get their values first
    const preserved: Record<string, string> = {};
    
    for (const key of preserveKeys) {
      const value = localStorage.getItem(key);
      if (value !== null) {
        preserved[key] = value;
      }
    }
    
    // Clear storage
    localStorage.clear();
    
    // Restore preserved keys
    for (const [key, value] of Object.entries(preserved)) {
      localStorage.setItem(key, value);
    }
    
    return true;
  } catch (error) {
    console.error('Error clearing localStorage:', error);
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
export function setItemWithExpiry<T>(
  key: string,
  value: T,
  ttlMs: number
): boolean {
  const item = {
    value,
    expiry: Date.now() + ttlMs
  };
  
  return setItem(`expiry_${key}`, item);
}

/**
 * Get item with expiration check
 * @param key - Key to retrieve
 * @param defaultValue - Default value if key doesn't exist or is expired
 * @returns The stored value or default value
 */
export function getItemWithExpiry<T>(
  key: string,
  defaultValue: T
): T {
  const item = getItem<{ value: T; expiry: number } | null>(
    `expiry_${key}`,
    null
  );
  
  // Return default value if not found or expired
  if (item === null || Date.now() > item.expiry) {
    // Clean up expired item
    if (item !== null) {
      removeItem(`expiry_${key}`);
    }
    return defaultValue;
  }
  
  return item.value;
}

/**
 * Get estimated size of localStorage in use
 * @returns Size in KB
 */
export function getStorageSizeKB(): number {
  return Math.round(getStorageUsage().bytes / 1024);
}