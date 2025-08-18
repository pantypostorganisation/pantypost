// src/context/WalletContext.tsx
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useRef,
} from "react";
import { v4 as uuidv4 } from 'uuid';
import { sanitizeStrict, sanitizeUsername, sanitizeCurrency } from '@/utils/security/sanitization';
import { getRateLimiter, RATE_LIMITS } from '@/utils/security/rate-limiter';
import { financialSchemas } from '@/utils/validation/schemas';
import { z } from 'zod';
import { useWebSocket } from '@/context/WebSocketContext';
import { WebSocketEvent } from '@/types/websocket';
import { useAuth } from '@/context/AuthContext';
import { securityService } from '@/services/security.service';

// Import shared types
import type { Order, DeliveryAddress, Listing, CustomRequestPurchase, DepositLog } from '@/types/order';

// Re-export types for backward compatibility
export type { Order, DeliveryAddress, Listing, CustomRequestPurchase, DepositLog };

// Debug mode helper
const DEBUG_MODE = process.env.NEXT_PUBLIC_DEBUG === 'true';
const debugLog = (...args: any[]) => {
  if (DEBUG_MODE) {
    console.log('[WalletContext]', ...args);
  }
};

type Withdrawal = {
  amount: number;
  date: string;
  status?: 'pending' | 'completed' | 'failed';
  method?: string;
};

type AdminAction = {
  id?: string;
  _id?: string;
  type: 'credit' | 'debit';
  amount: number;
  targetUser?: string;
  username?: string;
  adminUser?: string;
  reason: string;
  date: string;
  role?: 'buyer' | 'seller';
  metadata?: any;
};

// Validation schemas for wallet operations
const walletOperationSchemas = {
  transactionAmount: z.number().positive().min(0.01).max(100000),
  balanceAmount: z.number().min(0).max(100000),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/),
  reason: z.string().min(1).max(500),
  withdrawalAmount: z.number().positive().min(10).max(10000),
  tipAmount: z.number().positive().min(1).max(500),
  depositMethod: z.enum(['credit_card', 'bank_transfer', 'crypto', 'admin_credit']),
};

// Enhanced deduplication manager with configurable expiry
class DeduplicationManager {
  private processedEvents: Map<string, number> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private expiryMs: number;

  constructor(expiryMs: number = 30000) {
    this.expiryMs = expiryMs;
    this.startCleanup();
  }

  private startCleanup() {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const expiredKeys: string[] = [];
      
      this.processedEvents.forEach((timestamp, key) => {
        if (now - timestamp > this.expiryMs) {
          expiredKeys.push(key);
        }
      });
      
      expiredKeys.forEach(key => this.processedEvents.delete(key));
    }, 10000); // Cleanup every 10 seconds
  }

  isDuplicate(eventType: string, data: any): boolean {
    // Create composite key based on event type
    let key: string;
    
    if (eventType === 'balance_update') {
      key = `${eventType}_${data.username}_${data.balance || data.newBalance}_${data.timestamp || Date.now()}`;
    } else if (eventType === 'transaction') {
      key = `${eventType}_${data.id || data.transactionId}_${data.from}_${data.to}_${data.amount}`;
    } else {
      key = `${eventType}_${JSON.stringify(data)}`;
    }
    
    if (this.processedEvents.has(key)) {
      return true;
    }
    
    this.processedEvents.set(key, Date.now());
    return false;
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.processedEvents.clear();
  }
}

// Helper function to check if user is admin
const isAdminUser = (username: string): boolean => {
  return username === 'oakley' || 
         username === 'gerome' || 
         username === 'platform' ||
         username === 'admin';
};

// Transaction throttle manager
class ThrottleManager {
  private lastCallTimes: Map<string, number> = new Map();
  
  shouldThrottle(key: string, minIntervalMs: number = 3000): boolean {
    const now = Date.now();
    const lastCall = this.lastCallTimes.get(key) || 0;
    
    if (now - lastCall < minIntervalMs) {
      return true;
    }
    
    this.lastCallTimes.set(key, now);
    return false;
  }
  
  clear() {
    this.lastCallTimes.clear();
  }
}

type WalletContextType = {
  // Loading state
  isLoading: boolean;
  isInitialized: boolean;
  initializationError: string | null;
  
  // Balances (cached from API)
  buyerBalances: { [username: string]: number };
  adminBalance: number;
  sellerBalances: { [username: string]: number };
  
  // Balance operations
  setBuyerBalance: (username: string, balance: number) => Promise<void>;
  getBuyerBalance: (username: string) => number;
  setAdminBalance: (balance: number) => Promise<void>;
  setSellerBalance: (seller: string, balance: number) => Promise<void>;
  getSellerBalance: (seller: string) => number;
  
  // Purchase operations
  purchaseListing: (listing: Listing, buyerUsername: string) => Promise<boolean>;
  purchaseCustomRequest: (customRequest: CustomRequestPurchase) => Promise<boolean>;
  subscribeToSellerWithPayment: (buyer: string, seller: string, amount: number) => Promise<boolean>;
  unsubscribeFromSeller: (buyer: string, seller: string) => Promise<boolean>;
  
  // Order management
  orderHistory: Order[];
  addOrder: (order: Order) => Promise<void>;
  
  // Withdrawals
  sellerWithdrawals: { [username: string]: Withdrawal[] };
  adminWithdrawals: Withdrawal[];
  addSellerWithdrawal: (username: string, amount: number) => Promise<void>;
  addAdminWithdrawal: (amount: number) => Promise<void>;
  
  // Legacy wallet interface
  wallet: { [username: string]: number };
  updateWallet: (username: string, amount: number, orderToFulfil?: Order) => void;
  
  // Tips and notifications
  sendTip: (buyer: string, seller: string, amount: number, message?: string) => Promise<boolean>;
  setAddSellerNotificationCallback?: (fn: (seller: string, message: string) => void) => void;
  
  // Admin actions
  adminCreditUser: (username: string, role: 'buyer' | 'seller', amount: number, reason: string) => Promise<boolean>;
  adminDebitUser: (username: string, role: 'buyer' | 'seller', amount: number, reason: string) => Promise<boolean>;
  adminActions: AdminAction[];
  
  // Order updates
  updateOrderAddress: (orderId: string, address: DeliveryAddress) => Promise<void>;
  updateShippingStatus: (orderId: string, status: 'pending' | 'processing' | 'shipped') => Promise<void>;
  
  // Deposits
  depositLogs: DepositLog[];
  addDeposit: (username: string, amount: number, method: DepositLog['method'], notes?: string) => Promise<boolean>;
  getDepositsForUser: (username: string) => DepositLog[];
  getTotalDeposits: () => number;
  getDepositsByTimeframe: (timeframe: 'today' | 'week' | 'month' | 'year' | 'all') => DepositLog[];
  
  // Auction methods
  holdBidFunds: (listingId: string, bidder: string, amount: number, auctionTitle: string) => Promise<boolean>;
  refundBidFunds: (bidder: string, listingId: string) => Promise<boolean>;
  finalizeAuctionPurchase: (listing: Listing, winnerUsername: string, winningBid: number) => Promise<boolean>;
  placeBid: (listingId: string, bidder: string, amount: number) => Promise<boolean>;
  chargeIncrementalBid: (listingId: string, bidder: string, previousBid: number, newBid: number, listingTitle: string) => Promise<boolean>;
  getAuctionBidders: (listingId: string) => Promise<string[]>;
  cleanupAuctionTracking: (listingId: string, winner?: string) => Promise<void>;
  
  // Enhanced features
 checkSuspiciousActivity: (username: string) => Promise<{ suspicious: boolean; reasons: string[] }>;
 reconcileBalance: (username: string, role: 'buyer' | 'seller' | 'admin') => Promise<any>;
 getTransactionHistory: (username?: string, limit?: number) => Promise<any[]>;
 
 // Admin-specific methods
 refreshAdminData: () => Promise<void>;
 getPlatformTransactions: (limit?: number, page?: number) => Promise<any[]>;
 getAnalyticsData: (timeFilter?: string) => Promise<any>;
 
 // Data management
 reloadData: () => Promise<void>;
};

