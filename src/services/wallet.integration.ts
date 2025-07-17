// src/services/wallet.integration.ts

import { walletService, Transaction, TransactionId } from './wallet.service.enhanced';
import { WalletValidation, WalletReconciliation } from './wallet.validation';
import { Money, UserId, ISOTimestamp } from '@/types/common';
import { Order } from '@/context/WalletContext';
import { Listing } from '@/context/ListingContext';
import { v4 as uuidv4 } from 'uuid';
import { securityService } from './security.service';
import { financialSchemas, authSchemas } from '@/utils/validation/schemas';
import { sanitizeStrict, sanitizeNumber } from '@/utils/security/sanitization';
import { getRateLimiter, RATE_LIMITS } from '@/utils/security/rate-limiter';
import { z } from 'zod';

// Validation schemas
const purchaseTransactionSchema = z.object({
  buyer: authSchemas.username,
  seller: authSchemas.username,
  listingPrice: z.number().positive().max(10000),
  markedUpPrice: z.number().positive().max(10000),
  tierCreditAmount: z.number().min(0).max(1000).optional(),
});

const subscriptionSchema = z.object({
  buyer: authSchemas.username,
  seller: authSchemas.username,
  amount: z.number().positive().min(5).max(100),
});

const tipSchema = z.object({
  from: authSchemas.username,
  to: authSchemas.username,
  amount: z.number().positive().min(1).max(500),
});

const depositSchema = z.object({
  username: authSchemas.username,
  amount: financialSchemas.depositAmount,
  method: z.enum(['credit_card', 'bank_transfer']),
});

const withdrawalSchema = z.object({
  username: authSchemas.username,
  amount: financialSchemas.withdrawAmount,
  accountDetails: financialSchemas.bankAccount.optional(),
});

/**
 * Integration layer between WalletContext and the enhanced wallet service
 * Provides backward compatibility while leveraging new features with security
 */
export class WalletIntegration {
  private static rateLimiter = getRateLimiter();

  /**
   * Validate and sanitize username before converting to UserId
   */
  private static validateUserId(username: string): UserId | null {
    const sanitized = sanitizeStrict(username).toLowerCase();
    if (!sanitized || sanitized.length > 50 || !/^[a-z0-9_-]+$/.test(sanitized)) {
      return null;
    }
    return UserId(sanitized);
  }

