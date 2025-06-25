// src/services/app-initializer.ts

import { walletService } from './wallet.service';
import { storageService } from './storage.service';
import { initializeWalletMigration } from './wallet.migration';

/**
 * Application initialization service
 * Handles initialization of all core services
 */
export class AppInitializer {
  private static instance: AppInitializer;
  private initialized = false;

  static getInstance(): AppInitializer {
    if (!AppInitializer.instance) {
      AppInitializer.instance = new AppInitializer();
    }
    return AppInitializer.instance;
  }

  /**
   * Initialize all application services
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      console.log('Initializing application services...');

      // Initialize storage service first
      await this.initializeStorage();

      // Run wallet migration if needed
      await this.runWalletMigration();

      // Initialize wallet service
      await this.initializeWallet();

      // Initialize other services as needed
      await this.initializeOtherServices();

      this.initialized = true;
      console.log('Application services initialized successfully');
    } catch (error) {
      console.error('Failed to initialize application services:', error);
      throw error;
    }
  }

  /**
   * Initialize storage service
   */
  private async initializeStorage(): Promise<void> {
    // Storage service doesn't need explicit initialization in current implementation
    // but we can add any storage-related setup here
    console.log('Storage service ready');
  }

  /**
   * Run wallet migration if needed
   */
  private async runWalletMigration(): Promise<void> {
    try {
      await initializeWalletMigration();
      console.log('Wallet migration check completed');
    } catch (error) {
      console.error('Wallet migration failed:', error);
      // Don't throw - allow app to continue with possible data issues
    }
  }

  /**
   * Initialize wallet service
   */
  private async initializeWallet(): Promise<void> {
    await walletService.initialize();
    console.log('Wallet service initialized');
  }

  /**
   * Initialize other services
   */
  private async initializeOtherServices(): Promise<void> {
    // Add initialization for other services as needed
    // For example: messaging, listings, etc.
  }

  /**
   * Check if services are healthy
   */
  async checkHealth(): Promise<{
    wallet: boolean;
    storage: boolean;
    overall: boolean;
  }> {
    const walletHealthy = await this.checkWalletHealth();
    const storageHealthy = await this.checkStorageHealth();

    return {
      wallet: walletHealthy,
      storage: storageHealthy,
      overall: walletHealthy && storageHealthy,
    };
  }

  /**
   * Check wallet service health
   */
  private async checkWalletHealth(): Promise<boolean> {
    try {
      // Try to get a balance to check if wallet service is working
      const result = await walletService.getBalance('test_health_check');
      return result.success || true; // Even if user doesn't exist, service is working
    } catch (error) {
      console.error('Wallet health check failed:', error);
      return false;
    }
  }

  /**
   * Check storage service health
   */
  private async checkStorageHealth(): Promise<boolean> {
    try {
      // Try to read/write to storage
      const testKey = '__health_check_' + Date.now();
      await storageService.setItem(testKey, { test: true });
      const result = await storageService.getItem(testKey, null);
      await storageService.removeItem(testKey);
      return result !== null;
    } catch (error) {
      console.error('Storage health check failed:', error);
      return false;
    }
  }

  /**
   * Reset initialization state (for testing)
   */
  reset(): void {
    this.initialized = false;
  }
}

// Export singleton instance
export const appInitializer = AppInitializer.getInstance();