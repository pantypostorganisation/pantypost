// src/services/wallet.migration.ts

import { storageService } from './storage.service';
import { walletService as enhancedWalletService } from './wallet.service.enhanced';
import { Money, UserId, ISOTimestamp } from '@/types/common';
import { Transaction, TransactionId } from './wallet.service.enhanced';
import { v4 as uuidv4 } from 'uuid';

/**
 * Migration utilities for transitioning to the enhanced wallet system
 */
export class WalletMigration {
  private static migrationKey = 'wallet_migration_status';
  
  /**
   * Check if migration is needed
   */
  static async isMigrationNeeded(): Promise<boolean> {
    const status = await storageService.getItem<any>(this.migrationKey, null);
    
    if (status?.completed) {
      return false;
    }
    
    // Check for legacy data
    const hasLegacyBuyerBalances = await storageService.hasKey('wallet_buyers');
    const hasLegacySellerBalances = await storageService.hasKey('wallet_sellers');
    const hasLegacyTransactions = await storageService.hasKey('wallet_transactions_legacy');
    
    return hasLegacyBuyerBalances || hasLegacySellerBalances || hasLegacyTransactions;
  }
  
  /**
   * Perform full migration
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
      // Mark migration as in progress
      await storageService.setItem(this.migrationKey, {
        started: new Date().toISOString(),
        completed: false,
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
        started: new Date().toISOString(),
        completed: new Date().toISOString(),
        stats,
        errors,
      });
      
      return {
        success: errors.length === 0,
        errors,
        stats,
      };
    } catch (error) {
      errors.push(`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        success: false,
        errors,
        stats,
      };
    }
  }
  
  /**
   * Migrate legacy balances to Money type
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
      for (const [username, balance] of Object.entries(buyerBalances)) {
        try {
          const balanceKey = `wallet_buyer_${username}`;
          const moneyBalance = Math.round(balance * 100); // Convert to cents
          await storageService.setItem(balanceKey, moneyBalance);
          count++;
        } catch (error) {
          errors.push(`Failed to migrate buyer balance for ${username}: ${error}`);
        }
      }
      
      // Migrate seller balances
      const sellerBalances = await storageService.getItem<Record<string, number>>('wallet_sellers', {});
      for (const [username, balance] of Object.entries(sellerBalances)) {
        try {
          const balanceKey = `wallet_seller_${username}`;
          const moneyBalance = Math.round(balance * 100); // Convert to cents
          await storageService.setItem(balanceKey, moneyBalance);
          count++;
        } catch (error) {
          errors.push(`Failed to migrate seller balance for ${username}: ${error}`);
        }
      }
      
      // Migrate admin balance
      const adminBalance = await storageService.getItem<number>('wallet_admin', 0);
      const adminMoneyBalance = Math.round(adminBalance * 100);
      await storageService.setItem('wallet_admin', adminMoneyBalance);
      count++;
      
    } catch (error) {
      errors.push(`Balance migration error: ${error}`);
    }
    
    return { count, errors };
  }
  
  /**
   * Migrate legacy transactions to enhanced format
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
      const enhancedTransactions: Transaction[] = [];
      
      for (const legacy of legacyTransactions) {
        try {
          const enhanced = this.convertLegacyTransaction(legacy);
          enhancedTransactions.push(enhanced);
          count++;
        } catch (error) {
          errors.push(`Failed to convert transaction ${legacy.id}: ${error}`);
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
      errors.push(`Transaction migration error: ${error}`);
    }
    
    return { count, errors };
  }
  
  /**
   * Convert legacy transaction to enhanced format
   */
  private static convertLegacyTransaction(legacy: any): Transaction {
    const type = this.mapLegacyTransactionType(legacy.type);
    const amount = Money.fromDollars(legacy.amount);
    
    const transaction: Transaction = {
      id: TransactionId(legacy.id || uuidv4()),
      type,
      amount,
      description: legacy.description || `Legacy ${type} transaction`,
      status: legacy.status || 'completed',
      createdAt: (legacy.date || new Date().toISOString()) as ISOTimestamp,
      metadata: legacy.metadata || {},
    };
    
    // Map from/to based on type
    if (legacy.from) {
      transaction.from = UserId(legacy.from);
      transaction.fromRole = this.inferRole(legacy.from, type, 'from');
    }
    
    if (legacy.to) {
      transaction.to = UserId(legacy.to);
      transaction.toRole = this.inferRole(legacy.to, type, 'to');
    }
    
    // Add completion time for completed transactions
    if (transaction.status === 'completed') {
      transaction.completedAt = transaction.createdAt;
    }
    
    return transaction;
  }
  
