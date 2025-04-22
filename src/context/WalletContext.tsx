'use client';

import React, { createContext, useState, useEffect, useContext } from 'react';
import { Listing, Sale } from './ListingContext';

// Types
export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: string;
  description: string;
  createdAt: string;
  relatedId?: string; // For linking to listings, sales, etc.
}

export interface Wallet {
  userId: string;
  balance: number;
  transactions: Transaction[];
}

interface WalletContextType {
  buyerWallet: Wallet;
  sellerWallet: Wallet;
  adminWallet: Wallet;
  adminBalance: number; // Added this for the Header component
  wallets: Record<string, Wallet>;
  addFundsToBuyerWallet: (amount: number) => void;
  purchaseListing: (listing: Listing, buyerUsername: string) => boolean;
  processSale: (sale: Sale) => boolean;
  requestWithdrawal: (amount: number) => boolean;
  getSellerEarnings: (sellerId: string) => number;
  getAllWithdrawalRequests: () => Transaction[];
  approveWithdrawal: (transactionId: string) => void;
  rejectWithdrawal: (transactionId: string) => void;
  getBuyerBalance: (username: string) => number;
  getSellerBalance: (username: string) => number; // Added this for the Header component
}

export const WalletContext = createContext<WalletContextType>({
  buyerWallet: { userId: '', balance: 0, transactions: [] },
  sellerWallet: { userId: '', balance: 0, transactions: [] },
  adminWallet: { userId: '', balance: 0, transactions: [] },
  adminBalance: 0, // Added default
  wallets: {},
  addFundsToBuyerWallet: () => {},
  purchaseListing: () => false,
  processSale: () => false,
  requestWithdrawal: () => false,
  getSellerEarnings: () => 0,
  getAllWithdrawalRequests: () => [],
  approveWithdrawal: () => {},
  rejectWithdrawal: () => {},
  getBuyerBalance: () => 0,
  getSellerBalance: () => 0, // Added default
});

export const useWallet = () => useContext(WalletContext);

