// src/utils/walletRecovery.ts

/**
 * Wallet Data Recovery Utility
 * Fixes corruption and provides data management tools
 */

type HealthStatus = 'ok' | 'corrupted' | 'missing';

interface HealthReport {
  adminBalance: { status: HealthStatus; value?: number };
  buyerData: { status: HealthStatus; count?: number };
  sellerData: { status: HealthStatus; count?: number };
  depositLogs: { status: HealthStatus; count?: number };
  orderHistory: { status: HealthStatus; count?: number };
}

export class WalletRecovery {
  /**
   * Check for data corruption issues
   */
  static checkDataHealth(): HealthReport {
    const report: HealthReport = {
      adminBalance: { status: 'missing' },
      buyerData: { status: 'missing' },
      sellerData: { status: 'missing' },
      depositLogs: { status: 'missing' },
      orderHistory: { status: 'missing' },
    };

    // Check admin balance
    const adminBalance = localStorage.getItem('wallet_admin');
    if (adminBalance) {
      const parsed = parseFloat(adminBalance);
      if (isNaN(parsed) || parsed < 0 || parsed > 50000) {
        report.adminBalance = { status: 'corrupted', value: parsed };
      } else {
        report.adminBalance = { status: 'ok', value: parsed };
      }
    }

    // Check buyer data
    const buyerData = localStorage.getItem('wallet_buyers');
    if (buyerData) {
      try {
        const parsed = JSON.parse(buyerData);
        const count = Object.keys(parsed).length;
        let corrupted = false;
        
        for (const [, balance] of Object.entries(parsed)) {
          if (isNaN(balance as number) || (balance as number) < 0) {
            corrupted = true;
            break;
          }
        }
        
        report.buyerData = { 
          status: corrupted ? 'corrupted' : 'ok', 
          count 
        };
      } catch {
        report.buyerData = { status: 'corrupted' };
      }
    }

    // Check seller data
    const sellerData = localStorage.getItem('wallet_sellers');
    if (sellerData) {
      try {
        const parsed = JSON.parse(sellerData);
        const count = Object.keys(parsed).length;
        let corrupted = false;
        
        for (const [, balance] of Object.entries(parsed)) {
          if (isNaN(balance as number) || (balance as number) < 0) {
            corrupted = true;
            break;
          }
        }
        
        report.sellerData = { 
          status: corrupted ? 'corrupted' : 'ok', 
          count 
        };
      } catch {
        report.sellerData = { status: 'corrupted' };
      }
    }

    // Check deposit logs
    try {
      const depositLogs = localStorage.getItem('wallet_depositLogs');
      if (depositLogs) {
        const parsed = JSON.parse(depositLogs);
        report.depositLogs = { status: 'ok', count: parsed.length };
      }
    } catch {
      report.depositLogs = { status: 'corrupted' };
    }

    // Check order history
    try {
      const orderHistory = localStorage.getItem('wallet_orders');
      if (orderHistory) {
        const parsed = JSON.parse(orderHistory);
        report.orderHistory = { status: 'ok', count: parsed.length };
      }
    } catch {
      report.orderHistory = { status: 'corrupted' };
    }

    return report;
  }

  /**
   * Reset admin balance to 0 (use when corrupted)
   */
  static resetAdminBalance(): void {
    localStorage.setItem('wallet_admin', '0');
    localStorage.removeItem('wallet_admin_enhanced');
    console.log('✅ Admin balance reset to $0');
  }

  /**
   * Fix corrupted user balances
   */
  static fixCorruptedBalances(): {
    buyersFixed: number;
    sellersFixed: number;
  } {
    let buyersFixed = 0;
    let sellersFixed = 0;

    // Fix buyers
    const buyerData = localStorage.getItem('wallet_buyers');
    if (buyerData) {
      try {
        const parsed = JSON.parse(buyerData);
        const fixed: { [key: string]: number } = {};
        
        for (const [username, balance] of Object.entries(parsed)) {
          if (typeof balance === 'number' && !isNaN(balance) && balance >= 0) {
            fixed[username] = balance;
          } else {
            buyersFixed++;
            console.log(`✅ Fixed corrupted buyer balance for ${username}:`, balance, '→ 0');
          }
        }
        
        localStorage.setItem('wallet_buyers', JSON.stringify(fixed));
      } catch (error) {
        console.error('❌ Could not fix buyer data:', error);
      }
    }

    // Fix sellers
    const sellerData = localStorage.getItem('wallet_sellers');
    if (sellerData) {
      try {
        const parsed = JSON.parse(sellerData);
        const fixed: { [key: string]: number } = {};
        
        for (const [username, balance] of Object.entries(parsed)) {
          if (typeof balance === 'number' && !isNaN(balance) && balance >= 0) {
            fixed[username] = balance;
          } else {
            sellersFixed++;
            console.log(`✅ Fixed corrupted seller balance for ${username}:`, balance, '→ 0');
          }
        }
        
        localStorage.setItem('wallet_sellers', JSON.stringify(fixed));
      } catch (error) {
        console.error('❌ Could not fix seller data:', error);
      }
    }

    return { buyersFixed, sellersFixed };
  }

