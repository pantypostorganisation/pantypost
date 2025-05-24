'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@/context/WalletContext';
import { useListings } from '@/context/ListingContext';
import RequireAuth from '@/components/RequireAuth';
import { 
  DollarSign, 
  Search, 
  ArrowUpRight, 
  ArrowDownRight,
  Users,
  CheckCircle,
  XCircle,
  Info,
  Crown,
  Wallet,
  TrendingUp,
  TrendingDown,
  Clock,
  Shield
} from 'lucide-react';

export default function AdminWalletManagementPage() {
  const { wallet, adminCreditUser, adminDebitUser, adminActions } = useWallet();
  const { users, user } = useListings();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedUserRole, setSelectedUserRole] = useState<'buyer' | 'seller' | 'admin'>('buyer');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [actionType, setActionType] = useState<'credit' | 'debit'>('credit');
  const [message, setMessage] = useState('');
  const [showMessage, setShowMessage] = useState(false);
  const [allUsers, setAllUsers] = useState<{username: string, role: string}[]>([]);
  const [displayedUsers, setDisplayedUsers] = useState<{username: string, role: string}[]>([]);
  const [roleFilter, setRoleFilter] = useState<'all' | 'buyer' | 'seller'>('all');

  // Check if user is admin
  const isAdmin = !!user && (user.username === 'oakley' || user.username === 'gerome');

  // Load all users on component mount and when users object changes
  useEffect(() => {
    if (users && Object.keys(users).length > 0) {
      const nonAdminUsers = Object.entries(users)
        .filter(([_, userData]) => userData.role !== 'admin')
        .map(([username, userData]) => ({
          username,
          role: userData.role
        }));
      
      // Sort buyers first (alphabetically), then sellers (alphabetically)
      const sortedUsers = nonAdminUsers.sort((a, b) => {
        // If roles are different, buyers come first
        if (a.role !== b.role) {
          if (a.role === 'buyer' && b.role === 'seller') return -1;
          if (a.role === 'seller' && b.role === 'buyer') return 1;
        }
        // If roles are the same, sort alphabetically by username
        return a.username.localeCompare(b.username);
      });
      
      setAllUsers(sortedUsers);
      setDisplayedUsers(sortedUsers);
    }
  }, [users]);

  // Filter users based on search term and role filter
  useEffect(() => {
    let filtered = allUsers;
    
    // Apply role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.username.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setDisplayedUsers(filtered);
  }, [searchTerm, allUsers, roleFilter]);

  // Handle user selection
  const handleSelectUser = (username: string, role: string) => {
    setSelectedUser(username);
    setSelectedUserRole(role as 'buyer' | 'seller' | 'admin');
  };

  // Handle the wallet action (credit or debit)
  const handleAction = () => {
    if (!selectedUser || !amount || !reason) {
      setMessage('Please fill in all fields');
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 3000);
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setMessage('Please enter a valid amount');
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 3000);
      return;
    }

    const roleForWallet: 'buyer' | 'seller' = selectedUserRole === 'admin' ? 'buyer' : selectedUserRole as 'buyer' | 'seller';

    let success = false;
    if (actionType === 'credit') {
      success = adminCreditUser(selectedUser, roleForWallet, numAmount, reason);
    } else {
      success = adminDebitUser(selectedUser, roleForWallet, numAmount, reason);
    }

    if (success) {
      setMessage(`Successfully ${actionType === 'credit' ? 'credited' : 'debited'} ${selectedUser}'s account`);
      setAmount('');
      setReason('');
    } else {
      setMessage(`Failed to ${actionType} account. ${actionType === 'debit' ? 'Check if user has sufficient balance.' : ''}`);
    }

    setShowMessage(true);
    setTimeout(() => setShowMessage(false), 3000);
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedUser(null);
    setSearchTerm('');
    setAmount('');
    setReason('');
    setActionType('credit');
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format role display
  const formatRole = (role: string) => {
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  // Get user balance
  const getUserBalance = (username: string) => {
    return wallet[username] || 0;
  };

  if (!isAdmin) {
    return (
      <RequireAuth role="admin">
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] p-8 rounded-xl shadow-xl max-w-md w-full border border-gray-800">
            <div className="text-center">
              <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
              <p className="text-gray-400">Only admin accounts can access this page.</p>
            </div>
          </div>
        </div>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth role="admin">
      <main className="min-h-screen bg-black text-white py-10 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-[#ff950e] flex items-center gap-3">
                <Wallet className="h-8 w-8" />
                Wallet Management
              </h1>
              <p className="text-gray-400 mt-1">Manage user wallet balances and view transaction history</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-[#1a1a1a] px-4 py-2 rounded-lg border border-gray-800 flex items-center gap-2">
                <Crown className="h-5 w-5 text-[#ff950e]" />
                <span className="text-sm font-medium text-white">Admin Panel</span>
              </div>
              <div className="bg-[#1a1a1a] px-4 py-2 rounded-lg border border-gray-800 flex items-center gap-2">
                <Users className="h-5 w-5 text-[#ff950e]" />
                <span className="text-sm font-medium text-white">{allUsers.length} Users</span>
              </div>
            </div>
          </div>

          {/* User search and action panel */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
            {/* Search and Management Section */}
            <div className="md:col-span-1 bg-[#1a1a1a] p-6 rounded-xl border border-gray-800 shadow-lg">
              <h2 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
                <Search className="h-5 w-5 text-[#ff950e]" />
                Find User
              </h2>
              
              {/* Search input */}
              <div className="relative mb-6">
                <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by username..."
                  className="w-full py-2 pl-10 pr-4 rounded-lg bg-[#252525] border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-[#ff950e] focus:ring-1 focus:ring-[#ff950e] transition-colors"
                />
              </div>

              {/* Role Filter */}
              <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-2">Filter by Role</label>
                <div className="flex space-x-2">
                  {[
                    { value: 'all', label: 'All', icon: Users },
                    { value: 'buyer', label: 'Buyers', icon: '👤' },
                    { value: 'seller', label: 'Sellers', icon: '🏪' }
                  ].map((filter) => (
                    <button
                      key={filter.value}
                      onClick={() => setRoleFilter(filter.value as any)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        roleFilter === filter.value
                          ? 'bg-[#ff950e] text-black shadow-lg transform scale-105'
                          : 'bg-[#252525] text-gray-300 hover:bg-[#333] border border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      {typeof filter.icon === 'string' ? (
                        <span className="text-base">{filter.icon}</span>
                      ) : (
                        <filter.icon className="h-4 w-4" />
                      )}
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Display available users */}
              {!selectedUser ? (
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm text-gray-400">
                      {displayedUsers.length} {displayedUsers.length === 1 ? 'user' : 'users'} 
                      {searchTerm && ` matching "${searchTerm}"`}
                    </p>
                    
                    {(searchTerm || roleFilter !== 'all') && (
                      <button 
                        onClick={() => {
                          setSearchTerm('');
                          setRoleFilter('all');
                        }}
                        className="text-xs text-[#ff950e] hover:text-[#ffb04e] transition-colors"
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                  
                  <div className="border border-gray-800 rounded-lg overflow-hidden max-h-80 overflow-y-auto">
                    {displayedUsers.length > 0 ? (
                      displayedUsers.map((userItem, index) => {
                        const balance = getUserBalance(userItem.username);
                        const isLowBalance = balance < 10;
                        
                        return (
                          <div
                            key={userItem.username}
                            onClick={() => handleSelectUser(userItem.username, userItem.role)}
                            className={`p-3 hover:bg-[#333] cursor-pointer flex justify-between items-center transition-all hover:scale-[1.02] group ${
                              index !== displayedUsers.length - 1 ? 'border-b border-gray-800' : ''
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all group-hover:scale-110 ${
                                userItem.role === 'buyer' 
                                  ? 'bg-blue-900/50 border border-blue-600' 
                                  : 'bg-green-900/50 border border-green-600'
                              }`}>
                                {userItem.role === 'buyer' ? '👤' : '🏪'}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-white">{userItem.username}</span>
                                  {isLowBalance && (
                                    <span className="text-xs bg-yellow-900/50 text-yellow-400 px-2 py-0.5 rounded-full border border-yellow-600/50">
                                      Low Balance
                                    </span>
                                  )}
                                </div>
                                <p className={`text-sm font-mono ${
                                  balance > 50 ? 'text-green-400' : 
                                  balance > 10 ? 'text-yellow-400' : 'text-red-400'
                                }`}>
                                  ${balance.toFixed(2)}
                                </p>
                              </div>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded font-medium ${
                              userItem.role === 'buyer' 
                                ? 'bg-blue-600 text-white'
                                : 'bg-green-600 text-white'
                            }`}>
                              {formatRole(userItem.role)}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        <Users className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                        <p>No users found matching your search</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="p-4 bg-gradient-to-r from-[#252525] to-[#1a1a1a] rounded-lg border border-gray-700 mb-6 relative overflow-hidden">
                    {/* Background pattern */}
                    <div className="absolute inset-0 opacity-5">
                      <div className="h-full w-full bg-gradient-to-br from-[#ff950e] to-transparent"></div>
                    </div>
                    
                    <div className="relative z-10">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            selectedUserRole === 'buyer' 
                              ? 'bg-blue-900/50 border border-blue-600' 
                              : 'bg-green-900/50 border border-green-600'
                          }`}>
                            {selectedUserRole === 'buyer' ? '👤' : '🏪'}
                          </div>
                          <div>
                            <span className="font-bold text-xl text-white">{selectedUser}</span>
                            <span className={`ml-3 text-xs px-2 py-1 rounded font-medium ${
                              selectedUserRole === 'buyer' 
                                ? 'bg-blue-600 text-white'
                                : 'bg-green-600 text-white'
                            }`}>
                              {formatRole(selectedUserRole)}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={clearSelection}
                          className="text-gray-400 hover:text-red-400 transition-colors p-1 hover:bg-red-900/20 rounded"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-6 w-6 text-[#ff950e]" />
                        <span className="text-2xl font-bold text-[#ff950e]">
                          ${(wallet[selectedUser] || 0).toFixed(2)}
                        </span>
                        {(wallet[selectedUser] || 0) < 10 && (
                          <span className="text-xs bg-yellow-900/50 text-yellow-400 px-2 py-1 rounded-full border border-yellow-600/50">
                            Low Balance
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Action type selector */}
                  <div className="mb-4">
                    <label className="block text-sm text-gray-400 mb-1">Action Type</label>
                    <div className="flex border border-gray-700 rounded-lg overflow-hidden">
                      <button
                        className={`flex-1 py-2 flex items-center justify-center gap-1 transition-colors ${
                          actionType === 'credit'
                            ? 'bg-green-800 text-white'
                            : 'bg-[#252525] text-gray-300 hover:bg-[#333]'
                        }`}
                        onClick={() => setActionType('credit')}
                      >
                        <ArrowUpRight size={16} />
                        Credit
                      </button>
                      <button
                        className={`flex-1 py-2 flex items-center justify-center gap-1 transition-colors ${
                          actionType === 'debit'
                            ? 'bg-red-800 text-white'
                            : 'bg-[#252525] text-gray-300 hover:bg-[#333]'
                        }`}
                        onClick={() => setActionType('debit')}
                      >
                        <ArrowDownRight size={16} />
                        Debit
                      </button>
                    </div>
                  </div>
                  
                  {/* Amount input */}
                  <div className="mb-4">
                    <label className="block text-sm text-gray-400 mb-1">Amount</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 text-gray-400" size={16} />
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full py-2 pl-10 pr-4 rounded-lg bg-[#252525] border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-[#ff950e] focus:ring-1 focus:ring-[#ff950e] transition-colors"
                      />
                    </div>
                  </div>
                  
                  {/* Reason input */}
                  <div className="mb-6">
                    <label className="block text-sm text-gray-400 mb-1">Reason</label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Enter reason for this transaction..."
                      rows={3}
                      className="w-full p-3 rounded-lg bg-[#252525] border border-gray-700 text-white placeholder-gray-500 resize-none focus:outline-none focus:border-[#ff950e] focus:ring-1 focus:ring-[#ff950e] transition-colors"
                    ></textarea>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="space-y-3">
                    <button
                      onClick={handleAction}
                      className={`w-full py-3 rounded-lg font-bold transition-colors ${
                        actionType === 'credit'
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-red-600 hover:bg-red-700 text-white'
                      }`}
                    >
                      {actionType === 'credit' ? 'Add Funds' : 'Remove Funds'}
                    </button>
                    
                    <button 
                      onClick={clearSelection}
                      className="w-full py-2 rounded-lg font-medium bg-[#333] hover:bg-[#444] transition-colors text-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Transaction History Section */}
            <div className="md:col-span-2 bg-[#1a1a1a] p-6 rounded-xl border border-gray-800 shadow-lg overflow-hidden">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Clock className="h-5 w-5 text-[#ff950e]" />
                  Admin Actions History
                </h2>
                {adminActions.length > 0 && (
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Credits: {adminActions.filter(a => a.type === 'credit').length}
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      Debits: {adminActions.filter(a => a.type === 'debit').length}
                    </span>
                  </div>
                )}
              </div>
              
              {adminActions.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <Info className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>No admin actions have been recorded yet.</p>
                </div>
              ) : (
                <div className="overflow-auto max-h-[500px]">
                  <table className="w-full text-sm">
                    <thead className="bg-[#252525] text-gray-400">
                      <tr>
                        <th className="py-3 px-4 text-left">Date</th>
                        <th className="py-3 px-4 text-left">Admin</th>
                        <th className="py-3 px-4 text-left">User</th>
                        <th className="py-3 px-4 text-left">Role</th>
                        <th className="py-3 px-4 text-right">Amount</th>
                        <th className="py-3 px-4 text-left">Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminActions
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((action, index) => (
                          <tr 
                            key={index} 
                            className={`border-b border-gray-800 hover:bg-[#252525] transition-colors ${
                              index % 2 === 0 ? 'bg-[#1f1f1f]' : ''
                            }`}
                          >
                            <td className="py-3 px-4 text-white">{formatDate(action.date)}</td>
                            <td className="py-3 px-4 text-white">{action.adminUser}</td>
                            <td className="py-3 px-4 text-white">{action.username}</td>
                            <td className="py-3 px-4 text-white">{formatRole(action.role)}</td>
                            <td className={`py-3 px-4 text-right font-mono ${
                              action.type === 'credit' ? 'text-green-500' : 'text-red-500'
                            }`}>
                              {action.type === 'credit' ? '+' : '-'}${action.amount.toFixed(2)}
                            </td>
                            <td className="py-3 px-4 truncate max-w-[200px] text-gray-300" title={action.reason}>
                              {action.reason}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
          
          {/* Message toast */}
          {showMessage && (
            <div className="fixed bottom-6 right-6 bg-[#252525] border border-gray-700 px-6 py-3 rounded-lg shadow-lg max-w-md z-50">
              <div className="flex items-center">
                {message.includes('Successfully') ? (
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500 mr-2" />
                )}
                <p className="text-sm text-white">{message}</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </RequireAuth>
  );
}
