'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

type Order = {
  id: string;
  title: string;
  description: string;
  price: number; // Seller's original price
  markedUpPrice: number; // Buyer pays this
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
  const [buyerBalance, setBuyerBalance] = useState<number>(100);
  const [adminBalance, setAdminBalance] = useState<number>(0);
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);
  const [sellerBalances, setSellerBalances] = useState<{ [username: string]: number }>({});

  const getSellerBalance = (seller: string): number => {
    return sellerBalances[seller] || 0;
  };

  const setSellerBalance = (seller: string, balance: number) => {
    setSellerBalances((prev) => ({
      ...prev,
      [seller]: balance,
    }));
  };

  const purchaseListing = (listing: Order): boolean => {
    if (buyerBalance >= listing.markedUpPrice) {
      const seller = listing.seller;
      const sellerCut = listing.price * 0.9;
      const platformCut = listing.markedUpPrice - sellerCut;

      // Deduct full marked-up amount from buyer
      setBuyerBalance((prev) => prev - listing.markedUpPrice);

      // Credit seller their 90% cut
      setSellerBalances((prev) => ({
        ...prev,
        [seller]: (prev[seller] || 0) + sellerCut,
      }));

      // Add full 20% platform margin to shared admin pool
      setAdminBalance((prev) => prev + platformCut);

      // Save order
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
