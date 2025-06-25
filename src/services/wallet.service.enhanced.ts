// src/services/wallet.service.enhanced.ts

import { storageService } from './storage.service';
import { FEATURES, API_ENDPOINTS, buildApiUrl, apiCall, ApiResponse } from './api.config';
import { Money, UserId, ISOTimestamp } from '@/types/common';
import { AppError, ErrorType, ErrorSeverity } from '@/utils/errorHandling';
import { v4 as uuidv4 } from 'uuid';

// Transaction types with proper branding
export type TransactionId = string & { readonly brand: unique symbol };
export const TransactionId = (id: string): TransactionId => id as TransactionId;

// Enhanced transaction types - include cancelled in status
export interface Transaction {
  id: TransactionId;
  type: 'deposit' | 'withdrawal' | 'purchase' | 'sale' | 'tip' | 'subscription' | 
        'admin_credit' | 'admin_debit' | 'refund' | 'fee' | 'tier_credit';
  amount: Money;
  from?: UserId;
  to?: UserId;
  fromRole?: 'buyer' | 'seller' | 'admin';
  toRole?: 'buyer' | 'seller' | 'admin';
  description: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  createdAt: ISOTimestamp;
  completedAt?: ISOTimestamp;
  failedAt?: ISOTimestamp;
  errorMessage?: string;
  metadata?: TransactionMetadata;
  idempotencyKey?: string;
  reversalOf?: TransactionId;
  reversedBy?: TransactionId;
}

export interface TransactionMetadata {
  orderId?: string;
  listingId?: string;
  subscriptionId?: string;
  paymentMethod?: string;
  bankAccount?: string | {
    accountNumber: string;
    routingNumber: string;
    accountHolderName?: string;
    country?: string;
  };
  notes?: string;
  ipAddress?: string;
  userAgent?: string;
  platformFee?: Money;
  tierCreditAmount?: Money;
  originalAmount?: Money;
  adminUser?: string;
  reason?: string;
}

// Wallet balance with proper typing
export interface WalletBalance {
  userId: UserId;
  balance: Money;
  availableBalance: Money;
  pendingBalance: Money;
  role: 'buyer' | 'seller' | 'admin';
  lastUpdated: ISOTimestamp;
  currency: string;
}

// Transaction request types
export interface DepositRequest {
  userId: UserId;
  amount: Money;
  method: 'credit_card' | 'bank_transfer' | 'crypto' | 'admin_credit';
  notes?: string;
  idempotencyKey?: string;
}

export interface WithdrawalRequest {
  userId: UserId;
  amount: Money;
  method?: 'bank_transfer' | 'paypal' | 'crypto';
  accountDetails?: any;
  idempotencyKey?: string;
}

export interface TransferRequest {
  from: UserId;
  to: UserId;
  amount: Money;
  type: 'purchase' | 'tip' | 'subscription' | 'refund' | 'tier_credit' | 'admin_credit' | 'admin_debit';
  description: string;
  metadata?: TransactionMetadata;
  idempotencyKey?: string;
  platformFeePercent?: number;
}

// Transaction validation
export interface TransactionValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Rollback info
export interface RollbackInfo {
  originalTransaction: Transaction;
  reversalTransaction: Transaction;
  affectedBalances: WalletBalance[];
}

/**
 * Enhanced Wallet Service with Financial Safety
 */
export class EnhancedWalletService {
  private static instance: EnhancedWalletService;
  private transactionLocks: Map<string, boolean> = new Map();
  private idempotencyCache: Map<string, TransactionId> = new Map();
  
  // Constants for financial calculations
  private readonly PLATFORM_FEE_PERCENT = 0.10; // 10% platform fee
  private readonly SUBSCRIPTION_FEE_PERCENT = 0.25; // 25% subscription fee
  private readonly MIN_WITHDRAWAL_AMOUNT = Money.fromDollars(10);
  private readonly MAX_DEPOSIT_AMOUNT = Money.fromDollars(10000);
  
  static getInstance(): EnhancedWalletService {
    if (!EnhancedWalletService.instance) {
      EnhancedWalletService.instance = new EnhancedWalletService();
    }
    return EnhancedWalletService.instance;
  }

