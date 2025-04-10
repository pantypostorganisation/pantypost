'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

type Order = {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string; // Add imageUrl to the Order type
  date: string; // Add a date to track when the order was placed
};

type WalletContextType = {
  buyerBalance: number;
  sellerBalance: number;
  setBuyerBalance: (balance: number) => void;
  setSellerBalance: (balance: number) => void;
  purchaseListing: (listing: Order) => boolean; // Use Order type for purchase
  orderHistory: Order[]; // Add order history state
  addOrder: (order: Order) => void; // Function to add an order
};

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [buyerBalance, setBuyerBalance] = useState<number>(100);
  const [sellerBalance, setSellerBalance] = useState<number>(250);
  const [orderHistory, setOrderHistory] = useState<Order[]>([]); // Initialize order history

  const purchaseListing = (listing: Order): boolean => {
    if (buyerBalance >= listing.price) {
      // Deduct from buyer's balance
      setBuyerBalance((prev) => prev - listing.price);
      // Add to seller's balance
      setSellerBalance((prev) => prev + listing.price);
      // Add order to history
      addOrder(listing);
      return true;
    }
    return false;
  };

  const addOrder = (order: Order) => {
    // Add order to history with current date
    setOrderHistory((prev) => [
      ...prev,
      { ...order, date: new Date().toISOString() }, // Adding current date to the order
    ]);
  };

  return (
    <WalletContext.Provider value={{ buyerBalance, sellerBalance, setBuyerBalance, setSellerBalance, purchaseListing, orderHistory, addOrder }}>
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
