// src/services/index.ts

/**
 * Central services export
 * Import services from here throughout the application
 */

// Storage service - always available
export { storageService } from './storage.service';

// Initialize services with error handling for SSR
let walletService: any = null;
let WalletIntegration: any = null;
let appInitializer: any = null;
let authService: any = null;
let listingsService: any = null;
let usersService: any = null;
let messagesService: any = null;

// Only import services on client side
if (typeof window !== 'undefined') {
  try {
    const walletModule = require('./wallet.service');
    walletService = walletModule.walletService;
  } catch (error) {
    console.warn('Could not load wallet service:', error);
  }

  try {
    const integrationModule = require('./wallet.integration');
    WalletIntegration = integrationModule.WalletIntegration;
  } catch (error) {
    console.warn('Could not load wallet integration:', error);
  }

  try {
    const initModule = require('./app-initializer');
    appInitializer = initModule.appInitializer;
  } catch (error) {
    console.warn('Could not load app initializer:', error);
  }

  // Auth service
  try {
    const authModule = require('./auth.service');
    authService = authModule.authService;
  } catch (error) {
    console.warn('Could not load auth service:', error);
  }

  // Listings service
  try {
    const listingsModule = require('./listings.service');
    listingsService = listingsModule.listingsService;
  } catch (error) {
    console.warn('Could not load listings service:', error);
  }

  // Users service
  try {
    const usersModule = require('./users.service');
    usersService = usersModule.usersService;
  } catch (error) {
    // Try enhanced version
    try {
      const enhancedUsersModule = require('./users.service.enhanced');
      usersService = enhancedUsersModule.usersService;
    } catch (error2) {
      console.warn('Could not load users service:', error2);
    }
  }

  // Messages service
  try {
    const messagesModule = require('./messages.service');
    messagesService = messagesModule.messagesService;
  } catch (error) {
    console.warn('Could not load messages service:', error);
  }
}

// Safe exports
export { walletService };
export { WalletIntegration };
export { appInitializer };
export { authService };
export { listingsService };
export { usersService };
export { messagesService };