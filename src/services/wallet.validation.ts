// src/services/wallet.validation.ts

import { Money, UserId } from '@/types/common';
import { Transaction, TransactionMetadata } from './wallet.service.enhanced';

/**
 * Financial validation rules and utilities
 */
export class WalletValidation {
  // Financial limits
  static readonly LIMITS = {
    MIN_TRANSACTION: Money.fromDollars(0.01),
    MAX_TRANSACTION: Money.fromDollars(50000),
    MIN_DEPOSIT: Money.fromDollars(1),
    MAX_DEPOSIT: Money.fromDollars(10000),
    MIN_WITHDRAWAL: Money.fromDollars(10),
    MAX_WITHDRAWAL: Money.fromDollars(5000),
    MIN_TIP: Money.fromDollars(1),
    MAX_TIP: Money.fromDollars(500),
    DAILY_DEPOSIT_LIMIT: Money.fromDollars(50000),
    DAILY_WITHDRAWAL_LIMIT: Money.fromDollars(10000),
  } as const;

  // Fee structure
  static readonly FEES = {
    PLATFORM_PERCENT: 0.10, // 10%
    SUBSCRIPTION_PERCENT: 0.25, // 25%
    WITHDRAWAL_FLAT: Money.fromDollars(0), // No flat fee for now
    INTERNATIONAL_PERCENT: 0.03, // 3% for international
    RUSH_WITHDRAWAL_PERCENT: 0.05, // 5% for rush withdrawals
  } as const;

  /**
   * Validate money amount
   */
  static validateAmount(
    amount: Money,
    min: Money = this.LIMITS.MIN_TRANSACTION,
    max: Money = this.LIMITS.MAX_TRANSACTION
  ): { valid: boolean; error?: string } {
    if (amount < min) {
      return {
        valid: false,
        error: `Amount must be at least ${Money.format(min)}`,
      };
    }

    if (amount > max) {
      return {
        valid: false,
        error: `Amount cannot exceed ${Money.format(max)}`,
      };
    }

    // Check for integer cents
    if (!Number.isInteger(amount)) {
      return {
        valid: false,
        error: 'Invalid money amount',
      };
    }

    return { valid: true };
  }

  /**
   * Calculate platform fee
   */
  static calculatePlatformFee(
    amount: Money,
    feePercent: number = this.FEES.PLATFORM_PERCENT
  ): {
    fee: Money;
    netAmount: Money;
    grossAmount: Money;
  } {
    const fee = Math.floor(amount * feePercent) as Money;
    const netAmount = (amount - fee) as Money;

    return {
      fee,
      netAmount,
      grossAmount: amount,
    };
  }

  /**
   * Calculate tier credit bonus
   */
  static calculateTierCredit(
    amount: Money,
    tierPercent: number
  ): Money {
    return Math.floor(amount * tierPercent) as Money;
  }

  /**
   * Validate withdrawal limits
   */
  static async validateWithdrawalLimits(
    userId: UserId,
    amount: Money,
    transactions: Transaction[]
  ): Promise<{ valid: boolean; error?: string; remainingLimit?: Money }> {
    // Get today's withdrawals
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaysWithdrawals = transactions.filter(t => {
      const tDate = new Date(t.createdAt);
      return (
        t.type === 'withdrawal' &&
        t.from === userId &&
        t.status === 'completed' &&
        tDate >= today
      );
    });

    const totalWithdrawnToday = todaysWithdrawals.reduce(
      (sum, t) => sum + t.amount,
      0
    ) as Money;

    const remainingLimit = (this.LIMITS.DAILY_WITHDRAWAL_LIMIT - totalWithdrawnToday) as Money;

    if (amount > remainingLimit) {
      return {
        valid: false,
        error: `Daily withdrawal limit exceeded. Remaining: ${Money.format(remainingLimit)}`,
        remainingLimit,
      };
    }

    return { valid: true, remainingLimit };
  }

