// src/app/admin/wallet-management/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
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

function AdminWalletContent() {
  const { wallet, adminCreditUser, adminDebitUser, adminActions } = useWallet();
  const { user } = useAuth();
  const { users: listingUsers } = useListings();
  
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

  // Load all users on component mount and when users object changes
  useEffect(() => {
    console.log('=== DEBUGGING USER LOADING ===');
    console.log('ListingContext users:', listingUsers);
    console.log('Wallet context keys:', Object.keys(wallet));
    console.log('Current user from auth:', user);
    
    const walletUsernames = Object.keys(wallet);
    console.log('Users found in wallet:', walletUsernames);
    
    let allUsers: {[key: string]: any} = {};
    
    if (listingUsers && Object.keys(listingUsers).length > 0) {
      Object.entries(listingUsers).forEach(([username, userData]) => {
        allUsers[username] = userData;
      });
    }
    
    walletUsernames.forEach(username => {
      if (!allUsers[username]) {
        allUsers[username] = {
          username: username,
          role: 'buyer',
        };
      }
    });
    
    console.log('Combined users object:', allUsers);
    
    if (allUsers && Object.keys(allUsers).length > 0) {
      const allUserEntries = Object.entries(allUsers);
      console.log('All user entries before filtering:', allUserEntries);
      
      allUserEntries.forEach(([username, userData]) => {
        console.log(`USER: ${username}`, {
          userData,
          role: userData.role,
          type: typeof userData.role,
          hasRole: 'role' in userData
        });
      });
      
      const nonAdminUsers = allUserEntries
        .filter(([username, userData]) => {
          const isBuyer = userData.role === 'buyer';
          const isSeller = userData.role === 'seller';
          const isAdmin = userData.role === 'admin';
          
          console.log(`Filtering ${username}:`, {
            role: userData.role,
            isBuyer,
            isSeller,
            isAdmin,
            willInclude: !isAdmin && (isBuyer || isSeller)
          });
          
          return !isAdmin && (isBuyer || isSeller);
        })
        .map(([username, userData]) => ({
          username,
          role: userData.role
        }));
      
      console.log('Final non-admin users after filtering:', nonAdminUsers);
      console.log('Buyers found:', nonAdminUsers.filter(u => u.role === 'buyer'));
      console.log('Sellers found:', nonAdminUsers.filter(u => u.role === 'seller'));
      
      const sortedUsers = nonAdminUsers.sort((a, b) => {
        if (a.role !== b.role) {
          if (a.role === 'buyer' && b.role === 'seller') return -1;
          if (a.role === 'seller' && b.role === 'buyer') return 1;
        }
        return a.username.localeCompare(b.username);
      });
      
      console.log('Final sorted users sent to state:', sortedUsers);
      console.log('=== END DEBUGGING ===');
      setAllUsers(sortedUsers);
    } else {
      console.log('No users found in any context');
    }
  }, [listingUsers, wallet, user]);

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
  }, [searchTerm, allUsers, roleFilter, balanceFilter, wallet]);

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
    
    await new Promise(resolve => setTimeout(resolve, 1000));

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
    
    await new Promise(resolve => setTimeout(resolve, 2000));

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
  };

  // Refresh data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsRefreshing(false);
    showMessageHelper('Data refreshed successfully');
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

  // Get user balance
  const getUserBalance = (username: string) => {
    return wallet[username] || 0;
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
