// src/services/mock/handlers/wallet.mock.ts

import { ApiResponse } from '@/types/api';
import { MockHandler } from '../mock-api';
import { mockDataStore } from '../mock.config';
import { Transaction } from '@/services/wallet.service';
import { v4 as uuidv4 } from 'uuid';
import { sanitizeStrict, sanitizeUsername, sanitizeNumber, sanitizeCurrency } from '@/utils/security/sanitization';
import { securityService } from '@/services/security.service';
import { z } from 'zod';

// Validation schemas
const depositSchema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_-]+$/),
  amount: z.number().positive().max(10000),
  method: z.enum(['credit_card', 'debit_card', 'bank_transfer', 'crypto']),
  notes: z.string().max(200).optional()
});

const withdrawSchema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_-]+$/),
  amount: z.number().min(10).max(5000),
  method: z.enum(['bank_transfer', 'crypto', 'check']).optional(),
  accountDetails: z.record(z.string()).optional()
});

const adminActionSchema = z.object({
  adminUser: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_-]+$/),
  targetUser: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_-]+$/),
  role: z.enum(['buyer', 'seller']),
  amount: z.number().positive().max(100000),
  type: z.enum(['credit', 'debit']),
  reason: z.string().min(10).max(500)
});

// Helper to generate transaction with sanitized data
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
    amount: Math.round(amount * 100) / 100, // Ensure proper decimal precision
    from: from ? sanitizeUsername(from) : undefined,
    to: to ? sanitizeUsername(to) : undefined,
    description: sanitizeStrict(description || `${type} transaction`) || `${type} transaction`,
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
    
    const sanitizedUsername = sanitizeUsername(username);
    if (!sanitizedUsername) {
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid username format' },
      };
    }
    
    // Determine role
    const users = await mockDataStore.get<Record<string, any>>('users', {});
    const user = users[sanitizedUsername];
    const role = sanitizedUsername === 'admin' ? 'admin' : user?.role || 'buyer';
    
    // Validate role
    if (!['buyer', 'seller', 'admin'].includes(role)) {
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid user role' },
      };
    }
    
    // Get balances
    const balances = await mockDataStore.get<Record<string, number>>('walletBalances', {});
    const balanceKey = `${role}_${sanitizedUsername}`;
    let balance = balances[balanceKey] || 0;
    
    // Initialize balance if new user
    if (!balances[balanceKey]) {
      if (role === 'buyer') {
        balance = 100; // Start buyers with $100
      } else if (role === 'seller') {
        balance = 0;
      } else if (role === 'admin') {
        balance = 10000; // Admin starts with $10k
      }
      balances[balanceKey] = balance;
      await mockDataStore.set('walletBalances', balances);
    }
    
    // Ensure balance is not negative or NaN
    if (isNaN(balance) || balance < 0) {
      balance = 0;
      balances[balanceKey] = balance;
      await mockDataStore.set('walletBalances', balances);
    }
    
    return {
      success: true,
      data: {
        username: sanitizedUsername,
        balance: Math.round(balance * 100) / 100,
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
    
    try {
      const validatedData = depositSchema.parse(data);
      
      const sanitizedUsername = sanitizeUsername(validatedData.username);
      if (!sanitizedUsername) {
        return {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid username format' },
        };
      }
      
      // Check if notes contain prohibited content
      if (validatedData.notes) {
        const notesCheck = securityService.checkContentSecurity(validatedData.notes);
        if (!notesCheck.safe) {
          return {
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Notes contain prohibited content' },
          };
        }
      }
      
      // Update balance
      const balances = await mockDataStore.get<Record<string, number>>('walletBalances', {});
      const balanceKey = `buyer_${sanitizedUsername}`;
      const currentBalance = balances[balanceKey] || 0;
      
      // Check for overflow
      if (currentBalance + validatedData.amount > 1000000) {
        return {
          success: false,
          error: { code: 'LIMIT_EXCEEDED', message: 'Balance limit exceeded' },
        };
      }
      
      balances[balanceKey] = currentBalance + validatedData.amount;
      await mockDataStore.set('walletBalances', balances);
      
      // Create transaction
      const transaction = generateTransaction(
        'deposit',
        validatedData.amount,
        undefined,
        sanitizedUsername,
        `Deposit via ${validatedData.method}${validatedData.notes ? ` - ${sanitizeStrict(validatedData.notes)}` : ''}`
      );
      
      // Store transaction
      const transactions = await mockDataStore.get<Transaction[]>('transactions', []);
      
      // Limit transactions per user
      const userTransactions = transactions.filter(t => t.from === sanitizedUsername || t.to === sanitizedUsername);
      if (userTransactions.length >= 10000) {
        // Remove oldest transaction
        const oldestIndex = transactions.findIndex(t => t.from === sanitizedUsername || t.to === sanitizedUsername);
        if (oldestIndex !== -1) {
          transactions.splice(oldestIndex, 1);
        }
      }
      
      transactions.push(transaction);
      await mockDataStore.set('transactions', transactions);
      
      return {
        success: true,
        data: transaction,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: { 
            code: 'VALIDATION_ERROR', 
            message: sanitizeStrict(error.errors[0].message) || 'Invalid deposit data' 
          },
        };
      }
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid deposit data' },
      };
    }
  },
  
  // Process withdrawal
  withdraw: async (method: string, endpoint: string, data?: any): Promise<ApiResponse<Transaction>> => {
    if (method !== 'POST') {
      return {
        success: false,
        error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' },
      };
    }
    
    try {
      const validatedData = withdrawSchema.parse(data);
      
      const sanitizedUsername = sanitizeUsername(validatedData.username);
      if (!sanitizedUsername) {
        return {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid username format' },
        };
      }
      
      // Check balance
      const balances = await mockDataStore.get<Record<string, number>>('walletBalances', {});
      const balanceKey = `seller_${sanitizedUsername}`;
      const currentBalance = balances[balanceKey] || 0;
      
      if (currentBalance < validatedData.amount) {
        return {
          success: false,
          error: { code: 'INSUFFICIENT_BALANCE', message: 'Insufficient balance' },
        };
      }
      
      // Update balance
      balances[balanceKey] = currentBalance - validatedData.amount;
      await mockDataStore.set('walletBalances', balances);
      
      // Create transaction
      const transaction = generateTransaction(
        'withdrawal',
        validatedData.amount,
        sanitizedUsername,
        undefined,
        'Withdrawal request'
      );
      transaction.status = 'pending'; // Withdrawals start as pending
      
      // Sanitize account details if provided
      if (validatedData.accountDetails) {
        transaction.metadata = {};
        for (const [key, value] of Object.entries(validatedData.accountDetails)) {
          const sanitizedKey = sanitizeStrict(key);
          const sanitizedValue = sanitizeStrict(String(value));
          if (sanitizedKey && sanitizedValue) {
            transaction.metadata[sanitizedKey] = sanitizedValue;
          }
        }
      }
      
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
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: { 
            code: 'VALIDATION_ERROR', 
            message: sanitizeStrict(error.errors[0].message) || 'Invalid withdrawal data' 
          },
        };
      }
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid withdrawal data' },
      };
    }
  },
  
  // Get transactions
  transactions: async (method: string, endpoint: string, data?: any, params?: Record<string, string>): Promise<ApiResponse<Transaction[]>> => {
    const username = params?.username;
    
    let sanitizedUsername: string | undefined;
    if (username) {
      sanitizedUsername = sanitizeUsername(username);
      if (!sanitizedUsername) {
        return {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid username format' },
        };
      }
    }
    
    let transactions = await mockDataStore.get<Transaction[]>('transactions', []);
    
    // Generate some initial transactions if empty
    if (transactions.length === 0 && sanitizedUsername) {
      const initialTransactions: Transaction[] = [
        generateTransaction('deposit', 100, undefined, sanitizedUsername, 'Initial deposit'),
        generateTransaction('purchase', 25, sanitizedUsername, 'alice', 'Purchase: Silk Set'),
        generateTransaction('tip', 5, sanitizedUsername, 'betty', 'Tip for great service'),
      ];
      
      transactions = initialTransactions;
      await mockDataStore.set('transactions', transactions);
    }
    
    // Filter by username if provided
    if (sanitizedUsername) {
      transactions = transactions.filter(t => 
        t.from === sanitizedUsername || t.to === sanitizedUsername
      );
    }
    
    // Apply filters with validation
    if (params?.type && ['deposit', 'withdrawal', 'purchase', 'tip', 'subscription', 'admin_action'].includes(params.type)) {
      transactions = transactions.filter(t => t.type === params.type);
    }
    
    if (params?.fromDate) {
      try {
        const fromDate = new Date(params.fromDate);
        if (!isNaN(fromDate.getTime())) {
          transactions = transactions.filter(t => 
            new Date(t.date) >= fromDate
          );
        }
      } catch (e) {
        // Invalid date, ignore filter
      }
    }
    
    if (params?.toDate) {
      try {
        const toDate = new Date(params.toDate);
        if (!isNaN(toDate.getTime())) {
          transactions = transactions.filter(t => 
            new Date(t.date) <= toDate
          );
        }
      } catch (e) {
        // Invalid date, ignore filter
      }
    }
    
    // Sort by date (newest first)
    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Apply pagination with validation
    const limit = Math.min(100, Math.max(1, parseInt(params?.limit || '50')));
    const offset = Math.max(0, parseInt(params?.offset || '0'));
    
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
    
    try {
      const validatedData = adminActionSchema.parse(data);
      
      // Sanitize usernames
      const adminUser = sanitizeUsername(validatedData.adminUser);
      const targetUser = sanitizeUsername(validatedData.targetUser);
      
      if (!adminUser || !targetUser) {
        return {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid username format' },
        };
      }
      
      // Verify admin role
      const users = await mockDataStore.get<Record<string, any>>('users', {});
      if (!users[adminUser] || users[adminUser].role !== 'admin') {
        return {
          success: false,
          error: { code: 'FORBIDDEN', message: 'Admin access required' },
        };
      }
      
      // Check reason content
      const reasonCheck = securityService.checkContentSecurity(validatedData.reason);
      if (!reasonCheck.safe) {
        return {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Reason contains prohibited content' },
        };
      }
      
      // Update balance
      const balances = await mockDataStore.get<Record<string, number>>('walletBalances', {});
      const balanceKey = `${validatedData.role}_${targetUser}`;
      const currentBalance = balances[balanceKey] || 0;
      
      let newBalance: number;
      if (validatedData.type === 'credit') {
        newBalance = currentBalance + validatedData.amount;
        // Check for overflow
        if (newBalance > 1000000) {
          return {
            success: false,
            error: { code: 'LIMIT_EXCEEDED', message: 'Balance limit exceeded' },
          };
        }
      } else {
        newBalance = currentBalance - validatedData.amount;
        // Check for underflow
        if (newBalance < 0) {
          return {
            success: false,
            error: { code: 'INSUFFICIENT_BALANCE', message: 'Would result in negative balance' },
          };
        }
      }
      
      balances[balanceKey] = newBalance;
      await mockDataStore.set('walletBalances', balances);
      
      // Create transaction
      const transaction = generateTransaction(
        'admin_action',
        validatedData.amount,
        validatedData.type === 'debit' ? targetUser : adminUser,
        validatedData.type === 'credit' ? targetUser : adminUser,
        `Admin ${validatedData.type}: ${sanitizeStrict(validatedData.reason)}` || `Admin ${validatedData.type}`
      );
      
      transaction.metadata = {
        adminUser,
        targetUser,
        role: validatedData.role,
        actionType: validatedData.type,
        reason: sanitizeStrict(validatedData.reason) || '',
      };
      
      // Store transaction
      const transactions = await mockDataStore.get<Transaction[]>('transactions', []);
      transactions.push(transaction);
      await mockDataStore.set('transactions', transactions);
      
      // Log admin action
      const adminLogs = await mockDataStore.get<any[]>('adminActionLogs', []);
      adminLogs.push({
        id: uuidv4(),
        adminUser,
        targetUser,
        action: `wallet_${validatedData.type}`,
        amount: validatedData.amount,
        reason: sanitizeStrict(validatedData.reason) || '',
        timestamp: new Date().toISOString(),
      });
      await mockDataStore.set('adminActionLogs', adminLogs);
      
      return {
        success: true,
        data: transaction,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: { 
            code: 'VALIDATION_ERROR', 
            message: sanitizeStrict(error.errors[0].message) || 'Invalid admin action data' 
          },
        };
      }
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid admin action' },
      };
    }
  },
} as const;