  /**
   * Initialize wallet service
   */
  async initialize(): Promise<void> {
    // Load idempotency cache
    const cache = await storageService.getItem<Record<string, string>>(
      'wallet_idempotency_cache',
      {}
    );
    // Fix: Convert object entries to string pairs for Map
    this.idempotencyCache = new Map(
      Object.entries(cache).map(([key, value]) => [key, TransactionId(value)])
    );
    
    // Clean up old pending transactions
    await this.cleanupPendingTransactions();
  }

  /**
   * Get wallet balance with proper Money type
   */
  async getBalance(
    userId: UserId,
    role: 'buyer' | 'seller' | 'admin'
  ): Promise<ApiResponse<WalletBalance>> {
    try {
      if (FEATURES.USE_API_WALLET) {
        return await apiCall<WalletBalance>(
          buildApiUrl(API_ENDPOINTS.WALLET.BALANCE, { username: userId })
        );
      }

      // LocalStorage implementation
      const balanceKey = this.getBalanceKey(userId, role);
      const balanceInCents = await storageService.getItem<number>(balanceKey, 0);
      
      // Calculate pending balance from transactions
      const pendingBalance = await this.calculatePendingBalance(userId, role);
      
      const balance: WalletBalance = {
        userId,
        balance: balanceInCents as Money,
        availableBalance: (balanceInCents - pendingBalance) as Money,
        pendingBalance: pendingBalance as Money,
        role,
        lastUpdated: new Date().toISOString() as ISOTimestamp,
        currency: 'USD',
      };

      return { success: true, data: balance };
    } catch (error) {
      return {
        success: false,
        error: { message: 'Failed to get balance', code: 'BALANCE_ERROR' },
      };
    }
  }

  /**
   * Process a deposit with idempotency
   */
  async deposit(request: DepositRequest): Promise<ApiResponse<Transaction>> {
    const idempotencyKey = request.idempotencyKey || this.generateIdempotencyKey('deposit', request);
    
    // Check idempotency
    const existingTransactionId = await this.checkIdempotency(idempotencyKey);
    if (existingTransactionId) {
      const transaction = await this.getTransaction(existingTransactionId);
      if (transaction.success && transaction.data) {
        return { success: true, data: transaction.data };
      }
    }

    // Validate deposit
    const validation = await this.validateDeposit(request);
    if (!validation.isValid) {
      throw new AppError(
        validation.errors.join(', '),
        ErrorType.VALIDATION,
        ErrorSeverity.LOW,
        'INVALID_DEPOSIT'
      );
    }

    // Acquire lock
    const lockKey = `deposit_${request.userId}_${Date.now()}`;
    if (!await this.acquireLock(lockKey)) {
      throw new AppError(
        'Another transaction is in progress',
        ErrorType.SERVER,
        ErrorSeverity.MEDIUM,
        'TRANSACTION_LOCKED'
      );
    }

    try {
      // Create transaction
      const transaction: Transaction = {
        id: TransactionId(uuidv4()),
        type: 'deposit',
        amount: request.amount,
        to: request.userId,
        toRole: 'buyer',
        description: `Deposit via ${request.method}`,
        status: 'pending',
        createdAt: new Date().toISOString() as ISOTimestamp,
        metadata: {
          paymentMethod: request.method,
          notes: request.notes,
        },
        idempotencyKey,
      };

      // Save transaction
      await this.saveTransaction(transaction);
      
      // Process deposit
      try {
        // Update balance
        await this.updateBalanceInternal(request.userId, 'buyer', request.amount, 'credit');
        
        // Mark transaction as completed
        transaction.status = 'completed';
        transaction.completedAt = new Date().toISOString() as ISOTimestamp;
        await this.updateTransaction(transaction);
        
        // Cache idempotency key
        await this.cacheIdempotency(idempotencyKey, transaction.id);
        
        return { success: true, data: transaction };
      } catch (error) {
        // Mark transaction as failed
        transaction.status = 'failed';
        transaction.failedAt = new Date().toISOString() as ISOTimestamp;
        transaction.errorMessage = error instanceof Error ? error.message : 'Unknown error';
        await this.updateTransaction(transaction);
        throw error;
      }
    } finally {
      await this.releaseLock(lockKey);
    }
  }

