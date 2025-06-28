// src/utils/walletInitialization.ts
import { storageService } from '@/services';

interface Transaction {
  id: string;
  userId: string;
  walletType: 'buyer' | 'seller';
  type: 'deposit' | 'withdrawal' | 'purchase' | 'sale' | 'refund';
  amount: number;
  date: string;
  description?: string;
}

/**
 * Ensures a buyer has an initial deposit for development/testing
 * This is a helper function for the development environment
 */
export async function ensureBuyerHasInitialDeposit(username: string, amount: number = 1000): Promise<void> {
  try {
    // Get existing transactions
    const transactions = await storageService.getItem<Transaction[]>('wallet_transactions', []);
    
    // Check if user already has a deposit
    const hasDeposit = transactions.some(
      t => t.userId === username && 
      t.walletType === 'buyer' && 
      t.type === 'deposit'
    );
    
    if (!hasDeposit) {
      // Create initial deposit transaction
      const depositTransaction: Transaction = {
        id: `deposit_${Date.now()}`,
        userId: username,
        walletType: 'buyer',
        type: 'deposit',
        amount,
        date: new Date().toISOString(),
        description: 'Initial test deposit'
      };
      
      transactions.push(depositTransaction);
      await storageService.setItem('wallet_transactions', transactions);
      
      console.log(`Created initial deposit of $${amount} for buyer ${username}`);
    }
  } catch (error) {
    console.error('Error ensuring buyer deposit:', error);
  }
}
