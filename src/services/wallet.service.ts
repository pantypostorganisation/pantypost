// src/services/wallet.service.ts

import { storageService } from './storage.service';
import { FEATURES, API_ENDPOINTS, buildApiUrl, apiCall, ApiResponse } from './api.config';
import { v4 as uuidv4 } from 'uuid';

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
  status?: 'pending' | 'completed' | 'failed';
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
 * Wallet Service
 * Handles all wallet and financial operations
 */
export class WalletService {
  /**
   * Get balance for a user
   */
  async getBalance(username: string, role?: 'buyer' | 'seller' | 'admin'): Promise<ApiResponse<WalletBalance>> {
    try {
      if (FEATURES.USE_API_WALLET) {
        return await apiCall<WalletBalance>(
          buildApiUrl(API_ENDPOINTS.WALLET.BALANCE, { username })
        );
      }

      // LocalStorage implementation
      let balance = 0;
      let userRole: 'buyer' | 'seller' | 'admin' = role || 'buyer';
      
      if (username === 'admin') {
        balance = await storageService.getItem<number>('panty_admin_balance', 0);
        userRole = 'admin';
      } else if (role === 'buyer' || !role) {
        const buyerBalances = await storageService.getItem<Record<string, number>>(
          'panty_buyer_balances',
          {}
        );
        balance = buyerBalances[username] || 0;
        userRole = 'buyer';
      } else {
        const sellerBalances = await storageService.getItem<Record<string, number>>(
          'panty_seller_balances',
          {}
        );
        balance = sellerBalances[username] || 0;
        userRole = 'seller';
      }

      return {
        success: true,
        data: {
          username,
          balance,
          role: userRole,
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
      if (FEATURES.USE_API_WALLET) {
        return await apiCall<WalletBalance>(
          buildApiUrl(API_ENDPOINTS.WALLET.BALANCE, { username }),
          {
            method: 'PATCH',
            body: JSON.stringify({ amount }),
          }
        );
      }

      // LocalStorage implementation
      let userRole: 'buyer' | 'seller' | 'admin' = role || 'buyer';
      
      if (username === 'admin') {
        await storageService.setItem('panty_admin_balance', amount);
        userRole = 'admin';
      } else if (role === 'buyer' || !role) {
        const buyerBalances = await storageService.getItem<Record<string, number>>(
          'panty_buyer_balances',
          {}
        );
        buyerBalances[username] = amount;
        await storageService.setItem('panty_buyer_balances', buyerBalances);
        userRole = 'buyer';
      } else if (role === 'seller') {
        const sellerBalances = await storageService.getItem<Record<string, number>>(
          'panty_seller_balances',
          {}
        );
        sellerBalances[username] = amount;
        await storageService.setItem('panty_seller_balances', sellerBalances);
        userRole = 'seller';
      }

      return {
        success: true,
        data: {
          username,
          balance: amount,
          role: userRole,
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
      if (FEATURES.USE_API_WALLET) {
        return await apiCall<Transaction>(API_ENDPOINTS.WALLET.DEPOSIT, {
          method: 'POST',
          body: JSON.stringify(request),
        });
      }

      // LocalStorage implementation
      const balanceResult = await this.getBalance(request.username);
      if (!balanceResult.success || !balanceResult.data) {
        return {
          success: false,
          error: { message: 'Failed to get current balance' },
        };
      }

      // Update balances
      const updateResult = await this.updateBalance(
        request.username,
        balanceResult.data.balance + request.amount,
        balanceResult.data.role as 'buyer' | 'seller' | 'admin'
      );
      
      if (!updateResult.success) {
        return {
          success: false,
          error: { message: 'Failed to update balance' },
        };
      }

      // Create transaction record
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

      // Save deposit log
      const depositLogs = await storageService.getItem<any[]>('deposit_logs', []);
      depositLogs.push({
        id: transaction.id,
        username: request.username,
        amount: request.amount,
        method: request.method,
        date: transaction.date,
        status: 'completed',
        transactionId: transaction.id,
        notes: request.notes,
      });
      await storageService.setItem('deposit_logs', depositLogs);

      return {
        success: true,
        data: transaction,
      };
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
      if (FEATURES.USE_API_WALLET) {
        return await apiCall<Transaction>(API_ENDPOINTS.WALLET.WITHDRAW, {
          method: 'POST',
          body: JSON.stringify(request),
        });
      }

      // LocalStorage implementation
      const balanceResult = await this.getBalance(request.username, 'seller');
      if (!balanceResult.success || !balanceResult.data) {
        return {
          success: false,
          error: { message: 'Failed to get current balance' },
        };
      }

      if (balanceResult.data.balance < request.amount) {
        return {
          success: false,
          error: { message: 'Insufficient balance' },
        };
      }

      const newBalance = balanceResult.data.balance - request.amount;
      await this.updateBalance(request.username, newBalance, 'seller');

      // Create transaction record
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

      // Save withdrawal log
      const withdrawalKey = `seller_withdrawals_${request.username}`;
      const withdrawals = await storageService.getItem<any[]>(withdrawalKey, []);
      withdrawals.push({
        amount: request.amount,
        date: transaction.date,
      });
      await storageService.setItem(withdrawalKey, withdrawals);

      return {
        success: true,
        data: transaction,
      };
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
      if (FEATURES.USE_API_WALLET) {
        return await apiCall<Transaction>(`${API_ENDPOINTS.WALLET.BALANCE}/transfer`, {
          method: 'POST',
          body: JSON.stringify(request),
        });
      }

      // LocalStorage implementation
      // Check sender balance
      const senderRole = request.type === 'sale' ? 'seller' : 'buyer';
      const senderBalance = await this.getBalance(request.from, senderRole);
      
      if (!senderBalance.success || !senderBalance.data || 
          senderBalance.data.balance < request.amount) {
        return {
          success: false,
          error: { message: 'Insufficient balance' },
        };
      }

      // Update balances
      await this.updateBalance(
        request.from,
        senderBalance.data.balance - request.amount,
        senderRole
      );

      const receiverRole = request.type === 'sale' ? 'buyer' : 'seller';
      const receiverBalance = await this.getBalance(request.to, receiverRole);
      const currentReceiverBalance = receiverBalance.data?.balance || 0;
      
      await this.updateBalance(
        request.to,
        currentReceiverBalance + request.amount,
        receiverRole
      );

      // Create transaction record
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

      return {
        success: true,
        data: transaction,
      };
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
      if (FEATURES.USE_API_WALLET) {
        return await apiCall<Transaction>(API_ENDPOINTS.WALLET.ADMIN_ACTIONS, {
          method: 'POST',
          body: JSON.stringify(request),
        });
      }

      // LocalStorage implementation
      const balanceResult = await this.getBalance(request.targetUser, request.role);
      if (!balanceResult.success || !balanceResult.data) {
        return {
          success: false,
          error: { message: 'Failed to get current balance' },
        };
      }

      const currentBalance = balanceResult.data.balance;
      const newBalance = request.type === 'credit'
        ? currentBalance + request.amount
        : currentBalance - request.amount;

      if (newBalance < 0) {
        return {
          success: false,
          error: { message: 'Insufficient balance for debit' },
        };
      }

      await this.updateBalance(request.targetUser, newBalance, request.role);

      // Create transaction record
      const transaction: Transaction = {
        id: uuidv4(),
        type: 'admin_action',
        amount: request.amount,
        from: request.type === 'debit' ? request.targetUser : request.adminUser,
        to: request.type === 'credit' ? request.targetUser : request.adminUser,
        description: `Admin ${request.type}: ${request.reason}`,
        date: new Date().toISOString(),
        status: 'completed',
        metadata: {
          adminUser: request.adminUser,
          action: request.type,
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

      return {
        success: true,
        data: transaction,
      };
    } catch (error) {
      console.error('Admin action error:', error);
      return {
        success: false,
        error: { message: 'Failed to process admin action' },
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
      if (FEATURES.USE_API_WALLET) {
        const queryParams = new URLSearchParams();
        if (username) queryParams.append('username', username);
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined) {
              queryParams.append(key, String(value));
            }
          });
        }
        
        return await apiCall<Transaction[]>(
          `${API_ENDPOINTS.WALLET.TRANSACTIONS}?${queryParams.toString()}`
        );
      }

      // LocalStorage implementation
      let transactions = await storageService.getItem<Transaction[]>(
        'wallet_transactions',
        []
      );

      // Apply filters
      if (username) {
        transactions = transactions.filter(
          t => t.from === username || t.to === username
        );
      }

      if (filters) {
        if (filters.type) {
          transactions = transactions.filter(t => t.type === filters.type);
        }
        
        if (filters.fromDate) {
          transactions = transactions.filter(
            t => new Date(t.date) >= new Date(filters.fromDate!)
          );
        }
        
        if (filters.toDate) {
          transactions = transactions.filter(
            t => new Date(t.date) <= new Date(filters.toDate!)
          );
        }
      }

      // Sort by date (newest first)
      transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Apply pagination
      if (filters?.offset !== undefined && filters?.limit !== undefined) {
        transactions = transactions.slice(
          filters.offset,
          filters.offset + filters.limit
        );
      }

      return {
        success: true,
        data: transactions,
      };
    } catch (error) {
      console.error('Get transactions error:', error);
      return {
        success: false,
        error: { message: 'Failed to get transactions' },
      };
    }
  }

  // Helper method to save transaction
  private async saveTransaction(transaction: Transaction): Promise<void> {
    const transactions = await storageService.getItem<Transaction[]>(
      'wallet_transactions',
      []
    );
    transactions.push(transaction);
    await storageService.setItem('wallet_transactions', transactions);
  }
}

// Export singleton instance
export const walletService = new WalletService();