  /**
   * Convert legacy order to purchase transaction with validation
   */
  static async createPurchaseTransaction(
    listing: Listing,
    buyer: string,
    seller: string,
    tierCreditAmount?: number
  ): Promise<{ success: boolean; transaction?: Transaction; order?: Order; error?: string }> {
    try {
      // Validate listing
      if (!listing || !listing.id || !listing.title) {
        return { success: false, error: 'Invalid listing data' };
      }

      // Validate and sanitize inputs
      const validation = securityService.validateAndSanitize(
        {
          buyer: buyer.toLowerCase(),
          seller: seller.toLowerCase(),
          listingPrice: listing.price,
          markedUpPrice: listing.markedUpPrice || listing.price * 1.1,
          tierCreditAmount,
        },
        purchaseTransactionSchema
      );

      if (!validation.success || !validation.data) {
        return { success: false, error: 'Invalid purchase data' };
      }

      const validatedData = validation.data;

      // Check rate limit
      const rateLimitKey = `purchase_${validatedData.buyer}`;
      const rateLimitResult = WalletIntegration.rateLimiter.check(rateLimitKey, {
        maxAttempts: 20,
        windowMs: 60 * 60 * 1000, // 20 purchases per hour
      });
      
      if (!rateLimitResult.allowed) {
        return { 
          success: false, 
          error: `Too many purchases. Please wait ${rateLimitResult.waitTime} seconds.` 
        };
      }

      const buyerId = WalletIntegration.validateUserId(validatedData.buyer);
      const sellerId = WalletIntegration.validateUserId(validatedData.seller);
      
      if (!buyerId || !sellerId) {
        return { success: false, error: 'Invalid user IDs' };
      }

      // Ensure buyer and seller are different
      if (buyerId === sellerId) {
        return { success: false, error: 'Cannot purchase from yourself' };
      }
      
      // Calculate amounts with validation
      const listingPrice = Money.fromDollars(
        sanitizeNumber(validatedData.listingPrice, 0.01, 10000, 2)
      );
      const markedUpPrice = Money.fromDollars(
        sanitizeNumber(validatedData.markedUpPrice, 0.01, 10000, 2)
      );
      
      // Validate markup
      if (markedUpPrice < listingPrice) {
        return { success: false, error: 'Invalid price markup' };
      }

      // Validate purchase
      const buyerBalance = await walletService.getBalance(buyerId, 'buyer');
      if (!buyerBalance.success || !buyerBalance.data) {
        return { success: false, error: 'Unable to verify buyer balance' };
      }

      if (markedUpPrice > buyerBalance.data.availableBalance) {
        return { success: false, error: 'Insufficient funds' };
      }

      // Create idempotency key
      const idempotencyKey = `purchase_${validatedData.buyer}_${validatedData.seller}_${listing.id}_${Date.now()}`;

      // Process transfer
      const transferResult = await walletService.transfer({
        from: buyerId,
        to: sellerId,
        amount: markedUpPrice,
        type: 'purchase',
        description: sanitizeStrict(`Purchase: ${listing.title}`).substring(0, 100),
        metadata: {
          listingId: listing.id,
          tierCreditAmount: validatedData.tierCreditAmount 
            ? Money.fromDollars(validatedData.tierCreditAmount) 
            : undefined,
          originalAmount: listingPrice,
        },
        idempotencyKey,
        platformFeePercent: 0.10, // 10% platform fee
      });

      if (!transferResult.success || !transferResult.data) {
        return { success: false, error: 'Transaction failed' };
      }

      // Create order for backward compatibility
      const order: Order = {
        id: uuidv4(),
        title: sanitizeStrict(listing.title).substring(0, 100),
        description: sanitizeStrict(listing.description).substring(0, 2000),
        price: validatedData.listingPrice,
        markedUpPrice: Money.toDollars(markedUpPrice),
        imageUrl: listing.imageUrls?.[0],
        date: new Date().toISOString(),
        seller: validatedData.seller,
        buyer: validatedData.buyer,
        tags: listing.tags?.map(tag => sanitizeStrict(tag).substring(0, 30)),
        wasAuction: listing.auction?.isAuction,
        finalBid: listing.auction?.highestBid,
        shippingStatus: 'pending',
        tierCreditAmount: validatedData.tierCreditAmount,
      };

      // Handle tier credit if applicable
      if (validatedData.tierCreditAmount && validatedData.tierCreditAmount > 0) {
        const tierCreditMoney = Money.fromDollars(validatedData.tierCreditAmount);
        const adminId = WalletIntegration.validateUserId('admin');
        
        if (adminId) {
          await walletService.transfer({
            from: adminId,
            to: sellerId,
            amount: tierCreditMoney,
            type: 'tier_credit',
            description: sanitizeStrict(`Tier bonus for ${listing.title}`).substring(0, 100),
            metadata: {
              orderId: order.id,
              listingId: listing.id,
            },
            idempotencyKey: `${idempotencyKey}_tier_credit`,
          });
        }
      }

      return {
        success: true,
        transaction: transferResult.data[0],
        order,
      };
    } catch (error) {
      console.error('Purchase transaction error:', error);
      return { success: false, error: 'Transaction processing failed' };
    }
  }

