// src/services/wallet.mock.ts

import { Transaction, TransactionId } from './wallet.service.enhanced';
import { Money, UserId, ISOTimestamp } from '@/types/common';
import { v4 as uuidv4 } from 'uuid';
import { storageService } from './storage.service';
import { sanitizeStrict, sanitizeNumber } from '@/utils/security/sanitization';

/**
 * Mock data generators for testing wallet functionality
 * NOTE: This should only be used in development/testing environments
 */
export class WalletMockData {
  private static readonly MAX_MOCK_TRANSACTIONS = 100;
  private static readonly MAX_MOCK_AMOUNT = 1000;
  private static readonly MOCK_USERS = ['alice', 'bob', 'charlie', 'diana', 'evan'];

  /**
   * Check if mock data generation is allowed
   */
  private static isTestEnvironment(): boolean {
    return process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development';
  }

  /**
   * Generate mock transactions for testing with validation
   */
  static generateMockTransactions(count: number = 50): Transaction[] {
    if (!this.isTestEnvironment()) {
      console.warn('Mock data generation not allowed in production');
      return [];
    }

    // Validate and limit count
    const sanitizedCount = Math.min(
      Math.max(1, Math.floor(count)), 
      this.MAX_MOCK_TRANSACTIONS
    );

    const transactions: Transaction[] = [];
    const now = Date.now();

    for (let i = 0; i < sanitizedCount; i++) {
      const type = this.getRandomTransactionType();
      const amount = this.getRandomAmount(type);
      const [from, to] = this.getRandomUsers(this.MOCK_USERS, type);
      const daysAgo = Math.floor(Math.random() * 30);
      const createdAt = new Date(now - daysAgo * 24 * 60 * 60 * 1000);
      
      const transaction: Transaction = {
        id: TransactionId(uuidv4()),
        type,
        amount,
        from: from ? UserId(sanitizeStrict(from).toLowerCase()) : undefined,
        to: to ? UserId(sanitizeStrict(to).toLowerCase()) : undefined,
        fromRole: this.getRoleForTransactionType(type, 'from'),
        toRole: this.getRoleForTransactionType(type, 'to'),
        description: sanitizeStrict(this.generateDescription(type, from, to)).substring(0, 200),
        status: this.getRandomStatus(),
        createdAt: createdAt.toISOString() as ISOTimestamp,
        metadata: this.generateMetadata(type),
      };

      // Add completion time for completed transactions
      if (transaction.status === 'completed') {
        const completedAt = new Date(createdAt.getTime() + Math.random() * 3600000);
        transaction.completedAt = completedAt.toISOString() as ISOTimestamp;
      }

      // Add failure time and reason for failed transactions
      if (transaction.status === 'failed') {
        const failedAt = new Date(createdAt.getTime() + Math.random() * 3600000);
        transaction.failedAt = failedAt.toISOString() as ISOTimestamp;
        transaction.errorMessage = sanitizeStrict(this.getRandomErrorMessage()).substring(0, 100);
      }

      transactions.push(transaction);
    }

    return transactions.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /**
   * Generate realistic purchase scenario with validation
   */
  static generatePurchaseScenario(): {
    listing: any;
    buyer: string;
    seller: string;
    transactions: Transaction[];
  } | null {
    if (!this.isTestEnvironment()) {
      console.warn('Mock data generation not allowed in production');
      return null;
    }

    const buyer = 'test_buyer';
    const seller = 'test_seller';
    const listingPrice = Money.fromDollars(sanitizeNumber(50, 0.01, this.MAX_MOCK_AMOUNT, 2));
    const markedUpPrice = Money.fromDollars(sanitizeNumber(55, 0.01, this.MAX_MOCK_AMOUNT, 2));
    const platformFee = Money.fromDollars(sanitizeNumber(5, 0, 100, 2));

    const listing = {
      id: uuidv4(),
      title: sanitizeStrict('Test Listing').substring(0, 100),
      description: sanitizeStrict('Test description').substring(0, 500),
      price: Money.toDollars(listingPrice),
      markedUpPrice: Money.toDollars(markedUpPrice),
      seller: sanitizeStrict(seller).toLowerCase(),
    };

    const transactions: Transaction[] = [
      {
        id: TransactionId(uuidv4()),
        type: 'purchase',
        amount: markedUpPrice,
        from: UserId(sanitizeStrict(buyer).toLowerCase()),
        to: UserId(sanitizeStrict(seller).toLowerCase()),
        fromRole: 'buyer',
        toRole: 'seller',
        description: sanitizeStrict(`Purchase: ${listing.title}`).substring(0, 200),
        status: 'completed',
        createdAt: new Date().toISOString() as ISOTimestamp,
        completedAt: new Date().toISOString() as ISOTimestamp,
        metadata: {
          listingId: listing.id,
          platformFee,
          originalAmount: listingPrice,
        },
        idempotencyKey: `purchase_${buyer}_${seller}_${listing.id}`,
      },
      {
        id: TransactionId(uuidv4()),
        type: 'fee',
        amount: platformFee,
        from: UserId(sanitizeStrict(buyer).toLowerCase()),
        to: UserId('admin'),
        fromRole: 'buyer',
        toRole: 'admin',
        description: sanitizeStrict(`Platform fee for ${listing.title}`).substring(0, 200),
        status: 'completed',
        createdAt: new Date().toISOString() as ISOTimestamp,
        completedAt: new Date().toISOString() as ISOTimestamp,
        metadata: {
          listingId: listing.id,
        },
      },
    ];

    return { listing, buyer, seller, transactions };
  }

  /**
   * Generate subscription scenario with validation
   */
  static generateSubscriptionScenario(): {
    subscriber: string;
    creator: string;
    amount: Money;
    transactions: Transaction[];
  } | null {
    if (!this.isTestEnvironment()) {
      console.warn('Mock data generation not allowed in production');
      return null;
    }

    const subscriber = sanitizeStrict('subscriber_user').toLowerCase();
    const creator = sanitizeStrict('creator_user').toLowerCase();
    const subscriptionAmount = Money.fromDollars(sanitizeNumber(10, 5, 100, 2));
    const platformFee = Money.fromDollars(sanitizeNumber(2.5, 0, 25, 2));

    const transactions: Transaction[] = [
      {
        id: TransactionId(uuidv4()),
        type: 'subscription',
        amount: subscriptionAmount,
        from: UserId(subscriber),
        to: UserId(creator),
        fromRole: 'buyer',
        toRole: 'seller',
        description: sanitizeStrict(`Monthly subscription to ${creator}`).substring(0, 200),
        status: 'completed',
        createdAt: new Date().toISOString() as ISOTimestamp,
        completedAt: new Date().toISOString() as ISOTimestamp,
        metadata: {
          subscriptionId: `sub_${subscriber}_${creator}`,
          platformFee,
        },
      },
      {
        id: TransactionId(uuidv4()),
        type: 'fee',
        amount: platformFee,
        from: UserId(subscriber),
        to: UserId('admin'),
        fromRole: 'buyer',
        toRole: 'admin',
        description: sanitizeStrict(`Subscription fee for ${creator}`).substring(0, 200),
        status: 'completed',
        createdAt: new Date().toISOString() as ISOTimestamp,
        completedAt: new Date().toISOString() as ISOTimestamp,
      },
    ];

    return {
      subscriber,
      creator,
      amount: subscriptionAmount,
      transactions,
    };
  }

  /**
   * Generate withdrawal scenario with validation
   */
  static generateWithdrawalScenario(): {
    user: string;
    amount: Money;
    transaction: Transaction;
  } | null {
    if (!this.isTestEnvironment()) {
      console.warn('Mock data generation not allowed in production');
      return null;
    }

    const user = sanitizeStrict('seller_user').toLowerCase();
    const amount = Money.fromDollars(sanitizeNumber(100, 10, 1000, 2));

    const transaction: Transaction = {
      id: TransactionId(uuidv4()),
      type: 'withdrawal',
      amount,
      from: UserId(user),
      fromRole: 'seller',
      description: sanitizeStrict('Withdrawal request').substring(0, 200),
      status: 'pending',
      createdAt: new Date().toISOString() as ISOTimestamp,
      metadata: {
        paymentMethod: 'bank_transfer',
        // Use generic test data instead of realistic bank details
        bankAccount: {
          accountNumber: 'TEST****1234',
          routingNumber: 'TEST123456',
          accountHolderName: 'Test User',
          country: 'TEST',
        },
      },
    };

    return { user, amount, transaction };
  }

  /**
   * Generate suspicious activity pattern for testing detection
   */
  static generateSuspiciousActivity(): Transaction[] | null {
    if (!this.isTestEnvironment()) {
      console.warn('Mock data generation not allowed in production');
      return null;
    }

    const user = sanitizeStrict('suspicious_user').toLowerCase();
    const accomplice = sanitizeStrict('accomplice_user').toLowerCase();
    const amount = Money.fromDollars(sanitizeNumber(1000, 100, this.MAX_MOCK_AMOUNT, 2));
    const now = Date.now();

    // Round-trip transactions for testing detection
    return [
      {
        id: TransactionId(uuidv4()),
        type: 'purchase',
        amount,
        from: UserId(user),
        to: UserId(accomplice),
        fromRole: 'buyer',
        toRole: 'seller',
        description: sanitizeStrict('Test suspicious purchase').substring(0, 200),
        status: 'completed',
        createdAt: new Date(now - 3600000).toISOString() as ISOTimestamp,
        completedAt: new Date(now - 3600000).toISOString() as ISOTimestamp,
      },
      {
        id: TransactionId(uuidv4()),
        type: 'tip',
        amount: amount,
        from: UserId(accomplice),
        to: UserId(user),
        fromRole: 'buyer',
        toRole: 'seller',
        description: sanitizeStrict('Test return payment').substring(0, 200),
        status: 'completed',
        createdAt: new Date(now - 1800000).toISOString() as ISOTimestamp,
        completedAt: new Date(now - 1800000).toISOString() as ISOTimestamp,
      },
    ];
  }

  // Helper methods
  private static getRandomTransactionType(): Transaction['type'] {
    const types: Transaction['type'][] = [
      'deposit', 'withdrawal', 'purchase', 'sale', 
      'tip', 'subscription', 'admin_credit', 'admin_debit'
    ];
    return types[Math.floor(Math.random() * types.length)];
  }

  private static getRandomAmount(type: Transaction['type']): Money {
    const ranges: Record<Transaction['type'], [number, number]> = {
      deposit: [10, 500],
      withdrawal: [50, 1000],
      purchase: [20, 200],
      sale: [20, 200],
      tip: [5, 50],
      subscription: [5, 25],
      admin_credit: [10, 100],
      admin_debit: [10, 100],
      refund: [10, 200],
      fee: [2, 20],
      tier_credit: [5, 50],
    };

    const [min, max] = ranges[type] || [10, 100];
    const cappedMax = Math.min(max, this.MAX_MOCK_AMOUNT);
    const amount = min + Math.random() * (cappedMax - min);
    return Money.fromDollars(sanitizeNumber(amount, min, cappedMax, 2));
  }

  private static getRandomUsers(users: string[], type: Transaction['type']): [string?, string?] {
    const sanitizedUsers = users.map(u => sanitizeStrict(u).toLowerCase());
    const user1 = sanitizedUsers[Math.floor(Math.random() * sanitizedUsers.length)];
    let user2 = sanitizedUsers[Math.floor(Math.random() * sanitizedUsers.length)];
    
    // Ensure different users
    while (user2 === user1) {
      user2 = sanitizedUsers[Math.floor(Math.random() * sanitizedUsers.length)];
    }

    switch (type) {
      case 'deposit':
        return [undefined, user1];
      case 'withdrawal':
        return [user1, undefined];
      case 'admin_credit':
        return ['admin', user1];
      case 'admin_debit':
        return [user1, 'admin'];
      default:
        return [user1, user2];
    }
  }

  private static getRoleForTransactionType(
    type: Transaction['type'], 
    direction: 'from' | 'to'
  ): 'buyer' | 'seller' | 'admin' | undefined {
    const roleMap: Record<Transaction['type'], { from?: string; to?: string }> = {
      deposit: { to: 'buyer' },
      withdrawal: { from: 'seller' },
      purchase: { from: 'buyer', to: 'seller' },
      sale: { from: 'buyer', to: 'seller' },
      tip: { from: 'buyer', to: 'seller' },
      subscription: { from: 'buyer', to: 'seller' },
      admin_credit: { from: 'admin', to: 'buyer' },
      admin_debit: { from: 'seller', to: 'admin' },
      refund: { from: 'seller', to: 'buyer' },
      fee: { from: 'buyer', to: 'admin' },
      tier_credit: { from: 'admin', to: 'seller' },
    };

    const role = roleMap[type]?.[direction];
    return role === 'buyer' || role === 'seller' || role === 'admin' ? role : undefined;
  }

  private static getRandomStatus(): Transaction['status'] {
    const rand = Math.random();
    if (rand < 0.8) return 'completed';
    if (rand < 0.9) return 'pending';
    if (rand < 0.95) return 'failed';
    return 'cancelled';
  }

  private static generateDescription(
    type: Transaction['type'],
    from?: string,
    to?: string
  ): string {
    const descriptions: Record<Transaction['type'], string> = {
      deposit: 'Test wallet deposit',
      withdrawal: 'Test withdrawal request',
      purchase: 'Test purchase: Premium Content',
      sale: 'Test sale: Premium Content',
      tip: `Test tip from ${from || 'user'}`,
      subscription: `Test subscription to ${to || 'creator'}`,
      admin_credit: 'Test admin credit adjustment',
      admin_debit: 'Test admin debit adjustment',
      refund: 'Test purchase refund',
      fee: 'Test platform fee',
      tier_credit: 'Test tier bonus credit',
    };

    return descriptions[type] || 'Test transaction';
  }

  private static generateMetadata(type: Transaction['type']): any {
    switch (type) {
      case 'purchase':
      case 'sale':
        return {
          listingId: uuidv4(),
          platformFee: Money.fromDollars(sanitizeNumber(Math.random() * 20, 0, 20, 2)),
        };
      
      case 'subscription':
        return {
          subscriptionId: `sub_test_${uuidv4().substring(0, 8)}`,
          platformFee: Money.fromDollars(sanitizeNumber(Math.random() * 5, 0, 5, 2)),
        };
      
      case 'withdrawal':
        return {
          paymentMethod: 'bank_transfer',
          // Use clearly fake test data
          bankAccount: {
            accountNumber: `TEST****${Math.floor(1000 + Math.random() * 9000)}`,
            routingNumber: 'TEST123456',
          },
        };
      
      case 'deposit':
        return {
          paymentMethod: Math.random() > 0.5 ? 'credit_card' : 'bank_transfer',
        };
      
      default:
        return {};
    }
  }

  private static getRandomErrorMessage(): string {
    const errors = [
      'Test: Insufficient balance',
      'Test: Payment method declined',
      'Test: Transaction timeout',
      'Test: Invalid account details',
      'Test: Daily limit exceeded',
      'Test: Account verification required',
    ];
    return errors[Math.floor(Math.random() * errors.length)];
  }
}

/**
 * Testing utilities for wallet service
 * NOTE: Only for use in test environments
 */
export class WalletTestUtils {
  /**
   * Check if test utilities are allowed
   */
  private static isTestEnvironment(): boolean {
    return process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development';
  }

