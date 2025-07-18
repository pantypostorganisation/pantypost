// src/services/wallet.migration.ts

import { storageService } from './storage.service';
import { walletService as enhancedWalletService } from './wallet.service.enhanced';
import { Money, UserId, ISOTimestamp } from '@/types/common';
import { Transaction, TransactionId } from './wallet.service.enhanced';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { sanitizeStrict, sanitizeUsername, sanitizeCurrency } from '@/utils/security/sanitization';
import { securityService } from './security.service';
import { getRateLimiter, RATE_LIMITS } from '@/utils/security/rate-limiter';

/**
 * Storage keys from WalletContext for consistency
 */
const STORAGE_KEYS = {
  BUYER_BALANCES: 'wallet_buyers',
  SELLER_BALANCES: 'wallet_sellers',
  ADMIN_BALANCE: 'wallet_admin',
  ORDERS: 'wallet_orders',
  SELLER_WITHDRAWALS: 'wallet_sellerWithdrawals',
  ADMIN_WITHDRAWALS: 'wallet_adminWithdrawals',
  ADMIN_ACTIONS: 'wallet_adminActions',
  DEPOSIT_LOGS: 'wallet_depositLogs',
  INITIALIZATION_STATE: 'wallet_init_state',
} as const;

/**
 * Mock data signatures from WalletContext
 */
const MOCK_SIGNATURES = {
  aliceBalance: 1250,
  bettyBalance: 980,
  carolBalance: 650,
  dianaBalance: 1500,
  buyer1Balance: 500,
  buyer2Balance: 250,
  buyer3Balance: 1000,
  adminBalance: 10000,
} as const;

/**
 * Validation schemas for legacy data matching WalletContext patterns
 */
const legacyBalanceSchema = z.record(
  z.string().max(100).regex(/^[a-zA-Z0-9_-]+$/), // Match username validation from WalletContext
  z.number().min(0).max(1000000)
);

