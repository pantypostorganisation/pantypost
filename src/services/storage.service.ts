// src/services/storage.service.ts

import { FEATURES, ApiResponse } from './api.config';
import { sanitizeStrict, sanitizeObject } from '@/utils/security/sanitization';
import { z } from 'zod';

/**
 * Production Storage Service with Backend Support
 * Auth tokens handled separately to prevent circular dependencies
 */

// Storage configuration
const STORAGE_CONFIG = {
  // Critical data - backend when authenticated
  BACKEND_PREFERRED: [
    'wallet_',
    'order_',
    'message_',
    'transaction_',
    'balance_',
    'payment_'
  ],
  
  // UI preferences - always local for speed
  LOCAL_ONLY: [
    'theme',
    'language',
    'dismissed_',
    'ui_pref_',
    'layout_',
    'notification_pref_',
    '__walletMockDataCleared__',
    '__lastSyncTime__',
    '__initialized__'
  ],
  
  // Session data
  SESSION_ONLY: [
    'form_draft_',
    'temp_',
    'cache_',
    'panty_custom_requests'
  ],
  
  // Auth data - special handling, never through storage API
  AUTH_KEYS: [
    'auth_token',
    'refresh_token',
    'auth_token_data',
    'currentUser',
    'session_fingerprint'
  ]
};

// Storage limits
const STORAGE_LIMITS = {
  MAX_KEY_LENGTH: 100,
  MAX_VALUE_SIZE: 1 * 1024 * 1024, // 1MB
  ALLOWED_KEY_PATTERN: /^[a-zA-Z0-9_-]+$/,
};

// Key validation schema
const storageKeySchema = z.string()
  .min(1, 'Key cannot be empty')
  .max(STORAGE_LIMITS.MAX_KEY_LENGTH, `Key cannot exceed ${STORAGE_LIMITS.MAX_KEY_LENGTH} characters`)
  .regex(STORAGE_LIMITS.ALLOWED_KEY_PATTERN, 'Key contains invalid characters');

export class StorageService {
  private memoryCache: Map<string, { value: any; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5000; // 5 seconds
  private readonly UI_CACHE_TTL = 60000; // 1 minute
  private useBackendStorage: boolean = false;
  private isAuthenticated: boolean = false;
  private migrationComplete: boolean = false;

  constructor() {
    // Check if backend storage should be enabled
    this.useBackendStorage = FEATURES.USE_BACKEND_STORAGE !== false;
    
    if (this.useBackendStorage) {
      console.log('[StorageService] Backend storage enabled');
      // Delay initialization to avoid conflicts
      if (typeof window !== 'undefined') {
        setTimeout(() => this.initialize(), 2000);
      }
    }
  }

  /**
   * Initialize storage service
   */
  private async initialize() {
    // Check if user is authenticated by looking for auth token
    this.isAuthenticated = this.checkAuthentication();
    
    if (this.isAuthenticated && this.useBackendStorage && !this.migrationComplete) {
      await this.migrateToBackend();
    }
  }

  /**
   * Check if user is authenticated
   */
  private checkAuthentication(): boolean {
    if (typeof window === 'undefined') return false;
    
    // Check for auth token in session/local storage
    const hasToken = !!(sessionStorage.getItem('auth_token') || 
                       sessionStorage.getItem('auth_tokens') ||
                       localStorage.getItem('auth_token'));
    
    return hasToken;
  }

  /**
   * Get auth token for API calls (without recursion)
   */
  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    
    try {
      // Check sessionStorage first (where AuthContext stores it)
      const authTokens = sessionStorage.getItem('auth_tokens');
      if (authTokens) {
        const parsed = JSON.parse(authTokens);
        return parsed.token || null;
      }
      
      // Check direct auth_token
      const token = sessionStorage.getItem('auth_token') || 
                   localStorage.getItem('auth_token');
      return token;
    } catch {
      return null;
    }
  }

  /**
   * Make authenticated API call
   */
  private async makeAuthenticatedCall<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = this.getAuthToken();
    
