// src/services/wallet.mock.ts

import { Transaction, TransactionId } from './wallet.service.enhanced';
import { Money, UserId, ISOTimestamp } from '@/types/common';
import { v4 as uuidv4 } from 'uuid';

/**
 * Mock data generators for testing wallet functionality
 */
export class WalletMockData {
  /**
   * Generate mock transactions for testing
   */
  static generateMockTransactions(count: number = 50): Transaction[] {
    const transactions: Transaction[] = [];
    const users = ['alice', 'bob', 'charlie', 'diana', 'evan'];
    const now = Date.now();

    for (let i = 0; i < count; i++) {
      const type = this.getRandomTransactionType();
      const amount = this.getRandomAmount(type);
      const [from, to] = this.getRandomUsers(users, type);
      const daysAgo = Math.floor(Math.random() * 30);
      const createdAt = new Date(now - daysAgo * 24 * 60 * 60 * 1000);
      
      const transaction: Transaction = {
        id: TransactionId(uuidv4()),
        type,
        amount,
        from: from ? UserId(from) : undefined,
        to: to ? UserId(to) : undefined,
        fromRole: this.getRoleForTransactionType(type, 'from'),
        toRole: this.getRoleForTransactionType(type, 'to'),
        description: this.generateDescription(type, from, to),
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
        transaction.errorMessage = this.getRandomErrorMessage();
      }

      transactions.push(transaction);
    }

    return transactions.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /**
   * Generate realistic purchase scenarios
   */
  static generatePurchaseScenario(): {
    listing: any;
    buyer: string;
    seller: string;
    transactions: Transaction[];
  } {
    const buyer = 'test_buyer';
    const seller = 'test_seller';
    const listingPrice = Money.fromDollars(50);
    const markedUpPrice = Money.fromDollars(55); // 10% markup
    const platformFee = Money.fromDollars(5);
    const sellerAmount = Money.fromDollars(45);

    const listing = {
      id: uuidv4(),
      title: 'Test Listing',
      description: 'Test description',
      price: Money.toDollars(listingPrice),
      markedUpPrice: Money.toDollars(markedUpPrice),
      seller,
    };

    const transactions: Transaction[] = [
      {
        id: TransactionId(uuidv4()),
        type: 'purchase',
        amount: markedUpPrice,
        from: UserId(buyer),
        to: UserId(seller),
        fromRole: 'buyer',
        toRole: 'seller',
        description: `Purchase: ${listing.title}`,
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
        from: UserId(buyer),
        to: UserId('admin'),
        fromRole: 'buyer',
        toRole: 'admin',
        description: `Platform fee for ${listing.title}`,
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
   * Generate subscription scenario
   */
  static generateSubscriptionScenario(): {
    subscriber: string;
    creator: string;
    amount: Money;
    transactions: Transaction[];
  } {
    const subscriber = 'subscriber_user';
    const creator = 'creator_user';
    const subscriptionAmount = Money.fromDollars(10);
    const platformFee = Money.fromDollars(2.5); // 25%
    const creatorAmount = Money.fromDollars(7.5);

    const transactions: Transaction[] = [
      {
        id: TransactionId(uuidv4()),
        type: 'subscription',
        amount: subscriptionAmount,
        from: UserId(subscriber),
        to: UserId(creator),
        fromRole: 'buyer',
        toRole: 'seller',
        description: `Monthly subscription to ${creator}`,
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
        description: `Subscription fee for ${creator}`,
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
   * Generate withdrawal scenario
   */
  static generateWithdrawalScenario(): {
    user: string;
    amount: Money;
    transaction: Transaction;
  } {
    const user = 'seller_user';
    const amount = Money.fromDollars(100);

    const transaction: Transaction = {
      id: TransactionId(uuidv4()),
      type: 'withdrawal',
      amount,
      from: UserId(user),
      fromRole: 'seller',
      description: 'Withdrawal request',
      status: 'pending',
      createdAt: new Date().toISOString() as ISOTimestamp,
      metadata: {
        paymentMethod: 'bank_transfer',
        bankAccount: {
          accountNumber: '****1234',
          routingNumber: '123456789',
          accountHolderName: 'Test User',
          country: 'US',
        },
      },
    };

    return { user, amount, transaction };
  }

  /**
   * Generate suspicious activity pattern
   */
  static generateSuspiciousActivity(): Transaction[] {
    const user = 'suspicious_user';
    const accomplice = 'accomplice_user';
    const amount = Money.fromDollars(1000);
    const now = Date.now();

    // Round-trip transactions
    return [
      {
        id: TransactionId(uuidv4()),
        type: 'purchase',
        amount,
        from: UserId(user),
        to: UserId(accomplice),
        fromRole: 'buyer',
        toRole: 'seller',
        description: 'Suspicious purchase',
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
        description: 'Return payment',
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
    const amount = min + Math.random() * (max - min);
    return Money.fromDollars(Math.round(amount * 100) / 100);
  }

  private static getRandomUsers(users: string[], type: Transaction['type']): [string?, string?] {
    const user1 = users[Math.floor(Math.random() * users.length)];
    let user2 = users[Math.floor(Math.random() * users.length)];
    
    // Ensure different users
    while (user2 === user1) {
      user2 = users[Math.floor(Math.random() * users.length)];
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

    return roleMap[type]?.[direction] as any;
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
      deposit: 'Wallet deposit',
      withdrawal: 'Withdrawal request',
      purchase: 'Purchase: Premium Content',
      sale: 'Sale: Premium Content',
      tip: `Tip from ${from || 'user'}`,
      subscription: `Subscription to ${to || 'creator'}`,
      admin_credit: 'Admin credit adjustment',
      admin_debit: 'Admin debit adjustment',
      refund: 'Purchase refund',
      fee: 'Platform fee',
      tier_credit: 'Tier bonus credit',
    };

    return descriptions[type] || 'Transaction';
  }

  private static generateMetadata(type: Transaction['type']): any {
    switch (type) {
      case 'purchase':
      case 'sale':
        return {
          listingId: uuidv4(),
          platformFee: Money.fromDollars(Math.random() * 20),
        };
      
      case 'subscription':
        return {
          subscriptionId: `sub_${uuidv4()}`,
          platformFee: Money.fromDollars(Math.random() * 5),
        };
      
      case 'withdrawal':
        return {
          paymentMethod: 'bank_transfer',
          bankAccount: {
            accountNumber: `****${Math.floor(Math.random() * 9999)}`,
            routingNumber: '123456789',
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
      'Insufficient balance',
      'Payment method declined',
      'Transaction timeout',
      'Invalid account details',
      'Daily limit exceeded',
      'Account verification required',
    ];
    return errors[Math.floor(Math.random() * errors.length)];
  }
}

/**
 * Testing utilities for wallet service
 */
export class WalletTestUtils {
  /**
   * Create test wallet balances
   */
  static async setupTestBalances(): Promise<void> {
    const testUsers = [
      { username: 'test_buyer', role: 'buyer' as const, balance: 1000 },
      { username: 'test_seller', role: 'seller' as const, balance: 500 },
      { username: 'rich_buyer', role: 'buyer' as const, balance: 10000 },
      { username: 'poor_buyer', role: 'buyer' as const, balance: 10 },
    ];

    for (const user of testUsers) {
      const key = user.username === 'admin' 
        ? 'wallet_admin' 
        : `wallet_${user.role}_${user.username}`;
      
      await localStorage.setItem(key, (user.balance * 100).toString());
    }
  }

  /**
   * Clear all wallet data
   */
  static async clearWalletData(): Promise<void> {
    const keysToRemove = [
      'wallet_transactions',
      'wallet_idempotency_cache',
      'wallet_admin',
    ];

    // Find all wallet-related keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('wallet_') || keysToRemove.includes(key))) {
        localStorage.removeItem(key);
      }
    }
  }

  /**
   * Verify transaction integrity
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

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Generate test report
   */
  static generateTestReport(transactions: Transaction[]): string {
    const report: string[] = ['=== Wallet Test Report ==='];
    
    // Transaction summary
    const summary = transactions.reduce((acc, t) => {
      acc[t.type] = (acc[t.type] || 0) + 1;
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    report.push('\nTransaction Summary:');
    Object.entries(summary).forEach(([key, count]) => {
      report.push(`  ${key}: ${count}`);
    });

    // Financial summary
    const totalVolume = transactions
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);

    report.push(`\nTotal Volume: ${Money.format(totalVolume as Money)}`);
    report.push(`Average Transaction: ${Money.format((totalVolume / transactions.length) as Money)}`);

    // Validation results
    report.push('\nValidation Results:');
    let validCount = 0;
    transactions.forEach(t => {
      const validation = this.verifyTransactionIntegrity(t);
      if (validation.valid) {
        validCount++;
      } else {
        report.push(`  Transaction ${t.id}: ${validation.errors.join(', ')}`);
      }
    });
    report.push(`  Valid: ${validCount}/${transactions.length}`);

    return report.join('\n');
  }
}
