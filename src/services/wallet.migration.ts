// src/services/wallet.migration.ts

import { storageService } from './storage.service';
import { walletService as enhancedWalletService } from './wallet.service.enhanced';
import { Money, UserId, ISOTimestamp } from '@/types/common';
import { Transaction, TransactionId } from './wallet.service.enhanced';
import { v4 as uuidv4 } from 'uuid';
import { sanitizeStrict, sanitizeNumber } from '@/utils/security/sanitization';
import { z } from 'zod';

// Migration validation schemas
const legacyBalanceSchema = z.record(z.string(), z.number().min(0).max(1000000));

const legacyTransactionSchema = z.object({
  id: z.string().optional(),
  type: z.string(),
  amount: z.number().min(0).max(1000000),
  from: z.string().optional(),
  to: z.string().optional(),
  description: z.string().optional(),
  status: z.string().optional(),
  date: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

const legacyOrderSchema = z.object({
  id: z.string(),
  title: z.string(),
  price: z.number().min(0).max(10000),
  markedUpPrice: z.number().min(0).max(10000).optional(),
  buyer: z.string(),
  seller: z.string(),
  date: z.string(),
  tierCreditAmount: z.number().min(0).max(1000).optional(),
});

/**
 * Migration utilities for transitioning to the enhanced wallet system
 */
export class WalletMigration {
  private static migrationKey = 'wallet_migration_status';
  private static readonly MAX_MIGRATION_ATTEMPTS = 3;
  private static readonly MIGRATION_TIMEOUT = 5 * 60 * 1000; // 5 minutes
  
  /**
   * Check if migration is needed
   */
  static async isMigrationNeeded(): Promise<boolean> {
    try {
      const status = await storageService.getItem<any>(this.migrationKey, null);
      
      if (status?.completed) {
        return false;
      }
      
      // Check if migration is stuck
      if (status?.started && !status?.completed) {
        const startTime = new Date(status.started).getTime();
        const now = Date.now();
        if (now - startTime > this.MIGRATION_TIMEOUT) {
          console.warn('Migration appears to be stuck, will retry');
          return true;
        }
        return false; // Migration in progress
      }
      
      // Check for legacy data
      const hasLegacyBuyerBalances = await storageService.hasKey('wallet_buyers');
      const hasLegacySellerBalances = await storageService.hasKey('wallet_sellers');
      const hasLegacyTransactions = await storageService.hasKey('wallet_transactions_legacy');
      
      return hasLegacyBuyerBalances || hasLegacySellerBalances || hasLegacyTransactions;
    } catch (error) {
      console.error('Error checking migration status:', error);
      return false;
    }
  }
  
  /**
   * Perform full migration with validation
   */
  static async performMigration(): Promise<{
    success: boolean;
    errors: string[];
    stats: {
      balancesMigrated: number;
      transactionsMigrated: number;
      ordersProcessed: number;
    };
  }> {
    const errors: string[] = [];
    const stats = {
      balancesMigrated: 0,
      transactionsMigrated: 0,
      ordersProcessed: 0,
    };
    
    try {
      // Check if already in progress
      const currentStatus = await storageService.getItem<any>(this.migrationKey, null);
      if (currentStatus?.started && !currentStatus?.completed) {
        const startTime = new Date(currentStatus.started).getTime();
        if (Date.now() - startTime < this.MIGRATION_TIMEOUT) {
          return {
            success: false,
            errors: ['Migration already in progress'],
            stats,
          };
        }
      }

      // Check attempt count
      const attemptCount = currentStatus?.attempts || 0;
      if (attemptCount >= this.MAX_MIGRATION_ATTEMPTS) {
        return {
          success: false,
          errors: ['Maximum migration attempts exceeded'],
          stats,
        };
      }
      
      // Mark migration as in progress
      await storageService.setItem(this.migrationKey, {
        started: new Date().toISOString(),
        completed: false,
        attempts: attemptCount + 1,
      });
      
      // 1. Migrate balances
      const balanceResult = await this.migrateBalances();
      stats.balancesMigrated = balanceResult.count;
      if (balanceResult.errors.length > 0) {
        errors.push(...balanceResult.errors);
      }
      
      // 2. Migrate transaction history
      const transactionResult = await this.migrateTransactions();
      stats.transactionsMigrated = transactionResult.count;
      if (transactionResult.errors.length > 0) {
        errors.push(...transactionResult.errors);
      }
      
      // 3. Migrate order history
      const orderResult = await this.migrateOrders();
      stats.ordersProcessed = orderResult.count;
      if (orderResult.errors.length > 0) {
        errors.push(...orderResult.errors);
      }
      
      // 4. Verify migration
      const verificationResult = await this.verifyMigration();
      if (!verificationResult.success) {
        errors.push(...verificationResult.errors);
      }
      
      // Mark migration as completed
      await storageService.setItem(this.migrationKey, {
        started: currentStatus?.started || new Date().toISOString(),
        completed: new Date().toISOString(),
        attempts: attemptCount + 1,
        stats,
        errors: errors.slice(0, 100), // Limit stored errors
      });
      
      return {
        success: errors.length === 0,
        errors,
        stats,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Migration failed: ${sanitizeStrict(errorMessage).substring(0, 200)}`);
      return {
        success: false,
        errors,
        stats,
      };
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
      const buyerBalances = await storageService.getItem<Record<string, number>>('wallet_buyers', {});
      
      // Validate legacy data
      const buyerValidation = legacyBalanceSchema.safeParse(buyerBalances);
      if (!buyerValidation.success) {
        errors.push('Invalid buyer balance data format');
        return { count, errors };
      }
      
      for (const [username, balance] of Object.entries(buyerValidation.data)) {
        try {
          // Validate username
          const sanitizedUsername = sanitizeStrict(username).toLowerCase();
          if (!sanitizedUsername || sanitizedUsername.length > 50 || !/^[a-z0-9_-]+$/.test(sanitizedUsername)) {
            errors.push(`Invalid username: ${username.substring(0, 20)}...`);
            continue;
          }
          
          const balanceKey = `wallet_buyer_${sanitizedUsername}`;
          const sanitizedBalance = sanitizeNumber(balance, 0, 1000000, 2);
          const moneyBalance = Math.round(sanitizedBalance * 100); // Convert to cents
          
          await storageService.setItem(balanceKey, moneyBalance);
          count++;
        } catch (error) {
          errors.push(`Failed to migrate buyer balance for ${username.substring(0, 20)}: ${error}`);
        }
      }
      
      // Migrate seller balances
      const sellerBalances = await storageService.getItem<Record<string, number>>('wallet_sellers', {});
      
      // Validate legacy data
      const sellerValidation = legacyBalanceSchema.safeParse(sellerBalances);
      if (!sellerValidation.success) {
        errors.push('Invalid seller balance data format');
        return { count, errors };
      }
      
      for (const [username, balance] of Object.entries(sellerValidation.data)) {
        try {
          // Validate username
          const sanitizedUsername = sanitizeStrict(username).toLowerCase();
          if (!sanitizedUsername || sanitizedUsername.length > 50 || !/^[a-z0-9_-]+$/.test(sanitizedUsername)) {
            errors.push(`Invalid username: ${username.substring(0, 20)}...`);
            continue;
          }
          
          const balanceKey = `wallet_seller_${sanitizedUsername}`;
          const sanitizedBalance = sanitizeNumber(balance, 0, 1000000, 2);
          const moneyBalance = Math.round(sanitizedBalance * 100); // Convert to cents
          
          await storageService.setItem(balanceKey, moneyBalance);
          count++;
        } catch (error) {
          errors.push(`Failed to migrate seller balance for ${username.substring(0, 20)}: ${error}`);
        }
      }
      
      // Migrate admin balance
      const adminBalance = await storageService.getItem<number>('wallet_balance', 0);
      const sanitizedAdminBalance = sanitizeNumber(adminBalance, 0, 10000000, 2);
      const adminMoneyBalance = Math.round(sanitizedAdminBalance * 100);
      await storageService.setItem('wallet_balance', adminMoneyBalance);
      count++;
      
    } catch (error) {
      errors.push(`Balance migration error: ${sanitizeStrict(String(error)).substring(0, 200)}`);
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
      const legacyTransactions = await storageService.getItem<any[]>('wallet_transactions_legacy', []);
      
      // Limit number of transactions to migrate at once
      const transactionsToMigrate = legacyTransactions.slice(0, 1000);
      const enhancedTransactions: Transaction[] = [];
      
      for (const legacy of transactionsToMigrate) {
        try {
          // Validate legacy transaction
          const validation = legacyTransactionSchema.safeParse(legacy);
          if (!validation.success) {
            errors.push(`Invalid transaction format: ${legacy.id || 'unknown'}`);
            continue;
          }
          
          const enhanced = this.convertLegacyTransaction(validation.data);
          if (enhanced) {
            enhancedTransactions.push(enhanced);
            count++;
          }
        } catch (error) {
          errors.push(`Failed to convert transaction ${legacy.id || 'unknown'}: ${error}`);
        }
      }
      
      // Save enhanced transactions
      const existingTransactions = await storageService.getItem<Transaction[]>('wallet_transactions', []);
      const allTransactions = [...existingTransactions, ...enhancedTransactions];
      
      // Remove duplicates based on ID
      const uniqueTransactions = Array.from(
        new Map(allTransactions.map(t => [t.id, t])).values()
      );
      
      // Limit total stored transactions
      const limitedTransactions = uniqueTransactions.slice(-10000);
      
      await storageService.setItem('wallet_transactions', limitedTransactions);
      
    } catch (error) {
      errors.push(`Transaction migration error: ${sanitizeStrict(String(error)).substring(0, 200)}`);
    }
    
    return { count, errors };
  }
  
  /**
   * Convert legacy transaction to enhanced format with validation
   */
  private static convertLegacyTransaction(legacy: z.infer<typeof legacyTransactionSchema>): Transaction | null {
    try {
      const type = this.mapLegacyTransactionType(legacy.type);
      const sanitizedAmount = sanitizeNumber(legacy.amount, 0, 1000000, 2);
      const amount = Money.fromDollars(sanitizedAmount);
      
      // Validate and create transaction ID
      const transactionId = legacy.id ? sanitizeStrict(legacy.id).substring(0, 50) : uuidv4();
      
      const transaction: Transaction = {
        id: TransactionId(transactionId),
        type,
        amount,
        description: sanitizeStrict(legacy.description || `Legacy ${type} transaction`).substring(0, 200),
        status: this.validateTransactionStatus(legacy.status),
        createdAt: this.validateTimestamp(legacy.date),
        metadata: this.sanitizeMetadata(legacy.metadata || {}),
      };
      
      // Map from/to with validation
      if (legacy.from) {
        const sanitizedFrom = sanitizeStrict(legacy.from).toLowerCase();
        if (sanitizedFrom && sanitizedFrom.length <= 50 && /^[a-z0-9_-]+$/.test(sanitizedFrom)) {
          transaction.from = UserId(sanitizedFrom);
          transaction.fromRole = this.inferRole(sanitizedFrom, type, 'from');
        }
      }
      
      if (legacy.to) {
        const sanitizedTo = sanitizeStrict(legacy.to).toLowerCase();
        if (sanitizedTo && sanitizedTo.length <= 50 && /^[a-z0-9_-]+$/.test(sanitizedTo)) {
          transaction.to = UserId(sanitizedTo);
          transaction.toRole = this.inferRole(sanitizedTo, type, 'to');
        }
      }
      
      // Add completion time for completed transactions
      if (transaction.status === 'completed') {
        transaction.completedAt = transaction.createdAt;
      }
      
      return transaction;
    } catch (error) {
      console.error('Error converting legacy transaction:', error);
      return null;
    }
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
      const orders = await storageService.getItem<any[]>('wallet_orders', []);
      
      // Limit number of orders to process
      const ordersToProcess = orders.slice(0, 1000);
      
      for (const order of ordersToProcess) {
        try {
          // Validate order
          const validation = legacyOrderSchema.safeParse(order);
          if (!validation.success) {
            errors.push(`Invalid order format: ${order.id || 'unknown'}`);
            continue;
          }
          
          const validOrder = validation.data;
          
          // Sanitize usernames
          const sanitizedBuyer = sanitizeStrict(validOrder.buyer).toLowerCase();
          const sanitizedSeller = sanitizeStrict(validOrder.seller).toLowerCase();
          
          if (!sanitizedBuyer || !sanitizedSeller || 
              sanitizedBuyer.length > 50 || sanitizedSeller.length > 50 ||
              !/^[a-z0-9_-]+$/.test(sanitizedBuyer) || !/^[a-z0-9_-]+$/.test(sanitizedSeller)) {
            errors.push(`Invalid usernames in order ${validOrder.id}`);
            continue;
          }
          
          // Create transactions for each order if not already exists
          const purchaseTransaction: Transaction = {
            id: TransactionId(`order_${sanitizeStrict(validOrder.id).substring(0, 50)}`),
            type: 'purchase',
            amount: Money.fromDollars(sanitizeNumber(validOrder.markedUpPrice || validOrder.price, 0, 10000, 2)),
            from: UserId(sanitizedBuyer),
            to: UserId(sanitizedSeller),
            fromRole: 'buyer',
            toRole: 'seller',
            description: sanitizeStrict(`Purchase: ${validOrder.title}`).substring(0, 200),
            status: 'completed',
            createdAt: this.validateTimestamp(validOrder.date),
            completedAt: this.validateTimestamp(validOrder.date),
            metadata: {
              orderId: sanitizeStrict(validOrder.id).substring(0, 50),
              tierCreditAmount: validOrder.tierCreditAmount 
                ? Money.fromDollars(sanitizeNumber(validOrder.tierCreditAmount, 0, 1000, 2)) 
                : undefined,
            },
          };
          
          // Check if transaction already exists
          const existingTransactions = await storageService.getItem<Transaction[]>('wallet_transactions', []);
          const exists = existingTransactions.some(t => t.id === purchaseTransaction.id);
          
          if (!exists && existingTransactions.length < 10000) {
            existingTransactions.push(purchaseTransaction);
            await storageService.setItem('wallet_transactions', existingTransactions);
            count++;
          }
        } catch (error) {
          errors.push(`Failed to migrate order ${order.id || 'unknown'}: ${error}`);
        }
      }
    } catch (error) {
      errors.push(`Order migration error: ${sanitizeStrict(String(error)).substring(0, 200)}`);
    }
    
    return { count, errors };
  }
  
  /**
   * Verify migration integrity
   */
  private static async verifyMigration(): Promise<{
    success: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];
    
    try {
      // Sample verification - check a few balances
      const buyerBalances = await storageService.getItem<Record<string, number>>('wallet_buyers', {});
      const sampleSize = Math.min(10, Object.keys(buyerBalances).length);
      const sampleUsers = Object.entries(buyerBalances).slice(0, sampleSize);
      
      for (const [username, legacyBalance] of sampleUsers) {
        try {
          const sanitizedUsername = sanitizeStrict(username).toLowerCase();
          if (!sanitizedUsername || !/^[a-z0-9_-]+$/.test(sanitizedUsername)) continue;
          
          const enhancedBalance = await storageService.getItem<number>(`wallet_buyer_${sanitizedUsername}`, 0);
          const expectedBalance = Math.round(sanitizeNumber(legacyBalance, 0, 1000000, 2) * 100);
          
          if (Math.abs(enhancedBalance - expectedBalance) > 1) {
            errors.push(`Balance mismatch for buyer ${sanitizedUsername.substring(0, 20)}`);
          }
        } catch (error) {
          errors.push(`Verification error for ${username.substring(0, 20)}`);
        }
      }
      
    } catch (error) {
      errors.push(`Verification error: ${sanitizeStrict(String(error)).substring(0, 200)}`);
    }
    
    return {
      success: errors.length === 0,
      errors: errors.slice(0, 10), // Limit errors
    };
  }
  
  /**
   * Rollback migration (for testing only - requires admin access)
   */
  static async rollbackMigration(adminToken?: string): Promise<void> {
    // Verify admin access
    if (adminToken !== process.env.NEXT_PUBLIC_ADMIN_TOKEN) {
      throw new Error('Unauthorized');
    }
    
    // Remove migration status
    await storageService.removeItem(this.migrationKey);
    
    // Note: We don't remove migrated data to prevent accidental data loss
    console.log('Migration status cleared. Manual data cleanup required if needed.');
  }
  
  // Helper methods
  private static mapLegacyTransactionType(legacyType: string): Transaction['type'] {
    const sanitizedType = sanitizeStrict(legacyType).toLowerCase();
    
    const typeMap: Record<string, Transaction['type']> = {
      'admin_action': 'admin_credit',
      'sale': 'purchase',
    };
    
    const validTypes: Transaction['type'][] = [
      'deposit', 'withdrawal', 'purchase', 'sale', 'tip', 
      'subscription', 'admin_credit', 'admin_debit', 'refund', 
      'fee', 'tier_credit'
    ];
    
    const mappedType = typeMap[sanitizedType] || sanitizedType;
    
    return validTypes.includes(mappedType as Transaction['type']) 
      ? mappedType as Transaction['type'] 
      : 'purchase';
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
    
    const role = roleMap[type]?.[direction];
    return role === 'buyer' || role === 'seller' || role === 'admin' ? role : undefined;
  }
  
  private static validateTransactionStatus(status?: string): Transaction['status'] {
    // Updated to only include valid statuses from the Transaction type
    const validStatuses: Transaction['status'][] = ['pending', 'completed', 'failed', 'cancelled'];
    const sanitizedStatus = status ? sanitizeStrict(status).toLowerCase() : 'completed';
    
    // Special handling: if legacy status was 'refunded', map it to 'completed'
    // since refunds are now handled as a separate transaction type
    if (sanitizedStatus === 'refunded') {
      return 'completed';
    }
    
    return validStatuses.includes(sanitizedStatus as Transaction['status']) 
      ? sanitizedStatus as Transaction['status'] 
      : 'completed';
  }
  
  private static validateTimestamp(date?: string): ISOTimestamp {
    if (!date) return new Date().toISOString() as ISOTimestamp;
    
    try {
      const parsed = new Date(date);
      if (isNaN(parsed.getTime())) {
        return new Date().toISOString() as ISOTimestamp;
      }
      return parsed.toISOString() as ISOTimestamp;
    } catch {
      return new Date().toISOString() as ISOTimestamp;
    }
  }
  
  private static sanitizeMetadata(metadata: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};
    
    // Limit metadata entries
    const entries = Object.entries(metadata).slice(0, 20);
    
    for (const [key, value] of entries) {
      const sanitizedKey = sanitizeStrict(key).substring(0, 50);
      if (!sanitizedKey) continue;
      
      if (typeof value === 'string') {
        sanitized[sanitizedKey] = sanitizeStrict(value).substring(0, 200);
      } else if (typeof value === 'number') {
        sanitized[sanitizedKey] = sanitizeNumber(value, -1000000, 1000000, 2);
      } else if (typeof value === 'boolean') {
        sanitized[sanitizedKey] = value;
      }
      // Ignore other types for security
    }
    
    return sanitized;
  }
  
  /**
   * Get migration status
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
        inProgress: status?.started && !status?.completed || false,
        stats: status?.stats,
        errors: status?.errors?.slice(0, 10), // Limit exposed errors
      };
    } catch (error) {
      console.error('Error getting migration status:', error);
      return {
        needed: false,
        completed: false,
        inProgress: false,
      };
    }
  }
}

/**
 * Auto-migration on app startup with safety checks
 */
export async function initializeWalletMigration(): Promise<void> {
  try {
    // Add delay to ensure storage service is initialized
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const status = await WalletMigration.getMigrationStatus();
    
    if (status.needed && !status.completed && !status.inProgress) {
      console.log('Starting wallet data migration...');
      const result = await WalletMigration.performMigration();
      
      if (result.success) {
        console.log('Wallet migration completed successfully:', result.stats);
      } else {
        console.error('Wallet migration completed with errors:', result.errors.slice(0, 5));
      }
    }
  } catch (error) {
    console.error('Wallet migration initialization error:', error);
  }
}