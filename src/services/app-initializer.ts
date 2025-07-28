// src/services/app-initializer.ts

import { authService, walletService, storageService } from '@/services';
import { runOrdersMigration } from '@/utils/ordersMigration';
import { getMockConfig } from './mock/mock.config';
import { mockInterceptor } from './mock/mock-interceptor';
import { validateConfiguration, getAllConfig, isDevelopment } from '@/config/environment';
import { sanitizeStrict, sanitizeObject } from '@/utils/security/sanitization';
import { securityService } from './security.service';
import { getRateLimiter, RATE_LIMITS } from '@/utils/security/rate-limiter';

export interface InitializationResult {
  success: boolean;
  errors: string[];
  warnings: string[];
}

export class AppInitializer {
  private static instance: AppInitializer;
  private initialized = false;
  private initializationPromise: Promise<InitializationResult> | null = null;
  private readonly MAX_INIT_ATTEMPTS = 3;
  private initAttempts = 0;
  private rateLimiter = getRateLimiter();

  private constructor() {}

  static getInstance(): AppInitializer {
    if (!AppInitializer.instance) {
      AppInitializer.instance = new AppInitializer();
    }
    return AppInitializer.instance;
  }

  /**
   * Initialize the application with security checks
   */
  async initialize(): Promise<InitializationResult> {
    // Check rate limit for initialization
    const rateLimitCheck = this.rateLimiter.check('APP_INIT', {
      maxAttempts: 5,
      windowMs: 5 * 60 * 1000 // 5 minutes
    });

    if (!rateLimitCheck.allowed) {
      return {
        success: false,
        errors: [`Initialization rate limit exceeded. Please wait ${rateLimitCheck.waitTime} seconds.`],
        warnings: []
      };
    }

    // If already initializing, return the existing promise
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // If already initialized, return success
    if (this.initialized) {
      return { success: true, errors: [], warnings: [] };
    }

    // Check max attempts
    if (this.initAttempts >= this.MAX_INIT_ATTEMPTS) {
      return {
        success: false,
        errors: ['Maximum initialization attempts exceeded'],
        warnings: []
      };
    }

    this.initAttempts++;

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

      // 0. Security checks first
      try {
        await this.performSecurityChecks();
      } catch (error) {
        errors.push(`Security check failed: ${this.sanitizeError(error)}`);
        return { success: false, errors, warnings }; // Critical - stop initialization
      }

      // 1. Initialize CSRF protection
      try {
        console.log('[AppInitializer] Initializing CSRF protection...');
        securityService.generateCSRFToken();
      } catch (error) {
        errors.push(`CSRF initialization failed: ${this.sanitizeError(error)}`);
      }

      // 2. Validate environment configuration
      try {
        console.log('[AppInitializer] Validating environment configuration...');
        const validation = validateConfiguration();
        if (!validation.valid) {
          validation.errors.forEach(error => warnings.push(`Configuration: ${sanitizeStrict(error)}`));
        }
        
        // Log configuration in development (sanitized)
        if (isDevelopment()) {
          const config = getAllConfig();
          console.log('[AppInitializer] Environment configuration:', this.sanitizeConfig(config));
        }
      } catch (error) {
        warnings.push(`Configuration validation warning: ${this.sanitizeError(error)}`);
      }

      // 3. Initialize storage service with security
      try {
        console.log('[AppInitializer] Initializing storage service...');
        await this.initializeStorage();
      } catch (error) {
        errors.push(`Storage initialization failed: ${this.sanitizeError(error)}`);
      }

      // 4. Initialize mock API if enabled
      try {
        await this.initializeMockApi();
      } catch (error) {
        warnings.push(`Mock API initialization warning: ${this.sanitizeError(error)}`);
      }

      // 5. Initialize auth service
      try {
        console.log('[AppInitializer] Initializing auth service...');
        // Auth service initializes on first use
      } catch (error) {
        errors.push(`Auth initialization failed: ${this.sanitizeError(error)}`);
      }

      // 6. Initialize wallet service
      try {
        console.log('[AppInitializer] Initializing wallet service...');
        if (typeof walletService?.initialize === 'function') {
          await walletService.initialize();
        }
      } catch (error) {
        warnings.push(`Wallet initialization warning: ${this.sanitizeError(error)}`);
      }

      // 7. Clean up corrupted data before migration
      try {
        console.log('[AppInitializer] Cleaning up corrupted data...');
        await this.cleanupCorruptedData();
      } catch (error) {
        warnings.push(`Data cleanup warning: ${this.sanitizeError(error)}`);
      }

      // 8. Run orders migration with validation
      try {
        console.log('[AppInitializer] Running orders migration...');
        await this.runSecureMigration();
      } catch (error) {
        warnings.push(`Orders migration warning: ${this.sanitizeError(error)}`);
      }

      // 9. Perform data integrity checks
      try {
        console.log('[AppInitializer] Checking data integrity...');
        await this.checkDataIntegrity();
      } catch (error) {
        warnings.push(`Data integrity check warning: ${this.sanitizeError(error)}`);
      }

      // 10. Clean up old data securely
      try {
        console.log('[AppInitializer] Cleaning up old data...');
        await this.cleanupOldData();
      } catch (error) {
        warnings.push(`Cleanup warning: ${this.sanitizeError(error)}`);
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
      errors.push(`Fatal error: ${this.sanitizeError(error)}`);
      return {
        success: false,
        errors,
        warnings,
      };
    }
  }