  /**
   * Validate deposit limits
   */
  static async validateDepositLimits(
    userId: UserId,
    amount: Money,
    transactions: Transaction[]
  ): Promise<{ valid: boolean; error?: string; remainingLimit?: Money }> {
    // Get today's deposits
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaysDeposits = transactions.filter(t => {
      const tDate = new Date(t.createdAt);
      return (
        t.type === 'deposit' &&
        t.to === userId &&
        t.status === 'completed' &&
        tDate >= today
      );
    });

    const totalDepositedToday = todaysDeposits.reduce(
      (sum, t) => sum + t.amount,
      0
    ) as Money;

    const remainingLimit = (this.LIMITS.DAILY_DEPOSIT_LIMIT - totalDepositedToday) as Money;

    if (amount > remainingLimit) {
      return {
        valid: false,
        error: `Daily deposit limit exceeded. Remaining: ${Money.format(remainingLimit)}`,
        remainingLimit,
      };
    }

    return { valid: true, remainingLimit };
  }

  /**
   * Check for suspicious activity
   */
  static detectSuspiciousActivity(
    userId: UserId,
    transactions: Transaction[]
  ): {
    suspicious: boolean;
    reasons: string[];
    riskScore: number;
  } {
    const reasons: string[] = [];
    let riskScore = 0;

    // Get user's recent transactions
    const userTransactions = transactions.filter(
      t => (t.from === userId || t.to === userId) && t.status === 'completed'
    );

    // Check for rapid transactions
    const recentTransactions = userTransactions.filter(t => {
      const age = Date.now() - new Date(t.createdAt).getTime();
      return age < 3600000; // Last hour
    });

    if (recentTransactions.length > 10) {
      reasons.push('High transaction frequency');
      riskScore += 30;
    }

    // Check for large transactions
    const largeTransactions = userTransactions.filter(
      t => t.amount > Money.fromDollars(1000)
    );

    if (largeTransactions.length > 5) {
      reasons.push('Multiple large transactions');
      riskScore += 25;
    }

    // Check for failed transactions
    const failedTransactions = transactions.filter(
      t => (t.from === userId || t.to === userId) && t.status === 'failed'
    );

    const failureRate = failedTransactions.length / Math.max(userTransactions.length, 1);
    if (failureRate > 0.3) {
      reasons.push('High failure rate');
      riskScore += 20;
    }

    // Check for round-trip transactions
    const roundTrips = this.detectRoundTrips(userId, transactions);
    if (roundTrips.length > 0) {
      reasons.push('Potential money cycling detected');
      riskScore += 40;
    }

    return {
      suspicious: riskScore >= 50,
      reasons,
      riskScore,
    };
  }

  /**
   * Detect round-trip transactions (potential money laundering)
   */
  private static detectRoundTrips(
    userId: UserId,
    transactions: Transaction[]
  ): Transaction[] {
    const roundTrips: Transaction[] = [];
    const outgoing = transactions.filter(t => t.from === userId && t.status === 'completed');
    const incoming = transactions.filter(t => t.to === userId && t.status === 'completed');

    for (const out of outgoing) {
      const matchingReturn = incoming.find(inc => {
        const timeDiff = Math.abs(
          new Date(inc.createdAt).getTime() - new Date(out.createdAt).getTime()
        );
        return (
          inc.from === out.to &&
          Math.abs(inc.amount - out.amount) < Money.fromDollars(10) &&
          timeDiff < 86400000 // 24 hours
        );
      });

      if (matchingReturn) {
        roundTrips.push(out, matchingReturn);
      }
    }

    return roundTrips;
  }

