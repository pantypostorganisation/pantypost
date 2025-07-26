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
import { DeliveryAddress } from '@/components/AddressConfirmationModal';
import { getSellerTierMemoized } from '@/utils/sellerTiers';
import { walletService, storageService, ordersService, securityService } from '@/services';
import { WalletIntegration } from '@/services/wallet.integration';
import { v4 as uuidv4 } from 'uuid';
import { sanitizeStrict, sanitizeUsername, sanitizeCurrency } from '@/utils/security/sanitization';
import { getRateLimiter, RATE_LIMITS } from '@/utils/security/rate-limiter';
import { financialSchemas } from '@/utils/validation/schemas';
import { z } from 'zod';
import { useWebSocket } from '@/context/WebSocketContext';
import { WebSocketEvent } from '@/types/websocket';
import { forceSyncWalletBalance, enhancedWalletSync } from '@/utils/walletSync';

// Constants for mock data detection
const MOCK_SIGNATURES = {
  aliceBalance: 1250,
  bettyBalance: 980,
  carolBalance: 650,
  dianaBalance: 1500,
  buyer1Balance: 500,
  buyer2Balance: 250,
  buyer3Balance: 1000,
  adminBalance: 10000,
} as const;

const MOCK_CLEARED_FLAG = '__walletMockDataCleared__';

// Export Order type to make it available to other components
export type Order = {
  id: string;
  title: string;
  description: string;
  price: number;
  markedUpPrice: number;
  imageUrl?: string;
  date: string;
  seller: string;
  buyer: string;
  tags?: string[];
  wearTime?: string;
  wasAuction?: boolean;
  finalBid?: number;
  deliveryAddress?: DeliveryAddress;
  shippingStatus?: 'pending' | 'processing' | 'shipped' | 'pending-auction';
  tierCreditAmount?: number;
  isCustomRequest?: boolean;
  originalRequestId?: string;
  listingId?: string;
  listingTitle?: string;
  quantity?: number;
};

// Import Listing from ListingContext to avoid conflicts
import { Listing as ListingContextType } from '@/context/ListingContext';

// Use the ListingContext's Listing type directly
type Listing = ListingContextType;

export type CustomRequestPurchase = {
  requestId: string;
  buyer: string;
  seller: string;
  amount: number;
  description: string;
  metadata?: any;
};

type Withdrawal = {
  amount: number;
  date: string;
  status?: 'pending' | 'completed' | 'failed';
  method?: string;
};

// Fixed AdminAction type to match what's used in admin components
type AdminAction = {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  targetUser?: string;  // Made optional for backward compatibility
  username?: string;    // Alternative field used in some places
  adminUser: string;
  reason: string;
  date: string;
  role: 'buyer' | 'seller';
};

export type DepositLog = {
  id: string;
  username: string;
  amount: number;
  method: 'credit_card' | 'bank_transfer' | 'crypto' | 'admin_credit';
  date: string;
  status: 'pending' | 'completed' | 'failed';
  transactionId?: string;
  notes?: string;
};

// NEW: Auction bidder tracking types
interface AuctionBidderRecord {
  bidder: string;
  totalBidAmount: number; // The current highest bid from this bidder
  totalPaidAmount: number; // Total amount paid including all incremental bids and fees
  hasPendingOrder: boolean; // Whether they have a pending order
  lastUpdated: string; // ISO timestamp
}

interface AuctionBidderTracking {
  [listingId: string]: {
    [bidder: string]: AuctionBidderRecord;
  };
}

// Validation schemas for wallet operations
const walletOperationSchemas = {
  // FIXED: Allow 0 for balance updates, but require positive for transactions
  transactionAmount: z.number().positive().min(0.01).max(100000),
  balanceAmount: z.number().min(0).max(100000), // Allow 0 for balance updates
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
  
  // Existing interface remains the same for backward compatibility
  buyerBalances: { [username: string]: number };
  adminBalance: number;
  sellerBalances: { [username: string]: number };
  setBuyerBalance: (username: string, balance: number) => Promise<void>;
  getBuyerBalance: (username: string) => number;
  setAdminBalance: (balance: number) => Promise<void>;
  setSellerBalance: (seller: string, balance: number) => Promise<void>;
  getSellerBalance: (seller: string) => number;
  purchaseListing: (listing: Listing, buyerUsername: string) => Promise<boolean>;
  purchaseCustomRequest: (customRequest: CustomRequestPurchase) => Promise<boolean>;
  subscribeToSellerWithPayment: (
    buyer: string,
    seller: string,
    amount: number
  ) => Promise<boolean>;
  orderHistory: Order[];
  addOrder: (order: Order) => Promise<void>;
  sellerWithdrawals: { [username: string]: Withdrawal[] };
  adminWithdrawals: Withdrawal[];
  addSellerWithdrawal: (username: string, amount: number) => Promise<void>;
  addAdminWithdrawal: (amount: number) => Promise<void>;
  wallet: { [username: string]: number };
  updateWallet: (username: string, amount: number, orderToFulfil?: Order) => void;
  sendTip: (buyer: string, seller: string, amount: number) => Promise<boolean>;
  setAddSellerNotificationCallback?: (fn: (seller: string, message: string) => void) => void;
  adminCreditUser: (username: string, role: 'buyer' | 'seller', amount: number, reason: string) => Promise<boolean>;
  adminDebitUser: (username: string, role: 'buyer' | 'seller', amount: number, reason: string) => Promise<boolean>;
  adminActions: AdminAction[];
  updateOrderAddress: (orderId: string, address: DeliveryAddress) => Promise<void>;
  updateShippingStatus: (orderId: string, status: 'pending' | 'processing' | 'shipped') => Promise<void>;
  depositLogs: DepositLog[];
  addDeposit: (username: string, amount: number, method: DepositLog['method'], notes?: string) => Promise<boolean>;
  getDepositsForUser: (username: string) => DepositLog[];
  getTotalDeposits: () => number;
  getDepositsByTimeframe: (timeframe: 'today' | 'week' | 'month' | 'year' | 'all') => DepositLog[];
  
  // New auction bid methods
  holdBidFunds: (listingId: string, bidder: string, amount: number, auctionTitle: string) => Promise<boolean>;
  refundBidFunds: (bidder: string, listingId: string) => Promise<boolean>;
  finalizeAuctionPurchase: (listing: Listing, winnerUsername: string, winningBid: number) => Promise<boolean>;
  
  // FIXED: Add the missing placeBid function to the interface
  placeBid: (listingId: string, bidder: string, amount: number) => Promise<boolean>;
  
  // NEW: Add auction tracking methods
  chargeIncrementalBid: (listingId: string, bidder: string, previousBid: number, newBid: number, listingTitle: string) => Promise<boolean>;
  getAuctionBidders: (listingId: string) => Promise<string[]>;
  cleanupAuctionTracking: (listingId: string, winner?: string) => Promise<void>;
  
  // New enhanced features
  checkSuspiciousActivity: (username: string) => Promise<{ suspicious: boolean; reasons: string[] }>;
  reconcileBalance: (username: string, role: 'buyer' | 'seller' | 'admin') => Promise<any>;
  getTransactionHistory: (username?: string, limit?: number) => Promise<any[]>;
  
  // Data management
  reloadData: () => Promise<void>;
};

export const WalletContext = createContext<WalletContextType | undefined>(undefined);

// Storage keys constants
const STORAGE_KEYS = {
  BUYER_BALANCES: 'wallet_buyers',
  SELLER_BALANCES: 'wallet_sellers',
  ADMIN_BALANCE: 'wallet_admin',
  ORDERS: 'wallet_orders',
  SELLER_WITHDRAWALS: 'wallet_sellerWithdrawals',
  ADMIN_WITHDRAWALS: 'wallet_adminWithdrawals',
  ADMIN_ACTIONS: 'wallet_adminActions',
  DEPOSIT_LOGS: 'wallet_depositLogs',
  INITIALIZATION_STATE: 'wallet_init_state',
  AUCTION_BIDDER_TRACKING: 'auction_bidder_tracking', // NEW
} as const;

// Transaction lock manager for preventing race conditions
class TransactionLockManager {
  private locks: Map<string, Promise<any>> = new Map();

  async acquireLock<T>(key: string, operation: () => Promise<T>): Promise<T> {
    // Wait for any existing lock
    const existingLock = this.locks.get(key);
    if (existingLock) {
      await existingLock;
    }

    // Create new lock
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
  // State management with initial empty values
  const [buyerBalances, setBuyerBalancesState] = useState<{ [username: string]: number }>({});
  const [adminBalance, setAdminBalanceState] = useState<number>(0);
  const [sellerBalances, setSellerBalancesState] = useState<{ [username: string]: number }>({});
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);
  const [sellerWithdrawals, setSellerWithdrawals] = useState<{ [username: string]: Withdrawal[] }>({});
  const [adminWithdrawals, setAdminWithdrawals] = useState<Withdrawal[]>([]);
  const [adminActions, setAdminActions] = useState<AdminAction[]>([]);
  const [depositLogs, setDepositLogs] = useState<DepositLog[]>([]);
  const [addSellerNotification, setAddSellerNotification] = useState<((seller: string, message: string) => void) | null>(null);
  
  // NEW: Add auction bidder tracking state
  const [auctionBidderTracking, setAuctionBidderTracking] = useState<AuctionBidderTracking>({});
  
  // Loading and initialization state
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  
  // WebSocket integration
  const { sendMessage, subscribe, isConnected } = useWebSocket();
  
  // Refs to prevent multiple initializations and saves
  const initializingRef = useRef(false);
  const dataVersionRef = useRef(0);
  const sessionCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const rateLimiter = useRef(getRateLimiter());
  const transactionLock = useRef(new TransactionLockManager());

  const setAddSellerNotificationCallback = (fn: (seller: string, message: string) => void) => {
    setAddSellerNotification(() => fn);
  };

