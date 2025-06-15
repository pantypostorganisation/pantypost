// src/context/WalletContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { safeStorage } from '@/utils/safeStorage';

// Types remain the same...
export interface DepositLog {
  id: string;
  username: string;
  amount: number;
  method: string;
  status: 'pending' | 'completed' | 'failed';
  timestamp: string;
  transactionId?: string;
  errorMessage?: string;
  notes?: string;
}

export interface Order {
  id: string;
  buyer: string;
  seller: string;
  listingId: string;
  listingTitle: string;
  price: number;
  platformFee: number;
  sellerEarnings: number;
  timestamp: string;
  status: "pending" | "completed" | "cancelled";
  deliveryAddress?: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
}

interface SellerWithdrawal {
  id: string;
  seller: string;
  amount: number;
  timestamp: string;
  status: "pending" | "approved" | "rejected";
  paymentMethod?: string;
  notes?: string;
}

interface AdminWithdrawal {
  id: string;
  admin: string;
  amount: number;
  timestamp: string;
  method: string;
  notes?: string;
}

interface AdminAction {
  id: string;
  admin: string;
  action: "credit" | "debit";
  targetUser: string;
  targetType: "buyer" | "seller";
  amount: number;
  reason: string;
  timestamp: string;
}

interface WalletContextType {
  getBuyerBalance: (username: string) => number;
  getSellerBalance: (username: string) => number;
  getAdminBalance: () => number;
  creditBuyer: (username: string, amount: number) => void;
  debitBuyer: (username: string, amount: number) => boolean;
  creditSeller: (username: string, amount: number) => void;
  debitSeller: (username: string, amount: number) => boolean;
  creditAdmin: (amount: number) => void;
  debitAdmin: (amount: number) => boolean;
  purchaseListing: (buyer: string, seller: string, listingId: string, listingTitle: string, price: number, deliveryAddress?: Order["deliveryAddress"], subscriptionDiscount?: number) => boolean;
  subscribeToSellerWithPayment: (buyer: string, seller: string, price: number) => boolean;
  sendTip: (from: string, to: string, amount: number) => boolean;
  requestSellerWithdrawal: (seller: string, amount: number, paymentMethod?: string, notes?: string) => boolean;
  approveSellerWithdrawal: (withdrawalId: string) => boolean;
  rejectSellerWithdrawal: (withdrawalId: string, reason?: string) => boolean;
  adminWithdraw: (admin: string, amount: number, method: string, notes?: string) => boolean;
  adminCreditUser: (admin: string, targetUser: string, targetType: "buyer" | "seller", amount: number, reason: string) => boolean;
  adminDebitUser: (admin: string, targetUser: string, targetType: "buyer" | "seller", amount: number, reason: string) => boolean;
  addOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: Order["status"]) => void;
  getOrderHistory: (username: string, role: "buyer" | "seller") => Order[];
  getSellerWithdrawals: (seller?: string) => SellerWithdrawal[];
  getAdminWithdrawals: () => AdminWithdrawal[];
  getAdminActions: () => AdminAction[];
  getTotalPlatformEarnings: () => number;
  orderHistory: Order[];
  setAddSellerNotificationCallback: (callback: ((seller: string, message: string) => void) | null) => void;
  logDeposit: (deposit: Omit<DepositLog, 'id' | 'timestamp'>) => void;
  updateDepositStatus: (depositId: string, status: DepositLog['status'], transactionId?: string, errorMessage?: string) => void;
  getDepositLogs: (username?: string) => DepositLog[];
  addDeposit: (username: string, amount: number, method: string, notes?: string) => boolean;
  setBuyerBalance: (username: string, balance: number) => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  // State
  const [buyerBalances, setBuyerBalancesState] = useState<{ [username: string]: number }>({});
  const [sellerBalances, setSellerBalancesState] = useState<{ [username: string]: number }>({});
  const [adminBalance, setAdminBalanceState] = useState<number>(0);
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);
  const [sellerWithdrawals, setSellerWithdrawals] = useState<SellerWithdrawal[]>([]);
  const [adminWithdrawals, setAdminWithdrawals] = useState<AdminWithdrawal[]>([]);
  const [adminActions, setAdminActions] = useState<AdminAction[]>([]);
  const [depositLogs, setDepositLogs] = useState<DepositLog[]>([]);
  const [addSellerNotificationCallback, setAddSellerNotificationCallback] = useState<((seller: string, message: string) => void) | null>(null);

  // Load data from storage on mount
  useEffect(() => {
    const buyers = safeStorage.getItem<{ [username: string]: number }>("wallet_buyers", {});
    const admin = safeStorage.getItem<number>("wallet_admin", 0);
    const sellers = safeStorage.getItem<{ [username: string]: number }>("wallet_sellers", {});
    const orders = safeStorage.getItem<Order[]>("wallet_orders", []);
    const sellerWds = safeStorage.getItem<SellerWithdrawal[]>("wallet_sellerWithdrawals", []);
    const adminWds = safeStorage.getItem<AdminWithdrawal[]>("wallet_adminWithdrawals", []);
    const actions = safeStorage.getItem<AdminAction[]>("wallet_adminActions", []);
    const deposits = safeStorage.getItem<DepositLog[]>("wallet_depositLogs", []);

    setBuyerBalancesState(buyers || {});
    setAdminBalanceState(admin || 0);
    setSellerBalancesState(sellers || {});
    setOrderHistory(orders || []);
    setSellerWithdrawals(sellerWds || []);
    setAdminWithdrawals(adminWds || []);
    setAdminActions(actions || []);
    setDepositLogs(deposits || []);
  }, []);

  // Save data to storage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      safeStorage.setItem("wallet_buyers", buyerBalances);
    }
  }, [buyerBalances]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      safeStorage.setItem("wallet_admin", adminBalance);
    }
  }, [adminBalance]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      safeStorage.setItem("wallet_sellers", sellerBalances);
    }
  }, [sellerBalances]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      safeStorage.setItem("wallet_orders", orderHistory);
    }
  }, [orderHistory]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      safeStorage.setItem("wallet_sellerWithdrawals", sellerWithdrawals);
    }
  }, [sellerWithdrawals]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      safeStorage.setItem("wallet_adminWithdrawals", adminWithdrawals);
    }
  }, [adminWithdrawals]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      safeStorage.setItem("wallet_adminActions", adminActions);
    }
  }, [adminActions]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      safeStorage.setItem("wallet_depositLogs", depositLogs);
    }
  }, [depositLogs]);

  // Wallet operations
  const getBuyerBalance = (username: string) => buyerBalances[username] || 0;
  const getSellerBalance = (username: string) => sellerBalances[username] || 0;
  const getAdminBalance = () => adminBalance;

  const creditBuyer = (username: string, amount: number) => {
    setBuyerBalancesState((prev) => {
      const updated = {
        ...prev,
        [username]: (prev[username] || 0) + amount,
      };
      // Force save immediately
      if (typeof window !== 'undefined') {
        safeStorage.setItem("wallet_buyers", updated);
      }
      return updated;
    });
  };

  const debitBuyer = (username: string, amount: number): boolean => {
    const currentBalance = buyerBalances[username] || 0;
    if (currentBalance >= amount) {
      setBuyerBalancesState((prev) => ({
        ...prev,
        [username]: currentBalance - amount,
      }));
      return true;
    }
    return false;
  };

  const creditSeller = (username: string, amount: number) => {
    setSellerBalancesState((prev) => ({
      ...prev,
      [username]: (prev[username] || 0) + amount,
    }));
  };

  const debitSeller = (username: string, amount: number): boolean => {
    const currentBalance = sellerBalances[username] || 0;
    if (currentBalance >= amount) {
      setSellerBalancesState((prev) => ({
        ...prev,
        [username]: currentBalance - amount,
      }));
      return true;
    }
    return false;
  };

  const creditAdmin = (amount: number) => {
    setAdminBalanceState((prev) => prev + amount);
  };

  const debitAdmin = (amount: number): boolean => {
    if (adminBalance >= amount) {
      setAdminBalanceState((prev) => prev - amount);
      return true;
    }
    return false;
  };

  // Purchase and subscription functions
  const purchaseListing = (
    buyer: string,
    seller: string,
    listingId: string,
    listingTitle: string,
    price: number,
    deliveryAddress?: Order["deliveryAddress"],
    subscriptionDiscount: number = 0
  ): boolean => {
    const finalPrice = price - subscriptionDiscount;
    const buyerBalance = getBuyerBalance(buyer);

    if (buyerBalance < finalPrice) {
      return false;
    }

    const platformFee = Math.round(price * 0.2 * 100) / 100;
    const sellerEarnings = Math.round((price * 0.9) * 100) / 100;

    debitBuyer(buyer, finalPrice);
    creditSeller(seller, sellerEarnings);
    creditAdmin(platformFee);

    const order: Order = {
      id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      buyer,
      seller,
      listingId,
      listingTitle,
      price: finalPrice,
      platformFee,
      sellerEarnings,
      timestamp: new Date().toISOString(),
      status: "pending",
      deliveryAddress,
    };

    addOrder(order);

    if (addSellerNotificationCallback) {
      addSellerNotificationCallback(seller, `New sale: ${listingTitle} - $${finalPrice}`);
    }

    return true;
  };

  const subscribeToSellerWithPayment = (buyer: string, seller: string, price: number): boolean => {
    const buyerBalance = getBuyerBalance(buyer);

    if (buyerBalance < price) {
      return false;
    }

    const platformFee = Math.round(price * 0.25 * 100) / 100;
    const sellerEarnings = Math.round(price * 0.75 * 100) / 100;

    debitBuyer(buyer, price);
    creditSeller(seller, sellerEarnings);
    creditAdmin(platformFee);

    if (addSellerNotificationCallback) {
      addSellerNotificationCallback(seller, `${buyer} subscribed to you! +$${sellerEarnings}`);
    }

    return true;
  };

  const sendTip = (from: string, to: string, amount: number): boolean => {
    const senderBalance = getBuyerBalance(from);
    
    if (senderBalance < amount) {
      return false;
    }

    const platformFee = Math.round(amount * 0.1 * 100) / 100;
    const tipAmount = Math.round(amount * 0.9 * 100) / 100;

    debitBuyer(from, amount);
    creditSeller(to, tipAmount);
    creditAdmin(platformFee);

    if (addSellerNotificationCallback) {
      addSellerNotificationCallback(to, `Tip received from ${from}: $${tipAmount}`);
    }

    return true;
  };

  // Withdrawal functions
  const requestSellerWithdrawal = (seller: string, amount: number, paymentMethod?: string, notes?: string): boolean => {
    const balance = getSellerBalance(seller);
    if (balance < amount) {
      return false;
    }

    const withdrawal: SellerWithdrawal = {
      id: `withdrawal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      seller,
      amount,
      timestamp: new Date().toISOString(),
      status: "pending",
      paymentMethod,
      notes,
    };

    setSellerWithdrawals((prev) => [...prev, withdrawal]);
    return true;
  };

  const approveSellerWithdrawal = (withdrawalId: string): boolean => {
    const withdrawal = sellerWithdrawals.find((w) => w.id === withdrawalId);
    if (!withdrawal || withdrawal.status !== "pending") {
      return false;
    }

    const sellerBalance = getSellerBalance(withdrawal.seller);
    if (sellerBalance < withdrawal.amount) {
      return false;
    }

    debitSeller(withdrawal.seller, withdrawal.amount);
    
    setSellerWithdrawals((prev) =>
      prev.map((w) => (w.id === withdrawalId ? { ...w, status: "approved" as const } : w))
    );

    return true;
  };

  const rejectSellerWithdrawal = (withdrawalId: string, reason?: string): boolean => {
    setSellerWithdrawals((prev) =>
      prev.map((w) =>
        w.id === withdrawalId
          ? { ...w, status: "rejected" as const, notes: reason || w.notes }
          : w
      )
    );
    return true;
  };

  const adminWithdraw = (admin: string, amount: number, method: string, notes?: string): boolean => {
    if (!debitAdmin(amount)) {
      return false;
    }

    const withdrawal: AdminWithdrawal = {
      id: `admin_withdrawal_${Date.now()}`,
      admin,
      amount,
      timestamp: new Date().toISOString(),
      method,
      notes,
    };

    setAdminWithdrawals((prev) => [...prev, withdrawal]);
    return true;
  };

  // Admin functions
  const adminCreditUser = (
    admin: string,
    targetUser: string,
    targetType: "buyer" | "seller",
    amount: number,
    reason: string
  ): boolean => {
    if (targetType === "buyer") {
      creditBuyer(targetUser, amount);
    } else {
      creditSeller(targetUser, amount);
    }

    const action: AdminAction = {
      id: `action_${Date.now()}`,
      admin,
      action: "credit",
      targetUser,
      targetType,
      amount,
      reason,
      timestamp: new Date().toISOString(),
    };

    setAdminActions((prev) => [...prev, action]);
    return true;
  };

  const adminDebitUser = (
    admin: string,
    targetUser: string,
    targetType: "buyer" | "seller",
    amount: number,
    reason: string
  ): boolean => {
    const success = targetType === "buyer" 
      ? debitBuyer(targetUser, amount)
      : debitSeller(targetUser, amount);

    if (!success) {
      return false;
    }

    const action: AdminAction = {
      id: `action_${Date.now()}`,
      admin,
      action: "debit",
      targetUser,
      targetType,
      amount,
      reason,
      timestamp: new Date().toISOString(),
    };

    setAdminActions((prev) => [...prev, action]);
    return true;
  };

  // Order functions
  const addOrder = (order: Order) => {
    setOrderHistory((prev) => [...prev, order]);
  };

  const updateOrderStatus = (orderId: string, status: Order["status"]) => {
    setOrderHistory((prev) =>
      prev.map((order) => (order.id === orderId ? { ...order, status } : order))
    );
  };

  const getOrderHistory = (username: string, role: "buyer" | "seller"): Order[] => {
    return orderHistory.filter((order) =>
      role === "buyer" ? order.buyer === username : order.seller === username
    );
  };

  const getSellerWithdrawals = (seller?: string): SellerWithdrawal[] => {
    return seller
      ? sellerWithdrawals.filter((w) => w.seller === seller)
      : sellerWithdrawals;
  };

  const getAdminWithdrawals = (): AdminWithdrawal[] => adminWithdrawals;
  const getAdminActions = (): AdminAction[] => adminActions;

  const getTotalPlatformEarnings = (): number => {
    return orderHistory.reduce((total, order) => total + order.platformFee, 0);
  };

  // Deposit functions
  const logDeposit = (deposit: Omit<DepositLog, 'id' | 'timestamp'>) => {
    const newDeposit: DepositLog = {
      ...deposit,
      id: `deposit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    };
    setDepositLogs(prev => [...prev, newDeposit]);
  };

  const updateDepositStatus = (
    depositId: string, 
    status: DepositLog['status'], 
    transactionId?: string, 
    errorMessage?: string
  ) => {
    setDepositLogs(prev => prev.map(deposit => 
      deposit.id === depositId 
        ? { ...deposit, status, transactionId, errorMessage }
        : deposit
    ));
  };

  const getDepositLogs = (username?: string): DepositLog[] => {
    return username 
      ? depositLogs.filter(log => log.username === username)
      : depositLogs;
  };

  // Add deposit function (for buyer wallet page compatibility)
  const addDeposit = (username: string, amount: number, method: string, notes?: string): boolean => {
    try {
      // Create the deposit log
      const deposit: Omit<DepositLog, 'id' | 'timestamp'> = {
        username,
        amount,
        method: method as DepositLog['method'],
        status: 'completed',
        transactionId: `txn_${Date.now()}`,
        notes,
      };
      
      // Log the deposit
      logDeposit(deposit);
      
      // Credit the buyer's balance directly
      const currentBalance = getBuyerBalance(username);
      const newBalance = currentBalance + amount;
      
      // Update the buyer balances state
      setBuyerBalancesState(prev => ({
        ...prev,
        [username]: newBalance
      }));
      
      console.log(`Deposit successful: ${username} +${amount}, new balance: ${newBalance}`);
      
      return true;
    } catch (error) {
      console.error('Error adding deposit:', error);
      return false;
    }
  };

  const value: WalletContextType = {
    getBuyerBalance,
    getSellerBalance,
    getAdminBalance,
    creditBuyer,
    debitBuyer,
    creditSeller,
    debitSeller,
    creditAdmin,
    debitAdmin,
    purchaseListing,
    subscribeToSellerWithPayment,
    sendTip,
    requestSellerWithdrawal,
    approveSellerWithdrawal,
    rejectSellerWithdrawal,
    adminWithdraw,
    adminCreditUser,
    adminDebitUser,
    addOrder,
    updateOrderStatus,
    getOrderHistory,
    getSellerWithdrawals,
    getAdminWithdrawals,
    getAdminActions,
    getTotalPlatformEarnings,
    orderHistory,
    setAddSellerNotificationCallback,
    logDeposit,
    updateDepositStatus,
    getDepositLogs,
    addDeposit,
    setBuyerBalance: (username: string, balance: number) => {
      setBuyerBalancesState(prev => ({
        ...prev,
        [username]: balance,
      }));
    },
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};