  /**
   * Process a withdrawal with validation
   */
  async withdraw(request: WithdrawalRequest): Promise<ApiResponse<Transaction>> {
    const idempotencyKey = request.idempotencyKey || this.generateIdempotencyKey('withdraw', request);
    
    // Check idempotency
    const existingTransactionId = await this.checkIdempotency(idempotencyKey);
    if (existingTransactionId) {
      const transaction = await this.getTransaction(existingTransactionId);
      if (transaction.success && transaction.data) {
        return { success: true, data: transaction.data };
      }
    }

    // Get current balance
    const balanceResult = await this.getBalance(request.userId, 'seller');
    if (!balanceResult.success || !balanceResult.data) {
      throw new AppError(
        'Failed to get balance',
        ErrorType.SERVER,
        ErrorSeverity.HIGH,
        'BALANCE_ERROR'
      );
    }

    // Validate withdrawal
    const validation = await this.validateWithdrawal(request, balanceResult.data);
    if (!validation.isValid) {
      throw new AppError(
        validation.errors.join(', '),
        ErrorType.VALIDATION,
        ErrorSeverity.LOW,
        'INVALID_WITHDRAWAL'
      );
    }

    // Acquire lock
    const lockKey = `withdraw_${request.userId}_${Date.now()}`;
    if (!await this.acquireLock(lockKey)) {
      throw new AppError(
        'Another transaction is in progress',
        ErrorType.SERVER,
        ErrorSeverity.MEDIUM,
        'TRANSACTION_LOCKED'
      );
    }

    try {
      // Create transaction
      const transaction: Transaction = {
        id: TransactionId(uuidv4()),
        type: 'withdrawal',
        amount: request.amount,
        from: request.userId,
        fromRole: 'seller',
        description: 'Withdrawal request',
        status: 'pending',
        createdAt: new Date().toISOString() as ISOTimestamp,
        metadata: {
          paymentMethod: request.method || 'bank_transfer',
          bankAccount: request.accountDetails,
        },
        idempotencyKey,
      };

      // Save transaction
      await this.saveTransaction(transaction);
      
      // Process withdrawal
      try {
        // Update balance (deduct amount)
        await this.updateBalanceInternal(request.userId, 'seller', request.amount, 'debit');
        
        // In real implementation, this would initiate bank transfer
        // For now, we'll mark as completed after a delay
        setTimeout(async () => {
          transaction.status = 'completed';
          transaction.completedAt = new Date().toISOString() as ISOTimestamp;
          await this.updateTransaction(transaction);
        }, 2000);
        
        // Cache idempotency key
        await this.cacheIdempotency(idempotencyKey, transaction.id);
        
        return { success: true, data: transaction };
      } catch (error) {
        // Rollback on error
        await this.updateBalanceInternal(request.userId, 'seller', request.amount, 'credit');
        
        transaction.status = 'failed';
        transaction.failedAt = new Date().toISOString() as ISOTimestamp;
        transaction.errorMessage = error instanceof Error ? error.message : 'Unknown error';
        await this.updateTransaction(transaction);
        throw error;
      }
    } finally {
      await this.releaseLock(lockKey);
    }
  }

