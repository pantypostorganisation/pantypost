// src/services/wallet.integration.ts

import { walletService, Transaction, TransactionId } from './wallet.service.enhanced';
import { WalletValidation, WalletReconciliation } from './wallet.validation';
import { Money, UserId, ISOTimestamp } from '@/types/common';
import { Order } from '@/context/WalletContext.enhanced';
import { Listing } from '@/context/ListingContext';
import { v4 as uuidv4 } from 'uuid';

/**
 * Integration layer between WalletContext and the enhanced wallet service
 * Provides backward compatibility while leveraging new features
 */
export class WalletIntegration {
  /**
   * Convert legacy order to purchase transaction
   */
  static async createPurchaseTransaction(
    listing: Listing,
    buyer: string,
    seller: string,
    tierCreditAmount?: number
  ): Promise<{ success: boolean; transaction?: Transaction; order?: Order }> {
    try {
      const buyerId = UserId(buyer);
      const sellerId = UserId(seller);
      
      // Calculate amounts
      const listingPrice = Money.fromDollars(listing.price);
      const markedUpPrice = listing.markedUpPrice 
        ? Money.fromDollars(listing.markedUpPrice)
        : Money.fromDollars(listing.price * 1.1); // 10% markup default
      
      // Validate purchase
      const buyerBalance = await walletService.getBalance(buyerId, 'buyer');
      if (!buyerBalance.success || !buyerBalance.data) {
        return { success: false };
      }

      if (markedUpPrice > buyerBalance.data.availableBalance) {
        return { success: false };
      }

      // Create idempotency key
      const idempotencyKey = `purchase_${buyer}_${seller}_${listing.id}_${Date.now()}`;

      // Process transfer
      const transferResult = await walletService.transfer({
        from: buyerId,
        to: sellerId,
        amount: markedUpPrice,
        type: 'purchase',
        description: `Purchase: ${listing.title}`,
        metadata: {
          listingId: listing.id,
          tierCreditAmount: tierCreditAmount ? Money.fromDollars(tierCreditAmount) : undefined,
          originalAmount: listingPrice,
        },
        idempotencyKey,
        platformFeePercent: 0.10, // 10% platform fee
      });

      if (!transferResult.success || !transferResult.data) {
        return { success: false };
      }

      // Create order for backward compatibility
      const order: Order = {
        id: uuidv4(),
        title: listing.title,
        description: listing.description,
        price: listing.price,
        markedUpPrice: Money.toDollars(markedUpPrice),
        imageUrl: listing.imageUrls?.[0],
        date: new Date().toISOString(),
        seller,
        buyer,
        tags: listing.tags,
        wasAuction: listing.auction?.isAuction,
        finalBid: listing.auction?.highestBid,
        shippingStatus: 'pending',
        tierCreditAmount,
      };

      // Handle tier credit if applicable
      if (tierCreditAmount && tierCreditAmount > 0) {
        const tierCreditMoney = Money.fromDollars(tierCreditAmount);
        await walletService.transfer({
          from: UserId('admin'),
          to: sellerId,
          amount: tierCreditMoney,
          type: 'tier_credit',
          description: `Tier bonus for ${listing.title}`,
          metadata: {
            orderId: order.id,
            listingId: listing.id,
          },
          idempotencyKey: `${idempotencyKey}_tier_credit`,
        });
      }

      return {
        success: true,
        transaction: transferResult.data[0],
        order,
      };
    } catch (error) {
      console.error('Purchase transaction error:', error);
      return { success: false };
    }
  }

  /**
   * Process subscription payment
   */
  static async processSubscription(
    buyer: string,
    seller: string,
    amount: number
  ): Promise<boolean> {
    try {
      const buyerId = UserId(buyer);
      const sellerId = UserId(seller);
      const subscriptionAmount = Money.fromDollars(amount);

      // Validate amount
      const validation = WalletValidation.validateAmount(
        subscriptionAmount,
        Money.fromDollars(5), // Min $5 subscription
        Money.fromDollars(100) // Max $100 subscription
      );

      if (!validation.valid) {
        console.error('Invalid subscription amount:', validation.error);
        return false;
      }

      // Process subscription
      const result = await walletService.transfer({
        from: buyerId,
        to: sellerId,
        amount: subscriptionAmount,
        type: 'subscription',
        description: `Monthly subscription to ${seller}`,
        metadata: {
          subscriptionId: `sub_${buyer}_${seller}_${Date.now()}`,
        },
        idempotencyKey: `subscription_${buyer}_${seller}_${Date.now()}`,
        platformFeePercent: WalletValidation.FEES.SUBSCRIPTION_PERCENT,
      });

      return result.success;
    } catch (error) {
      console.error('Subscription payment error:', error);
      return false;
    }
  }

