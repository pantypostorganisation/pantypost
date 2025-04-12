'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Order = {
  id: string;
  title: string;
  description: string;
  price: number;
  markedUpPrice: number;
  imageUrl: string;
  date: string;
  seller: string;
};

type WalletContextType = {
  buyerBalance: number;
  adminBalance: number;
  sellerBalances: { [username: string]: number };
  setBuyerBalance: (balance: number) => void;
  setAdminBalance: (balance: number) => void;
  setSellerBalance: (seller: string, balance: number) => void;
  getSellerBalance: (seller: string) => number;
  purchaseListing: (listing: Order) => boolean;
  orderHistory: Order[];
  addOrder: (order: Order) => void;
};

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [buyerBalance, setBuyerBalanceState] = useState<number>(100);
  const [adminBalance, setAdminBalanceState] = useState<number>(0);
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);
  const [sellerBalances, setSellerBalancesState] = useState<{ [username: string]: number }>({});

  // --- Load from localStorage on mount ---
  useEffect(() => {
    const storedBuyer = localStorage.getItem('wallet_buyer');
    const storedAdmin = localStorage.getItem('wallet_admin');
    const storedSellers = localStorage.getItem('wallet_sellers');
    const storedOrders = localStorage.getItem('wallet_orders');

    if (storedBuyer) setBuyerBalanceState(parseFloat(storedBuyer));
    if (storedAdmin) setAdminBalanceState(parseFloat(storedAdmin));
    if (storedSellers) setSellerBalancesState(JSON.parse(storedSellers));
    if (storedOrders) setOrderHistory(JSON.parse(storedOrders));
  }, []);

  // --- Save to localStorage when values change ---
  useEffect(() => {
    localStorage.setItem('wallet_buyer', buyerBalance.toString());
  }, [buyerBalance]);

  useEffect(() => {
    localStorage.setItem('wallet_admin', adminBalance.toString());
  }, [adminBalance]);

  useEffect(() => {
    localStorage.setItem('wallet_sellers', JSON.stringify(sellerBalances));
  }, [sellerBalances]);

  useEffect(() => {
    localStorage.setItem('wallet_orders', JSON.stringify(orderHistory));
  }, [orderHistory]);

  const getSellerBalance = (seller: string): number => {
    return sellerBalances[seller] || 0;
  };

  const setSellerBalance = (seller: string, balance: number) => {
    setSellerBalancesState((prev) => ({
      ...prev,
      [seller]: balance,
    }));
  };

  const setBuyerBalance = (balance: number) => {
    setBuyerBalanceState(balance);
  };

  const setAdminBalance = (balance: number) => {
    setAdminBalanceState(balance);
  };

  const purchaseListing = (listing: Order): boolean => {
    if (buyerBalance >= listing.markedUpPrice) {
      const seller = listing.seller;
      const sellerCut = listing.price * 0.9;
      const platformCut = listing.markedUpPrice - sellerCut;

      setBuyerBalanceState((prev) => prev - listing.markedUpPrice);

      setSellerBalancesState((prev) => ({
        ...prev,
        [seller]: (prev[seller] || 0) + sellerCut,
      }));

      setAdminBalanceState((prev) => prev + platformCut);

      addOrder(listing);
      return true;
    }
    return false;
  };

  const addOrder = (order: Order) => {
    setOrderHistory((prev) => [...prev, order]);
  };

  return (
    <WalletContext.Provider
      value={{
        buyerBalance,
        adminBalance,
        sellerBalances,
        setBuyerBalance,
        setAdminBalance,
        setSellerBalance,
        getSellerBalance,
        purchaseListing,
        orderHistory,
        addOrder,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
