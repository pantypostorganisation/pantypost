// src/services/wallet.service.ts

import { apiCall, buildApiUrl, ApiResponse } from './api.config';
import { Money, UserId } from '@/types/common';
import { WalletValidation } from './wallet.validation';
import { v4 as uuidv4 } from 'uuid';
import { sanitizeUsername, sanitizeCurrency } from '@/utils/security/sanitization';

// Export types from validation file
export type { Transaction, TransactionMetadata } from './wallet.validation';

// ==================== TYPES ====================

export interface WalletBalance {
  username: string;
  balance: number;
  role: 'buyer' | 'seller' | 'admin';
}

// Simple transaction type for API communication (different from validation Transaction type)
export interface ApiTransaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'purchase' | 'sale' | 'tip' | 'subscription' | 
        'admin_credit' | 'admin_debit' | 'refund' | 'fee' | 'tier_credit' | 'platform_fee';
  amount: number;
  from?: string;
  to?: string;
  fromRole?: 'buyer' | 'seller' | 'admin';
  toRole?: 'buyer' | 'seller' | 'admin';
  description: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  createdAt: string;
  completedAt?: string;
  metadata?: any;
}

export interface DepositRequest {
  amount: number;
  method: 'credit_card' | 'bank_transfer' | 'crypto' | 'admin_credit';
  notes?: string;
}

export interface WithdrawalRequest {
  amount: number;
  accountDetails?: {
    accountNumber?: string;
    routingNumber?: string;
    accountType?: string;
  };
}

export interface AdminActionRequest {
  action: 'credit' | 'debit';
  username: string;
  amount: number;
  reason: string;
}

// ==================== WALLET SERVICE ====================

export class WalletService {
  private static instance: WalletService;

  static getInstance(): WalletService {
    if (!WalletService.instance) {
      WalletService.instance = new WalletService();
    }
    return WalletService.instance;
  }

  /**
   * Get wallet balance
   */
  async getBalance(username: string): Promise<ApiResponse<WalletBalance>> {
    try {
      // For admin users, always get platform wallet
      if (this.isAdminUser(username)) {
        return await apiCall<WalletBalance>('/wallet/admin-platform-balance');
      }

      const url = buildApiUrl('/wallet/balance/:username', { username });
      return await apiCall<WalletBalance>(url);
    } catch (error) {
      console.error('[WalletService] Get balance error:', error);
      return {
        success: false,
        error: { message: 'Failed to get balance' }
      };
    }
  }

  /**
   * Make a deposit
   */
  async deposit(request: DepositRequest): Promise<ApiResponse<ApiTransaction>> {
    try {
      // Validate amount using Money type for precision
      const moneyAmount = Money.fromDollars(request.amount);
      const validation = WalletValidation.validateAmount(
        moneyAmount,
        WalletValidation.LIMITS.MIN_DEPOSIT,
        WalletValidation.LIMITS.MAX_DEPOSIT
      );

      if (!validation.valid) {
        return {
          success: false,
          error: { message: validation.error || 'Invalid amount' }
        };
      }

      return await apiCall<ApiTransaction>('/wallet/deposit', {
        method: 'POST',
        body: JSON.stringify(request)
      });
    } catch (error) {
      console.error('[WalletService] Deposit error:', error);
      return {
        success: false,
        error: { message: 'Failed to process deposit' }
      };
    }
  }

  /**
   * Make a withdrawal
   */
  async withdraw(request: WithdrawalRequest): Promise<ApiResponse<ApiTransaction>> {
    try {
      // Validate amount using Money type
      const moneyAmount = Money.fromDollars(request.amount);
      const validation = WalletValidation.validateAmount(
        moneyAmount,
        WalletValidation.LIMITS.MIN_WITHDRAWAL,
        WalletValidation.LIMITS.MAX_WITHDRAWAL
      );

      if (!validation.valid) {
        return {
          success: false,
          error: { message: validation.error || 'Invalid amount' }
        };
      }

      // Validate bank account if provided
      if (request.accountDetails) {
        const accountValidation = WalletValidation.validateBankAccount(request.accountDetails);
        if (!accountValidation.valid) {
          return {
            success: false,
            error: { message: accountValidation.errors.join(', ') }
          };
        }
      }

      return await apiCall<ApiTransaction>('/wallet/withdraw', {
        method: 'POST',
        body: JSON.stringify(request)
      });
    } catch (error) {
      console.error('[WalletService] Withdrawal error:', error);
      return {
        success: false,
        error: { message: 'Failed to process withdrawal' }
      };
    }
  }

  /**
   * Process admin action (credit/debit)
   */
  async processAdminAction(request: AdminActionRequest): Promise<ApiResponse<ApiTransaction>> {
    try {
      // Validate inputs
      const sanitizedUsername = sanitizeUsername(request.username);
      if (!sanitizedUsername) {
        return {
          success: false,
          error: { message: 'Invalid username' }
        };
      }

      const sanitizedAmount = sanitizeCurrency(request.amount);
      if (sanitizedAmount <= 0) {
        return {
          success: false,
          error: { message: 'Invalid amount' }
        };
      }

      return await apiCall<ApiTransaction>('/wallet/admin-actions', {
        method: 'POST',
        body: JSON.stringify({
          ...request,
          username: sanitizedUsername,
          amount: sanitizedAmount
        })
      });
    } catch (error) {
      console.error('[WalletService] Admin action error:', error);
      return {
        success: false,
        error: { message: 'Failed to process admin action' }
      };
    }
  }