const legacyTransactionSchema = z.object({
  id: z.string().optional(),
  type: z.string(),
  amount: z.number().min(0).max(1000000),
  from: z.string().max(100).regex(/^[a-zA-Z0-9_-]+$/).optional(),
  to: z.string().max(100).regex(/^[a-zA-Z0-9_-]+$/).optional(),
  description: z.string().max(500).optional(),
  status: z.enum(['pending', 'completed', 'failed', 'cancelled']).optional(),
  date: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

const legacyOrderSchema = z.object({
  id: z.string(),
  title: z.string().max(200),
  description: z.string().max(2000),
  price: z.number().min(0.01).max(100000), // Match transaction amount validation
  markedUpPrice: z.number().min(0.01).max(100000),
  buyer: z.string().max(100).regex(/^[a-zA-Z0-9_-]+$/),
  seller: z.string().max(100).regex(/^[a-zA-Z0-9_-]+$/),
  date: z.string(),
  tierCreditAmount: z.number().min(0).max(1000).optional(),
  deliveryAddress: z.any().optional(),
  shippingStatus: z.enum(['pending', 'processing', 'shipped', 'pending-auction']).optional(),
  wasAuction: z.boolean().optional(),
  finalBid: z.number().optional(),
  isCustomRequest: z.boolean().optional(),
  originalRequestId: z.string().optional(),
  listingId: z.string().optional(),
  listingTitle: z.string().optional(),
  quantity: z.number().optional(),
});

const legacyWithdrawalSchema = z.object({
  amount: z.number().min(10).max(10000), // Match withdrawal validation
  date: z.string(),
  status: z.enum(['pending', 'completed', 'failed']).optional(),
  method: z.string().optional(),
});

const legacyAdminActionSchema = z.object({
  id: z.string(),
  type: z.enum(['credit', 'debit']),
  amount: z.number().positive().max(100000),
  targetUser: z.string().max(100).regex(/^[a-zA-Z0-9_-]+$/).optional(),
  username: z.string().max(100).regex(/^[a-zA-Z0-9_-]+$/).optional(),
  adminUser: z.string().max(100).regex(/^[a-zA-Z0-9_-]+$/),
  reason: z.string().min(1).max(500),
  date: z.string(),
  role: z.enum(['buyer', 'seller']),
});

const legacyDepositLogSchema = z.object({
  id: z.string(),
  username: z.string().max(100).regex(/^[a-zA-Z0-9_-]+$/),
  amount: z.number().positive().max(100000),
  method: z.enum(['credit_card', 'bank_transfer', 'crypto', 'admin_credit']),
  date: z.string(),
  status: z.enum(['pending', 'completed', 'failed']),
  transactionId: z.string().optional(),
  notes: z.string().max(500).optional(),
});

/**
 * Migration utilities for transitioning to the enhanced wallet system
 */
export class WalletMigration {
  private static migrationKey = 'wallet_migration_status';
  private static readonly MAX_MIGRATION_ATTEMPTS = 3;
  private static readonly MAX_BATCH_SIZE = 100;
  private static rateLimiter = getRateLimiter();
  
  /**
   * Check if migration is needed with rate limiting
   */
  static async isMigrationNeeded(): Promise<boolean> {
    try {
      // Rate limit migration checks to prevent abuse
      const rateLimitResult = this.rateLimiter.check('migration_check', {
        maxAttempts: 10,
        windowMs: 60000, // 10 checks per minute
      });
      
      if (!rateLimitResult.allowed) {
        console.warn('Migration check rate limit exceeded');
        return false;
      }
      
      const status = await storageService.getItem<{
        completed?: boolean;
        attempts?: number;
      }>(this.migrationKey, {});
      
      if (status?.completed) {
        return false;
      }
      
      // Check if we've exceeded max attempts
      if (status?.attempts && status.attempts >= this.MAX_MIGRATION_ATTEMPTS) {
        console.error('Migration failed too many times, manual intervention required');
        return false;
      }
      
      // Check for legacy data using the same keys as WalletContext
      const hasLegacyBuyerBalances = await storageService.hasKey(STORAGE_KEYS.BUYER_BALANCES);
      const hasLegacySellerBalances = await storageService.hasKey(STORAGE_KEYS.SELLER_BALANCES);
      const hasLegacyTransactions = await storageService.hasKey('wallet_transactions_legacy');
      
      // Also check for mock data that needs cleanup
      if (process.env.NEXT_PUBLIC_USE_MOCK_API !== 'true') {
        const mockClearedFlag = typeof localStorage !== 'undefined' && 
                               localStorage.getItem('__walletMockDataCleared__') === 'true';
        
        if (!mockClearedFlag && (hasLegacyBuyerBalances || hasLegacySellerBalances)) {
          // Check if this is mock data
          const buyers = await storageService.getItem<Record<string, number>>(STORAGE_KEYS.BUYER_BALANCES, {});
          const sellers = await storageService.getItem<Record<string, number>>(STORAGE_KEYS.SELLER_BALANCES, {});
          const adminBalance = parseFloat(await storageService.getItem<string>(STORAGE_KEYS.ADMIN_BALANCE, '0'));
          
          const isMockData = 
            sellers['alice'] === MOCK_SIGNATURES.aliceBalance ||
            sellers['betty'] === MOCK_SIGNATURES.bettyBalance ||
            buyers['buyer1'] === MOCK_SIGNATURES.buyer1Balance ||
            adminBalance === MOCK_SIGNATURES.adminBalance;
            
          if (isMockData) {
            console.log('Mock data detected, migration will handle cleanup');
            return true;
          }
        }
      }
      
      return hasLegacyBuyerBalances || hasLegacySellerBalances || hasLegacyTransactions;
    } catch (error) {
      console.error('Error checking migration status:', error);
      return false;
    }
  }
  
  /**
   * Perform full migration with validation and mock data cleanup
   */
  static async performMigration(): Promise<{
    success: boolean;
    errors: string[];
    stats: {
      balancesMigrated: number;
      transactionsMigrated: number;
      ordersProcessed: number;
      mockDataCleaned: boolean;
    };
  }> {
    const errors: string[] = [];
    const stats = {
      balancesMigrated: 0,
      transactionsMigrated: 0,
      ordersProcessed: 0,
      mockDataCleaned: false,
    };
    
    try {
      // Rate limit migration attempts
      const rateLimitResult = this.rateLimiter.check('migration_perform', {
        maxAttempts: 1,
        windowMs: 300000, // 1 migration per 5 minutes
      });
      
      if (!rateLimitResult.allowed) {
        throw new Error(`Migration rate limit exceeded. Wait ${rateLimitResult.waitTime} seconds.`);
      }
      
      // Get current status
      const currentStatus = await storageService.getItem<{
        attempts?: number;
      }>(this.migrationKey, { attempts: 0 });
      
      // Mark migration as in progress
      await storageService.setItem(this.migrationKey, {
        started: new Date().toISOString(),
        completed: false,
        attempts: (currentStatus.attempts || 0) + 1,
      });
      
      // 0. Check and clean mock data if needed
      const mockCleanResult = await this.cleanMockDataIfNeeded();
      stats.mockDataCleaned = mockCleanResult.cleaned;
      if (mockCleanResult.errors.length > 0) {
        errors.push(...mockCleanResult.errors);
      }
      
      // If mock data was cleaned, we might be done
      if (mockCleanResult.cleaned && mockCleanResult.noRealData) {
        // Mark migration as completed since there was only mock data
        await storageService.setItem(this.migrationKey, {
          started: new Date().toISOString(),
          completed: new Date().toISOString(),
          stats,
          errors,
          attempts: currentStatus.attempts || 1,
        });
        
        return {
          success: true,
          errors,
          stats,
        };
      }
      
      // 1. Migrate balances with validation
      const balanceResult = await this.migrateBalances();
      stats.balancesMigrated = balanceResult.count;
      if (balanceResult.errors.length > 0) {
        errors.push(...balanceResult.errors);
      }
      
      // 2. Migrate transaction history with validation
      const transactionResult = await this.migrateTransactions();
      stats.transactionsMigrated = transactionResult.count;
      if (transactionResult.errors.length > 0) {
        errors.push(...transactionResult.errors);
      }
      
      // 3. Migrate order history with validation
      const orderResult = await this.migrateOrders();
      stats.ordersProcessed = orderResult.count;
      if (orderResult.errors.length > 0) {
        errors.push(...orderResult.errors);
      }
      
      // 4. Migrate other wallet data
      const otherDataResult = await this.migrateOtherData();
      if (otherDataResult.errors.length > 0) {
        errors.push(...otherDataResult.errors);
      }
      
      // 5. Verify migration integrity
      const verificationResult = await this.verifyMigration();
      if (!verificationResult.success) {
        errors.push(...verificationResult.errors);
      }
      
      // Mark migration as completed
      await storageService.setItem(this.migrationKey, {
        started: new Date().toISOString(),
        completed: new Date().toISOString(),
        stats,
        errors,
        attempts: currentStatus.attempts || 1,
      });
      
      return {
        success: errors.length === 0,
        errors,
        stats,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Migration failed: ${sanitizeStrict(errorMessage)}`);
      return {
        success: false,
        errors,
        stats,
      };
    }
  }
  
  /**
   * Clean mock data if detected and mock API is disabled
   */
  private static async cleanMockDataIfNeeded(): Promise<{
    cleaned: boolean;
    noRealData: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];
    
    try {
      if (process.env.NEXT_PUBLIC_USE_MOCK_API === 'true') {
        return { cleaned: false, noRealData: false, errors };
      }
      
      // Check if already cleaned
      const alreadyCleared = typeof localStorage !== 'undefined' && 
                           localStorage.getItem('__walletMockDataCleared__') === 'true';
                           
      if (alreadyCleared) {
        return { cleaned: false, noRealData: false, errors };
      }
      
      // Load data to check for mock signatures
      const buyers = await storageService.getItem<Record<string, number>>(STORAGE_KEYS.BUYER_BALANCES, {});
      const sellers = await storageService.getItem<Record<string, number>>(STORAGE_KEYS.SELLER_BALANCES, {});
      const adminBalance = parseFloat(await storageService.getItem<string>(STORAGE_KEYS.ADMIN_BALANCE, '0'));
      
      const isMockData = 
        sellers['alice'] === MOCK_SIGNATURES.aliceBalance ||
        sellers['betty'] === MOCK_SIGNATURES.bettyBalance ||
        sellers['carol'] === MOCK_SIGNATURES.carolBalance ||
        sellers['diana'] === MOCK_SIGNATURES.dianaBalance ||
        buyers['buyer1'] === MOCK_SIGNATURES.buyer1Balance ||
        buyers['buyer2'] === MOCK_SIGNATURES.buyer2Balance ||
        buyers['buyer3'] === MOCK_SIGNATURES.buyer3Balance ||
        adminBalance === MOCK_SIGNATURES.adminBalance;
        
      if (!isMockData) {
        return { cleaned: false, noRealData: false, errors };
      }
      
      console.warn('[WalletMigration] Detected mock data while mock API is disabled. Cleaning...');
      
      // Check if there's any real data mixed with mock data
      const mockUsers = ['alice', 'betty', 'carol', 'diana', 'buyer1', 'buyer2', 'buyer3'];
      const hasRealBuyers = Object.keys(buyers).some(user => !mockUsers.includes(user));
      const hasRealSellers = Object.keys(sellers).some(user => !mockUsers.includes(user));
      const hasNonMockAdmin = adminBalance !== MOCK_SIGNATURES.adminBalance && adminBalance > 0;
      
      const hasRealData = hasRealBuyers || hasRealSellers || hasNonMockAdmin;
      
      if (hasRealData) {
        // Only remove mock users, preserve real data
        for (const mockUser of mockUsers) {
          delete buyers[mockUser];
          delete sellers[mockUser];
        }
        
        // Reset admin balance only if it's exactly the mock value
        const newAdminBalance = adminBalance === MOCK_SIGNATURES.adminBalance ? 0 : adminBalance;
        
        // Save cleaned data
        await storageService.setItem(STORAGE_KEYS.BUYER_BALANCES, buyers);
        await storageService.setItem(STORAGE_KEYS.SELLER_BALANCES, sellers);
        await storageService.setItem(STORAGE_KEYS.ADMIN_BALANCE, newAdminBalance.toString());
      } else {
        // No real data, clear everything
        const walletKeys = await storageService.getKeys('wallet_');
        for (const key of walletKeys) {
          await storageService.removeItem(key);
        }
      }
      
      // Mark as cleaned
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('__walletMockDataCleared__', 'true');
      }
      
      return { cleaned: true, noRealData: !hasRealData, errors };
    } catch (error) {
      errors.push(`Mock data cleanup error: ${sanitizeStrict(String(error))}`);
      return { cleaned: false, noRealData: false, errors };
    }
  }
  
  /**
   * Migrate legacy balances to Money type with validation
   */
  private static async migrateBalances(): Promise<{
    count: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let count = 0;
    
    try {
      // Migrate buyer balances
      const buyerBalancesRaw = await storageService.getItem<unknown>(STORAGE_KEYS.BUYER_BALANCES, {});
      const buyerBalancesValidation = legacyBalanceSchema.safeParse(buyerBalancesRaw);
      
      if (!buyerBalancesValidation.success) {
        errors.push('Invalid buyer balances format');
        return { count, errors };
      }
      
      const buyerBalances = buyerBalancesValidation.data;
      const buyerEntries = Object.entries(buyerBalances);
      
      // Process in batches
      for (let i = 0; i < buyerEntries.length; i += this.MAX_BATCH_SIZE) {
        const batch = buyerEntries.slice(i, i + this.MAX_BATCH_SIZE);
        
        for (const [username, balance] of batch) {
          try {
            // Sanitize username
            const sanitizedUsername = sanitizeUsername(username);
            if (!sanitizedUsername) {
              errors.push(`Invalid username format: ${username.substring(0, 20)}...`);
              continue;
            }
            
            // Validate and sanitize balance
            const sanitizedBalance = sanitizeCurrency(balance);
            const balanceKey = `wallet_buyer_${sanitizedUsername}`;
            const moneyBalance = Math.round(sanitizedBalance * 100); // Convert to cents
            
            await storageService.setItem(balanceKey, moneyBalance);
            count++;
          } catch (error) {
            errors.push(`Failed to migrate buyer balance for ${username}: ${error}`);
          }
        }
      }
      
      // Migrate seller balances
      const sellerBalancesRaw = await storageService.getItem<unknown>(STORAGE_KEYS.SELLER_BALANCES, {});
      const sellerBalancesValidation = legacyBalanceSchema.safeParse(sellerBalancesRaw);
      
      if (!sellerBalancesValidation.success) {
        errors.push('Invalid seller balances format');
        return { count, errors };
      }
      
      const sellerBalances = sellerBalancesValidation.data;
      const sellerEntries = Object.entries(sellerBalances);
      
      // Process in batches
      for (let i = 0; i < sellerEntries.length; i += this.MAX_BATCH_SIZE) {
        const batch = sellerEntries.slice(i, i + this.MAX_BATCH_SIZE);
        
        for (const [username, balance] of batch) {
          try {
            // Sanitize username
            const sanitizedUsername = sanitizeUsername(username);
            if (!sanitizedUsername) {
              errors.push(`Invalid username format: ${username.substring(0, 20)}...`);
              continue;
            }
            
            // Validate and sanitize balance
            const sanitizedBalance = sanitizeCurrency(balance);
            const balanceKey = `wallet_seller_${sanitizedUsername}`;
            const moneyBalance = Math.round(sanitizedBalance * 100); // Convert to cents
            
            await storageService.setItem(balanceKey, moneyBalance);
            count++;
          } catch (error) {
            errors.push(`Failed to migrate seller balance for ${username}: ${error}`);
          }
        }
      }
      
      // Migrate admin balance
      const adminBalanceRaw = await storageService.getItem<unknown>(STORAGE_KEYS.ADMIN_BALANCE, 0);
      const adminBalance = typeof adminBalanceRaw === 'number' ? adminBalanceRaw : 
                          typeof adminBalanceRaw === 'string' ? parseFloat(adminBalanceRaw) : 0;
      const sanitizedAdminBalance = sanitizeCurrency(adminBalance);
      const adminMoneyBalance = Math.round(sanitizedAdminBalance * 100);
      await storageService.setItem('wallet_admin_enhanced', adminMoneyBalance);
      count++;
      
    } catch (error) {
      errors.push(`Balance migration error: ${sanitizeStrict(String(error))}`);
    }
    
    return { count, errors };
  }
  
  /**
   * Migrate legacy transactions to enhanced format with validation
   */
  private static async migrateTransactions(): Promise<{
    count: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let count = 0;
    
    try {
      // Get legacy transactions
      const legacyTransactionsRaw = await storageService.getItem<unknown[]>('wallet_transactions_legacy', []);
      
      if (!Array.isArray(legacyTransactionsRaw)) {
        errors.push('Invalid legacy transactions format');
        return { count, errors };
      }
      
      const enhancedTransactions: Transaction[] = [];
      
      // Process in batches
      for (let i = 0; i < legacyTransactionsRaw.length; i += this.MAX_BATCH_SIZE) {
        const batch = legacyTransactionsRaw.slice(i, i + this.MAX_BATCH_SIZE);
        
        for (const legacyRaw of batch) {
          try {
            // Validate legacy transaction
            const validation = legacyTransactionSchema.safeParse(legacyRaw);
            if (!validation.success) {
              errors.push(`Invalid transaction format: ${JSON.stringify(legacyRaw).substring(0, 50)}...`);
              continue;
            }
            
            const legacy = validation.data;
            const enhanced = this.convertLegacyTransaction(legacy);
            enhancedTransactions.push(enhanced);
            count++;
          } catch (error) {
            errors.push(`Failed to convert transaction: ${error}`);
          }
        }
      }
      
      // Save enhanced transactions
      const existingTransactions = await storageService.getItem<Transaction[]>('wallet_transactions', []);
      const allTransactions = [...existingTransactions, ...enhancedTransactions];
      
      // Remove duplicates based on ID
      const uniqueTransactions = Array.from(
        new Map(allTransactions.map(t => [t.id, t])).values()
      );
      
      await storageService.setItem('wallet_transactions', uniqueTransactions);
      
    } catch (error) {
      errors.push(`Transaction migration error: ${sanitizeStrict(String(error))}`);
    }
    
    return { count, errors };
  }
  
  /**
   * Convert legacy transaction to enhanced format with sanitization
   */
  private static convertLegacyTransaction(legacy: z.infer<typeof legacyTransactionSchema>): Transaction {
    const type = this.mapLegacyTransactionType(legacy.type);
    const amount = Money.fromDollars(sanitizeCurrency(legacy.amount));
    
    // Sanitize description
    const description = legacy.description 
      ? sanitizeStrict(legacy.description).substring(0, 200)
      : `Legacy ${type} transaction`;
    
    const transaction: Transaction = {
      id: TransactionId(legacy.id || uuidv4()),
      type,
      amount,
      description,
      status: legacy.status || 'completed',
      createdAt: (legacy.date || new Date().toISOString()) as ISOTimestamp,
      metadata: legacy.metadata || {},
    };
    
    // Map from/to with sanitization
    if (legacy.from) {
      const sanitizedFrom = sanitizeUsername(legacy.from);
      if (sanitizedFrom) {
        transaction.from = UserId(sanitizedFrom);
        transaction.fromRole = this.inferRole(sanitizedFrom, type, 'from');
      }
    }
    
    if (legacy.to) {
      const sanitizedTo = sanitizeUsername(legacy.to);
      if (sanitizedTo) {
        transaction.to = UserId(sanitizedTo);
        transaction.toRole = this.inferRole(sanitizedTo, type, 'to');
      }
    }
    
    // Add completion time for completed transactions
    if (transaction.status === 'completed') {
      transaction.completedAt = transaction.createdAt;
    }
    
    return transaction;
  }
  
  /**
   * Migrate order history with validation
   */
  private static async migrateOrders(): Promise<{
    count: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let count = 0;
    
    try {
      const ordersRaw = await storageService.getItem<unknown[]>(STORAGE_KEYS.ORDERS, []);
      
      if (!Array.isArray(ordersRaw)) {
        errors.push('Invalid orders format');
        return { count, errors };
      }
      
      // Process in batches
      for (let i = 0; i < ordersRaw.length; i += this.MAX_BATCH_SIZE) {
        const batch = ordersRaw.slice(i, i + this.MAX_BATCH_SIZE);
        
        for (const orderRaw of batch) {
          try {
            // Validate order
            const validation = legacyOrderSchema.safeParse(orderRaw);
            if (!validation.success) {
              errors.push(`Invalid order format: ${JSON.stringify(orderRaw).substring(0, 50)}...`);
              continue;
            }
            
            const order = validation.data;
            
            // Sanitize usernames
            const sanitizedBuyer = sanitizeUsername(order.buyer);
            const sanitizedSeller = sanitizeUsername(order.seller);
            
            if (!sanitizedBuyer || !sanitizedSeller) {
              errors.push(`Invalid usernames in order ${order.id}`);
              continue;
            }
            
            // Create transactions for each order if not already exists
            const purchaseTransaction: Transaction = {
              id: TransactionId(`order_${order.id}`),
              type: 'purchase',
              amount: Money.fromDollars(sanitizeCurrency(order.markedUpPrice || order.price)),
              from: UserId(sanitizedBuyer),
              to: UserId(sanitizedSeller),
              fromRole: 'buyer',
              toRole: 'seller',
              description: sanitizeStrict(`Purchase: ${order.title}`).substring(0, 200),
              status: 'completed',
              createdAt: order.date as ISOTimestamp,
              completedAt: order.date as ISOTimestamp,
              metadata: {
                orderId: order.id,
                tierCreditAmount: order.tierCreditAmount 
                  ? Money.fromDollars(sanitizeCurrency(order.tierCreditAmount)) 
                  : undefined,
              },
            };
            
            // Check if transaction already exists
            const existingTransactions = await storageService.getItem<Transaction[]>('wallet_transactions', []);
            const exists = existingTransactions.some(t => t.id === purchaseTransaction.id);
            
            if (!exists) {
              existingTransactions.push(purchaseTransaction);
              await storageService.setItem('wallet_transactions', existingTransactions);
              count++;
            }
          } catch (error) {
            errors.push(`Failed to migrate order: ${sanitizeStrict(String(error))}`);
          }
        }
      }
    } catch (error) {
      errors.push(`Order migration error: ${sanitizeStrict(String(error))}`);
    }
    
    return { count, errors };
  }
  
  /**
   * Migrate other wallet data (withdrawals, admin actions, deposits)
   */
  private static async migrateOtherData(): Promise<{
    errors: string[];
  }> {
    const errors: string[] = [];
    
    try {
      // Migrate seller withdrawals
      const withdrawalsRaw = await storageService.getItem<unknown>(STORAGE_KEYS.SELLER_WITHDRAWALS, {});
      if (withdrawalsRaw && typeof withdrawalsRaw === 'object') {
        const sanitizedWithdrawals: Record<string, any[]> = {};
        
        for (const [username, withdrawals] of Object.entries(withdrawalsRaw)) {
          const sanitizedUsername = sanitizeUsername(username);
          if (!sanitizedUsername) continue;
          
          if (Array.isArray(withdrawals)) {
            sanitizedWithdrawals[sanitizedUsername] = withdrawals.map(w => {
              const validation = legacyWithdrawalSchema.safeParse(w);
              return validation.success ? validation.data : null;
            }).filter(Boolean);
          }
        }
        
        await storageService.setItem(STORAGE_KEYS.SELLER_WITHDRAWALS, sanitizedWithdrawals);
      }
      
      // Migrate admin actions
      const adminActionsRaw = await storageService.getItem<unknown[]>(STORAGE_KEYS.ADMIN_ACTIONS, []);
      if (Array.isArray(adminActionsRaw)) {
        const sanitizedActions = adminActionsRaw.map(action => {
          const validation = legacyAdminActionSchema.safeParse(action);
          if (!validation.success) return null;
          
          // Normalize targetUser/username fields
          const data = validation.data;
          return {
            ...data,
            targetUser: data.targetUser || data.username,
            username: data.username || data.targetUser,
          };
        }).filter(Boolean);
        
        await storageService.setItem(STORAGE_KEYS.ADMIN_ACTIONS, sanitizedActions);
      }
      
      // Migrate deposit logs
      const depositLogsRaw = await storageService.getItem<unknown[]>(STORAGE_KEYS.DEPOSIT_LOGS, []);
      if (Array.isArray(depositLogsRaw)) {
        const sanitizedDeposits = depositLogsRaw.map(deposit => {
          const validation = legacyDepositLogSchema.safeParse(deposit);
          return validation.success ? validation.data : null;
        }).filter(Boolean);
        
        await storageService.setItem(STORAGE_KEYS.DEPOSIT_LOGS, sanitizedDeposits);
      }
      
    } catch (error) {
      errors.push(`Other data migration error: ${sanitizeStrict(String(error))}`);
    }
    
    return { errors };
  }
  
  /**
   * Verify migration integrity with secure comparison
   */
  private static async verifyMigration(): Promise<{
    success: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];
    
    try {
      // Verify balance consistency
      const buyerBalancesRaw = await storageService.getItem<unknown>(STORAGE_KEYS.BUYER_BALANCES, {});
      const buyerBalancesValidation = legacyBalanceSchema.safeParse(buyerBalancesRaw);
      
      if (buyerBalancesValidation.success) {
        const buyerBalances = buyerBalancesValidation.data;
        
        for (const [username, legacyBalance] of Object.entries(buyerBalances)) {
          const sanitizedUsername = sanitizeUsername(username);
          if (!sanitizedUsername) continue;
          
          const enhancedBalance = await storageService.getItem<number>(`wallet_buyer_${sanitizedUsername}`, 0);
          const expectedBalance = Math.round(sanitizeCurrency(legacyBalance) * 100);
          
          if (Math.abs(enhancedBalance - expectedBalance) > 1) {
            errors.push(`Balance mismatch for buyer ${sanitizedUsername}: expected ${expectedBalance}, got ${enhancedBalance}`);
          }
        }
      }
      
      // Verify transaction count
      const legacyTransactionsRaw = await storageService.getItem<unknown[]>('wallet_transactions_legacy', []);
      const enhancedTransactions = await storageService.getItem<Transaction[]>('wallet_transactions', []);
      
      if (Array.isArray(legacyTransactionsRaw) && enhancedTransactions.length < legacyTransactionsRaw.length) {
        errors.push(`Transaction count mismatch: legacy ${legacyTransactionsRaw.length}, enhanced ${enhancedTransactions.length}`);
      }
      
    } catch (error) {
      errors.push(`Verification error: ${sanitizeStrict(String(error))}`);
    }
    
    return {
      success: errors.length === 0,
      errors,
    };
  }
  
  /**
   * Rollback migration (for testing) - with safety checks
   */
  static async rollbackMigration(): Promise<void> {
    // Check if we're in development environment
    if (process.env.NODE_ENV === 'production') {
      console.error('Rollback not allowed in production');
      return;
    }
    
    // Rate limit rollback attempts
    const rateLimitResult = this.rateLimiter.check('migration_rollback', {
      maxAttempts: 3,
      windowMs: 3600000, // 3 rollbacks per hour max
    });
    
    if (!rateLimitResult.allowed) {
      console.error('Rollback rate limit exceeded');
      return;
    }
    
    // Remove migration status
    await storageService.removeItem(this.migrationKey);
    
    // Remove enhanced data (keep legacy data intact)
    const keysToRemove: string[] = [];
    
    // Find all enhanced wallet keys
    if (typeof window !== 'undefined' && window.localStorage) {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('wallet_buyer_') || key.startsWith('wallet_seller_') || key === 'wallet_admin_enhanced')) {
          keysToRemove.push(key);
        }
      }
    }
    
    // Remove enhanced keys
    for (const key of keysToRemove) {
      await storageService.removeItem(key);
    }
    
    // Clear enhanced transactions
    await storageService.setItem('wallet_transactions', []);
  }
  
  // Helper methods
  private static mapLegacyTransactionType(legacyType: string): Transaction['type'] {
    const sanitizedType = sanitizeStrict(legacyType).toLowerCase();
    
    const typeMap: Record<string, Transaction['type']> = {
      'admin_action': 'admin_credit',
      'sale': 'purchase',
    };
    
    const mappedType = typeMap[sanitizedType] || sanitizedType;
    
    // Validate against allowed types
    const allowedTypes: Transaction['type'][] = [
      'deposit', 'withdrawal', 'purchase', 'sale', 'tip', 
      'subscription', 'admin_credit', 'admin_debit', 'refund', 
      'fee', 'tier_credit'
    ];
    
    return allowedTypes.includes(mappedType as Transaction['type']) 
      ? mappedType as Transaction['type'] 
      : 'purchase'; // Default fallback
  }
  
  private static inferRole(
    username: string, 
    type: Transaction['type'], 
    direction: 'from' | 'to'
  ): 'buyer' | 'seller' | 'admin' | undefined {
    if (username === 'admin') return 'admin';
    
    const roleMap: Record<Transaction['type'], { from?: string; to?: string }> = {
      deposit: { to: 'buyer' },
      withdrawal: { from: 'seller' },
      purchase: { from: 'buyer', to: 'seller' },
      sale: { from: 'buyer', to: 'seller' },
      tip: { from: 'buyer', to: 'seller' },
      subscription: { from: 'buyer', to: 'seller' },
      admin_credit: { from: 'admin' },
      admin_debit: { to: 'admin' },
      refund: { from: 'seller', to: 'buyer' },
      fee: { to: 'admin' },
      tier_credit: { from: 'admin', to: 'seller' },
    };
    
    return roleMap[type]?.[direction] as any;
  }
  
  /**
   * Get migration status with secure error handling
   */
  static async getMigrationStatus(): Promise<{
    needed: boolean;
    completed: boolean;
    inProgress: boolean;
    stats?: any;
    errors?: string[];
  }> {
    try {
      const status = await storageService.getItem<any>(this.migrationKey, null);
      const needed = await this.isMigrationNeeded();
      
      return {
        needed,
        completed: status?.completed || false,
        inProgress: status?.started && !status?.completed,
        stats: status?.stats,
        errors: status?.errors?.map((e: unknown) => sanitizeStrict(String(e))),
      };
    } catch (error) {
      console.error('Error getting migration status:', error);
      return {
        needed: false,
        completed: false,
        inProgress: false,
        errors: ['Failed to get migration status'],
      };
    }
  }
}

/**
 * Auto-migration on app startup with secure error handling
 */
export async function initializeWalletMigration(): Promise<void> {
  try {
    const status = await WalletMigration.getMigrationStatus();
    
    if (status.needed && !status.completed && !status.inProgress) {
      console.log('Starting wallet data migration...');
      const result = await WalletMigration.performMigration();
      
      if (result.success) {
        console.log('Wallet migration completed successfully:', result.stats);
      } else {
        console.error('Wallet migration completed with errors:', result.errors);
        
        // Log to monitoring service in production
        if (typeof window !== 'undefined' && (window as any).errorReporting) {
          (window as any).errorReporting.logError('Wallet migration failed', {
            errors: result.errors,
            stats: result.stats,
          });
        }
      }
    }
  } catch (error) {
    console.error('Wallet migration initialization error:', error);
    
    // Don't throw - allow app to continue even if migration fails
    // User can still use the app with legacy data
  }
}