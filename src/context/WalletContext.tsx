// src/context/WalletContext.tsx
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { DeliveryAddress } from '@/components/AddressConfirmationModal';
import { getSellerTierMemoized } from '@/utils/sellerTiers';
import { walletService, ordersService, storageService } from '@/services';
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

type Listing = {
  id: string;
  title: string;
  description: string;
  price: number;
  markedUpPrice?: number;
  seller: string;
  imageUrls?: string[];
};

type Withdrawal = {
  amount: number;
  date: string;
};

type AdminAction = {
  adminUser: string;
  username: string;
  role: 'buyer' | 'seller';
  amount: number;
  type: 'credit' | 'debit';
  reason: string;
  date: string;
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

export type CustomRequestPurchase = {
  requestId: string;
  title: string;
  description: string;
  price: number;
  seller: string;
  buyer: string;
  tags?: string[];
};

type WalletContextType = {
  buyerBalances: { [username: string]: number };
  adminBalance: number;
  sellerBalances: { [username: string]: number };
  setBuyerBalance: (username: string, balance: number) => void;
  getBuyerBalance: (username: string) => number;
  setAdminBalance: (balance: number) => void;
  setSellerBalance: (seller: string, balance: number) => void;
  getSellerBalance: (seller: string) => number;
  purchaseListing: (listing: Listing, buyerUsername: string) => boolean;
  purchaseCustomRequest: (customRequest: CustomRequestPurchase) => boolean;
  subscribeToSellerWithPayment: (
    buyer: string,
    seller: string,
    amount: number
  ) => boolean;
  orderHistory: Order[];
  addOrder: (order: Order) => void;
  sellerWithdrawals: { [username: string]: Withdrawal[] };
  adminWithdrawals: Withdrawal[];
  addSellerWithdrawal: (username: string, amount: number) => void;
  addAdminWithdrawal: (amount: number) => void;
  wallet: { [username: string]: number };
  updateWallet: (username: string, amount: number, orderToFulfil?: Order) => void;
  sendTip: (buyer: string, seller: string, amount: number) => boolean;
  setAddSellerNotificationCallback?: (fn: (seller: string, message: string) => void) => void;
  adminCreditUser: (username: string, role: 'buyer' | 'seller', amount: number, reason: string) => boolean;
  adminDebitUser: (username: string, role: 'buyer' | 'seller', amount: number, reason: string) => boolean;
  adminActions: AdminAction[];
  updateOrderAddress: (orderId: string, address: DeliveryAddress) => void;
  updateShippingStatus: (orderId: string, status: 'pending' | 'processing' | 'shipped') => void;
  depositLogs: DepositLog[];
  addDeposit: (username: string, amount: number, method: DepositLog['method'], notes?: string) => boolean;
  getDepositsForUser: (username: string) => DepositLog[];
  getTotalDeposits: () => number;
  getDepositsByTimeframe: (timeframe: 'today' | 'week' | 'month' | 'year' | 'all') => DepositLog[];
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

  // Load data using services
  useEffect(() => {
    if (typeof window === 'undefined' || isInitialized) return;

    const loadData = async () => {
      try {
        // Load buyer balances
        const buyers = await storageService.getItem<{ [username: string]: number }>("wallet_buyers", {});
        setBuyerBalancesState(buyers);

        // Load admin balance
        const admin = await storageService.getItem<number>("wallet_admin", 0);
        setAdminBalanceState(admin);

        // Load seller balances
        const sellers = await storageService.getItem<{ [username: string]: number }>("wallet_sellers", {});
        setSellerBalancesState(sellers);

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
        
        setIsInitialized(true);
      } catch (error) {
        console.error('Error loading wallet data:', error);
        setIsInitialized(true);
      }
    };

    loadData();
  }, [isInitialized]);

  // Save data using services
  useEffect(() => {
    if (!isInitialized) return;
    storageService.setItem("wallet_buyers", buyerBalances);
  }, [buyerBalances, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    storageService.setItem("wallet_admin", adminBalance);
  }, [adminBalance, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    storageService.setItem("wallet_sellers", sellerBalances);
  }, [sellerBalances, isInitialized]);

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

  // Dispatch wallet update event
  useEffect(() => {
    if (!isInitialized || typeof window === 'undefined') return;
    
    const event = new CustomEvent('walletUpdate', { 
      detail: { buyerBalances, sellerBalances, adminBalance } 
    });
    window.dispatchEvent(event);
  }, [buyerBalances, sellerBalances, adminBalance, isInitialized]);

  // Helper functions
  const getBuyerBalance = (username: string): number => {
    return buyerBalances[username] || 0;
  };

  const setBuyerBalance = (username: string, balance: number) => {
    setBuyerBalancesState((prev) => ({
      ...prev,
      [username]: balance,
    }));
  };

  const getSellerBalance = (seller: string): number => {
    return sellerBalances[seller] || 0;
  };

  const setSellerBalance = (seller: string, balance: number) => {
    setSellerBalancesState((prev) => ({
      ...prev,
      [seller]: balance,
    }));
  };

  const setAdminBalance = (balance: number) => {
    setAdminBalanceState(balance);
  };

  const addOrder = (order: Order) => {
    setOrderHistory((prev) => [...prev, order]);
  };

  const addDeposit = (username: string, amount: number, method: DepositLog['method'], notes?: string): boolean => {
    if (!username || amount <= 0) {
      return false;
    }

    try {
      const depositId = `dep_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const newDeposit: DepositLog = {
        id: depositId,
        username,
        amount,
        method,
        date: new Date().toISOString(),
        status: 'completed',
        transactionId: `txn_${depositId}`,
        notes: notes || `${method.replace('_', ' ')} deposit by ${username}`
      };

      // Add to deposit logs
      setDepositLogs(prev => [...prev, newDeposit]);

      // Update buyer balance
      const currentBalance = getBuyerBalance(username);
      setBuyerBalance(username, currentBalance + amount);

      // Record as admin action for analytics
      const adminAction: AdminAction = {
        adminUser: 'system',
        username: username,
        role: 'buyer',
        amount: amount,
        type: 'credit',
        reason: `Wallet deposit via ${method.replace('_', ' ')}`,
        date: new Date().toISOString()
      };
      setAdminActions(prev => [...prev, adminAction]);

      return true;
    } catch (error) {
      console.error('Error processing deposit:', error);
      return false;
    }
  };

  const getDepositsForUser = (username: string): DepositLog[] => {
    return depositLogs.filter(deposit => deposit.username === username);
  };

  const getTotalDeposits = (): number => {
    return depositLogs
      .filter(deposit => deposit.status === 'completed')
      .reduce((sum, deposit) => sum + deposit.amount, 0);
  };

  const getDepositsByTimeframe = (timeframe: 'today' | 'week' | 'month' | 'year' | 'all'): DepositLog[] => {
    if (timeframe === 'all') return depositLogs;

    const now = new Date();
    const filterDate = new Date();

    switch (timeframe) {
      case 'today':
        filterDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        filterDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        filterDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        filterDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    return depositLogs.filter(deposit => new Date(deposit.date) >= filterDate);
  };

  const updateOrderAddress = (orderId: string, address: DeliveryAddress) => {
    setOrderHistory((prev) => {
      const updatedOrders = prev.map((order) => 
        order.id === orderId ? { ...order, deliveryAddress: address } : order
      );
      return updatedOrders;
    });
  };

  const updateShippingStatus = (orderId: string, status: 'pending' | 'processing' | 'shipped') => {
    setOrderHistory((prev) => {
      const updatedOrders = prev.map((order) => 
        order.id === orderId ? { ...order, shippingStatus: status } : order
      );
      return updatedOrders;
    });
  };

  const adminCreditUser = (username: string, role: 'buyer' | 'seller', amount: number, reason: string): boolean => {
    if (!username || amount <= 0 || !reason) {
      return false;
    }

    try {
      if (role === 'buyer') {
        const currentBalance = getBuyerBalance(username);
        setBuyerBalance(username, currentBalance + amount);
        
        if (reason.toLowerCase().includes('deposit') || reason.toLowerCase().includes('wallet')) {
          addDeposit(username, amount, 'admin_credit', `Admin credit: ${reason}`);
        }
      } else if (role === 'seller') {
        const currentBalance = getSellerBalance(username);
        setSellerBalance(username, currentBalance + amount);
      } else {
        return false;
      }

      const action: AdminAction = {
        adminUser: 'admin',
        username,
        role,
        amount,
        type: 'credit',
        reason,
        date: new Date().toISOString()
      };

      setAdminActions(prev => [...prev, action]);
      return true;
    } catch (error) {
      console.error("Error crediting user:", error);
      return false;
    }
  };

  const adminDebitUser = (username: string, role: 'buyer' | 'seller', amount: number, reason: string): boolean => {
    if (!username || amount <= 0 || !reason) {
      return false;
    }

    try {
      if (role === 'buyer') {
        const currentBalance = getBuyerBalance(username);
        if (currentBalance < amount) {
          return false;
        }
        setBuyerBalance(username, currentBalance - amount);
      } else if (role === 'seller') {
        const currentBalance = getSellerBalance(username);
        if (currentBalance < amount) {
          return false;
        }
        setSellerBalance(username, currentBalance - amount);
      } else {
        return false;
      }

      const action: AdminAction = {
        adminUser: 'admin',
        username,
        role,
        amount,
        type: 'debit',
        reason,
        date: new Date().toISOString()
      };

      setAdminActions(prev => [...prev, action]);
      return true;
    } catch (error) {
      console.error("Error debiting user:", error);
      return false;
    }
  };
  
  const purchaseListing = (listing: Listing, buyerUsername: string): boolean => {
    const price = (listing.markedUpPrice !== undefined && listing.markedUpPrice !== null)
      ? listing.markedUpPrice
      : listing.price;
    const seller = listing.seller;
    const sellerCut = listing.price * 0.9;
    const platformCut = price - sellerCut;
    const currentBuyerBalance = getBuyerBalance(buyerUsername);
    
    if (currentBuyerBalance < price) {
      return false;
    }

    const transactionLockKey = `transaction_lock_${buyerUsername}_${seller}`;
    if (typeof window !== 'undefined' && localStorage.getItem(transactionLockKey)) {
      return false;
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem(transactionLockKey, 'locked');
    }

    try {
      if (price <= 0 || !listing.title || !listing.id || !seller) {
        return false;
      }
      
      setBuyerBalance(buyerUsername, currentBuyerBalance - price);

      const sellerTierInfo = getSellerTierMemoized(seller, orderHistory);
      const tierCreditPercent = sellerTierInfo.credit;
      const tierCreditAmount = listing.price * tierCreditPercent;
      
      setSellerBalancesState((prev) => ({
        ...prev,
        [seller]: (prev[seller] || 0) + sellerCut + tierCreditAmount,
      }));

      updateWallet('admin', platformCut);

      const platformProfitAction: AdminAction = {
        adminUser: 'system',
        username: 'platform',
        role: 'buyer',
        amount: platformCut,
        type: 'credit',
        reason: `Platform commission from "${listing.title}" sale`,
        date: new Date().toISOString()
      };
      setAdminActions(prev => [...prev, platformProfitAction]);

      const order: Order = {
        ...listing,
        buyer: buyerUsername,
        date: new Date().toISOString(),
        imageUrl: listing.imageUrls?.[0] || undefined,
        shippingStatus: 'pending',
        tierCreditAmount: tierCreditAmount,
        isCustomRequest: false,
      } as Order;

      addOrder(order);
      
      const displayPrice = (listing.markedUpPrice !== undefined && listing.markedUpPrice !== null)
        ? listing.markedUpPrice.toFixed(2)
        : listing.price.toFixed(2);

      if (addSellerNotification) {
        if (tierCreditAmount > 0) {
          addSellerNotification(
            seller,
            `New sale: "${listing.title}" for $${displayPrice} (includes $${tierCreditAmount.toFixed(2)} ${sellerTierInfo.tier} tier credit)`
          );
        } else {
          addSellerNotification(
            seller,
            `New sale: "${listing.title}" for $${displayPrice}`
          );
        }
      }

      return true;
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(transactionLockKey);
      }
    }
  };

  const purchaseCustomRequest = (customRequest: CustomRequestPurchase): boolean => {
    const { requestId, title, description, price, seller, buyer, tags } = customRequest;
    
    const markedUpPrice = Math.round(price * 1.1 * 100) / 100;
    const sellerCut = price * 0.9;
    const platformCut = markedUpPrice - sellerCut;
    const currentBuyerBalance = getBuyerBalance(buyer);
    
    if (currentBuyerBalance < markedUpPrice) {
      return false;
    }

    const transactionLockKey = `custom_request_transaction_lock_${buyer}_${seller}_${requestId}`;
    if (typeof window !== 'undefined' && localStorage.getItem(transactionLockKey)) {
      return false;
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem(transactionLockKey, 'locked');
    }

    try {
      if (markedUpPrice <= 0 || !title || !requestId || !seller || !buyer) {
        return false;
      }
      
      setBuyerBalance(buyer, currentBuyerBalance - markedUpPrice);

      const sellerTierInfo = getSellerTierMemoized(seller, orderHistory);
      const tierCreditPercent = sellerTierInfo.credit;
      const tierCreditAmount = price * tierCreditPercent;
      
      setSellerBalancesState((prev) => ({
        ...prev,
        [seller]: (prev[seller] || 0) + sellerCut + tierCreditAmount,
      }));

      updateWallet('admin', platformCut);

      const platformProfitAction: AdminAction = {
        adminUser: 'system',
        username: 'platform',
        role: 'buyer',
        amount: platformCut,
        type: 'credit',
        reason: `Platform commission from custom request "${title}"`,
        date: new Date().toISOString()
      };
      setAdminActions(prev => [...prev, platformProfitAction]);

      const order: Order = {
        id: `custom_${requestId}_${Date.now()}`,
        title,
        description,
        price,
        markedUpPrice,
        buyer,
        seller,
        date: new Date().toISOString(),
        tags,
        shippingStatus: 'pending',
        tierCreditAmount,
        isCustomRequest: true,
        originalRequestId: requestId,
      };

      addOrder(order);

      if (addSellerNotification) {
        if (tierCreditAmount > 0) {
          addSellerNotification(
            seller,
            `Custom request paid: "${title}" for $${markedUpPrice.toFixed(2)} (includes $${tierCreditAmount.toFixed(2)} ${sellerTierInfo.tier} tier credit)`
          );
        } else {
          addSellerNotification(
            seller,
            `Custom request paid: "${title}" for $${markedUpPrice.toFixed(2)}`
          );
        }
      }

      return true;
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(transactionLockKey);
      }
    }
  };

  const subscribeToSellerWithPayment = (
    buyer: string,
    seller: string,
    amount: number
  ): boolean => {
    if (!buyer || !seller || amount <= 0) {
      return false;
    }

    const transactionLockKey = `subscription_lock_${buyer}_${seller}`;
    if (typeof window !== 'undefined' && localStorage.getItem(transactionLockKey)) {
      return false;
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem(transactionLockKey, 'locked');
    }

    try {
      const buyerBalance = getBuyerBalance(buyer);
      if (buyerBalance < amount) {
        return false;
      }

      const sellerCut = amount * 0.75;
      const adminCut = amount * 0.25;

      setBuyerBalance(buyer, buyerBalance - amount);
      setSellerBalance(seller, getSellerBalance(seller) + sellerCut);

      updateWallet('admin', adminCut);

      const subscriptionProfitAction: AdminAction = {
        adminUser: 'system',
        username: 'platform',
        role: 'buyer',
        amount: adminCut,
        type: 'credit',
        reason: `Subscription commission from ${buyer} to ${seller}`,
        date: new Date().toISOString()
      };
      setAdminActions(prev => [...prev, subscriptionProfitAction]);

      if (addSellerNotification) {
        addSellerNotification(
          seller,
          `New subscriber: ${buyer} paid $${amount.toFixed(2)}/month`
        );
      }

      return true;
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(transactionLockKey);
      }
    }
  };

  const addSellerWithdrawal = (username: string, amount: number) => {
    if (!username || amount <= 0) {
      throw new Error("Invalid withdrawal parameters");
    }

    const currentBalance = getSellerBalance(username);
    if (currentBalance < amount) {
      throw new Error("Insufficient balance for withdrawal");
    }

    const withdrawalLockKey = `withdrawal_lock_${username}`;
    if (typeof window !== 'undefined' && localStorage.getItem(withdrawalLockKey)) {
      throw new Error("Another withdrawal is in progress");
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem(withdrawalLockKey, 'locked');
    }

    try {
      const date = new Date().toISOString();
      setSellerWithdrawals((prev) => ({
        ...prev,
        [username]: [...(prev[username] || []), { amount, date }],
      }));
      setSellerBalance(username, currentBalance - amount);
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(withdrawalLockKey);
      }
    }
  };

  const addAdminWithdrawal = (amount: number) => {
    if (amount <= 0) {
      throw new Error("Invalid withdrawal amount");
    }

    if (adminBalance < amount) {
      throw new Error("Insufficient admin balance for withdrawal");
    }

    const adminWithdrawalLockKey = 'admin_withdrawal_lock';
    if (typeof window !== 'undefined' && localStorage.getItem(adminWithdrawalLockKey)) {
      throw new Error("Another admin withdrawal is in progress");
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem(adminWithdrawalLockKey, 'locked');
    }

    try {
      const date = new Date().toISOString();
      setAdminWithdrawals((prev) => [...prev, { amount, date }]);
      setAdminBalanceState((prev) => prev - amount);
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(adminWithdrawalLockKey);
      }
    }
  };

  const wallet: { [username: string]: number } = {
    ...buyerBalances,
    ...sellerBalances,
    admin: adminBalance,
  };
  
  const updateWallet = (username: string, amount: number, orderToFulfil?: Order) => {
    if (username === "admin") {
      setAdminBalanceState((prev) => prev + amount);
    } else if (username in sellerBalances || (orderToFulfil && orderToFulfil.seller === username)) {
      setSellerBalance(username, (sellerBalances[username] || 0) + amount);
      if (orderToFulfil) {
        addOrder(orderToFulfil);
        if (addSellerNotification) {
          addSellerNotification(
            username,
            `New custom order to fulfil: "${orderToFulfil.title}" for $${orderToFulfil.price.toFixed(2)}`
          );
        }
      }
    } else if (username in buyerBalances) {
      setBuyerBalance(username, (buyerBalances[username] || 0) + amount);
    } else {
      if (amount > 0) {
        setSellerBalance(username, (sellerBalances[username] || 0) + amount);
        if (orderToFulfil) {
          addOrder(orderToFulfil);
          if (addSellerNotification) {
            addSellerNotification(
              username,
              `New custom order to fulfil: "${orderToFulfil.title}" for $${orderToFulfil.price.toFixed(2)}`
            );
          }
        }
      } else {
        setBuyerBalance(username, (buyerBalances[username] || 0) + amount);
      }
    }
  };

  const sendTip = (buyer: string, seller: string, amount: number): boolean => {
    if (!buyer || !seller || amount <= 0) return false;
    const buyerBalance = getBuyerBalance(buyer);
    if (buyerBalance < amount) return false;

    setBuyerBalance(buyer, buyerBalance - amount);
    setSellerBalance(seller, getSellerBalance(seller) + amount);

    if (addSellerNotification) {
      addSellerNotification(
        seller,
        `Tip received from ${buyer} - $${amount.toFixed(2)}`
      );
    }

    return true;
  };

  return (
    <WalletContext.Provider
      value={{
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
        wallet,
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
      }}
    >
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