  /**
   * Process subscription payment with validation
   */
  static async processSubscription(
    buyer: string,
    seller: string,
    amount: number
  ): Promise<boolean> {
    try {
      // Validate inputs
      const validation = securityService.validateAndSanitize(
        {
          buyer: buyer.toLowerCase(),
          seller: seller.toLowerCase(),
          amount,
        },
        subscriptionSchema
      );

      if (!validation.success || !validation.data) {
        console.error('Invalid subscription data');
        return false;
      }

      const validatedData = validation.data;

      // Check rate limit
      const rateLimitKey = `subscription_${validatedData.buyer}`;
      const rateLimitResult = WalletIntegration.rateLimiter.check(rateLimitKey, {
        maxAttempts: 5,
        windowMs: 60 * 60 * 1000, // 5 subscriptions per hour
      });
      
      if (!rateLimitResult.allowed) {
        console.error(`Rate limit exceeded: ${rateLimitResult.waitTime}s wait`);
        return false;
      }

      const buyerId = WalletIntegration.validateUserId(validatedData.buyer);
      const sellerId = WalletIntegration.validateUserId(validatedData.seller);
      
      if (!buyerId || !sellerId) {
        console.error('Invalid user IDs');
        return false;
      }

      // Ensure buyer and seller are different
      if (buyerId === sellerId) {
        console.error('Cannot subscribe to yourself');
        return false;
      }

      const subscriptionAmount = Money.fromDollars(validatedData.amount);

      // Additional validation
      const validation2 = WalletValidation.validateAmount(
        subscriptionAmount,
        Money.fromDollars(5), // Min $5 subscription
        Money.fromDollars(100) // Max $100 subscription
      );

      if (!validation2.valid) {
        console.error('Invalid subscription amount:', validation2.error);
        return false;
      }

      // Process subscription
      const result = await walletService.transfer({
        from: buyerId,
        to: sellerId,
        amount: subscriptionAmount,
        type: 'subscription',
        description: sanitizeStrict(`Monthly subscription to ${validatedData.seller}`).substring(0, 100),
        metadata: {
          subscriptionId: `sub_${validatedData.buyer}_${validatedData.seller}_${Date.now()}`,
        },
        idempotencyKey: `subscription_${validatedData.buyer}_${validatedData.seller}_${Date.now()}`,
        platformFeePercent: WalletValidation.FEES.SUBSCRIPTION_PERCENT,
      });

      return result.success;
    } catch (error) {
      console.error('Subscription payment error:', error);
      return false;
    }
  }

  /**
   * Process tip payment with validation
   */
  static async processTip(
    from: string,
    to: string,
    amount: number
  ): Promise<boolean> {
    try {
      // Validate inputs
      const validation = securityService.validateAndSanitize(
        {
          from: from.toLowerCase(),
          to: to.toLowerCase(),
          amount,
        },
        tipSchema
      );

      if (!validation.success || !validation.data) {
        console.error('Invalid tip data');
        return false;
      }

      const validatedData = validation.data;

      // Check rate limit
      const rateLimitKey = `tip_${validatedData.from}`;
      const rateLimitResult = WalletIntegration.rateLimiter.check(rateLimitKey, RATE_LIMITS.TIP);
      
      if (!rateLimitResult.allowed) {
        console.error(`Rate limit exceeded: ${rateLimitResult.waitTime}s wait`);
        return false;
      }

      const fromId = WalletIntegration.validateUserId(validatedData.from);
      const toId = WalletIntegration.validateUserId(validatedData.to);
      
      if (!fromId || !toId) {
        console.error('Invalid user IDs');
        return false;
      }

      // Ensure sender and receiver are different
      if (fromId === toId) {
        console.error('Cannot tip yourself');
        return false;
      }

      const tipAmount = Money.fromDollars(validatedData.amount);

      // Validate tip amount
      const validation2 = WalletValidation.validateAmount(
        tipAmount,
        WalletValidation.LIMITS.MIN_TIP,
        WalletValidation.LIMITS.MAX_TIP
      );

      if (!validation2.valid) {
        console.error('Invalid tip amount:', validation2.error);
        return false;
      }

      // Process tip (no platform fee on tips)
      const result = await walletService.transfer({
        from: fromId,
        to: toId,
        amount: tipAmount,
        type: 'tip',
        description: sanitizeStrict(`Tip from ${validatedData.from}`).substring(0, 100),
        idempotencyKey: `tip_${validatedData.from}_${validatedData.to}_${Date.now()}`,
        platformFeePercent: 0, // No fee on tips
      });

      return result.success;
    } catch (error) {
      console.error('Tip payment error:', error);
      return false;
    }
  }