interface UserData {
  id: string;
  username: string;
  role: string;
  [key: string]: any;
}

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wallets, setWallets] = useState<Record<string, Wallet>>({});
  const [buyerWallet, setBuyerWallet] = useState<Wallet>({ userId: '', balance: 0, transactions: [] });
  const [sellerWallet, setSellerWallet] = useState<Wallet>({ userId: '', balance: 0, transactions: [] });
  const [adminWallet, setAdminWallet] = useState<Wallet>({ userId: '', balance: 0, transactions: [] });
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [adminBalance, setAdminBalance] = useState<number>(0); // Added admin balance state

  // Load wallets from localStorage on initial render
  useEffect(() => {
    const storedWallets = localStorage.getItem('wallets');
    let parsedWallets: Record<string, Wallet> = {};
    
    if (storedWallets) {
      try {
        parsedWallets = JSON.parse(storedWallets);
        setWallets(parsedWallets);
        
        // Set admin balance
        const adminWallet = parsedWallets['admin'];
        if (adminWallet) {
          setAdminBalance(adminWallet.balance);
        }
      } catch (e) {
        console.error("Error parsing wallets from localStorage:", e);
        parsedWallets = {};
      }
    }

    // Get current user
    const user = localStorage.getItem('currentUser');
    if (user) {
      try {
        const parsedUser: UserData = JSON.parse(user);
        setCurrentUser(parsedUser);

        // Set the appropriate wallet based on user role
        if (parsedUser) {
          const userWallet = parsedWallets[parsedUser.id];
          
          if (userWallet) {
            if (parsedUser.role === 'buyer') {
              setBuyerWallet(userWallet);
            } else if (parsedUser.role === 'seller') {
              setSellerWallet(userWallet);
            } else if (parsedUser.role === 'admin') {
              setAdminWallet(userWallet);
              setAdminBalance(userWallet.balance);
            }
          } else {
            // Create a new wallet if it doesn't exist
            const newWallet: Wallet = { userId: parsedUser.id, balance: 0, transactions: [] };
            
            if (parsedUser.role === 'buyer') {
              setBuyerWallet(newWallet);
            } else if (parsedUser.role === 'seller') {
              setSellerWallet(newWallet);
            } else if (parsedUser.role === 'admin') {
              setAdminWallet(newWallet);
              setAdminBalance(0);
            }
            
            // Add to wallets
            setWallets(prev => ({ ...prev, [parsedUser.id]: newWallet }));
          }
        }
      } catch (e) {
        console.error("Error parsing user from localStorage:", e);
      }
    }
  }, []);

  // Update localStorage when wallets change
  useEffect(() => {
    if (Object.keys(wallets).length > 0) {
      localStorage.setItem('wallets', JSON.stringify(wallets));
    }
  }, [wallets]);

  // Add funds to buyer wallet
  const addFundsToBuyerWallet = (amount: number) => {
    if (!currentUser || currentUser.role !== 'buyer') return;
    
    const transaction: Transaction = {
      id: Date.now().toString(),
      userId: currentUser.id,
      amount,
      type: 'deposit',
      description: `Added $${amount.toFixed(2)} to wallet`,
      createdAt: new Date().toISOString()
    };

    const updatedWallet: Wallet = {
      ...buyerWallet,
      balance: buyerWallet.balance + amount,
      transactions: [transaction, ...buyerWallet.transactions]
    };

    setBuyerWallet(updatedWallet);
    setWallets(prev => ({ ...prev, [currentUser.id]: updatedWallet }));
  };

  // Handle a purchase
  const purchaseListing = (listing: Listing, buyerUsername: string) => {
    if (!currentUser || currentUser.role !== 'buyer') return false;
    
    // Cannot buy your own listing
    if (listing.seller === currentUser.username) return false;
    
    // Check if buyer has enough funds
    const price = listing.markedUpPrice || listing.price;
    if (buyerWallet.balance < price) return false;
    
    // Calculate fees (10% platform fee)
    const platformFee = price * 0.10; // 10% fee
    const sellerAmount = price - platformFee;
    
    // Create sale record
    const sale: Sale = {
      id: Date.now().toString(),
      listingId: listing.id,
      listingTitle: listing.title,
      buyer: buyerUsername,
      seller: listing.seller,
      price,
      commissionAmount: platformFee,
      sellerEarnings: sellerAmount,
      date: new Date().toISOString(),
      imageUrl: listing.imageUrl
    };
    
    // Process the sale (handle wallet transactions)
    return processSale(sale);
  };

  // Process the financial transactions of a sale
  const processSale = (sale: Sale) => {
    // Find seller and admin wallets
    const sellerId = getSellerIdByUsername(sale.seller);
    if (!sellerId) return false;
    
    const defaultWallet: Wallet = { userId: '', balance: 0, transactions: [] };
    let sellerWalletCopy: Wallet = wallets[sellerId] || { ...defaultWallet, userId: sellerId };
    let adminWalletCopy: Wallet = wallets['admin'] || { ...defaultWallet, userId: 'admin' };
    
    // Create buyer transaction (deduct funds)
    const buyerTransaction: Transaction = {
      id: Date.now().toString(),
      userId: currentUser?.id || '',
      amount: -sale.price,
      type: 'purchase',
      description: `Purchased "${sale.listingTitle}" from ${sale.seller}`,
      createdAt: new Date().toISOString(),
      relatedId: sale.listingId
    };
    
    // Create seller transaction (add funds)
    const sellerTransaction: Transaction = {
      id: (Date.now() + 1).toString(),
      userId: sellerWalletCopy.userId,
      amount: sale.sellerEarnings,
      type: 'sale',
      description: `Sale of "${sale.listingTitle}" to ${sale.buyer}`,
      createdAt: new Date().toISOString(),
      relatedId: sale.listingId
    };
    
    // Create admin transaction (platform fee)
    const adminTransaction: Transaction = {
      id: (Date.now() + 2).toString(),
      userId: 'admin',
      amount: sale.commissionAmount,
      type: 'commission',
      description: `Commission from sale of "${sale.listingTitle}" by ${sale.seller} to ${sale.buyer}`,
      createdAt: new Date().toISOString(),
      relatedId: sale.listingId
    };
    
    // Update buyer wallet
    const updatedBuyerWallet: Wallet = {
      ...buyerWallet,
      balance: buyerWallet.balance - sale.price,
      transactions: [buyerTransaction, ...buyerWallet.transactions]
    };
    
    // Update seller wallet
    const sellerTransactions: Transaction[] = Array.isArray(sellerWalletCopy.transactions) 
      ? sellerWalletCopy.transactions 
      : [];
      
    const updatedSellerWallet: Wallet = {
      ...sellerWalletCopy,
      balance: sellerWalletCopy.balance + sale.sellerEarnings,
      transactions: [sellerTransaction, ...sellerTransactions]
    };
    
    // Update admin wallet
    const adminTransactions: Transaction[] = Array.isArray(adminWalletCopy.transactions) 
      ? adminWalletCopy.transactions 
      : [];
      
    const updatedAdminWallet: Wallet = {
      ...adminWalletCopy,
      balance: adminWalletCopy.balance + sale.commissionAmount,
      transactions: [adminTransaction, ...adminTransactions]
    };
    
    // Update admin balance
    setAdminBalance(updatedAdminWallet.balance);
    
    // Update state
    setBuyerWallet(updatedBuyerWallet);
    if (currentUser?.role === 'seller' && currentUser.id === sellerWalletCopy.userId) {
      setSellerWallet(updatedSellerWallet);
    }
    if (currentUser?.role === 'admin') {
      setAdminWallet(updatedAdminWallet);
    }
    
    // Update wallets object
    setWallets(prev => ({
      ...prev,
      [currentUser?.id || '']: updatedBuyerWallet,
      [sellerWalletCopy.userId]: updatedSellerWallet,
      admin: updatedAdminWallet
    }));
    
    return true;
  };

  // Request a withdrawal (for sellers)
  const requestWithdrawal = (amount: number) => {
    if (!currentUser || currentUser.role !== 'seller') return false;
    
    // Check if seller has enough funds
    if (sellerWallet.balance < amount) return false;
    
    // Create withdrawal request transaction
    const transaction: Transaction = {
      id: Date.now().toString(),
      userId: currentUser.id,
      amount: -amount, // Negative because it's a withdrawal
      type: 'withdrawal_request',
      description: `Withdrawal request for $${amount.toFixed(2)}`,
      createdAt: new Date().toISOString()
    };
    
    // Update seller wallet (pending withdrawal)
    const updatedWallet: Wallet = {
      ...sellerWallet,
      balance: sellerWallet.balance - amount,
      transactions: [transaction, ...sellerWallet.transactions]
    };
    
    setSellerWallet(updatedWallet);
    setWallets(prev => ({ ...prev, [currentUser.id]: updatedWallet }));
    
    return true;
  };

  // Helper function to find seller ID by username
  const getSellerIdByUsername = (username: string): string => {
    // Get users from localStorage
    const storedUsers = localStorage.getItem('users');
    if (!storedUsers) return '';
    
    try {
      const users = JSON.parse(storedUsers);
      const seller = users.find((user: {username: string, role: string, id: string}) => 
        user.username === username && user.role === 'seller'
      );
      
      return seller ? seller.id : '';
    } catch (e) {
      console.error("Error parsing users from localStorage:", e);
      return '';
    }
  };

  // Get total earnings for a seller
  const getSellerEarnings = (sellerId: string) => {
    const wallet = wallets[sellerId];
    if (!wallet) return 0;
    
    return wallet.balance;
  };

  // Get all withdrawal requests
  const getAllWithdrawalRequests = () => {
    const requests: Transaction[] = [];
    
    Object.values(wallets).forEach(wallet => {
      if (wallet && Array.isArray(wallet.transactions)) {
        const withdrawalRequests = wallet.transactions.filter(
          (transaction: Transaction) => transaction.type === 'withdrawal_request'
        );
        requests.push(...withdrawalRequests);
      }
    });
    
    return requests;
  };

  // Approve a withdrawal request
  const approveWithdrawal = (transactionId: string) => {
    // Find the wallet with this transaction
    let foundWallet: Wallet | null = null;
    let userId = '';
    
    Object.entries(wallets).forEach(([id, wallet]) => {
      if (wallet && Array.isArray(wallet.transactions)) {
        const hasTransaction = wallet.transactions.some((t: Transaction) => t.id === transactionId);
        if (hasTransaction) {
          foundWallet = wallet;
          userId = id;
        }
      }
    });
    
    if (!foundWallet || !userId) return;
    
    // Find the transaction
    const transaction = foundWallet.transactions.find((t: Transaction) => t.id === transactionId);
    if (!transaction) return;
    
    // Update the transaction type
    const updatedTransactions = foundWallet.transactions.map((t: Transaction) => 
      t.id === transactionId 
        ? { ...t, type: 'withdrawal_completed' }
        : t
    );
    
    // Update the wallet
    const updatedWallet: Wallet = {
      ...foundWallet,
      transactions: updatedTransactions
    };
    
    // Update wallets state
    setWallets(prev => ({ ...prev, [userId]: updatedWallet }));
    
    // Update current wallet if it's the same user
    if (currentUser && currentUser.id === userId) {
      if (currentUser.role === 'seller') {
        setSellerWallet(updatedWallet);
      }
    }
  };

  // Reject a withdrawal request
  const rejectWithdrawal = (transactionId: string) => {
    // Find the wallet with this transaction
    let foundWallet: Wallet | null = null;
    let userId = '';
    
    Object.entries(wallets).forEach(([id, wallet]) => {
      if (wallet && Array.isArray(wallet.transactions)) {
        const hasTransaction = wallet.transactions.some((t: Transaction) => t.id === transactionId);
        if (hasTransaction) {
          foundWallet = wallet;
          userId = id;
        }
      }
    });
    
    if (!foundWallet || !userId) return;
    
    // Find the transaction
    const transaction = foundWallet.transactions.find((t: Transaction) => t.id === transactionId);
    if (!transaction) return;
    
    // Calculate refund amount (absolute value of the withdrawal amount)
    const refundAmount = Math.abs(transaction.amount);
    
    // Create refund transaction
    const refundTransaction: Transaction = {
      id: Date.now().toString(),
      userId,
      amount: refundAmount, // Positive because it's a refund
      type: 'withdrawal_rejected',
      description: `Rejected withdrawal request of $${refundAmount.toFixed(2)}`,
      createdAt: new Date().toISOString(),
      relatedId: transactionId
    };
    
    // Update the original transaction type
    const updatedTransactions = foundWallet.transactions.map((t: Transaction) => 
      t.id === transactionId 
        ? { ...t, type: 'withdrawal_rejected' }
        : t
    );
    
    // Add the refund transaction
    updatedTransactions.unshift(refundTransaction);
    
    // Update the wallet with refunded balance
    const updatedWallet: Wallet = {
      ...foundWallet,
      balance: foundWallet.balance + refundAmount,
      transactions: updatedTransactions
    };
    
    // Update wallets state
    setWallets(prev => ({ ...prev, [userId]: updatedWallet }));
    
    // Update current wallet if it's the same user
    if (currentUser && currentUser.id === userId) {
      if (currentUser.role === 'seller') {
        setSellerWallet(updatedWallet);
      }
    }
  };

  // Get buyer balance by username
  const getBuyerBalance = (username: string): number => {
    // Get users from localStorage
    const storedUsers = localStorage.getItem('users');
    if (!storedUsers) return 0;
    
    try {
      const users = JSON.parse(storedUsers);
      const buyer = users.find((user: {username: string, role: string, id: string}) => 
        user.username === username && user.role === 'buyer'
      );
      
      if (!buyer) return 0;
      
      const wallet = wallets[buyer.id];
      return wallet ? wallet.balance : 0;
    } catch (e) {
      console.error("Error parsing users from localStorage:", e);
      return 0;
    }
  };

  // Get seller balance by username - Added for Header component
  const getSellerBalance = (username: string): number => {
    // Get users from localStorage
    const storedUsers = localStorage.getItem('users');
    if (!storedUsers) return 0;
    
    try {
      const users = JSON.parse(storedUsers);
      const seller = users.find((user: {username: string, role: string, id: string}) => 
        user.username === username && user.role === 'seller'
      );
      
      if (!seller) return 0;
      
      const wallet = wallets[seller.id];
      return wallet ? wallet.balance : 0;
    } catch (e) {
      console.error("Error parsing users from localStorage:", e);
      return 0;
    }
  };

  return (
    <WalletContext.Provider
      value={{
        buyerWallet,
        sellerWallet,
        adminWallet,
        adminBalance,
        wallets,
        addFundsToBuyerWallet,
        purchaseListing,
        processSale,
        requestWithdrawal,
        getSellerEarnings,
        getAllWithdrawalRequests,
        approveWithdrawal,
        rejectWithdrawal,
        getBuyerBalance,
        getSellerBalance
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};