  /**
   * Migrate order history
   */
  private static async migrateOrders(): Promise<{
    count: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let count = 0;
    
    try {
      const orders = await storageService.getItem<any[]>('wallet_orders', []);
      
      for (const order of orders) {
        try {
          // Create transactions for each order if not already exists
          const purchaseTransaction: Transaction = {
            id: TransactionId(`order_${order.id}`),
            type: 'purchase',
            amount: Money.fromDollars(order.markedUpPrice || order.price),
            from: UserId(order.buyer),
            to: UserId(order.seller),
            fromRole: 'buyer',
            toRole: 'seller',
            description: `Purchase: ${order.title}`,
            status: 'completed',
            createdAt: order.date as ISOTimestamp,
            completedAt: order.date as ISOTimestamp,
            metadata: {
              orderId: order.id,
              tierCreditAmount: order.tierCreditAmount ? Money.fromDollars(order.tierCreditAmount) : undefined,
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
          errors.push(`Failed to migrate order ${order.id}: ${error}`);
        }
      }
    } catch (error) {
      errors.push(`Order migration error: ${error}`);
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
      // Verify balance consistency
      const buyerBalances = await storageService.getItem<Record<string, number>>('wallet_buyers', {});
      for (const [username, legacyBalance] of Object.entries(buyerBalances)) {
        const enhancedBalance = await storageService.getItem<number>(`wallet_buyer_${username}`, 0);
        const expectedBalance = Math.round(legacyBalance * 100);
        
        if (Math.abs(enhancedBalance - expectedBalance) > 1) {
          errors.push(`Balance mismatch for buyer ${username}: expected ${expectedBalance}, got ${enhancedBalance}`);
        }
      }
      
      // Verify transaction count
      const legacyTransactions = await storageService.getItem<any[]>('wallet_transactions_legacy', []);
      const enhancedTransactions = await storageService.getItem<Transaction[]>('wallet_transactions', []);
      
      if (enhancedTransactions.length < legacyTransactions.length) {
        errors.push(`Transaction count mismatch: legacy ${legacyTransactions.length}, enhanced ${enhancedTransactions.length}`);
      }
      
    } catch (error) {
      errors.push(`Verification error: ${error}`);
    }
    
    return {
      success: errors.length === 0,
      errors,
    };
  }
  
  /**
   * Rollback migration (for testing)
   */
  static async rollbackMigration(): Promise<void> {
    // Remove migration status
    await storageService.removeItem(this.migrationKey);
    
    // Remove enhanced data (keep legacy data intact)
    const keysToRemove: string[] = [];
    
    // Find all enhanced wallet keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('wallet_buyer_') || key.startsWith('wallet_seller_'))) {
        keysToRemove.push(key);
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
    const typeMap: Record<string, Transaction['type']> = {
      'admin_action': 'admin_credit',
      'sale': 'purchase',
    };
    
    return typeMap[legacyType] || legacyType as Transaction['type'];
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
   * Get migration status
   */
  static async getMigrationStatus(): Promise<{
    needed: boolean;
    completed: boolean;
    inProgress: boolean;
    stats?: any;
    errors?: string[];
  }> {
    const status = await storageService.getItem<any>(this.migrationKey, null);
    const needed = await this.isMigrationNeeded();
    
    return {
      needed,
      completed: status?.completed || false,
      inProgress: status?.started && !status?.completed,
      stats: status?.stats,
      errors: status?.errors,
    };
  }
}

/**
 * Auto-migration on app startup
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
      }
    }
  } catch (error) {
    console.error('Wallet migration initialization error:', error);
  }
}