  /**
   * Clean up all corrupted data
   */
  static cleanupCorrupted(): void {
    const health = this.checkDataHealth();
    
    if (health.adminBalance.status === 'corrupted') {
      this.resetAdminBalance();
    }
    
    if (health.buyerData.status === 'corrupted' || health.sellerData.status === 'corrupted') {
      this.fixCorruptedBalances();
    }
    
    // Clean up corrupted individual keys
    const keysToCheck = Object.keys(localStorage);
    let cleanedKeys = 0;
    
    for (const key of keysToCheck) {
      if (key.startsWith('wallet_buyer_') || key.startsWith('wallet_seller_')) {
        try {
          const value = localStorage.getItem(key);
          if (value && (isNaN(parseInt(value)) || parseInt(value) < 0)) {
            localStorage.removeItem(key);
            cleanedKeys++;
          }
        } catch {
          localStorage.removeItem(key);
          cleanedKeys++;
        }
      }
    }
    
    if (cleanedKeys > 0) {
      console.log(`✅ Cleaned up ${cleanedKeys} corrupted individual keys`);
    }
  }

  /**
   * Emergency reset - use only if all else fails
   */
  static emergencyReset(confirm: string): void {
    if (confirm !== 'RESET_ALL_WALLET_DATA') {
      throw new Error('Must confirm with exact string: RESET_ALL_WALLET_DATA');
    }

    // Remove all wallet-related localStorage keys
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('wallet_')) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    console.log('🚨 Emergency reset completed - all wallet data cleared');
  }

  /**
   * Create backup of current wallet data
   */
  static createBackup(): string {
    const backup = {
      timestamp: new Date().toISOString(),
      data: {} as { [key: string]: any }
    };

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('wallet_')) {
        backup.data[key] = localStorage.getItem(key);
      }
    }

    const backupString = JSON.stringify(backup, null, 2);
    console.log('✅ Wallet backup created:', backup.timestamp);
    return backupString;
  }

  /**
   * Restore from backup
   */
  static restoreFromBackup(backupString: string): void {
    try {
      const backup = JSON.parse(backupString);
      
      if (!backup.data || typeof backup.data !== 'object') {
        throw new Error('Invalid backup format');
      }

      // Clear existing wallet data
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('wallet_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));

      // Restore data
      for (const [key, value] of Object.entries(backup.data)) {
        if (typeof value === 'string') {
          localStorage.setItem(key, value);
        }
      }

      console.log('✅ Wallet data restored from backup dated:', backup.timestamp);
    } catch (error) {
      console.error('❌ Failed to restore backup:', error);
      throw error;
    }
  }

  /**
   * Set specific admin balance (for testing)
   */
  static setAdminBalance(amount: number): void {
    if (amount < 0 || amount > 50000) {
      throw new Error('Invalid admin balance amount');
    }
    
    localStorage.setItem('wallet_admin', amount.toString());
    console.log(`✅ Admin balance set to $${amount}`);
  }

  /**
   * Validate all wallet data integrity
   */
  static validateIntegrity(): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    const health = this.checkDataHealth();
    
    if (health.adminBalance.status === 'corrupted') {
      errors.push(`Admin balance corrupted: ${health.adminBalance.value}`);
    }
    
    if (health.buyerData.status === 'corrupted') {
      errors.push('Buyer data corrupted');
    }
    
    if (health.sellerData.status === 'corrupted') {
      errors.push('Seller data corrupted');
    }
    
    if (health.adminBalance.value && health.adminBalance.value > 10000) {
      warnings.push(`Admin balance unusually high: $${health.adminBalance.value}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

// Make it available globally for console access
if (typeof window !== 'undefined') {
  (window as any).WalletRecovery = WalletRecovery;
}
