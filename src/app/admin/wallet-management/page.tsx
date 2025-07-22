// src/app/admin/wallet-management/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
import { Shield, Loader2 } from 'lucide-react';
import { WalletProvider, useWallet } from '@/context/WalletContext';
import { useWebSocket } from '@/context/WebSocketContext';
import { subscribeToWalletUpdates, getWalletBalanceListener } from '@/utils/walletSync';
import { WebSocketEvent } from '@/types/websocket';

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
  const { subscribe, isConnected } = useWebSocket();
  
  // Force re-render hook
  const [, forceUpdate] = useState({});
  const forceRender = useCallback(() => forceUpdate({}), []);
  
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

  // Check if user is admin
  const isAdmin = user && (user.username === 'oakley' || user.username === 'gerome');

  // Subscribe to WebSocket balance updates
  useEffect(() => {
    if (!isConnected) return;

    // Subscribe to wallet balance updates
    const unsubBalance = subscribe(WebSocketEvent.WALLET_BALANCE_UPDATE, (data: any) => {
      console.log('[AdminWallet] Received balance update:', data);
      // Force component re-render when any balance updates
      forceRender();
    });

    // Subscribe to wallet transactions
    const unsubTransaction = subscribe(WebSocketEvent.WALLET_TRANSACTION, (data: any) => {
      console.log('[AdminWallet] Received transaction:', data);
      forceRender();
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
      forceRender();
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
          forceRender();
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
        username,
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
    setAllUsers(sortedUsers);
  }, [listingUsers, wallet, buyerBalances, sellerBalances, user]);

  // Filter users based on search term, role filter, and balance filter
  useEffect(() => {
    let filtered = allUsers;
    
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.username.toLowerCase().includes(searchTerm.toLowerCase())
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
    
    setDisplayedUsers(filtered);
  }, [searchTerm, allUsers, roleFilter, balanceFilter, wallet, buyerBalances, sellerBalances]);

  // Handle user selection
  const handleSelectUser = (username: string, role: string) => {
    setSelectedUser(username);
    setSelectedUserRole(role as 'buyer' | 'seller' | 'admin');
    setSelectedUsers([]);
  };

  // Handle bulk user selection
  const handleBulkSelect = (username: string) => {
    setSelectedUsers(prev => 
      prev.includes(username) 
        ? prev.filter(u => u !== username)
        : [...prev, username]
    );
    setSelectedUser(null);
  };

  // Select all filtered users
  const handleSelectAll = () => {
    if (selectedUsers.length === displayedUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(displayedUsers.map(u => u.username));
    }
  };

  // Show message helper
  const showMessageHelper = (msg: string, type: 'success' | 'error' = 'success') => {
    setMessage(msg);
    setMessageType(type);
    setShowMessage(true);
    setTimeout(() => setShowMessage(false), 4000);
  };

  // Handle the wallet action (credit or debit) with confirmation
  const handleAction = () => {
    if (!selectedUser || !amount || !reason) {
      showMessageHelper('Please fill in all fields', 'error');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      showMessageHelper('Please enter a valid amount', 'error');
      return;
    }

    if (actionType === 'debit' || numAmount > 100) {
      setPendingAction(() => () => executeAction(numAmount));
      setShowConfirmModal(true);
    } else {
      executeAction(numAmount);
    }
  };

  // Execute the wallet action
  const executeAction = async (numAmount: number) => {
    setIsLoading(true);
    
    // Small delay for UI feedback
    await new Promise(resolve => setTimeout(resolve, 500));

    const roleForWallet: 'buyer' | 'seller' = selectedUserRole === 'admin' ? 'buyer' : selectedUserRole as 'buyer' | 'seller';

    let success = false;
    if (actionType === 'credit') {
      success = await adminCreditUser(selectedUser!, roleForWallet, numAmount, reason);
    } else {
      success = await adminDebitUser(selectedUser!, roleForWallet, numAmount, reason);
    }

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
  };

  // Handle bulk actions
  const handleBulkAction = async (action: 'credit' | 'debit', amount: number, reason: string) => {
    setIsBulkLoading(true);
    
    let successCount = 0;
    let failCount = 0;

    for (const username of selectedUsers) {
      const userRole = allUsers.find(u => u.username === username)?.role as 'buyer' | 'seller';
      let success = false;
      
      if (action === 'credit') {
        success = await adminCreditUser(username, userRole, amount, reason);
      } else {
        success = await adminDebitUser(username, userRole, amount, reason);
      }

      if (success) successCount++;
      else failCount++;
    }

    showMessageHelper(
      `Bulk action completed: ${successCount} successful, ${failCount} failed`, 
      failCount > 0 ? 'error' : 'success'
    );

    setSelectedUsers([]);
    setShowBulkModal(false);
    setIsBulkLoading(false);
    
    // Force re-render to show updated balances
    forceRender();
  };

  // Refresh data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    // Call the reloadData function from WalletContext
    if (reloadData) {
      await reloadData();
    }
    
    // Small delay for UI feedback
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setIsRefreshing(false);
    showMessageHelper('Data refreshed successfully');
    forceRender();
  };

  // Export user data to CSV
  const exportUserData = () => {
    const csvData = displayedUsers.map(user => ({
      Username: user.username,
      Role: user.role,
      Balance: getUserBalance(user.username).toFixed(2),
      'Last Activity': 'N/A'
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

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
    setSelectedUser(null);
    setSelectedUsers([]);
    setSearchTerm('');
    setAmount('');
    setReason('');
    setActionType('credit');
  };

  // Get user balance - now checks both buyerBalances and sellerBalances
  const getUserBalance = (username: string) => {
    // Check if user is a buyer or seller
    const user = allUsers.find(u => u.username === username);
    if (user?.role === 'seller') {
      return sellerBalances[username] || 0;
    }
    // Default to buyer balance
    return buyerBalances[username] || wallet[username] || 0;
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

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-[#1a1a1a] p-8 rounded-xl shadow-xl max-w-md w-full border border-gray-800">
          <div className="text-center">
            <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
            <p className="text-gray-400">Only admin accounts can access this page.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white py-10 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <WalletHeader
          totalUsers={allUsers.length}
          onRefresh={handleRefresh}
          onExport={exportUserData}
          isRefreshing={isRefreshing}
        />

        <WalletFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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

        <WalletToast
          message={message}
          type={messageType}
          isVisible={showMessage}
        />
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