  /**
   * Create test wallet balances using storage service
   */
  static async setupTestBalances(): Promise<void> {
    if (!this.isTestEnvironment()) {
      console.error('Test utilities not allowed in production');
      return;
    }

    const testUsers = [
      { username: 'test_buyer', role: 'buyer' as const, balance: 1000 },
      { username: 'test_seller', role: 'seller' as const, balance: 500 },
      { username: 'rich_buyer', role: 'buyer' as const, balance: 10000 },
      { username: 'poor_buyer', role: 'buyer' as const, balance: 10 },
    ];

    for (const user of testUsers) {
      const sanitizedUsername = sanitizeStrict(user.username).toLowerCase();
      const sanitizedBalance = sanitizeNumber(user.balance, 0, 100000, 2);
      
      const key = user.username === 'admin' 
        ? 'wallet_balance' 
        : `wallet_${user.role}_${sanitizedUsername}`;
      
      await storageService.setItem(key, Math.round(sanitizedBalance * 100));
    }
  }

  /**
   * Clear all wallet data using storage service
   */
  static async clearWalletData(): Promise<void> {
    if (!this.isTestEnvironment()) {
      console.error('Test utilities not allowed in production');
      return;
    }

    const keysToRemove = [
      'wallet_transactions',
      'wallet_idempotency_cache',
      'wallet_balance',
    ];

    // Get all wallet-related keys
    const allKeys = await storageService.getKeys('wallet_');
    
    // Remove all wallet keys
    for (const key of [...keysToRemove, ...allKeys]) {
      await storageService.removeItem(key);
    }
  }

