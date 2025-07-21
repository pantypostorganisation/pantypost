// src/services/wallet.service.ts

import { storageService } from './storage.service';
import { FEATURES, API_ENDPOINTS, buildApiUrl, apiCall, ApiResponse } from './api.config';
import { v4 as uuidv4 } from 'uuid';
import { walletService as enhancedWalletService } from './wallet.service.enhanced';
import { WalletIntegration } from './wallet.integration';
import { Money, UserId } from '@/types/common';

export interface WalletBalance {
  username: string;
  balance: number;
  role: 'buyer' | 'seller' | 'admin';
}

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'purchase' | 'sale' | 'tip' | 'subscription' | 'admin_action';
  amount: number;
  from?: string;
  to?: string;
  description: string;
  date: string;
  status?: 'pending' | 'completed' | 'failed' | 'cancelled';
  metadata?: any;
}

export interface DepositRequest {
  username: string;
  amount: number;
  method: 'credit_card' | 'bank_transfer' | 'crypto' | 'admin_credit';
  notes?: string;
}

export interface WithdrawalRequest {
  username: string;
  amount: number;
  method?: string;
  accountDetails?: any;
}

export interface TransferRequest {
  from: string;
  to: string;
  amount: number;
  type: 'purchase' | 'tip' | 'subscription' | 'sale';
  description: string;
  metadata?: any;
}

export interface AdminActionRequest {
  adminUser: string;
  targetUser: string;
  role: 'buyer' | 'seller';
  amount: number;
  type: 'credit' | 'debit';
  reason: string;
}

/**
 * Updated Wallet Service with enhanced features
 * Maintains backward compatibility while adding new capabilities
 */
export class WalletService {
  private static instance: WalletService;
  private initialized = false;

  static getInstance(): WalletService {
    if (!WalletService.instance) {
      WalletService.instance = new WalletService();
    }
    return WalletService.instance;
  }

  /**
   * Initialize the wallet service
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    await WalletIntegration.initialize();
    this.initialized = true;
  }

  /**
   * Get balance for a user (backward compatible)
   */
  async getBalance(username: string, role?: 'buyer' | 'seller' | 'admin'): Promise<ApiResponse<WalletBalance>> {
    try {
      // Use enhanced service for better accuracy
      const actualRole = role || (username === 'admin' ? 'admin' : 'buyer');
      const balance = await WalletIntegration.getBalanceInDollars(username, actualRole);
      
      return {
        success: true,
        data: {
          username,
          balance,
          role: actualRole,
        },
      };
    } catch (error) {
      console.error('Get balance error:', error);
      return {
        success: false,
        error: { message: 'Failed to get balance' },
      };
    }
  }

  /**
   * Update balance for a user
   */
  async updateBalance(
    username: string,
    amount: number,
    role?: 'buyer' | 'seller' | 'admin'
  ): Promise<ApiResponse<WalletBalance>> {
    try {
      // This is now handled through transactions in the enhanced service
      // For backward compatibility, we'll create appropriate transactions
      const actualRole = role || (username === 'admin' ? 'admin' : 'buyer');
      const currentBalance = await WalletIntegration.getBalanceInDollars(username, actualRole);
      
      if (amount > currentBalance) {
        // It's a credit
        const creditAmount = amount - currentBalance;
        const success = await this.processAdminAction({
          adminUser: 'system',
          targetUser: username,
          role: actualRole as 'buyer' | 'seller',
          amount: creditAmount,
          type: 'credit',
          reason: 'Balance adjustment',
        });
        
        if (!success.success) {
          throw new Error('Failed to credit balance');
        }
      } else if (amount < currentBalance) {
        // It's a debit
        const debitAmount = currentBalance - amount;
        const success = await this.processAdminAction({
          adminUser: 'system',
          targetUser: username,
          role: actualRole as 'buyer' | 'seller',
          amount: debitAmount,
          type: 'debit',
          reason: 'Balance adjustment',
        });
        
        if (!success.success) {
          throw new Error('Failed to debit balance');
        }
      }
      
      return {
        success: true,
        data: {
          username,
          balance: amount,
          role: actualRole,
        },
      };
    } catch (error) {
      console.error('Update balance error:', error);
      return {
        success: false,
        error: { message: 'Failed to update balance' },
      };
    }
  }