  /**
   * Get transaction history
   */
  async getTransactions(
    username: string,
    filters?: {
      type?: string;
      status?: string;
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<ApiResponse<ApiTransaction[]>> {
    try {
      // For admin users, use platform
      const queryUsername = this.isAdminUser(username) ? 'platform' : username;
      
      const url = buildApiUrl('/wallet/transactions/:username', { username: queryUsername });
      
      // Build query string
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) {
            params.append(key, String(value));
          }
        });
      }

      const finalUrl = params.toString() ? `${url}?${params}` : url;
      
      return await apiCall<ApiTransaction[]>(finalUrl);
    } catch (error) {
      console.error('[WalletService] Get transactions error:', error);
      return {
        success: false,
        error: { message: 'Failed to get transactions' }
      };
    }
  }

  /**
   * Get admin analytics
   */
  async getAdminAnalytics(timeFilter: string = 'all'): Promise<ApiResponse<any>> {
    try {
      return await apiCall<any>(`/wallet/admin/analytics?timeFilter=${timeFilter}`);
    } catch (error) {
      console.error('[WalletService] Get analytics error:', error);
      return {
        success: false,
        error: { message: 'Failed to get analytics' }
      };
    }
  }

  /**
   * Get platform transactions (admin only)
   */
  async getPlatformTransactions(limit: number = 100, page: number = 1): Promise<ApiResponse<ApiTransaction[]>> {
    try {
      return await apiCall<ApiTransaction[]>(`/wallet/platform-transactions?limit=${limit}&page=${page}`);
    } catch (error) {
      console.error('[WalletService] Get platform transactions error:', error);
      return {
        success: false,
        error: { message: 'Failed to get platform transactions' }
      };
    }
  }

  /**
   * Process admin withdrawal from platform wallet
   */
  async processAdminWithdrawal(amount: number, notes?: string): Promise<ApiResponse<any>> {
    try {
      // Validate amount
      const moneyAmount = Money.fromDollars(amount);
      const validation = WalletValidation.validateAmount(
        moneyAmount,
        WalletValidation.LIMITS.MIN_WITHDRAWAL,
        WalletValidation.LIMITS.MAX_WITHDRAWAL
      );

      if (!validation.valid) {
        return {
          success: false,
          error: { message: validation.error || 'Invalid amount' }
        };
      }

      return await apiCall<any>('/wallet/admin-withdraw', {
        method: 'POST',
        body: JSON.stringify({
          amount,
          accountDetails: {
            accountNumber: '****9999',
            accountType: 'business'
          },
          notes
        })
      });
    } catch (error) {
      console.error('[WalletService] Admin withdrawal error:', error);
      return {
        success: false,
        error: { message: 'Failed to process admin withdrawal' }
      };
    }
  }

  /**
   * Check for suspicious activity
   */
  async checkSuspiciousActivity(username: string): Promise<{
    suspicious: boolean;
    reasons: string[];
    riskScore: number;
  }> {
    try {
      const response = await this.getTransactions(username);
      
      if (!response.success || !response.data) {
        return { suspicious: false, reasons: [], riskScore: 0 };
      }

      // Convert API transactions to validation Transaction type
      const transactions = response.data.map(t => ({
        ...t,
        amount: Money.fromDollars(t.amount) as Money,
        from: t.from ? UserId(t.from) : undefined,
        to: t.to ? UserId(t.to) : undefined,
      }));

      return WalletValidation.detectSuspiciousActivity(
        UserId(username),
        transactions as any
      );
    } catch (error) {
      console.error('[WalletService] Check suspicious activity error:', error);
      return { suspicious: false, reasons: [], riskScore: 0 };
    }
  }

  /**
   * Format transaction for display
   */
  formatTransaction(transaction: ApiTransaction): {
    displayAmount: string;
    displayType: string;
    displayStatus: string;
    displayDate: string;
    isCredit: boolean;
    statusColor: string;
  } {
    // Convert to Money type for formatting
    const moneyAmount = Money.fromDollars(transaction.amount);
    const formatted = WalletValidation.formatTransactionForDisplay({
      ...transaction,
      amount: moneyAmount,
      from: transaction.from ? UserId(transaction.from) : undefined,
      to: transaction.to ? UserId(transaction.to) : undefined,
    } as any);

    return {
      displayAmount: formatted.displayAmount,
      displayType: formatted.displayType,
      displayStatus: formatted.displayStatus,
      displayDate: formatted.displayDate,
      isCredit: formatted.isCredit,
      statusColor: formatted.statusColor
    };
  }

  /**
   * Calculate fees for a transaction
   */
  calculateFees(amount: number, type: ApiTransaction['type']): {
    platformFee: number;
    netAmount: number;
  } {
    const moneyAmount = Money.fromDollars(amount);
    const fees = WalletValidation.calculateTransactionFees(
      moneyAmount,
      type as any
    );

    return {
      platformFee: Money.toDollars(fees.totalFee),
      netAmount: Money.toDollars(fees.netAmount)
    };
  }

  /**
   * Helper to check if user is admin
   */
  private isAdminUser(username: string): boolean {
    return username === 'oakley' || 
           username === 'gerome' || 
           username === 'platform' ||
           username === 'admin';
  }
}

// Export singleton instance
export const walletService = WalletService.getInstance();

// Also export as default for backward compatibility
export default walletService;