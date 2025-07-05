// src/services/app-initializer.ts

import { authService, walletService, storageService } from '@/services';
import { runOrdersMigration } from '@/utils/ordersMigration';
import { getMockConfig } from './mock/mock.config';
import { mockInterceptor } from './mock/mock-interceptor';

export interface InitializationResult {
  success: boolean;
  errors: string[];
  warnings: string[];
}

export class AppInitializer {
  private static instance: AppInitializer;
  private initialized = false;
  private initializationPromise: Promise<InitializationResult> | null = null;

  private constructor() {}

  static getInstance(): AppInitializer {
    if (!AppInitializer.instance) {
      AppInitializer.instance = new AppInitializer();
    }
    return AppInitializer.instance;
  }

  /**
   * Initialize the application
   * This should be called once when the app starts
   */
  async initialize(): Promise<InitializationResult> {
    // If already initializing, return the existing promise
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // If already initialized, return success
    if (this.initialized) {
      return { success: true, errors: [], warnings: [] };
    }

    // Start initialization
    this.initializationPromise = this.performInitialization();
    const result = await this.initializationPromise;
    
    if (result.success) {
      this.initialized = true;
    }

    return result;
  }

  private async performInitialization(): Promise<InitializationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      console.log('[AppInitializer] Starting application initialization...');

      // 1. Initialize storage service
      try {
        console.log('[AppInitializer] Initializing storage service...');
        await this.initializeStorage();
      } catch (error) {
        errors.push(`Storage initialization failed: ${error}`);
      }

      // 2. Initialize mock API if enabled
      try {
        await this.initializeMockApi();
      } catch (error) {
        warnings.push(`Mock API initialization warning: ${error}`);
        // Don't treat mock API failure as critical error
      }

      // 3. Initialize auth service
      try {
        console.log('[AppInitializer] Initializing auth service...');
        // Auth service doesn't need explicit initialization
        // It initializes on first use
      } catch (error) {
        errors.push(`Auth initialization failed: ${error}`);
      }

      // 4. Initialize wallet service
      try {
        console.log('[AppInitializer] Initializing wallet service...');
        if (typeof walletService?.initialize === 'function') {
          await walletService.initialize();
        }
      } catch (error) {
        warnings.push(`Wallet initialization warning: ${error}`);
      }

      // 5. Run orders migration
      try {
        console.log('[AppInitializer] Running orders migration...');
        await runOrdersMigration();
      } catch (error) {
        warnings.push(`Orders migration warning: ${error}`);
      }

      // 6. Perform data integrity checks
      try {
        console.log('[AppInitializer] Checking data integrity...');
        await this.checkDataIntegrity();
      } catch (error) {
        warnings.push(`Data integrity check warning: ${error}`);
      }

      // 7. Clean up old data
      try {
        console.log('[AppInitializer] Cleaning up old data...');
        await this.cleanupOldData();
      } catch (error) {
        warnings.push(`Cleanup warning: ${error}`);
      }

      // Log results
      if (errors.length > 0) {
        console.error('[AppInitializer] Initialization errors:', errors);
      }
      if (warnings.length > 0) {
        console.warn('[AppInitializer] Initialization warnings:', warnings);
      }

      console.log('[AppInitializer] Initialization complete');