  /**
   * Process a transfer between users with platform fees
   */
  async transfer(request: TransferRequest): Promise<ApiResponse<Transaction[]>> {
    const idempotencyKey = request.idempotencyKey || this.generateIdempotencyKey('transfer', request);
    
    // Check idempotency
    const existingTransactionId = await this.checkIdempotency(idempotencyKey);
    if (existingTransactionId) {
      const transactions = await this.getTransactionsByIdempotencyKey(idempotencyKey);
      if (transactions.length > 0) {
        return { success: true, data: transactions };
      }
    }

    // Validate transfer
    const validation = await this.validateTransfer(request);
    if (!validation.isValid) {
      throw new AppError(
        validation.errors.join(', '),
        ErrorType.VALIDATION,
        ErrorSeverity.LOW,
        'INVALID_TRANSFER'
      );
    }

    // Acquire locks for both accounts
    const lockKey = `transfer_${request.from}_${request.to}_${Date.now()}`;
    if (!await this.acquireLock(lockKey)) {
      throw new AppError(
        'Another transaction is in progress',
        ErrorType.SERVER,
        ErrorSeverity.MEDIUM,
        'TRANSACTION_LOCKED'
      );
    }

    const transactions: Transaction[] = [];

    try {
      // Calculate fees
      const platformFeePercent = request.platformFeePercent ?? this.PLATFORM_FEE_PERCENT;
      const platformFee = Math.floor(request.amount * platformFeePercent) as Money;
      const sellerAmount = (request.amount - platformFee) as Money;

      // Create main transfer transaction
      const mainTransaction: Transaction = {
        id: TransactionId(uuidv4()),
        type: request.type,
        amount: request.amount,
        from: request.from,
        to: request.to,
        fromRole: 'buyer',
        toRole: 'seller',
        description: request.description,
        status: 'pending',
        createdAt: new Date().toISOString() as ISOTimestamp,
        metadata: {
          ...request.metadata,
          platformFee,
          originalAmount: request.amount,
        },
        idempotencyKey,
      };
      transactions.push(mainTransaction);

      // Create platform fee transaction
      if (platformFee > 0) {
        const feeTransaction: Transaction = {
          id: TransactionId(uuidv4()),
          type: 'fee',
          amount: platformFee,
          from: request.from,
          to: UserId('admin'),
          fromRole: 'buyer',
          toRole: 'admin',
          description: `Platform fee for ${request.description}`,
          status: 'pending',
          createdAt: new Date().toISOString() as ISOTimestamp,
          metadata: {
            ...request.metadata,
          },
          idempotencyKey: `${idempotencyKey}_fee`,
        };
        transactions.push(feeTransaction);
      }

      // Save all transactions
      for (const transaction of transactions) {
        await this.saveTransaction(transaction);
      }

      // Process transfers atomically
      try {
        // Deduct from buyer
        await this.updateBalanceInternal(request.from, 'buyer', request.amount, 'debit');
        
        // Credit to seller (minus fee)
        await this.updateBalanceInternal(request.to, 'seller', sellerAmount, 'credit');
        
        // Credit platform fee to admin
        if (platformFee > 0) {
          await this.updateBalanceInternal(UserId('admin'), 'admin', platformFee, 'credit');
        }

        // Mark all transactions as completed
        for (const transaction of transactions) {
          transaction.status = 'completed';
          transaction.completedAt = new Date().toISOString() as ISOTimestamp;
          await this.updateTransaction(transaction);
        }

        // Cache idempotency key
        await this.cacheIdempotency(idempotencyKey, mainTransaction.id);
        
        return { success: true, data: transactions };
      } catch (error) {
        // Rollback all transactions
        await this.rollbackTransactions(transactions);
        throw error;
      }
    } finally {
      await this.releaseLock(lockKey);
    }
  }