  /**
   * Add funds to buyer wallet with validation
   */
  static async addFunds(
    username: string,
    amount: number,
    method: 'credit_card' | 'bank_transfer' = 'credit_card'
  ): Promise<boolean> {
    try {
      // Validate inputs
      const validation = securityService.validateAndSanitize(
        {
          username: username.toLowerCase(),
          amount,
          method,
        },
        depositSchema
      );

      if (!validation.success || !validation.data) {
        console.error('Invalid deposit data');
        return false;
      }

      const validatedData = validation.data;

      // Check rate limit
      const rateLimitKey = `deposit_${validatedData.username}`;
      const rateLimitResult = WalletIntegration.rateLimiter.check(rateLimitKey, RATE_LIMITS.DEPOSIT);
      
      if (!rateLimitResult.allowed) {
        console.error(`Rate limit exceeded: ${rateLimitResult.waitTime}s wait`);
        return false;
      }

      const userId = WalletIntegration.validateUserId(validatedData.username);
      if (!userId) {
        console.error('Invalid user ID');
        return false;
      }

      const depositAmount = Money.fromDollars(validatedData.amount);

      // Validate deposit
      const validation2 = WalletValidation.validateAmount(
        depositAmount,
        WalletValidation.LIMITS.MIN_DEPOSIT,
        WalletValidation.LIMITS.MAX_DEPOSIT
      );

      if (!validation2.valid) {
        console.error('Invalid deposit amount:', validation2.error);
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
        method: validatedData.method,
        notes: sanitizeStrict(`Wallet deposit by ${validatedData.username}`).substring(0, 100),
      });

      return result.success;
    } catch (error) {
      console.error('Add funds error:', error);
      return false;
    }
  }

  /**
   * Process seller withdrawal with validation
   */
  static async processWithdrawal(
    username: string,
    amount: number,
    accountDetails?: any
  ): Promise<boolean> {
    try {
      // Validate inputs
      const validation = securityService.validateAndSanitize(
        {
          username: username.toLowerCase(),
          amount,
          accountDetails,
        },
        withdrawalSchema
      );

      if (!validation.success || !validation.data) {
        console.error('Invalid withdrawal data');
        return false;
      }

      const validatedData = validation.data;

      // Check rate limit
      const rateLimitKey = `withdrawal_${validatedData.username}`;
      const rateLimitResult = WalletIntegration.rateLimiter.check(rateLimitKey, RATE_LIMITS.WITHDRAWAL);
      
      if (!rateLimitResult.allowed) {
        console.error(`Rate limit exceeded: ${rateLimitResult.waitTime}s wait`);
        return false;
      }

      const userId = WalletIntegration.validateUserId(validatedData.username);
      if (!userId) {
        console.error('Invalid user ID');
        return false;
      }

      const withdrawalAmount = Money.fromDollars(validatedData.amount);

      // Validate withdrawal
      const validation2 = WalletValidation.validateAmount(
        withdrawalAmount,
        WalletValidation.LIMITS.MIN_WITHDRAWAL,
        WalletValidation.LIMITS.MAX_WITHDRAWAL
      );

      if (!validation2.valid) {
        console.error('Invalid withdrawal amount:', validation2.error);
        return false;
      }

      // Validate bank account if provided
      if (validatedData.accountDetails) {
        const accountValidation = WalletValidation.validateBankAccount(validatedData.accountDetails);
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
        accountDetails: validatedData.accountDetails,
      });

      return result.success;
    } catch (error) {
      console.error('Withdrawal error:', error);
      return false;
    }
  }

  /**
   * Get user balance in dollars with validation
   */
  static async getBalanceInDollars(
    username: string,
    role: 'buyer' | 'seller' | 'admin'
  ): Promise<number> {
    try {
      const sanitizedUsername = sanitizeStrict(username).toLowerCase();
      if (!sanitizedUsername || sanitizedUsername.length > 50) {
        console.error('Invalid username');
        return 0;
      }

      const userId = sanitizedUsername === 'admin' 
        ? WalletIntegration.validateUserId('admin') 
        : WalletIntegration.validateUserId(sanitizedUsername);
      
      if (!userId) {
        console.error('Invalid user ID');
        return 0;
      }

      const result = await walletService.getBalance(userId, role);
      
      if (result.success && result.data) {
        return sanitizeNumber(Money.toDollars(result.data.balance), 0, 1000000, 2);
      }
      
      return 0;
    } catch (error) {
      console.error('Get balance error:', error);
      return 0;
    }
  }

  /**
   * Get transaction history formatted for display with validation
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
      let userId: UserId | undefined;
      
      if (username) {
        const sanitizedUsername = sanitizeStrict(username).toLowerCase();
        if (!sanitizedUsername || sanitizedUsername.length > 50) {
          console.error('Invalid username');
          return [];
        }
        
        const validatedUserId = WalletIntegration.validateUserId(sanitizedUsername);
        if (!validatedUserId) {
          console.error('Invalid user ID');
          return [];
        }
        userId = validatedUserId;
      }

      // Validate filters
      const sanitizedFilters = {
        ...filters,
        limit: filters?.limit ? Math.min(Math.max(1, filters.limit), 1000) : undefined,
      };

      const result = await walletService.getTransactionHistory(userId, {
        ...sanitizedFilters,
        fromDate: sanitizedFilters?.fromDate as ISOTimestamp,
        toDate: sanitizedFilters?.toDate as ISOTimestamp,
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
   * Check for suspicious activity with validation
   */
  static async checkSuspiciousActivity(username: string): Promise<{
    suspicious: boolean;
    reasons: string[];
    riskScore: number;
  }> {
    try {
      const sanitizedUsername = sanitizeStrict(username).toLowerCase();
      if (!sanitizedUsername || sanitizedUsername.length > 50) {
        return { suspicious: false, reasons: [], riskScore: 0 };
      }

      const userId = WalletIntegration.validateUserId(sanitizedUsername);
      if (!userId) {
        return { suspicious: false, reasons: [], riskScore: 0 };
      }

      const history = await walletService.getTransactionHistory();
      
      if (!history.success || !history.data) {
        return { suspicious: false, reasons: [], riskScore: 0 };
      }

      const result = WalletValidation.detectSuspiciousActivity(userId, history.data);
      
      return {
        suspicious: result.suspicious,
        reasons: result.reasons.map(r => sanitizeStrict(r)),
        riskScore: sanitizeNumber(result.riskScore, 0, 100, 0),
      };
    } catch (error) {
      console.error('Check suspicious activity error:', error);
      return { suspicious: false, reasons: [], riskScore: 0 };
    }
  }

  /**
   * Reconcile wallet balance with validation
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
      const sanitizedUsername = sanitizeStrict(username).toLowerCase();
      if (!sanitizedUsername || sanitizedUsername.length > 50) {
        throw new Error('Invalid username');
      }

      if (!['buyer', 'seller', 'admin'].includes(role)) {
        throw new Error('Invalid role');
      }

      const userId = sanitizedUsername === 'admin' 
        ? WalletIntegration.validateUserId('admin') 
        : WalletIntegration.validateUserId(sanitizedUsername);
      
      if (!userId) {
        throw new Error('Invalid user ID');
      }
      
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
        currentBalance: sanitizeNumber(Money.toDollars(balanceResult.data.balance), 0, 1000000, 2),
        calculatedBalance: sanitizeNumber(Money.toDollars(reconciliation.calculatedBalance), 0, 1000000, 2),
        discrepancy: sanitizeNumber(Money.toDollars(reconciliation.discrepancy), -1000000, 1000000, 2),
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
   * Generate financial report with validation
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
      // Validate dates
      if (!(startDate instanceof Date) || isNaN(startDate.getTime())) {
        throw new Error('Invalid start date');
      }
      
      if (!(endDate instanceof Date) || isNaN(endDate.getTime())) {
        throw new Error('Invalid end date');
      }
      
      if (startDate > endDate) {
        throw new Error('Start date must be before end date');
      }
      
      // Limit date range to 1 year
      const oneYearMs = 365 * 24 * 60 * 60 * 1000;
      if (endDate.getTime() - startDate.getTime() > oneYearMs) {
        throw new Error('Date range cannot exceed 1 year');
      }

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
        totalRevenue: sanitizeNumber(Money.toDollars(report.totalRevenue), 0, 10000000, 2),
        totalFees: sanitizeNumber(Money.toDollars(report.totalFees), 0, 10000000, 2),
        totalWithdrawals: sanitizeNumber(Money.toDollars(report.totalWithdrawals), 0, 10000000, 2),
        totalDeposits: sanitizeNumber(Money.toDollars(report.totalDeposits), 0, 10000000, 2),
        netIncome: sanitizeNumber(Money.toDollars(report.netIncome), -10000000, 10000000, 2),
        transactionCount: Math.max(0, Math.floor(report.transactionCount)),
        averageTransactionSize: sanitizeNumber(Money.toDollars(report.averageTransactionSize), 0, 10000, 2),
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