  /**
   * Verify transaction integrity with sanitization
   */
  static verifyTransactionIntegrity(transaction: Transaction): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Basic validation
    if (!transaction.id) errors.push('Missing transaction ID');
    if (!transaction.type) errors.push('Missing transaction type');
    if (!transaction.amount || transaction.amount <= 0) errors.push('Invalid amount');
    if (!transaction.createdAt) errors.push('Missing created timestamp');
    if (!transaction.status) errors.push('Missing status');
    if (!transaction.description) errors.push('Missing description');

    // Validate description length
    if (transaction.description && transaction.description.length > 200) {
      errors.push('Description too long');
    }

    // Type-specific validation
    switch (transaction.type) {
      case 'deposit':
        if (!transaction.to) errors.push('Deposit missing recipient');
        if (transaction.from) errors.push('Deposit should not have sender');
        break;
      
      case 'withdrawal':
        if (!transaction.from) errors.push('Withdrawal missing sender');
        if (transaction.to) errors.push('Withdrawal should not have recipient');
        break;
      
      case 'purchase':
      case 'sale':
      case 'tip':
      case 'subscription':
        if (!transaction.from) errors.push('Transaction missing sender');
        if (!transaction.to) errors.push('Transaction missing recipient');
        if (transaction.from === transaction.to) errors.push('Sender and recipient cannot be the same');
        break;
    }

