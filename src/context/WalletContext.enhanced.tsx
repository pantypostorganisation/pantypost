// src/context/WalletContext.enhanced.tsx
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
};

// Import Listing from ListingContext to avoid conflicts
import { Listing as ListingContextType } from '@/context/ListingContext';

// Use the ListingContext's Listing type directly
type Listing = ListingContextType;

type CustomRequestPurchase = {
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

type AdminAction = {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  targetUser: string;
  adminUser: string;
  reason: string;
  date: string;
  role: 'buyer' | 'seller';
};

type DepositLog = {
  id: string;
  username: string;
  amount: number;
  method: 'credit_card' | 'bank_transfer' | 'crypto' | 'admin_credit';
  date: string;
  status: 'pending' | 'completed' | 'failed';
  transactionId: string;
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

const WalletContext = createContext<WalletContextType | undefined>(undefined);

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
        await walletService.initialize();
        await syncBalancesWithService();
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

  // Sync balances with enhanced service
  const syncBalancesWithService = async () => {
    try {
      // Get all users
      const allUsers = await storageService.getItem<Record<string, any>>('all_users_v2', {});
      
      for (const [username, user] of Object.entries(allUsers)) {
        if (user.role === 'buyer') {
          const balance = await WalletIntegration.getBalanceInDollars(username, 'buyer');
          setBuyerBalancesState(prev => ({ ...prev, [username]: balance }));
        } else if (user.role === 'seller') {
          const balance = await WalletIntegration.getBalanceInDollars(username, 'seller');
          setSellerBalancesState(prev => ({ ...prev, [username]: balance }));
        }
      }
      
      // Sync admin balance
      const adminBal = await WalletIntegration.getBalanceInDollars('admin', 'admin');
      setAdminBalanceState(adminBal);
    } catch (error) {
      console.error('Error syncing balances:', error);
    }
  };

  // Load data using services (keep existing logic for backward compatibility)
  useEffect(() => {
    if (typeof window === 'undefined' || !isInitialized) return;

    const loadData = async () => {
      try {
        // Load orders
        const orders = await storageService.getItem<Order[]>("wallet_orders", []);
        setOrderHistory(orders);

        // Load seller withdrawals
        const sellerWds = await storageService.getItem<{ [username: string]: Withdrawal[] }>("wallet_sellerWithdrawals", {});
        setSellerWithdrawals(sellerWds);

        // Load admin withdrawals
        const adminWds = await storageService.getItem<Withdrawal[]>("wallet_adminWithdrawals", []);
        setAdminWithdrawals(adminWds);

        // Load admin actions
        const actions = await storageService.getItem<AdminAction[]>("wallet_adminActions", []);
        setAdminActions(actions);

        // Load deposit logs
        const deposits = await storageService.getItem<DepositLog[]>("wallet_depositLogs", []);
        setDepositLogs(deposits);
      } catch (error) {
        console.error('Error loading wallet data:', error);
      }
    };

    loadData();
  }, [isInitialized]);

  // Helper functions - updated to use enhanced service
  const getBuyerBalance = useCallback((username: string): number => {
    return buyerBalances[username] || 0;
  }, [buyerBalances]);

  const setBuyerBalance = useCallback(async (username: string, balance: number) => {
    try {
      // Use enhanced service for balance updates
      const result = await walletService.updateBalance(username, balance, 'buyer');
      if (result.success) {
        setBuyerBalancesState((prev) => ({
          ...prev,
          [username]: balance,
        }));
      }
    } catch (error) {
      console.error('Error setting buyer balance:', error);
    }
  }, []);

  const getSellerBalance = useCallback((seller: string): number => {
    return sellerBalances[seller] || 0;
  }, [sellerBalances]);

  const setSellerBalance = useCallback(async (seller: string, balance: number) => {
    try {
      const result = await walletService.updateBalance(seller, balance, 'seller');
      if (result.success) {
        setSellerBalancesState((prev) => ({
          ...prev,
          [seller]: balance,
        }));
      }
    } catch (error) {
      console.error('Error setting seller balance:', error);
    }
  }, []);

  const setAdminBalance = useCallback(async (balance: number) => {
    try {
      const result = await walletService.updateBalance('admin', balance, 'admin');
      if (result.success) {
        setAdminBalanceState(balance);
      }
    } catch (error) {
      console.error('Error setting admin balance:', error);
    }
  }, []);

  const addOrder = useCallback(async (order: Order) => {
    try {
      setOrderHistory((prev) => [...prev, order]);
      await storageService.setItem("wallet_orders", [...orderHistory, order]);
    } catch (error) {
      console.error('Error adding order:', error);
    }
  }, [orderHistory]);

  const addDeposit = useCallback(async (
    username: string, 
    amount: number, 
    method: DepositLog['method'], 
    notes?: string
  ): Promise<boolean> => {
    try {
      // Use enhanced service for deposits
      const result = await walletService.deposit({
        username,
        amount,
        method,
        notes: notes || `${method.replace('_', ' ')} deposit by ${username}`
      });
      
      if (result.success) {
        // Update local state
        await syncBalancesWithService();
        
        // Add deposit log
        const newDeposit: DepositLog = {
          id: uuidv4(),
          username,
          amount,
          method,
          date: new Date().toISOString(),
          status: 'completed',
          transactionId: result.data?.id || uuidv4(),
          notes: notes || `${method.replace('_', ' ')} deposit by ${username}`
        };
        setDepositLogs(prev => [...prev, newDeposit]);
        await storageService.setItem("wallet_depositLogs", [...depositLogs, newDeposit]);
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error processing deposit:', error);
      return false;
    }
  }, [depositLogs]);

  const purchaseListing = useCallback(async (listing: Listing, buyerUsername: string): Promise<boolean> => {
    try {
      const sellerTierInfo = getSellerTierMemoized(listing.seller, orderHistory);
      const tierCreditAmount = listing.price * sellerTierInfo.credit;
      
      // Use enhanced service for purchases
      const result = await WalletIntegration.createPurchaseTransaction(
        listing,
        buyerUsername,
        listing.seller,
        tierCreditAmount
      );
      
      if (result.success && result.order) {
        // Add order
        await addOrder(result.order);
        
        // Sync balances
        await syncBalancesWithService();
        
        // Add notification
        if (addSellerNotification) {
          if (tierCreditAmount > 0) {
            addSellerNotification(
              listing.seller,
              `New sale: "${listing.title}" for $${result.order.markedUpPrice.toFixed(2)} (includes $${tierCreditAmount.toFixed(2)} ${sellerTierInfo.tier} tier credit)`
            );
          } else {
            addSellerNotification(
              listing.seller,
              `New sale: "${listing.title}" for $${result.order.markedUpPrice.toFixed(2)}`
            );
          }
        }
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Purchase error:', error);
      return false;
    }
  }, [orderHistory, addOrder, addSellerNotification]);

  const purchaseCustomRequest = useCallback(async (customRequest: CustomRequestPurchase): Promise<boolean> => {
    try {
      // Create a listing-like object for the custom request
      const listing: Listing = {
        id: customRequest.requestId,
        title: customRequest.description,
        description: customRequest.description,
        price: customRequest.amount,
        markedUpPrice: customRequest.amount * 1.1, // 10% markup
        seller: customRequest.seller,
        imageUrls: [],
        date: new Date().toISOString(), // Add missing date property
      };

      const result = await WalletIntegration.createPurchaseTransaction(
        listing,
        customRequest.buyer,
        customRequest.seller,
        0 // No tier credit for custom requests
      );

      if (result.success && result.order) {
        // Mark as custom request
        result.order.isCustomRequest = true;
        result.order.originalRequestId = customRequest.requestId;
        
        await addOrder(result.order);
        await syncBalancesWithService();
        
        if (addSellerNotification) {
          addSellerNotification(
            customRequest.seller,
            `Custom request purchased by ${customRequest.buyer} for $${customRequest.amount.toFixed(2)}`
          );
        }
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Custom request purchase error:', error);
      return false;
    }
  }, [addOrder, addSellerNotification]);

  const subscribeToSellerWithPayment = useCallback(async (
    buyer: string,
    seller: string,
    amount: number
  ): Promise<boolean> => {
    try {
      const result = await WalletIntegration.processSubscription(buyer, seller, amount);
      
      if (result) {
        await syncBalancesWithService();
        
        if (addSellerNotification) {
          addSellerNotification(
            seller,
            `New subscriber: ${buyer} paid $${amount.toFixed(2)}/month`
          );
        }
      }
      
      return result;
    } catch (error) {
      console.error('Subscription payment error:', error);
      return false;
    }
  }, [addSellerNotification]);

  const sendTip = useCallback(async (buyer: string, seller: string, amount: number): Promise<boolean> => {
    try {
      const result = await WalletIntegration.processTip(buyer, seller, amount);
      
      if (result) {
        await syncBalancesWithService();
        
        if (addSellerNotification) {
          addSellerNotification(
            seller,
            `💰 Tip received from ${buyer} - $${amount.toFixed(2)}`
          );
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error sending tip:', error);
      return false;
    }
  }, [addSellerNotification]);

  const addSellerWithdrawal = useCallback(async (username: string, amount: number) => {
    try {
      const result = await WalletIntegration.processWithdrawal(username, amount);
      
      if (result) {
        const date = new Date().toISOString();
        const newWithdrawal: Withdrawal = { amount, date, status: 'pending' };
        setSellerWithdrawals((prev) => ({
          ...prev,
          [username]: [...(prev[username] || []), newWithdrawal],
        }));
        await storageService.setItem("wallet_sellerWithdrawals", {
          ...sellerWithdrawals,
          [username]: [...(sellerWithdrawals[username] || []), newWithdrawal],
        });
        await syncBalancesWithService();
      } else {
        throw new Error('Withdrawal failed');
      }
    } catch (error) {
      throw error;
    }
  }, [sellerWithdrawals]);

  const addAdminWithdrawal = useCallback(async (amount: number) => {
    try {
      const result = await WalletIntegration.processWithdrawal('admin', amount);
      
      if (result) {
        const date = new Date().toISOString();
        const newWithdrawal: Withdrawal = { amount, date, status: 'pending' };
        setAdminWithdrawals((prev) => [...prev, newWithdrawal]);
        await storageService.setItem("wallet_adminWithdrawals", [...adminWithdrawals, newWithdrawal]);
        await syncBalancesWithService();
      } else {
        throw new Error('Admin withdrawal failed');
      }
    } catch (error) {
      throw error;
    }
  }, [adminWithdrawals]);

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
      const result = await walletService.processAdminAction({
        adminUser: 'admin',
        targetUser: username,
        role,
        amount,
        type: 'credit',
        reason,
      });

      if (result.success) {
        const action: AdminAction = {
          id: uuidv4(),
          type: 'credit',
          amount,
          targetUser: username,
          adminUser: 'admin',
          reason,
          date: new Date().toISOString(),
          role,
        };
        setAdminActions(prev => [...prev, action]);
        await storageService.setItem("wallet_adminActions", [...adminActions, action]);
        await syncBalancesWithService();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Admin credit error:', error);
      return false;
    }
  }, [adminActions]);

  const adminDebitUser = useCallback(async (
    username: string,
    role: 'buyer' | 'seller',
    amount: number,
    reason: string
  ): Promise<boolean> => {
    try {
      const result = await walletService.processAdminAction({
        adminUser: 'admin',
        targetUser: username,
        role,
        amount,
        type: 'debit',
        reason,
      });

      if (result.success) {
        const action: AdminAction = {
          id: uuidv4(),
          type: 'debit',
          amount,
          targetUser: username,
          adminUser: 'admin',
          reason,
          date: new Date().toISOString(),
          role,
        };
        setAdminActions(prev => [...prev, action]);
        await storageService.setItem("wallet_adminActions", [...adminActions, action]);
        await syncBalancesWithService();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Admin debit error:', error);
      return false;
    }
  }, [adminActions]);

  const updateOrderAddress = useCallback(async (orderId: string, address: DeliveryAddress) => {
    const updatedOrders = orderHistory.map(order =>
      order.id === orderId ? { ...order, deliveryAddress: address } : order
    );
    setOrderHistory(updatedOrders);
    await storageService.setItem("wallet_orders", updatedOrders);
  }, [orderHistory]);

  const updateShippingStatus = useCallback(async (orderId: string, status: 'pending' | 'processing' | 'shipped') => {
    const updatedOrders = orderHistory.map(order =>
      order.id === orderId ? { ...order, shippingStatus: status } : order
    );
    setOrderHistory(updatedOrders);
    await storageService.setItem("wallet_orders", updatedOrders);
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
        return depositLogs;
    }
    
    return depositLogs.filter(log => new Date(log.date) >= startDate);
  }, [depositLogs]);

  // New enhanced features
  const checkSuspiciousActivity = useCallback(async (username: string) => {
    const result = await walletService.checkSuspiciousActivity(username);
    return {
      suspicious: result.suspicious,
      reasons: result.reasons,
    };
  }, []);

  const reconcileBalance = useCallback(async (
    username: string, 
    role: 'buyer' | 'seller' | 'admin'
  ) => {
    return await WalletIntegration.reconcileBalance(username, role);
  }, []);

  const getTransactionHistory = useCallback(async (username?: string, limit?: number) => {
    return await WalletIntegration.getFormattedTransactionHistory(username, { limit });
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