  /**
   * Validate bank account details
   */
  static validateBankAccount(accountDetails: any): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!accountDetails) {
      errors.push('Bank account details required');
      return { valid: false, errors };
    }

    // Basic validation (expand based on requirements)
    if (!accountDetails.accountNumber) {
      errors.push('Account number required');
    }

    if (!accountDetails.routingNumber) {
      errors.push('Routing number required');
    }

    if (!accountDetails.accountHolderName) {
      errors.push('Account holder name required');
    }

    // Validate routing number format (US)
    if (accountDetails.routingNumber && !/^\d{9}$/.test(accountDetails.routingNumber)) {
      errors.push('Invalid routing number format');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Calculate transaction fees
   */
  static calculateTransactionFees(
    amount: Money,
    type: Transaction['type'],
    metadata?: TransactionMetadata
  ): {
    baseFee: Money;
    additionalFees: Money;
    totalFee: Money;
    netAmount: Money;
  } {
    let baseFee = 0 as Money;
    let additionalFees = 0 as Money;

    switch (type) {
      case 'purchase':
      case 'sale':
        baseFee = Math.floor(amount * this.FEES.PLATFORM_PERCENT) as Money;
        break;

      case 'subscription':
        baseFee = Math.floor(amount * this.FEES.SUBSCRIPTION_PERCENT) as Money;
        break;

      case 'withdrawal':
        baseFee = this.FEES.WITHDRAWAL_FLAT;
        // Add rush fee if applicable
        if (metadata?.paymentMethod === 'rush') {
          additionalFees = Math.floor(amount * this.FEES.RUSH_WITHDRAWAL_PERCENT) as Money;
        }
        break;

      case 'tip':
        // No fees on tips
        baseFee = 0 as Money;
        break;
    }

    // Add international fee if applicable
    if (metadata?.bankAccount?.country && metadata.bankAccount.country !== 'US') {
      additionalFees = (additionalFees + Math.floor(amount * this.FEES.INTERNATIONAL_PERCENT)) as Money;
    }

    const totalFee = (baseFee + additionalFees) as Money;
    const netAmount = (amount - totalFee) as Money;

    return {
      baseFee,
      additionalFees,
      totalFee,
      netAmount,
    };
  }

  /**
   * Format transaction for display
   */
  static formatTransactionForDisplay(transaction: Transaction): {
    displayAmount: string;
    displayType: string;
    displayStatus: string;
    displayDate: string;
    displayDescription: string;
    isCredit: boolean;
    statusColor: string;
  } {
    const isCredit = transaction.type === 'deposit' || 
                    transaction.type === 'sale' || 
                    (transaction.type === 'tip' && transaction.to);

    const typeMap: Record<Transaction['type'], string> = {
      deposit: 'Deposit',
      withdrawal: 'Withdrawal',
      purchase: 'Purchase',
      sale: 'Sale',
      tip: 'Tip',
      subscription: 'Subscription',
      admin_credit: 'Admin Credit',
      admin_debit: 'Admin Debit',
      refund: 'Refund',
      fee: 'Platform Fee',
      tier_credit: 'Tier Bonus',
    };

    const statusColorMap: Record<Transaction['status'], string> = {
      pending: 'text-yellow-500',
      completed: 'text-green-500',
      failed: 'text-red-500',
      cancelled: 'text-gray-500',
    };

    return {
      displayAmount: `${isCredit ? '+' : '-'}${Money.format(transaction.amount)}`,
      displayType: typeMap[transaction.type] || transaction.type,
      displayStatus: transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1),
      displayDate: new Date(transaction.createdAt).toLocaleString(),
      displayDescription: transaction.description,
      isCredit,
      statusColor: statusColorMap[transaction.status],
    };
  }

  /**
   * Validate refund eligibility
   */
  static validateRefundEligibility(
    originalTransaction: Transaction,
    refundAmount: Money
  ): {
    eligible: boolean;
    reason?: string;
    maxRefundable: Money;
  } {
    // Check if transaction can be refunded
    if (originalTransaction.type !== 'purchase' && originalTransaction.type !== 'sale') {
      return {
        eligible: false,
        reason: 'Only purchases can be refunded',
        maxRefundable: 0 as Money,
      };
    }

    if (originalTransaction.status !== 'completed') {
      return {
        eligible: false,
        reason: 'Only completed transactions can be refunded',
        maxRefundable: 0 as Money,
      };
    }

    if (originalTransaction.reversedBy) {
      return {
        eligible: false,
        reason: 'Transaction already refunded',
        maxRefundable: 0 as Money,
      };
    }

    // Check refund window (30 days)
    const transactionAge = Date.now() - new Date(originalTransaction.createdAt).getTime();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    
    if (transactionAge > thirtyDays) {
      return {
        eligible: false,
        reason: 'Refund window expired (30 days)',
        maxRefundable: 0 as Money,
      };
    }

    // Check refund amount
    if (refundAmount > originalTransaction.amount) {
      return {
        eligible: false,
        reason: 'Refund amount exceeds original transaction',
        maxRefundable: originalTransaction.amount,
      };
    }

    return {
      eligible: true,
      maxRefundable: originalTransaction.amount,
    };
  }
}