  /**
   * Process a deposit
   */
  async deposit(request: DepositRequest): Promise<ApiResponse<Transaction>> {
    try {
      await this.initialize();
      
      // Use enhanced service
      const success = await WalletIntegration.addFunds(
        request.username,
        request.amount,
        request.method as 'credit_card' | 'bank_transfer'
      );
      
      if (!success) {
        throw new Error('Deposit failed');
      }
      
      // Create legacy transaction for backward compatibility
      const transaction: Transaction = {
        id: uuidv4(),
        type: 'deposit',
        amount: request.amount,
        to: request.username,
        description: `Deposit via ${request.method}`,
        date: new Date().toISOString(),
        status: 'completed',
        metadata: { method: request.method, notes: request.notes },
      };
      
      await this.saveTransaction(transaction);
      
      return { success: true, data: transaction };
    } catch (error) {
      console.error('Deposit error:', error);
      return {
        success: false,
        error: { message: 'Failed to process deposit' },
      };
    }
  }

  /**
   * Process a withdrawal
   */
  async withdraw(request: WithdrawalRequest): Promise<ApiResponse<Transaction>> {
    try {
      await this.initialize();
      
      // Use enhanced service
      const success = await WalletIntegration.processWithdrawal(
        request.username,
        request.amount,
        request.accountDetails
      );
      
      if (!success) {
        throw new Error('Withdrawal failed');
      }
      
      // Create legacy transaction
      const transaction: Transaction = {
        id: uuidv4(),
        type: 'withdrawal',
        amount: request.amount,
        from: request.username,
        description: 'Withdrawal request',
        date: new Date().toISOString(),
        status: 'pending',
        metadata: request.accountDetails,
      };
      
      await this.saveTransaction(transaction);
      
      return { success: true, data: transaction };
    } catch (error) {
      console.error('Withdrawal error:', error);
      return {
        success: false,
        error: { message: 'Failed to process withdrawal' },
      };
    }
  }

  /**
   * Process a transfer between users
   */
  async transfer(request: TransferRequest): Promise<ApiResponse<Transaction>> {
    try {
      await this.initialize();
      
      let success = false;
      
      switch (request.type) {
        case 'purchase':
        case 'sale':
          // For purchases, use the enhanced purchase flow
          const listing = {
            id: request.metadata?.listingId || uuidv4(),
            title: request.description,
            description: request.description,
            price: request.amount * 0.9, // Remove markup
            markedUpPrice: request.amount,
            seller: request.to!,
            imageUrls: [],
          };
          
          const purchaseResult = await WalletIntegration.createPurchaseTransaction(
            listing as any,
            request.from!,
            request.to!,
            request.metadata?.tierCreditAmount
          );
          
          success = purchaseResult.success;
          break;
          
        case 'tip':
          success = await WalletIntegration.processTip(
            request.from!,
            request.to!,
            request.amount
          );
          break;
          
        case 'subscription':
          success = await WalletIntegration.processSubscription(
            request.from!,
            request.to!,
            request.amount
          );
          break;
          
        default:
          throw new Error(`Unsupported transfer type: ${request.type}`);
      }
      
      if (!success) {
        throw new Error('Transfer failed');
      }
      
      // Create legacy transaction
      const transaction: Transaction = {
        id: uuidv4(),
        type: request.type,
        amount: request.amount,
        from: request.from,
        to: request.to,
        description: request.description,
        date: new Date().toISOString(),
        status: 'completed',
        metadata: request.metadata,
      };
      
      await this.saveTransaction(transaction);
      
      return { success: true, data: transaction };
    } catch (error) {
      console.error('Transfer error:', error);
      return {
        success: false,
        error: { message: 'Failed to process transfer' },
      };
    }
  }

