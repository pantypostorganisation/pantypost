// src/app/admin/bans/page.tsx
'use client';

import { useState } from 'react';
import { useBans } from '@/context/BanContext';
import RequireAuth from '@/components/RequireAuth';
import {
  Shield,
  Clock,
  Ban,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  Infinity,
  Timer,
  Search,
  Filter,
  AlertTriangle,
  MessageSquare,
  FileText,
  RotateCcw,
  Trash2,
  Eye,
  UserCheck
} from 'lucide-react';

export default function BanManagementPage() {
  const { 
    getActiveBans, 
    getExpiredBans, 
    getBanStats, 
    unbanUser, 
    approveAppeal, 
    rejectAppeal,
    banHistory 
  } = useBans();
  
  const [activeTab, setActiveTab] = useState<'active' | 'expired' | 'appeals' | 'history'>('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState<'all' | 'temporary' | 'permanent'>('all');
  const [selectedBan, setSelectedBan] = useState<any>(null);
  const [showUnbanModal, setShowUnbanModal] = useState(false);
  const [unbanReason, setUnbanReason] = useState('');

  const banStats = getBanStats();
  const activeBans = getActiveBans();
  const expiredBans = getExpiredBans();
  const pendingAppeals = activeBans.filter(ban => ban.appealSubmitted);

  // Filter functions
  const filterBans = (bans: any[]) => {
    return bans.filter(ban => {
      const matchesSearch = searchTerm ? 
        ban.username.toLowerCase().includes(searchTerm.toLowerCase()) : true;
      
      const matchesFilter = filterBy === 'all' ? true :
        filterBy === 'temporary' ? ban.banType === 'temporary' :
        ban.banType === 'permanent';
      
      return matchesSearch && matchesFilter;
    });
  };

  // Handle unban
  const handleUnban = (ban: any) => {
    setSelectedBan(ban);
    setShowUnbanModal(true);
  };

  const confirmUnban = () => {
    if (selectedBan) {
      const success = unbanUser(selectedBan.username, 'admin', unbanReason || 'Manually unbanned by admin');
      if (success) {
        alert(`Successfully unbanned ${selectedBan.username}`);
        setShowUnbanModal(false);
        setSelectedBan(null);
        setUnbanReason('');
      } else {
        alert('Failed to unban user');
      }
    }
  };

  // Format remaining time
  const formatRemainingTime = (ban: any) => {
    if (ban.banType === 'permanent') {
      return 'Permanent';
    }
    
    if (!ban.remainingHours || ban.remainingHours <= 0) {
      return 'Expired';
    }
    
    if (ban.remainingHours < 24) {
      return `${ban.remainingHours}h remaining`;
    }
    
    const days = Math.floor(ban.remainingHours / 24);
    const hours = ban.remainingHours % 24;
    return `${days}d ${hours}h remaining`;
  };

  // Get ban reason display
  const getBanReasonDisplay = (reason: string, customReason?: string) => {
    const reasonMap: Record<string, string> = {
      harassment: 'Harassment',
      spam: 'Spam',
      inappropriate_content: 'Inappropriate Content',
      scam: 'Scam/Fraud',
      underage: 'Underage',
      payment_fraud: 'Payment Fraud',
      other: 'Other'
    };
    
    const displayReason = reasonMap[reason] || reason;
    return customReason ? `${displayReason}: ${customReason}` : displayReason;
  };

  return (
    <RequireAuth role="admin">
      <main className="p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#ff950e] flex items-center">
              <Shield className="mr-3" />
              Ban Management
            </h1>
            <p className="text-gray-400 mt-1">
              Manage user bans, appeals, and ban history
            </p>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-400">{banStats.totalActiveBans}</div>
              <div className="text-xs text-gray-400">Active Bans</div>
            </div>
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400">{banStats.temporaryBans}</div>
              <div className="text-xs text-gray-400">Temporary</div>
            </div>
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-400">{banStats.permanentBans}</div>
              <div className="text-xs text-gray-400">Permanent</div>
            </div>
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-orange-400">{banStats.pendingAppeals}</div>
              <div className="text-xs text-gray-400">Appeals</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-[#1a1a1a] border border-gray-800 rounded-lg p-1 mb-6">
          {[
            { key: 'active', label: 'Active Bans', count: banStats.totalActiveBans },
            { key: 'expired', label: 'Expired Bans', count: expiredBans.length },
            { key: 'appeals', label: 'Appeals', count: banStats.pendingAppeals },
            { key: 'history', label: 'History', count: banHistory.length }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === tab.key 
                  ? 'bg-[#ff950e] text-black shadow-lg' 
                  : 'text-gray-300 hover:text-white hover:bg-[#333]'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 mb-6">
          <div className="flex gap-4 items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search by username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#222] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
              />
            </div>

            {/* Type Filter */}
            {(activeTab === 'active' || activeTab === 'expired') && (
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value as any)}
                className="px-3 py-2 bg-[#222] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
              >
                <option value="all">All Types</option>
                <option value="temporary">Temporary</option>
                <option value="permanent">Permanent</option>
              </select>
            )}
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'active' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white mb-4">Active Bans ({banStats.totalActiveBans})</h2>
            {filterBans(activeBans).length === 0 ? (
              <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-8 text-center">
                <UserCheck size={48} className="mx-auto text-gray-600 mb-4" />
                <p className="text-gray-400 text-lg">No active bans found</p>
              </div>
            ) : (
              filterBans(activeBans).map((ban) => (
                <div key={ban.id} className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">{ban.username}</h3>
                        <span className={`px-2 py-1 text-xs rounded font-medium ${
                          ban.banType === 'permanent' 
                            ? 'bg-purple-900/20 text-purple-400' 
                            : 'bg-yellow-900/20 text-yellow-400'
                        }`}>
                          {ban.banType === 'permanent' ? (
                            <span className="flex items-center gap-1">
                              <Infinity size={12} />
                              Permanent
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <Timer size={12} />
                              {formatRemainingTime(ban)}
                            </span>
                          )}
                        </span>
                        {ban.appealSubmitted && (
                          <span className="px-2 py-1 bg-orange-900/20 text-orange-400 text-xs rounded font-medium">
                            Appeal Pending
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Reason:</span>
                          <span className="text-white ml-2">{getBanReasonDisplay(ban.reason, ban.customReason)}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Banned by:</span>
                          <span className="text-white ml-2">{ban.bannedBy}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Start time:</span>
                          <span className="text-white ml-2">{new Date(ban.startTime).toLocaleString()}</span>
                        </div>
                        {ban.endTime && (
                          <div>
                            <span className="text-gray-400">End time:</span>
                            <span className="text-white ml-2">{new Date(ban.endTime).toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                      
                      {ban.notes && (
                        <div className="mt-3 p-3 bg-[#222] rounded-lg">
                          <div className="text-sm text-gray-400 mb-1">Admin Notes:</div>
                          <div className="text-sm text-gray-300">{ban.notes}</div>
                        </div>
                      )}
                      
                      {ban.appealSubmitted && ban.appealText && (
                        <div className="mt-3 p-3 bg-orange-900/10 border border-orange-800 rounded-lg">
                          <div className="text-sm text-orange-400 mb-1">Appeal Message:</div>
                          <div className="text-sm text-gray-300">{ban.appealText}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            Submitted: {ban.appealDate ? new Date(ban.appealDate).toLocaleString() : 'Unknown'}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-2 ml-4">
                      <button
                        onClick={() => handleUnban(ban)}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 flex items-center"
                      >
                        <UserCheck size={12} className="mr-1" />
                        Unban
                      </button>
                      
                      {ban.appealSubmitted && (
                        <>
                          <button
                            onClick={() => {
                              if (confirm('Approve this appeal and unban the user?')) {
                                approveAppeal(ban.id, 'admin');
                              }
                            }}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center"
                          >
                            <CheckCircle size={12} className="mr-1" />
                            Approve Appeal
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt('Reason for rejecting appeal:');
                              if (reason !== null) {
                                rejectAppeal(ban.id, 'admin', reason);
                              }
                            }}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 flex items-center"
                          >
                            <XCircle size={12} className="mr-1" />
                            Reject Appeal
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'expired' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white mb-4">Expired Bans ({expiredBans.length})</h2>
            {filterBans(expiredBans).length === 0 ? (
              <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-8 text-center">
                <Clock size={48} className="mx-auto text-gray-600 mb-4" />
                <p className="text-gray-400 text-lg">No expired bans found</p>
              </div>
            ) : (
              filterBans(expiredBans).map((ban) => (
                <div key={ban.id} className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6 opacity-75">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">{ban.username}</h3>
                        <span className="px-2 py-1 bg-gray-900/20 text-gray-400 text-xs rounded font-medium">
                          Expired/Lifted
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Reason:</span>
                          <span className="text-gray-300 ml-2">{getBanReasonDisplay(ban.reason, ban.customReason)}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Duration:</span>
                          <span className="text-gray-300 ml-2">
                            {ban.banType === 'permanent' ? 'Permanent' : `${Math.ceil((new Date(ban.endTime!).getTime() - new Date(ban.startTime).getTime()) / (1000 * 60 * 60))} hours`}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400">Start:</span>
                          <span className="text-gray-300 ml-2">{new Date(ban.startTime).toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">End:</span>
                          <span className="text-gray-300 ml-2">
                            {ban.endTime ? new Date(ban.endTime).toLocaleString() : 'Manually lifted'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'appeals' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white mb-4">Pending Appeals ({pendingAppeals.length})</h2>
            {pendingAppeals.length === 0 ? (
              <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-8 text-center">
                <MessageSquare size={48} className="mx-auto text-gray-600 mb-4" />
                <p className="text-gray-400 text-lg">No pending appeals</p>
              </div>
            ) : (
              pendingAppeals.map((ban) => (
                <div key={ban.id} className="bg-[#1a1a1a] border border-orange-800 rounded-lg p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-white">{ban.username}</h3>
                        <span className="px-2 py-1 bg-orange-900/20 text-orange-400 text-xs rounded font-medium">
                          Appeal Pending
                        </span>
                      </div>
                      
                      <div className="bg-orange-900/10 border border-orange-800 rounded-lg p-4 mb-3">
                        <div className="text-sm text-orange-400 mb-2">Appeal Message:</div>
                        <div className="text-sm text-gray-300">{ban.appealText}</div>
                        <div className="text-xs text-gray-500 mt-2">
                          Submitted: {ban.appealDate ? new Date(ban.appealDate).toLocaleString() : 'Unknown'}
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-400">
                        <span>Original ban reason: </span>
                        <span className="text-gray-300">{getBanReasonDisplay(ban.reason, ban.customReason)}</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 ml-4">
                      <button
                        onClick={() => {
                          if (confirm('Approve this appeal and unban the user?')) {
                            approveAppeal(ban.id, 'admin');
                          }
                        }}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 flex items-center"
                      >
                        <CheckCircle size={12} className="mr-1" />
                        Approve Appeal
                      </button>
                      <button
                        onClick={() => {
                          const reason = prompt('Reason for rejecting appeal:');
                          if (reason !== null) {
                            rejectAppeal(ban.id, 'admin', reason);
                          }
                        }}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 flex items-center"
                      >
                        <XCircle size={12} className="mr-1" />
                        Reject Appeal
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white mb-4">Ban History ({banHistory.length})</h2>
            {banHistory.length === 0 ? (
              <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-8 text-center">
                <FileText size={48} className="mx-auto text-gray-600 mb-4" />
                <p className="text-gray-400 text-lg">No ban history found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {banHistory
                  .filter(entry => searchTerm ? entry.username.toLowerCase().includes(searchTerm.toLowerCase()) : true)
                  .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                  .map((entry) => (
                    <div key={entry.id} className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="font-medium text-white">{entry.username}</span>
                            <span className={`px-2 py-1 text-xs rounded font-medium ${
                              entry.action === 'banned' ? 'bg-red-900/20 text-red-400' :
                              entry.action === 'unbanned' ? 'bg-green-900/20 text-green-400' :
                              entry.action === 'appeal_submitted' ? 'bg-orange-900/20 text-orange-400' :
                              entry.action === 'appeal_approved' ? 'bg-blue-900/20 text-blue-400' :
                              'bg-gray-900/20 text-gray-400'
                            }`}>
                              {entry.action.replace('_', ' ').toUpperCase()}
                            </span>
                          </div>
                          <div className="text-sm text-gray-300 mb-1">{entry.details}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(entry.timestamp).toLocaleString()} by {entry.adminUsername}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Unban Modal */}
        {showUnbanModal && selectedBan && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <UserCheck className="mr-2 text-green-400" />
                Unban User
              </h3>
              
              <div className="mb-4">
                <p className="text-gray-300 mb-2">
                  Are you sure you want to unban <strong>{selectedBan.username}</strong>?
                </p>
                <div className="text-sm text-gray-400">
                  <div>Original reason: {getBanReasonDisplay(selectedBan.reason, selectedBan.customReason)}</div>
                  <div>Banned by: {selectedBan.bannedBy}</div>
                  <div>Ban type: {selectedBan.banType}</div>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Reason for unbanning (optional)
                </label>
                <textarea
                  value={unbanReason}
                  onChange={(e) => setUnbanReason(e.target.value)}
                  className="w-full px-3 py-2 bg-[#222] border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
                  rows={3}
                  placeholder="Reason for lifting this ban..."
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowUnbanModal(false);
                    setSelectedBan(null);
                    setUnbanReason('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmUnban}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center justify-center"
                >
                  <UserCheck size={16} className="mr-2" />
                  Unban User
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </RequireAuth>
  );
}