  /**
   * Process tip payment
   */
  static async processTip(
    from: string,
    to: string,
    amount: number
  ): Promise<boolean> {
    try {
      const fromId = UserId(from);
      const toId = UserId(to);
      const tipAmount = Money.fromDollars(amount);

      // Validate tip amount
      const validation = WalletValidation.validateAmount(
        tipAmount,
        WalletValidation.LIMITS.MIN_TIP,
        WalletValidation.LIMITS.MAX_TIP
      );

      if (!validation.valid) {
        console.error('Invalid tip amount:', validation.error);
        return false;
      }

      // Process tip (no platform fee on tips)
      const result = await walletService.transfer({
        from: fromId,
        to: toId,
        amount: tipAmount,
        type: 'tip',
        description: `Tip from ${from}`,
        idempotencyKey: `tip_${from}_${to}_${Date.now()}`,
        platformFeePercent: 0, // No fee on tips
      });

      return result.success;
    } catch (error) {
      console.error('Tip payment error:', error);
      return false;
    }
  }

  /**
   * Add funds to buyer wallet
   */
  static async addFunds(
    username: string,
    amount: number,
    method: 'credit_card' | 'bank_transfer' = 'credit_card'
  ): Promise<boolean> {
    try {
      const userId = UserId(username);
      const depositAmount = Money.fromDollars(amount);

      // Validate deposit
      const validation = WalletValidation.validateAmount(
        depositAmount,
        WalletValidation.LIMITS.MIN_DEPOSIT,
        WalletValidation.LIMITS.MAX_DEPOSIT
      );

      if (!validation.valid) {
        console.error('Invalid deposit amount:', validation.error);
        return false;
      }

      // Check daily limits
      const history = await walletService.getTransactionHistory(userId);
      if (history.success && history.data) {
        const limitCheck = await WalletValidation.validateDepositLimits(
          userId,
          depositAmount,
          history.data
        );

        if (!limitCheck.valid) {
          console.error('Deposit limit exceeded:', limitCheck.error);
          return false;
        }
      }

      // Process deposit
      const result = await walletService.deposit({
        userId,
        amount: depositAmount,
        method,
        notes: `Wallet deposit by ${username}`,
      });

      return result.success;
    } catch (error) {
      console.error('Add funds error:', error);
      return false;
    }
  }

  /**
   * Process seller withdrawal
   */
  static async processWithdrawal(
    username: string,
    amount: number,
    accountDetails?: any
  ): Promise<boolean> {
    try {
      const userId = UserId(username);
      const withdrawalAmount = Money.fromDollars(amount);

      // Validate withdrawal
      const validation = WalletValidation.validateAmount(
        withdrawalAmount,
        WalletValidation.LIMITS.MIN_WITHDRAWAL,
        WalletValidation.LIMITS.MAX_WITHDRAWAL
      );

      if (!validation.valid) {
        console.error('Invalid withdrawal amount:', validation.error);
        return false;
      }

      // Validate bank account if provided
      if (accountDetails) {
        const accountValidation = WalletValidation.validateBankAccount(accountDetails);
        if (!accountValidation.valid) {
          console.error('Invalid bank account:', accountValidation.errors);
          return false;
        }
      }

      // Check daily limits
      const history = await walletService.getTransactionHistory(userId);
      if (history.success && history.data) {
        const limitCheck = await WalletValidation.validateWithdrawalLimits(
          userId,
          withdrawalAmount,
          history.data
        );

        if (!limitCheck.valid) {
          console.error('Withdrawal limit exceeded:', limitCheck.error);
          return false;
        }
      }

      // Process withdrawal
      const result = await walletService.withdraw({
        userId,
        amount: withdrawalAmount,
        method: 'bank_transfer',
        accountDetails,
      });

      return result.success;
    } catch (error) {
      console.error('Withdrawal error:', error);
      return false;
    }
  }

  /**
   * Get user balance in dollars (for backward compatibility)
   */
  static async getBalanceInDollars(
    username: string,
    role: 'buyer' | 'seller' | 'admin'
  ): Promise<number> {
    try {
      const userId = username === 'admin' ? UserId('admin') : UserId(username);
      const result = await walletService.getBalance(userId, role);
      
      if (result.success && result.data) {
        return Money.toDollars(result.data.balance);
      }
      
      return 0;
    } catch (error) {
      console.error('Get balance error:', error);
      return 0;
    }
  }