export const WalletContext = createContext<WalletContextType | undefined>(undefined);

// Transaction lock manager for preventing race conditions
class TransactionLockManager {
 private locks: Map<string, Promise<any>> = new Map();

 async acquireLock<T>(key: string, operation: () => Promise<T>): Promise<T> {
   const existingLock = this.locks.get(key);
   if (existingLock) {
     await existingLock;
   }

   let result: T;
   const lockPromise = operation()
     .then(res => {
       result = res;
       return res;
     })
     .finally(() => {
       this.locks.delete(key);
     });

   this.locks.set(key, lockPromise);
   await lockPromise;
   return result!;
 }

 isLocked(key: string): boolean {
   return this.locks.has(key);
 }
}

export function WalletProvider({ children }: { children: ReactNode }) {
 const { user, getAuthToken, apiClient } = useAuth();
 const webSocketContext = useWebSocket();
 
 // Extract properties from WebSocket context safely
 const sendMessage = webSocketContext?.sendMessage;
 const subscribe = webSocketContext?.subscribe;
 const isConnected = webSocketContext?.isConnected || false;
 
 // State management - these will be populated from API
 const [buyerBalances, setBuyerBalancesState] = useState<{ [username: string]: number }>({});
 const [adminBalance, setAdminBalanceState] = useState<number>(0);
 const [sellerBalances, setSellerBalancesState] = useState<{ [username: string]: number }>({});
 const [orderHistory, setOrderHistory] = useState<Order[]>([]);
 const [sellerWithdrawals, setSellerWithdrawals] = useState<{ [username: string]: Withdrawal[] }>({});
 const [adminWithdrawals, setAdminWithdrawals] = useState<Withdrawal[]>([]);
 const [adminActions, setAdminActions] = useState<AdminAction[]>([]);
 const [depositLogs, setDepositLogs] = useState<DepositLog[]>([]);
 const [addSellerNotification, setAddSellerNotification] = useState<((seller: string, message: string) => void) | null>(null);
 
 // Loading and initialization state
 const [isLoading, setIsLoading] = useState(true);
 const [isInitialized, setIsInitialized] = useState(false);
 const [initializationError, setInitializationError] = useState<string | null>(null);
 
 // Refs
 const initializingRef = useRef(false);
 const rateLimiter = useRef(getRateLimiter());
 const transactionLock = useRef(new TransactionLockManager());
 const deduplicationManager = useRef(new DeduplicationManager(30000)); // 30 second expiry
 const throttleManager = useRef(new ThrottleManager());

 const setAddSellerNotificationCallback = (fn: (seller: string, message: string) => void) => {
   setAddSellerNotification(() => fn);
 };

 // Cleanup on unmount
 useEffect(() => {
   return () => {
     deduplicationManager.current.destroy();
     throttleManager.current.clear();
   };
 }, []);

 // FIX 1: Helper function to ALWAYS fire admin balance update event
 const fireAdminBalanceUpdateEvent = useCallback((balance: number) => {
   if (typeof window !== 'undefined') {
     debugLog('Firing admin balance update event:', balance);
     window.dispatchEvent(new CustomEvent('wallet:admin-balance-updated', {
       detail: { balance, timestamp: Date.now() }
     }));
   }
 }, []);

 // CRITICAL FIX: Fetch admin actions from API
 const fetchAdminActions = useCallback(async (): Promise<void> => {
   if (!user || (user.role !== 'admin' && !isAdminUser(user.username))) {
     debugLog('Not admin user, skipping admin actions fetch');
     return;
   }

   try {
     debugLog('Fetching admin actions...');
     
     const response = await apiClient.get<any>('/admin/actions?limit=100');
     
     debugLog('Admin actions response:', response);
     
     if (response.success && response.data) {
       // Normalize the admin actions data
       const normalizedActions = response.data.map((action: any) => ({
         id: action._id || action.id,
         _id: action._id || action.id,
         type: action.type,
         amount: action.amount,
         reason: action.reason,
         date: action.date,
         metadata: action.metadata || {},
         targetUser: action.metadata?.seller || action.metadata?.username,
         username: action.metadata?.seller || action.metadata?.username,
         adminUser: action.adminUser || 'platform',
         role: action.metadata?.role
       }));
       
       setAdminActions(normalizedActions);
       debugLog('Admin actions loaded:', normalizedActions.length);
     } else {
       console.warn('[WalletContext] Admin actions fetch failed:', response.error);
     }
   } catch (error) {
     console.error('[WalletContext] Error fetching admin actions:', error);
   }
 }, [user, apiClient]);

 // WebSocket event handlers (extracted from useEffect for readability)
 const handleWalletBalanceUpdate = useCallback((data: any) => {
   debugLog('Received wallet:balance_update:', data);
   
   // Check for duplicate
   if (deduplicationManager.current.isDuplicate('balance_update', data)) {
     debugLog('Skipping duplicate balance update');
     return;
   }
   
   // Validate incoming data with security service
   try {
     // Sanitize username
     const sanitizedUsername = data.username ? sanitizeUsername(data.username) : null;
     if (!sanitizedUsername) {
       console.error('[WalletContext] Invalid username in balance update');
       return;
     }
     
     // FIX: Handle different data structures from WebSocket
     let balanceValue: number;
     
     // Check if balance is provided directly
     if (typeof data.balance === 'number') {
       balanceValue = data.balance;
     }
     // Check if it's in newBalance field (from backend WebSocket emit)
     else if (typeof data.newBalance === 'number') {
       balanceValue = data.newBalance;
     }
     // Check if it's nested in a data object
     else if (data.data && typeof data.data.balance === 'number') {
       balanceValue = data.data.balance;
     }
     // Default to 0 if no valid balance found
     else {
       console.warn('[WalletContext] No valid balance in update data:', data);
       balanceValue = 0;
     }
     
     // Validate balance amount
     const balanceValidation = walletOperationSchemas.balanceAmount.safeParse(balanceValue);
     if (!balanceValidation.success) {
       console.error('[WalletContext] Invalid balance amount:', balanceValidation.error);
       return;
     }
     
     const validatedBalance = balanceValidation.data;
     
     // Process the balance update based on role
     if (data.role === 'admin' || sanitizedUsername === 'platform' || isAdminUser(sanitizedUsername)) {
       // Admin balance update
       if (user && (user.role === 'admin' || isAdminUser(user.username))) {
         debugLog('Updating admin balance to:', validatedBalance);
         setAdminBalanceState(validatedBalance);
         
         // FIX 1: ALWAYS fire event for admin balance changes
         fireAdminBalanceUpdateEvent(validatedBalance);
       }
     } else if (data.role === 'buyer') {
       // Update buyer balance
       setBuyerBalancesState(prev => ({
         ...prev,
         [sanitizedUsername]: validatedBalance
       }));
       
       // Fire event if current user
       if (user && user.username === sanitizedUsername) {
         window.dispatchEvent(new CustomEvent('wallet:buyer-balance-updated', {
           detail: { balance: validatedBalance, timestamp: Date.now() }
         }));
       }
     } else if (data.role === 'seller') {
       // Update seller balance
       setSellerBalancesState(prev => ({
         ...prev,
         [sanitizedUsername]: validatedBalance
       }));
       
       // Fire event if current user
       if (user && user.username === sanitizedUsername) {
         window.dispatchEvent(new CustomEvent('wallet:seller-balance-updated', {
           detail: { balance: validatedBalance, timestamp: Date.now() }
         }));
       }
     }
   } catch (error) {
     console.error('[WalletContext] Error processing balance update:', error);
   }
 }, [user, fireAdminBalanceUpdateEvent]);

 const handlePlatformBalanceUpdate = useCallback((data: any) => {
   debugLog('Received platform:balance_update:', data);
   
   // Check for duplicate
   if (deduplicationManager.current.isDuplicate('platform_balance', data)) {
     debugLog('Skipping duplicate platform balance update');
     return;
   }
   
   // Handle different data structures
   let balanceValue: number;
   
   if (typeof data.balance === 'number') {
     balanceValue = data.balance;
   } else if (typeof data.newBalance === 'number') {
     balanceValue = data.newBalance;
   } else if (data.data && typeof data.data.balance === 'number') {
     balanceValue = data.data.balance;
   } else {
     console.warn('[WalletContext] No valid balance in platform update:', data);
     balanceValue = 0;
   }
   
   // Validate balance
   const balanceValidation = walletOperationSchemas.balanceAmount.safeParse(balanceValue);
   if (!balanceValidation.success) {
     console.error('[WalletContext] Invalid platform balance:', balanceValidation.error);
     return;
   }
   
   // If current user is admin, update admin balance
   if (user && (user.role === 'admin' || isAdminUser(user.username))) {
     const newBalance = balanceValidation.data;
     debugLog('Updating platform balance to:', newBalance);
     setAdminBalanceState(newBalance);
     
     // FIX 1: ALWAYS fire event for admin balance changes
     fireAdminBalanceUpdateEvent(newBalance);
   }
 }, [user, fireAdminBalanceUpdateEvent]);

 const handleWalletTransaction = useCallback(async (data: any) => {
   debugLog('Received wallet:transaction:', data);
   
   // Check for duplicate
   if (deduplicationManager.current.isDuplicate('transaction', data)) {
     debugLog('Skipping duplicate transaction');
     return;
   }
   
   // Validate transaction data
   try {
     // Sanitize usernames if present
     const sanitizedFrom = data.from ? sanitizeUsername(data.from) : null;
     const sanitizedTo = data.to ? sanitizeUsername(data.to) : null;
     
     // Validate amount if present
     if (data.amount !== undefined) {
       const amountValidation = walletOperationSchemas.transactionAmount.safeParse(data.amount);
       if (!amountValidation.success) {
         console.error('[WalletContext] Invalid transaction amount:', amountValidation.error);
         return;
       }
     }
     
     // If transaction involves current user, refresh their transaction history (with throttling)
     if (user && (sanitizedFrom === user.username || sanitizedTo === user.username)) {
       if (!throttleManager.current.shouldThrottle('transaction_history', 5000)) {
         await fetchTransactionHistory(user.username);
       } else {
         debugLog('Throttled transaction history refresh');
       }
     }
     
     // If transaction involves platform and user is admin, refresh admin data
     if ((sanitizedFrom === 'platform' || sanitizedTo === 'platform') && 
         user && (user.role === 'admin' || isAdminUser(user.username))) {
       if (!throttleManager.current.shouldThrottle('admin_platform_balance', 3000)) {
         await fetchAdminPlatformBalance();
         // CRITICAL: Also refresh admin actions to get tier credit updates
         await fetchAdminActions();
       } else {
         debugLog('Throttled admin platform balance refresh');
       }
     }
   } catch (error) {
     console.error('[WalletContext] Error processing transaction:', error);
   }
 }, [user]);

 // Fetch transaction history from API (define before using in handleWalletTransaction)
 const fetchTransactionHistory = useCallback(async (username: string) => {
   try {
     debugLog('Fetching transactions for:', username);
     
     // For admin users, fetch platform transactions
     const queryUsername = isAdminUser(username) ? 'platform' : username;
     
     const response = await apiClient.get<any>(`/wallet/transactions/${queryUsername}`);
     
     debugLog('Transactions response:', response);
     
     if (response.success && response.data) {
       // Convert transactions to our order format
       const orders = response.data
         .filter((tx: any) => tx.type === 'purchase' || tx.type === 'sale')
         .map((tx: any) => ({
           id: tx.id,
           title: tx.description,
           description: tx.description,
           price: tx.amount,
           markedUpPrice: tx.amount,
           date: tx.createdAt || tx.date,
           seller: tx.toRole === 'seller' ? tx.to : tx.from,
           buyer: tx.fromRole === 'buyer' ? tx.from : tx.to,
           shippingStatus: tx.status === 'completed' ? 'pending' : 'pending-auction',
           // CRITICAL: Include tier information if available
           sellerTier: tx.metadata?.sellerTier,
           tierCreditAmount: tx.metadata?.tierBonus || 0
         }));
       
       setOrderHistory(orders);
       debugLog('Transaction history updated:', orders.length, 'orders');
     }
   } catch (error) {
     console.error('[WalletContext] Failed to fetch transaction history:', error);
   }
 }, [apiClient]);

 // Fetch admin platform wallet balance (define before using in handleWalletTransaction)
 const fetchAdminPlatformBalance = useCallback(async (): Promise<number> => {
   if (!user || (user.role !== 'admin' && !isAdminUser(user.username))) {
     debugLog('Not admin user, skipping platform balance fetch');
     return 0;
   }

   try {
     debugLog('Fetching unified admin platform wallet balance...');
     
     // Always use the unified endpoint
     const response = await apiClient.get<any>('/wallet/admin-platform-balance');
     
     debugLog('Unified platform balance response:', response);
     
     if (response.success && response.data) {
       const balance = response.data.balance || 0;
       debugLog('Unified platform wallet balance:', balance);
       
       // Set this as THE admin balance for all admin users
       setAdminBalanceState(balance);
       
       // FIX 1: ALWAYS fire event when fetching admin balance
       fireAdminBalanceUpdateEvent(balance);
       
       return balance;
     }
     
     console.warn('[WalletContext] Platform balance fetch failed:', response.error);
     return 0;
   } catch (error) {
     console.error('[WalletContext] Error fetching platform balance:', error);
     return 0;
   }
 }, [user, apiClient, fireAdminBalanceUpdateEvent]);

 // Consolidated WebSocket subscriptions
 useEffect(() => {
   if (!isConnected || !subscribe) return;

   debugLog('Setting up WebSocket subscriptions for wallet updates');

   // Subscribe to wallet:balance_update events
   const unsubBalance = subscribe('wallet:balance_update' as WebSocketEvent, handleWalletBalanceUpdate);

   // Subscribe to platform:balance_update events
   const unsubPlatform = subscribe('platform:balance_update' as WebSocketEvent, handlePlatformBalanceUpdate);

   // Subscribe to wallet:transaction events
   const unsubTransaction = subscribe('wallet:transaction' as WebSocketEvent, handleWalletTransaction);

   // Cleanup subscriptions
   return () => {
     unsubBalance();
     unsubPlatform();
     unsubTransaction();
   };
 }, [isConnected, subscribe, handleWalletBalanceUpdate, handlePlatformBalanceUpdate, handleWalletTransaction]);

 // Listen to custom WebSocket balance updates via events (backward compatibility)
 useEffect(() => {
   if (typeof window === 'undefined') return;

   const handleBalanceUpdate = (event: CustomEvent) => {
     const data = event.detail;
     debugLog('Received custom balance update event:', data);
     handleWalletBalanceUpdate(data);
   };

   const handleTransaction = (event: CustomEvent) => {
     debugLog('Received custom transaction event:', event.detail);
     handleWalletTransaction(event.detail);
   };

   // Listen for custom events from other components
   window.addEventListener('wallet:balance_update', handleBalanceUpdate as EventListener);
   window.addEventListener('wallet:transaction', handleTransaction as EventListener);

   return () => {
     window.removeEventListener('wallet:balance_update', handleBalanceUpdate as EventListener);
     window.removeEventListener('wallet:transaction', handleTransaction as EventListener);
   };
 }, [handleWalletBalanceUpdate, handleWalletTransaction]);

 // Helper to emit wallet balance updates
 const emitBalanceUpdate = useCallback((username: string, role: 'buyer' | 'seller' | 'admin', balance: number) => {
   if (isConnected && sendMessage) {
     sendMessage(WebSocketEvent.WALLET_BALANCE_UPDATE, {
       username,
       role,
       balance,
       timestamp: Date.now()
     });
   }
 }, [isConnected, sendMessage]);

 // Send tip function
 const sendTip = useCallback(async (
   fromUsername: string, 
   toUsername: string, 
   amount: number,
   message?: string
 ): Promise<boolean> => {
   try {
     checkRateLimit('TIP', fromUsername);
     
     // Input validation
     if (!fromUsername || !toUsername || amount <= 0) {
       console.error('[Wallet] Invalid tip parameters');
       return false;
     }
     
     // Validate and sanitize inputs
     const validatedFrom = validateUsername(fromUsername);
     const validatedTo = validateUsername(toUsername);
     const validatedAmount = validateTransactionAmount(amount);
     
     // Additional tip-specific validation
     const tipValidation = walletOperationSchemas.tipAmount.safeParse(validatedAmount);
     if (!tipValidation.success) {
       console.error('[Wallet] Invalid tip amount:', tipValidation.error);
       return false;
     }
     
     // Check balance locally first
     const senderBalance = buyerBalances[validatedFrom] || 0;
     if (senderBalance < validatedAmount) {
       console.error('[Wallet] Insufficient balance for tip');
       return false;
     }
     
     // Send tip to backend
     const response = await apiClient.post<any>('/tips/send', {
       amount: validatedAmount,
       recipientUsername: validatedTo,
       message: message ? sanitizeStrict(message) : undefined
     });
     
     if (!response.success) {
       console.error('[Wallet] Tip failed:', response.error);
       return false;
     }
     
     // Update local state optimistically
     setBuyerBalancesState(prev => ({
       ...prev,
       [validatedFrom]: prev[validatedFrom] - validatedAmount
     }));
     
     setSellerBalancesState(prev => ({
       ...prev,
       [validatedTo]: (prev[validatedTo] || 0) + validatedAmount
     }));
     
     // Emit balance updates
     emitBalanceUpdate(validatedFrom, 'buyer', senderBalance - validatedAmount);
     emitBalanceUpdate(validatedTo, 'seller', (sellerBalances[validatedTo] || 0) + validatedAmount);
     
     // Log the transaction locally
     const tipLog: DepositLog = {
       id: response.data?.transaction?.id || uuidv4(),
       username: validatedFrom,
       amount: validatedAmount,
       method: 'credit_card',
       date: new Date().toISOString(),
       status: 'completed',
       transactionId: response.data?.transaction?.id || uuidv4(),
       notes: `Tip to ${validatedTo}`,
     };
     
     setDepositLogs(prev => [...prev, tipLog]);
     
     debugLog(`[Wallet] Tip sent: $${validatedAmount} from ${validatedFrom} to ${validatedTo}`);
     return true;
     
   } catch (error) {
     console.error('[Wallet] Error sending tip:', error);
     return false;
   }
 }, [buyerBalances, sellerBalances, apiClient, emitBalanceUpdate]);

 // Rest of the implementation continues unchanged...
 // I'll include the remaining methods that were in the original file

 // Fetch balance from API
 const fetchBalance = useCallback(async (username: string): Promise<number> => {
   try {
     debugLog('Fetching balance for:', username);
     
     // For admin users, always fetch platform wallet
     if (isAdminUser(username)) {
       debugLog('Admin user detected, fetching unified platform wallet');
       
       const response = await apiClient.get<any>('/wallet/admin-platform-balance');
       
       if (response.success && response.data) {
         const balance = response.data.balance || 0;
         debugLog('Unified platform wallet balance:', balance);
         return balance;
       }
       
       console.warn('[WalletContext] Platform balance fetch failed:', response.error);
       return 0;
     }
     
     // For regular users, fetch their individual wallet
     const response = await apiClient.get<any>(`/wallet/balance/${username}`);
     
     debugLog('Balance response:', response);
     
     if (response.success && response.data) {
       return response.data.balance || 0;
     }
     
     console.warn('[WalletContext] Balance fetch failed:', response.error);
     return 0;
   } catch (error) {
     console.error(`[WalletContext] Failed to fetch balance for ${username}:`, error);
     return 0;
   }
 }, [apiClient]);

 // Get platform transactions
 const getPlatformTransactions = useCallback(async (limit: number = 100, page: number = 1): Promise<any[]> => {
   if (!user || (user.role !== 'admin' && !isAdminUser(user.username))) {
     debugLog('Not admin user, skipping platform transactions fetch');
     return [];
   }

   try {
     debugLog('Fetching platform transactions...');
     
     const response = await apiClient.get<any>(`/wallet/platform-transactions?limit=${limit}&page=${page}`);
     
     debugLog('Platform transactions response:', response);
     
     if (response.success && response.data) {
       return response.data;
     }
     
     console.warn('[WalletContext] Platform transactions fetch failed:', response.error);
     return [];
   } catch (error) {
     console.error('[WalletContext] Error fetching platform transactions:', error);
     return [];
   }
 }, [user, apiClient]);

 // Fetch complete admin analytics data
 const fetchAdminAnalytics = useCallback(async (timeFilter: string = 'all'): Promise<any> => {
   if (!user || (user.role !== 'admin' && !isAdminUser(user.username))) {
     debugLog('Not admin user, skipping analytics fetch');
     return null;
   }

   try {
     debugLog('Fetching admin analytics data with filter:', timeFilter);
     
     const response = await apiClient.get<any>(`/wallet/admin/analytics?timeFilter=${timeFilter}`);
     
     debugLog('Admin analytics response:', response);
     
     if (response.success && response.data) {
       const data = response.data;
       
       // Update all the state variables with the fetched data
       // IMPORTANT: Admin balance is the unified platform wallet balance
       setAdminBalanceState(data.adminBalance);
       
       // FIX 1: Fire event when analytics updates admin balance
       fireAdminBalanceUpdateEvent(data.adminBalance);
       
       setOrderHistory(data.orderHistory);
       setDepositLogs(data.depositLogs);
       setSellerWithdrawals(data.sellerWithdrawals);
       setAdminWithdrawals(data.adminWithdrawals);
       
       // CRITICAL: If adminActions are included in the response, use them
       // Otherwise, fetch them separately
       if (data.adminActions && data.adminActions.length > 0) {
         setAdminActions(data.adminActions);
       } else {
         // Fetch admin actions separately if not included
         await fetchAdminActions();
       }
       
       // Update wallet balances
       if (data.wallet) {
         Object.entries(data.wallet).forEach(([username, balance]) => {
           if (data.users[username]) {
             const userRole = data.users[username].role;
             // Skip admin users as they use unified balance
             if (userRole === 'admin' || isAdminUser(username)) {
               // Don't set individual balances for admin users
               return;
             } else if (userRole === 'buyer') {
               setBuyerBalancesState(prev => ({ ...prev, [username]: balance as number }));
             } else if (userRole === 'seller') {
               setSellerBalancesState(prev => ({ ...prev, [username]: balance as number }));
             }
           }
         });
       }
       
       debugLog('Analytics data loaded:', {
         adminBalance: data.adminBalance,
         orders: data.orderHistory.length,
         deposits: data.depositLogs.length,
         adminActions: adminActions.length,
         summary: data.summary
       });
       
       return data;
     }
     
     console.warn('[WalletContext] Analytics fetch failed:', response.error);
     return null;
   } catch (error) {
     console.error('[WalletContext] Error fetching analytics:', error);
     return null;
   }
 }, [user, apiClient, fireAdminBalanceUpdateEvent, fetchAdminActions, adminActions.length]);

 // Get analytics data with time filter
 const getAnalyticsData = useCallback(async (timeFilter: string = 'all') => {
   if (!user || (user.role !== 'admin' && !isAdminUser(user.username))) {
     debugLog('Not admin, cannot get analytics');
     return null;
   }
   
   return await fetchAdminAnalytics(timeFilter);
 }, [user, fetchAdminAnalytics]);

 // Load all data from API with admin analytics support
 const loadAllData = useCallback(async () => {
   if (!user) {
     debugLog('No user, skipping data load');
     return false;
   }

   try {
     debugLog('Loading wallet data from API for user:', user.username);
     
     // For admin users, always fetch unified platform wallet
     if (user.role === 'admin' || isAdminUser(user.username)) {
       debugLog('Admin detected - fetching unified platform wallet...');
       
       // Fetch unified platform balance
       const platformBalance = await fetchAdminPlatformBalance();
       
       // CRITICAL: Fetch admin actions for tier credit tracking
       await fetchAdminActions();
       
       // Also fetch analytics data if needed
       const analyticsData = await fetchAdminAnalytics('all');
       
       if (analyticsData) {
         // Override the admin balance with unified platform balance
         setAdminBalanceState(platformBalance);
         
         // FIX 1: Fire event on initial load
         fireAdminBalanceUpdateEvent(platformBalance);
         
         debugLog('Admin analytics loaded with unified balance:', platformBalance);
       }
       
       return true;
     }
     
     // For non-admin users, fetch regular wallet data
     const balance = await fetchBalance(user.username);
     debugLog('Fetched balance:', balance, 'for role:', user.role);
     
     if (user.role === 'buyer') {
       setBuyerBalancesState(prev => ({ ...prev, [user.username]: balance }));
     } else if (user.role === 'seller') {
       setSellerBalancesState(prev => ({ ...prev, [user.username]: balance }));
     }
     
     // Fetch transaction history
     await fetchTransactionHistory(user.username);
     
     debugLog('Data loaded successfully');
     return true;
   } catch (error) {
     console.error('[WalletContext] Error loading wallet data:', error);
     setInitializationError('Failed to load wallet data');
     return false;
   }
 }, [user, fetchBalance, fetchAdminPlatformBalance, fetchAdminAnalytics, fetchTransactionHistory, fireAdminBalanceUpdateEvent, fetchAdminActions]);

 // Refresh admin data specifically using analytics endpoint
 const refreshAdminData = useCallback(async () => {
   if (!user || (user.role !== 'admin' && !isAdminUser(user.username))) {
     debugLog('Not admin, skipping admin data refresh');
     return;
   }
   
   try {
     debugLog('Refreshing admin data...');
     
     // Fetch unified platform balance
     const platformBalance = await fetchAdminPlatformBalance();
     
     // CRITICAL: Fetch admin actions including tier credits
     await fetchAdminActions();
     
     // Fetch complete analytics data
     const analyticsData = await fetchAdminAnalytics('all');
     
     if (analyticsData) {
       // Ensure unified balance is used
       setAdminBalanceState(platformBalance);
       
       // FIX 1: Fire event on refresh
       fireAdminBalanceUpdateEvent(platformBalance);
       
       debugLog('Admin data refreshed with unified balance:', platformBalance);
     } else {
       console.error('[WalletContext] Failed to refresh admin data');
     }
   } catch (error) {
     console.error('[WalletContext] Error refreshing admin data:', error);
   }
 }, [user, fetchAdminPlatformBalance, fetchAdminAnalytics, fireAdminBalanceUpdateEvent, fetchAdminActions]);

 // Initialize wallet when user logs in
 useEffect(() => {
   const initializeWallet = async () => {
     if (initializingRef.current || !user) {
       return;
     }
     
     initializingRef.current = true;
     setIsLoading(true);
     setInitializationError(null);

     try {
       debugLog('Initializing wallet for user:', user.username);
       
       const loadSuccess = await loadAllData();
       
       if (loadSuccess) {
         setIsInitialized(true);
         debugLog('Wallet initialization complete');
       }
     } catch (error) {
       console.error('[WalletContext] Initialization error:', error);
       setInitializationError(error instanceof Error ? error.message : 'Unknown error');
     } finally {
       setIsLoading(false);
       initializingRef.current = false;
     }
   };

   if (user) {
     initializeWallet();
   } else {
     // Clear wallet data when user logs out
     setBuyerBalancesState({});
     setSellerBalancesState({});
     setAdminBalanceState(0);
     setOrderHistory([]);
     setIsInitialized(false);
     deduplicationManager.current.destroy();
     deduplicationManager.current = new DeduplicationManager(30000);
     throttleManager.current.clear();
   }
 }, [user, loadAllData]);

 // Helper function to validate amounts
 const validateTransactionAmount = (amount: number): number => {
   const validation = walletOperationSchemas.transactionAmount.safeParse(amount);
   if (!validation.success) {
     throw new Error('Invalid transaction amount: ' + validation.error.errors[0]?.message);
   }
   return sanitizeCurrency(validation.data);
 };

 const validateUsername = (username: string): string => {
   const validation = walletOperationSchemas.username.safeParse(username);
   if (!validation.success) {
     throw new Error('Invalid username: ' + validation.error.errors[0]?.message);
   }
   return sanitizeUsername(validation.data);
 };

 // Check rate limit
 const checkRateLimit = (operation: string, identifier?: string): void => {
   const rateLimitConfig = RATE_LIMITS[operation as keyof typeof RATE_LIMITS] || RATE_LIMITS.API_CALL;
   const result = rateLimiter.current.check(operation, { ...rateLimitConfig, identifier });
   
   if (!result.allowed) {
     throw new Error(`Rate limit exceeded. Please wait ${result.waitTime} seconds before trying again.`);
   }
 };

 // Balance getters (from cached state)
 const getBuyerBalance = useCallback((username: string): number => {
   try {
     const validatedUsername = validateUsername(username);
     // Admin users don't have buyer balances
     if (isAdminUser(validatedUsername)) {
       return 0;
     }
     return buyerBalances[validatedUsername] || 0;
   } catch {
     return 0;
   }
 }, [buyerBalances]);

 const getSellerBalance = useCallback((seller: string): number => {
   try {
     const validatedSeller = validateUsername(seller);
     // Admin users don't have seller balances
     if (isAdminUser(validatedSeller)) {
       return 0;
     }
     return sellerBalances[validatedSeller] || 0;
   } catch {
     return 0;
   }
 }, [sellerBalances]);

 // Balance setters (update cache and call API)
 const setBuyerBalance = useCallback(async (username: string, balance: number) => {
   // Don't set buyer balance for admin users
   if (isAdminUser(username)) {
     debugLog('Skipping buyer balance update for admin user');
     return;
   }
   
   const validatedUsername = validateUsername(username);
   
   // Update local cache immediately
   setBuyerBalancesState((prev) => ({
     ...prev,
     [validatedUsername]: balance,
   }));
   
   // Emit WebSocket update
   emitBalanceUpdate(validatedUsername, 'buyer', balance);
 }, [emitBalanceUpdate]);

 const setSellerBalance = useCallback(async (seller: string, balance: number) => {
   // Don't set seller balance for admin users
   if (isAdminUser(seller)) {
     debugLog('Skipping seller balance update for admin user');
     return;
   }
   
   const validatedSeller = validateUsername(seller);
   
   // Update local cache immediately
   setSellerBalancesState((prev) => ({
     ...prev,
     [validatedSeller]: balance,
   }));
   
   // Emit WebSocket update
   emitBalanceUpdate(validatedSeller, 'seller', balance);
 }, [emitBalanceUpdate]);

 const setAdminBalance = useCallback(async (balance: number) => {
   setAdminBalanceState(balance);
   
   // FIX 1: Fire event when setting admin balance
   fireAdminBalanceUpdateEvent(balance);
   
   // Emit WebSocket update for platform wallet
   emitBalanceUpdate('platform', 'admin', balance);
 }, [emitBalanceUpdate, fireAdminBalanceUpdateEvent]);

 // Create order via API
 const addOrder = useCallback(async (order: Order) => {
   try {
     debugLog('Creating order via API:', order);
     
     const orderPayload = {
       title: order.title,
       description: order.description,
       price: order.price,
       markedUpPrice: order.markedUpPrice,
       seller: order.seller,
       buyer: order.buyer,
       tags: order.tags || [],
       wasAuction: order.wasAuction || false,
       imageUrl: order.imageUrl,
       listingId: order.listingId,
       deliveryAddress: order.deliveryAddress || {
         fullName: 'John Doe',
         addressLine1: '123 Main St',
         city: 'New York',
         state: 'NY',
         postalCode: '10001',
         country: 'US',
       },
     };

     debugLog('Order payload:', orderPayload);

     const response = await apiClient.post<any>('/orders', orderPayload);

     debugLog('Order creation response:', response);

     if (response.success && response.data) {
       // Include tier information in the order
       const orderWithTier = {
         ...response.data,
         sellerTier: response.data.sellerTier,
         tierCreditAmount: response.data.tierCreditAmount || 0
       };
       
       setOrderHistory((prev) => [...prev, orderWithTier]);
       
       // Only fetch current user's balance after order creation
       if (user?.username) {
         const newBalance = await fetchBalance(user.username);
         
         if (user.role === 'buyer') {
           setBuyerBalancesState(prev => ({ ...prev, [user.username]: newBalance }));
         } else if (user.role === 'seller') {
           setSellerBalancesState(prev => ({ ...prev, [user.username]: newBalance }));
         } else if (user.role === 'admin' || isAdminUser(user.username)) {
           // For admin users, refresh platform balance AND admin actions
           await refreshAdminData();
         }
       }
       
       // CRITICAL: If current user is admin, refresh admin actions to get tier credits
       if (user?.role === 'admin' || isAdminUser(user?.username || '')) {
         await fetchAdminActions();
       }
       
       // Refresh transaction history for current user only
       if (user?.username) {
         if (!throttleManager.current.shouldThrottle('order_transaction_history', 3000)) {
           await fetchTransactionHistory(user.username);
         }
       }
       
       debugLog('Order created and balance updated');
     } else {
       const errorMessage = response.error?.message || response.error || 'Order creation failed';
       console.error('[WalletContext] Order creation failed:', errorMessage);
       throw new Error(errorMessage);
     }
   } catch (error) {
     console.error('[WalletContext] Failed to create order:', error);
     throw error;
   }
 }, [apiClient, fetchBalance, fetchTransactionHistory, refreshAdminData, user, fetchAdminActions]);

 // Make a deposit via API
 const addDeposit = useCallback(async (
   username: string, 
   amount: number, 
   method: DepositLog['method'], 
   notes?: string
 ): Promise<boolean> => {
   try {
     checkRateLimit('DEPOSIT', username);
     
     const validatedUsername = validateUsername(username);
     const validatedAmount = validateTransactionAmount(amount);
     
     debugLog('Processing deposit via API:', {
       username: validatedUsername,
       amount: validatedAmount,
       method,
       authUser: user?.username
     });
     
     const response = await apiClient.post<any>('/wallet/deposit', {
       amount: validatedAmount,
       method,
       notes,
     });
     
     debugLog('Deposit response:', response);
     
     if (response.success) {
       // Wait a moment for the transaction to be processed
       await new Promise(resolve => setTimeout(resolve, 500));
       
       // Refresh balance after deposit
       const newBalance = await fetchBalance(validatedUsername);
       debugLog('New balance after deposit:', newBalance);
       
       if (!isAdminUser(validatedUsername)) {
         setBuyerBalancesState(prev => ({ ...prev, [validatedUsername]: newBalance }));
       }
       
       // Add to local deposit logs
       const depositLog: DepositLog = {
         id: response.data?.id || uuidv4(),
         username: validatedUsername,
         amount: validatedAmount,
         method,
         date: response.data?.createdAt || new Date().toISOString(),
         status: 'completed',
         transactionId: response.data?.id || uuidv4(),
         notes,
       };
       
       setDepositLogs(prev => [...prev, depositLog]);
       
       // Emit WebSocket event for real-time update
       if (!isAdminUser(validatedUsername)) {
         emitBalanceUpdate(validatedUsername, 'buyer', newBalance);
       }
       
       debugLog('Deposit successful');
       return true;
     } else {
       console.error('[WalletContext] Deposit failed:', response.error);
       if (response.error?.message) {
         throw new Error(response.error.message);
       }
       return false;
     }
   } catch (error) {
     console.error('[WalletContext] Error processing deposit:', error);
     throw error;
   }
 }, [apiClient, fetchBalance, emitBalanceUpdate, user]);

 // Purchase listing with proper error handling
 const purchaseListing = useCallback(async (listing: Listing, buyerUsername: string): Promise<boolean> => {
   try {
     checkRateLimit('API_CALL', buyerUsername);
     
     const validatedBuyer = validateUsername(buyerUsername);
     const validatedSeller = validateUsername(listing.seller);
     
     // Validate price with security service
     const priceValidation = securityService.validateAmount(listing.price, {
       min: 0.01,
       max: 100000
     });
     
     if (!priceValidation.valid) {
       throw new Error(priceValidation.error || 'Invalid listing price');
     }
     
     debugLog('Processing purchase:', {
       buyer: validatedBuyer,
       seller: validatedSeller,
       listing: listing.title,
       price: listing.price,
       markedUpPrice: listing.markedUpPrice
     });
     
     await addOrder({
       id: listing.id || uuidv4(),
       title: listing.title,
       description: listing.description,
       price: listing.price,
       markedUpPrice: listing.markedUpPrice || listing.price,
       seller: validatedSeller,
       buyer: validatedBuyer,
       imageUrl: listing.imageUrls?.[0],
       date: new Date().toISOString(),
       shippingStatus: 'pending',
       tags: listing.tags || [],
       listingId: listing.id,
       deliveryAddress: {
         fullName: 'John Doe',
         addressLine1: '123 Main St',
         city: 'New York',
         state: 'NY',
         postalCode: '10001',
         country: 'US',
       },
     });
     
     // Notification
     if (addSellerNotification) {
       addSellerNotification(
         validatedSeller,
         `New sale: "${listing.title}" for ${listing.price.toFixed(2)}`
       );
     }
     
     debugLog('Purchase successful');
     return true;
   } catch (error) {
     console.error('[Purchase] Error:', error);
     throw error;
   }
 }, [addOrder, addSellerNotification]);

 // Withdraw funds via API
 const addSellerWithdrawal = useCallback(async (username: string, amount: number) => {
   try {
     checkRateLimit('WITHDRAWAL', username);
     
     const validatedUsername = validateUsername(username);
     const validatedAmount = validateTransactionAmount(amount);
     
     debugLog('Processing withdrawal via API:', {
       username: validatedUsername,
       amount: validatedAmount
     });
     
     const response = await apiClient.post<any>('/wallet/withdraw', {
       username: validatedUsername,
       amount: validatedAmount,
       accountDetails: {
         accountNumber: '****1234',
         routingNumber: '123456789',
         accountType: 'checking',
       },
     });
     
     debugLog('Withdrawal response:', response);
     
     if (response.success) {
       const newWithdrawal: Withdrawal = { 
         amount: validatedAmount, 
         date: response.data?.createdAt || new Date().toISOString(), 
         status: response.data?.status || 'pending'
       };
       
       setSellerWithdrawals((prev) => ({
         ...prev,
         [validatedUsername]: [...(prev[validatedUsername] || []), newWithdrawal],
       }));
       
       // Refresh balance
       const newBalance = await fetchBalance(validatedUsername);
       if (!isAdminUser(validatedUsername)) {
         setSellerBalancesState(prev => ({ ...prev, [validatedUsername]: newBalance }));
       }
       
       debugLog('Withdrawal successful');
     } else {
       console.error('[WalletContext] Withdrawal failed:', response.error);
       throw new Error(response.error?.message || 'Withdrawal failed');
     }
   } catch (error) {
     console.error('[WalletContext] Withdrawal error:', error);
     throw error;
   }
 }, [apiClient, fetchBalance]);

 // Admin credit via API
 const adminCreditUser = useCallback(async (
   username: string,
   role: 'buyer' | 'seller',
   amount: number,
   reason: string
 ): Promise<boolean> => {
   try {
     checkRateLimit('REPORT_ACTION', 'admin');
     
     const validatedUsername = validateUsername(username);
     const validatedAmount = validateTransactionAmount(amount);
     const sanitizedReason = sanitizeStrict(reason);
     
     debugLog('Processing admin credit via API:', {
       username: validatedUsername,
       role,
       amount: validatedAmount,
       reason: sanitizedReason
     });
     
     const response = await apiClient.post<any>('/wallet/admin-actions', {
       action: 'credit',
       username: validatedUsername,
       amount: validatedAmount,
       reason: sanitizedReason,
       adminUsername: user?.username || 'platform',
     });
     
     debugLog('Admin credit response:', response);
     
     if (response.success) {
       // Refresh balance
       const newBalance = await fetchBalance(validatedUsername);
       
       if (role === 'buyer' && !isAdminUser(validatedUsername)) {
         setBuyerBalancesState(prev => ({ ...prev, [validatedUsername]: newBalance }));
       } else if (role === 'seller' && !isAdminUser(validatedUsername)) {
         setSellerBalancesState(prev => ({ ...prev, [validatedUsername]: newBalance }));
       }
       
       // Refresh platform balance after admin action
       if (user?.role === 'admin' || isAdminUser(user?.username || '')) {
         await fetchAdminPlatformBalance();
         // CRITICAL: Refresh admin actions after credit
         await fetchAdminActions();
       }
       
       // Update admin actions locally
       const action: AdminAction = {
         id: response.data?.id || uuidv4(),
         type: 'credit',
         amount: validatedAmount,
         targetUser: validatedUsername,
         username: validatedUsername,
         adminUser: user?.username || 'platform',
         reason: sanitizedReason,
         date: response.data?.createdAt || new Date().toISOString(),
         role,
       };
       
       setAdminActions(prev => [...prev, action]);
       
       debugLog('Admin credit successful');
       return true;
     }
     
     console.error('[WalletContext] Admin credit failed:', response.error);
     return false;
   } catch (error) {
     console.error('Admin credit error:', error);
     return false;
   }
 }, [user, apiClient, fetchBalance, fetchAdminPlatformBalance, fetchAdminActions]);

 // Admin debit via API
 const adminDebitUser = useCallback(async (
   username: string,
   role: 'buyer' | 'seller',
   amount: number,
   reason: string
 ): Promise<boolean> => {
   try {
     checkRateLimit('REPORT_ACTION', 'admin');
     
     const validatedUsername = validateUsername(username);
     const validatedAmount = validateTransactionAmount(amount);
     const sanitizedReason = sanitizeStrict(reason);
     
     debugLog('Processing admin debit via API:', {
       username: validatedUsername,
       role,
       amount: validatedAmount,
       reason: sanitizedReason
     });
     
     const response = await apiClient.post<any>('/wallet/admin-actions', {
       action: 'debit',
       username: validatedUsername,
       amount: validatedAmount,
       reason: sanitizedReason,
       adminUsername: user?.username || 'platform',
     });
     
     debugLog('Admin debit response:', response);
     
     if (response.success) {
       // Refresh balance
       const newBalance = await fetchBalance(validatedUsername);
       
       if (role === 'buyer' && !isAdminUser(validatedUsername)) {
         setBuyerBalancesState(prev => ({ ...prev, [validatedUsername]: newBalance }));
       } else if (role === 'seller' && !isAdminUser(validatedUsername)) {
         setSellerBalancesState(prev => ({ ...prev, [validatedUsername]: newBalance }));
       }
       
       // Refresh platform balance after admin action
       if (user?.role === 'admin' || isAdminUser(user?.username || '')) {
         await fetchAdminPlatformBalance();
         // CRITICAL: Refresh admin actions after debit
         await fetchAdminActions();
       }
       
       // Update admin actions locally
       const action: AdminAction = {
         id: response.data?.id || uuidv4(),
         type: 'debit',
         amount: validatedAmount,
         targetUser: validatedUsername,
         username: validatedUsername,
         adminUser: user?.username || 'platform',
         reason: sanitizedReason,
         date: response.data?.createdAt || new Date().toISOString(),
         role,
       };
       
       setAdminActions(prev => [...prev, action]);
       
       debugLog('Admin debit successful');
       return true;
     }
     
     console.error('[WalletContext] Admin debit failed:', response.error);
     return false;
   } catch (error) {
     console.error('Admin debit error:', error);
     return false;
   }
 }, [user, apiClient, fetchBalance, fetchAdminPlatformBalance, fetchAdminActions]);

 // Get transaction history from API
 const getTransactionHistory = useCallback(async (username?: string, limit?: number) => {
   try {
     const targetUsername = username || user?.username;
     if (!targetUsername) {
       console.warn('[WalletContext] No username for transaction history');
       return [];
     }
     
     // For admin users, use platform
     const queryUsername = isAdminUser(targetUsername) ? 'platform' : targetUsername;
     
     const endpoint = `/wallet/transactions/${queryUsername}${limit ? `?limit=${limit}` : ''}`;
     debugLog('Fetching transaction history:', endpoint);
     
     const response = await apiClient.get<any>(endpoint);
     
     debugLog('Transaction history response:', response);
     
     if (response.success && response.data) {
       return response.data;
     }
     
     return [];
   } catch (error) {
     console.error('Error getting transaction history:', error);
     return [];
   }
 }, [apiClient, user]);

 // Reload all data
 const reloadData = useCallback(async () => {
   if (isLoading) {
     debugLog('Already loading, skipping reload');
     return;
   }
   
   setIsLoading(true);
   try {
     await loadAllData();
     // CRITICAL: For admin users, also refresh admin actions
     if (user?.role === 'admin' || isAdminUser(user?.username || '')) {
       await fetchAdminActions();
     }
   } finally {
     setIsLoading(false);
   }
 }, [loadAllData, isLoading, user, fetchAdminActions]);

 // Subscription payment via API
 const subscribeToSellerWithPayment = useCallback(async (
   buyer: string,
   seller: string,
   amount: number
 ): Promise<boolean> => {
   try {
     debugLog('Processing subscription via API:', { buyer, seller, amount });
     
     const response = await apiClient.post<any>('/subscriptions/subscribe', {
       seller, 
       price: amount
     });
     
     debugLog('Subscription response:', response);
     
     if (response.success) {
       // Refresh buyer balance
       const newBalance = await fetchBalance(buyer);
       if (!isAdminUser(buyer)) {
         setBuyerBalancesState(prev => ({ ...prev, [buyer]: newBalance }));
       }
       return true;
     }
     
     return false;
   } catch (error) {
     console.error('Subscription error:', error);
     return false;
   }
 }, [apiClient, fetchBalance]);

 // Unsubscribe from seller via API
 const unsubscribeFromSeller = useCallback(async (
   buyer: string,
   seller: string
 ): Promise<boolean> => {
   try {
     debugLog('Processing unsubscribe via API:', { buyer, seller });
     
     const response = await apiClient.post<any>('/subscriptions/unsubscribe', {
       seller
     });
     
     debugLog('Unsubscribe response:', response);
     
     if (response.success) {
       debugLog('Successfully unsubscribed');
      
      // Optionally refresh buyer balance to reflect any changes
      if (buyer === user?.username) {
        const newBalance = await fetchBalance(buyer);
        if (!isAdminUser(buyer)) {
          setBuyerBalancesState(prev => ({ ...prev, [buyer]: newBalance }));
        }
      }
      
      return true;
    }
    
    console.error('[WalletContext] Unsubscribe failed:', response.error);
    return false;
  } catch (error) {
    console.error('[WalletContext] Unsubscribe error:', error);
    return false;
  }
}, [apiClient, fetchBalance, user]);

// Stub implementation for custom request purchase
const purchaseCustomRequest = useCallback(async (customRequest: CustomRequestPurchase): Promise<boolean> => {
  debugLog('Custom request purchase - using mock implementation');
  return false;
}, []);

// Admin withdrawal
const addAdminWithdrawal = useCallback(async (amount: number) => {
  try {
    debugLog('Processing admin withdrawal from unified platform wallet');
    
    const response = await apiClient.post<any>('/wallet/admin-withdraw', {
      amount,
      accountDetails: {
        accountNumber: '****9999',
        accountType: 'business'
      },
      notes: `Platform withdrawal by ${user?.username}`
    });
    
    if (response.success) {
      const withdrawal: Withdrawal = {
        amount,
        date: new Date().toISOString(),
        status: 'completed',
        method: 'bank_transfer'
      };
      
      setAdminWithdrawals(prev => [...prev, withdrawal]);
      
      // Refresh unified platform balance
      await fetchAdminPlatformBalance();
      
      debugLog('Admin withdrawal successful');
    } else {
      console.error('[WalletContext] Admin withdrawal failed:', response.error);
      throw new Error(response.error?.message || 'Withdrawal failed');
    }
  } catch (error) {
    console.error('[WalletContext] Admin withdrawal error:', error);
    throw error;
  }
}, [apiClient, fetchAdminPlatformBalance, user]);

// Auction-related stubs
const holdBidFunds = useCallback(async (): Promise<boolean> => {
  debugLog('Auction features not fully implemented in API yet');
  return false;
}, []);

const refundBidFunds = useCallback(async (): Promise<boolean> => {
  debugLog('Auction features not fully implemented in API yet');
  return false;
}, []);

const placeBid = useCallback(async (): Promise<boolean> => {
  debugLog('Auction features not fully implemented in API yet');
  return false;
}, []);

const finalizeAuctionPurchase = useCallback(async (): Promise<boolean> => {
  debugLog('Auction features not fully implemented in API yet');
  return false;
}, []);

// Enhanced features stubs
const checkSuspiciousActivity = useCallback(async (username: string) => {
  return { suspicious: false, reasons: [] };
}, []);

const reconcileBalance = useCallback(async (username: string, role: 'buyer' | 'seller' | 'admin') => {
  return null;
}, []);

const contextValue: WalletContextType = {
  // Loading state
  isLoading,
  isInitialized,
  initializationError,
  
  // Core functionality
  buyerBalances,
  adminBalance,
  sellerBalances,
  setBuyerBalance,
  getBuyerBalance,
  setAdminBalance,
  setSellerBalance,
  getSellerBalance,
  purchaseListing,
  purchaseCustomRequest,
  subscribeToSellerWithPayment,
  unsubscribeFromSeller,
  orderHistory,
  addOrder,
  sellerWithdrawals,
  adminWithdrawals,
  addSellerWithdrawal,
  addAdminWithdrawal,
  wallet: { ...buyerBalances, ...sellerBalances, admin: adminBalance },
  updateWallet: () => { console.warn('updateWallet is deprecated - use API methods instead'); },
  sendTip,
  setAddSellerNotificationCallback,
  adminCreditUser,
  adminDebitUser,
  adminActions,
  updateOrderAddress: async () => { debugLog('Order address update not implemented yet'); },
  updateShippingStatus: async () => { debugLog('Shipping status update not implemented yet'); },
  depositLogs,
  addDeposit,
  getDepositsForUser: (username: string) => depositLogs.filter(log => log.username === username),
  getTotalDeposits: () => depositLogs.reduce((sum, log) => sum + log.amount, 0),
  getDepositsByTimeframe: () => depositLogs,
  
  // Auction methods (stubs for now)
  holdBidFunds,
  refundBidFunds,
  finalizeAuctionPurchase,
  placeBid,
  chargeIncrementalBid: async () => false,
  getAuctionBidders: async () => [],
  cleanupAuctionTracking: async () => {},
  
  // Enhanced features
  checkSuspiciousActivity,
  reconcileBalance,
  getTransactionHistory,
  
  // Admin-specific methods
  refreshAdminData,
  getPlatformTransactions,
  getAnalyticsData,
  
  // Data management
  reloadData,
};

return (
  <WalletContext.Provider value={contextValue}>
    {children}
  </WalletContext.Provider>
);
}

export const useWallet = () => {
const context = useContext(WalletContext);
if (!context) {
  throw new Error("useWallet must be used within a WalletProvider");
}
return context;
};