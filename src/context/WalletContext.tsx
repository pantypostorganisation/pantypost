"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

type Order = {
  id: string;
  title: string;
  description: string;
  price: number;
  markedUpPrice: number;
  imageUrl: string;
  date: string;
  seller: string;
  buyer: string; // ✅ Added buyer to order
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
  orderHistory: Order[];
  addOrder: (order: Order) => void;
  sellerWithdrawals: { [username: string]: Withdrawal[] };
  adminWithdrawals: Withdrawal[];
  addSellerWithdrawal: (username: string, amount: number) => void;
  addAdminWithdrawal: (amount: number) => void;
};

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [buyerBalances, setBuyerBalancesState] = useState<{ [username: string]: number }>({});
  const [adminBalance, setAdminBalanceState] = useState<number>(0);
  const [sellerBalances, setSellerBalancesState] = useState<{ [username: string]: number }>({});
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);
  const [sellerWithdrawals, setSellerWithdrawals] = useState<{ [username: string]: Withdrawal[] }>({});
  const [adminWithdrawals, setAdminWithdrawals] = useState<Withdrawal[]>([]);

  useEffect(() => {
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
    localStorage.setItem("wallet_buyers", JSON.stringify(buyerBalances));
  }, [buyerBalances]);

  useEffect(() => {
    localStorage.setItem("wallet_admin", adminBalance.toString());
  }, [adminBalance]);

  useEffect(() => {
    localStorage.setItem("wallet_sellers", JSON.stringify(sellerBalances));
  }, [sellerBalances]);

  useEffect(() => {
    localStorage.setItem("wallet_orders", JSON.stringify(orderHistory));
  }, [orderHistory]);

  useEffect(() => {
    localStorage.setItem("wallet_sellerWithdrawals", JSON.stringify(sellerWithdrawals));
  }, [sellerWithdrawals]);

  useEffect(() => {
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
    const price = listing.markedUpPrice ?? listing.price;
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

    setAdminBalanceState((prev) => prev + platformCut);

    addOrder({
      ...listing,
      buyer: buyerUsername, // ✅ Save buyer!
      date: new Date().toISOString(),
    });

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
        orderHistory,
        addOrder,
        sellerWithdrawals,
        adminWithdrawals,
        addSellerWithdrawal,
        addAdminWithdrawal,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};