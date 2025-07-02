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
import { walletService, storageService, ordersService } from '@/services';
import { WalletIntegration } from '@/services/wallet.integration';
import { v4 as uuidv4 } from 'uuid';

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
} as const;

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
  
  // Loading and initialization state
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  
  // Refs to prevent multiple initializations and saves
  const initializingRef = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveRef = useRef<number>(0);
  const pendingSaveRef = useRef(false);

  const setAddSellerNotificationCallback = (fn: (seller: string, message: string) => void) => {
    setAddSellerNotification(() => fn);
  };

  // Consolidated save function with debouncing
  const saveAllData = useCallback(async () => {
    // Prevent saves if not initialized
    if (!isInitialized) {
      console.log('[WalletContext] Skipping save - not initialized');
      return;
    }

    // Debounce saves to prevent rapid successive saves
    const now = Date.now();
    if (now - lastSaveRef.current < 100) {
      // Schedule a save for later
      if (!pendingSaveRef.current) {
        pendingSaveRef.current = true;
        setTimeout(() => {
          pendingSaveRef.current = false;
          saveAllData();
        }, 100);
      }
      return;
    }
    
    lastSaveRef.current = now;

    try {
      console.log('[WalletContext] Saving all wallet data...');
      
      // Use batch save for atomic operation
      // Type as generic array to allow dynamic keys
      const saveOperations: Array<{ key: string; value: any }> = [
        { key: STORAGE_KEYS.BUYER_BALANCES, value: buyerBalances },
        { key: STORAGE_KEYS.SELLER_BALANCES, value: sellerBalances },
        { key: STORAGE_KEYS.ADMIN_BALANCE, value: adminBalance.toString() },
        // Note: Orders are now managed by ordersService, but we still save here for backward compatibility
        { key: STORAGE_KEYS.ORDERS, value: orderHistory },
        { key: STORAGE_KEYS.SELLER_WITHDRAWALS, value: sellerWithdrawals },
        { key: STORAGE_KEYS.ADMIN_WITHDRAWALS, value: adminWithdrawals },
        { key: STORAGE_KEYS.ADMIN_ACTIONS, value: adminActions },
        { key: STORAGE_KEYS.DEPOSIT_LOGS, value: depositLogs },
      ];

      // Also save individual balance keys for enhanced compatibility
      Object.entries(buyerBalances).forEach(([username, balance]) => {
        const balanceInCents = Math.round(balance * 100);
        saveOperations.push({ 
          key: `wallet_buyer_${username}`, 
          value: balanceInCents 
        });
      });

      Object.entries(sellerBalances).forEach(([username, balance]) => {
        const balanceInCents = Math.round(balance * 100);
        saveOperations.push({ 
          key: `wallet_seller_${username}`, 
          value: balanceInCents 
        });
      });

      // Save admin balance in enhanced format
      const adminBalanceInCents = Math.round(adminBalance * 100);
      saveOperations.push({ 
        key: 'wallet_admin_enhanced', 
        value: adminBalanceInCents 
      });

      // Execute batch save
      const success = await storageService.batchSet(saveOperations);
      
      if (!success) {
        console.error('[WalletContext] Failed to save wallet data');
      } else {
        console.log('[WalletContext] Wallet data saved successfully');
      }
    } catch (error) {
      console.error('[WalletContext] Error saving wallet data:', error);
    }
  }, [
    isInitialized,
    buyerBalances,
    sellerBalances,
    adminBalance,
    orderHistory,
    sellerWithdrawals,
    adminWithdrawals,
    adminActions,
    depositLogs
  ]);

  // Load all data from storage
  const loadAllData = useCallback(async () => {
    try {
      console.log('[WalletContext] Loading wallet data...');
      
      // Load collective data first (legacy format)
      const [
        storedBuyers,
        storedSellers,
        storedAdmin,
        // Orders are now loaded from ordersService
        storedSellerWithdrawals,
        storedAdminWithdrawals,
        storedAdminActions,
        storedDepositLogs
      ] = await Promise.all([
        storageService.getItem<{ [username: string]: number }>(STORAGE_KEYS.BUYER_BALANCES, {}),
        storageService.getItem<{ [username: string]: number }>(STORAGE_KEYS.SELLER_BALANCES, {}),
        storageService.getItem<string>(STORAGE_KEYS.ADMIN_BALANCE, '0'),
        storageService.getItem<{ [username: string]: Withdrawal[] }>(STORAGE_KEYS.SELLER_WITHDRAWALS, {}),
        storageService.getItem<Withdrawal[]>(STORAGE_KEYS.ADMIN_WITHDRAWALS, []),
        storageService.getItem<AdminAction[]>(STORAGE_KEYS.ADMIN_ACTIONS, []),
        storageService.getItem<DepositLog[]>(STORAGE_KEYS.DEPOSIT_LOGS, [])
      ]);

      // Load orders using the service
      const ordersResult = await ordersService.getOrders();
      const storedOrders = ordersResult.success && ordersResult.data ? ordersResult.data : [];

      // Parse admin balance
      let adminBalanceValue = parseFloat(storedAdmin) || 0;

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

      // Process seller balances
      const mergedSellers = { ...storedSellers };
      for (const key of allKeys.filter(k => k.startsWith('wallet_seller_'))) {
        const username = key.replace('wallet_seller_', '');
        const balanceInCents = await storageService.getItem<number>(key, 0);
        const balanceInDollars = balanceInCents / 100;
        
        // Use the higher balance to prevent data loss
        if (!mergedSellers[username] || balanceInDollars > mergedSellers[username]) {
          mergedSellers[username] = balanceInDollars;
        }
      }

      // Check for enhanced admin balance
      const adminEnhanced = await storageService.getItem<number>('wallet_admin_enhanced', 0);
      if (adminEnhanced > 0) {
        const adminEnhancedInDollars = adminEnhanced / 100;
        adminBalanceValue = Math.max(adminBalanceValue, adminEnhancedInDollars);
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

      console.log('[WalletContext] Data loaded successfully:', {
        buyers: Object.keys(mergedBuyers).length,
        sellers: Object.keys(mergedSellers).length,
        admin: adminBalanceValue,
        orders: storedOrders.length,
        adminActions: normalizedActions.length,
        deposits: storedDepositLogs.length
      });

      return true;
    } catch (error) {
      console.error('[WalletContext] Error loading wallet data:', error);
      setInitializationError('Failed to load wallet data');
      return false;
    }
  }, []);

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
      } finally {
        setIsLoading(false);
        initializingRef.current = false;
      }
    };

    if (typeof window !== 'undefined') {
      initializeWallet();
    }
  }, []); // Only run once on mount

  // Save data when state changes (debounced)
  useEffect(() => {
    if (!isInitialized) return;

    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce saves by 500ms
    saveTimeoutRef.current = setTimeout(() => {
      saveAllData();
    }, 500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [
    buyerBalances,
    sellerBalances,
    adminBalance,
    orderHistory,
    sellerWithdrawals,
    adminWithdrawals,
    adminActions,
    depositLogs,
    isInitialized,
    saveAllData
  ]);

  // Force update Header balance when context updates
  useEffect(() => {
    if (!isInitialized || typeof window === 'undefined') return;
    
    // Trigger a custom event to update the header
    const event = new CustomEvent('walletUpdate', { 
      detail: { buyerBalances, sellerBalances, adminBalance } 
    });
    window.dispatchEvent(event);
  }, [buyerBalances, sellerBalances, adminBalance, isInitialized]);

  // Helper functions
  const getBuyerBalance = useCallback((username: string): number => {
    return buyerBalances[username] || 0;
  }, [buyerBalances]);

  const setBuyerBalance = useCallback(async (username: string, balance: number) => {
    setBuyerBalancesState((prev) => ({
      ...prev,
      [username]: balance,
    }));
  }, []);

  const getSellerBalance = useCallback((seller: string): number => {
    return sellerBalances[seller] || 0;
  }, [sellerBalances]);

  const setSellerBalance = useCallback(async (seller: string, balance: number) => {
    setSellerBalancesState((prev) => ({
      ...prev,
      [seller]: balance,
    }));
  }, []);

  const setAdminBalance = useCallback(async (balance: number) => {
    setAdminBalanceState(balance);
  }, []);

  const addOrder = useCallback(async (order: Order) => {
    // Use ordersService to create the order
    const result = await ordersService.createOrder({
      title: order.title,
      description: order.description,
      price: order.price,
      markedUpPrice: order.markedUpPrice,
      imageUrl: order.imageUrl,
      seller: order.seller,
      buyer: order.buyer,
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
      // Update buyer balance
      const currentBalance = getBuyerBalance(username);
      await setBuyerBalance(username, currentBalance + amount);
      
      // Add deposit log
      const newDeposit: DepositLog = {
        id: uuidv4(),
        username,
        amount,
        method,
        date: new Date().toISOString(),
        status: 'completed',
        transactionId: uuidv4(),
        notes: notes || `${method.replace('_', ' ')} deposit by ${username}`
      };
      setDepositLogs(prev => [...prev, newDeposit]);
      
      return true;
    } catch (error) {
      console.error('Error processing deposit:', error);
      return false;
    }
  }, [getBuyerBalance, setBuyerBalance]);

  // ENHANCED purchaseListing with proper tracking
  const purchaseListing = useCallback(async (listing: Listing, buyerUsername: string): Promise<boolean> => {
    try {
      console.log('[Purchase] Starting purchase:', { listing: listing.title, buyer: buyerUsername, price: listing.markedUpPrice });
      
      const sellerTierInfo = getSellerTierMemoized(listing.seller, orderHistory);
      const tierCreditAmount = listing.price * sellerTierInfo.credit;
      
      // Calculate prices
      const price = listing.markedUpPrice || listing.price;
      const buyerCurrentBalance = getBuyerBalance(buyerUsername);
      
      // Check balance first
      if (buyerCurrentBalance < price) {
        console.error('[Purchase] Insufficient balance:', { buyerBalance: buyerCurrentBalance, price });
        return false;
      }

      // Generate idempotency key to prevent duplicate orders
      const idempotencyKey = ordersService.generateIdempotencyKey(buyerUsername, listing.seller, listing.id);
      
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
      
      // Update balances
      await setBuyerBalance(buyerUsername, buyerCurrentBalance - price);
      await setSellerBalance(listing.seller, (sellerBalances[listing.seller] || 0) + sellerCut);
      await setAdminBalance(adminBalance + platformFee);
      
      // Create order using the service
      const orderResult = await ordersService.createOrder({
        title: listing.title,
        description: listing.description,
        price: listing.price,
        markedUpPrice: price,
        seller: listing.seller,
        buyer: buyerUsername,
        imageUrl: listing.imageUrls?.[0],
        tierCreditAmount,
        // Preserve auction metadata
        wasAuction: (listing as any).wasAuction || false,
        finalBid: (listing as any).finalBid
      });

      if (orderResult.success && orderResult.data) {
        // Update local state
        setOrderHistory(prev => [...prev, orderResult.data!]);
        
        // Mark order as processed
        await ordersService.markOrderProcessed(idempotencyKey);
        
        console.log('[Purchase] Order created:', orderResult.data);
        
        // Create admin action for platform fee tracking
        const platformFeeAction: AdminAction = {
          id: uuidv4(),
          type: 'credit' as const,
          amount: platformFee,
          targetUser: 'admin',
          username: 'admin',
          adminUser: 'system',
          reason: `Platform fee from sale of "${listing.title}" by ${listing.seller}`,
          date: new Date().toISOString(),
          role: 'buyer' as const
        };
        
        setAdminActions(prev => [...prev, platformFeeAction]);
        
        // Add notification
        if (addSellerNotification) {
          if (tierCreditAmount > 0) {
            addSellerNotification(
              listing.seller,
              `New sale: "${listing.title}" for $${price.toFixed(2)} (includes $${tierCreditAmount.toFixed(2)} ${sellerTierInfo.tier} tier credit)`
            );
          } else {
            addSellerNotification(
              listing.seller,
              `New sale: "${listing.title}" for $${price.toFixed(2)}`
            );
          }
        }
        
        return true;
      } else {
        // Rollback balance changes on failure
        await setBuyerBalance(buyerUsername, buyerCurrentBalance);
        await setSellerBalance(listing.seller, (sellerBalances[listing.seller] || 0));
        await setAdminBalance(adminBalance);
        
        console.error('[Purchase] Failed to create order:', orderResult.error);
        return false;
      }
    } catch (error) {
      console.error('[Purchase] Purchase error:', error);
      return false;
    }
  }, [orderHistory, addSellerNotification, getBuyerBalance, setBuyerBalance, setSellerBalance, setAdminBalance, sellerBalances, adminBalance]);

  // Finalize auction purchase (money already held)
  const finalizeAuctionPurchase = useCallback(async (
    listing: Listing,
    winnerUsername: string,
    winningBid: number
  ): Promise<boolean> => {
    try {
      console.log('[FinalizeAuction] Starting finalization:', { 
        listing: listing.title, 
        winner: winnerUsername, 
        price: winningBid 
      });
      
      // Find the winner's pending order
      const ordersResult = await ordersService.getOrders();
      if (!ordersResult.success || !ordersResult.data) {
        console.error('[FinalizeAuction] Failed to load orders');
        return false;
      }
      
      const pendingOrder = ordersResult.data.find(order => 
        order.buyer === winnerUsername && 
        order.listingId === listing.id && 
        order.shippingStatus === 'pending-auction'
      );
      
      if (!pendingOrder) {
        console.error('[FinalizeAuction] No pending order found for winner');
        return false;
      }
      
      const sellerTierInfo = getSellerTierMemoized(listing.seller, orderHistory);
      const tierCreditAmount = winningBid * sellerTierInfo.credit;
      
      // Calculate amounts (no markup for auctions)
      const sellerCut = winningBid * 0.9 + tierCreditAmount;
      const platformFee = winningBid * 0.1;
      
      console.log('[FinalizeAuction] Calculated amounts:', {
        winningBid,
        sellerCut,
        platformFee,
        tierCreditAmount
      });
      
      // Money was already deducted when bid was placed
      // Just distribute to seller and admin
      await setSellerBalance(listing.seller, (sellerBalances[listing.seller] || 0) + sellerCut);
      await setAdminBalance(adminBalance + platformFee);
      
      // Remove the pending auction order
      const filteredOrders = ordersResult.data.filter(order => order.id !== pendingOrder.id);
      
      // Create the final order using ordersService
      const finalOrderResult = await ordersService.createOrder({
        title: listing.title,
        description: listing.description,
        price: winningBid,
        markedUpPrice: winningBid,
        imageUrl: listing.imageUrls?.[0],
        seller: listing.seller,
        buyer: winnerUsername,
        tags: listing.tags,
        wasAuction: true,
        finalBid: winningBid,
        shippingStatus: 'pending',
        tierCreditAmount,
        listingId: listing.id,
      });
      
      if (!finalOrderResult.success || !finalOrderResult.data) {
        console.error('[FinalizeAuction] Failed to create final order');
        // Rollback seller and admin balances
        await setSellerBalance(listing.seller, (sellerBalances[listing.seller] || 0) - sellerCut);
        await setAdminBalance(adminBalance - platformFee);
        return false;
      }
      
      // Update the filtered orders (without the pending order) in storage
      await storageService.setItem('wallet_orders', filteredOrders);
      
      // Update local state with the new final order
      setOrderHistory(prev => [...prev.filter(o => o.id !== pendingOrder.id), finalOrderResult.data!]);
      
      // Clear cache
      ordersService.clearCache();
      
      // Create admin action for platform fee tracking
      const platformFeeAction: AdminAction = {
        id: uuidv4(),
        type: 'credit' as const,
        amount: platformFee,
        targetUser: 'admin',
        username: 'admin',
        adminUser: 'system',
        reason: `Platform fee from auction sale of "${listing.title}" by ${listing.seller}`,
        date: new Date().toISOString(),
        role: 'buyer' as const
      };
      
      setAdminActions(prev => [...prev, platformFeeAction]);
      
      // Add notification
      if (addSellerNotification) {
        if (tierCreditAmount > 0) {
          addSellerNotification(
            listing.seller,
            `🏆 Auction ended: "${listing.title}" sold to ${winnerUsername} for ${winningBid.toFixed(2)} (includes ${tierCreditAmount.toFixed(2)} ${sellerTierInfo.tier} tier credit)`
          );
        } else {
          addSellerNotification(
            listing.seller,
            `🏆 Auction ended: "${listing.title}" sold to ${winnerUsername} for ${winningBid.toFixed(2)}`
          );
        }
      }
      
      console.log('[FinalizeAuction] Auction finalized successfully');
      return true;
    } catch (error) {
      console.error('[FinalizeAuction] Error:', error);
      return false;
    }
  }, [orderHistory, addSellerNotification, setSellerBalance, setAdminBalance, sellerBalances, adminBalance]);

  // Hold funds for auction bid
  const holdBidFunds = useCallback(async (
    listingId: string,
    bidder: string,
    amount: number,
    auctionTitle: string
  ): Promise<boolean> => {
    try {
      const buyerCurrentBalance = getBuyerBalance(bidder);
      
      // Check balance
      if (buyerCurrentBalance < amount) {
        console.error('[HoldBid] Insufficient balance:', { buyerBalance: buyerCurrentBalance, amount });
        return false;
      }
      
      // Deduct from buyer's wallet
      await setBuyerBalance(bidder, buyerCurrentBalance - amount);
      
      // Create order using the service with all required fields
      const orderResult = await ordersService.createOrder({
        title: `Bid on: ${auctionTitle}`,
        description: `Pending bid for auction - ${amount.toFixed(2)}`,
        price: amount,
        markedUpPrice: amount, // No markup for bids
        seller: 'AUCTION_SYSTEM', // Special seller for auction bids
        buyer: bidder,
        wasAuction: true,
        shippingStatus: 'pending-auction' as any, // Pass the status explicitly
        listingId: listingId, // This will now be saved properly
        listingTitle: auctionTitle,
      });

      if (orderResult.success && orderResult.data) {
        // Update local state
        setOrderHistory(prev => [...prev, orderResult.data!]);
        
        console.log('[HoldBid] Funds held for bid:', { 
          bidder, 
          amount, 
          listingId, 
          orderId: orderResult.data.id
        });
        
        return true;
      } else {
        // Rollback balance on failure
        await setBuyerBalance(bidder, buyerCurrentBalance);
        console.error('[HoldBid] Failed to create pending order:', orderResult.error);
        return false;
      }
    } catch (error) {
      console.error('[HoldBid] Error holding bid funds:', error);
      return false;
    }
  }, [getBuyerBalance, setBuyerBalance]);

  // Refund bid funds
  const refundBidFunds = useCallback(async (
    bidder: string,
    listingId: string
  ): Promise<boolean> => {
    try {
      console.log('[RefundBid] Starting refund for:', { bidder, listingId });
      
      // First, let's see what's in local state
      const localPendingOrders = orderHistory.filter(order => 
        order.buyer === bidder && 
        order.shippingStatus === 'pending-auction'
      );
      console.log('[RefundBid] Local pending orders:', localPendingOrders);
      
      // Load fresh order data from storage to ensure we have the latest
      const ordersResult = await ordersService.getOrders();
      if (!ordersResult.success || !ordersResult.data) {
        console.error('[RefundBid] Failed to load orders for refund');
        return false;
      }
      
      // Find all pending auction orders for this buyer
      const buyerPendingOrders = ordersResult.data.filter(order => 
        order.buyer === bidder && 
        order.shippingStatus === 'pending-auction'
      );
      console.log('[RefundBid] Storage pending orders for buyer:', buyerPendingOrders);
      
      // Find the specific pending auction order for this listing
      const pendingOrder = ordersResult.data.find(order => 
        order.buyer === bidder && 
        order.listingId === listingId && 
        order.shippingStatus === 'pending-auction'
      );
      
      if (!pendingOrder) {
        console.error('[RefundBid] No pending order found for refund', { 
          bidder, 
          listingId,
          totalOrders: ordersResult.data.length,
          pendingAuctionOrders: ordersResult.data.filter(o => o.shippingStatus === 'pending-auction').length
        });
        return false;
      }
      
      console.log('[RefundBid] Found pending order:', pendingOrder);
      
      // Refund to buyer's wallet
      const currentBalance = getBuyerBalance(bidder);
      await setBuyerBalance(bidder, currentBalance + pendingOrder.price);
      
      // Remove the pending order from storage
      const filteredOrders = ordersResult.data.filter(order => order.id !== pendingOrder.id);
      
      // Save the filtered orders back to storage
      await storageService.setItem('wallet_orders', filteredOrders);
      
      // Update local state
      setOrderHistory(filteredOrders);
      
      // Clear the orders service cache
      ordersService.clearCache();
      
      console.log('[RefundBid] Refunded bid:', { 
        bidder, 
        amount: pendingOrder.price, 
        listingId, 
        orderId: pendingOrder.id 
      });
      return true;
    } catch (error) {
      console.error('[RefundBid] Error refunding bid:', error);
      return false;
    }
  }, [getBuyerBalance, setBuyerBalance, orderHistory]);

  const purchaseCustomRequest = useCallback(async (customRequest: CustomRequestPurchase): Promise<boolean> => {
    try {
      const markedUpPrice = customRequest.amount * 1.1;
      const buyerCurrentBalance = getBuyerBalance(customRequest.buyer);
      
      if (buyerCurrentBalance < markedUpPrice) {
        return false;
      }
      
      // Calculate amounts
      const sellerCut = customRequest.amount * 0.9;
      const platformFee = markedUpPrice - sellerCut;
      
      // Update balances
      await setBuyerBalance(customRequest.buyer, buyerCurrentBalance - markedUpPrice);
      await setSellerBalance(customRequest.seller, (sellerBalances[customRequest.seller] || 0) + sellerCut);
      await setAdminBalance(adminBalance + platformFee);
      
      // Create order using the service
      const orderResult = await ordersService.createOrder({
        title: customRequest.description,
        description: customRequest.description,
        price: customRequest.amount,
        markedUpPrice,
        seller: customRequest.seller,
        buyer: customRequest.buyer,
        isCustomRequest: true,
        originalRequestId: customRequest.requestId,
      });

      if (orderResult.success && orderResult.data) {
        // Update local state
        setOrderHistory(prev => [...prev, orderResult.data!]);
        
        if (addSellerNotification) {
          addSellerNotification(
            customRequest.seller,
            `Custom request purchased by ${customRequest.buyer} for $${customRequest.amount.toFixed(2)}`
          );
        }
        
        return true;
      } else {
        // Rollback balance changes
        await setBuyerBalance(customRequest.buyer, buyerCurrentBalance);
        await setSellerBalance(customRequest.seller, (sellerBalances[customRequest.seller] || 0));
        await setAdminBalance(adminBalance);
        
        return false;
      }
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
      const buyerBalance = getBuyerBalance(buyer);
      
      if (buyerBalance < amount) {
        return false;
      }
      
      // Calculate amounts
      const sellerCut = amount * 0.75;
      const adminCut = amount * 0.25;
      
      // Update balances
      await setBuyerBalance(buyer, buyerBalance - amount);
      await setSellerBalance(seller, (sellerBalances[seller] || 0) + sellerCut);
      await setAdminBalance(adminBalance + adminCut);
      
      // Create admin action for subscription tracking
      const action: AdminAction = {
        id: uuidv4(),
        type: 'credit',
        amount: adminCut,
        targetUser: 'admin',
        username: 'admin',
        adminUser: 'system',
        reason: `Subscription revenue from ${buyer} to ${seller} - $${amount}/month`,
        date: new Date().toISOString(),
        role: 'seller'
      };
      
      // Update admin actions
      setAdminActions(prev => [...prev, action]);
      
      if (addSellerNotification) {
        addSellerNotification(
          seller,
          `New subscriber: ${buyer} paid $${amount.toFixed(2)}/month`
        );
      }
      
      return true;
    } catch (error) {
      console.error('Subscription payment error:', error);
      return false;
    }
  }, [addSellerNotification, getBuyerBalance, setBuyerBalance, setSellerBalance, setAdminBalance, sellerBalances, adminBalance]);

  const sendTip = useCallback(async (buyer: string, seller: string, amount: number): Promise<boolean> => {
    try {
      const buyerBalance = getBuyerBalance(buyer);
      
      if (buyerBalance < amount) {
        return false;
      }
      
      // Update balances
      await setBuyerBalance(buyer, buyerBalance - amount);
      await setSellerBalance(seller, (sellerBalances[seller] || 0) + amount);
      
      if (addSellerNotification) {
        addSellerNotification(
          seller,
          `💰 Tip received from ${buyer} - $${amount.toFixed(2)}`
        );
      }
      
      return true;
    } catch (error) {
      console.error('Error sending tip:', error);
      return false;
    }
  }, [addSellerNotification, getBuyerBalance, setBuyerBalance, setSellerBalance, sellerBalances]);

  const addSellerWithdrawal = useCallback(async (username: string, amount: number) => {
    try {
      const currentBalance = getSellerBalance(username);
      if (currentBalance < amount) {
        throw new Error('Insufficient balance');
      }
      
      await setSellerBalance(username, currentBalance - amount);
      
      const date = new Date().toISOString();
      const newWithdrawal: Withdrawal = { amount, date, status: 'pending' };
      setSellerWithdrawals((prev) => ({
        ...prev,
        [username]: [...(prev[username] || []), newWithdrawal],
      }));
    } catch (error) {
      throw error;
    }
  }, [getSellerBalance, setSellerBalance]);

  const addAdminWithdrawal = useCallback(async (amount: number) => {
    try {
      if (adminBalance < amount) {
        throw new Error('Insufficient admin balance');
      }
      
      await setAdminBalance(adminBalance - amount);
      
      const date = new Date().toISOString();
      const newWithdrawal: Withdrawal = { amount, date, status: 'pending' };
      setAdminWithdrawals((prev) => [...prev, newWithdrawal]);
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
      if (role === 'buyer') {
        const currentBalance = getBuyerBalance(username);
        await setBuyerBalance(username, currentBalance + amount);
        
        // Add deposit log for buyer credits related to deposits
        if (reason.toLowerCase().includes('deposit') || reason.toLowerCase().includes('wallet')) {
          await addDeposit(username, amount, 'admin_credit', `Admin credit: ${reason}`);
        }
      } else {
        const currentBalance = getSellerBalance(username);
        await setSellerBalance(username, currentBalance + amount);
      }
      
      const currentUser = typeof window !== 'undefined' ? 
        localStorage.getItem('currentUser') : null;
      const adminUser = currentUser ? JSON.parse(currentUser).username : 'Unknown Admin';
      
      const action: AdminAction = {
        id: uuidv4(),
        type: 'credit',
        amount,
        targetUser: username,
        username: username,
        adminUser,
        reason,
        date: new Date().toISOString(),
        role,
      };
      
      setAdminActions(prev => [...prev, action]);
      
      return true;
    } catch (error) {
      console.error('Admin credit error:', error);
      return false;
    }
  }, [getBuyerBalance, setBuyerBalance, getSellerBalance, setSellerBalance, addDeposit]);

  const adminDebitUser = useCallback(async (
    username: string,
    role: 'buyer' | 'seller',
    amount: number,
    reason: string
  ): Promise<boolean> => {
    try {
      const currentBalance = role === 'buyer' ? getBuyerBalance(username) : getSellerBalance(username);
      
      if (currentBalance < amount) {
        return false;
      }
      
      if (role === 'buyer') {
        await setBuyerBalance(username, currentBalance - amount);
      } else {
        await setSellerBalance(username, currentBalance - amount);
      }
      
      const currentUser = typeof window !== 'undefined' ? 
        localStorage.getItem('currentUser') : null;
      const adminUser = currentUser ? JSON.parse(currentUser).username : 'Unknown Admin';
      
      const action: AdminAction = {
        id: uuidv4(),
        type: 'debit',
        amount,
        targetUser: username,
        username: username,
        adminUser,
        reason,
        date: new Date().toISOString(),
        role,
      };
      
      setAdminActions(prev => [...prev, action]);
      
      return true;
    } catch (error) {
      console.error('Admin debit error:', error);
      return false;
    }
  }, [getBuyerBalance, setBuyerBalance, getSellerBalance, setSellerBalance]);

  const updateOrderAddress = useCallback(async (orderId: string, address: DeliveryAddress) => {
    // Use ordersService to update the address
    const result = await ordersService.updateOrderAddress(orderId, address);
    
    if (result.success && result.data) {
      // Update local state to maintain consistency
      setOrderHistory(prev => prev.map(order =>
        order.id === orderId ? { ...order, deliveryAddress: address } : order
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
    return depositLogs.filter(log => log.username === username);
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

  // New enhanced features
  const checkSuspiciousActivity = useCallback(async (username: string) => {
    if (walletService?.checkSuspiciousActivity) {
      const result = await walletService.checkSuspiciousActivity(username);
      return {
        suspicious: result.suspicious,
        reasons: result.reasons,
      };
    }
    return { suspicious: false, reasons: [] };
  }, []);

  const reconcileBalance = useCallback(async (
    username: string, 
    role: 'buyer' | 'seller' | 'admin'
  ) => {
    if (typeof WalletIntegration?.reconcileBalance === 'function') {
      return await WalletIntegration.reconcileBalance(username, role);
    }
    return null;
  }, []);

  const getTransactionHistory = useCallback(async (username?: string, limit?: number) => {
    if (typeof WalletIntegration?.getFormattedTransactionHistory === 'function') {
      return await WalletIntegration.getFormattedTransactionHistory(username, { limit });
    }
    return [];
  }, []);

  // Reload data function
  const reloadData = useCallback(async () => {
    setIsLoading(true);
    try {
      await loadAllData();
    } finally {
      setIsLoading(false);
    }
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