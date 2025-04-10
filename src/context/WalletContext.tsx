'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

type Order = {
  id: string;
  title: string;
  description: string;
  price: number; // The original price set by the seller
  markedUpPrice: number; // The marked-up price that the buyer sees
  imageUrl: string;
  date: string;
};

type WalletContextType = {
  buyerBalance: number;
  sellerBalance: number;
  platformBalance: number; // Platform's 10% fee
  setBuyerBalance: (balance: number) => void;
  setSellerBalance: (balance: number) => void;
  setPlatformBalance: (balance: number) => void;
  purchaseListing: (listing: Order) => boolean;
  orderHistory: Order[];
  addOrder: (order: Order) => void;
};

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [buyerBalance, setBuyerBalance] = useState<number>(100);
  const [sellerBalance, setSellerBalance] = useState<number>(250);
  const [platformBalance, setPlatformBalance] = useState<number>(0); // Platform's earnings
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);

  const purchaseListing = (listing: Order): boolean => {
    if (buyerBalance >= listing.markedUpPrice) {
      // Deduct from buyer's balance (marked-up price)
      setBuyerBalance((prev) => prev - listing.markedUpPrice);

      // Add to seller's balance (original price minus 10% fee)
      setSellerBalance((prev) => prev + listing.price * 0.9); // Seller receives 90%

      // Add platform fee to platform balance (10% of the price)
      setPlatformBalance((prev) => prev + listing.price * 0.1);

      // Add order to history
      addOrder(listing);
      return true;
    }
    return false;
  };

  const addOrder = (order: Order) => {
    setOrderHistory((prev) => [...prev, order]);
  };

  return (
    <WalletContext.Provider value={{ buyerBalance, sellerBalance, platformBalance, setBuyerBalance, setSellerBalance, setPlatformBalance, purchaseListing, orderHistory, addOrder }}>
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