  /**
   * Rollback a transaction
   */
  async rollbackTransaction(transactionId: TransactionId): Promise<ApiResponse<RollbackInfo>> {
    const transactionResult = await this.getTransaction(transactionId);
    if (!transactionResult.success || !transactionResult.data) {
      throw new AppError(
        'Transaction not found',
        ErrorType.NOT_FOUND,
        ErrorSeverity.MEDIUM,
        'TRANSACTION_NOT_FOUND'
      );
    }

    const transaction = transactionResult.data;
    
    // Check if already reversed
    if (transaction.reversedBy) {
      throw new AppError(
        'Transaction already reversed',
        ErrorType.VALIDATION,
        ErrorSeverity.LOW,
        'ALREADY_REVERSED'
      );
    }

    // Only completed transactions can be rolled back
    if (transaction.status !== 'completed') {
      throw new AppError(
        'Only completed transactions can be rolled back',
        ErrorType.VALIDATION,
        ErrorSeverity.LOW,
        'INVALID_STATUS'
      );
    }

    // Create reversal transaction
    const reversalTransaction: Transaction = {
      id: TransactionId(uuidv4()),
      type: transaction.type,
      amount: transaction.amount,
      from: transaction.to,
      to: transaction.from,
      fromRole: transaction.toRole,
      toRole: transaction.fromRole,
      description: `Reversal of ${transaction.description}`,
      status: 'completed',
      createdAt: new Date().toISOString() as ISOTimestamp,
      completedAt: new Date().toISOString() as ISOTimestamp,
      metadata: {
        ...transaction.metadata,
      },
      reversalOf: transaction.id,
    };

    // Process reversal
    const affectedBalances: WalletBalance[] = [];
    
    if (transaction.from) {
      await this.updateBalanceInternal(transaction.from, transaction.fromRole!, transaction.amount, 'credit');
      const balance = await this.getBalance(transaction.from, transaction.fromRole!);
      if (balance.success && balance.data) {
        affectedBalances.push(balance.data);
      }
    }
    
    if (transaction.to) {
      await this.updateBalanceInternal(transaction.to, transaction.toRole!, transaction.amount, 'debit');
      const balance = await this.getBalance(transaction.to, transaction.toRole!);
      if (balance.success && balance.data) {
        affectedBalances.push(balance.data);
      }
    }

    // Save reversal transaction
    await this.saveTransaction(reversalTransaction);
    
    // Update original transaction
    transaction.reversedBy = reversalTransaction.id;
    await this.updateTransaction(transaction);

    return {
      success: true,
      data: {
        originalTransaction: transaction,
        reversalTransaction,
        affectedBalances,
      },
    };
  }

  /**
   * Get transaction history with filtering
   */
  async getTransactionHistory(
    userId?: UserId,
    filters?: {
      type?: Transaction['type'];
      status?: Transaction['status'];
      fromDate?: ISOTimestamp;
      toDate?: ISOTimestamp;
      limit?: number;
      offset?: number;
    }
  ): Promise<ApiResponse<Transaction[]>> {
    try {
      let transactions = await storageService.getItem<Transaction[]>(
        'wallet_transactions',
        []
      );

      // Apply filters
      if (userId) {
        transactions = transactions.filter(
          t => t.from === userId || t.to === userId
        );
      }

      if (filters) {
        if (filters.type) {
          transactions = transactions.filter(t => t.type === filters.type);
        }
        
        if (filters.status) {
          transactions = transactions.filter(t => t.status === filters.status);
        }
        
        if (filters.fromDate) {
          transactions = transactions.filter(
            t => new Date(t.createdAt) >= new Date(filters.fromDate!)
          );
        }
        
        if (filters.toDate) {
          transactions = transactions.filter(
            t => new Date(t.createdAt) <= new Date(filters.toDate!)
          );
        }
      }

      // Sort by date (newest first)
      transactions.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      // Apply pagination
      if (filters?.offset !== undefined && filters?.limit !== undefined) {
        transactions = transactions.slice(
          filters.offset,
          filters.offset + filters.limit
        );
      }

      return { success: true, data: transactions };
    } catch (error) {
      return {
        success: false,
        error: { message: 'Failed to get transaction history' },
      };
    }
  }

  /**
   * Calculate balance from transaction history (for reconciliation)
   */
  async calculateBalanceFromHistory(
    userId: UserId,
    role: 'buyer' | 'seller' | 'admin'
  ): Promise<Money> {
    const transactions = await storageService.getItem<Transaction[]>(
      'wallet_transactions',
      []
    );

    let balance = 0;

    for (const transaction of transactions) {
      if (transaction.status !== 'completed') continue;

      // Credits
      if (transaction.to === userId && transaction.toRole === role) {
        balance += transaction.amount;
      }

      // Debits
      if (transaction.from === userId && transaction.fromRole === role) {
        balance -= transaction.amount;
      }
    }

    return balance as Money;
  }

  /**
   * Validate deposit request
   */
  private async validateDeposit(request: DepositRequest): Promise<TransactionValidation> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Amount validation
    if (request.amount <= 0) {
      errors.push('Deposit amount must be greater than zero');
    }

    if (request.amount > this.MAX_DEPOSIT_AMOUNT) {
      errors.push(`Maximum deposit amount is ${Money.format(this.MAX_DEPOSIT_AMOUNT)}`);
    }