      return {
        success: errors.length === 0,
        errors,
        warnings,
      };
    } catch (error) {
      console.error('[AppInitializer] Fatal initialization error:', error);
      errors.push(`Fatal error: ${error}`);
      return {
        success: false,
        errors,
        warnings,
      };
    }
  }

  private async initializeStorage(): Promise<void> {
    // Check if localStorage is available
    if (typeof window === 'undefined' || !window.localStorage) {
      throw new Error('localStorage is not available');
    }

    // Test storage access
    const testKey = '__storage_test__';
    try {
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
    } catch (error) {
      throw new Error('localStorage is not accessible');
    }
  }

  private async initializeMockApi(): Promise<void> {
    const config = getMockConfig();
    
    if (config.enabled) {
      console.log('[AppInitializer] Mock API is enabled, initializing...');
      console.log(`[AppInitializer] Mock scenario: ${config.scenario.name}`);
      
      try {
        await mockInterceptor.initialize();
        console.log('[AppInitializer] Mock API initialized successfully');
        
        // Log mock configuration for debugging
        if (process.env.NODE_ENV === 'development') {
          console.log('[AppInitializer] Mock API Configuration:', {
            enabled: config.enabled,
            scenario: config.scenario.name,
            errorRate: `${(config.scenario.errorRate * 100).toFixed(0)}%`,
            networkDelay: `${config.scenario.networkDelay.min}-${config.scenario.networkDelay.max}ms`,
            persistState: config.persistState,
            logRequests: config.logRequests,
          });
        }
      } catch (error) {
        console.error('[AppInitializer] Failed to initialize mock API:', error);
        throw error;
      }
    } else {
      console.log('[AppInitializer] Mock API is disabled, using real API');
    }
  }

  private async checkDataIntegrity(): Promise<void> {
    // Check for critical data
    const criticalKeys = [
      'wallet_buyers',
      'wallet_sellers',
      'wallet_admin',
      'wallet_orders',
    ];

    // Skip integrity check if using mock API
    const mockConfig = getMockConfig();
    if (mockConfig.enabled) {
      console.log('[AppInitializer] Skipping data integrity check in mock mode');
      return;
    }

    for (const key of criticalKeys) {
      const data = await storageService.getItem(key, null);
      if (data === null) {
        console.warn(`[AppInitializer] Missing critical data: ${key}`);
      }
    }
  }

  private async cleanupOldData(): Promise<void> {
    // Define keys that should be removed (deprecated)
    const deprecatedKeys = [
      // Add any deprecated storage keys here
      'old_wallet_data',
      'temp_listings',
      '__test_data__',
    ];

    // Don't clean up mock data
    const mockConfig = getMockConfig();
    if (mockConfig.enabled && mockConfig.persistState) {
      deprecatedKeys.push(...deprecatedKeys.filter(key => !key.startsWith('mock_api_')));
    }

    for (const key of deprecatedKeys) {
      try {
        await storageService.removeItem(key);
      } catch (error) {
        console.warn(`[AppInitializer] Failed to remove deprecated key ${key}:`, error);
      }
    }

    // Clean up old session data (older than 30 days)
    try {
      const allKeys = await storageService.getKeys('session_');
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

      for (const key of allKeys) {
        const sessionData = await storageService.getItem<any>(key, null);
        if (sessionData && sessionData.timestamp && sessionData.timestamp < thirtyDaysAgo) {
          await storageService.removeItem(key);
        }
      }
    } catch (error) {
      console.warn('[AppInitializer] Session cleanup error:', error);
    }

    // Clean up old auth tokens
    try {
      interface AuthData {
        expiresAt: string | number;
        [key: string]: any;
      }
      
      const authData = await storageService.getItem<AuthData | null>('auth_data', null);
      if (authData && authData.expiresAt) {
        const expiresAt = new Date(authData.expiresAt).getTime();
        if (expiresAt < Date.now()) {
          await storageService.removeItem('auth_data');
          await storageService.removeItem('auth_token');
          console.log('[AppInitializer] Cleaned up expired auth tokens');
        }
      }
    } catch (error) {
      console.warn('[AppInitializer] Auth cleanup error:', error);
    }
  }

  /**
   * Reset the initialization state
   * Useful for testing or forcing re-initialization
   */
  reset(): void {
    this.initialized = false;
    this.initializationPromise = null;
  }

  /**
   * Check if the app is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get initialization status with details
   */
  getStatus(): {
    initialized: boolean;
    mockApiEnabled: boolean;
    mockScenario?: string;
  } {
    const mockConfig = getMockConfig();
    return {
      initialized: this.initialized,
      mockApiEnabled: mockConfig.enabled,
      mockScenario: mockConfig.enabled ? mockConfig.scenario.name : undefined,
    };
  }
}

// Export singleton instance
export const appInitializer = AppInitializer.getInstance();