  /**
   * Get transaction history formatted for display
   */
  static async getFormattedTransactionHistory(
    username?: string,
    filters?: {
      type?: Transaction['type'];
      fromDate?: string;
      toDate?: string;
      limit?: number;
    }
  ): Promise<Array<{
    id: string;
    displayAmount: string;
    displayType: string;
    displayStatus: string;
    displayDate: string;
    displayDescription: string;
    isCredit: boolean;
    statusColor: string;
    rawTransaction: Transaction;
  }>> {
    try {
      const userId = username ? UserId(username) : undefined;
      const result = await walletService.getTransactionHistory(userId, {
        ...filters,
        fromDate: filters?.fromDate as ISOTimestamp,
        toDate: filters?.toDate as ISOTimestamp,
      });

      if (!result.success || !result.data) {
        return [];
      }

      return result.data.map(transaction => ({
        id: transaction.id,
        ...WalletValidation.formatTransactionForDisplay(transaction),
        rawTransaction: transaction,
      }));
    } catch (error) {
      console.error('Get transaction history error:', error);
      return [];
    }
  }

  /**
   * Check for suspicious activity
   */
  static async checkSuspiciousActivity(username: string): Promise<{
    suspicious: boolean;
    reasons: string[];
    riskScore: number;
  }> {
    try {
      const userId = UserId(username);
      const history = await walletService.getTransactionHistory();
      
      if (!history.success || !history.data) {
        return { suspicious: false, reasons: [], riskScore: 0 };
      }

      return WalletValidation.detectSuspiciousActivity(userId, history.data);
    } catch (error) {
      console.error('Check suspicious activity error:', error);
      return { suspicious: false, reasons: [], riskScore: 0 };
    }
  }

  /**
   * Reconcile wallet balance
   */
  static async reconcileBalance(
    username: string,
    role: 'buyer' | 'seller' | 'admin'
  ): Promise<{
    currentBalance: number;
    calculatedBalance: number;
    discrepancy: number;
    isReconciled: boolean;
  }> {
    try {
      const userId = username === 'admin' ? UserId('admin') : UserId(username);
      
      // Get current balance
      const balanceResult = await walletService.getBalance(userId, role);
      if (!balanceResult.success || !balanceResult.data) {
        throw new Error('Failed to get balance');
      }

      // Get transaction history
      const historyResult = await walletService.getTransactionHistory();
      if (!historyResult.success || !historyResult.data) {
        throw new Error('Failed to get transaction history');
      }

      // Reconcile
      const reconciliation = await WalletReconciliation.reconcileBalance(
        userId,
        role,
        historyResult.data,
        balanceResult.data.balance
      );

      return {
        currentBalance: Money.toDollars(balanceResult.data.balance),
        calculatedBalance: Money.toDollars(reconciliation.calculatedBalance),
        discrepancy: Money.toDollars(reconciliation.discrepancy),
        isReconciled: reconciliation.isReconciled,
      };
    } catch (error) {
      console.error('Reconcile balance error:', error);
      return {
        currentBalance: 0,
        calculatedBalance: 0,
        discrepancy: 0,
        isReconciled: false,
      };
    }
  }

  /**
   * Generate financial report
   */
  static async generateFinancialReport(
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalRevenue: number;
    totalFees: number;
    totalWithdrawals: number;
    totalDeposits: number;
    netIncome: number;
    transactionCount: number;
    averageTransactionSize: number;
  }> {
    try {
      const history = await walletService.getTransactionHistory();
      if (!history.success || !history.data) {
        throw new Error('Failed to get transaction history');
      }

      const report = WalletReconciliation.generateFinancialReport(
        history.data,
        startDate,
        endDate
      );

      return {
        totalRevenue: Money.toDollars(report.totalRevenue),
        totalFees: Money.toDollars(report.totalFees),
        totalWithdrawals: Money.toDollars(report.totalWithdrawals),
        totalDeposits: Money.toDollars(report.totalDeposits),
        netIncome: Money.toDollars(report.netIncome),
        transactionCount: report.transactionCount,
        averageTransactionSize: Money.toDollars(report.averageTransactionSize),
      };
    } catch (error) {
      console.error('Generate financial report error:', error);
      return {
        totalRevenue: 0,
        totalFees: 0,
        totalWithdrawals: 0,
        totalDeposits: 0,
        netIncome: 0,
        transactionCount: 0,
        averageTransactionSize: 0,
      };
    }
  }

  /**
   * Initialize wallet service
   */
  static async initialize(): Promise<void> {
    await walletService.initialize();
  }
}

// Export convenience functions
export const {
  createPurchaseTransaction,
  processSubscription,
  processTip,
  addFunds,
  processWithdrawal,
  getBalanceInDollars,
  getFormattedTransactionHistory,
  checkSuspiciousActivity,
  reconcileBalance,
  generateFinancialReport,
  initialize: initializeWallet,
} = WalletIntegration;
