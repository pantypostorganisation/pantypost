// src/hooks/useBuyerWallet.ts
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useWallet } from '@/context/WalletContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { WalletIntegration } from '@/services/wallet.integration';
import { WalletValidation } from '@/services/wallet.validation';
import { storageService } from '@/services/storage.service';
import { Money } from '@/types/common';
import { useRateLimit } from '@/utils/security/rate-limiter';
import { financialSchemas } from '@/utils/validation/schemas';
import { sanitizeCurrency, sanitizeStrict } from '@/utils/security/sanitization';
import { securityService } from '@/services';

interface EnhancedBuyerWalletState {
  balance: number;
  amountToAdd: string;
  message: string;
  messageType: 'success' | 'error' | '';
  isLoading: boolean;
  walletUpdateTrigger: number;
  availableBalance: number;
  pendingBalance: number;
  dailyDepositLimit: number;
  remainingDepositLimit: number;
  transactionHistory: any[];
  isLoadingHistory: boolean;
  validationErrors: string[];
  lastSyncTime: Date | null;
  rateLimitError: string | null;
}

export const useBuyerWallet = () => {
  const { user } = useAuth();
  const { 
    getBuyerBalance,
    setBuyerBalance, 
    orderHistory, 
    addDeposit,  // ← This is the WalletContext API method we should use
    getTransactionHistory,
    checkSuspiciousActivity,
    reconcileBalance,
    buyerBalances,
    isInitialized: walletInitialized,
  } = useWallet();
  const toast = useToast();
  
  // Rate limiting
  const { checkLimit: checkDepositLimit } = useRateLimit('DEPOSIT');
  
  const [state, setState] = useState<EnhancedBuyerWalletState>({
    balance: 0,
    availableBalance: 0,
    pendingBalance: 0,
    amountToAdd: '',
    message: '',
    messageType: '',
    isLoading: false,
    walletUpdateTrigger: 0,
    dailyDepositLimit: Money.toDollars(WalletValidation.LIMITS.DAILY_DEPOSIT_LIMIT),
    remainingDepositLimit: Money.toDollars(WalletValidation.LIMITS.DAILY_DEPOSIT_LIMIT),
    transactionHistory: [],
    isLoadingHistory: false,
    validationErrors: [],
    lastSyncTime: null,
    rateLimitError: null,
  });

  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityCheckRef = useRef<Date>(new Date());
  const initialSyncDone = useRef(false);

  // Get buyer's purchase history with sanitization
  const buyerPurchases = user?.username 
    ? orderHistory.filter(order => order.buyer === user.username)
    : [];
  
  // Sort purchases by date (newest first)
  const recentPurchases = [...buyerPurchases]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  // Calculate total spent with validation
  const totalSpent = buyerPurchases.reduce((sum, order) => {
    const price = order.markedUpPrice || order.price;
    // Validate price is a positive number
    if (typeof price === 'number' && price > 0) {
      return sum + price;
    }
    return sum;
  }, 0);

  // Update state helper with sanitization
  const updateState = useCallback((updates: Partial<EnhancedBuyerWalletState>) => {
    setState(prev => {
      // Sanitize string fields
      const sanitizedUpdates = { ...updates };
      if (updates.message) {
        sanitizedUpdates.message = sanitizeStrict(updates.message);
      }
      if (updates.rateLimitError) {
        sanitizedUpdates.rateLimitError = sanitizeStrict(updates.rateLimitError);
      }
      if (updates.validationErrors) {
        sanitizedUpdates.validationErrors = updates.validationErrors.map(err => sanitizeStrict(err));
      }
      return { ...prev, ...sanitizedUpdates };
    });
  }, []);

  // Force read balance from all storage locations
  const forceReadBalance = useCallback(async (username: string): Promise<number> => {
    try {
      console.log('[BuyerWallet] Force reading balance for:', username);
      
      // Try multiple sources to get the balance
      let balance = 0;
      
      // 1. Try WalletContext first
      const contextBalance = getBuyerBalance(username);
      console.log('[BuyerWallet] Context balance:', contextBalance);
      if (contextBalance > 0) {
        balance = contextBalance;
      }
      
      // 2. Try reading from collective storage
      const buyersData = await storageService.getItem<Record<string, number>>('wallet_buyers', {});
      console.log('[BuyerWallet] Buyers data from storage:', buyersData);
      if (buyersData[username] !== undefined && buyersData[username] > balance) {
        balance = buyersData[username];
      }
      
      // 3. Try reading from individual key (enhanced format)
      const individualKey = `wallet_buyer_${username}`;
      const individualBalance = await storageService.getItem<number>(individualKey, 0);
      console.log('[BuyerWallet] Individual balance (cents):', individualBalance);
      if (individualBalance > 0) {
        const dollarBalance = individualBalance / 100;
        if (dollarBalance > balance) {
          balance = dollarBalance;
        }
      }
      
      // 4. Check localStorage directly as fallback
      if (typeof localStorage !== 'undefined') {
        const lsBuyers = localStorage.getItem('wallet_buyers');
        if (lsBuyers) {
          try {
            const parsed = JSON.parse(lsBuyers);
            if (parsed[username] !== undefined && parsed[username] > balance) {
              balance = parsed[username];
              console.log('[BuyerWallet] Balance from localStorage:', balance);
            }
          } catch (e) {
            console.error('[BuyerWallet] Error parsing localStorage:', e);
          }
        }
        
        // Also check individual key in localStorage
        const lsIndividual = localStorage.getItem(individualKey);
        if (lsIndividual) {
          const cents = parseInt(lsIndividual);
          if (!isNaN(cents) && cents > 0) {
            const dollars = cents / 100;
            if (dollars > balance) {
              balance = dollars;
              console.log('[BuyerWallet] Balance from localStorage individual:', balance);
            }
          }
        }
      }
      
      console.log('[BuyerWallet] Final balance after checking all sources:', balance);
      return balance;
    } catch (error) {
      console.error('[BuyerWallet] Error force reading balance:', error);
      return 0;
    }
  }, [getBuyerBalance]);

  // Sync balance with enhanced service
  const syncBalance = useCallback(async () => {
    console.log('[BuyerWallet] syncBalance called for user:', user?.username);
    if (!user?.username) return;

    try {
      // Force read balance from all sources
      const balance = await forceReadBalance(user.username);
      console.log('[BuyerWallet] Force read balance result:', balance);
      
      // Update local state immediately
      updateState({
        balance: balance,
        availableBalance: balance,
        lastSyncTime: new Date(),
      });
      
      // If balance is greater than what's in context, update context
      const contextBalance = getBuyerBalance(user.username);
      if (balance > contextBalance) {
        console.log('[BuyerWallet] Updating context balance from', contextBalance, 'to', balance);
        await setBuyerBalance(user.username, balance);
      }
      
      // Get transaction history for additional info
      try {
        const history = await getTransactionHistory(user.username, 20);
        
        // Calculate daily limit usage
        const todaysDeposits = history.filter((t: any) => {
          const isDeposit = t.type === 'deposit' || (t.displayType === 'Deposit' && t.isCredit);
          const transactionDate = t.date || t.rawTransaction?.createdAt;
          if (!transactionDate) return false;
          const isToday = new Date(transactionDate).toDateString() === new Date().toDateString();
          return isDeposit && isToday;
        });
        
        const todaysDepositTotal = todaysDeposits.reduce((sum: number, t: any) => {
          const amount = t.amount || (t.rawTransaction?.amount ? Money.toDollars(t.rawTransaction.amount) : 0);
          if (typeof amount === 'number' && amount > 0) {
            return sum + amount;
          }
          return sum;
        }, 0);
        
        const remainingLimit = Money.toDollars(WalletValidation.LIMITS.DAILY_DEPOSIT_LIMIT) - todaysDepositTotal;
        
        updateState({
          remainingDepositLimit: Math.max(0, remainingLimit),
          transactionHistory: history,
        });
      } catch (historyError) {
        console.error('[BuyerWallet] Error getting transaction history:', historyError);
      }
      
    } catch (error) {
      console.error('[BuyerWallet] Balance sync error:', error);
      updateState({
        message: 'Failed to sync wallet. Please refresh the page.',
        messageType: 'error'
      });
    }
  }, [user, getBuyerBalance, setBuyerBalance, getTransactionHistory, updateState, forceReadBalance]);

  // Initial sync when wallet is initialized and user is available
  useEffect(() => {
    if (walletInitialized && user?.username && !initialSyncDone.current) {
      console.log('[BuyerWallet] Performing initial sync');
      initialSyncDone.current = true;
      syncBalance();
    }
  }, [walletInitialized, user?.username, syncBalance]);

  // Listen for changes in buyer balances
  useEffect(() => {
    if (user?.username && buyerBalances[user.username] !== undefined) {
      const newBalance = buyerBalances[user.username];
      if (Math.abs(newBalance - state.balance) > 0.01) {
        console.log('[BuyerWallet] Balance change detected:', newBalance);
        updateState({
          balance: newBalance,
          availableBalance: newBalance,
        });
      }
    }
  }, [buyerBalances, user?.username, state.balance, updateState]);

  // Listen for storage events (cross-tab sync)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'wallet_buyers' || (e.key && e.key.startsWith('wallet_buyer_'))) {
        console.log('[BuyerWallet] Storage change detected, syncing...');
        syncBalance();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [syncBalance]);

  // Periodic sync (every 15 seconds) - FIXED
  useEffect(() => {
    if (user?.username) {
      syncIntervalRef.current = setInterval(() => {
        syncBalance();
      }, 15000);
      
      return () => {
        if (syncIntervalRef.current) {
          clearInterval(syncIntervalRef.current);
        }
      };
    }
    return undefined; // Added explicit return for when condition is false
  }, [user?.username, syncBalance]);

  // 🔧 FIXED: Enhanced add funds - now uses WalletContext addDeposit directly
  const handleAddFunds = useCallback(async () => {
    // Check rate limit first
    const rateLimitResult = checkDepositLimit();
    if (!rateLimitResult.allowed) {
      updateState({
        rateLimitError: `Too many deposit attempts. Please wait ${rateLimitResult.waitTime} seconds.`,
        message: '',
        messageType: ''
      });
      return;
    }
    
    updateState({ 
      isLoading: true, 
      validationErrors: [],
      rateLimitError: null 
    });
    
    if (!user?.username) {
      updateState({ 
        message: 'You must be logged in to add funds.',
        messageType: 'error',
        isLoading: false
      });
      return;
    }

    // Validate amount using security service
    const validationResult = securityService.validateAmount(state.amountToAdd, {
      min: Money.toDollars(WalletValidation.LIMITS.MIN_DEPOSIT),
      max: Money.toDollars(WalletValidation.LIMITS.MAX_DEPOSIT),
      allowDecimals: true
    });

    if (!validationResult.valid || !validationResult.value) {
      updateState({ 
        message: validationResult.error || 'Invalid amount',
        messageType: 'error',
        isLoading: false,
        validationErrors: [validationResult.error || 'Invalid amount']
      });
      return;
    }

    const amount = validationResult.value;
    const amountInCents = Money.fromDollars(amount);

    // Check daily limit
    if (amount > state.remainingDepositLimit) {
      updateState({ 
        message: `Daily deposit limit exceeded. You can add up to $${state.remainingDepositLimit.toFixed(2)} today.`,
        messageType: 'error',
        isLoading: false,
        validationErrors: ['Daily limit exceeded']
      });
      return;
    }

    try {
      // Check for suspicious activity before processing
      const activityCheck = await checkSuspiciousActivity(user.username!);
      if (activityCheck.suspicious) {
        toast.warning(
          'Security Alert', 
          'Unusual activity detected. Please contact support if you need assistance.'
        );
      }

      // 🔧 FIXED: Use addDeposit directly instead of WalletIntegration.addFunds
      console.log('[BuyerWallet] Processing deposit via WalletContext addDeposit...');
      
      const depositSuccess = await addDeposit(
        user.username!,
        amount,
        'credit_card',
        sanitizeStrict('Wallet deposit via buyer dashboard')
      );
      
      if (depositSuccess) {
        // Wait a moment for the deposit to process
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Force sync balance
        await syncBalance();
        
        updateState({
          amountToAdd: '',
          message: `Successfully added ${Money.format(amountInCents)} to your wallet.`,
          messageType: 'success',
          isLoading: false
        });
        
        toast.success('Funds Added', `${Money.format(amountInCents)} has been added to your wallet`);
      } else {
        updateState({ 
          message: 'Failed to process deposit. Please try again.',
          messageType: 'error',
          isLoading: false
        });
      }
    } catch (error) {
      console.error('Add funds error:', error);
      updateState({ 
        message: 'An unexpected error occurred. Please try again.',
        messageType: 'error',
        isLoading: false
      });
    }

    // Clear message after 5 seconds
    setTimeout(() => {
      updateState({ 
        message: '', 
        messageType: '', 
        validationErrors: [],
        rateLimitError: null 
      });
    }, 5000);
  }, [state.amountToAdd, state.remainingDepositLimit, user, checkSuspiciousActivity, addDeposit, syncBalance, toast, updateState, checkDepositLimit]);

  // Validate amount as user types with sanitization
  const handleAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Allow empty string or valid decimal numbers
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      updateState({ amountToAdd: value });
      
      // Real-time validation
      if (value) {
        const validation = securityService.validateAmount(value, {
          min: Money.toDollars(WalletValidation.LIMITS.MIN_DEPOSIT),
          max: Money.toDollars(WalletValidation.LIMITS.MAX_DEPOSIT),
          allowDecimals: true
        });
        
        if (!validation.valid) {
          updateState({ validationErrors: [validation.error || 'Invalid amount'] });
        } else if (validation.value && validation.value > state.remainingDepositLimit) {
          updateState({ 
            validationErrors: [`Daily limit: $${state.remainingDepositLimit.toFixed(2)} remaining`] 
          });
        } else {
          updateState({ validationErrors: [] });
        }
      } else {
        updateState({ validationErrors: [] });
      }
    }
  }, [state.remainingDepositLimit, updateState]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && state.amountToAdd && !state.isLoading && state.validationErrors.length === 0) {
      handleAddFunds();
    }
  }, [state.amountToAdd, state.isLoading, state.validationErrors, handleAddFunds]);

  const handleQuickAmountSelect = useCallback((amount: string) => {
    // Validate the quick amount
    const validation = securityService.validateAmount(amount, {
      min: Money.toDollars(WalletValidation.LIMITS.MIN_DEPOSIT),
      max: Money.toDollars(WalletValidation.LIMITS.MAX_DEPOSIT),
      allowDecimals: true
    });

    if (!validation.valid || !validation.value) {
      toast.error('Invalid Amount', validation.error || 'Invalid amount selected');
      return;
    }

    const numAmount = validation.value;
    
    // Check if amount exceeds daily limit
    if (numAmount > state.remainingDepositLimit) {
      toast.warning(
        'Limit Exceeded', 
        `This amount exceeds your daily limit. Maximum: $${state.remainingDepositLimit.toFixed(2)}`
      );
      updateState({ 
        amountToAdd: state.remainingDepositLimit.toFixed(2),
        validationErrors: []
      });
    } else {
      updateState({ amountToAdd: amount, validationErrors: [] });
    }
  }, [state.remainingDepositLimit, toast, updateState]);

  // Load transaction history
  const loadTransactionHistory = useCallback(async () => {
    if (!user?.username) return;
    
    updateState({ isLoadingHistory: true });
    try {
      const history = await getTransactionHistory(user.username, 50);
      updateState({ 
        transactionHistory: history,
        isLoadingHistory: false 
      });
    } catch (error) {
      console.error('Error loading transaction history:', error);
      updateState({ 
        isLoadingHistory: false,
        message: 'Failed to load transaction history',
        messageType: 'error'
      });
    }
  }, [user, getTransactionHistory, updateState]);

  // Check for suspicious activity periodically
  useEffect(() => {
    const checkActivity = async () => {
      if (!user?.username) return;
      
      const now = new Date();
      const timeSinceLastCheck = now.getTime() - lastActivityCheckRef.current.getTime();
      
      // Check every 5 minutes
      if (timeSinceLastCheck > 5 * 60 * 1000) {
        try {
          const activityCheck = await checkSuspiciousActivity(user.username);
          if (activityCheck.suspicious) {
            toast.warning(
              'Security Notice',
              'Unusual activity detected on your account. Please review your recent transactions.'
            );
          }
          lastActivityCheckRef.current = now;
        } catch (error) {
          console.error('Activity check error:', error);
        }
      }
    };

    const interval = setInterval(checkActivity, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [user, checkSuspiciousActivity, toast]);

  // Format currency for display
  const formatCurrency = useCallback((amount: number): string => {
    // Validate amount is a number
    if (typeof amount !== 'number' || isNaN(amount)) {
      return '$0.00';
    }
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }, []);

  return {
    // State
    ...state,
    
    // Computed values
    buyerPurchases,
    recentPurchases,
    totalSpent,
    user,
    
    // Formatted values
    formattedBalance: formatCurrency(state.balance),
    formattedAvailableBalance: formatCurrency(state.availableBalance),
    formattedPendingBalance: formatCurrency(state.pendingBalance),
    formattedTotalSpent: formatCurrency(totalSpent),
    formattedDailyLimit: formatCurrency(state.dailyDepositLimit),
    formattedRemainingLimit: formatCurrency(state.remainingDepositLimit),
    
    // Actions
    handleAddFunds,
    handleAmountChange,
    handleKeyPress,
    handleQuickAmountSelect,
    loadTransactionHistory,
    syncBalance,
    
    // Utilities
    formatCurrency,
  };
};
