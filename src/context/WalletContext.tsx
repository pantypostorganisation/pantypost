// src/context/WalletContext.tsx
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { DeliveryAddress } from '@/components/AddressConfirmationModal';
import { getSellerTierMemoized } from '@/utils/sellerTiers';
import { walletService, storageService } from '@/services';
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
  shippingStatus?: 'pending' | 'processing' | 'shipped';
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
  
  // New enhanced features
  checkSuspiciousActivity: (username: string) => Promise<{ suspicious: boolean; reasons: string[] }>;
  reconcileBalance: (username: string, role: 'buyer' | 'seller' | 'admin') => Promise<any>;
  getTransactionHistory: (username?: string, limit?: number) => Promise<any[]>;
};

export const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  // State management
  const [buyerBalances, setBuyerBalancesState] = useState<{ [username: string]: number }>({});
  const [adminBalance, setAdminBalanceState] = useState<number>(0);
  const [sellerBalances, setSellerBalancesState] = useState<{ [username: string]: number }>({});
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);
  const [sellerWithdrawals, setSellerWithdrawals] = useState<{ [username: string]: Withdrawal[] }>({});
  const [adminWithdrawals, setAdminWithdrawals] = useState<Withdrawal[]>([]);
  const [adminActions, setAdminActions] = useState<AdminAction[]>([]);
  const [depositLogs, setDepositLogs] = useState<DepositLog[]>([]);
  const [addSellerNotification, setAddSellerNotification] = useState<((seller: string, message: string) => void) | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const setAddSellerNotificationCallback = (fn: (seller: string, message: string) => void) => {
    setAddSellerNotification(() => fn);
  };

  // Initialize enhanced wallet service
  useEffect(() => {
    const initializeServices = async () => {
      try {
        // Only initialize if wallet service is available
        if (typeof walletService?.initialize === 'function') {
          await walletService.initialize();
        }
        // Don't sync with service on init - load from localStorage instead
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize wallet service:', error);
        setIsInitialized(true); // Continue with fallback
      }
    };

    if (!isInitialized) {
      initializeServices();
    }
  }, [isInitialized]);

  // Helper function to get balance key (matching enhanced wallet service)
  const getBalanceKey = (username: string, role: string): string => {
    if (username === 'admin') return 'wallet_admin';
    return `wallet_${role}_${username}`;
  };

  // FIXED: Load data from BOTH formats - individual keys AND collective keys
  useEffect(() => {
    if (typeof window === 'undefined' || !isInitialized) return;

    const loadData = async () => {
      try {
        console.log('Loading wallet data from localStorage...');
        
        // First, load from collective keys (legacy format)
        const buyersLegacy = localStorage.getItem("wallet_buyers");
        const sellersLegacy = localStorage.getItem("wallet_sellers");
        const adminLegacy = localStorage.getItem("wallet_admin");
        
        // Initialize with legacy data if available
        const buyersMap: { [username: string]: number } = buyersLegacy ? JSON.parse(buyersLegacy) : {};
        const sellersMap: { [username: string]: number } = sellersLegacy ? JSON.parse(sellersLegacy) : {};
        let adminBalanceValue = adminLegacy ? parseFloat(adminLegacy) : 0;
        
        // Then check for individual keys (enhanced format) and merge
        const allKeys = Object.keys(localStorage);
        
        // Load buyer balances from individual keys
        const buyerKeys = allKeys.filter(key => key.startsWith('wallet_buyer_'));
        for (const key of buyerKeys) {
          const username = key.replace('wallet_buyer_', '');
          const balanceInCents = await storageService.getItem<number>(key, 0);
          const balanceInDollars = balanceInCents / 100;
          // Use the higher balance to prevent data loss
          buyersMap[username] = Math.max(buyersMap[username] || 0, balanceInDollars);
        }
        
        // Load seller balances from individual keys
        const sellerKeys = allKeys.filter(key => key.startsWith('wallet_seller_'));
        for (const key of sellerKeys) {
          const username = key.replace('wallet_seller_', '');
          const balanceInCents = await storageService.getItem<number>(key, 0);
          const balanceInDollars = balanceInCents / 100;
          // Use the higher balance to prevent data loss
          sellersMap[username] = Math.max(sellersMap[username] || 0, balanceInDollars);
        }
        
        // Check for enhanced admin balance
        const adminEnhanced = localStorage.getItem("wallet_admin_enhanced");
        if (adminEnhanced) {
          const adminEnhancedInCents = parseInt(adminEnhanced, 10);
          adminBalanceValue = Math.max(adminBalanceValue, adminEnhancedInCents / 100);
        }
        
        setBuyerBalancesState(buyersMap);
        setSellerBalancesState(sellersMap);
        setAdminBalanceState(adminBalanceValue);

        // Load orders
        const orders = await storageService.getItem<Order[]>("wallet_orders", []);
        setOrderHistory(orders);
        console.log('Loaded orders:', orders.length);

        // Load seller withdrawals
        const sellerWds = await storageService.getItem<{ [username: string]: Withdrawal[] }>("wallet_sellerWithdrawals", {});
        setSellerWithdrawals(sellerWds);

        // Load admin withdrawals
        const adminWds = await storageService.getItem<Withdrawal[]>("wallet_adminWithdrawals", []);
        setAdminWithdrawals(adminWds);

        // Load admin actions - ensure backward compatibility
        const actions = await storageService.getItem<AdminAction[]>("wallet_adminActions", []);
        // Normalize admin actions to ensure they have consistent structure
        const normalizedActions = actions.map(action => ({
          ...action,
          targetUser: action.targetUser || action.username,
          username: action.username || action.targetUser,
        }));
        setAdminActions(normalizedActions);
        
        console.log('Loaded admin actions:', {
          count: normalizedActions.length,
          subscriptionActions: normalizedActions.filter(a => 
            a.type === 'credit' && 
            a.reason && 
            a.reason.toLowerCase().includes('subscription')
          ).length
        });

        // Load deposit logs
        const deposits = await storageService.getItem<DepositLog[]>("wallet_depositLogs", []);
        setDepositLogs(deposits);

        console.log('Wallet data loading complete:', {
          buyers: Object.keys(buyersMap).length,
          sellers: Object.keys(sellersMap).length,
          admin: adminBalanceValue,
          orders: orders.length,
          adminActions: normalizedActions.length,
          deposits: deposits.length
        });
      } catch (error) {
        console.error('Error loading wallet data:', error);
      }
    };

    loadData();
  }, [isInitialized]);

  // FIXED: Save to BOTH formats to ensure compatibility
  const saveBuyerBalance = useCallback(async (username: string, balance: number) => {
    // Save to individual key (enhanced format)
    const key = getBalanceKey(username, 'buyer');
    const balanceInCents = Math.round(balance * 100);
    await storageService.setItem(key, balanceInCents);
    
    // Also update collective storage
    const allBuyers = { ...buyerBalances, [username]: balance };
    localStorage.setItem("wallet_buyers", JSON.stringify(allBuyers));
  }, [buyerBalances]);

  const saveSellerBalance = useCallback(async (username: string, balance: number) => {
    // Save to individual key (enhanced format)
    const key = getBalanceKey(username, 'seller');
    const balanceInCents = Math.round(balance * 100);
    await storageService.setItem(key, balanceInCents);
    
    // Also update collective storage
    const allSellers = { ...sellerBalances, [username]: balance };
    localStorage.setItem("wallet_sellers", JSON.stringify(allSellers));
  }, [sellerBalances]);

  const saveAdminBalance = useCallback(async (balance: number) => {
    // Save to both formats
    const balanceInCents = Math.round(balance * 100);
    await storageService.setItem('wallet_admin', balanceInCents);
    localStorage.setItem('wallet_admin', balance.toString());
  }, []);

  // Save all collective data when state changes
  useEffect(() => {
    if (!isInitialized || typeof window === 'undefined') return;
    localStorage.setItem("wallet_buyers", JSON.stringify(buyerBalances));
  }, [buyerBalances, isInitialized]);

  useEffect(() => {
    if (!isInitialized || typeof window === 'undefined') return;
    localStorage.setItem("wallet_sellers", JSON.stringify(sellerBalances));
  }, [sellerBalances, isInitialized]);

  useEffect(() => {
    if (!isInitialized || typeof window === 'undefined') return;
    localStorage.setItem("wallet_admin", adminBalance.toString());
  }, [adminBalance, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    storageService.setItem("wallet_orders", orderHistory);
  }, [orderHistory, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    storageService.setItem("wallet_sellerWithdrawals", sellerWithdrawals);
  }, [sellerWithdrawals, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    storageService.setItem("wallet_adminWithdrawals", adminWithdrawals);
  }, [adminWithdrawals, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    storageService.setItem("wallet_adminActions", adminActions);
  }, [adminActions, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    storageService.setItem("wallet_depositLogs", depositLogs);
  }, [depositLogs, isInitialized]);

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
    try {
      setBuyerBalancesState((prev) => ({
        ...prev,
        [username]: balance,
      }));
      // Save to localStorage immediately
      await saveBuyerBalance(username, balance);
    } catch (error) {
      console.error('Error setting buyer balance:', error);
    }
  }, [saveBuyerBalance]);

  const getSellerBalance = useCallback((seller: string): number => {
    return sellerBalances[seller] || 0;
  }, [sellerBalances]);

  const setSellerBalance = useCallback(async (seller: string, balance: number) => {
    try {
      setSellerBalancesState((prev) => ({
        ...prev,
        [seller]: balance,
      }));
      // Save to localStorage immediately
      await saveSellerBalance(seller, balance);
    } catch (error) {
      console.error('Error setting seller balance:', error);
    }
  }, [saveSellerBalance]);

  const setAdminBalance = useCallback(async (balance: number) => {
    try {
      setAdminBalanceState(balance);
      // Save to localStorage immediately
      await saveAdminBalance(balance);
    } catch (error) {
      console.error('Error setting admin balance:', error);
    }
  }, [saveAdminBalance]);

  const addOrder = useCallback(async (order: Order) => {
    try {
      setOrderHistory((prev) => [...prev, order]);
    } catch (error) {
      console.error('Error adding order:', error);
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
      
      // Calculate amounts
      const sellerCut = listing.price * 0.9 + tierCreditAmount;
      const platformFee = price - listing.price * 0.9;
      
      console.log('[Purchase] Calculated amounts:', {
        price,
        sellerCut,
        platformFee,
        tierCreditAmount
      });
      
      // Update balances immediately with save
      await setBuyerBalance(buyerUsername, buyerCurrentBalance - price);
      await setSellerBalance(listing.seller, (sellerBalances[listing.seller] || 0) + sellerCut);
      await setAdminBalance(adminBalance + platformFee);
      
      // Create order
      const order: Order = {
        id: uuidv4(),
        title: listing.title,
        description: listing.description,
        price: listing.price,
        markedUpPrice: price,
        seller: listing.seller,
        buyer: buyerUsername,
        date: new Date().toISOString(),
        imageUrl: listing.imageUrls?.[0],
        tierCreditAmount,
        shippingStatus: 'pending',
        listingId: listing.id,
        listingTitle: listing.title,
        quantity: 1
      };
      
      await addOrder(order);
      console.log('[Purchase] Order created:', order);
      
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
      
      setAdminActions(prev => {
        const updated = [...prev, platformFeeAction];
        console.log('[Purchase] Admin actions updated:', updated.length);
        return updated;
      });
      
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
      
      console.log('[Purchase] Purchase successful:', {
        buyer: buyerUsername,
        seller: listing.seller,
        price,
        buyerNewBalance: buyerCurrentBalance - price,
        sellerNewBalance: (sellerBalances[listing.seller] || 0) + sellerCut,
        adminNewBalance: adminBalance + platformFee,
        platformFeeAction
      });
      
      return true;
    } catch (error) {
      console.error('[Purchase] Purchase error:', error);
      return false;
    }
  }, [orderHistory, addOrder, addSellerNotification, getBuyerBalance, setBuyerBalance, setSellerBalance, setAdminBalance, sellerBalances, adminBalance]);

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
      
      // Update balances with save
      await setBuyerBalance(customRequest.buyer, buyerCurrentBalance - markedUpPrice);
      await setSellerBalance(customRequest.seller, (sellerBalances[customRequest.seller] || 0) + sellerCut);
      await setAdminBalance(adminBalance + platformFee);
      
      // Create order
      const order: Order = {
        id: `custom_${customRequest.requestId}_${Date.now()}`,
        title: customRequest.description,
        description: customRequest.description,
        price: customRequest.amount,
        markedUpPrice,
        seller: customRequest.seller,
        buyer: customRequest.buyer,
        date: new Date().toISOString(),
        isCustomRequest: true,
        originalRequestId: customRequest.requestId,
        shippingStatus: 'pending'
      };
      
      await addOrder(order);
      
      if (addSellerNotification) {
        addSellerNotification(
          customRequest.seller,
          `Custom request purchased by ${customRequest.buyer} for $${customRequest.amount.toFixed(2)}`
        );
      }
      
      return true;
    } catch (error) {
      console.error('Custom request purchase error:', error);
      return false;
    }
  }, [addOrder, addSellerNotification, getBuyerBalance, setBuyerBalance, setSellerBalance, setAdminBalance, sellerBalances, adminBalance]);

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
      
      // Update balances with save
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
      
      // Update balances with save
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
      
      // Update using functional update pattern
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
      
      // Update using functional update pattern
      setAdminActions(prev => [...prev, action]);
      
      return true;
    } catch (error) {
      console.error('Admin debit error:', error);
      return false;
    }
  }, [getBuyerBalance, setBuyerBalance, getSellerBalance, setSellerBalance]);

  const updateOrderAddress = useCallback(async (orderId: string, address: DeliveryAddress) => {
    const updatedOrders = orderHistory.map(order =>
      order.id === orderId ? { ...order, deliveryAddress: address } : order
    );
    setOrderHistory(updatedOrders);
  }, [orderHistory]);

  const updateShippingStatus = useCallback(async (orderId: string, status: 'pending' | 'processing' | 'shipped') => {
    const updatedOrders = orderHistory.map(order =>
      order.id === orderId ? { ...order, shippingStatus: status } : order
    );
    setOrderHistory(updatedOrders);
  }, [orderHistory]);

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

  const contextValue: WalletContextType = {
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
    
    // New enhanced features
    checkSuspiciousActivity,
    reconcileBalance,
    getTransactionHistory,
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