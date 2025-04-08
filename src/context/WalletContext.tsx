'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

type WalletContextType = {
  buyerBalance: number;
  sellerBalance: number;
  setBuyerBalance: (balance: number) => void;
  setSellerBalance: (balance: number) => void;
  purchaseListing: (listingPrice: number) => boolean; // Add purchaseListing function to context
};

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [buyerBalance, setBuyerBalance] = useState<number>(100); // Initial balance for the buyer
  const [sellerBalance, setSellerBalance] = useState<number>(250); // Initial balance for the seller

  // Define purchaseListing function
  const purchaseListing = (listingPrice: number): boolean => {
    if (buyerBalance >= listingPrice) {
      // Deduct from the buyer's balance
      setBuyerBalance((prev) => prev - listingPrice);
      // Add to the seller's balance
      setSellerBalance((prev) => prev + listingPrice);
      return true;
    }
    return false; // Insufficient funds
  };

  return (
    <WalletContext.Provider value={{ buyerBalance, sellerBalance, setBuyerBalance, setSellerBalance, purchaseListing }}>
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