    // Status validation
    if (transaction.status === 'completed' && !transaction.completedAt) {
      errors.push('Completed transaction missing completion timestamp');
    }

    if (transaction.status === 'failed' && !transaction.errorMessage) {
      errors.push('Failed transaction missing error message');
    }

    // Validate amounts are reasonable
    const maxAmount = Money.fromDollars(100000);
    if (transaction.amount > maxAmount) {
      errors.push('Amount exceeds maximum allowed');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Generate test report with sanitized output
   */
  static generateTestReport(transactions: Transaction[]): string {
    if (!this.isTestEnvironment()) {
      return 'Test reports not available in production';
    }

    const report: string[] = ['=== Wallet Test Report (TEST ENVIRONMENT) ==='];
    
    // Limit transactions to prevent excessive output
    const limitedTransactions = transactions.slice(0, 100);
    
    // Transaction summary
    const summary = limitedTransactions.reduce((acc, t) => {
      acc[t.type] = (acc[t.type] || 0) + 1;
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    report.push('\nTransaction Summary:');
    Object.entries(summary).forEach(([key, count]) => {
      report.push(`  ${sanitizeStrict(key)}: ${count}`);
    });

    // Financial summary
    const totalVolume = limitedTransactions
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);

    const avgAmount = totalVolume / Math.max(limitedTransactions.length, 1);
    
    report.push(`\nTotal Volume: ${Money.format(totalVolume as Money)}`);
    report.push(`Average Transaction: ${Money.format(avgAmount as Money)}`);

    // Validation results
    report.push('\nValidation Results:');
    let validCount = 0;
    const validationErrors: string[] = [];
    
    limitedTransactions.forEach((t, index) => {
      const validation = this.verifyTransactionIntegrity(t);
      if (validation.valid) {
        validCount++;
      } else if (validationErrors.length < 10) {
        validationErrors.push(`  Transaction ${index}: ${validation.errors.join(', ')}`);
      }
    });
    
    report.push(...validationErrors);
    if (validationErrors.length === 10) {
      report.push('  ... and more errors');
    }
    report.push(`  Valid: ${validCount}/${limitedTransactions.length}`);

    return report.join('\n');
  }
}