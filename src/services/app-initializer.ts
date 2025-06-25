// src/services/app-initializer.ts

import { walletService } from './wallet.service';
import { initializeWalletMigration } from './wallet.migration';
import { storageService } from './storage.service';

export interface InitializationStep {
  name: string;
  critical: boolean; // If true, app cannot continue without this
  initialize: () => Promise<void>;
  healthCheck?: () => Promise<boolean>;
}

export interface InitializationResult {
  success: boolean;
  errors: Array<{ step: string; error: Error }>;
  warnings: Array<{ step: string; message: string }>;
  timings: Record<string, number>;
}

/**
 * Centralized app initialization system for scalable marketplace
 */
export class AppInitializer {
  private static instance: AppInitializer;
  private initialized = false;
  private initializing = false;
  private initPromise: Promise<InitializationResult> | null = null;
  
  private steps: InitializationStep[] = [
    {
      name: 'storage',
      critical: true,
      initialize: async () => {
        // Verify storage is accessible
        await storageService.setItem('_health_check', Date.now());
        const check = await storageService.getItem('_health_check', 0);
        if (!check) throw new Error('Storage not accessible');
        await storageService.removeItem('_health_check');
      },
      healthCheck: async () => {
        try {
          await storageService.setItem('_health_check', Date.now());
          await storageService.removeItem('_health_check');
          return true;
        } catch {
          return false;
        }
      }
    },
    {
      name: 'wallet_migration',
      critical: false, // Can continue with legacy data
      initialize: async () => {
        const migrationStatus = await initializeWalletMigration();
        console.log('[AppInit] Wallet migration status:', migrationStatus);
      }
    },
    {
      name: 'wallet_service',
      critical: true,
      initialize: async () => {
        await walletService.initialize();
      },
      healthCheck: async () => {
        try {
          // Test basic wallet operation
          const balance = await walletService.getBalance('_health_check', 'buyer');
          return balance.success;
        } catch {
          return false;
        }
      }
    },
    // Add more initialization steps here as your app grows:
    // - Analytics initialization
    // - Feature flags
    // - WebSocket connections
    // - Third-party services
  ];

  static getInstance(): AppInitializer {
    if (!AppInitializer.instance) {
      AppInitializer.instance = new AppInitializer();
    }
    return AppInitializer.instance;
  }

  /**
   * Initialize the application
   */
  async initialize(): Promise<InitializationResult> {
    // Return existing promise if already initializing
    if (this.initializing && this.initPromise) {
      return this.initPromise;
    }

    // Already initialized
    if (this.initialized) {
      return {
        success: true,
        errors: [],
        warnings: [],
        timings: {}
      };
    }

    this.initializing = true;
    this.initPromise = this.performInitialization();
    
    const result = await this.initPromise;
    this.initialized = result.success || !this.hasCriticalErrors(result);
    this.initializing = false;
    
    return result;
  }

  /**
   * Perform the actual initialization
   */
  private async performInitialization(): Promise<InitializationResult> {
    const result: InitializationResult = {
      success: true,
      errors: [],
      warnings: [],
      timings: {}
    };

    const startTime = performance.now();
    console.log('[AppInit] Starting application initialization...');

    for (const step of this.steps) {
      const stepStart = performance.now();
      
      try {
        console.log(`[AppInit] Initializing ${step.name}...`);
        await step.initialize();
        
        result.timings[step.name] = performance.now() - stepStart;
        console.log(`[AppInit] ✅ ${step.name} initialized in ${result.timings[step.name].toFixed(2)}ms`);
      } catch (error) {
        const err = error as Error;
        console.error(`[AppInit] ❌ ${step.name} failed:`, err);
        
        if (step.critical) {
          result.errors.push({ step: step.name, error: err });
          result.success = false;
        } else {
          result.warnings.push({ 
            step: step.name, 
            message: `Non-critical initialization failed: ${err.message}` 
          });
        }
        
        result.timings[step.name] = performance.now() - stepStart;
      }
    }

    result.timings.total = performance.now() - startTime;
    console.log(`[AppInit] Initialization completed in ${result.timings.total.toFixed(2)}ms`);
    
    // Log results
    if (result.errors.length > 0) {
      console.error('[AppInit] Critical errors:', result.errors);
    }
    if (result.warnings.length > 0) {
      console.warn('[AppInit] Warnings:', result.warnings);
    }

    // Store initialization result for debugging
    await storageService.setItem('_app_init_result', {
      ...result,
      timestamp: new Date().toISOString()
    });

    return result;
  }

  /**
   * Check if any critical errors occurred
   */
  private hasCriticalErrors(result: InitializationResult): boolean {
    return result.errors.some(e => 
      this.steps.find(s => s.name === e.step)?.critical === true
    );
  }

  /**
   * Perform health checks
   */
  async performHealthChecks(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    
    for (const step of this.steps) {
      if (step.healthCheck) {
        try {
          results[step.name] = await step.healthCheck();
        } catch {
          results[step.name] = false;
        }
      }
    }
    
    return results;
  }

  /**
   * Get initialization status
   */
  getStatus(): {
    initialized: boolean;
    initializing: boolean;
    hasErrors: boolean;
  } {
    return {
      initialized: this.initialized,
      initializing: this.initializing,
      hasErrors: false // Will be set based on stored results
    };
  }

  /**
   * Reset initialization (for testing/debugging)
   */
  async reset(): Promise<void> {
    this.initialized = false;
    this.initializing = false;
    this.initPromise = null;
    await storageService.removeItem('_app_init_result');
  }
}

// Export singleton instance
export const appInitializer = AppInitializer.getInstance();