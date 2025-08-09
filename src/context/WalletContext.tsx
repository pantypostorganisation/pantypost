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
  
  // 🔧 NEW: Admin-specific methods
  refreshAdminData: () => Promise<void>;
  getPlatformTransactions: (limit?: number, page?: number) => Promise<any[]>;
  
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

  // 🔧 LISTEN TO WEBSOCKET BALANCE UPDATES
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleBalanceUpdate = (event: CustomEvent) => {
      const data = event.detail;
      console.log('[WalletContext] Received WebSocket balance update:', data);
      
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
        } else if (data.role === 'admin') {
          setAdminBalanceState(data.balance);
        }
      }
    };

    const handleTransaction = (event: CustomEvent) => {
      console.log('[WalletContext] Received WebSocket transaction:', event.detail);
      // Refresh transaction history when a new transaction occurs
      if (user) {
        fetchTransactionHistory(user.username);
      }
    };

    // Listen for WebSocket events from WebSocketContext
    window.addEventListener('wallet:balance_update', handleBalanceUpdate as EventListener);
    window.addEventListener('wallet:transaction', handleTransaction as EventListener);

    return () => {
      window.removeEventListener('wallet:balance_update', handleBalanceUpdate as EventListener);
      window.removeEventListener('wallet:transaction', handleTransaction as EventListener);
    };
  }, [user]);

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
        } else if (data.role === 'admin') {
          setAdminBalanceState(data.balance);
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
      console.log('[WalletContext] Fetching balance for:', username);
      
      const response = await apiClient.get<any>(`/wallet/balance/${username}`);
      
      console.log('[WalletContext] Balance response:', response);
      
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

  // 🔧 NEW: Fetch admin platform wallet balance (contains platform fees)
  const fetchAdminPlatformBalance = useCallback(async (): Promise<number> => {
    if (!user || user.role !== 'admin') {
      console.log('[WalletContext] Not admin user, skipping platform balance fetch');
      return 0;
    }

    try {
      console.log('[WalletContext] Fetching admin platform wallet balance...');
      
      const response = await apiClient.get<any>('/wallet/admin-platform-balance');
      
      console.log('[WalletContext] Admin platform balance response:', response);
      
      if (response.success && response.data) {
        const balance = response.data.balance || 0;
        console.log('[WalletContext] Admin platform wallet balance:', balance, 'from source:', response.data.source);
        return balance;
      }
      
      console.warn('[WalletContext] Admin platform balance fetch failed:', response.error);
      return 0;
    } catch (error) {
      console.error('[WalletContext] Error fetching admin platform balance:', error);
      return 0;
    }
  }, [user, apiClient]);

  // 🔧 NEW: Fetch platform transactions
  const getPlatformTransactions = useCallback(async (limit: number = 100, page: number = 1): Promise<any[]> => {
    if (!user || user.role !== 'admin') {
      console.log('[WalletContext] Not admin user, skipping platform transactions fetch');
      return [];
    }

    try {
      console.log('[WalletContext] Fetching platform transactions...');
      
      const response = await apiClient.get<any>(`/wallet/platform-transactions?limit=${limit}&page=${page}`);
      
      console.log('[WalletContext] Platform transactions response:', response);
      
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

  // Fetch transaction history from API
  const fetchTransactionHistory = useCallback(async (username: string) => {
    try {
      console.log('[WalletContext] Fetching transactions for:', username);
      
      const response = await apiClient.get<any>(`/wallet/transactions/${username}`);
      
      console.log('[WalletContext] Transactions response:', response);
      
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
          }));
        
        setOrderHistory(orders);
        console.log('[WalletContext] Transaction history updated:', orders.length, 'orders');
      }
    } catch (error) {
      console.error('[WalletContext] Failed to fetch transaction history:', error);
    }
  }, [apiClient]);

  // 🔧 UPDATED: Load all data from API with admin platform balance support
  const loadAllData = useCallback(async () => {
    if (!user) {
      console.log('[WalletContext] No user, skipping data load');
      return false;
    }

    try {
      console.log('[WalletContext] Loading wallet data from API for user:', user.username);
      
      // Fetch current user's balance
      const balance = await fetchBalance(user.username);
      console.log('[WalletContext] Fetched balance:', balance, 'for role:', user.role);
      
      if (user.role === 'buyer') {
        setBuyerBalancesState(prev => ({ ...prev, [user.username]: balance }));
      } else if (user.role === 'seller') {
        setSellerBalancesState(prev => ({ ...prev, [user.username]: balance }));
      } else if (user.role === 'admin') {
        // For admin users, fetch the platform admin wallet that collects fees
        try {
          console.log('[WalletContext] Admin detected - fetching platform wallet...');
          
          const platformBalance = await fetchAdminPlatformBalance();
          console.log('[WalletContext] Platform admin wallet balance:', platformBalance);
          setAdminBalanceState(platformBalance);
          
          // Also fetch platform transactions for admin dashboard
          const platformTransactions = await getPlatformTransactions(50, 1);
          console.log('[WalletContext] Fetched', platformTransactions.length, 'platform transactions');
          
          // Convert platform transactions to order format for dashboard display
          const platformOrders: Order[] = platformTransactions
            .filter((tx: any) => tx.metadata?.orderId)
            .map((tx: any) => ({
              id: tx.metadata?.orderId || tx.id,
              title: tx.metadata?.listingTitle || tx.description || 'Platform Fee Collection',
              description: tx.description || 'Platform fee transaction',
              price: tx.metadata?.originalPrice || tx.amount,
              markedUpPrice: tx.metadata?.buyerPayment || tx.amount,
              date: tx.createdAt || tx.date,
              seller: tx.metadata?.seller || 'Unknown',
              buyer: tx.metadata?.buyer || 'Unknown',
              shippingStatus: 'shipped' as const, // Use 'shipped' instead of 'completed'
              wasAuction: tx.metadata?.wasAuction || false,
              finalBid: tx.metadata?.finalBid,
              imageUrl: undefined,
              tags: [],
              deliveryAddress: undefined,
            }));
          
          if (platformOrders.length > 0) {
            setOrderHistory(prev => {
              // Merge with existing orders, avoiding duplicates
              const existingIds = new Set(prev.map(order => order.id));
              const newOrders = platformOrders.filter(order => !existingIds.has(order.id));
              return [...prev, ...newOrders];
            });
            console.log('[WalletContext] Added', platformOrders.length, 'platform orders to history');
          }
          
        } catch (adminError) {
          console.error('[WalletContext] Error fetching platform wallet:', adminError);
          // Fallback to personal admin balance
          setAdminBalanceState(balance);
          console.log('[WalletContext] Using personal admin balance as fallback:', balance);
        }
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
  }, [user, fetchBalance, fetchAdminPlatformBalance, getPlatformTransactions, fetchTransactionHistory]);

  // 🔧 NEW: Refresh admin data specifically
  const refreshAdminData = useCallback(async () => {
    if (!user || user.role !== 'admin') {
      console.log('[WalletContext] Not admin, skipping admin data refresh');
      return;
    }
    
    try {
      console.log('[WalletContext] Refreshing admin data...');
      
      // Refresh admin platform wallet balance
      const platformBalance = await fetchAdminPlatformBalance();
      setAdminBalanceState(platformBalance);
      
      // Refresh platform transactions
      const platformTransactions = await getPlatformTransactions(50, 1);
      console.log('[WalletContext] Refreshed', platformTransactions.length, 'platform transactions');
      
      // Refresh transaction history
      await fetchTransactionHistory(user.username);
      
      console.log('[WalletContext] Admin data refreshed successfully');
    } catch (error) {
      console.error('[WalletContext] Error refreshing admin data:', error);
    }
  }, [user, fetchAdminPlatformBalance, getPlatformTransactions, fetchTransactionHistory]);

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

  // Balance setters (update cache and call API)
  const setBuyerBalance = useCallback(async (username: string, balance: number) => {
    const validatedUsername = validateUsername(username);
    
    // Update local cache immediately
    setBuyerBalancesState((prev) => ({
      ...prev,
      [validatedUsername]: balance,
    }));
    
    // Emit WebSocket update
    emitBalanceUpdate(validatedUsername, 'buyer', balance);
    
    // Note: In a real app, you might want to sync this back to the server
    // For now, we trust the server as the source of truth
  }, [emitBalanceUpdate]);

  const setSellerBalance = useCallback(async (seller: string, balance: number) => {
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
  }, []);

  // 🔧 FIXED: Create order via API with debug logging
  const addOrder = useCallback(async (order: Order) => {
    try {
      console.log('[WalletContext] Creating order via API:', order);
      
      // ✅ ADD DEBUG LOGGING HERE
      console.log('[DEBUG] Order object received:', {
        title: order.title,
        description: order.description,
        price: order.price,
        markedUpPrice: order.markedUpPrice,
        seller: order.seller,
        buyer: order.buyer,
        deliveryAddress: order.deliveryAddress
      });
      
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

      // ✅ ADD MORE DEBUG LOGGING HERE
      console.log('[DEBUG] Order payload being sent to API:', orderPayload);
      console.log('[DEBUG] Payload validation check:', {
        hasTitle: !!orderPayload.title,
        hasDescription: !!orderPayload.description,
        hasPrice: typeof orderPayload.price === 'number',
        hasMarkedUpPrice: typeof orderPayload.markedUpPrice === 'number',
        hasSeller: !!orderPayload.seller,
        hasBuyer: !!orderPayload.buyer,
        hasDeliveryAddress: !!orderPayload.deliveryAddress
      });

      console.log('[WalletContext] Order payload:', orderPayload);

      const response = await apiClient.post<any>('/orders', orderPayload);

      console.log('[WalletContext] Order creation response:', response);

      if (response.success && response.data) {
        setOrderHistory((prev) => [...prev, response.data]);
        
        // 🔧 FIXED: Only fetch current user's balance after order creation
        // Don't try to fetch seller's balance as buyer (causes 403)
        if (user?.username) {
          const newBalance = await fetchBalance(user.username);
          
          if (user.role === 'buyer') {
            setBuyerBalancesState(prev => ({ ...prev, [user.username]: newBalance }));
          } else if (user.role === 'seller') {
            setSellerBalancesState(prev => ({ ...prev, [user.username]: newBalance }));
          }
        }
        
        // 🔧 NEW: If admin user exists, refresh their platform balance
        if (user?.role === 'admin') {
          await refreshAdminData();
        }
        
        // Refresh transaction history for current user only
        if (user?.username) {
          await fetchTransactionHistory(user.username);
        }
        
        console.log('[WalletContext] Order created and balance updated');
      } else {
        const errorMessage = response.error?.message || response.error || 'Order creation failed';
        console.error('[WalletContext] Order creation failed:', errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('[WalletContext] Failed to create order:', error);
      throw error;
    }
  }, [apiClient, fetchBalance, fetchTransactionHistory, refreshAdminData, user]);

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
      
      console.log('[WalletContext] Processing deposit via API:', {
        username: validatedUsername,
        amount: validatedAmount,
        method,
        authUser: user?.username
      });
      
      // The backend gets username from the auth token, not the request body
      // So we only send amount, method, and notes
      const response = await apiClient.post<any>('/wallet/deposit', {
        amount: validatedAmount,
        method,
        notes,
      });
      
      console.log('[WalletContext] Deposit response:', response);
      
      if (response.success) {
        // Wait a moment for the transaction to be processed
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Refresh balance after deposit
        const newBalance = await fetchBalance(validatedUsername);
        console.log('[WalletContext] New balance after deposit:', newBalance);
        
        setBuyerBalancesState(prev => ({ ...prev, [validatedUsername]: newBalance }));
        
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
        emitBalanceUpdate(validatedUsername, 'buyer', newBalance);
        
        console.log('[WalletContext] Deposit successful');
        return true;
      } else {
        console.error('[WalletContext] Deposit failed:', response.error);
        // Show the actual error from the backend
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

  // ✅ IMPROVED: Purchase listing with proper error handling
  const purchaseListing = useCallback(async (listing: Listing, buyerUsername: string): Promise<boolean> => {
    try {
      checkRateLimit('API_CALL', buyerUsername);
      
      const validatedBuyer = validateUsername(buyerUsername);
      const validatedSeller = validateUsername(listing.seller);
      
      console.log('[WalletContext] Processing purchase:', {
        buyer: validatedBuyer,
        seller: validatedSeller,
        listing: listing.title,
        price: listing.price,
        markedUpPrice: listing.markedUpPrice
      });
      
      // ✅ FIXED: Include all required fields including deliveryAddress
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
        listingId: listing.id, // Reference to original listing
        // ✅ FIXED: Include required delivery address
        deliveryAddress: {
          fullName: 'John Doe', // TODO: Get from user profile in production
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
          `New sale: "${listing.title}" for $${listing.price.toFixed(2)}`
        );
      }
      
      console.log('[WalletContext] Purchase successful');
      return true;
    } catch (error) {
      console.error('[Purchase] Error:', error);
      // ✅ IMPROVED: Let the error bubble up with details instead of swallowing it
      throw error;
    }
  }, [addOrder, addSellerNotification]);

  // Withdraw funds via API
  const addSellerWithdrawal = useCallback(async (username: string, amount: number) => {
    try {
      checkRateLimit('WITHDRAWAL', username);
      
      const validatedUsername = validateUsername(username);
      const validatedAmount = validateTransactionAmount(amount);
      
      console.log('[WalletContext] Processing withdrawal via API:', {
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
      
      console.log('[WalletContext] Withdrawal response:', response);
      
      if (response.success) {
        // Update local state
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
        setSellerBalancesState(prev => ({ ...prev, [validatedUsername]: newBalance }));
        
        console.log('[WalletContext] Withdrawal successful');
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
      
      console.log('[WalletContext] Processing admin credit via API:', {
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
        adminUsername: user?.username || 'Unknown Admin',
      });
      
      console.log('[WalletContext] Admin credit response:', response);
      
      if (response.success) {
        // Refresh balance
        const newBalance = await fetchBalance(validatedUsername);
        
        if (role === 'buyer') {
          setBuyerBalancesState(prev => ({ ...prev, [validatedUsername]: newBalance }));
        } else if (role === 'seller') {
          setSellerBalancesState(prev => ({ ...prev, [validatedUsername]: newBalance }));
        }
        
        // Update admin actions
        const action: AdminAction = {
          id: response.data?.id || uuidv4(),
          type: 'credit',
          amount: validatedAmount,
          targetUser: validatedUsername,
          username: validatedUsername,
          adminUser: user?.username || 'Unknown Admin',
          reason: sanitizedReason,
          date: response.data?.createdAt || new Date().toISOString(),
          role,
        };
        
        setAdminActions(prev => [...prev, action]);
        
        console.log('[WalletContext] Admin credit successful');
        return true;
      }
      
      console.error('[WalletContext] Admin credit failed:', response.error);
      return false;
    } catch (error) {
      console.error('Admin credit error:', error);
      return false;
    }
  }, [user, apiClient, fetchBalance]);

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
      
      console.log('[WalletContext] Processing admin debit via API:', {
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
        adminUsername: user?.username || 'Unknown Admin',
      });
      
      console.log('[WalletContext] Admin debit response:', response);
      
      if (response.success) {
        // Refresh balance
        const newBalance = await fetchBalance(validatedUsername);
        
        if (role === 'buyer') {
          setBuyerBalancesState(prev => ({ ...prev, [validatedUsername]: newBalance }));
        } else if (role === 'seller') {
          setSellerBalancesState(prev => ({ ...prev, [validatedUsername]: newBalance }));
        }
        
        // Update admin actions
        const action: AdminAction = {
          id: response.data?.id || uuidv4(),
          type: 'debit',
          amount: validatedAmount,
          targetUser: validatedUsername,
          username: validatedUsername,
          adminUser: user?.username || 'Unknown Admin',
          reason: sanitizedReason,
          date: response.data?.createdAt || new Date().toISOString(),
          role,
        };
        
        setAdminActions(prev => [...prev, action]);
        
        console.log('[WalletContext] Admin debit successful');
        return true;
      }
      
      console.error('[WalletContext] Admin debit failed:', response.error);
      return false;
    } catch (error) {
      console.error('Admin debit error:', error);
      return false;
    }
  }, [user, apiClient, fetchBalance]);

  // Get transaction history from API
  const getTransactionHistory = useCallback(async (username?: string, limit?: number) => {
    try {
      const targetUsername = username || user?.username;
      if (!targetUsername) {
        console.warn('[WalletContext] No username for transaction history');
        return [];
      }
      
      const endpoint = `/wallet/transactions/${targetUsername}${limit ? `?limit=${limit}` : ''}`;
      console.log('[WalletContext] Fetching transaction history:', endpoint);
      
      const response = await apiClient.get<any>(endpoint);
      
      console.log('[WalletContext] Transaction history response:', response);
      
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

  // Subscription payment via API
  const subscribeToSellerWithPayment = useCallback(async (
    buyer: string,
    seller: string,
    amount: number
  ): Promise<boolean> => {
    try {
      console.log('[WalletContext] Processing subscription via API:', { buyer, seller, amount });
      
      const response = await apiClient.post<any>('/subscriptions/subscribe', {
        seller, 
        price: amount
      });
      
      console.log('[WalletContext] Subscription response:', response);
      
      if (response.success) {
        // Refresh buyer balance
        const newBalance = await fetchBalance(buyer);
        setBuyerBalancesState(prev => ({ ...prev, [buyer]: newBalance }));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Subscription error:', error);
      return false;
    }
  }, [apiClient, fetchBalance]);

  // 🔧 NEW: Unsubscribe from seller via API
  const unsubscribeFromSeller = useCallback(async (
    buyer: string,
    seller: string
  ): Promise<boolean> => {
    try {
      console.log('[WalletContext] Processing unsubscribe via API:', { buyer, seller });
      
      const response = await apiClient.post<any>('/subscriptions/unsubscribe', {
        seller  // The backend gets buyer from auth token
      });
      
      console.log('[WalletContext] Unsubscribe response:', response);
      
      if (response.success) {
        console.log('[WalletContext] Successfully unsubscribed');
        
        // Optionally refresh buyer balance to reflect any changes
        if (buyer === user?.username) {
          const newBalance = await fetchBalance(buyer);
          setBuyerBalancesState(prev => ({ ...prev, [buyer]: newBalance }));
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

  // Stub implementations for features not yet in API
  const sendTip = useCallback(async (buyer: string, seller: string, amount: number): Promise<boolean> => {
    // TODO: Implement tip endpoint when ready
    console.log('[WalletContext] Tip feature - using mock implementation');
    
    // For now, treat as a simple transfer
    try {
      const validatedAmount = validateTransactionAmount(amount);
      
      // Check buyer has sufficient balance
      const buyerBalance = getBuyerBalance(buyer);
      if (buyerBalance < validatedAmount) {
        throw new Error('Insufficient balance for tip');
      }
      
      // Update balances locally (mock)
      setBuyerBalancesState(prev => ({ 
        ...prev, 
        [buyer]: prev[buyer] - validatedAmount 
      }));
      setSellerBalancesState(prev => ({ 
        ...prev, 
        [seller]: (prev[seller] || 0) + validatedAmount 
      }));
      
      return true;
    } catch (error) {
      console.error('Tip error:', error);
      return false;
    }
  }, [getBuyerBalance]);

  const purchaseCustomRequest = useCallback(async (customRequest: CustomRequestPurchase): Promise<boolean> => {
    // TODO: Implement custom request endpoint when ready
    console.log('[WalletContext] Custom request purchase - using mock implementation');
    return false;
  }, []);

  // Admin withdrawal (mock)
  const addAdminWithdrawal = useCallback(async (amount: number) => {
    console.log('[WalletContext] Admin withdrawal not implemented in API yet');
    
    // Mock implementation
    const withdrawal: Withdrawal = {
      amount,
      date: new Date().toISOString(),
      status: 'pending',
      method: 'bank_transfer'
    };
    
    setAdminWithdrawals(prev => [...prev, withdrawal]);
  }, []);

  // Auction-related stubs (to be implemented later)
  const holdBidFunds = useCallback(async (): Promise<boolean> => {
    console.log('[WalletContext] Auction features not fully implemented in API yet');
    return false;
  }, []);

  const refundBidFunds = useCallback(async (): Promise<boolean> => {
    console.log('[WalletContext] Auction features not fully implemented in API yet');
    return false;
  }, []);

  const placeBid = useCallback(async (): Promise<boolean> => {
    console.log('[WalletContext] Auction features not fully implemented in API yet');
    return false;
  }, []);

  const finalizeAuctionPurchase = useCallback(async (): Promise<boolean> => {
    console.log('[WalletContext] Auction features not fully implemented in API yet');
    return false;
  }, []);

  // Enhanced features stubs
  const checkSuspiciousActivity = useCallback(async (username: string) => {
    // TODO: Implement when backend supports it
    return { suspicious: false, reasons: [] };
  }, []);

  const reconcileBalance = useCallback(async (username: string, role: 'buyer' | 'seller' | 'admin') => {
    // TODO: Implement when backend supports it
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
    updateOrderAddress: async () => { console.log('Order address update not implemented yet'); },
    updateShippingStatus: async () => { console.log('Shipping status update not implemented yet'); },
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
    
    // 🔧 NEW: Admin-specific methods
    refreshAdminData,
    getPlatformTransactions,
    
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