/**
 * Financial reconciliation utilities
 */
export class WalletReconciliation {
  /**
   * Reconcile wallet balances with transaction history
   */
  static async reconcileBalance(
    userId: UserId,
    role: 'buyer' | 'seller' | 'admin',
    transactions: Transaction[],
    currentBalance: Money
  ): Promise<{
    calculatedBalance: Money;
    discrepancy: Money;
    isReconciled: boolean;
    details: {
      credits: Money;
      debits: Money;
      pendingCredits: Money;
      pendingDebits: Money;
    };
  }> {
    let credits = 0;
    let debits = 0;
    let pendingCredits = 0;
    let pendingDebits = 0;

    for (const transaction of transactions) {
      // Credits
      if (transaction.to === userId && transaction.toRole === role) {
        if (transaction.status === 'completed') {
          credits += transaction.amount;
        } else if (transaction.status === 'pending') {
          pendingCredits += transaction.amount;
        }
      }

      // Debits
      if (transaction.from === userId && transaction.fromRole === role) {
        if (transaction.status === 'completed') {
          debits += transaction.amount;
        } else if (transaction.status === 'pending') {
          pendingDebits += transaction.amount;
        }
      }
    }

    const calculatedBalance = (credits - debits) as Money;
    const discrepancy = (currentBalance - calculatedBalance) as Money;

    return {
      calculatedBalance,
      discrepancy,
      isReconciled: discrepancy === 0,
      details: {
        credits: credits as Money,
        debits: debits as Money,
        pendingCredits: pendingCredits as Money,
        pendingDebits: pendingDebits as Money,
      },
    };
  }

  /**
   * Generate financial report
   */
  static generateFinancialReport(
    transactions: Transaction[],
    startDate: Date,
    endDate: Date
  ): {
    totalRevenue: Money;
    totalFees: Money;
    totalWithdrawals: Money;
    totalDeposits: Money;
    netIncome: Money;
    transactionCount: number;
    averageTransactionSize: Money;
    breakdown: Record<Transaction['type'], { count: number; total: Money }>;
  } {
    const filtered = transactions.filter(t => {
      const date = new Date(t.createdAt);
      return date >= startDate && date <= endDate && t.status === 'completed';
    });

    const breakdown: Record<string, { count: number; total: Money }> = {};
    let totalRevenue = 0;
    let totalFees = 0;
    let totalWithdrawals = 0;
    let totalDeposits = 0;

    for (const transaction of filtered) {
      // Update breakdown
      if (!breakdown[transaction.type]) {
        breakdown[transaction.type] = { count: 0, total: 0 as Money };
      }
      breakdown[transaction.type].count++;
      breakdown[transaction.type].total = (breakdown[transaction.type].total + transaction.amount) as Money;

      // Calculate totals
      switch (transaction.type) {
        case 'deposit':
          totalDeposits += transaction.amount;
          break;
        case 'withdrawal':
          totalWithdrawals += transaction.amount;
          break;
        case 'fee':
          totalFees += transaction.amount;
          totalRevenue += transaction.amount;
          break;
        case 'purchase':
        case 'sale':
          if (transaction.metadata?.platformFee) {
            totalFees += transaction.metadata.platformFee;
            totalRevenue += transaction.metadata.platformFee;
          }
          break;
      }
    }

    const netIncome = (totalRevenue - totalWithdrawals) as Money;
    const averageTransactionSize = filtered.length > 0
      ? Math.floor(filtered.reduce((sum, t) => sum + t.amount, 0) / filtered.length) as Money
      : 0 as Money;

    return {
      totalRevenue: totalRevenue as Money,
      totalFees: totalFees as Money,
      totalWithdrawals: totalWithdrawals as Money,
      totalDeposits: totalDeposits as Money,
      netIncome,
      transactionCount: filtered.length,
      averageTransactionSize,
      breakdown,
    };
  }
}