    if (!token) {
      return { success: false, error: { message: 'Not authenticated' } };
    }
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(options.headers as Record<string, string> || {})
    };
    
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
      const url = `${baseUrl}/api${endpoint}`;
      
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return { 
          success: false, 
          error: { 
            message: data.error || 'Request failed',
            code: response.status.toString()
          } 
        };
      }
      
      return { success: true, data: data.data || data };
    } catch (error) {
      console.error('API call failed:', error);
      return { 
        success: false, 
        error: { message: 'Network error' } 
      };
    }
  }

  /**
   * Determine storage strategy
   */
  private getStorageStrategy(key: string): 'backend' | 'local' | 'session' | 'skip' {
    // Never store auth keys through this service
    if (STORAGE_CONFIG.AUTH_KEYS.some(authKey => key === authKey)) {
      return 'skip';
    }
    
    // UI preferences always local
    if (STORAGE_CONFIG.LOCAL_ONLY.some(prefix => 
      key.startsWith(prefix) || key === prefix
    )) {
      return 'local';
    }
    
    // Session data
    if (STORAGE_CONFIG.SESSION_ONLY.some(prefix => 
      key.startsWith(prefix) || key === prefix
    )) {
      return 'session';
    }
    
    // Critical data - use backend if authenticated and enabled
    if (STORAGE_CONFIG.BACKEND_PREFERRED.some(prefix => 
      key.startsWith(prefix)
    )) {
      return (this.useBackendStorage && this.isAuthenticated) ? 'backend' : 'local';
    }
    
    // Default
    return 'local';
  }

  /**
   * Validate key
   */
  private validateKey(key: string): string {
    const result = storageKeySchema.safeParse(key);
    if (!result.success) {
      throw new Error(`Invalid storage key: ${result.error.errors[0]?.message}`);
    }
    return sanitizeStrict(result.data);
  }

  /**
   * Get from cache
   */
  private getFromCache<T>(key: string): T | null {
    const cached = this.memoryCache.get(key);
    if (!cached) return null;
    
    const ttl = this.getStorageStrategy(key) === 'backend' ? this.CACHE_TTL : this.UI_CACHE_TTL;
    
    if (Date.now() - cached.timestamp < ttl) {
      return cached.value as T;
    }
    
    this.memoryCache.delete(key);
    return null;
  }

  /**
   * Set in cache
   */
  private setInCache(key: string, value: any): void {
    this.memoryCache.set(key, { value, timestamp: Date.now() });
    
    if (this.memoryCache.size > 100) {
      const firstKey = this.memoryCache.keys().next().value;
      if (firstKey) this.memoryCache.delete(firstKey);
    }
  }

  /**
   * Get from backend
   */
  private async getFromBackend<T>(key: string): Promise<T | null> {
    const response = await this.makeAuthenticatedCall<{ value: T }>(
      `/storage/get/${encodeURIComponent(key)}`
    );
    
    if (response.success && response.data) {
      return response.data.value;
    }
    
    return null;
  }

  /**
   * Set in backend
   */
  private async setInBackend(key: string, value: any): Promise<boolean> {
    const response = await this.makeAuthenticatedCall<{ success: boolean }>(
      '/storage/set',
      {
        method: 'POST',
        body: JSON.stringify({ key, value })
      }
    );
    
    return response.success;
  }

  /**
   * Get from browser storage
   */
  private getFromBrowserStorage<T>(key: string, type: 'local' | 'session'): T | null {
    try {
      if (typeof window === 'undefined') return null;
      
      const storage = type === 'local' ? localStorage : sessionStorage;
      const item = storage.getItem(key);
      
      if (item === null) return null;
      
      try {
        return JSON.parse(item) as T;
      } catch {
        return item as unknown as T;
      }
    } catch (error) {
      console.warn(`Failed to get ${key} from ${type}Storage:`, error);
      return null;
    }
  }

  /**
   * Set in browser storage
   */
  private setInBrowserStorage(key: string, value: any, type: 'local' | 'session'): boolean {
    try {
      if (typeof window === 'undefined') return false;
      
      const storage = type === 'local' ? localStorage : sessionStorage;
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      storage.setItem(key, serialized);
      return true;
    } catch (error) {
      console.warn(`Failed to set ${key} in ${type}Storage:`, error);
      return false;
    }
  }

  /**
   * Main getItem method
   */
  async getItem<T>(key: string, defaultValue: T): Promise<T> {
    try {
      const validatedKey = this.validateKey(key);
      
      // Check cache
      const cached = this.getFromCache<T>(validatedKey);
      if (cached !== null) return cached;
      
      const strategy = this.getStorageStrategy(validatedKey);
      
      if (strategy === 'skip') {
        console.warn(`[StorageService] Skipping auth key: ${key}`);
        return defaultValue;
      }
      
      let value: T | null = null;
      
      switch (strategy) {
        case 'backend':
          // Try backend first
          value = await this.getFromBackend<T>(validatedKey);
          // Fallback to local if backend fails
          if (value === null) {
            value = this.getFromBrowserStorage<T>(validatedKey, 'local');
          }
          break;
          
        case 'local':
          value = this.getFromBrowserStorage<T>(validatedKey, 'local');
          break;
          
        case 'session':
          value = this.getFromBrowserStorage<T>(validatedKey, 'session');
          break;
      }
      
      if (value !== null) {
        this.setInCache(validatedKey, value);
        return value;
      }
      
      return defaultValue;
    } catch (error) {
      console.error(`Error getting item "${key}":`, error);
      return defaultValue;
    }
  }

  /**
   * Main setItem method
   */
  async setItem<T>(key: string, value: T): Promise<boolean> {
    try {
      const validatedKey = this.validateKey(key);
      
      const strategy = this.getStorageStrategy(validatedKey);
      
      if (strategy === 'skip') {
        console.warn(`[StorageService] Skipping auth key: ${key}`);
        return false;
      }
      
      let success = false;
      
      switch (strategy) {
        case 'backend':
          // Try backend first
          success = await this.setInBackend(validatedKey, value);
          // Also save locally as backup
          this.setInBrowserStorage(validatedKey, value, 'local');
          break;
          
        case 'local':
          success = this.setInBrowserStorage(validatedKey, value, 'local');
          break;
          
        case 'session':
          success = this.setInBrowserStorage(validatedKey, value, 'session');
          break;
      }
      
      if (success) {
        this.setInCache(validatedKey, value);
      }
      
      return success;
    } catch (error) {
      console.error(`Error setting item "${key}":`, error);
      return false;
    }
  }

  /**
   * Remove item
   */
  async removeItem(key: string): Promise<boolean> {
    try {
      const validatedKey = this.validateKey(key);
      
      this.memoryCache.delete(validatedKey);
      
      const strategy = this.getStorageStrategy(validatedKey);
      
      if (strategy === 'skip') return true;
      
      switch (strategy) {
        case 'backend':
          const response = await this.makeAuthenticatedCall<{ success: boolean }>(
            `/storage/delete/${encodeURIComponent(validatedKey)}`,
            { method: 'DELETE' }
          );
          // Also remove from local
          if (typeof window !== 'undefined') {
            localStorage.removeItem(validatedKey);
          }
          return response.success;
          
        case 'local':
          if (typeof window !== 'undefined') {
            localStorage.removeItem(validatedKey);
          }
          return true;
          
        case 'session':
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem(validatedKey);
          }
          return true;
          
        default:
          return false;
      }
    } catch (error) {
      console.error(`Error removing item "${key}":`, error);
      return false;
    }
  }

  /**
   * Update item
   */
  async updateItem<T extends object>(key: string, updates: Partial<T>): Promise<boolean> {
    const current = await this.getItem<T | null>(key, null);
    
    if (current === null) {
      return await this.setItem(key, updates as T);
    }
    
    const updated = { ...current, ...updates };
    return await this.setItem(key, updated);
  }

  /**
   * Get all keys
   */
  async getKeys(pattern?: string): Promise<string[]> {
    const keys: string[] = [];
    
    if (typeof window !== 'undefined') {
      // Get from localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (!pattern || key.includes(pattern))) {
          if (!STORAGE_CONFIG.AUTH_KEYS.includes(key)) {
            keys.push(key);
          }
        }
      }
      
      // Get from sessionStorage
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (!pattern || key.includes(pattern))) {
          if (!STORAGE_CONFIG.AUTH_KEYS.includes(key) && !keys.includes(key)) {
            keys.push(key);
          }
        }
      }
    }
    
    // Get from backend if authenticated
    if (this.useBackendStorage && this.isAuthenticated) {
      const response = await this.makeAuthenticatedCall<{ keys: string[] }>(
        '/storage/keys',
        {
          method: 'POST',
          body: JSON.stringify({ pattern })
        }
      );
      
      if (response.success && response.data) {
        response.data.keys.forEach(key => {
          if (!keys.includes(key) && !STORAGE_CONFIG.AUTH_KEYS.includes(key)) {
            keys.push(key);
          }
        });
      }
    }
    
    return keys;
  }

  /**
   * Check if key exists
   */
  async hasKey(key: string): Promise<boolean> {
    try {
      const validatedKey = this.validateKey(key);
      
      if (this.memoryCache.has(validatedKey)) return true;
      
      const strategy = this.getStorageStrategy(validatedKey);
      
      if (strategy === 'skip') return false;
      
      switch (strategy) {
        case 'backend':
          const response = await this.makeAuthenticatedCall<{ exists: boolean }>(
            `/storage/exists/${encodeURIComponent(validatedKey)}`
          );
          return response.success && response.data?.exists || false;
          
        case 'local':
          return typeof window !== 'undefined' && 
                 localStorage.getItem(validatedKey) !== null;
          
        case 'session':
          return typeof window !== 'undefined' && 
                 sessionStorage.getItem(validatedKey) !== null;
          
        default:
          return false;
      }
    } catch (error) {
      console.error(`Error checking key "${key}":`, error);
      return false;
    }
  }

  /**
   * Clear storage
   */
  async clear(preserveKeys?: string[]): Promise<boolean> {
    try {
      this.memoryCache.clear();
      
      const allPreserveKeys = [
        ...(preserveKeys || []),
        ...STORAGE_CONFIG.AUTH_KEYS
      ];
      
      if (typeof window !== 'undefined') {
        const preserved: Record<string, string> = {};
        
        // Preserve specified keys
        allPreserveKeys.forEach(key => {
          const localValue = localStorage.getItem(key);
          if (localValue !== null) {
            preserved[`local_${key}`] = localValue;
          }
          const sessionValue = sessionStorage.getItem(key);
          if (sessionValue !== null) {
            preserved[`session_${key}`] = sessionValue;
          }
        });
        
        // Clear storage
        localStorage.clear();
        sessionStorage.clear();
        
        // Restore preserved keys
        Object.entries(preserved).forEach(([prefixedKey, value]) => {
          if (prefixedKey.startsWith('session_')) {
            sessionStorage.setItem(prefixedKey.substring(8), value);
          } else if (prefixedKey.startsWith('local_')) {
            localStorage.setItem(prefixedKey.substring(6), value);
          }
        });
      }
      
      // Clear backend if authenticated
      if (this.useBackendStorage && this.isAuthenticated) {
        await this.makeAuthenticatedCall('/storage/clear', {
          method: 'POST',
          body: JSON.stringify({ preserveKeys: allPreserveKeys })
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error clearing storage:', error);
      return false;
    }
  }

  /**
   * Get storage info
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
      
      return { used: 0, quota: 5 * 1024 * 1024, percentage: 0 };
    } catch {
      return { used: 0, quota: 0, percentage: 0 };
    }
  }

  /**
   * Migrate data to backend
   */
  private async migrateToBackend(): Promise<void> {
    if (!this.isAuthenticated || this.migrationComplete) return;
    
    console.log('[StorageService] Starting backend migration...');
    
    const migrated: string[] = [];
    const failed: string[] = [];
    
    // Only migrate critical data
    for (const prefix of STORAGE_CONFIG.BACKEND_PREFERRED) {
      const keys = await this.getKeys(prefix);
      
      for (const key of keys) {
        try {
          const value = this.getFromBrowserStorage<any>(key, 'local');
          if (value !== null) {
            const success = await this.setInBackend(key, value);
            if (success) {
              migrated.push(key);
              // Keep local copy as backup
              console.log(`[StorageService] Migrated ${key} to backend`);
            } else {
              failed.push(key);
            }
          }
        } catch (error) {
          console.error(`Failed to migrate ${key}:`, error);
          failed.push(key);
        }
      }
    }
    
    this.migrationComplete = true;
    
    if (migrated.length > 0) {
      console.log('[StorageService] Migration complete:', migrated);
    }
    
    if (failed.length > 0) {
      console.warn('[StorageService] Migration failed for:', failed);
    }
  }

  /**
   * Re-authenticate (call when user logs in)
   */
  async onAuthenticated(): Promise<void> {
    this.isAuthenticated = true;
    if (this.useBackendStorage && !this.migrationComplete) {
      await this.migrateToBackend();
    }
  }

  /**
   * Clear authentication (call when user logs out)
   */
  onLogout(): void {
    this.isAuthenticated = false;
    this.migrationComplete = false;
    this.memoryCache.clear();
  }

  /**
   * Export wallet data
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
   * Import wallet data
   */
  async importWalletData(data: any): Promise<boolean> {
    try {
      for (const [key, value] of Object.entries(data)) {
        if (key.startsWith('wallet_')) {
          await this.setItem(key, value);
        }
      }
      return true;
    } catch (error) {
      console.error('Import failed:', error);
      return false;
    }
  }
}

// Export singleton
export const storageService = new StorageService();