'use client';

import { useState, useEffect } from 'react';
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
  Info
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

  // Check if user is admin
  const isAdmin = !!user && (user.username === 'oakley' || user.username === 'gerome');

  // Load all users on component mount and when users object changes
  useEffect(() => {
    if (users && Object.keys(users).length > 0) {
      // Get all users excluding admins
      const nonAdminUsers = Object.entries(users)
        .filter(([_, userData]) => userData.role !== 'admin');
      
      // Get all buyers, sort alphabetically
      const buyers = nonAdminUsers
        .filter(([_, userData]) => userData.role === 'buyer')
        .map(([username, userData]) => ({
          username,
          role: userData.role
        }))
        .sort((a, b) => a.username.localeCompare(b.username));
      
      // Get all sellers, sort alphabetically
      const sellers = nonAdminUsers
        .filter(([_, userData]) => userData.role === 'seller')
        .map(([username, userData]) => ({
          username,
          role: userData.role
        }))
        .sort((a, b) => a.username.localeCompare(b.username));
      
      // Combine: all buyers first, then all sellers
      const sortedUsers = [...buyers, ...sellers];
      
      setAllUsers(sortedUsers);
      setDisplayedUsers(sortedUsers);
    }
  }, [users]);

  // Filter users based on search term
  useEffect(() => {
    if (!searchTerm) {
      setDisplayedUsers(allUsers);
    } else {
      const filtered = allUsers.filter(user => 
        user.username.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setDisplayedUsers(filtered);
    }
  }, [searchTerm, allUsers]);

  // Handle user selection
  const handleSelectUser = (username: string, role: string) => {
    setSelectedUser(username);
    setSelectedUserRole(role as 'buyer' | 'seller' | 'admin');
    setSearchTerm(username);
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

    // Convert 'admin' role to 'buyer' when passing to the admin functions
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

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Format role display
  const formatRole = (role: string) => {
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  if (!isAdmin) {
    return (
      <RequireAuth role="admin">
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="bg-[#1a1a1a] p-8 rounded-xl shadow-xl max-w-md w-full">
            <h1 className="text-2xl font-bold text-[#ff950e] mb-4">Access Denied</h1>
            <p className="text-white">Only admin accounts can access this page.</p>
          </div>
        </div>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth role="admin">
      <main className="min-h-screen bg-black text-white py-10 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-[#ff950e]">Wallet Management</h1>
              <p className="text-gray-400 mt-1">Manage user wallet balances</p>
            </div>
            <div className="bg-[#1a1a1a] p-2 rounded-lg">
              <Users className="h-6 w-6 text-[#ff950e]" />
            </div>
          </div>

          {/* User search and action panel */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
            {/* Search and Management Section */}
            <div className="md:col-span-1 bg-[#1a1a1a] p-6 rounded-xl border border-gray-800 shadow-lg">
              <h2 className="text-xl font-bold mb-4">Find User</h2>
              
              {/* Search input */}
              <div className="relative mb-6">
                <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by username..."
                  className="w-full py-2 pl-10 pr-4 rounded-lg bg-[#252525] border border-gray-700 text-white"
                />
              </div>
              
              {/* Display available users */}
              {!selectedUser ? (
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm text-gray-400">
                      {displayedUsers.length} {displayedUsers.length === 1 ? 'user' : 'users'} 
                      {searchTerm && ` matching "${searchTerm}"`}
                    </p>
                    
                    {searchTerm && (
                      <button 
                        onClick={() => setSearchTerm('')}
                        className="text-xs text-[#ff950e] hover:text-[#ffb04e]"
                      >
                        Clear search
                      </button>
                    )}
                  </div>
                  
                  <div className="border border-gray-800 rounded-lg overflow-hidden">
                    {displayedUsers.length > 0 ? (
                      displayedUsers.map((userItem, index) => (
                        <div
                          key={userItem.username}
                          onClick={() => handleSelectUser(userItem.username, userItem.role)}
                          className={`p-3 hover:bg-[#333] cursor-pointer flex justify-between items-center ${
                            index !== displayedUsers.length - 1 ? 'border-b border-gray-800' : ''
                          }`}
                        >
                          <span className="font-medium">{userItem.username}</span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            userItem.role === 'buyer' 
                              ? 'bg-[#ff950e] text-black'
                              : 'bg-[#83c8f2] text-black'
                          }`}>
                            {formatRole(userItem.role)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        No users found matching your search
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="p-4 bg-[#252525] rounded-lg border border-gray-700 mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-lg">{selectedUser}</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        selectedUserRole === 'buyer' 
                          ? 'bg-[#ff950e] text-black'
                          : selectedUserRole === 'seller'
                            ? 'bg-[#83c8f2] text-black'
                            : 'bg-[#83c8f2] text-black' // Admin will use same style as seller
                      }`}>
                        {formatRole(selectedUserRole)}
                      </span>
                    </div>
                    <div className="text-[#ff950e] font-bold">
                      Balance: ${(wallet[selectedUser] || 0).toFixed(2)}
                    </div>
                  </div>
                  
                  {/* Action type selector */}
                  <div className="mb-4">
                    <label className="block text-sm text-gray-400 mb-1">Action Type</label>
                    <div className="flex border border-gray-700 rounded-lg overflow-hidden">
                      <button
                        className={`flex-1 py-2 flex items-center justify-center gap-1 ${
                          actionType === 'credit'
                            ? 'bg-green-800 text-white'
                            : 'bg-[#252525] text-gray-300'
                        }`}
                        onClick={() => setActionType('credit')}
                      >
                        <ArrowUpRight size={16} />
                        Credit
                      </button>
                      <button
                        className={`flex-1 py-2 flex items-center justify-center gap-1 ${
                          actionType === 'debit'
                            ? 'bg-red-800 text-white'
                            : 'bg-[#252525] text-gray-300'
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
                        className="w-full py-2 pl-10 pr-4 rounded-lg bg-[#252525] border border-gray-700 text-white"
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
                      className="w-full p-3 rounded-lg bg-[#252525] border border-gray-700 text-white resize-none"
                    ></textarea>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="space-y-3">
                    <button
                      onClick={handleAction}
                      className={`w-full py-3 rounded-lg font-bold ${
                        actionType === 'credit'
                          ? 'bg-green-600 hover:bg-green-700'
                          : 'bg-red-600 hover:bg-red-700'
                      } transition-colors`}
                    >
                      {actionType === 'credit' ? 'Add Funds' : 'Remove Funds'}
                    </button>
                    
                    <button 
                      onClick={() => {
                        setSelectedUser(null);
                        setSearchTerm('');
                        setAmount('');
                        setReason('');
                      }}
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
              <h2 className="text-xl font-bold mb-4">Admin Actions History</h2>
              
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
                      {[...adminActions]
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((action, index) => (
                          <tr 
                            key={index} 
                            className={`border-b border-gray-800 hover:bg-[#252525] ${
                              index % 2 === 0 ? 'bg-[#1f1f1f]' : ''
                            }`}
                          >
                            <td className="py-3 px-4">{formatDate(action.date)}</td>
                            <td className="py-3 px-4">{action.adminUser}</td>
                            <td className="py-3 px-4">{action.username}</td>
                            <td className="py-3 px-4">{formatRole(action.role)}</td>
                            <td className={`py-3 px-4 text-right font-mono ${
                              action.type === 'credit' ? 'text-green-500' : 'text-red-500'
                            }`}>
                              {action.type === 'credit' ? '+' : '-'}${action.amount.toFixed(2)}
                            </td>
                            <td className="py-3 px-4 truncate max-w-[200px]" title={action.reason}>
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
                <p className="text-sm">{message}</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </RequireAuth>
  );
}