  /**
   * Perform initial security checks
   */
  private async performSecurityChecks(): Promise<void> {
    // Check for secure context (HTTPS in production)
    if (typeof window !== 'undefined') {
      const isLocalhost = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1' ||
                         window.location.hostname.startsWith('192.168.') ||
                         window.location.hostname.startsWith('10.');
      
      // Only enforce HTTPS if not in development AND not on localhost
      if (window.location.protocol === 'http:' && !isDevelopment() && !isLocalhost) {
        throw new Error('Application must be served over HTTPS in production');
      }

      // Check for critical browser features
      if (!window.crypto || !window.crypto.getRandomValues) {
        throw new Error('Web Crypto API not available');
      }

      // Check for Content Security Policy
      const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
      if (!cspMeta && !isDevelopment() && !isLocalhost) {
        console.warn('[AppInitializer] Content Security Policy not found');
      }

      // Check for secure cookies support
      if (!navigator.cookieEnabled) {
        console.warn('[AppInitializer] Cookies are disabled - some features may not work');
      }
    }
  }

  /**
   * Initialize storage with security checks
   */
  private async initializeStorage(): Promise<void> {
    // Check if localStorage is available
    if (typeof window === 'undefined' || !window.localStorage) {
      throw new Error('localStorage is not available');
    }

    // Test storage access with quota check
    const testKey = '__storage_test__';
    const testValue = 'x'.repeat(1024); // 1KB test
    
    try {
      localStorage.setItem(testKey, testValue);
      const retrieved = localStorage.getItem(testKey);
      if (retrieved !== testValue) {
        throw new Error('Storage integrity check failed');
      }
      localStorage.removeItem(testKey);
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        throw new Error('Storage quota exceeded');
      }
      throw new Error('localStorage is not accessible');
    }

