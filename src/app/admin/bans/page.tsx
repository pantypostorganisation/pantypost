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
  UserCheck,
  TrendingUp,
  BarChart3,
  Users,
  Target,
  Brain,
  Scale,
  Zap,
  RefreshCw,
  Download,
  Settings,
  Award,
  Image as ImageIcon
} from 'lucide-react';

export default function BanManagementPage() {
  const { 
    getActiveBans, 
    getExpiredBans, 
    getBanStats, 
    unbanUser, 
    reviewAppeal,
    approveAppeal, 
    rejectAppeal,
    escalateAppeal,
    banHistory,
    getUserEscalation,
    resetUserEscalation,
    appealReviews
  } = useBans();
  
  const [activeTab, setActiveTab] = useState<'active' | 'expired' | 'appeals' | 'history' | 'analytics'>('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState<'all' | 'temporary' | 'permanent'>('all');
  const [selectedBan, setSelectedBan] = useState<any>(null);
  const [showUnbanModal, setShowUnbanModal] = useState(false);
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [unbanReason, setUnbanReason] = useState('');
  const [appealReviewNotes, setAppealReviewNotes] = useState('');
  const [selectedEvidence, setSelectedEvidence] = useState<string[]>([]);
  const [evidenceIndex, setEvidenceIndex] = useState(0);

  const banStats = getBanStats();
  const activeBans = getActiveBans();
  const expiredBans = getExpiredBans();
  const pendingAppeals = activeBans.filter(ban => ban.appealSubmitted && ban.appealStatus === 'pending');

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

  // Handle appeal review
  const handleAppealReview = (ban: any) => {
    setSelectedBan(ban);
    setShowAppealModal(true);
    setAppealReviewNotes('');
  };

  const confirmAppealDecision = (decision: 'approve' | 'reject' | 'escalate') => {
    if (selectedBan && appealReviewNotes.trim()) {
      const success = reviewAppeal(selectedBan.id, decision, appealReviewNotes.trim(), 'admin');
      if (success) {
        alert(`Appeal ${decision}d successfully`);
        setShowAppealModal(false);
        setSelectedBan(null);
        setAppealReviewNotes('');
      } else {
        alert('Failed to process appeal');
      }
    } else {
      alert('Please provide review notes');
    }
  };

  // Show evidence modal
  const showEvidence = (evidence: string[]) => {
    setSelectedEvidence(evidence);
    setEvidenceIndex(0);
    setShowEvidenceModal(true);
  };

  // Reset user escalation
  const handleResetEscalation = (username: string) => {
    if (confirm(`Are you sure you want to reset escalation level for ${username}? This will clear their offense history.`)) {
      const success = resetUserEscalation(username, 'admin');
      if (success) {
        alert(`Escalation level reset for ${username}`);
      } else {
        alert('Failed to reset escalation level');
      }
    }
  };

  // Export ban data
  const exportBanData = () => {
    const data = {
      activeBans,
      expiredBans,
      banHistory,
      banStats,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ban-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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

  // Get escalation color
  const getEscalationColor = (level: number) => {
    if (level <= 1) return 'text-green-400 bg-green-900/20';
    if (level <= 2) return 'text-yellow-400 bg-yellow-900/20';
    if (level <= 3) return 'text-orange-400 bg-orange-900/20';
    if (level <= 4) return 'text-red-400 bg-red-900/20';
    return 'text-purple-400 bg-purple-900/20';
  };

  return (
    <RequireAuth role="admin">
      <main className="p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#ff950e] flex items-center">
              <Shield className="mr-3" />
              Advanced Ban Management
            </h1>
            <p className="text-gray-400 mt-1">
              Comprehensive ban oversight with analytics and progressive discipline tracking
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={exportBanData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Download size={16} />
              Export Data
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-[#ff950e] text-black rounded-lg hover:bg-[#e88800] flex items-center gap-2"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>

        {/* Enhanced Stats Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
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
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{banStats.recentBans24h}</div>
            <div className="text-xs text-gray-400">24h Bans</div>
          </div>
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{banStats.appealStats.approvedAppeals}</div>
            <div className="text-xs text-gray-400">Approved</div>
          </div>
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{banStats.escalationStats.level4 + banStats.escalationStats.level5}</div>
            <div className="text-xs text-gray-400">High Risk</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-[#1a1a1a] border border-gray-800 rounded-lg p-1 mb-6">
          {[
            { key: 'active', label: 'Active Bans', count: banStats.totalActiveBans, icon: Ban },
            { key: 'expired', label: 'Expired Bans', count: expiredBans.length, icon: Clock },
            { key: 'appeals', label: 'Appeals', count: banStats.pendingAppeals, icon: MessageSquare },
            { key: 'history', label: 'History', count: banHistory.length, icon: FileText },
            { key: 'analytics', label: 'Analytics', count: null, icon: BarChart3 }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                activeTab === tab.key 
                  ? 'bg-[#ff950e] text-black shadow-lg' 
                  : 'text-gray-300 hover:text-white hover:bg-[#333]'
              }`}
            >
              <tab.icon size={16} />
              {tab.label} {tab.count !== null && `(${tab.count})`}
            </button>
          ))}
        </div>

        {/* Filters (for list tabs) */}
        {['active', 'expired', 'appeals'].includes(activeTab) && (
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
        )}

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
              filterBans(activeBans).map((ban) => {
                const escalationInfo = getUserEscalation(ban.username);
                
                return (
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
                              Appeal {ban.appealStatus || 'Pending'}
                            </span>
                          )}
                          {ban.escalationLevel && (
                            <span className={`px-2 py-1 text-xs rounded font-medium ${getEscalationColor(ban.escalationLevel)}`}>
                              Level {ban.escalationLevel}
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
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

                        {/* Escalation Info */}
                        {escalationInfo && escalationInfo.escalationLevel > 0 && (
                          <div className="mb-3 p-3 bg-purple-900/10 border border-purple-800 rounded-lg">
                            <div className="flex items-center gap-2 text-purple-400 mb-2">
                              <TrendingUp size={14} />
                              <span className="font-medium text-sm">Escalation History</span>
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-xs">
                              <div>
                                <span className="text-gray-400">Level:</span>
                                <span className="text-purple-400 ml-1 font-medium">{escalationInfo.escalationLevel}</span>
                              </div>
                              <div>
                                <span className="text-gray-400">Offenses:</span>
                                <span className="text-white ml-1">{escalationInfo.offenseCount}</span>
                              </div>
                              <div>
                                <span className="text-gray-400">Last:</span>
                                <span className="text-white ml-1">
                                  {escalationInfo.lastOffenseDate ? new Date(escalationInfo.lastOffenseDate).toLocaleDateString() : 'N/A'}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {ban.notes && (
                          <div className="mb-3 p-3 bg-[#222] rounded-lg">
                            <div className="text-sm text-gray-400 mb-1">Admin Notes:</div>
                            <div className="text-sm text-gray-300">{ban.notes}</div>
                          </div>
                        )}
                        
                        {ban.appealSubmitted && ban.appealText && (
                          <div className="mb-3 p-3 bg-orange-900/10 border border-orange-800 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div className="text-sm text-orange-400 font-medium">Appeal Message:</div>
                              {ban.appealEvidence && ban.appealEvidence.length > 0 && (
                                <button
                                  onClick={() => showEvidence(ban.appealEvidence)}
                                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                >
                                  <ImageIcon size={12} />
                                  {ban.appealEvidence.length} Evidence File{ban.appealEvidence.length !== 1 ? 's' : ''}
                                </button>
                              )}
                            </div>
                            <div className="text-sm text-gray-300 mb-2">{ban.appealText}</div>
                            <div className="text-xs text-gray-500">
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
                        
                        {escalationInfo && escalationInfo.escalationLevel > 0 && (
                          <button
                            onClick={() => handleResetEscalation(ban.username)}
                            className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 flex items-center"
                          >
                            <RotateCcw size={12} className="mr-1" />
                            Reset Level
                          </button>
                        )}
                        
                        {ban.appealSubmitted && ban.appealStatus === 'pending' && (
                          <button
                            onClick={() => handleAppealReview(ban)}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center"
                          >
                            <Scale size={12} className="mr-1" />
                            Review Appeal
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
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
                        {ban.escalationLevel && (
                          <span className={`px-2 py-1 text-xs rounded font-medium ${getEscalationColor(ban.escalationLevel)}`}>
                            Level {ban.escalationLevel}
                          </span>
                        )}
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
                          Appeal {ban.appealStatus || 'Pending'}
                        </span>
                        {ban.escalationLevel && (
                          <span className={`px-2 py-1 text-xs rounded font-medium ${getEscalationColor(ban.escalationLevel)}`}>
                            Level {ban.escalationLevel}
                          </span>
                        )}
                      </div>
                      
                      <div className="bg-orange-900/10 border border-orange-800 rounded-lg p-4 mb-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm text-orange-400 font-medium">Appeal Message:</div>
                          {ban.appealEvidence && ban.appealEvidence.length > 0 && (
                            <button
                              onClick={() => showEvidence(ban.appealEvidence)}
                              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                            >
                              <ImageIcon size={12} />
                              {ban.appealEvidence.length} Evidence File{ban.appealEvidence.length !== 1 ? 's' : ''}
                            </button>
                          )}
                        </div>
                        <div className="text-sm text-gray-300 mb-2">{ban.appealText}</div>
                        <div className="text-xs text-gray-500">
                          Submitted: {ban.appealDate ? new Date(ban.appealDate).toLocaleString() : 'Unknown'}
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-400 mb-2">
                        <span>Original ban reason: </span>
                        <span className="text-gray-300">{getBanReasonDisplay(ban.reason, ban.customReason)}</span>
                      </div>
                      
                      <div className="text-sm text-gray-400">
                        <span>Ban type: </span>
                        <span className="text-gray-300">{ban.banType} ({ban.banType === 'permanent' ? 'Permanent' : formatRemainingTime(ban)})</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 ml-4">
                      <button
                        onClick={() => handleAppealReview(ban)}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center"
                      >
                        <Scale size={12} className="mr-1" />
                        Review Appeal
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
                              entry.action === 'appeal_rejected' ? 'bg-red-900/20 text-red-400' :
                              'bg-gray-900/20 text-gray-400'
                            }`}>
                              {entry.action.replace('_', ' ').toUpperCase()}
                            </span>
                            {entry.metadata?.escalationLevel && (
                              <span className={`px-2 py-1 text-xs rounded font-medium ${getEscalationColor(entry.metadata.escalationLevel)}`}>
                                Level {entry.metadata.escalationLevel}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-300 mb-1">{entry.details}</div>
                          {entry.metadata?.reasoning && (
                            <div className="text-xs text-gray-500 mb-1">AI Reasoning: {entry.metadata.reasoning}</div>
                          )}
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

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white mb-4">Ban Analytics & Insights</h2>
            
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <BarChart3 size={24} className="text-blue-400" />
                  <h3 className="text-lg font-semibold text-white">Ban Effectiveness</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Bans:</span>
                    <span className="text-white font-medium">{banStats.totalActiveBans + expiredBans.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Appeals Rate:</span>
                    <span className="text-white font-medium">
                      {banStats.totalActiveBans > 0 ? Math.round((banStats.appealStats.totalAppeals / banStats.totalActiveBans) * 100) : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Appeal Success:</span>
                    <span className="text-white font-medium">
                      {banStats.appealStats.totalAppeals > 0 ? Math.round((banStats.appealStats.approvedAppeals / banStats.appealStats.totalAppeals) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp size={24} className="text-green-400" />
                  <h3 className="text-lg font-semibold text-white">Escalation Levels</h3>
                </div>
                <div className="space-y-2">
                  {Object.entries(banStats.escalationStats).map(([level, count]) => (
                    <div key={level} className="flex justify-between items-center">
                      <span className="text-gray-400 capitalize">{level}:</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-purple-400 h-2 rounded-full"
                            style={{ width: `${Math.max(10, (count / Math.max(1, Math.max(...Object.values(banStats.escalationStats)))) * 100)}%` }}
                          />
                        </div>
                        <span className="text-white font-medium w-8 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Target size={24} className="text-red-400" />
                  <h3 className="text-lg font-semibold text-white">Violation Types</h3>
                </div>
                <div className="space-y-2">
                  {Object.entries(banStats.bansByReason).slice(0, 4).map(([reason, count]) => (
                    <div key={reason} className="flex justify-between items-center">
                      <span className="text-gray-400 capitalize text-sm">{reason.replace('_', ' ')}:</span>
                      <span className="text-white font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Users size={24} className="text-orange-400" />
                  <h3 className="text-lg font-semibold text-white">Activity Summary</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Recent (24h):</span>
                    <span className="text-white font-medium">{banStats.recentBans24h}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Temporary:</span>
                    <span className="text-white font-medium">{banStats.temporaryBans}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Permanent:</span>
                    <span className="text-white font-medium">{banStats.permanentBans}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity Chart Placeholder */}
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <BarChart3 size={20} className="text-blue-400" />
                Ban Activity Trends
              </h3>
              <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-700 rounded-lg">
                <div className="text-center">
                  <BarChart3 size={48} className="mx-auto text-gray-600 mb-4" />
                  <p className="text-gray-400">Interactive charts will be available in the backend version</p>
                  <p className="text-gray-500 text-sm mt-2">This will show ban trends, peak times, and patterns</p>
                </div>
              </div>
            </div>
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
                <div className="text-sm text-gray-400 space-y-1">
                  <div>Original reason: {getBanReasonDisplay(selectedBan.reason, selectedBan.customReason)}</div>
                  <div>Banned by: {selectedBan.bannedBy}</div>
                  <div>Ban type: {selectedBan.banType}</div>
                  {selectedBan.escalationLevel && (
                    <div>Escalation level: {selectedBan.escalationLevel}</div>
                  )}
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

        {/* Appeal Review Modal */}
        {showAppealModal && selectedBan && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <Scale className="mr-2 text-blue-400" />
                Review Appeal - {selectedBan.username}
              </h3>
              
              {/* Ban Details */}
              <div className="bg-[#222] rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-white mb-2">Original Ban Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Reason:</span>
                    <span className="text-white ml-2">{getBanReasonDisplay(selectedBan.reason, selectedBan.customReason)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Type:</span>
                    <span className="text-white ml-2">{selectedBan.banType}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Banned by:</span>
                    <span className="text-white ml-2">{selectedBan.bannedBy}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Date:</span>
                    <span className="text-white ml-2">{new Date(selectedBan.startTime).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Appeal Message */}
              <div className="bg-orange-900/10 border border-orange-800 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-orange-400 mb-2">User's Appeal</h4>
                <p className="text-gray-300 text-sm mb-2">{selectedBan.appealText}</p>
                <div className="text-xs text-gray-500">
                  Submitted: {selectedBan.appealDate ? new Date(selectedBan.appealDate).toLocaleString() : 'Unknown'}
                </div>
              </div>

              {/* Evidence */}
              {selectedBan.appealEvidence && selectedBan.appealEvidence.length > 0 && (
                <div className="bg-blue-900/10 border border-blue-800 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-blue-400 mb-2">Evidence Submitted</h4>
                  <button
                    onClick={() => showEvidence(selectedBan.appealEvidence)}
                    className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-2"
                  >
                    <ImageIcon size={16} />
                    View {selectedBan.appealEvidence.length} Evidence File{selectedBan.appealEvidence.length !== 1 ? 's' : ''}
                  </button>
                </div>
              )}

              {/* Review Notes */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Review Notes (Required)
                </label>
                <textarea
                  value={appealReviewNotes}
                  onChange={(e) => setAppealReviewNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-[#222] border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
                  rows={4}
                  placeholder="Provide detailed reasoning for your decision..."
                  required
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowAppealModal(false);
                    setSelectedBan(null);
                    setAppealReviewNotes('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={() => confirmAppealDecision('reject')}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center justify-center"
                >
                  <XCircle size={16} className="mr-2" />
                  Reject
                </button>
                <button
                  onClick={() => confirmAppealDecision('escalate')}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 flex items-center justify-center"
                >
                  <AlertTriangle size={16} className="mr-2" />
                  Escalate
                </button>
                <button
                  onClick={() => confirmAppealDecision('approve')}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center justify-center"
                >
                  <CheckCircle size={16} className="mr-2" />
                  Approve
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Evidence Modal */}
        {showEvidenceModal && selectedEvidence.length > 0 && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
            <div className="relative max-w-4xl w-full max-h-[90vh] bg-[#1a1a1a] rounded-lg overflow-hidden">
              <div className="flex justify-between items-center p-4 border-b border-gray-800">
                <h3 className="text-lg font-bold text-white">
                  Appeal Evidence ({evidenceIndex + 1} of {selectedEvidence.length})
                </h3>
                <button
                  onClick={() => setShowEvidenceModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <XCircle size={24} />
                </button>
              </div>
              
              <div className="p-4 flex flex-col items-center">
                <img 
                  src={selectedEvidence[evidenceIndex]} 
                  alt={`Evidence ${evidenceIndex + 1}`}
                  className="max-w-full max-h-[60vh] object-contain rounded"
                />
                
                {selectedEvidence.length > 1 && (
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => setEvidenceIndex(Math.max(0, evidenceIndex - 1))}
                      disabled={evidenceIndex === 0}
                      className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setEvidenceIndex(Math.min(selectedEvidence.length - 1, evidenceIndex + 1))}
                      disabled={evidenceIndex === selectedEvidence.length - 1}
                      className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </RequireAuth>
  );
}
