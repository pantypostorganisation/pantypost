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

// Import shared types
import type { Order, DeliveryAddress, Listing, CustomRequestPurchase, DepositLog } from '@/types/order';

// Re-export types for backward compatibility
export type { Order, DeliveryAddress, Listing, CustomRequestPurchase, DepositLog };

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://52.62.54.24:5000';

type Withdrawal = {
  amount: number;
  date: string;
  status?: 'pending' | 'completed' | 'failed';
  method?: string;
};

type AdminAction = {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  targetUser?: string;
  username?: string;
  adminUser: string;
  reason: string;
  date: string;
  role: 'buyer' | 'seller';
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
  sendTip: (buyer: string, seller: string, amount: number) => Promise<boolean>;
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
  const { sendMessage, subscribe, isConnected } = useWebSocket();
  
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

  const setAddSellerNotificationCallback = (fn: (seller: string, message: string) => void) => {
    setAddSellerNotification(() => fn);
  };

  // Subscribe to WebSocket wallet updates
  useEffect(() => {
    if (!isConnected) return;

    const unsubBalance = subscribe(WebSocketEvent.WALLET_BALANCE_UPDATE, async (data: any) => {
      console.log('[WalletContext] Received balance update:', data);
      
      // Update local cached state based on the WebSocket data
      if (data.username && data.role && typeof data.balance === 'number') {
        if (data.role === 'buyer') {
          setBuyerBalancesState(prev => ({
            ...prev,
            [data.username]: data.balance
          }));
        } else if (data.role === 'seller') {
          setSellerBalancesState(prev => ({
            ...prev,
            [data.username]: data.balance
          }));
        }
      }
    });

    const unsubTransaction = subscribe(WebSocketEvent.WALLET_TRANSACTION, async (data: any) => {
      console.log('[WalletContext] Received transaction event:', data);
      // Refresh transaction history when a new transaction occurs
      if (user) {
        await fetchTransactionHistory(user.username);
      }
    });

    return () => {
      unsubBalance();
      unsubTransaction();
    };
  }, [isConnected, subscribe, user]);

  // Helper to emit wallet balance updates
  const emitBalanceUpdate = useCallback((username: string, role: 'buyer' | 'seller', balance: number) => {
    if (isConnected) {
      sendMessage(WebSocketEvent.WALLET_BALANCE_UPDATE, {
        username,
        role,
        balance,
        timestamp: Date.now()
      });
    }
  }, [isConnected, sendMessage]);

  // Fetch balance from API using the apiClient from AuthContext
  const fetchBalance = useCallback(async (username: string): Promise<number> => {
    try {
      const response = await apiClient.get<any>(`/api/wallet/balance/${username}`);
      return response.data?.balance || 0;
    } catch (error) {
      console.error(`[WalletContext] Failed to fetch balance for ${username}:`, error);
      return 0;
    }
  }, [apiClient]);

  // Fetch transaction history from API
  const fetchTransactionHistory = useCallback(async (username: string) => {
    try {
      const response = await apiClient.get<any>(`/api/wallet/transactions/${username}`);
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
            date: tx.createdAt,
            seller: tx.toRole === 'seller' ? tx.to : tx.from,
            buyer: tx.fromRole === 'buyer' ? tx.from : tx.to,
            shippingStatus: tx.status === 'completed' ? 'pending' : 'pending-auction',
          }));
        
        setOrderHistory(orders);
      }
    } catch (error) {
      console.error('[WalletContext] Failed to fetch transaction history:', error);
    }
  }, [apiClient]);

  // Load all data from API
  const loadAllData = useCallback(async () => {
    if (!user) {
      console.log('[WalletContext] No user, skipping data load');
      return;
    }

    try {
      console.log('[WalletContext] Loading wallet data from API...');
      
      // Fetch current user's balance
      const balance = await fetchBalance(user.username);
      
      if (user.role === 'buyer') {
        setBuyerBalancesState(prev => ({ ...prev, [user.username]: balance }));
      } else if (user.role === 'seller') {
        setSellerBalancesState(prev => ({ ...prev, [user.username]: balance }));
      } else if (user.role === 'admin') {
        setAdminBalanceState(balance);
      }
      
      // Fetch transaction history
      await fetchTransactionHistory(user.username);
      
      console.log('[WalletContext] Data loaded successfully');
      return true;
    } catch (error) {
      console.error('[WalletContext] Error loading wallet data:', error);
      setInitializationError('Failed to load wallet data');
      return false;
    }
  }, [user, fetchBalance, fetchTransactionHistory]);

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
        console.log('[WalletContext] Initializing wallet for user:', user.username);
        
        const loadSuccess = await loadAllData();
        
        if (loadSuccess) {
          setIsInitialized(true);
          console.log('[WalletContext] Wallet initialization complete');
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
      return buyerBalances[validatedUsername] || 0;
    } catch {
      return 0;
    }
  }, [buyerBalances]);

  const getSellerBalance = useCallback((seller: string): number => {
    try {
      const validatedSeller = validateUsername(seller);
      return sellerBalances[validatedSeller] || 0;
    } catch {
      return 0;
    }
  }, [sellerBalances]);

  // Balance setters (update cache and emit events)
  const setBuyerBalance = useCallback(async (username: string, balance: number) => {
    const validatedUsername = validateUsername(username);
    
    setBuyerBalancesState((prev) => ({
      ...prev,
      [validatedUsername]: balance,
    }));
    
    emitBalanceUpdate(validatedUsername, 'buyer', balance);
  }, [emitBalanceUpdate]);

  const setSellerBalance = useCallback(async (seller: string, balance: number) => {
    const validatedSeller = validateUsername(seller);
    
    setSellerBalancesState((prev) => ({
      ...prev,
      [validatedSeller]: balance,
    }));
    
    emitBalanceUpdate(validatedSeller, 'seller', balance);
  }, [emitBalanceUpdate]);

  const setAdminBalance = useCallback(async (balance: number) => {
    setAdminBalanceState(balance);
  }, []);

  // Create order via API
  const addOrder = useCallback(async (order: Order) => {
    try {
      const response = await apiClient.post<any>('/api/orders', {
        title: order.title,
        description: order.description,
        price: order.price,
        seller: order.seller,
        buyer: order.buyer,
        tags: order.tags,
        wasAuction: order.wasAuction,
        deliveryAddress: order.deliveryAddress,
        imageUrl: order.imageUrl,
      });

      if (response.success && response.data) {
        setOrderHistory((prev) => [...prev, response.data]);
        
        // Refresh balances after order
        if (order.buyer) await fetchBalance(order.buyer);
        if (order.seller) await fetchBalance(order.seller);
      }
    } catch (error) {
      console.error('[WalletContext] Failed to create order:', error);
      throw error;
    }
  }, [apiClient, fetchBalance]);

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
      
      const response = await apiClient.post<any>('/api/wallet/deposit', {
        username: validatedUsername,
        amount: validatedAmount,
        method,
        notes,
      });
      
      if (response.success) {
        // Refresh balance after deposit
        await fetchBalance(validatedUsername);
        
        // Add to local deposit logs
        if (response.data) {
          setDepositLogs(prev => [...prev, {
            id: response.data.id,
            username: validatedUsername,
            amount: validatedAmount,
            method,
            date: response.data.createdAt,
            status: response.data.status,
            transactionId: response.data.id,
            notes,
          }]);
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error processing deposit:', error);
      return false;
    }
  }, [apiClient, fetchBalance]);

  // Purchase listing (simplified - actual implementation would call order API)
  const purchaseListing = useCallback(async (listing: Listing, buyerUsername: string): Promise<boolean> => {
    try {
      checkRateLimit('API_CALL', buyerUsername);
      
      const validatedBuyer = validateUsername(buyerUsername);
      const validatedSeller = validateUsername(listing.seller);
      
      // Create order via API
      await addOrder({
        id: uuidv4(),
        title: listing.title,
        description: listing.description,
        price: listing.price,
        markedUpPrice: listing.markedUpPrice || listing.price,
        seller: validatedSeller,
        buyer: validatedBuyer,
        imageUrl: listing.imageUrls?.[0],
        date: new Date().toISOString(),
        shippingStatus: 'pending',
        tags: listing.tags,
      });
      
      // Notification
      if (addSellerNotification) {
        addSellerNotification(
          validatedSeller,
          `New sale: "${listing.title}" for ${listing.price.toFixed(2)}`
        );
      }
      
      return true;
    } catch (error) {
      console.error('[Purchase] Error:', error);
      return false;
    }
  }, [addOrder, addSellerNotification]);

  // Withdraw funds via API
  const addSellerWithdrawal = useCallback(async (username: string, amount: number) => {
    try {
      checkRateLimit('WITHDRAWAL', username);
      
      const validatedUsername = validateUsername(username);
      const validatedAmount = validateTransactionAmount(amount);
      
      const response = await apiClient.post<any>('/api/wallet/withdraw', {
        username: validatedUsername,
        amount: validatedAmount,
        accountDetails: {
          accountNumber: '****1234',
          routingNumber: '123456789',
          accountType: 'checking',
        },
      });
      
      if (response.success) {
        // Update local state
        const newWithdrawal: Withdrawal = { 
          amount: validatedAmount, 
          date: new Date().toISOString(), 
          status: 'pending' 
        };
        
        setSellerWithdrawals((prev) => ({
          ...prev,
          [validatedUsername]: [...(prev[validatedUsername] || []), newWithdrawal],
        }));
        
        // Refresh balance
        await fetchBalance(validatedUsername);
      }
    } catch (error) {
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
      
      const response = await apiClient.post<any>('/api/wallet/admin-actions', {
        action: 'credit',
        username: validatedUsername,
        amount: validatedAmount,
        reason: sanitizedReason,
        adminUsername: user?.username || 'Unknown Admin',
      });
      
      if (response.success) {
        // Refresh balance
        await fetchBalance(validatedUsername);
        
        // Update admin actions
        const action: AdminAction = {
          id: uuidv4(),
          type: 'credit',
          amount: validatedAmount,
          targetUser: validatedUsername,
          username: validatedUsername,
          adminUser: user?.username || 'Unknown Admin',
          reason: sanitizedReason,
          date: new Date().toISOString(),
          role,
        };
        
        setAdminActions(prev => [...prev, action]);
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Admin credit error:', error);
      return false;
    }
  }, [user, apiClient, fetchBalance]);

  // Get transaction history from API
  const getTransactionHistory = useCallback(async (username?: string, limit?: number) => {
    try {
      const endpoint = username 
        ? `/api/wallet/transactions/${username}?limit=${limit || 50}`
        : `/api/wallet/transactions?limit=${limit || 50}`;
        
      const response = await apiClient.get<any>(endpoint);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      return [];
    } catch (error) {
      console.error('Error getting transaction history:', error);
      return [];
    }
  }, [apiClient]);

  // Reload all data
  const reloadData = useCallback(async () => {
    if (isLoading) {
      console.log('[WalletContext] Already loading, skipping reload');
      return;
    }
    
    setIsLoading(true);
    try {
      await loadAllData();
    } finally {
      setIsLoading(false);
    }
  }, [loadAllData, isLoading]);

  // Stub implementations for features not in API spec
  const sendTip = useCallback(async (buyer: string, seller: string, amount: number): Promise<boolean> => {
    // This would be implemented as a special type of transaction
    console.log('[WalletContext] Tip feature not implemented in API');
    return false;
  }, []);

  const purchaseCustomRequest = useCallback(async (customRequest: CustomRequestPurchase): Promise<boolean> => {
    // This would create an order with custom request metadata
    console.log('[WalletContext] Custom request purchase not implemented');
    return false;
  }, []);

  const subscribeToSellerWithPayment = useCallback(async (
    buyer: string,
    seller: string,
    amount: number
  ): Promise<boolean> => {
    try {
      const response = await apiClient.post<any>('/api/subscriptions/subscribe', {
        buyer, 
        seller, 
        price: amount
      });
      
      if (response.success) {
        await fetchBalance(buyer);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Subscription error:', error);
      return false;
    }
  }, [apiClient, fetchBalance]);

  // Auction-related stubs
  const holdBidFunds = useCallback(async (): Promise<boolean> => {
    console.log('[WalletContext] Auction features not fully implemented');
    return false;
  }, []);

  const refundBidFunds = useCallback(async (): Promise<boolean> => {
    console.log('[WalletContext] Auction features not fully implemented');
    return false;
  }, []);

  const placeBid = useCallback(async (): Promise<boolean> => {
    console.log('[WalletContext] Auction features not fully implemented');
    return false;
  }, []);

  const finalizeAuctionPurchase = useCallback(async (): Promise<boolean> => {
    console.log('[WalletContext] Auction features not fully implemented');
    return false;
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
    orderHistory,
    addOrder,
    sellerWithdrawals,
    adminWithdrawals,
    addSellerWithdrawal,
    addAdminWithdrawal: async () => { console.log('Admin withdrawal not implemented'); },
    wallet: { ...buyerBalances, ...sellerBalances, admin: adminBalance },
    updateWallet: () => { console.warn('updateWallet is deprecated'); },
    sendTip,
    setAddSellerNotificationCallback,
    adminCreditUser,
    adminDebitUser: async () => false, // Stub
    adminActions,
    updateOrderAddress: async () => { console.log('Not implemented'); },
    updateShippingStatus: async () => { console.log('Not implemented'); },
    depositLogs,
    addDeposit,
    getDepositsForUser: (username: string) => depositLogs.filter(log => log.username === username),
    getTotalDeposits: () => depositLogs.reduce((sum, log) => sum + log.amount, 0),
    getDepositsByTimeframe: () => depositLogs,
    
    // Auction methods (stubs)
    holdBidFunds,
    refundBidFunds,
    finalizeAuctionPurchase,
    placeBid,
    chargeIncrementalBid: async () => false,
    getAuctionBidders: async () => [],
    cleanupAuctionTracking: async () => {},
    
    // Enhanced features
    checkSuspiciousActivity: async () => ({ suspicious: false, reasons: [] }),
    reconcileBalance: async () => null,
    getTransactionHistory,
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