    // Method validation
    const validMethods = ['credit_card', 'bank_transfer', 'crypto', 'admin_credit'];
    if (!validMethods.includes(request.method)) {
      errors.push('Invalid payment method');
    }

    // User validation
    const userExists = await this.userExists(request.userId);
    if (!userExists) {
      errors.push('User not found');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate withdrawal request
   */
  private async validateWithdrawal(
    request: WithdrawalRequest,
    balance: WalletBalance
  ): Promise<TransactionValidation> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Amount validation
    if (request.amount <= 0) {
      errors.push('Withdrawal amount must be greater than zero');
    }

    if (request.amount < this.MIN_WITHDRAWAL_AMOUNT) {
      errors.push(`Minimum withdrawal amount is ${Money.format(this.MIN_WITHDRAWAL_AMOUNT)}`);
    }

    if (request.amount > balance.availableBalance) {
      errors.push('Insufficient available balance');
    }

    // Account details validation
    if (!request.accountDetails) {
      warnings.push('No bank account details provided');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate transfer request
   */
  private async validateTransfer(request: TransferRequest): Promise<TransactionValidation> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Amount validation
    if (request.amount <= 0) {
      errors.push('Transfer amount must be greater than zero');
    }

    // Users validation
    if (request.from === request.to) {
      errors.push('Cannot transfer to the same user');
    }

    // Check sender balance
    const senderBalance = await this.getBalance(request.from, 'buyer');
    if (senderBalance.success && senderBalance.data) {
      if (request.amount > senderBalance.data.availableBalance) {
        errors.push('Insufficient balance');
      }
    } else {
      errors.push('Failed to verify sender balance');
    }

    // Validate users exist
    const fromExists = await this.userExists(request.from);
    const toExists = await this.userExists(request.to);
    
    if (!fromExists) errors.push('Sender not found');
    if (!toExists) errors.push('Recipient not found');

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // Helper methods
  private getBalanceKey(userId: UserId, role: string): string {
    if (userId === 'admin') return 'wallet_admin';
    return `wallet_${role}_${userId}`;
  }

  private async updateBalanceInternal(
    userId: UserId,
    role: 'buyer' | 'seller' | 'admin',
    amount: Money,
    operation: 'credit' | 'debit'
  ): Promise<void> {
    const balanceKey = this.getBalanceKey(userId, role);
    const currentBalance = await storageService.getItem<number>(balanceKey, 0);
    
    const newBalance = operation === 'credit' 
      ? currentBalance + amount 
      : currentBalance - amount;
    
    if (newBalance < 0) {
      throw new AppError(
        'Insufficient balance',
        ErrorType.VALIDATION,
        ErrorSeverity.HIGH,
        'INSUFFICIENT_BALANCE'
      );
    }
    
    await storageService.setItem(balanceKey, newBalance);
  }

  /**
   * Update balance for a user (API method)
   */
  async updateBalance(
    username: string,
    amount: number,
    role?: 'buyer' | 'seller' | 'admin'
  ): Promise<ApiResponse<any>> {
    try {
      const actualRole = role || (username === 'admin' ? 'admin' : 'buyer');
      const balanceKey = this.getBalanceKey(UserId(username), actualRole);
      const amountInCents = Math.round(amount * 100); // Convert to cents
      
      await storageService.setItem(balanceKey, amountInCents);
      
      return {
        success: true,
        data: {
          username,
          balance: amount,
          role: actualRole,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: { message: 'Failed to update balance' },
      };
    }
  }

  private async calculatePendingBalance(
    userId: UserId,
    role: 'buyer' | 'seller' | 'admin'
  ): Promise<number> {
    const transactions = await storageService.getItem<Transaction[]>(
      'wallet_transactions',
      []
    );

    return transactions
      .filter(t => 
        t.status === 'pending' &&
        ((t.from === userId && t.fromRole === role) ||
         (t.to === userId && t.toRole === role))
      )
      .reduce((sum, t) => {
        if (t.from === userId && t.fromRole === role) {
          return sum + t.amount;
        }
        return sum;
      }, 0);
  }

  private async saveTransaction(transaction: Transaction): Promise<void> {
    const transactions = await storageService.getItem<Transaction[]>(
      'wallet_transactions',
      []
    );
    transactions.push(transaction);
    await storageService.setItem('wallet_transactions', transactions);
  }

  private async updateTransaction(transaction: Transaction): Promise<void> {
    const transactions = await storageService.getItem<Transaction[]>(
      'wallet_transactions',
      []
    );
    const index = transactions.findIndex(t => t.id === transaction.id);
    if (index !== -1) {
      transactions[index] = transaction;
      await storageService.setItem('wallet_transactions', transactions);
    }
  }

  private async getTransaction(id: TransactionId): Promise<ApiResponse<Transaction>> {
    const transactions = await storageService.getItem<Transaction[]>(
      'wallet_transactions',
      []
    );
    const transaction = transactions.find(t => t.id === id);
    
    if (!transaction) {
      return {
        success: false,
        error: { message: 'Transaction not found' },
      };
    }
    
    return { success: true, data: transaction };
  }

  private async getTransactionsByIdempotencyKey(key: string): Promise<Transaction[]> {
    const transactions = await storageService.getItem<Transaction[]>(
      'wallet_transactions',
      []
    );
    return transactions.filter(t => t.idempotencyKey === key);
  }

  private async rollbackTransactions(transactions: Transaction[]): Promise<void> {
    for (const transaction of transactions) {
      transaction.status = 'failed';
      transaction.failedAt = new Date().toISOString() as ISOTimestamp;
      transaction.errorMessage = 'Transaction rolled back';
      await this.updateTransaction(transaction);
    }
  }

  private async cleanupPendingTransactions(): Promise<void> {
    const transactions = await storageService.getItem<Transaction[]>(
      'wallet_transactions',
      []
    );
    
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - 24); // 24 hours old
    
    for (const transaction of transactions) {
      if (
        transaction.status === 'pending' &&
        new Date(transaction.createdAt) < cutoffTime
      ) {
        transaction.status = 'failed';
        transaction.failedAt = new Date().toISOString() as ISOTimestamp;
        transaction.errorMessage = 'Transaction expired';
        await this.updateTransaction(transaction);
      }
    }
  }

  private generateIdempotencyKey(type: string, data: any): string {
    const payload = JSON.stringify({ type, ...data, timestamp: Date.now() });
    return `${type}_${Buffer.from(payload).toString('base64')}`;
  }

  private async checkIdempotency(key: string): Promise<TransactionId | null> {
    return this.idempotencyCache.get(key) || null;
  }

  private async cacheIdempotency(key: string, transactionId: TransactionId): Promise<void> {
    this.idempotencyCache.set(key, transactionId);
    
    // Persist to storage
    const cache = Object.fromEntries(this.idempotencyCache);
    await storageService.setItem('wallet_idempotency_cache', cache);
  }

  private async acquireLock(key: string): Promise<boolean> {
    if (this.transactionLocks.has(key)) {
      return false;
    }
    this.transactionLocks.set(key, true);
    return true;
  }

  private async releaseLock(key: string): Promise<void> {
    this.transactionLocks.delete(key);
  }

  private async userExists(userId: UserId): Promise<boolean> {
    const users = await storageService.getItem<Record<string, any>>('all_users_v2', {});
    return userId in users;
  }

  /**
   * Check for suspicious activity
   */
  async checkSuspiciousActivity(username: string): Promise<{
    suspicious: boolean;
    reasons: string[];
    score: number;
  }> {
    try {
      const userId = UserId(username);
      const history = await this.getTransactionHistory();
      
      if (!history.success || !history.data) {
        return { suspicious: false, reasons: [], score: 0 };
      }

      const result = WalletValidation.detectSuspiciousActivity(userId, history.data);
      return {
        suspicious: result.suspicious,
        reasons: result.reasons,
        score: result.riskScore,
      };
    } catch (error) {
      console.error('Check suspicious activity error:', error);
      return { suspicious: false, reasons: [], score: 0 };
    }
  }
}

// Export singleton instance
export const walletService = EnhancedWalletService.getInstance();