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
}

export const useBuyerWallet = () => {
  const { user } = useAuth();
  const { 
    getBuyerBalance,
    setBuyerBalance, 
    orderHistory, 
    addDeposit,
    getTransactionHistory,
    checkSuspiciousActivity,
    reconcileBalance,
  } = useWallet();
  const toast = useToast();
  
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
  });

  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityCheckRef = useRef<Date>(new Date());

  // Get buyer's purchase history
  const buyerPurchases = user?.username 
    ? orderHistory.filter(order => order.buyer === user.username)
    : [];
  
  // Sort purchases by date (newest first)
  const recentPurchases = [...buyerPurchases]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  // Calculate total spent
  const totalSpent = buyerPurchases.reduce((sum, order) => sum + (order.markedUpPrice || order.price), 0);

  // Update state helper
  const updateState = useCallback((updates: Partial<EnhancedBuyerWalletState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Sync balance with enhanced service
  const syncBalance = useCallback(async () => {
    console.log('syncBalance called for user:', user?.username);
    if (!user?.username) return;

    try {
      // Get detailed balance from enhanced service
      const balance = await WalletIntegration.getBalanceInDollars(user.username, 'buyer');
      console.log('Balance from WalletIntegration:', balance);
      
      // Get transaction history for pending calculations
      const history = await getTransactionHistory(user.username, 20);
      
      // Calculate daily limit usage
      const todaysDeposits = history.filter((t: any) => {
        const isDeposit = t.displayType === 'Deposit' && t.isCredit;
        const isToday = new Date(t.rawTransaction.createdAt).toDateString() === new Date().toDateString();
        return isDeposit && isToday;
      });
      
      const todaysDepositTotal = todaysDeposits.reduce((sum: number, t: any) => 
        sum + Money.toDollars(t.rawTransaction.amount), 0
      );
      
      const remainingLimit = Money.toDollars(WalletValidation.LIMITS.DAILY_DEPOSIT_LIMIT) - todaysDepositTotal;
      
      updateState({
        balance,
        availableBalance: balance, // Enhanced service handles pending
        pendingBalance: 0, // Will be calculated by enhanced service
        remainingDepositLimit: Math.max(0, remainingLimit),
        transactionHistory: history,
        lastSyncTime: new Date(),
      });
      
      // Update WalletContext so header shows correct balance
      console.log('Updating WalletContext balance:', { username: user.username, balance });
      await setBuyerBalance(user.username, balance);
      
      // IMPORTANT: Also update the wallet_buyers storage that WalletContext reads from
      const buyers = await storageService.getItem<Record<string, number>>("wallet_buyers", {});
      buyers[user.username] = balance; // balance is already in dollars from WalletIntegration
      await storageService.setItem("wallet_buyers", buyers);
      
      // Also update the individual key that enhanced service uses (in cents)
      const balanceInCents = Math.round(balance * 100);
      await storageService.setItem(`wallet_buyer_${user.username}`, balanceInCents);
      
      console.log('WalletContext balance updated successfully in both states:', {
        username: user.username,
        balanceInDollars: balance,
        balanceInCents: balanceInCents,
        buyers: buyers
      });
    } catch (error) {
      console.error('Balance sync error:', error);
    }
  }, [user, getTransactionHistory, updateState, setBuyerBalance]);

  // Create a ref to always have the latest syncBalance function
  const syncBalanceRef = useRef(syncBalance);
  syncBalanceRef.current = syncBalance;

  // Initial sync and periodic updates - FIXED: removed syncBalance from dependencies
  useEffect(() => {
    if (user?.username) {
      // Call the ref version to avoid dependency issues
      syncBalanceRef.current();
      
      // Sync every 30 seconds using ref
      syncIntervalRef.current = setInterval(() => {
        syncBalanceRef.current();
      }, 30000);
      
      return () => {
        if (syncIntervalRef.current) {
          clearInterval(syncIntervalRef.current);
        }
      };
    }
    // Return undefined when user is not logged in
    return undefined;
  }, [user?.username]); // Only depend on username changing

  // Enhanced add funds with validation
  const handleAddFunds = useCallback(async () => {
    updateState({ isLoading: true, validationErrors: [] });
    const amount = parseFloat(state.amountToAdd);
    
    if (!user?.username) {
      updateState({ 
        message: 'You must be logged in to add funds.',
        messageType: 'error',
        isLoading: false
      });
      return;
    }

    // Validate amount using enhanced validation
    const amountInCents = Money.fromDollars(amount);
    const validation = WalletValidation.validateAmount(
      amountInCents,
      WalletValidation.LIMITS.MIN_DEPOSIT,
      WalletValidation.LIMITS.MAX_DEPOSIT
    );

    if (!validation.valid) {
      updateState({ 
        message: validation.error!,
        messageType: 'error',
        isLoading: false,
        validationErrors: [validation.error!]
      });
      return;
    }

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

      // Process deposit using enhanced service
      const success = await WalletIntegration.addFunds(
        user.username!,
        amount,
        'credit_card'
      );
      
      if (success) {
        // Sync balance immediately using ref
        await syncBalanceRef.current();
        
        updateState({
          amountToAdd: '',
          message: `Successfully added ${Money.format(amountInCents)} to your wallet.`,
          messageType: 'success',
          isLoading: false
        });
        
        toast.success('Funds Added', `${Money.format(amountInCents)} has been added to your wallet`);
        
        // Check if reconciliation is needed
        const reconciliation = await reconcileBalance(user.username!, 'buyer');
        if (!reconciliation.isReconciled) {
          console.warn('Balance reconciliation needed:', reconciliation);
        }
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
      updateState({ message: '', messageType: '', validationErrors: [] });
    }, 5000);
  }, [state.amountToAdd, state.remainingDepositLimit, user, checkSuspiciousActivity, reconcileBalance, toast, updateState]);

  // Validate amount as user types
  const handleAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Allow empty string or valid decimal numbers
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      updateState({ amountToAdd: value });
      
      // Real-time validation
      if (value) {
        const amount = parseFloat(value);
        if (!isNaN(amount)) {
          const amountInCents = Money.fromDollars(amount);
          const validation = WalletValidation.validateAmount(
            amountInCents,
            WalletValidation.LIMITS.MIN_DEPOSIT,
            WalletValidation.LIMITS.MAX_DEPOSIT
          );
          
          if (!validation.valid) {
            updateState({ validationErrors: [validation.error!] });
          } else if (amount > state.remainingDepositLimit) {
            updateState({ 
              validationErrors: [`Daily limit: $${state.remainingDepositLimit.toFixed(2)} remaining`] 
            });
          } else {
            updateState({ validationErrors: [] });
          }
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
    const numAmount = parseFloat(amount);
    
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
      updateState({ isLoadingHistory: false });
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
        const activityCheck = await checkSuspiciousActivity(user.username);
        if (activityCheck.suspicious) {
          toast.warning(
            'Security Notice',
            'Unusual activity detected on your account. Please review your recent transactions.'
          );
        }
        lastActivityCheckRef.current = now;
      }
    };

    const interval = setInterval(checkActivity, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [user, checkSuspiciousActivity, toast]);

  // Format currency for display
  const formatCurrency = useCallback((amount: number): string => {
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