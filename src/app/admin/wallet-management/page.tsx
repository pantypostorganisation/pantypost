// src/app/admin/wallet-management/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useListings } from '@/context/ListingContext';
import RequireAuth from '@/components/RequireAuth';
import WalletHeader from '@/components/admin/wallet/WalletHeader';
import WalletFilters from '@/components/admin/wallet/WalletFilters';
import WalletUserList from '@/components/admin/wallet/WalletUserList';
import WalletActionPanel from '@/components/admin/wallet/WalletActionPanel';
import BulkActionModal from '@/components/admin/wallet/BulkActionModal';
import ConfirmationModal from '@/components/admin/wallet/ConfirmationModal';
import WalletToast from '@/components/admin/wallet/WalletToast';
import AdminMoneyFlow from '@/components/admin/wallet/AdminMoneyFlow';
import { Loader2 } from 'lucide-react';
import { WalletProvider, useWallet } from '@/context/WalletContext';
import { useWebSocket } from '@/context/WebSocketContext';
import { subscribeToWalletUpdates, getWalletBalanceListener } from '@/utils/walletSync';
import { WebSocketEvent } from '@/types/websocket';
import { sanitizeStrict } from '@/utils/security/sanitization';
import { securityService } from '@/services/security.service';

function AdminWalletContent() {
  const { 
    wallet, 
    adminCreditUser, 
    adminDebitUser, 
    adminActions,
    buyerBalances,
    sellerBalances,
    reloadData 
  } = useWallet();
  const { user } = useAuth();
  const { users: listingUsers } = useListings();
  
  // Fix: Handle nullable WebSocket context
  const wsContext = useWebSocket();
  const subscribe = wsContext?.subscribe || (() => () => {});
  const isConnected = wsContext?.isConnected || false;
  
  // Force re-render hook
  const [, forceUpdate] = useState({});
  const forceRender = useCallback(() => forceUpdate({}), []);
  
  // Track component mount status
  const isMountedRef = useRef(true);
  
  // Search and filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'buyer' | 'seller'>('all');
  const [balanceFilter, setBalanceFilter] = useState<'all' | 'positive' | 'zero' | 'negative'>('all');
  
  // User selection and actions
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedUserRole, setSelectedUserRole] = useState<'buyer' | 'seller' | 'admin'>('buyer');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [actionType, setActionType] = useState<'credit' | 'debit'>('credit');
  
  // Bulk operations
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  
  // UI state
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [showMessage, setShowMessage] = useState(false);
  const [allUsers, setAllUsers] = useState<{username: string, role: string}[]>([]);
  const [displayedUsers, setDisplayedUsers] = useState<{username: string, role: string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Modals
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  
  // Advanced features
  const [showBalances, setShowBalances] = useState(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Subscribe to WebSocket balance updates
  useEffect(() => {
    if (!isConnected || !isMountedRef.current) return;

    // Subscribe to wallet balance updates
    const unsubBalance = subscribe(WebSocketEvent.WALLET_BALANCE_UPDATE, (data: any) => {
      console.log('[AdminWallet] Received balance update:', data);
      // Force component re-render when any balance updates
      if (isMountedRef.current) {
        forceRender();
      }
    });

    // Subscribe to wallet transactions
    const unsubTransaction = subscribe(WebSocketEvent.WALLET_TRANSACTION, (data: any) => {
      console.log('[AdminWallet] Received transaction:', data);
      if (isMountedRef.current) {
        forceRender();
      }
    });

    return () => {
      unsubBalance();
      unsubTransaction();
    };
  }, [isConnected, subscribe, forceRender]);

  // Subscribe to custom wallet updates
  useEffect(() => {
    const unsubscribe = subscribeToWalletUpdates((data) => {
      console.log('[AdminWallet] Custom wallet update:', data);
      if (isMountedRef.current) {
        forceRender();
      }
    });

    return unsubscribe;
  }, [forceRender]);

  // Subscribe to real-time balance updates for specific users
  useEffect(() => {
    const balanceListener = getWalletBalanceListener();
    const subscriptions: (() => void)[] = [];

    // Subscribe to balance updates for all displayed users
    displayedUsers.forEach(user => {
      const unsubscribe = balanceListener.subscribe(
        user.username,
        user.role as 'buyer' | 'seller',
        (newBalance) => {
          console.log(`[AdminWallet] Balance updated for ${user.username}: ${newBalance}`);
          if (isMountedRef.current) {
            forceRender();
          }
        }
      );
      subscriptions.push(unsubscribe);
    });

    return () => {
      subscriptions.forEach(unsub => unsub());
    };
  }, [displayedUsers, forceRender]);

  // Load all users - now using combined wallet data
  useEffect(() => {
    if (!isMountedRef.current) return;
    
    console.log('=== LOADING USERS WITH REAL-TIME DATA ===');
    console.log('Buyer balances:', buyerBalances);
    console.log('Seller balances:', sellerBalances);
    console.log('Wallet object:', wallet);
    
    let allUsersMap: {[key: string]: any} = {};
    
    // Add users from ListingContext
    if (listingUsers && Object.keys(listingUsers).length > 0) {
      Object.entries(listingUsers).forEach(([username, userData]) => {
        allUsersMap[username] = userData;
      });
    }
    
    // Add buyers from buyerBalances
    Object.keys(buyerBalances).forEach(username => {
      if (!allUsersMap[username]) {
        allUsersMap[username] = {
          username: username,
          role: 'buyer',
        };
      }
    });
    
    // Add sellers from sellerBalances
    Object.keys(sellerBalances).forEach(username => {
      if (!allUsersMap[username] || allUsersMap[username].role !== 'seller') {
        allUsersMap[username] = {
          username: username,
          role: 'seller',
        };
      }
    });
    
    // Add any remaining users from wallet object
    Object.keys(wallet).forEach(username => {
      if (!allUsersMap[username] && username !== 'admin') {
        allUsersMap[username] = {
          username: username,
          role: 'buyer', // Default to buyer if not specified
        };
      }
    });
    
    // Filter out admin users and convert to array
    const nonAdminUsers = Object.entries(allUsersMap)
      .filter(([username, userData]) => {
        return userData.role !== 'admin' && username !== 'admin';
      })
      .map(([username, userData]) => ({
        username: sanitizeStrict(username),
        role: userData.role || 'buyer'
      }));
    
    // Sort users
    const sortedUsers = nonAdminUsers.sort((a, b) => {
      if (a.role !== b.role) {
        if (a.role === 'buyer' && b.role === 'seller') return -1;
        if (a.role === 'seller' && b.role === 'buyer') return 1;
      }
      return a.username.localeCompare(b.username);
    });
    
    console.log('Final users:', sortedUsers);
    console.log('=== END LOADING ===');
    
    if (isMountedRef.current) {
      setAllUsers(sortedUsers);
    }
  }, [listingUsers, wallet, buyerBalances, sellerBalances, user]);

  // Helper for formatting currency consistently across UI sections
  const formatCurrency = useCallback((amount: number) => {
    const safeAmount = Number.isFinite(amount) ? amount : 0;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(safeAmount);
  }, []);

  // Get user balance - Fixed to handle all possible data formats
  const getUserBalance = (username: string) => {
    // Validate username
    if (!username || typeof username !== 'string') return 0;
    
    // Check if user is a buyer or seller
    const user = allUsers.find(u => u.username === username);
    let balance = 0;
    
    if (user?.role === 'seller') {
      const sellerBalance = sellerBalances[username];
      // Handle case where balance might be an object
      if (typeof sellerBalance === 'number') {
        balance = sellerBalance;
      } else if (sellerBalance && typeof sellerBalance === 'object' && 'balance' in sellerBalance) {
        balance = (sellerBalance as any).balance;
      } else {
        balance = 0;
      }
    } else {
      // Default to buyer balance
      const buyerBalance = buyerBalances[username];
      if (typeof buyerBalance === 'number') {
        balance = buyerBalance;
      } else if (buyerBalance && typeof buyerBalance === 'object' && 'balance' in buyerBalance) {
        balance = (buyerBalance as any).balance;
      } else {
        // Fallback to wallet
        const walletBalance = wallet[username];
        if (typeof walletBalance === 'number') {
          balance = walletBalance;
        } else {
          balance = 0;
        }
      }
    }
    
    // Ensure we always return a valid number
    return isNaN(balance) ? 0 : balance;
  };

  const summaryStats = useMemo(() => {
    const safeUsers = Array.isArray(allUsers) ? allUsers : [];
    let buyerCount = 0;
    let sellerCount = 0;
    let totalBalance = 0;
    let positiveBalance = 0;
    let negativeBalance = 0;
    let zeroBalance = 0;

    safeUsers.forEach(user => {
      if (user.role === 'seller') {
        sellerCount += 1;
      } else {
        buyerCount += 1;
      }

      const balance = getUserBalance(user.username);
      totalBalance += balance;

      if (balance > 0) {
        positiveBalance += 1;
      } else if (balance < 0) {
        negativeBalance += 1;
      } else {
        zeroBalance += 1;
      }
    });

    const totalUsersCount = safeUsers.length;
    const safeDivisor = totalUsersCount > 0 ? totalUsersCount : 1;

    return {
      buyerCount,
      sellerCount,
      totalBalance,
      positiveBalance,
      negativeBalance,
      zeroBalance,
      averageBalance: totalBalance / safeDivisor,
      totalUsersCount,
      positivePercentage: (positiveBalance / safeDivisor) * 100,
      zeroPercentage: (zeroBalance / safeDivisor) * 100,
      negativePercentage: (negativeBalance / safeDivisor) * 100
    };
  }, [allUsers, buyerBalances, sellerBalances, wallet]);

  const selectedUserBalance = useMemo(() => {
    if (!selectedUser) return 0;
    return getUserBalance(selectedUser);
  }, [selectedUser, buyerBalances, sellerBalances, wallet]);

  // Handle search term change with sanitization
  const handleSearchTermChange = (term: string) => {
    const sanitized = securityService.sanitizeSearchQuery(term);
    if (isMountedRef.current) {
      setSearchTerm(sanitized);
    }
  };

  // Filter users based on search term, role filter, and balance filter
  useEffect(() => {
    if (!isMountedRef.current) return;
    
    let filtered = allUsers;
    
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        user.username.toLowerCase().includes(searchLower)
      );
    }

    if (balanceFilter !== 'all') {
      filtered = filtered.filter(user => {
        const balance = getUserBalance(user.username);
        switch (balanceFilter) {
          case 'positive': return balance > 0;
          case 'zero': return balance === 0;
          case 'negative': return balance < 0;
          default: return true;
        }
      });
    }
    
    if (isMountedRef.current) {
      setDisplayedUsers(filtered);
    }
  }, [searchTerm, allUsers, roleFilter, balanceFilter, wallet, buyerBalances, sellerBalances]);

  // Handle user selection
  const handleSelectUser = (username: string, role: string) => {
    if (!isMountedRef.current) return;
    
    const sanitizedUsername = sanitizeStrict(username);
    setSelectedUser(sanitizedUsername);
    setSelectedUserRole(role as 'buyer' | 'seller' | 'admin');
    setSelectedUsers([]);
  };

  // Handle bulk user selection
  const handleBulkSelect = (username: string) => {
    if (!isMountedRef.current) return;
    
    const sanitizedUsername = sanitizeStrict(username);
    setSelectedUsers(prev => 
      prev.includes(sanitizedUsername) 
        ? prev.filter(u => u !== sanitizedUsername)
        : [...prev, sanitizedUsername]
    );
    setSelectedUser(null);
  };

  // Select all filtered users
  const handleSelectAll = () => {
    if (!isMountedRef.current) return;
    
    if (selectedUsers.length === displayedUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(displayedUsers.map(u => u.username));
    }
  };

  // Show message helper
  const showMessageHelper = (msg: string, type: 'success' | 'error' = 'success') => {
    if (!isMountedRef.current) return;
    
    setMessage(msg);
    setMessageType(type);
    setShowMessage(true);
    setTimeout(() => {
      if (isMountedRef.current) {
        setShowMessage(false);
      }
    }, 4000);
  };

  // Validate amount and reason
  const validateAction = (amount: string, reason: string): { valid: boolean; error?: string } => {
    const numAmount = parseFloat(amount);
    
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      return { valid: false, error: 'Please enter a valid amount greater than 0' };
    }
    
    if (numAmount > 10000) {
      return { valid: false, error: 'Amount cannot exceed $10,000' };
    }
    
    if (!reason || reason.trim().length < 3) {
      return { valid: false, error: 'Please provide a reason (minimum 3 characters)' };
    }
    
    if (reason.length > 200) {
      return { valid: false, error: 'Reason cannot exceed 200 characters' };
    }
    
    return { valid: true };
  };

  // Handle the wallet action (credit or debit) with confirmation
  const handleAction = () => {
    if (!selectedUser || !amount || !reason) {
      showMessageHelper('Please fill in all fields', 'error');
      return;
    }

    const validation = validateAction(amount, reason);
    if (!validation.valid) {
      showMessageHelper(validation.error || 'Invalid input', 'error');
      return;
    }

    const numAmount = parseFloat(amount);
    if (actionType === 'debit' || numAmount > 100) {
      setPendingAction(() => () => executeAction(numAmount));
      setShowConfirmModal(true);
    } else {
      executeAction(numAmount);
    }
  };

  // Execute the wallet action
  const executeAction = async (numAmount: number) => {
    if (!isMountedRef.current) return;
    
    setIsLoading(true);
    
    // Small delay for UI feedback
    await new Promise(resolve => setTimeout(resolve, 500));

    const roleForWallet: 'buyer' | 'seller' = selectedUserRole === 'admin' ? 'buyer' : selectedUserRole as 'buyer' | 'seller';
    const sanitizedReason = sanitizeStrict(reason);

    let success = false;
    if (actionType === 'credit') {
      success = await adminCreditUser(selectedUser!, roleForWallet, numAmount, sanitizedReason);
    } else {
      success = await adminDebitUser(selectedUser!, roleForWallet, numAmount, sanitizedReason);
    }

    if (isMountedRef.current) {
      if (success) {
        showMessageHelper(`Successfully ${actionType === 'credit' ? 'credited' : 'debited'} $${numAmount.toFixed(2)} to ${selectedUser}'s account`, 'success');
        setAmount('');
        setReason('');
        
        // Force a re-render to show updated balance immediately
        forceRender();
      } else {
        showMessageHelper(`Failed to ${actionType} account. ${actionType === 'debit' ? 'Check if user has sufficient balance.' : ''}`, 'error');
      }

      setIsLoading(false);
      setShowConfirmModal(false);
      setPendingAction(null);
    }
  };

  // Handle bulk actions with validation
  const handleBulkAction = async (action: 'credit' | 'debit', amount: number, reason: string) => {
    if (!isMountedRef.current) return;
    
    // Validate bulk action
    const validation = validateAction(amount.toString(), reason);
    if (!validation.valid) {
      showMessageHelper(validation.error || 'Invalid input', 'error');
      return;
    }
    
    setIsBulkLoading(true);
    
    let successCount = 0;
    let failCount = 0;
    const sanitizedReason = sanitizeStrict(reason);

    for (const username of selectedUsers) {
      const userRole = allUsers.find(u => u.username === username)?.role as 'buyer' | 'seller';
      let success = false;
      
      if (action === 'credit') {
        success = await adminCreditUser(username, userRole, amount, sanitizedReason);
      } else {
        success = await adminDebitUser(username, userRole, amount, sanitizedReason);
      }

      if (success) successCount++;
      else failCount++;
    }

    if (isMountedRef.current) {
      showMessageHelper(
        `Bulk action completed: ${successCount} successful, ${failCount} failed`, 
        failCount > 0 ? 'error' : 'success'
      );

      setSelectedUsers([]);
      setShowBulkModal(false);
      setIsBulkLoading(false);
      
      // Force re-render to show updated balances
      forceRender();
    }
  };

  // Refresh data
  const handleRefresh = async () => {
    if (!isMountedRef.current) return;
    
    setIsRefreshing(true);
    
    // Call the reloadData function from WalletContext
    if (reloadData) {
      await reloadData();
    }
    
    // Small delay for UI feedback
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (isMountedRef.current) {
      setIsRefreshing(false);
      showMessageHelper('Data refreshed successfully');
      forceRender();
    }
  };

  // Export user data to CSV
  const exportUserData = () => {
    if (!displayedUsers || displayedUsers.length === 0) {
      showMessageHelper('No users to export');
      return;
    }

    const csvData = displayedUsers.map(user => ({
      Username: sanitizeStrict(user.username),
      Role: user.role,
      Balance: getUserBalance(user.username).toFixed(2),
      'Last Activity': 'N/A'
    }));

    const headers = Object.keys(csvData[0]);
    const rows = csvData.map(row =>
      headers
        .map(h => `"${String((row as any)[h]).replace(/"/g, '""')}"`)
        .join(',')
    );
    const csvContent = [headers.join(','), ...rows].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `user_data_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    showMessageHelper('User data exported successfully');
  };

  // Clear selection
  const clearSelection = () => {
    if (!isMountedRef.current) return;
    
    setSelectedUser(null);
    setSelectedUsers([]);
    setSearchTerm('');
    setAmount('');
    setReason('');
    setActionType('credit');
  };

  // Get role badge color
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'buyer': return 'bg-blue-600/20 text-blue-400 border-blue-600/30';
      case 'seller': return 'bg-green-600/20 text-green-400 border-green-600/30';
      default: return 'bg-gray-600/20 text-gray-400 border-gray-600/30';
    }
  };

  // Get balance color
  const getBalanceColor = (balance: number) => {
    if (balance > 0) return 'text-green-400';
    if (balance < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  // Format role display
  const formatRole = (role: string) => {
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] text-white">
      <div className="relative z-10 px-4 py-12 sm:px-6 lg:px-10">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-10">
          <section className="space-y-6">
            <WalletHeader
              totalUsers={summaryStats.totalUsersCount}
              onRefresh={handleRefresh}
              onExport={exportUserData}
              isRefreshing={isRefreshing}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/5 p-5 backdrop-blur-xl shadow-[0_20px_45px_rgba(0,0,0,0.45)]">
                <div className="relative flex flex-col gap-3">
                  <span className="text-sm text-gray-400">Platform Balance</span>
                  <span className="text-3xl font-semibold text-white">{formatCurrency(summaryStats.totalBalance)}</span>
                  <span className="text-xs text-gray-500">Across {summaryStats.totalUsersCount} wallets</span>
                </div>
              </div>

              <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/5 p-5 backdrop-blur-xl shadow-[0_20px_45px_rgba(0,0,0,0.45)]">
                <div className="relative flex flex-col gap-3">
                  <span className="text-sm text-gray-400">Average Wallet</span>
                  <span className="text-3xl font-semibold text-white">{formatCurrency(summaryStats.averageBalance)}</span>
                  <span className="text-xs text-gray-500">Buyers • Sellers combined</span>
                </div>
              </div>

              <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/5 p-5 backdrop-blur-xl shadow-[0_20px_45px_rgba(0,0,0,0.45)]">
                <div className="relative space-y-3">
                  <span className="text-sm text-gray-400">Active Accounts</span>
                  <div className="flex items-center justify-between text-white">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-400">Buyers</p>
                      <p className="text-2xl font-semibold">{summaryStats.buyerCount}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-wide text-gray-400">Sellers</p>
                      <p className="text-2xl font-semibold">{summaryStats.sellerCount}</p>
                    </div>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#ff950e] via-[#ff6b00] to-purple-500"
                      style={{ width: `${summaryStats.totalUsersCount > 0 ? (summaryStats.buyerCount / summaryStats.totalUsersCount) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/5 p-5 backdrop-blur-xl shadow-[0_20px_45px_rgba(0,0,0,0.45)]">
                <div className="relative space-y-3">
                  <span className="text-sm text-gray-400">Balance Health</span>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between text-green-400">
                      <span>Positive</span>
                      <span>{summaryStats.positiveBalance}</span>
                    </div>
                    <div className="flex items-center justify-between text-gray-300">
                      <span>Neutral</span>
                      <span>{summaryStats.zeroBalance}</span>
                    </div>
                    <div className="flex items-center justify-between text-red-400">
                      <span>Negative</span>
                      <span>{summaryStats.negativeBalance}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 via-green-400 to-emerald-500"
                        style={{ width: `${Math.min(summaryStats.positivePercentage, 100)}%` }}
                      />
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full bg-gradient-to-r from-gray-500 via-gray-400 to-gray-200"
                        style={{ width: `${Math.min(summaryStats.zeroPercentage, 100)}%` }}
                      />
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full bg-gradient-to-r from-red-500 via-red-400 to-rose-500"
                        style={{ width: `${Math.min(summaryStats.negativePercentage, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <AdminMoneyFlow />

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="space-y-6 xl:col-span-2">
              <div className="rounded-2xl border border-white/5 bg-black/40 p-6 backdrop-blur-xl shadow-[0_20px_45px_rgba(0,0,0,0.45)]">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-white">Wallet Explorer</h2>
                    <p className="text-sm text-gray-400">Slice and dice the user base to surface accounts worth reviewing.</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="rounded-full border border-white/10 px-3 py-1 text-gray-300">
                      {displayedUsers.length} shown
                    </span>
                    <span className="rounded-full border border-[#ff950e]/40 bg-[#ff950e]/10 px-3 py-1 text-[#ffb347]">
                      {selectedUsers.length} selected
                    </span>
                  </div>
                </div>
                <div className="mt-6">
                  <WalletFilters
                    searchTerm={searchTerm}
                    setSearchTerm={handleSearchTermChange}
                    roleFilter={roleFilter}
                    setRoleFilter={setRoleFilter}
                    balanceFilter={balanceFilter}
                    setBalanceFilter={setBalanceFilter}
                    showBalances={showBalances}
                    setShowBalances={setShowBalances}
                    selectedUsers={selectedUsers}
                    setSelectedUsers={setSelectedUsers}
                    displayedUsers={displayedUsers}
                    handleSelectAll={handleSelectAll}
                    setShowBulkModal={setShowBulkModal}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-white/5 bg-black/40 p-1 backdrop-blur-xl shadow-[0_20px_45px_rgba(0,0,0,0.45)]">
                <WalletUserList
                  displayedUsers={displayedUsers}
                  selectedUsers={selectedUsers}
                  selectedUser={selectedUser}
                  showBalances={showBalances}
                  handleSelectUser={handleSelectUser}
                  handleBulkSelect={handleBulkSelect}
                  getUserBalance={getUserBalance}
                  getRoleBadgeColor={getRoleBadgeColor}
                  getBalanceColor={getBalanceColor}
                  formatRole={formatRole}
                />
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border border-white/5 bg-black/40 p-6 backdrop-blur-xl shadow-[0_20px_45px_rgba(0,0,0,0.45)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-white">Selection Insights</h2>
                    <p className="text-sm text-gray-400">Quick snapshot of the account you're about to adjust.</p>
                  </div>
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-gray-300">
                    {selectedUser ? 'Live' : 'Awaiting selection'}
                  </span>
                </div>
                {selectedUser ? (
                  <div className="mt-6 space-y-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm text-gray-400">Username</span>
                      <span className="text-lg font-medium text-white">{selectedUser}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm text-gray-400">Role</span>
                      <span className={`w-fit rounded-full border px-3 py-1 text-xs ${getRoleBadgeColor(selectedUserRole)}`}>
                        {formatRole(selectedUserRole)}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm text-gray-400">Current Balance</span>
                      <span className={`text-2xl font-semibold ${getBalanceColor(selectedUserBalance)}`}>
                        {formatCurrency(selectedUserBalance)}
                      </span>
                    </div>
                    <div className="rounded-xl border border-white/5 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-wide text-gray-400">Bulk Selection</p>
                      <p className="mt-2 text-sm text-gray-300">{selectedUsers.length} accounts queued for batch actions.</p>
                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#ff950e] via-[#ff6b00] to-purple-500"
                          style={{ width: `${Math.min((selectedUsers.length / Math.max(displayedUsers.length || 1, 1)) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 rounded-xl border border-dashed border-white/10 p-8 text-center text-gray-400">
                    Choose a user from the table to preview their wallet metrics and begin an action.
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-white/5 bg-black/40 p-1 backdrop-blur-xl shadow-[0_20px_45px_rgba(0,0,0,0.45)]">
                <WalletActionPanel
                  selectedUser={selectedUser}
                  selectedUserRole={selectedUserRole}
                  actionType={actionType}
                  setActionType={setActionType}
                  amount={amount}
                  setAmount={setAmount}
                  reason={reason}
                  setReason={setReason}
                  isLoading={isLoading}
                  handleAction={handleAction}
                  clearSelection={clearSelection}
                  getUserBalance={getUserBalance}
                  getRoleBadgeColor={getRoleBadgeColor}
                  getBalanceColor={getBalanceColor}
                  formatRole={formatRole}
                />
              </div>
            </div>
          </div>

          <WalletToast
            message={message}
            type={messageType}
            isVisible={showMessage}
          />
        </div>
      </div>

      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setPendingAction(null);
        }}
        onConfirm={() => pendingAction && pendingAction()}
        title={`Confirm ${actionType === 'credit' ? 'Credit' : 'Debit'}`}
        message={`Are you sure you want to ${actionType} $${amount} ${actionType === 'credit' ? 'to' : 'from'} ${selectedUser}'s account?`}
        type={actionType === 'debit' ? 'danger' : 'warning'}
        isLoading={isLoading}
      />

      <BulkActionModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        selectedUsers={selectedUsers}
        onAction={handleBulkAction}
        isLoading={isBulkLoading}
      />
    </main>
  );
}

// Wrap the component with WalletProvider to ensure it's available
export default function AdminWalletManagementPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <RequireAuth role="admin">
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
          <div className="text-center">
            <Loader2 className="h-8 w-8 text-[#ff950e] animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading wallet management...</p>
          </div>
        </div>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth role="admin">
      <WalletProvider>
        <AdminWalletContent />
      </WalletProvider>
    </RequireAuth>
  );
}