  // Subscribe to WebSocket wallet updates
  useEffect(() => {
    if (!isConnected) return;

    const unsubBalance = subscribe(WebSocketEvent.WALLET_BALANCE_UPDATE, (data: any) => {
      console.log('[WalletContext] Received balance update:', data);
      
      // Update local state based on the WebSocket data
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
        
        // Force update Header component
        if (typeof window !== 'undefined' && (window as any).__pantypost_balance_context?.forceUpdate) {
          (window as any).__pantypost_balance_context.forceUpdate();
        }
      }
    });

    return () => {
      unsubBalance();
    };
  }, [isConnected, subscribe]);

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

  // Helper function to validate and sanitize transaction amount (must be positive)
  const validateTransactionAmount = (amount: number): number => {
    const validation = walletOperationSchemas.transactionAmount.safeParse(amount);
    if (!validation.success) {
      throw new Error('Invalid transaction amount: ' + validation.error.errors[0]?.message);
    }
    return sanitizeCurrency(validation.data);
  };

  // Helper function to validate and sanitize balance amount (can be 0)
  const validateBalanceAmount = (amount: number): number => {
    const validation = walletOperationSchemas.balanceAmount.safeParse(amount);
    if (!validation.success) {
      throw new Error('Invalid balance amount: ' + validation.error.errors[0]?.message);
    }
    return sanitizeCurrency(validation.data);
  };

  // Helper function to validate and sanitize username
  const validateUsername = (username: string): string => {
    const validation = walletOperationSchemas.username.safeParse(username);
    if (!validation.success) {
      throw new Error('Invalid username: ' + validation.error.errors[0]?.message);
    }
    return sanitizeUsername(validation.data);
  };

  // Check rate limit for financial operations
  const checkRateLimit = (operation: string, identifier?: string): void => {
    const rateLimitConfig = RATE_LIMITS[operation as keyof typeof RATE_LIMITS] || RATE_LIMITS.API_CALL;
    const result = rateLimiter.current.check(operation, { ...rateLimitConfig, identifier });
    
    if (!result.allowed) {
      throw new Error(`Rate limit exceeded. Please wait ${result.waitTime} seconds before trying again.`);
    }
  };

  // NEW: Load auction bidder tracking
  const loadAuctionBidderTracking = useCallback(async () => {
    try {
      const tracking = await storageService.getItem<AuctionBidderTracking>(STORAGE_KEYS.AUCTION_BIDDER_TRACKING, {});
      setAuctionBidderTracking(tracking);
      return tracking;
    } catch (error) {
      console.error('[WalletContext] Failed to load auction bidder tracking:', error);
      return {};
    }
  }, []);

  // NEW: Save auction bidder tracking
  const saveAuctionBidderTracking = useCallback(async (tracking: AuctionBidderTracking) => {
    try {
      await storageService.setItem(STORAGE_KEYS.AUCTION_BIDDER_TRACKING, tracking);
      setAuctionBidderTracking(tracking);
    } catch (error) {
      console.error('[WalletContext] Failed to save auction bidder tracking:', error);
    }
  }, []);

  // NEW: Update bidder tracking when a bid is placed
  const updateBidderTracking = useCallback(async (
    listingId: string,
    bidder: string,
    bidAmount: number,
    paidAmount: number,
    hasPendingOrder: boolean
  ) => {
    const tracking = await loadAuctionBidderTracking();
    
    if (!tracking[listingId]) {
      tracking[listingId] = {};
    }
    
    const existingRecord = tracking[listingId][bidder];
    
    tracking[listingId][bidder] = {
      bidder,
      totalBidAmount: bidAmount,
      totalPaidAmount: existingRecord ? existingRecord.totalPaidAmount + paidAmount : paidAmount,
      hasPendingOrder,
      lastUpdated: new Date().toISOString()
    };
    
    await saveAuctionBidderTracking(tracking);
  }, [loadAuctionBidderTracking, saveAuctionBidderTracking]);

  // Save all data without causing re-renders
  const saveAllData = useCallback(async () => {
    if (!isInitialized) {
      return;
    }

    try {
      // Use refs to get current state values without dependencies
      const currentDataVersion = dataVersionRef.current;
      
      // Batch save operations
      const savePromises = [
        storageService.setItem(STORAGE_KEYS.BUYER_BALANCES, buyerBalances),
        storageService.setItem(STORAGE_KEYS.SELLER_BALANCES, sellerBalances),
        storageService.setItem(STORAGE_KEYS.ADMIN_BALANCE, adminBalance.toString()),
        storageService.setItem(STORAGE_KEYS.ORDERS, orderHistory),
        storageService.setItem(STORAGE_KEYS.SELLER_WITHDRAWALS, sellerWithdrawals),
        storageService.setItem(STORAGE_KEYS.ADMIN_WITHDRAWALS, adminWithdrawals),
        storageService.setItem(STORAGE_KEYS.ADMIN_ACTIONS, adminActions),
        storageService.setItem(STORAGE_KEYS.DEPOSIT_LOGS, depositLogs),
        storageService.setItem(STORAGE_KEYS.AUCTION_BIDDER_TRACKING, auctionBidderTracking), // NEW
      ];

      // Save individual balance keys for enhanced compatibility
      Object.entries(buyerBalances).forEach(([username, balance]) => {
        const balanceInCents = Math.round(balance * 100);
        savePromises.push(storageService.setItem(`wallet_buyer_${username}`, balanceInCents));
      });

      Object.entries(sellerBalances).forEach(([username, balance]) => {
        const balanceInCents = Math.round(balance * 100);
        savePromises.push(storageService.setItem(`wallet_seller_${username}`, balanceInCents));
      });

      // Save admin balance in enhanced format
      const adminBalanceInCents = Math.round(adminBalance * 100);
      savePromises.push(storageService.setItem('wallet_admin_enhanced', adminBalanceInCents));

      await Promise.all(savePromises);
      
      // Check if data changed while we were saving
      if (currentDataVersion !== dataVersionRef.current) {
        // Data changed, we'll need to save again on next update
        return;
      }
    } catch (error) {
      console.error('[WalletContext] Error saving wallet data:', error);
    }
  }, [isInitialized, buyerBalances, sellerBalances, adminBalance, orderHistory, sellerWithdrawals, adminWithdrawals, adminActions, depositLogs, auctionBidderTracking]);

  // Load all data from storage
  const loadAllData = useCallback(async () => {
    try {
      console.log('[WalletContext] Loading wallet data...');
      
      // Load collective data first (legacy format)
      const [
        storedBuyers,
        storedSellers,
        storedAdmin,
        storedSellerWithdrawals,
        storedAdminWithdrawals,
        storedAdminActions,
        storedDepositLogs,
        storedAuctionTracking // NEW
      ] = await Promise.all([
        storageService.getItem<{ [username: string]: number }>(STORAGE_KEYS.BUYER_BALANCES, {}),
        storageService.getItem<{ [username: string]: number }>(STORAGE_KEYS.SELLER_BALANCES, {}),
        storageService.getItem<string>(STORAGE_KEYS.ADMIN_BALANCE, '0'),
        storageService.getItem<{ [username: string]: Withdrawal[] }>(STORAGE_KEYS.SELLER_WITHDRAWALS, {}),
        storageService.getItem<Withdrawal[]>(STORAGE_KEYS.ADMIN_WITHDRAWALS, []),
        storageService.getItem<AdminAction[]>(STORAGE_KEYS.ADMIN_ACTIONS, []),
        storageService.getItem<DepositLog[]>(STORAGE_KEYS.DEPOSIT_LOGS, []),
        loadAuctionBidderTracking() // NEW
      ]);

      // Load orders using the service
      const ordersResult = await ordersService.getOrders();
      const storedOrders = ordersResult.success && ordersResult.data ? ordersResult.data : [];

      // Parse admin balance - prefer enhanced format
      let adminBalanceValue = 0;

      // Check for enhanced admin balance first
      const adminEnhancedRaw = await storageService.getItem<string>('wallet_admin_enhanced', '');
      const adminEnhanced = adminEnhancedRaw ? parseInt(adminEnhancedRaw) : null;
      
      if (adminEnhanced !== null && !isNaN(adminEnhanced) && adminEnhanced !== 0) {
        adminBalanceValue = adminEnhanced / 100;
      } else {
        // Fallback to legacy format
        const legacyAdmin = parseFloat(storedAdmin) || 0;
        adminBalanceValue = legacyAdmin;
      }

      // Merge with individual keys (enhanced format) for balances
      const allKeys = await storageService.getKeys('wallet_');
      
      // Process buyer balances
      const mergedBuyers = { ...storedBuyers };
      for (const key of allKeys.filter(k => k.startsWith('wallet_buyer_'))) {
        const username = key.replace('wallet_buyer_', '');
        const balanceInCents = await storageService.getItem<number>(key, 0);
        const balanceInDollars = balanceInCents / 100;
        
        // Use the higher balance to prevent data loss
        if (!mergedBuyers[username] || balanceInDollars > mergedBuyers[username]) {
          mergedBuyers[username] = balanceInDollars;
        }
      }

      // Process seller balances - FIXED to handle both number and object formats
      const mergedSellers: { [username: string]: number } = {};
      
      // First, process the collective stored sellers
      for (const [username, sellerData] of Object.entries(storedSellers)) {
        // Handle both number and object formats
        let balance = 0;
        
        if (typeof sellerData === 'number' && !isNaN(sellerData)) {
          balance = sellerData;
        } else if (sellerData && typeof sellerData === 'object' && 'balance' in sellerData) {
          const objBalance = (sellerData as any).balance;
          if (typeof objBalance === 'number' && !isNaN(objBalance)) {
            balance = objBalance;
          }
        }
        
        mergedSellers[username] = balance;
      }
      
      // Then, process individual keys (enhanced format)
      for (const key of allKeys.filter(k => k.startsWith('wallet_seller_'))) {
        const username = key.replace('wallet_seller_', '');
        const balanceInCents = await storageService.getItem<number>(key, 0);
        const balanceInDollars = balanceInCents / 100;
        
        // Use the higher balance to prevent data loss
        if (!mergedSellers[username] || balanceInDollars > mergedSellers[username]) {
          mergedSellers[username] = balanceInDollars;
        }
      }

      // MOCK DATA DETECTION AND CLEANUP
      const isMockDisabled = process.env.NEXT_PUBLIC_USE_MOCK_API !== 'true';
      
      if (isMockDisabled) {
        // Check if we've already cleared mock data
        const alreadyCleared = typeof localStorage !== 'undefined' && 
                             localStorage.getItem(MOCK_CLEARED_FLAG) === 'true';
        
        if (!alreadyCleared) {
          // Check if this looks like mock-seeded data
          const isClearlyMockSeeded = 
            (mergedSellers['alice'] === MOCK_SIGNATURES.aliceBalance) || 
            (mergedSellers['betty'] === MOCK_SIGNATURES.bettyBalance) ||
            (mergedSellers['carol'] === MOCK_SIGNATURES.carolBalance) ||
            (mergedSellers['diana'] === MOCK_SIGNATURES.dianaBalance) ||
            (mergedBuyers['buyer1'] === MOCK_SIGNATURES.buyer1Balance) ||
            (mergedBuyers['buyer2'] === MOCK_SIGNATURES.buyer2Balance) ||
            (mergedBuyers['buyer3'] === MOCK_SIGNATURES.buyer3Balance) ||
            (adminBalanceValue === MOCK_SIGNATURES.adminBalance);
            
          if (isClearlyMockSeeded) {
            console.warn('[WalletContext] Detected mock data while mock API is disabled. Clearing all wallet data...');
            
            // Clear all wallet data from storage
            const walletKeys = await storageService.getKeys('wallet_');
            for (const key of walletKeys) {
              await storageService.removeItem(key);
            }
            
            // Clear localStorage wallet data
            if (typeof localStorage !== 'undefined') {
              Object.keys(localStorage).forEach(key => {
                if (key.startsWith('wallet_')) {
                  localStorage.removeItem(key);
                }
              });
              
              // Set flag to prevent repeated clearing
              localStorage.setItem(MOCK_CLEARED_FLAG, 'true');
            }
            
            // Clear orders
            await ordersService.clearCache();
            await storageService.removeItem('wallet_orders');
            
            console.log('[WalletContext] Mock data cleared. Starting with clean slate.');
            
            // Set all state to empty/default values
            setBuyerBalancesState({});
            setSellerBalancesState({});
            setAdminBalanceState(0);
            setOrderHistory([]);
            setSellerWithdrawals({});
            setAdminWithdrawals([]);
            setAdminActions([]);
            setDepositLogs([]);
            setAuctionBidderTracking({}); // NEW
            
            return true;
          }
        }
      }

      // Normalize admin actions for backward compatibility
      const normalizedActions = storedAdminActions.map(action => ({
        ...action,
        targetUser: action.targetUser || action.username,
        username: action.username || action.targetUser,
      }));

      // Update state with loaded data
      setBuyerBalancesState(mergedBuyers);
      setSellerBalancesState(mergedSellers);
      setAdminBalanceState(adminBalanceValue);
      setOrderHistory(storedOrders);
      setSellerWithdrawals(storedSellerWithdrawals);
      setAdminWithdrawals(storedAdminWithdrawals);
      setAdminActions(normalizedActions);
      setDepositLogs(storedDepositLogs);
      setAuctionBidderTracking(storedAuctionTracking); // NEW

      console.log('[WalletContext] Data loaded successfully:', {
        buyers: Object.keys(mergedBuyers).length,
        sellers: Object.keys(mergedSellers).length,
        admin: adminBalanceValue,
        orders: storedOrders.length,
        adminActions: normalizedActions.length,
        deposits: storedDepositLogs.length,
        auctionListings: Object.keys(storedAuctionTracking).length // NEW
      });

      return true;
    } catch (error) {
      console.error('[WalletContext] Error loading wallet data:', error);
      setInitializationError('Failed to load wallet data');
      return false;
    }
  }, [loadAuctionBidderTracking]);

  // Initialize wallet service and load data
  useEffect(() => {
    const initializeWallet = async () => {
      // Prevent multiple initializations
      if (initializingRef.current || isInitialized) {
        return;
      }
      
      initializingRef.current = true;
      setIsLoading(true);
      setInitializationError(null);

      try {
        console.log('[WalletContext] Initializing wallet...');
        
        // Initialize wallet service first
        if (typeof walletService?.initialize === 'function') {
          await walletService.initialize();
        }
        
        // Load all data
        const loadSuccess = await loadAllData();
        
        if (loadSuccess) {
          setIsInitialized(true);
          console.log('[WalletContext] Wallet initialization complete');
        } else {
          throw new Error('Failed to load wallet data');
        }
      } catch (error) {
        console.error('[WalletContext] Initialization error:', error);
        setInitializationError(error instanceof Error ? error.message : 'Unknown error');
        // Still set initialized to true to prevent infinite retries
        setIsInitialized(true);
      } finally {
        setIsLoading(false);
        initializingRef.current = false;
      }
    };

    if (typeof window !== 'undefined') {
      initializeWallet();
    }
  }, []); // Empty dependency array - only run once

  // Debounced save effect
  useEffect(() => {
    if (!isInitialized || isLoading) return;

    // Increment data version to track changes
    dataVersionRef.current += 1;

    // Debounce save by 1 second
    const timeoutId = setTimeout(() => {
      saveAllData();
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [
    buyerBalances,
    sellerBalances,
    adminBalance,
    orderHistory,
    sellerWithdrawals,
    adminWithdrawals,
    adminActions,
    depositLogs,
    auctionBidderTracking, // NEW
    isInitialized,
    isLoading,
    saveAllData
  ]);

  // Clean up intervals on unmount
  useEffect(() => {
    return () => {
      if (sessionCheckIntervalRef.current) {
        clearInterval(sessionCheckIntervalRef.current);
      }
    };
  }, []);

  // Helper functions with validation
  const getBuyerBalance = useCallback((username: string): number => {
    try {
      const validatedUsername = validateUsername(username);
      return buyerBalances[validatedUsername] || 0;
    } catch {
      return 0;
    }
  }, [buyerBalances]);

  const setBuyerBalance = useCallback(async (username: string, balance: number) => {
    const validatedUsername = validateUsername(username);
    const validatedBalance = validateBalanceAmount(balance); // Use balance validation (allows 0)
    
    // Use transaction lock to prevent race conditions
    await transactionLock.current.acquireLock(`buyer_${validatedUsername}`, async () => {
      setBuyerBalancesState((prev) => ({
        ...prev,
        [validatedUsername]: validatedBalance,
      }));
      
      // Also update individual key for consistency
      const balanceInCents = Math.round(validatedBalance * 100);
      await storageService.setItem(`wallet_buyer_${validatedUsername}`, balanceInCents);
      
      // Use enhanced sync for better persistence
      await enhancedWalletSync(validatedUsername, 'buyer', validatedBalance);
      
      // Emit WebSocket update
      emitBalanceUpdate(validatedUsername, 'buyer', validatedBalance);
    });
  }, [emitBalanceUpdate]);

  const getSellerBalance = useCallback((seller: string): number => {
    try {
      const validatedSeller = validateUsername(seller);
      return sellerBalances[validatedSeller] || 0;
    } catch {
      return 0;
    }
  }, [sellerBalances]);

  const setSellerBalance = useCallback(async (seller: string, balance: number) => {
    const validatedSeller = validateUsername(seller);
    const validatedBalance = validateBalanceAmount(balance); // Use balance validation (allows 0)
    
    // Use transaction lock to prevent race conditions
    await transactionLock.current.acquireLock(`seller_${validatedSeller}`, async () => {
      setSellerBalancesState((prev) => ({
        ...prev,
        [validatedSeller]: validatedBalance,
      }));
      
      // Also update individual key for consistency
      const balanceInCents = Math.round(validatedBalance * 100);
      await storageService.setItem(`wallet_seller_${validatedSeller}`, balanceInCents);
      
      // Use enhanced sync for better persistence
      await enhancedWalletSync(validatedSeller, 'seller', validatedBalance);
      
      // Emit WebSocket update
      emitBalanceUpdate(validatedSeller, 'seller', validatedBalance);
    });
  }, [emitBalanceUpdate]);

  const setAdminBalance = useCallback(async (balance: number) => {
    const validatedBalance = validateBalanceAmount(balance); // Use balance validation (allows 0)
    
    // Use transaction lock to prevent race conditions
    await transactionLock.current.acquireLock('admin', async () => {
      setAdminBalanceState(validatedBalance);
    });
  }, []);

  const addOrder = useCallback(async (order: Order) => {
    // Sanitize order data
    const sanitizedOrder = {
      ...order,
      title: sanitizeStrict(order.title),
      description: sanitizeStrict(order.description),
      seller: validateUsername(order.seller),
      buyer: validateUsername(order.buyer),
      price: validateTransactionAmount(order.price), // Use transaction validation for prices
      markedUpPrice: validateTransactionAmount(order.markedUpPrice),
    };

    // Use ordersService to create the order
    const result = await ordersService.createOrder({
      title: sanitizedOrder.title,
      description: sanitizedOrder.description,
      price: sanitizedOrder.price,
      markedUpPrice: sanitizedOrder.markedUpPrice,
      imageUrl: order.imageUrl,
      seller: sanitizedOrder.seller,
      buyer: sanitizedOrder.buyer,
      tags: order.tags,
      wearTime: order.wearTime,
      wasAuction: order.wasAuction,
      finalBid: order.finalBid,
      deliveryAddress: order.deliveryAddress,
      tierCreditAmount: order.tierCreditAmount,
      isCustomRequest: order.isCustomRequest,
      originalRequestId: order.originalRequestId,
    });

    if (result.success && result.data) {
      // Update local state to maintain consistency
      setOrderHistory((prev) => [...prev, result.data!]);
    } else {
      console.error('[WalletContext] Failed to create order:', result.error);
      throw new Error(result.error?.message || 'Failed to create order');
    }
  }, []);

  const addDeposit = useCallback(async (
    username: string, 
    amount: number, 
    method: DepositLog['method'], 
    notes?: string
  ): Promise<boolean> => {
    try {
      // Check rate limit for deposits
      checkRateLimit('DEPOSIT', username);
      
      // Validate inputs
      const validatedUsername = validateUsername(username);
      const validatedAmount = validateTransactionAmount(amount); // Use transaction validation for deposits
      const validatedMethod = walletOperationSchemas.depositMethod.parse(method);
      const sanitizedNotes = notes ? sanitizeStrict(notes) : undefined;
      
      // IMPORTANT: Don't update balance here if it's already been updated by adminCreditUser
      // Check if this is being called from adminCreditUser by checking the notes
      const isFromAdminCredit = notes && notes.includes('Admin credit:');
      
      if (!isFromAdminCredit) {
        // Only update balance if this is NOT from adminCreditUser
        const currentBalance = getBuyerBalance(validatedUsername);
        await setBuyerBalance(validatedUsername, currentBalance + validatedAmount);
      }
      
      // Add deposit log
      const newDeposit: DepositLog = {
        id: uuidv4(),
        username: validatedUsername,
        amount: validatedAmount,
        method: validatedMethod,
        date: new Date().toISOString(),
        status: 'completed',
        transactionId: uuidv4(),
        notes: sanitizedNotes || `${method.replace('_', ' ')} deposit by ${validatedUsername}`
      };
      setDepositLogs(prev => [...prev, newDeposit]);
      
      return true;
    } catch (error) {
      console.error('Error processing deposit:', error);
      return false;
    }
  }, [getBuyerBalance, setBuyerBalance]);

  // FIXED: Hold funds for auction bid with tracking
  const holdBidFunds = useCallback(async (
    listingId: string,
    bidder: string,
    amount: number,
    auctionTitle: string
  ): Promise<boolean> => {
    try {
      // Check rate limit
      checkRateLimit('API_CALL', bidder);
      
      // Validate inputs
      const validatedBidder = validateUsername(bidder);
      const validatedAmount = validateTransactionAmount(amount);
      const sanitizedTitle = sanitizeStrict(auctionTitle);
      
      const buyerCurrentBalance = getBuyerBalance(validatedBidder);
      
      // FIXED: Calculate total with buyer fee (10%)
      const buyerFee = validatedAmount * 0.1;
      const totalWithFee = validatedAmount + buyerFee;
      
      console.log('[HoldBid] Holding funds:', { 
        bidder: validatedBidder, 
        bidAmount: validatedAmount, 
        buyerFee,
        totalWithFee,
        currentBalance: buyerCurrentBalance 
      });
      
      // Check balance including fee
      if (buyerCurrentBalance < totalWithFee) {
        console.error('[HoldBid] Insufficient balance:', { 
          buyerBalance: buyerCurrentBalance, 
          required: totalWithFee 
        });
        return false;
      }
      
      // Use transaction lock
      return await transactionLock.current.acquireLock(`bid_${listingId}_${validatedBidder}`, async () => {
        // Deduct from buyer's wallet INCLUDING FEE
        await setBuyerBalance(validatedBidder, buyerCurrentBalance - totalWithFee);
        
        // Create order using the service with all required fields
        const orderResult = await ordersService.createOrder({
          title: `Bid on: ${sanitizedTitle}`,
          description: `Pending bid for auction - ${validatedAmount.toFixed(2)} (total with fee: ${totalWithFee.toFixed(2)})`,
          price: validatedAmount,
          markedUpPrice: totalWithFee, // Store the total including fee
          seller: 'AUCTION_SYSTEM', // Special seller for auction bids
          buyer: validatedBidder,
          wasAuction: true,
          shippingStatus: 'pending-auction' as any, // Pass the status explicitly
          listingId: listingId, // This will now be saved properly
          listingTitle: sanitizedTitle,
        });

        if (orderResult.success && orderResult.data) {
          // Update local state
          setOrderHistory(prev => [...prev, orderResult.data!]);
          
          console.log('[HoldBid] ✅ Order created:', {
            orderId: orderResult.data.id,
            listingId: orderResult.data.listingId,
            shippingStatus: orderResult.data.shippingStatus,
            buyer: orderResult.data.buyer,
            amount: orderResult.data.markedUpPrice
          });
          
          // NEW: Update bidder tracking
          await updateBidderTracking(listingId, validatedBidder, validatedAmount, totalWithFee, true);
          
          console.log('[HoldBid] Funds held for bid:', { 
            bidder: validatedBidder, 
            bidAmount: validatedAmount,
            totalHeld: totalWithFee,
            listingId, 
            orderId: orderResult.data.id
          });
          
          return true;
        } else {
          // Rollback balance on failure
          await setBuyerBalance(validatedBidder, buyerCurrentBalance);
          console.error('[HoldBid] Failed to create pending order:', orderResult.error);
          return false;
        }
      });
    } catch (error) {
      console.error('[HoldBid] Error holding bid funds:', error);
      return false;
    }
  }, [getBuyerBalance, setBuyerBalance, updateBidderTracking]);

  // FIXED: Refund bid funds with better order lookup
  const refundBidFunds = useCallback(async (
  bidder: string,
  listingId: string
): Promise<boolean> => {
  try {
    // Validate inputs
    const validatedBidder = validateUsername(bidder);
    
    console.log('[RefundBid] ========== REFUND ATTEMPT ==========');
    console.log('[RefundBid] Called with:', { 
      bidder: validatedBidder, 
      listingId: listingId,
      timestamp: new Date().toISOString()
    });
    
    // Use transaction lock
    return await transactionLock.current.acquireLock(`refund_${listingId}_${validatedBidder}`, async () => {
      // CRITICAL FIX: Clear the orders cache to ensure we get fresh data
      ordersService.clearCache();
      
      // Add a small delay to ensure storage writes are complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Get the most recent order data from the service
      const ordersResult = await ordersService.getOrders();
      if (!ordersResult.success || !ordersResult.data) {
        console.error('[RefundBid] Failed to load orders for refund');
        return false;
      }
      
      console.log('[RefundBid] Orders from service:', ordersResult.data.length);
      
      // ALSO check the local orderHistory state which should have the most recent order
      const allOrders = [...(ordersResult.data || []), ...orderHistory];
      
      // Remove duplicates by ID
      const uniqueOrders = allOrders.filter((order, index, self) =>
        index === self.findIndex((o) => o.id === order.id)
      );
      
      console.log('[RefundBid] Order analysis:', {
        totalOrders: uniqueOrders.length,
        ordersFromService: ordersResult.data.length,
        ordersFromState: orderHistory.length,
        ordersForThisListing: uniqueOrders.filter(o => o.listingId === listingId).map(o => ({
          id: o.id,
          buyer: o.buyer,
          listingId: o.listingId,
          shippingStatus: o.shippingStatus,
          amount: o.markedUpPrice
        })),
        ordersForThisBidder: uniqueOrders.filter(o => o.buyer === validatedBidder).map(o => ({
          id: o.id,
          listingId: o.listingId,
          shippingStatus: o.shippingStatus,
          amount: o.markedUpPrice
        }))
      });
      
      // Find ALL pending auction orders for this bidder and listing
      const pendingOrders = uniqueOrders.filter(order => 
        order.buyer === validatedBidder && 
        order.listingId === listingId && 
        order.shippingStatus === 'pending-auction'
      );
      
      console.log('[RefundBid] Pending orders found:', pendingOrders.map(o => ({
        id: o.id,
        amount: o.markedUpPrice,
        created: o.date
      })));
      
      if (pendingOrders.length === 0) {
        console.log('[RefundBid] ❌ No pending orders found for bidder:', { 
          bidder: validatedBidder, 
          listingId,
          ordersChecked: uniqueOrders.length
        });
        return true; // Nothing to refund
      }
      
      // Calculate total refund amount (sum of all pending orders for this auction)
      let totalRefundAmount = 0;
      const orderIdsToRemove: string[] = [];
      
      for (const pendingOrder of pendingOrders) {
        console.log('[RefundBid] Processing order for refund:', { 
          orderId: pendingOrder.id, 
          amount: pendingOrder.markedUpPrice 
        });
        totalRefundAmount += pendingOrder.markedUpPrice;
        orderIdsToRemove.push(pendingOrder.id);
      }
      
      // Filter out the orders we're refunding
      const filteredOrders = uniqueOrders.filter(order => !orderIdsToRemove.includes(order.id));
      
      // Save the filtered orders back to storage
      await storageService.setItem('wallet_orders', filteredOrders);
      
      // Update local state
      setOrderHistory(filteredOrders);
      
      // Clear the orders service cache to ensure fresh data on next load
      ordersService.clearCache();
      
      // NOW refund the full amount including fees
      const currentBalance = getBuyerBalance(validatedBidder);
      const newBalance = currentBalance + totalRefundAmount;
      
      console.log('[RefundBid] Balance update:', {
        currentBalance,
        refundAmount: totalRefundAmount,
        newBalance
      });
      
      await setBuyerBalance(validatedBidder, newBalance);
      
      // Clear any auction tracking for this bidder
      const tracking = await loadAuctionBidderTracking();
      if (tracking[listingId] && tracking[listingId][validatedBidder]) {
        delete tracking[listingId][validatedBidder];
        if (Object.keys(tracking[listingId]).length === 0) {
          delete tracking[listingId];
        }
        await saveAuctionBidderTracking(tracking);
      }
      
      console.log('[RefundBid] ✅ Successfully refunded:', { 
        bidder: validatedBidder, 
        totalAmount: totalRefundAmount, 
        listingId,
        ordersRefunded: orderIdsToRemove.length
      });
      console.log('[RefundBid] ========== REFUND COMPLETE ==========');
      
      return true;
    });
  } catch (error) {
    console.error('[RefundBid] ❌ Error refunding bid:', error);
    return false;
  }
}, [getBuyerBalance, setBuyerBalance, orderHistory, loadAuctionBidderTracking, saveAuctionBidderTracking]);

  // NEW: Handle incremental bid charge with tracking
  const chargeIncrementalBid = useCallback(async (
    listingId: string,
    bidder: string,
    previousBid: number,
    newBid: number,
    listingTitle: string
  ): Promise<boolean> => {
    try {
      const validatedBidder = validateUsername(bidder);
      const bidDifference = newBid - previousBid;
      const incrementalFee = bidDifference * 0.1;
      const incrementalTotal = bidDifference + incrementalFee;
      
      const bidderBalance = getBuyerBalance(validatedBidder);
      if (bidderBalance < incrementalTotal) {
        console.error('[IncrementalBid] Insufficient balance:', { 
          balance: bidderBalance, 
          required: incrementalTotal 
        });
        return false;
      }
      
      return await transactionLock.current.acquireLock(`incremental_bid_${listingId}_${validatedBidder}`, async () => {
        // Deduct the incremental amount
        await setBuyerBalance(validatedBidder, bidderBalance - incrementalTotal);
        
        // Update the existing pending order amount
        const ordersResult = await ordersService.getOrders();
        if (!ordersResult.success || !ordersResult.data) {
          console.error('[IncrementalBid] Failed to load orders');
          return false;
        }
        
        const existingOrder = ordersResult.data.find(order => 
          order.buyer === validatedBidder && 
          order.listingId === listingId && 
          order.shippingStatus === 'pending-auction'
        );
        
        if (existingOrder) {
          // Update the existing order with new amounts
          const newTotalWithFee = newBid + (newBid * 0.1);
          
          // Update the order using ordersService
          await ordersService.updateOrderStatus(existingOrder.id, {
            price: newBid,
            markedUpPrice: newTotalWithFee,
            description: `Pending bid for auction - ${newBid.toFixed(2)} (total with fee: ${newTotalWithFee.toFixed(2)})`
          } as any);
          
          // Update local state
          setOrderHistory(prev => prev.map(order => 
            order.id === existingOrder.id 
              ? { ...order, price: newBid, markedUpPrice: newTotalWithFee }
              : order
          ));
        }
        
        // Update bidder tracking
        await updateBidderTracking(listingId, validatedBidder, newBid, incrementalTotal, true);
        
        console.log('[IncrementalBid] Charged incremental amount:', {
          bidder: validatedBidder,
          previousBid,
          newBid,
          charged: incrementalTotal,
          listingId
        });
        
        return true;
      });
    } catch (error) {
      console.error('[IncrementalBid] Error charging incremental bid:', error);
      return false;
    }
  }, [getBuyerBalance, setBuyerBalance, updateBidderTracking]);

  // NEW: Get all bidders for a listing from tracking
  const getAuctionBidders = useCallback(async (listingId: string): Promise<string[]> => {
    const tracking = await loadAuctionBidderTracking();
    const listingBidders = tracking[listingId] || {};
    return Object.keys(listingBidders);
  }, [loadAuctionBidderTracking]);

  // NEW: Clean up auction tracking after auction ends
  const cleanupAuctionTracking = useCallback(async (listingId: string, winner?: string) => {
    const tracking = await loadAuctionBidderTracking();
    
    if (tracking[listingId]) {
      // If there's a winner, remove only the winner from tracking (they've been processed)
      if (winner && tracking[listingId][winner]) {
        delete tracking[listingId][winner];
      }
      
      // If no bidders left, remove the listing entry
      if (Object.keys(tracking[listingId]).length === 0) {
        delete tracking[listingId];
      }
      
      await saveAuctionBidderTracking(tracking);
    }
  }, [loadAuctionBidderTracking, saveAuctionBidderTracking]);

  // ENHANCED purchaseListing with proper tracking and security - FIXED TO HANDLE IMAGE URLs
  const purchaseListing = useCallback(async (listing: Listing, buyerUsername: string): Promise<boolean> => {
    try {
      // Check rate limit for purchases
      checkRateLimit('API_CALL', buyerUsername);
      
      // Validate inputs
      const validatedBuyer = validateUsername(buyerUsername);
      const validatedSeller = validateUsername(listing.seller);
      
      console.log('[Purchase] Starting purchase:', { 
        listing: listing.title, 
        buyer: validatedBuyer, 
        price: listing.markedUpPrice,
        listingId: listing.id 
      });
      
      // DEBUG: Log the full listing object to see what we're working with
      console.log('[Purchase] Full listing object:', listing);
      console.log('[Purchase] Listing imageUrls:', listing.imageUrls);
      console.log('[Purchase] First image URL:', listing.imageUrls?.[0]);
      
      const sellerTierInfo = getSellerTierMemoized(validatedSeller, orderHistory);
      const tierCreditAmount = listing.price * sellerTierInfo.credit;
      
      // Calculate prices
      const price = listing.markedUpPrice || listing.price;
      const buyerCurrentBalance = getBuyerBalance(validatedBuyer);
      
      // Check balance first
      if (buyerCurrentBalance < price) {
        console.error('[Purchase] Insufficient balance:', { buyerBalance: buyerCurrentBalance, price });
        return false;
      }

      // Use transaction lock to prevent double-spending
      return await transactionLock.current.acquireLock(`purchase_${listing.id}_${validatedBuyer}`, async () => {
        // Generate idempotency key to prevent duplicate orders
        const idempotencyKey = ordersService.generateIdempotencyKey(validatedBuyer, validatedSeller, listing.id);
        
        // Check if order already exists
        const orderExists = await ordersService.checkOrderExists(idempotencyKey);
        if (orderExists) {
          console.log('[Purchase] Order already exists, skipping duplicate');
          return true;
        }
        
        // Calculate amounts
        const sellerCut = listing.price * 0.9 + tierCreditAmount;
        const platformFee = price - listing.price * 0.9;
        
        console.log('[Purchase] Calculated amounts:', {
          price,
          sellerCut,
          platformFee,
          tierCreditAmount
        });
        
        // Update balances atomically
        await setBuyerBalance(validatedBuyer, buyerCurrentBalance - price);
        await setSellerBalance(validatedSeller, (sellerBalances[validatedSeller] || 0) + sellerCut);
        await setAdminBalance(adminBalance + platformFee);
        
        // FIXED: Extract the first image URL properly
        let imageUrl: string | undefined = undefined;
        
        if (listing.imageUrls && Array.isArray(listing.imageUrls) && listing.imageUrls.length > 0) {
          imageUrl = listing.imageUrls[0];
          console.log('[Purchase] Using image URL from imageUrls array:', imageUrl);
        } else if ((listing as any).images && Array.isArray((listing as any).images) && (listing as any).images.length > 0) {
          // Fallback: Check if there's an 'images' property (legacy)
          imageUrl = (listing as any).images[0];
          console.log('[Purchase] Using image URL from legacy images array:', imageUrl);
        } else if ((listing as any).imageUrl) {
          // Fallback: Check if there's a single imageUrl property
          imageUrl = (listing as any).imageUrl;
          console.log('[Purchase] Using single imageUrl property:', imageUrl);
        } else {
          console.log('[Purchase] No image URL found in listing');
        }
        
        // Create order data with proper image URL
        const orderData = {
          title: sanitizeStrict(listing.title),
          description: sanitizeStrict(listing.description),
          price: listing.price,
          markedUpPrice: price,
          seller: validatedSeller,
          buyer: validatedBuyer,
          imageUrl: imageUrl, // This will now have the correct value
          tierCreditAmount,
          // Preserve auction metadata
          wasAuction: (listing as any).wasAuction || false,
          finalBid: (listing as any).finalBid,
          // Add listing ID for tracking
          listingId: listing.id,
        };
        
        console.log('[Purchase] Order data being created:', orderData);
        console.log('[Purchase] Order imageUrl:', orderData.imageUrl);
        
        // Create order using the service
        const orderResult = await ordersService.createOrder(orderData);

        if (orderResult.success && orderResult.data) {
          // Update local state
          setOrderHistory(prev => [...prev, orderResult.data!]);
          
          // Mark order as processed
          await ordersService.markOrderProcessed(idempotencyKey);
          
          console.log('[Purchase] Order created successfully:', orderResult.data);
          console.log('[Purchase] Order imageUrl in result:', orderResult.data.imageUrl);
          
          // Create admin action for platform fee tracking
          const platformFeeAction: AdminAction = {
            id: uuidv4(),
            type: 'credit' as const,
            amount: platformFee,
            targetUser: 'admin',
            username: 'admin',
            adminUser: 'system',
            reason: sanitizeStrict(`Platform fee from sale of "${listing.title}" by ${validatedSeller}`),
            date: new Date().toISOString(),
            role: 'buyer' as const
          };
          
          setAdminActions(prev => [...prev, platformFeeAction]);
          
          // Add notification
          if (addSellerNotification) {
            if (tierCreditAmount > 0) {
              addSellerNotification(
                validatedSeller,
                `New sale: "${sanitizeStrict(listing.title)}" for ${price.toFixed(2)} (includes ${tierCreditAmount.toFixed(2)} ${sellerTierInfo.tier} tier credit)`
              );
            } else {
              addSellerNotification(
                validatedSeller,
                `New sale: "${sanitizeStrict(listing.title)}" for ${price.toFixed(2)}`
              );
            }
          }
          
          return true;
        } else {
          // Rollback balance changes on failure
          await setBuyerBalance(validatedBuyer, buyerCurrentBalance);
          await setSellerBalance(validatedSeller, (sellerBalances[validatedSeller] || 0));
          await setAdminBalance(adminBalance);
          
          console.error('[Purchase] Failed to create order:', orderResult.error);
          return false;
        }
      });
    } catch (error) {
      console.error('[Purchase] Purchase error:', error);
      return false;
    }
  }, [orderHistory, addSellerNotification, getBuyerBalance, setBuyerBalance, setSellerBalance, setAdminBalance, sellerBalances, adminBalance]);

  // FIXED: NEW placeBid function with automatic refunds for outbid users
  const placeBid = useCallback(async (listingId: string, bidder: string, amount: number): Promise<boolean> => {
    try {
      // Validate inputs
      const validatedListingId = sanitizeStrict(listingId);
      const validatedBidder = validateUsername(bidder);
      const validatedAmount = validateTransactionAmount(amount);

      console.log('[PlaceBid] Starting bid placement:', {
        listingId: validatedListingId,
        bidder: validatedBidder,
        amount: validatedAmount
      });

      // Check rate limit for bidding
      checkRateLimit('API_CALL', validatedBidder);

      // Check buyer balance first
      const buyerCurrentBalance = getBuyerBalance(validatedBidder);
      const buyerFee = validatedAmount * 0.1; // 10% buyer fee
      const totalWithFee = validatedAmount + buyerFee;

      if (buyerCurrentBalance < totalWithFee) {
        console.error('[PlaceBid] Insufficient balance:', {
          buyerBalance: buyerCurrentBalance,
          required: totalWithFee
        });
        return false;
      }

      // Use transaction lock to prevent race conditions
      return await transactionLock.current.acquireLock(`bid_${validatedListingId}`, async () => {
        try {
          // Get current auction state from existing orders
          const ordersResult = await ordersService.getOrders();
          if (!ordersResult.success || !ordersResult.data) {
            console.error('[PlaceBid] Failed to load orders');
            return false;
          }

          // Find all pending auction orders for this listing
          const pendingAuctionOrders = ordersResult.data.filter(order => 
            order.listingId === validatedListingId && 
            order.shippingStatus === 'pending-auction'
          );

          console.log('[PlaceBid] Found pending auction orders:', pendingAuctionOrders.length);

          // Check if the bidder already has a pending bid
          const currentBidderOrder = pendingAuctionOrders.find(order => order.buyer === validatedBidder);
          
          // Find the current highest bid
          let currentHighestBid = 0;
          let currentHighestBidder: string | null = null;
          
          for (const order of pendingAuctionOrders) {
            if (order.price > currentHighestBid) {
              currentHighestBid = order.price;
              currentHighestBidder = order.buyer;
            }
          }

          console.log('[PlaceBid] Current auction state:', {
            highestBid: currentHighestBid,
            highestBidder: currentHighestBidder,
            bidderHasExistingBid: !!currentBidderOrder,
            existingBidAmount: currentBidderOrder?.price
          });

          // Validate bid amount
          if (validatedAmount <= currentHighestBid && currentHighestBidder !== validatedBidder) {
            console.error('[PlaceBid] Bid must be higher than current highest bid');
            return false;
          }

          // If bidder is already the highest bidder, handle incremental bid
          if (currentBidderOrder && currentHighestBidder === validatedBidder)
         {
           console.log('[PlaceBid] Bidder is raising their own bid');
           
           // For incremental bidding, charge only the difference
           const previousBid = currentBidderOrder.price;
           const bidDifference = validatedAmount - previousBid;
           const incrementalFee = bidDifference * 0.1;
          const incrementalTotal = bidDifference + incrementalFee;
          
          // Check if user has enough for the additional amount
          if (buyerCurrentBalance < incrementalTotal) {
            console.error('[PlaceBid] Insufficient balance for incremental bid');
            return false;
          }
          
          // Use the chargeIncrementalBid function
          const chargeSuccess = await chargeIncrementalBid(
            validatedListingId,
            validatedBidder,
            previousBid,
            validatedAmount,
            currentBidderOrder.listingTitle || `Auction ${validatedListingId}`
          );
          
          if (!chargeSuccess) {
            console.error('[PlaceBid] Failed to charge incremental bid');
            return false;
          }
          
          console.log('[PlaceBid] Incremental bid placed successfully');
          return true;
        }

        // CRITICAL FIX: Refund ALL other bidders when a new bid is placed
        console.log('[PlaceBid] Processing refunds for outbid users...');
        
        // Get all bidders who need refunds (everyone except the current bidder)
        const biddersToRefund = pendingAuctionOrders
          .filter(order => order.buyer !== validatedBidder)
          .map(order => order.buyer);
        
        // Remove duplicates
        const uniqueBiddersToRefund = [...new Set(biddersToRefund)];
        
        console.log('[PlaceBid] Bidders to refund:', uniqueBiddersToRefund);
        
        // Refund each outbid user
        for (const outbidUser of uniqueBiddersToRefund) {
          console.log(`[PlaceBid] Refunding ${outbidUser}...`);
          const refundSuccess = await refundBidFunds(outbidUser, validatedListingId);
          if (!refundSuccess) {
            console.error(`[PlaceBid] Failed to refund ${outbidUser}`);
            // Continue with other refunds even if one fails
          }
        }
        
        // If this bidder had a previous bid, refund it first
        if (currentBidderOrder) {
          console.log('[PlaceBid] Refunding bidder\'s previous bid before placing new one');
          const refundSuccess = await refundBidFunds(validatedBidder, validatedListingId);
          if (!refundSuccess) {
            console.error('[PlaceBid] Failed to refund previous bid');
            return false;
          }
        }

        // Hold the new bid funds
        const holdSuccess = await holdBidFunds(
          validatedListingId,
          validatedBidder,
          validatedAmount,
          `Auction ${validatedListingId}` // You should pass the actual listing title here
        );

        if (!holdSuccess) {
          console.error('[PlaceBid] Failed to hold bid funds');
          return false;
        }

        console.log('[PlaceBid] Bid placed successfully:', {
          listingId: validatedListingId,
          bidder: validatedBidder,
          amount: validatedAmount,
          refundedUsers: uniqueBiddersToRefund.length
        });

        return true;
      } catch (error) {
        console.error('[PlaceBid] Error in transaction lock:', error);
        return false;
      }
    });
  } catch (error) {
    console.error('[PlaceBid] Error placing bid:', error);
    return false;
  }
}, [getBuyerBalance, holdBidFunds, refundBidFunds, chargeIncrementalBid]);

// Finalize auction purchase (money already held) with security
const finalizeAuctionPurchase = useCallback(async (
  listing: Listing,
  winnerUsername: string,
  winningBid: number
): Promise<boolean> => {
  try {
    // Validate inputs
    const validatedWinner = validateUsername(winnerUsername);
    const validatedSeller = validateUsername(listing.seller);
    const validatedBid = validateTransactionAmount(winningBid);
    
    console.log('[FinalizeAuction] Starting finalization:', { 
      listing: listing.title, 
      winner: validatedWinner, 
      price: validatedBid 
    });
    
    // Use transaction lock
    return await transactionLock.current.acquireLock(`auction_${listing.id}`, async () => {
      // Find the winner's pending order
      const ordersResult = await ordersService.getOrders();
      if (!ordersResult.success || !ordersResult.data) {
        console.error('[FinalizeAuction] Failed to load orders');
        return false;
      }
      
      const pendingOrder = ordersResult.data.find(order => 
        order.buyer === validatedWinner && 
        order.listingId === listing.id && 
        order.shippingStatus === 'pending-auction'
      );
      
      if (!pendingOrder) {
        console.error('[FinalizeAuction] No pending order found for winner');
        return false;
      }
      
      const sellerTierInfo = getSellerTierMemoized(validatedSeller, orderHistory);
      const tierCreditAmount = validatedBid * sellerTierInfo.credit;
      
      // FIXED: Calculate amounts properly recognizing buyer fee was already paid
      // The pending order has the full amount including buyer fee
      const totalPaidByBuyer = pendingOrder.markedUpPrice; // This includes the 10% buyer fee
      const actualBidAmount = validatedBid; // The base bid amount
      const buyerFee = totalPaidByBuyer - actualBidAmount; // Should be 10% of bid
      const sellerFee = actualBidAmount * 0.1; // 10% seller fee
      const sellerCut = actualBidAmount - sellerFee + tierCreditAmount; // What seller receives
      const totalPlatformFee = buyerFee + sellerFee; // Total platform revenue (20%)
      
      console.log('[FinalizeAuction] Calculated amounts:', {
        winningBid: actualBidAmount,
        totalPaidByBuyer,
        buyerFee,
        sellerFee,
        sellerCut,
        totalPlatformFee,
        tierCreditAmount
      });
      
      // Money was already deducted when bid was placed
      // Just distribute to seller and admin
      await setSellerBalance(validatedSeller, (sellerBalances[validatedSeller] || 0) + sellerCut);
      await setAdminBalance(adminBalance + totalPlatformFee);
      
      // Remove the pending auction order
      const filteredOrders = ordersResult.data.filter(order => order.id !== pendingOrder.id);
      
      // FIXED: Extract image URL properly for auction listings
      let imageUrl: string | undefined = undefined;
      
      if (listing.imageUrls && Array.isArray(listing.imageUrls) && listing.imageUrls.length > 0) {
        imageUrl = listing.imageUrls[0];
      } else if ((listing as any).images && Array.isArray((listing as any).images) && (listing as any).images.length > 0) {
        imageUrl = (listing as any).images[0];
      } else if ((listing as any).imageUrl) {
        imageUrl = (listing as any).imageUrl;
      }
      
      // Create the final order using ordersService
      const finalOrderResult = await ordersService.createOrder({
        title: sanitizeStrict(listing.title),
        description: sanitizeStrict(listing.description),
        price: actualBidAmount,
        markedUpPrice: totalPaidByBuyer, // Keep the total paid including buyer fee
        imageUrl: imageUrl, // Use the extracted image URL
        seller: validatedSeller,
        buyer: validatedWinner,
        tags: listing.tags,
        wasAuction: true,
        finalBid: actualBidAmount,
        shippingStatus: 'pending',
        tierCreditAmount,
        listingId: listing.id,
      });
      
      if (!finalOrderResult.success || !finalOrderResult.data) {
        console.error('[FinalizeAuction] Failed to create final order');
        // Rollback seller and admin balances
        await setSellerBalance(validatedSeller, (sellerBalances[validatedSeller] || 0) - sellerCut);
        await setAdminBalance(adminBalance - totalPlatformFee);
        return false;
      }
      
      // Update the filtered orders (without the pending order) in storage
      await storageService.setItem('wallet_orders', filteredOrders);
      
      // Update local state with the new final order
      setOrderHistory(prev => [...prev.filter(o => o.id !== pendingOrder.id), finalOrderResult.data!]);
      
      // Clear cache
      ordersService.clearCache();
      
      // NEW: Clean up the winner from auction tracking
      await cleanupAuctionTracking(listing.id, validatedWinner);
      
      // CRITICAL: Refund all losing bidders
      console.log('[FinalizeAuction] Processing refunds for losing bidders...');
      
      // Find all other bidders who need refunds
      const losingBidders = ordersResult.data
        .filter(order => 
          order.listingId === listing.id && 
          order.shippingStatus === 'pending-auction' &&
          order.buyer !== validatedWinner
        )
        .map(order => order.buyer);
      
      // Remove duplicates
      const uniqueLosingBidders = [...new Set(losingBidders)];
      
      console.log('[FinalizeAuction] Losing bidders to refund:', uniqueLosingBidders);
      
      // Refund each losing bidder
      for (const loser of uniqueLosingBidders) {
        console.log(`[FinalizeAuction] Refunding losing bidder ${loser}...`);
        const refundSuccess = await refundBidFunds(loser, listing.id);
        if (!refundSuccess) {
          console.error(`[FinalizeAuction] Failed to refund ${loser}`);
          // Continue with other refunds even if one fails
        }
      }
      
      // Create admin action for platform fee tracking
      const platformFeeAction: AdminAction = {
        id: uuidv4(),
        type: 'credit' as const,
        amount: totalPlatformFee,
        targetUser: 'admin',
        username: 'admin',
        adminUser: 'system',
        reason: sanitizeStrict(`Platform fee from auction sale of "${listing.title}" by ${validatedSeller} (buyer fee: ${buyerFee.toFixed(2)}, seller fee: ${sellerFee.toFixed(2)})`),
        date: new Date().toISOString(),
        role: 'buyer' as const
      };
      
      setAdminActions(prev => [...prev, platformFeeAction]);
      
      // Add notification
      if (addSellerNotification) {
        if (tierCreditAmount > 0) {
          addSellerNotification(
            validatedSeller,
            `🏆 Auction ended: "${sanitizeStrict(listing.title)}" sold to ${validatedWinner} for ${actualBidAmount.toFixed(2)} (you receive ${sellerCut.toFixed(2)} including ${tierCreditAmount.toFixed(2)} ${sellerTierInfo.tier} tier credit)`
          );
        } else {
          addSellerNotification(
            validatedSeller,
            `🏆 Auction ended: "${sanitizeStrict(listing.title)}" sold to ${validatedWinner} for ${actualBidAmount.toFixed(2)} (you receive ${sellerCut.toFixed(2)})`
          );
        }
      }
      
      console.log('[FinalizeAuction] Auction finalized successfully, refunded', uniqueLosingBidders.length, 'losing bidders');
      return true;
    });
  } catch (error) {
    console.error('[FinalizeAuction] Error:', error);
    return false;
  }
}, [orderHistory, addSellerNotification, setSellerBalance, setAdminBalance, sellerBalances, adminBalance, cleanupAuctionTracking, refundBidFunds]);

const purchaseCustomRequest = useCallback(async (customRequest: CustomRequestPurchase): Promise<boolean> => {
  try {
    // Check rate limit
    checkRateLimit('CUSTOM_REQUEST', customRequest.buyer);
    
    // Validate inputs
    const validatedBuyer = validateUsername(customRequest.buyer);
    const validatedSeller = validateUsername(customRequest.seller);
    const validatedAmount = validateTransactionAmount(customRequest.amount);
    const sanitizedDescription = sanitizeStrict(customRequest.description);
    
    const markedUpPrice = validatedAmount * 1.1;
    const buyerCurrentBalance = getBuyerBalance(validatedBuyer);
    
    if (buyerCurrentBalance < markedUpPrice) {
      return false;
    }
    
    // Use transaction lock
    return await transactionLock.current.acquireLock(`custom_${customRequest.requestId}`, async () => {
      // Calculate amounts
      const sellerCut = validatedAmount * 0.9;
      const platformFee = markedUpPrice - sellerCut;
      
      // Update balances
      await setBuyerBalance(validatedBuyer, buyerCurrentBalance - markedUpPrice);
      await setSellerBalance(validatedSeller, (sellerBalances[validatedSeller] || 0) + sellerCut);
      await setAdminBalance(adminBalance + platformFee);
      
      // Create order using the service
      const orderResult = await ordersService.createOrder({
        title: sanitizedDescription,
        description: sanitizedDescription,
        price: validatedAmount,
        markedUpPrice,
        seller: validatedSeller,
        buyer: validatedBuyer,
        isCustomRequest: true,
        originalRequestId: customRequest.requestId,
      });

      if (orderResult.success && orderResult.data) {
        // Update local state
        setOrderHistory(prev => [...prev, orderResult.data!]);
        
        if (addSellerNotification) {
          addSellerNotification(
            validatedSeller,
            `Custom request purchased by ${validatedBuyer} for ${validatedAmount.toFixed(2)}`
          );
        }
        
        return true;
      } else {
        // Rollback balance changes
        await setBuyerBalance(validatedBuyer, buyerCurrentBalance);
        await setSellerBalance(validatedSeller, (sellerBalances[validatedSeller] || 0));
        await setAdminBalance(adminBalance);
        
        return false;
      }
    });
  } catch (error) {
    console.error('Custom request purchase error:', error);
    return false;
  }
}, [addSellerNotification, getBuyerBalance, setBuyerBalance, setSellerBalance, setAdminBalance, sellerBalances, adminBalance]);

const subscribeToSellerWithPayment = useCallback(async (
  buyer: string,
  seller: string,
  amount: number
): Promise<boolean> => {
  try {
    // Check rate limit
    checkRateLimit('API_CALL', buyer);
    
    // Validate inputs
    const validatedBuyer = validateUsername(buyer);
    const validatedSeller = validateUsername(seller);
    const validatedAmount = validateTransactionAmount(amount);
    
    const buyerBalance = getBuyerBalance(validatedBuyer);
    
    if (buyerBalance < validatedAmount) {
      return false;
    }
    
    // Use transaction lock
    return await transactionLock.current.acquireLock(`subscribe_${validatedBuyer}_${validatedSeller}`, async () => {
      // Calculate amounts
      const sellerCut = validatedAmount * 0.75;
      const adminCut = validatedAmount * 0.25;
      
      // Update balances
      await setBuyerBalance(validatedBuyer, buyerBalance - validatedAmount);
      await setSellerBalance(validatedSeller, (sellerBalances[validatedSeller] || 0) + sellerCut);
      await setAdminBalance(adminBalance + adminCut);
      
      // Create admin action for subscription tracking
      const action: AdminAction = {
        id: uuidv4(),
        type: 'credit',
        amount: adminCut,
        targetUser: 'admin',
        username: 'admin',
        adminUser: 'system',
        reason: sanitizeStrict(`Subscription revenue from ${validatedBuyer} to ${validatedSeller} - ${validatedAmount}/month`),
        date: new Date().toISOString(),
        role: 'seller'
      };
      
      // Update admin actions
      setAdminActions(prev => [...prev, action]);
      
      if (addSellerNotification) {
        addSellerNotification(
          validatedSeller,
          `New subscriber: ${validatedBuyer} paid ${validatedAmount.toFixed(2)}/month`
        );
      }
      
      return true;
    });
  } catch (error) {
    console.error('Subscription payment error:', error);
    return false;
  }
}, [addSellerNotification, getBuyerBalance, setBuyerBalance, setSellerBalance, setAdminBalance, sellerBalances, adminBalance]);

const sendTip = useCallback(async (buyer: string, seller: string, amount: number): Promise<boolean> => {
  try {
    // Check rate limit
    checkRateLimit('TIP', buyer);
    
    // Validate inputs
    const validatedBuyer = validateUsername(buyer);
    const validatedSeller = validateUsername(seller);
    const validatedAmount = validateTransactionAmount(amount);
    
    const buyerBalance = getBuyerBalance(validatedBuyer);
    
    if (buyerBalance < validatedAmount) {
      return false;
    }
    
    // Use transaction lock
    return await transactionLock.current.acquireLock(`tip_${validatedBuyer}_${validatedSeller}`, async () => {
      // Update balances
      await setBuyerBalance(validatedBuyer, buyerBalance - validatedAmount);
      await setSellerBalance(validatedSeller, (sellerBalances[validatedSeller] || 0) + validatedAmount);
      
      if (addSellerNotification) {
        addSellerNotification(
          validatedSeller,
          `💰 Tip received from ${validatedBuyer} - ${validatedAmount.toFixed(2)}`
        );
      }
      
      return true;
    });
  } catch (error) {
    console.error('Error sending tip:', error);
    return false;
  }
}, [addSellerNotification, getBuyerBalance, setBuyerBalance, setSellerBalance, sellerBalances]);

const addSellerWithdrawal = useCallback(async (username: string, amount: number) => {
  try {
    // Check rate limit
    checkRateLimit('WITHDRAWAL', username);
    
    // Validate inputs
    const validatedUsername = validateUsername(username);
    const validatedAmount = validateTransactionAmount(amount);
    
    const currentBalance = getSellerBalance(validatedUsername);
    if (currentBalance < validatedAmount) {
      throw new Error('Insufficient balance');
    }
    
    // Use transaction lock
    await transactionLock.current.acquireLock(`withdrawal_${validatedUsername}`, async () => {
      // Update balance first
      await setSellerBalance(validatedUsername, currentBalance - validatedAmount);
      
      const date = new Date().toISOString();
      const newWithdrawal: Withdrawal = { amount: validatedAmount, date, status: 'completed' };
      
      // Update state and persist immediately
      setSellerWithdrawals((prev) => {
        const updated = {
          ...prev,
          [validatedUsername]: [...(prev[validatedUsername] || []), newWithdrawal],
        };
        
        // Persist to storage immediately
        storageService.setItem(STORAGE_KEYS.SELLER_WITHDRAWALS, updated)
          .catch(error => console.error('Failed to persist withdrawals:', error));
        
        return updated;
      });
      
      // Force save all data to ensure persistence
      setTimeout(() => {
        saveAllData();
      }, 100);
    });
  } catch (error) {
    throw error;
  }
}, [getSellerBalance, setSellerBalance, saveAllData]);

const addAdminWithdrawal = useCallback(async (amount: number) => {
  try {
    // Check rate limit
    checkRateLimit('WITHDRAWAL', 'admin');
    
    // Validate inputs
    const validatedAmount = validateTransactionAmount(amount);
    
    if (adminBalance < validatedAmount) {
      throw new Error('Insufficient admin balance');
    }
    
    // Use transaction lock
    await transactionLock.current.acquireLock('admin_withdrawal', async () => {
      await setAdminBalance(adminBalance - validatedAmount);
      
      const date = new Date().toISOString();
      const newWithdrawal: Withdrawal = { amount: validatedAmount, date, status: 'pending' };
      setAdminWithdrawals((prev) => [...prev, newWithdrawal]);
    });
  } catch (error) {
    throw error;
  }
}, [adminBalance, setAdminBalance]);

const updateWallet = useCallback((username: string, amount: number, orderToFulfil?: Order) => {
  // This is a legacy method, now handled through transactions
  console.warn('updateWallet is deprecated, use transaction-based methods');
}, []);

const adminCreditUser = useCallback(async (
  username: string,
  role: 'buyer' | 'seller',
  amount: number,
  reason: string
): Promise<boolean> => {
  try {
    // Check rate limit
    checkRateLimit('REPORT_ACTION', 'admin');
    
    // Validate inputs
    const validatedUsername = validateUsername(username);
    const validatedAmount = validateTransactionAmount(amount);
    const sanitizedReason = sanitizeStrict(reason);
    
    // Validate reason
    const reasonValidation = walletOperationSchemas.reason.safeParse(sanitizedReason);
    if (!reasonValidation.success) {
      throw new Error('Invalid reason');
    }
    
    // Use transaction lock
    return await transactionLock.current.acquireLock(`admin_credit_${validatedUsername}`, async () => {
      if (role === 'buyer') {
        const currentBalance = getBuyerBalance(validatedUsername);
        await setBuyerBalance(validatedUsername, currentBalance + validatedAmount);
        
        // FIXED: Only add deposit log, don't double-update the balance
        const depositLog: DepositLog = {
          id: uuidv4(),
          username: validatedUsername,
          amount: validatedAmount,
          method: 'admin_credit',
          date: new Date().toISOString(),
          status: 'completed',
          transactionId: uuidv4(),
          notes: `Admin credit: ${sanitizedReason}`
        };
        setDepositLogs(prev => [...prev, depositLog]);
      } else {
        const currentBalance = getSellerBalance(validatedUsername);
        await setSellerBalance(validatedUsername, currentBalance + validatedAmount);
      }
      
      const currentUser = typeof window !== 'undefined' ? 
        localStorage.getItem('currentUser') : null;
      const adminUser = currentUser ? JSON.parse(currentUser).username : 'Unknown Admin';
      
      const action: AdminAction = {
        id: uuidv4(),
        type: 'credit',
        amount: validatedAmount,
        targetUser: validatedUsername,
        username: validatedUsername,
        adminUser: sanitizeUsername(adminUser),
        reason: sanitizedReason,
        date: new Date().toISOString(),
        role,
      };
      
      setAdminActions(prev => [...prev, action]);
      
      // Store admin action
      await storageService.setItem('wallet_adminActions', [...adminActions, action]);
      
      // Emit transaction event
      if (isConnected) {
        sendMessage(WebSocketEvent.WALLET_TRANSACTION, {
          type: 'admin_credit',
          username: validatedUsername,
          role,
          amount: validatedAmount,
          reason: sanitizedReason,
          adminUser,
          timestamp: Date.now()
        });
      }
      
      // Force sync the balance
      if (role === 'buyer') {
        await forceSyncWalletBalance(validatedUsername);
      }
      
      // Force update balances in Header and other components
      if (typeof window !== 'undefined' && (window as any).__pantypost_balance_context?.forceUpdate) {
        setTimeout(() => {
          (window as any).__pantypost_balance_context.forceUpdate();
        }, 100);
      }
      
      return true;
    });
  } catch (error) {
    console.error('Admin credit error:', error);
    return false;
  }
}, [getBuyerBalance, setBuyerBalance, getSellerBalance, setSellerBalance, adminActions, isConnected, sendMessage]);

const adminDebitUser = useCallback(async (
  username: string,
  role: 'buyer' | 'seller',
  amount: number,
  reason: string
): Promise<boolean> => {
  try {
    // Check rate limit
    checkRateLimit('REPORT_ACTION', 'admin');
    
    // Validate inputs
    const validatedUsername = validateUsername(username);
    const validatedAmount = validateTransactionAmount(amount);
    const sanitizedReason = sanitizeStrict(reason);
    
    // Validate reason
    const reasonValidation = walletOperationSchemas.reason.safeParse(sanitizedReason);
    if (!reasonValidation.success) {
      throw new Error('Invalid reason');
    }
    
    const currentBalance = role === 'buyer' ? getBuyerBalance(validatedUsername) : getSellerBalance(validatedUsername);
    
    if (currentBalance < validatedAmount) {
      return false;
    }
    
    // Use transaction lock
    return await transactionLock.current.acquireLock(`admin_debit_${validatedUsername}`, async () => {
      if (role === 'buyer') {
        await setBuyerBalance(validatedUsername, currentBalance - validatedAmount);
      } else {
        await setSellerBalance(validatedUsername, currentBalance - validatedAmount);
      }
      
      const currentUser = typeof window !== 'undefined' ? 
        localStorage.getItem('currentUser') : null;
      const adminUser = currentUser ? JSON.parse(currentUser).username : 'Unknown Admin';
      
      const action: AdminAction = {
        id: uuidv4(),
        type: 'debit',
        amount: validatedAmount,
        targetUser: validatedUsername,
        username: validatedUsername,
        adminUser: sanitizeUsername(adminUser),
        reason: sanitizedReason,
        date: new Date().toISOString(),
        role,
      };
      
      setAdminActions(prev => [...prev, action]);
      
      // Store admin action
      await storageService.setItem('wallet_adminActions', [...adminActions, action]);
      
      // Emit transaction event
      if (isConnected) {
        sendMessage(WebSocketEvent.WALLET_TRANSACTION, {
          type: 'admin_debit',
          username: validatedUsername,
          role,
          amount: validatedAmount,
          reason: sanitizedReason,
          adminUser,
          timestamp: Date.now()
        });
      }
      
      // Force sync the balance
      if (role === 'buyer') {
        await forceSyncWalletBalance(validatedUsername);
      }
      
      // Force update balances in Header and other components
      if (typeof window !== 'undefined' && (window as any).__pantypost_balance_context?.forceUpdate) {
        setTimeout(() => {
          (window as any).__pantypost_balance_context.forceUpdate();
        }, 100);
      }
      
      return true;
    });
  } catch (error) {
    console.error('Admin debit error:', error);
    return false;
  }
}, [getBuyerBalance, setBuyerBalance, getSellerBalance, setSellerBalance, adminActions, isConnected, sendMessage]);

const updateOrderAddress = useCallback(async (orderId: string, address: DeliveryAddress) => {
  // Sanitize address data based on the actual DeliveryAddress type from AddressConfirmationModal
  const sanitizedAddress: DeliveryAddress = {
    fullName: sanitizeStrict(address.fullName),
    addressLine1: sanitizeStrict(address.addressLine1),
    addressLine2: address.addressLine2 ? sanitizeStrict(address.addressLine2) : undefined,
    city: sanitizeStrict(address.city),
    state: sanitizeStrict(address.state),
    postalCode: sanitizeStrict(address.postalCode),
    country: sanitizeStrict(address.country),
    specialInstructions: address.specialInstructions ? sanitizeStrict(address.specialInstructions) : undefined,
  };

  // Use ordersService to update the address
  const result = await ordersService.updateOrderAddress(orderId, sanitizedAddress);
  
  if (result.success && result.data) {
    // Update local state to maintain consistency
    setOrderHistory(prev => prev.map(order =>
      order.id === orderId ? { ...order, deliveryAddress: sanitizedAddress } : order
    ));
  } else {
    console.error('[WalletContext] Failed to update order address:', result.error);
    throw new Error(result.error?.message || 'Failed to update order address');
  }
}, []);

const updateShippingStatus = useCallback(async (orderId: string, status: 'pending' | 'processing' | 'shipped') => {
  // Use ordersService to update the status
  const result = await ordersService.updateOrderStatus(orderId, { shippingStatus: status });
  
  if (result.success && result.data) {
    // Update local state to maintain consistency
    setOrderHistory(prev => prev.map(order =>
      order.id === orderId ? { ...order, shippingStatus: status } : order
    ));
  } else {
    console.error('[WalletContext] Failed to update shipping status:', result.error);
    throw new Error(result.error?.message || 'Failed to update shipping status');
  }
}, []);

const getDepositsForUser = useCallback((username: string): DepositLog[] => {
  try {
    const validatedUsername = validateUsername(username);
    return depositLogs.filter(log => log.username === validatedUsername);
  } catch {
    return [];
  }
}, [depositLogs]);

const getTotalDeposits = useCallback((): number => {
  return depositLogs
    .filter(log => log.status === 'completed')
    .reduce((sum, log) => sum + log.amount, 0);
}, [depositLogs]);

const getDepositsByTimeframe = useCallback((timeframe: 'today' | 'week' | 'month' | 'year' | 'all'): DepositLog[] => {
  const now = new Date();
  const startDate = new Date();
  
  switch (timeframe) {
    case 'today':
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'week':
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(now.getMonth() - 1);
      break;
    case 'year':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    case 'all':
      return depositLogs.filter(log => log.status === 'completed');
  }
  
  return depositLogs.filter(log => 
    log.status === 'completed' && 
    new Date(log.date) >= startDate
  );
}, [depositLogs]);

// New enhanced features with security
const checkSuspiciousActivity = useCallback(async (username: string) => {
  try {
    const validatedUsername = validateUsername(username);
    
    // Check for suspicious patterns
    const suspiciousPatterns: string[] = [];
    
    // Check for rapid transactions
    const recentOrders = orderHistory.filter(order => 
      (order.buyer === validatedUsername || order.seller === validatedUsername) &&
      new Date(order.date).getTime() > Date.now() - 3600000 // Last hour
    );
    
    if (recentOrders.length > 10) {
      suspiciousPatterns.push('High transaction volume in short period');
    }
    
    // Check for unusual amounts
    const userOrders = orderHistory.filter(order => 
      order.buyer === validatedUsername || order.seller === validatedUsername
    );
    
    const avgAmount = userOrders.reduce((sum, order) => sum + order.markedUpPrice, 0) / userOrders.length;
    const hasUnusualAmounts = userOrders.some(order => 
      order.markedUpPrice > avgAmount * 5 || order.markedUpPrice < avgAmount * 0.1
    );
    
    if (hasUnusualAmounts) {
      suspiciousPatterns.push('Unusual transaction amounts detected');
    }
    
    // Check wallet service if available
    if (walletService?.checkSuspiciousActivity) {
      const serviceResult = await walletService.checkSuspiciousActivity(validatedUsername);
      if (serviceResult.suspicious) {
        suspiciousPatterns.push(...serviceResult.reasons);
      }
    }
    
    return {
      suspicious: suspiciousPatterns.length > 0,
      reasons: suspiciousPatterns,
    };
  } catch (error) {
    console.error('Error checking suspicious activity:', error);
    return { suspicious: false, reasons: [] };
  }
}, [orderHistory]);

const reconcileBalance = useCallback(async (
  username: string, 
  role: 'buyer' | 'seller' | 'admin'
) => {
  try {
    const validatedUsername = role === 'admin' ? 'admin' : validateUsername(username);
    
    if (typeof WalletIntegration?.reconcileBalance === 'function') {
      return await WalletIntegration.reconcileBalance(validatedUsername, role);
    }
    
    // Manual reconciliation if integration not available
    const transactions = orderHistory.filter(order => {
      if (role === 'buyer') return order.buyer === validatedUsername;
      if (role === 'seller') return order.seller === validatedUsername;
      return false;
    });
    
    const deposits = role === 'buyer' ? getDepositsForUser(validatedUsername) : [];
    const withdrawals = role === 'seller' ? (sellerWithdrawals[validatedUsername] || []) : 
                       role === 'admin' ? adminWithdrawals : [];
    
    return {
      username: validatedUsername,
      role,
      currentBalance: role === 'buyer' ? getBuyerBalance(validatedUsername) :
                     role === 'seller' ? getSellerBalance(validatedUsername) :
                     adminBalance,
      transactions: transactions.length,
      deposits: deposits.length,
      withdrawals: withdrawals.length,
      reconciled: true,
    };
  } catch (error) {
    console.error('Error reconciling balance:', error);
    return null;
  }
}, [orderHistory, getDepositsForUser, sellerWithdrawals, adminWithdrawals, getBuyerBalance, getSellerBalance, adminBalance]);

const getTransactionHistory = useCallback(async (username?: string, limit?: number) => {
  try {
    const validatedUsername = username ? validateUsername(username) : undefined;
    
    if (typeof WalletIntegration?.getFormattedTransactionHistory === 'function') {
      return await WalletIntegration.getFormattedTransactionHistory(validatedUsername, { limit });
    }
    
    // Manual transaction history
    let transactions = orderHistory;
    
    if (validatedUsername) {
      transactions = transactions.filter(order => 
        order.buyer === validatedUsername || order.seller === validatedUsername
      );
    }
    
    // Sort by date descending
    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Apply limit
    if (limit && limit > 0) {
      transactions = transactions.slice(0, limit);
    }
    
    return transactions.map(order => ({
      id: order.id,
      type: order.buyer === validatedUsername ? 'purchase' : 'sale',
      amount: order.markedUpPrice,
      date: order.date,
      description: order.title,
      counterparty: order.buyer === validatedUsername ? order.seller : order.buyer,
    }));
  } catch (error) {
    console.error('Error getting transaction history:', error);
    return [];
  }
}, [orderHistory]);

// Reload data function with security
const reloadData = useCallback(async () => {
  if (isLoading) {
    console.log('[WalletContext] Already loading, skipping reload');
    return;
  }
  
  // Check rate limit for data reload
  try {
    checkRateLimit('API_CALL', 'system_reload');
  } catch (error) {
    console.error('[WalletContext] Rate limit exceeded for reload');
    return;
  }
  
  setIsLoading(true);
  try {
    await loadAllData();
  } finally {
    setIsLoading(false);
  }
}, [loadAllData, isLoading]);

// Global balance update context
useEffect(() => {
  if (typeof window !== 'undefined') {
    (window as any).__pantypost_balance_context = {
      forceUpdate: () => {
        console.log('Force update triggered');
        // Trigger re-render in Header and other components
        setBuyerBalancesState(prev => ({ ...prev }));
        setSellerBalancesState(prev => ({ ...prev }));
      }
    };
  }
}, []);

// Listen for storage events to sync across tabs
useEffect(() => {
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === 'wallet_buyers' || e.key === 'wallet_sellers' || e.key === 'wallet_admin') {
      console.log('Storage change detected, reloading wallet data');
      loadAllData();
    }
  };

  window.addEventListener('storage', handleStorageChange);
  return () => window.removeEventListener('storage', handleStorageChange);
}, [loadAllData]);

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
  addAdminWithdrawal,
  wallet: { ...buyerBalances, ...sellerBalances, admin: adminBalance },
  updateWallet,
  sendTip,
  setAddSellerNotificationCallback,
  adminCreditUser,
  adminDebitUser,
  adminActions,
  updateOrderAddress,
  updateShippingStatus,
  depositLogs,
  addDeposit,
  getDepositsForUser,
  getTotalDeposits,
  getDepositsByTimeframe,
  
  // Auction bid methods
  holdBidFunds,
  refundBidFunds,
  finalizeAuctionPurchase,
  
  // FIXED: Add the placeBid function to the context value
  placeBid,
  
  // NEW: Add auction tracking methods
  chargeIncrementalBid,
  getAuctionBidders,
  cleanupAuctionTracking,
  
  // Enhanced features
  checkSuspiciousActivity,
  reconcileBalance,
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