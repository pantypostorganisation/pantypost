"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

// Import-free notification function to avoid circular dependencies
const addSellerNotificationToStorage = (seller: string, message: string) => {
  if (typeof window !== 'undefined') {
    const notifs = JSON.parse(localStorage.getItem('seller_notifications') || '[]');
    notifs.push(message);
    localStorage.setItem('seller_notifications', JSON.stringify(notifs));
    window.dispatchEvent(new CustomEvent('newSellerNotification'));
  }
};

type Order = {
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
  // You can add more fields as needed
};

type Withdrawal = {
  amount: number;
  date: string;
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
  purchaseListing: (listing: Omit<Order, 'buyer'>, buyerUsername: string) => boolean;
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
  wallet: { [username: string]: number }; // Unified wallet object
  updateWallet: (username: string, amount: number, orderToFulfil?: Order) => void; // Generic update function, now can add order
};

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [buyerBalances, setBuyerBalancesState] = useState<{ [username: string]: number }>({});
  const [adminBalance, setAdminBalanceState] = useState<number>(0);
  const [sellerBalances, setSellerBalancesState] = useState<{ [username: string]: number }>({});
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);
  const [sellerWithdrawals, setSellerWithdrawals] = useState<{ [username: string]: Withdrawal[] }>({});
  const [adminWithdrawals, setAdminWithdrawals] = useState<Withdrawal[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const buyers = localStorage.getItem("wallet_buyers");
    const admin = localStorage.getItem("wallet_admin");
    const sellers = localStorage.getItem("wallet_sellers");
    const orders = localStorage.getItem("wallet_orders");
    const sellerWds = localStorage.getItem("wallet_sellerWithdrawals");
    const adminWds = localStorage.getItem("wallet_adminWithdrawals");

    if (buyers) setBuyerBalancesState(JSON.parse(buyers));
    if (admin) setAdminBalanceState(parseFloat(admin));
    if (sellers) setSellerBalancesState(JSON.parse(sellers));
    if (orders) setOrderHistory(JSON.parse(orders));
    if (sellerWds) setSellerWithdrawals(JSON.parse(sellerWds));
    if (adminWds) setAdminWithdrawals(JSON.parse(adminWds));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem("wallet_buyers", JSON.stringify(buyerBalances));
  }, [buyerBalances]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem("wallet_admin", adminBalance.toString());
  }, [adminBalance]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem("wallet_sellers", JSON.stringify(sellerBalances));
  }, [sellerBalances]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem("wallet_orders", JSON.stringify(orderHistory));
  }, [orderHistory]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem("wallet_sellerWithdrawals", JSON.stringify(sellerWithdrawals));
  }, [sellerWithdrawals]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem("wallet_adminWithdrawals", JSON.stringify(adminWithdrawals));
  }, [adminWithdrawals]);

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

  const purchaseListing = (listing: Omit<Order, 'buyer'>, buyerUsername: string): boolean => {
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

    setBuyerBalance(buyerUsername, currentBuyerBalance - price);

    setSellerBalancesState((prev) => ({
      ...prev,
      [seller]: (prev[seller] || 0) + sellerCut,
    }));

    // Credit the full admin cut to the shared admin wallet (oakley)
    updateWallet('oakley', platformCut);

    const order: Order = {
      ...listing,
      buyer: buyerUsername,
      date: new Date().toISOString(),
    } as Order;

    addOrder(order);

    const displayPrice = (listing.markedUpPrice !== undefined && listing.markedUpPrice !== null)
      ? listing.markedUpPrice.toFixed(2)
      : listing.price.toFixed(2);

    addSellerNotificationToStorage(
      seller,
      `💸 New sale: "${listing.title}" for $${displayPrice}`
    );

    return true;
  };

  const subscribeToSellerWithPayment = (
    buyer: string,
    seller: string,
    amount: number
  ): boolean => {
    const buyerBalance = getBuyerBalance(buyer);
    if (buyerBalance < amount) {
      return false;
    }

    const sellerCut = amount * 0.75;
    const adminCut = amount * 0.25;

    setBuyerBalance(buyer, buyerBalance - amount);
    setSellerBalance(seller, getSellerBalance(seller) + sellerCut);

    // Credit the full admin cut to the shared admin wallet (oakley)
    updateWallet('oakley', adminCut);

    addSellerNotificationToStorage(
      seller,
      `💰 New subscriber: ${buyer} paid $${amount.toFixed(2)}/month`
    );

    return true;
  };

  const addSellerWithdrawal = (username: string, amount: number) => {
    const date = new Date().toISOString();
    setSellerWithdrawals((prev) => ({
      ...prev,
      [username]: [...(prev[username] || []), { amount, date }],
    }));
    setSellerBalance(username, getSellerBalance(username) - amount);
  };

  const addAdminWithdrawal = (amount: number) => {
    const date = new Date().toISOString();
    setAdminWithdrawals((prev) => [...prev, { amount, date }]);
    setAdminBalanceState((prev) => prev - amount);
  };

  // Unified wallet object (buyer, seller, admin)
  // Both oakley and gerome see the same admin balance
  const wallet: { [username: string]: number } = {
    ...buyerBalances,
    ...sellerBalances,
    oakley: adminBalance,
    gerome: adminBalance,
    admin: adminBalance,
  };

  /**
   * updateWallet: 
   * - Always adds to seller's balance (even if not present, initializes to 0).
   * - Always adds to buyer's balance (even if not present, initializes to 0).
   * - If orderToFulfil is provided, adds it to orderHistory (for custom request payments).
   * - For admin, always update the shared admin balance (oakley/gerome/admin).
   */
  const updateWallet = (username: string, amount: number, orderToFulfil?: Order) => {
    if (username === "oakley" || username === "gerome" || username === "admin") {
      setAdminBalanceState((prev) => prev + amount);
    } else if (
      sellerBalances.hasOwnProperty(username) ||
      Object.keys(sellerBalances).includes(username) ||
      (orderToFulfil && orderToFulfil.seller === username)
    ) {
      setSellerBalance(username, (sellerBalances[username] || 0) + amount);
      if (orderToFulfil) {
        addOrder(orderToFulfil);
        addSellerNotificationToStorage(
          username,
          `🛒 New custom order to fulfil: "${orderToFulfil.title}" for $${orderToFulfil.price.toFixed(2)}`
        );
      }
    } else if (buyerBalances.hasOwnProperty(username) || Object.keys(buyerBalances).includes(username)) {
      setBuyerBalance(username, getBuyerBalance(username) + amount);
    } else {
      if (amount > 0) {
        setSellerBalance(username, (sellerBalances[username] || 0) + amount);
        if (orderToFulfil) {
          addOrder(orderToFulfil);
          addSellerNotificationToStorage(
            username,
            `🛒 New custom order to fulfil: "${orderToFulfil.title}" for $${orderToFulfil.price.toFixed(2)}`
          );
        }
      } else {
        setBuyerBalance(username, (buyerBalances[username] || 0) + amount);
      }
    }
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
        subscribeToSellerWithPayment,
        orderHistory,
        addOrder,
        sellerWithdrawals,
        adminWithdrawals,
        addSellerWithdrawal,
        addAdminWithdrawal,
        wallet,
        updateWallet,
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
