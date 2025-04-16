'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';

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

type Withdrawal = {
  amount: number;
  date: string;
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
  sellerWithdrawals: { [username: string]: Withdrawal[] };
  adminWithdrawals: Withdrawal[];
  addSellerWithdrawal: (username: string, amount: number) => void;
  addAdminWithdrawal: (amount: number) => void;
};

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [buyerBalance, setBuyerBalanceState] = useState<number>(100);
  const [adminBalance, setAdminBalanceState] = useState<number>(0);
  const [sellerBalances, setSellerBalancesState] = useState<{ [username: string]: number }>({});
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);
  const [sellerWithdrawals, setSellerWithdrawals] = useState<{ [username: string]: Withdrawal[] }>({});
  const [adminWithdrawals, setAdminWithdrawals] = useState<Withdrawal[]>([]);

  // --- LocalStorage: Load ---
  useEffect(() => {
    const buyer = localStorage.getItem('wallet_buyer');
    const admin = localStorage.getItem('wallet_admin');
    const sellers = localStorage.getItem('wallet_sellers');
    const orders = localStorage.getItem('wallet_orders');
    const sellerWds = localStorage.getItem('wallet_sellerWithdrawals');
    const adminWds = localStorage.getItem('wallet_adminWithdrawals');

    if (buyer) setBuyerBalanceState(parseFloat(buyer));
    if (admin) setAdminBalanceState(parseFloat(admin));
    if (sellers) setSellerBalancesState(JSON.parse(sellers));
    if (orders) setOrderHistory(JSON.parse(orders));
    if (sellerWds) setSellerWithdrawals(JSON.parse(sellerWds));
    if (adminWds) setAdminWithdrawals(JSON.parse(adminWds));
  }, []);

  // --- LocalStorage: Save ---
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

  useEffect(() => {
    localStorage.setItem('wallet_sellerWithdrawals', JSON.stringify(sellerWithdrawals));
  }, [sellerWithdrawals]);

  useEffect(() => {
    localStorage.setItem('wallet_adminWithdrawals', JSON.stringify(adminWithdrawals));
  }, [adminWithdrawals]);

  // --- Core Methods ---
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

  const addOrder = (order: Order) => {
    setOrderHistory((prev) => [...prev, order]);
  };

  const purchaseListing = (listing: Order): boolean => {
    const price = listing.markedUpPrice ?? listing.price;
    const seller = listing.seller;
    const sellerCut = listing.price * 0.9;
    const platformCut = price - sellerCut;

    if (buyerBalance < price) {
      return false;
    }

    // 💸 Deduct buyer
    setBuyerBalanceState((prev) => prev - price);

    // 💼 Pay seller
    setSellerBalancesState((prev) => ({
      ...prev,
      [seller]: (prev[seller] || 0) + sellerCut,
    }));

    // 🏦 Pay admin
    setAdminBalanceState((prev) => prev + platformCut);

    // 🧾 Save order
    addOrder({
      ...listing,
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
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