  /**
   * Process admin action (credit/debit)
   */
  async processAdminAction(request: AdminActionRequest): Promise<ApiResponse<Transaction>> {
    try {
      await this.initialize();
      
      // For admin actions, we should handle them differently than regular transfers
      // Admin credits should not check admin balance, and debits should not fail on insufficient funds
      
      const userId = UserId(request.targetUser);
      const amount = Money.fromDollars(request.amount);
      
      if (request.type === 'credit') {
        // For credits, use the deposit mechanism instead of transfer
        const result = await enhancedWalletService.deposit({
          userId,
          amount,
          method: 'admin_credit',
          notes: `Admin credit by ${request.adminUser}: ${request.reason}`,
          idempotencyKey: `admin_credit_${request.targetUser}_${Date.now()}`,
        });
        
        if (!result.success) {
          throw new Error('Admin credit failed');
        }
        
        // Create legacy transaction
        const transaction: Transaction = {
          id: uuidv4(),
          type: 'admin_action',
          amount: request.amount,
          from: request.adminUser,
          to: request.targetUser,
          description: `Admin credit: ${request.reason}`,
          date: new Date().toISOString(),
          status: 'completed',
          metadata: {
            adminUser: request.adminUser,
            action: 'credit',
            reason: request.reason,
          },
        };
        
        await this.saveTransaction(transaction);
        
        // Save admin action log
        const adminActions = await storageService.getItem<any[]>('admin_actions', []);
        adminActions.push({
          ...request,
          date: transaction.date,
        });
        await storageService.setItem('admin_actions', adminActions);
        
        return { success: true, data: transaction };
        
      } else {
        // For debits, we need to check the user has sufficient balance first
        const balanceResult = await this.getBalance(request.targetUser, request.role);
        if (!balanceResult.success || !balanceResult.data) {
          throw new Error('Failed to get user balance');
        }
        
        if (balanceResult.data.balance < request.amount) {
          throw new Error('Insufficient balance for debit');
        }
        
        // Use the enhanced service's updateBalance method directly for debits
        const result = await enhancedWalletService.updateBalance(
          request.targetUser,
          balanceResult.data.balance - request.amount,
          request.role
        );
        
        if (!result.success) {
          throw new Error('Admin debit failed');
        }
        
        // Create legacy transaction
        const transaction: Transaction = {
          id: uuidv4(),
          type: 'admin_action',
          amount: request.amount,
          from: request.targetUser,
          to: request.adminUser,
          description: `Admin debit: ${request.reason}`,
          date: new Date().toISOString(),
          status: 'completed',
          metadata: {
            adminUser: request.adminUser,
            action: 'debit',
            reason: request.reason,
          },
        };
        
        await this.saveTransaction(transaction);
        
        // Save admin action log
        const adminActions = await storageService.getItem<any[]>('admin_actions', []);
        adminActions.push({
          ...request,
          date: transaction.date,
        });
        await storageService.setItem('admin_actions', adminActions);
        
        return { success: true, data: transaction };
      }
      
    } catch (error) {
      console.error('Admin action error:', error);
      return {
        success: false,
        error: { message: error instanceof Error ? error.message : 'Failed to process admin action' },
      };
    }
  }

  /**
   * Get transaction history
   */
  async getTransactions(
    username?: string,
    filters?: {
      type?: Transaction['type'];
      fromDate?: string;
      toDate?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<ApiResponse<Transaction[]>> {
    try {
      await this.initialize();
      
      // Convert legacy filter types to enhanced types
      const enhancedFilters = filters ? {
        ...filters,
        type: filters.type === 'admin_action' 
          ? undefined // Filter out admin_action or convert to appropriate type
          : filters.type as any
      } : undefined;
      
      // Get formatted transactions from enhanced service
      const formattedTransactions = await WalletIntegration.getFormattedTransactionHistory(
        username,
        enhancedFilters
      );
      
      // Convert to legacy format
      const transactions: Transaction[] = formattedTransactions.map(ft => ({
        id: ft.id,
        type: this.mapTransactionType(ft.rawTransaction.type),
        amount: Money.toDollars(ft.rawTransaction.amount),
        from: ft.rawTransaction.from,
        to: ft.rawTransaction.to,
        description: ft.rawTransaction.description,
        date: ft.rawTransaction.createdAt,
        status: ft.rawTransaction.status as Transaction['status'],
        metadata: ft.rawTransaction.metadata,
      }));
      
      // If filtering for admin_action, filter the results
      if (filters?.type === 'admin_action') {
        return {
          success: true,
          data: transactions.filter(t => t.type === 'admin_action')
        };
      }
      
      return { success: true, data: transactions };
    } catch (error) {
      console.error('Get transactions error:', error);
      return {
        success: false,
        error: { message: 'Failed to get transactions' },
      };
    }
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
      await this.initialize();
      const result = await WalletIntegration.checkSuspiciousActivity(username);
      
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

  /**
   * Generate financial report
   */
  async generateReport(startDate: Date, endDate: Date): Promise<any> {
    try {
      await this.initialize();
      return await WalletIntegration.generateFinancialReport(startDate, endDate);
    } catch (error) {
      console.error('Generate report error:', error);
      return null;
    }
  }

  // Helper method to save transaction (legacy support)
  private async saveTransaction(transaction: Transaction): Promise<void> {
    const transactions = await storageService.getItem<Transaction[]>(
      'wallet_transactions_legacy',
      []
    );
    transactions.push(transaction);
    await storageService.setItem('wallet_transactions_legacy', transactions);
  }

  // Map enhanced transaction types to legacy types
  private mapTransactionType(type: string): Transaction['type'] {
    const typeMap: Record<string, Transaction['type']> = {
      'deposit': 'deposit',
      'withdrawal': 'withdrawal',
      'purchase': 'purchase',
      'sale': 'sale',
      'tip': 'tip',
      'subscription': 'subscription',
      'admin_credit': 'admin_action',
      'admin_debit': 'admin_action',
      'refund': 'sale',
      'fee': 'purchase',
      'tier_credit': 'admin_action',
    };
    
    return typeMap[type] || 'purchase';
  }
}

// Export singleton instance
export const walletService = WalletService.getInstance();