// src/services/mock/handlers/wallet.mock.ts

import { ApiResponse } from '@/types/api';
import { MockHandler } from '../mock-api';
import { mockDataStore } from '../mock.config';
import { Transaction } from '@/services/wallet.service';
import { v4 as uuidv4 } from 'uuid';

// Helper to generate transaction
function generateTransaction(
  type: Transaction['type'],
  amount: number,
  from?: string,
  to?: string,
  description?: string
): Transaction {
  return {
    id: uuidv4(),
    type,
    amount,
    from,
    to,
    description: description || `${type} transaction`,
    date: new Date().toISOString(),
    status: 'completed',
  };
}

export const mockWalletHandlers = {
  // Get balance
  balance: async (method: string, endpoint: string, data?: any, params?: Record<string, string>): Promise<ApiResponse<any>> => {
    const username = params?.username;
    
    if (!username) {
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Username is required' },
      };
    }
    
    // Determine role
    const users = await mockDataStore.get<Record<string, any>>('users', {});
    const user = users[username];
    const role = username === 'admin' ? 'admin' : user?.role || 'buyer';
    
    // Get balances
    const balances = await mockDataStore.get<Record<string, number>>('walletBalances', {});
    const balanceKey = `${role}_${username}`;
    const balance = balances[balanceKey] || 0;
    
    // Initialize balance if new user
    if (!balances[balanceKey]) {
      if (role === 'buyer') {
        balances[balanceKey] = 100; // Start buyers with $100
      } else if (role === 'seller') {
        balances[balanceKey] = 0;
      } else if (role === 'admin') {
        balances[balanceKey] = 10000; // Admin starts with $10k
      }
      await mockDataStore.set('walletBalances', balances);
    }
    
    return {
      success: true,
      data: {
        username,
        balance: balances[balanceKey],
        role,
      },
    };
  },
  
  // Process deposit
  deposit: async (method: string, endpoint: string, data?: any): Promise<ApiResponse<Transaction>> => {
    if (method !== 'POST') {
      return {
        success: false,
        error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' },
      };
    }
    
    const { username, amount, method: paymentMethod, notes } = data;
    
    if (!username || !amount || !paymentMethod) {
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Username, amount, and method are required' },
      };
    }
    
    if (amount <= 0) {
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Amount must be positive' },
      };
    }
    
    if (amount > 10000) {
      return {
        success: false,
        error: { code: 'LIMIT_EXCEEDED', message: 'Maximum deposit is $10,000' },
      };
    }
    
    // Update balance
    const balances = await mockDataStore.get<Record<string, number>>('walletBalances', {});
    const balanceKey = `buyer_${username}`;
    balances[balanceKey] = (balances[balanceKey] || 0) + amount;
    await mockDataStore.set('walletBalances', balances);
    
    // Create transaction
    const transaction = generateTransaction(
      'deposit',
      amount,
      undefined,
      username,
      `Deposit via ${paymentMethod}`
    );
    
    // Store transaction
    const transactions = await mockDataStore.get<Transaction[]>('transactions', []);
    transactions.push(transaction);
    await mockDataStore.set('transactions', transactions);
    
    return {
      success: true,
      data: transaction,
    };
  },
  
  // Process withdrawal
  withdraw: async (method: string, endpoint: string, data?: any): Promise<ApiResponse<Transaction>> => {
    if (method !== 'POST') {
      return {
        success: false,
        error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' },
      };
    }
    
    const { username, amount, method: withdrawalMethod, accountDetails } = data;
    
    if (!username || !amount) {
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Username and amount are required' },
      };
    }
    
    if (amount < 10) {
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Minimum withdrawal is $10' },
      };
    }
    
    if (amount > 5000) {
      return {
        success: false,
        error: { code: 'LIMIT_EXCEEDED', message: 'Maximum withdrawal is $5,000' },
      };
    }
    
    // Check balance
    const balances = await mockDataStore.get<Record<string, number>>('walletBalances', {});
    const balanceKey = `seller_${username}`;
    const currentBalance = balances[balanceKey] || 0;
    
    if (currentBalance < amount) {
      return {
        success: false,
        error: { code: 'INSUFFICIENT_BALANCE', message: 'Insufficient balance' },
      };
    }
    
    // Update balance
    balances[balanceKey] = currentBalance - amount;
    await mockDataStore.set('walletBalances', balances);
    
    // Create transaction
    const transaction = generateTransaction(
      'withdrawal',
      amount,
      username,
      undefined,
      'Withdrawal request'
    );
    transaction.status = 'pending'; // Withdrawals start as pending
    transaction.metadata = accountDetails;
    
    // Store transaction
    const transactions = await mockDataStore.get<Transaction[]>('transactions', []);
    transactions.push(transaction);
    await mockDataStore.set('transactions', transactions);
    
    // Simulate processing after 2 seconds
    setTimeout(async () => {
      transaction.status = 'completed';
      await mockDataStore.set('transactions', transactions);
    }, 2000);
    
    return {
      success: true,
      data: transaction,
    };
  },
  
  // Get transactions
  transactions: async (method: string, endpoint: string, data?: any, params?: Record<string, string>): Promise<ApiResponse<Transaction[]>> => {
    const username = params?.username;
    
    let transactions = await mockDataStore.get<Transaction[]>('transactions', []);
    
    // Generate some initial transactions if empty
    if (transactions.length === 0 && username) {
      const initialTransactions: Transaction[] = [
        generateTransaction('deposit', 100, undefined, username, 'Initial deposit'),
        generateTransaction('purchase', 25, username, 'alice', 'Purchase: Silk Set'),
        generateTransaction('tip', 5, username, 'betty', 'Tip for great service'),
      ];
      
      transactions = initialTransactions;
      await mockDataStore.set('transactions', transactions);
    }
    
    // Filter by username if provided
    if (username) {
      transactions = transactions.filter(t => 
        t.from === username || t.to === username
      );
    }
    
    // Apply filters
    if (params?.type) {
      transactions = transactions.filter(t => t.type === params.type);
    }
    
    if (params?.fromDate) {
      transactions = transactions.filter(t => 
        new Date(t.date) >= new Date(params.fromDate!)
      );
    }
    
    if (params?.toDate) {
      transactions = transactions.filter(t => 
        new Date(t.date) <= new Date(params.toDate!)
      );
    }
    
    // Sort by date (newest first)
    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Apply pagination
    const limit = parseInt(params?.limit || '50');
    const offset = parseInt(params?.offset || '0');
    
    const paginatedTransactions = transactions.slice(offset, offset + limit);
    
    return {
      success: true,
      data: paginatedTransactions,
      meta: {
        totalItems: transactions.length,
        page: Math.floor(offset / limit) + 1,
        totalPages: Math.ceil(transactions.length / limit),
      },
    };
  },
  
  // Admin actions
  adminActions: async (method: string, endpoint: string, data?: any): Promise<ApiResponse<Transaction>> => {
    if (method !== 'POST') {
      return {
        success: false,
        error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' },
      };
    }
    
    const { adminUser, targetUser, role, amount, type, reason } = data;
    
    if (!adminUser || !targetUser || !role || !amount || !type || !reason) {
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'All fields are required' },
      };
    }
    
    // Verify admin
    const users = await mockDataStore.get<Record<string, any>>('users', {});
    if (!users[adminUser] || users[adminUser].role !== 'admin') {
      return {
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Admin access required' },
      };
    }
    
    // Update balance
    const balances = await mockDataStore.get<Record<string, number>>('walletBalances', {});
    const balanceKey = `${role}_${targetUser}`;
    
    if (type === 'credit') {
      balances[balanceKey] = (balances[balanceKey] || 0) + amount;
    } else {
      balances[balanceKey] = Math.max(0, (balances[balanceKey] || 0) - amount);
    }
    
    await mockDataStore.set('walletBalances', balances);
    
    // Create transaction
    const transaction = generateTransaction(
      'admin_action',
      amount,
      type === 'debit' ? targetUser : adminUser,
      type === 'credit' ? targetUser : adminUser,
      `Admin ${type}: ${reason}`
    );
    
    transaction.metadata = {
      adminUser,
      action: type,
      reason,
    };
    
    // Store transaction
    const transactions = await mockDataStore.get<Transaction[]>('transactions', []);
    transactions.push(transaction);
    await mockDataStore.set('transactions', transactions);
    
    // Log admin action
    const adminLogs = await mockDataStore.get<any[]>('adminActions', []);
    adminLogs.push({
      ...data,
      date: transaction.date,
    });
    await mockDataStore.set('adminActions', adminLogs);
    
    return {
      success: true,
      data: transaction,
    };
  },
} as const;