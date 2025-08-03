// src/utils/admin/dataIntegrity.ts

import { storageService } from '@/services/storage.service';
import { Order } from '@/types/wallet';
import type { DepositLog } from '@/types/wallet';


interface DataValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

interface DataRepairResult {
  success: boolean;
  repaired: string[];
  failed: string[];
}

/**
 * Utility for validating and repairing wallet data integrity
 */
export class DataIntegrityUtil {
  /**
   * Validate all wallet data
   */
  static async validateWalletData(): Promise<DataValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    try {
      // Validate buyer balances
      const buyerBalances = await storageService.getItem<Record<string, number>>('wallet_buyers', {});
      for (const [username, balance] of Object.entries(buyerBalances)) {
        if (typeof balance !== 'number') {
          errors.push(`Invalid buyer balance for ${username}: ${balance}`);
        }
        if (balance < 0) {
          warnings.push(`Negative buyer balance for ${username}: ${balance}`);
        }
        
        // Check individual key consistency
        const individualKey = `wallet_buyer_${username}`;
        const individualBalance = await storageService.getItem<number>(individualKey, -1);
        if (individualBalance !== -1) {
          const individualInDollars = individualBalance / 100;
          if (Math.abs(individualInDollars - balance) > 0.01) {
            warnings.push(`Balance mismatch for buyer ${username}: collective=${balance}, individual=${individualInDollars}`);
          }
        }
      }

      // Validate seller balances
      const sellerBalances = await storageService.getItem<Record<string, number>>('wallet_sellers', {});
      for (const [username, balance] of Object.entries(sellerBalances)) {
        if (typeof balance !== 'number') {
          errors.push(`Invalid seller balance for ${username}: ${balance}`);
        }
        if (balance < 0) {
          warnings.push(`Negative seller balance for ${username}: ${balance}`);
        }
      }

      // Validate admin balance
      const adminBalance = await storageService.getItem<string>('wallet_admin', '0');
      const adminBalanceNum = parseFloat(adminBalance);
      if (isNaN(adminBalanceNum)) {
        errors.push(`Invalid admin balance: ${adminBalance}`);
      }

      // Validate orders
      const orders = await storageService.getItem<Order[]>('wallet_orders', []);
      if (!Array.isArray(orders)) {
        errors.push('Orders is not an array');
      } else {
        orders.forEach((order, index) => {
          if (!order.id) errors.push(`Order at index ${index} missing ID`);
          if (!order.buyer) errors.push(`Order ${order.id} missing buyer`);
          if (!order.seller) errors.push(`Order ${order.id} missing seller`);
          if (typeof order.price !== 'number') errors.push(`Order ${order.id} has invalid price`);
          if (order.markedUpPrice && order.markedUpPrice < order.price) {
            warnings.push(`Order ${order.id} has marked up price less than original price`);
          }
        });
      }

      // Validate admin actions
      const adminActions = await storageService.getItem<any[]>('wallet_adminActions', []);
      if (!Array.isArray(adminActions)) {
        errors.push('Admin actions is not an array');
      } else {
        // Check for subscription revenue actions
        const subscriptionActions = adminActions.filter(a => 
          a.type === 'credit' && 
          a.reason && 
          a.reason.toLowerCase().includes('subscription')
        );
        
        if (subscriptionActions.length === 0) {
          suggestions.push('No subscription revenue found - verify subscription tracking is working');
        }
      }

      // Validate deposit logs
      const depositLogs = await storageService.getItem<DepositLog[]>('wallet_depositLogs', []);
      if (!Array.isArray(depositLogs)) {
        errors.push('Deposit logs is not an array');
      } else {
        const totalDeposits = depositLogs
          .filter(d => d.status === 'completed')
          .reduce((sum, d) => sum + (d.amount || 0), 0);
        
        if (depositLogs.length > 0 && totalDeposits === 0) {
          warnings.push('Deposit logs exist but total is 0 - check deposit amounts');
        }
      }

      // Cross-validate data consistency
      const crossValidationResult = await this.crossValidateData(
        buyerBalances,
        sellerBalances,
        adminBalanceNum,
        orders,
        adminActions
      );
      
      errors.push(...crossValidationResult.errors);
      warnings.push(...crossValidationResult.warnings);
      suggestions.push(...crossValidationResult.suggestions);

    } catch (error) {
      errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  /**
   * Cross-validate data relationships
   */
  private static async crossValidateData(
    buyerBalances: Record<string, number>,
    sellerBalances: Record<string, number>,
    adminBalance: number,
    orders: Order[],
    adminActions: any[]
  ): Promise<{ errors: string[]; warnings: string[]; suggestions: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Calculate expected platform profit from orders
    const expectedPlatformProfit = orders.reduce((sum, order) => {
      const platformFee = order.price * 0.2; // 20% platform fee
      return sum + platformFee;
    }, 0);

    // Calculate actual platform credits from admin actions
    const platformCredits = adminActions
      .filter(a => a.type === 'credit' && a.targetUser === 'admin')
      .reduce((sum, a) => sum + a.amount, 0);

    // Allow some tolerance for rounding
    if (Math.abs(expectedPlatformProfit - platformCredits) > 1) {
      warnings.push(
        `Platform profit mismatch: expected ${expectedPlatformProfit.toFixed(2)} from orders, ` +
        `but admin actions show ${platformCredits.toFixed(2)} in credits`
      );
    }

    // Check if any orders reference non-existent users
    orders.forEach(order => {
      if (!buyerBalances[order.buyer] && order.buyer !== 'admin') {
        warnings.push(`Order ${order.id} references unknown buyer: ${order.buyer}`);
      }
      if (!sellerBalances[order.seller] && order.seller !== 'admin') {
        warnings.push(`Order ${order.id} references unknown seller: ${order.seller}`);
      }
    });

    // Suggest optimizations
    if (Object.keys(buyerBalances).length > 100) {
      suggestions.push('Consider archiving old buyer accounts with zero balance');
    }
    
    if (orders.length > 1000) {
      suggestions.push('Consider implementing order archiving for orders older than 6 months');
    }

    return { errors, warnings, suggestions };
  }

  /**
   * Repair common data issues
   */
  static async repairWalletData(): Promise<DataRepairResult> {
    const repaired: string[] = [];
    const failed: string[] = [];

    try {
      // 1. Sync individual and collective balance formats
      const syncResult = await this.syncBalanceFormats();
      if (syncResult.success) {
        repaired.push('Balance format synchronization');
      } else {
        failed.push('Balance format synchronization');
      }

      // 2. Remove duplicate orders
      const dedupeResult = await this.removeDuplicateOrders();
      if (dedupeResult.success) {
        repaired.push(`Removed ${dedupeResult.duplicatesRemoved} duplicate orders`);
      }

      // 3. Fix negative balances
      const negativeBalanceResult = await this.fixNegativeBalances();
      if (negativeBalanceResult.success) {
        repaired.push(`Fixed ${negativeBalanceResult.fixed} negative balances`);
      }

      // 4. Normalize admin actions
      const normalizeResult = await this.normalizeAdminActions();
      if (normalizeResult.success) {
        repaired.push('Normalized admin actions');
      }

      // 5. Clean up orphaned data
      const cleanupResult = await this.cleanupOrphanedData();
      if (cleanupResult.success) {
        repaired.push(`Cleaned up ${cleanupResult.removed} orphaned entries`);
      }

    } catch (error) {
      failed.push(`Repair process error: ${error instanceof Error ? error.message : 'Unknown'}`);
    }

    return {
      success: failed.length === 0,
      repaired,
      failed
    };
  }

  /**
   * Sync individual and collective balance formats
   */
  private static async syncBalanceFormats(): Promise<{ success: boolean }> {
    try {
      // Sync buyer balances
      const buyerBalances = await storageService.getItem<Record<string, number>>('wallet_buyers', {});
      for (const [username, balance] of Object.entries(buyerBalances)) {
        const balanceInCents = Math.round(balance * 100);
        await storageService.setItem(`wallet_buyer_${username}`, balanceInCents);
      }

      // Sync seller balances
      const sellerBalances = await storageService.getItem<Record<string, number>>('wallet_sellers', {});
      for (const [username, balance] of Object.entries(sellerBalances)) {
        const balanceInCents = Math.round(balance * 100);
        await storageService.setItem(`wallet_seller_${username}`, balanceInCents);
      }

      // Sync admin balance
      const adminBalance = await storageService.getItem<string>('wallet_admin', '0');
      const adminBalanceNum = parseFloat(adminBalance) || 0;
      const adminBalanceInCents = Math.round(adminBalanceNum * 100);
      await storageService.setItem('wallet_admin_enhanced', adminBalanceInCents);

      return { success: true };
    } catch (error) {
      console.error('Balance sync error:', error);
      return { success: false };
    }
  }

  /**
   * Remove duplicate orders
   */
  private static async removeDuplicateOrders(): Promise<{ 
    success: boolean; 
    duplicatesRemoved: number 
  }> {
    try {
      const orders = await storageService.getItem<Order[]>('wallet_orders', []);
      const uniqueOrders = new Map<string, Order>();
      
      // Keep the first occurrence of each order ID
      orders.forEach(order => {
        if (order.id && !uniqueOrders.has(order.id)) {
          uniqueOrders.set(order.id, order);
        }
      });

      const duplicatesRemoved = orders.length - uniqueOrders.size;
      
      if (duplicatesRemoved > 0) {
        await storageService.setItem('wallet_orders', Array.from(uniqueOrders.values()));
      }

      return { success: true, duplicatesRemoved };
    } catch (error) {
      console.error('Remove duplicates error:', error);
      return { success: false, duplicatesRemoved: 0 };
    }
  }

  /**
   * Fix negative balances
   */
  private static async fixNegativeBalances(): Promise<{ 
    success: boolean; 
    fixed: number 
  }> {
    try {
      let fixed = 0;

      // Fix buyer balances
      const buyerBalances = await storageService.getItem<Record<string, number>>('wallet_buyers', {});
      const fixedBuyers = { ...buyerBalances };
      
      for (const [username, balance] of Object.entries(buyerBalances)) {
        if (balance < 0) {
          fixedBuyers[username] = 0;
          fixed++;
        }
      }
      
      if (fixed > 0) {
        await storageService.setItem('wallet_buyers', fixedBuyers);
      }

      // Fix seller balances
      const sellerBalances = await storageService.getItem<Record<string, number>>('wallet_sellers', {});
      const fixedSellers = { ...sellerBalances };
      
      for (const [username, balance] of Object.entries(sellerBalances)) {
        if (balance < 0) {
          fixedSellers[username] = 0;
          fixed++;
        }
      }
      
      if (Object.keys(fixedSellers).length !== Object.keys(sellerBalances).length) {
        await storageService.setItem('wallet_sellers', fixedSellers);
      }

      return { success: true, fixed };
    } catch (error) {
      console.error('Fix negative balances error:', error);
      return { success: false, fixed: 0 };
    }
  }

  /**
   * Normalize admin actions
   */
  private static async normalizeAdminActions(): Promise<{ success: boolean }> {
    try {
      const adminActions = await storageService.getItem<any[]>('wallet_adminActions', []);
      
      const normalized = adminActions.map(action => ({
        ...action,
        targetUser: action.targetUser || action.username,
        username: action.username || action.targetUser,
        id: action.id || `admin_action_${Date.now()}_${Math.random()}`,
        date: action.date || new Date().toISOString()
      }));

      await storageService.setItem('wallet_adminActions', normalized);
      return { success: true };
    } catch (error) {
      console.error('Normalize admin actions error:', error);
      return { success: false };
    }
  }

  /**
   * Clean up orphaned data
   */
  private static async cleanupOrphanedData(): Promise<{ 
    success: boolean; 
    removed: number 
  }> {
    try {
      let removed = 0;

      // Remove balance entries for users with 0 balance and no recent activity
      const buyerBalances = await storageService.getItem<Record<string, number>>('wallet_buyers', {});
      const orders = await storageService.getItem<Order[]>('wallet_orders', []);
      
      // Get users with recent activity (last 90 days)
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 90);
      
      const activeUsers = new Set<string>();
      orders.forEach(order => {
        if (new Date(order.date) > recentDate) {
          activeUsers.add(order.buyer);
          activeUsers.add(order.seller);
        }
      });

      // Clean up inactive buyers with zero balance
      const cleanedBuyers = { ...buyerBalances };
      for (const [username, balance] of Object.entries(buyerBalances)) {
        if (balance === 0 && !activeUsers.has(username)) {
          delete cleanedBuyers[username];
          removed++;
        }
      }

      if (removed > 0) {
        await storageService.setItem('wallet_buyers', cleanedBuyers);
      }

      return { success: true, removed };
    } catch (error) {
      console.error('Cleanup error:', error);
      return { success: false, removed: 0 };
    }
  }

  /**
   * Export wallet data for backup
   */
  static async exportWalletData(): Promise<string> {
    const data = await storageService.exportWalletData();
    return JSON.stringify(data, null, 2);
  }

  /**
   * Import wallet data from backup
   */
  static async importWalletData(jsonData: string): Promise<{ 
    success: boolean; 
    error?: string 
  }> {
    try {
      const data = JSON.parse(jsonData);
      const success = await storageService.importWalletData(data);
      return { success };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Invalid JSON data' 
      };
    }
  }
}