    // Check for storage tampering
    try {
      const integrityCheck = await storageService.getItem<string | null>('__integrity_check__', null);
      if (integrityCheck && !this.validateIntegrityCheck(integrityCheck)) {
        console.warn('[AppInitializer] Storage integrity check failed - possible tampering');
      }
    } catch (error) {
      console.warn('[AppInitializer] Could not verify storage integrity');
    }
  }

  /**
   * Validate storage integrity check
   */
  private validateIntegrityCheck(check: string): boolean {
    try {
      // Simple validation - in production, use cryptographic signatures
      return typeof check === 'string' && check.length === 64;
    } catch {
      return false;
    }
  }

  /**
   * Initialize mock API with validation
   */
  private async initializeMockApi(): Promise<void> {
    const config = getMockConfig();
    
    if (config.enabled) {
      console.log('[AppInitializer] Mock API is enabled, initializing...');
      
      // Validate mock scenario
      const validScenarios = ['default', 'error-prone', 'slow-network', 'realistic'];
      if (!validScenarios.includes(config.scenario.name)) {
        throw new Error('Invalid mock scenario');
      }
      
      console.log(`[AppInitializer] Mock scenario: ${sanitizeStrict(config.scenario.name)}`);
      
      try {
        await mockInterceptor.initialize();
        console.log('[AppInitializer] Mock API initialized successfully');
        
        // Log mock configuration for debugging (sanitized)
        if (isDevelopment()) {
          console.log('[AppInitializer] Mock API Configuration:', {
            enabled: config.enabled,
            scenario: sanitizeStrict(config.scenario.name),
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

  /**
   * Clean up corrupted wallet data
   */
  private async cleanupCorruptedData(): Promise<void> {
    const keysToCheck = [
      'wallet_buyers',
      'wallet_sellers',
      'wallet_admin',
      'wallet_orders',
    ];

    for (const key of keysToCheck) {
      try {
        const rawValue = localStorage.getItem(key);
        
        // Check for corrupted data patterns
        if (rawValue && (rawValue.includes('xxxxxxxxxx') || rawValue === 'undefined')) {
          console.warn(`[AppInitializer] Removing corrupted data for ${key}`);
          
          // Set to appropriate default based on key type
          if (key === 'wallet_admin') {
            await storageService.setItem(key, '0');
          } else if (key === 'wallet_orders') {
            await storageService.setItem(key, []);
          } else {
            await storageService.setItem(key, {});
          }
        }
      } catch (error) {
        console.error(`[AppInitializer] Error cleaning ${key}:`, error);
      }
    }

    // Fix wallet_admin format specifically
    try {
      const adminBalance = await storageService.getItem('wallet_admin', null);
      
      // If it's already a valid number string, we're good
      if (adminBalance !== null && !isNaN(parseFloat(adminBalance))) {
        return;
      }
      
      // Check enhanced format
      const enhancedBalance = await storageService.getItem('wallet_admin_enhanced', null);
      if (enhancedBalance !== null && !isNaN(parseInt(enhancedBalance))) {
        // Convert from cents to dollars and save as string
        const balanceInDollars = parseInt(enhancedBalance) / 100;
        await storageService.setItem('wallet_admin', balanceInDollars.toString());
        return;
      }
      
      // Default to 0 if no valid balance found
      console.warn('[AppInitializer] Setting admin balance to default 0');
      await storageService.setItem('wallet_admin', '0');
    } catch (error) {
      console.error('[AppInitializer] Error fixing admin balance:', error);
    }
  }

  /**
   * Run migration with data validation
   */
  private async runSecureMigration(): Promise<void> {
    // Validate migration data before running
    const orderData = await storageService.getItem<any>('wallet_orders', null);
    if (orderData) {
      // Enhanced validation using security service
      const contentCheck = securityService.checkContentSecurity(JSON.stringify(orderData));
      if (!contentCheck.safe) {
        throw new Error(`Unsafe order data detected: ${contentCheck.issues.join(', ')}`);
      }

      // Basic structure validation
      if (typeof orderData !== 'object' || Array.isArray(orderData)) {
        throw new Error('Invalid order data structure');
      }

      // Check data size to prevent DoS
      const dataSize = JSON.stringify(orderData).length;
      if (dataSize > 10 * 1024 * 1024) { // 10MB limit
        throw new Error('Order data exceeds size limit');
      }
    }
    
    await runOrdersMigration();
  }

  /**
   * Check data integrity with security validation
   */
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
      try {
        const data = await storageService.getItem(key, null);
        if (data === null) {
          console.warn(`[AppInitializer] Missing critical data: ${sanitizeStrict(key)}`);
        } else {
          // Special handling for wallet_admin which can be a string (legacy) or number
          if (key === 'wallet_admin') {
            // Accept string, number, or enhanced format
            if (typeof data !== 'string' && typeof data !== 'number') {
              console.error(`[AppInitializer] Invalid data structure for ${sanitizeStrict(key)}`);
            }
          } else if (typeof data !== 'object') {
            // Other keys should be objects
            console.error(`[AppInitializer] Invalid data structure for ${sanitizeStrict(key)}`);
          } else {
            // Check for data corruption using security service
            const sanitized = securityService.sanitizeForAPI(data as Record<string, any>);
            if (Object.keys(sanitized).length === 0 && Object.keys(data as any).length > 0) {
              console.error(`[AppInitializer] Possible data corruption in ${sanitizeStrict(key)}`);
            }
          }
        }
      } catch (error) {
        console.error(`[AppInitializer] Error checking ${sanitizeStrict(key)}:`, this.sanitizeError(error));
      }
    }
  }

  /**
   * Clean up old data with secure deletion
   */
  private async cleanupOldData(): Promise<void> {
    // Define keys that should be removed (deprecated)
    const deprecatedKeys = [
      'old_wallet_data',
      'temp_listings',
      '__test_data__',
    ];

    // Validate each key before removal
    const safeDeprecatedKeys = deprecatedKeys
      .filter(key => typeof key === 'string' && key.length < 100)
      .map(key => sanitizeStrict(key));

    // Don't clean up mock data
    const mockConfig = getMockConfig();
    if (mockConfig.enabled && mockConfig.persistState) {
      const filteredKeys = safeDeprecatedKeys.filter(key => !key.startsWith('mock_api_'));
      safeDeprecatedKeys.length = 0;
      safeDeprecatedKeys.push(...filteredKeys);
    }

    for (const key of safeDeprecatedKeys) {
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

      for (const key of allKeys.slice(0, 100)) { // Limit to prevent DoS
        const sessionData = await storageService.getItem<any>(key, null);
        if (sessionData && typeof sessionData === 'object' && 
            'timestamp' in sessionData && typeof sessionData.timestamp === 'number') {
          if (sessionData.timestamp < thirtyDaysAgo) {
            await storageService.removeItem(key);
          }
        }
      }
    } catch (error) {
      console.warn('[AppInitializer] Session cleanup error:', error);
    }

    // Clean up expired auth tokens
    try {
      interface AuthData {
        expiresAt: string | number;
        [key: string]: any;
      }
      
      const authData = await storageService.getItem<AuthData | null>('auth_data', null);
      if (authData && authData.expiresAt) {
        const expiresAt = new Date(authData.expiresAt).getTime();
        if (!isNaN(expiresAt) && expiresAt < Date.now()) {
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
   * Sanitize error messages for logging
   */
  private sanitizeError(error: unknown): string {
    if (error instanceof Error) {
      return sanitizeStrict(error.message.substring(0, 200)); // Limit length
    }
    return 'Unknown error';
  }

  /**
   * Sanitize configuration object for logging
   */
  private sanitizeConfig(config: any): any {
    return securityService.sanitizeForAPI(config);
  }

  /**
   * Reset the initialization state
   * Useful for testing or forcing re-initialization
   */
  reset(): void {
    if (this.initialized && !isDevelopment()) {
      console.warn('[AppInitializer] Reset called in production environment');
      // Rate limit resets in production
      const resetCheck = this.rateLimiter.check('APP_RESET', {
        maxAttempts: 3,
        windowMs: 60 * 60 * 1000 // 1 hour
      });
      if (!resetCheck.allowed) {
        throw new Error('Reset rate limit exceeded');
      }
    }
    this.initialized = false;
    this.initializationPromise = null;
    this.initAttempts = 0;
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
    attempts: number;
  } {
    const mockConfig = getMockConfig();
    return {
      initialized: this.initialized,
      mockApiEnabled: mockConfig.enabled,
      mockScenario: mockConfig.enabled ? sanitizeStrict(mockConfig.scenario.name) : undefined,
      attempts: this.initAttempts,
    };
  }
}

// Export singleton instance
export const appInitializer = AppInitializer.getInstance();