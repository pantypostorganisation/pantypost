// src/app/admin/bans/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useBans } from '@/context/BanContext';
import { useListings } from '@/context/ListingContext';
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
  UserCheck,
  BarChart3,
  RefreshCw,
  Download,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Image as ImageIcon,
  Info,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';

export default function BanManagementPage() {
  const { user } = useListings();
  
  // Safely handle context dependencies
  let banContext;
  try {
    banContext = useBans();
  } catch (error) {
    console.error('BanContext error:', error);
    banContext = null;
  }
  
  // Safely destructure with fallbacks
  const { 
    getActiveBans = () => [], 
    getExpiredBans = () => [], 
    getBanStats = () => null, 
    unbanUser = () => false, 
    reviewAppeal = () => false,
    approveAppeal = () => false, 
    rejectAppeal = () => false,
    escalateAppeal = () => false,
    banHistory = [],
    appealReviews = [],
    updateExpiredBans = () => {}
  } = banContext || {};

  // State variables
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
  const [isLoading, setIsLoading] = useState(false);
  const [expandedBans, setExpandedBans] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'date' | 'username' | 'duration'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Auto-refresh expired bans
  useEffect(() => {
    if (updateExpiredBans) {
      const interval = setInterval(() => {
        updateExpiredBans();
      }, 60000); // Check every minute
      
      return () => clearInterval(interval);
    }
  }, [updateExpiredBans]);

  // Safe data retrieval
  const banStats = (() => {
    try {
      const stats = getBanStats();
      return stats || {
        totalActiveBans: 0,
        temporaryBans: 0,
        permanentBans: 0,
        pendingAppeals: 0,
        recentBans24h: 0,
        bansByReason: {},
        appealStats: {
          totalAppeals: 0,
          pendingAppeals: 0,
          approvedAppeals: 0,
          rejectedAppeals: 0
        }
      };
    } catch (error) {
      console.error('Error getting ban stats:', error);
      return {
        totalActiveBans: 0,
        temporaryBans: 0,
        permanentBans: 0,
        pendingAppeals: 0,
        recentBans24h: 0,
        bansByReason: {},
        appealStats: {
          totalAppeals: 0,
          pendingAppeals: 0,
          approvedAppeals: 0,
          rejectedAppeals: 0
        }
      };
    }
  })();

  const activeBans = (() => {
    try {
      return getActiveBans() || [];
    } catch (error) {
      console.error('Error getting active bans:', error);
      return [];
    }
  })();

  const expiredBans = (() => {
    try {
      return getExpiredBans() || [];
    } catch (error) {
      console.error('Error getting expired bans:', error);
      return [];
    }
  })();

  const pendingAppeals = activeBans.filter(ban => 
    ban && 
    ban.appealSubmitted && 
    ban.appealStatus === 'pending'
  );

  // Toggle expanded state
  const toggleExpanded = (banId: string) => {
    setExpandedBans(prev => {
      const newSet = new Set(prev);
      if (newSet.has(banId)) {
        newSet.delete(banId);
      } else {
        newSet.add(banId);
      }
      return newSet;
    });
  };

  // Enhanced filter and sort function
  const filterAndSortBans = (bans: any[]) => {
    if (!Array.isArray(bans)) {
      console.warn('filterAndSortBans received non-array:', bans);
      return [];
    }
    
    // Filter
    let filtered = bans.filter(ban => {
      if (!ban || typeof ban !== 'object') {
        console.warn('Invalid ban object:', ban);
        return false;
      }
      
      if (!ban.username || typeof ban.username !== 'string') {
        console.warn('Ban missing username:', ban);
        return false;
      }
      
      const matchesSearch = searchTerm ? 
        ban.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ban.reason && ban.reason.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (ban.customReason && ban.customReason.toLowerCase().includes(searchTerm.toLowerCase())) : true;
      
      const matchesFilter = filterBy === 'all' ? true :
        filterBy === 'temporary' ? ban.banType === 'temporary' :
        ban.banType === 'permanent';
      
      return matchesSearch && matchesFilter;
    });

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'username':
          comparison = a.username.localeCompare(b.username);
          break;
        case 'duration':
          const aDuration = a.banType === 'permanent' ? Infinity : (a.remainingHours || 0);
          const bDuration = b.banType === 'permanent' ? Infinity : (b.remainingHours || 0);
          comparison = aDuration - bDuration;
          break;
        case 'date':
        default:
          comparison = new Date(a.startTime || 0).getTime() - new Date(b.startTime || 0).getTime();
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return filtered;
  };

  // Handle unban
  const handleUnban = (ban: any) => {
    if (!ban || !ban.username || typeof ban.username !== 'string') {
      alert('Invalid ban data - missing username');
      return;
    }
    if (!ban.id) {
      alert('Invalid ban data - missing ban ID');
      return;
    }
    setSelectedBan(ban);
    setShowUnbanModal(true);
  };

  const confirmUnban = async () => {
    if (!selectedBan || !selectedBan.username) {
      alert('No ban selected or invalid ban data');
      return;
    }
    
    setIsLoading(true);
    try {
      if (typeof unbanUser !== 'function') {
        alert('Unban function not available');
        return;
      }
      const success = unbanUser(selectedBan.username, user?.username || 'admin', unbanReason || 'Manually unbanned by admin');
      if (success) {
        alert(`Successfully unbanned ${selectedBan.username}`);
        setShowUnbanModal(false);
        setSelectedBan(null);
        setUnbanReason('');
      } else {
        alert('Failed to unban user - they may not be banned or an error occurred');
      }
    } catch (error) {
      console.error('Error unbanning user:', error);
      alert('An error occurred while unbanning the user');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle appeal review
  const handleAppealReview = (ban: any) => {
    if (!ban || !ban.username || !ban.id) {
      alert('Invalid ban data for appeal review');
      return;
    }
    if (!ban.appealSubmitted) {
      alert('No appeal has been submitted for this ban');
      return;
    }
    setSelectedBan(ban);
    setShowAppealModal(true);
    setAppealReviewNotes('');
  };

  const confirmAppealDecision = async (decision: 'approve' | 'reject' | 'escalate') => {
    if (!selectedBan || !selectedBan.id) {
      alert('No ban selected for appeal review');
      return;
    }
    
    if (!appealReviewNotes.trim()) {
      alert('Please provide review notes explaining your decision');
      return;
    }
    
    setIsLoading(true);
    try {
      if (typeof reviewAppeal !== 'function') {
        alert('Review appeal function not available');
        return;
      }
      const success = reviewAppeal(selectedBan.id, decision, appealReviewNotes.trim(), user?.username || 'admin');
      if (success) {
        alert(`Appeal ${decision}d successfully`);
        setShowAppealModal(false);
        setSelectedBan(null);
        setAppealReviewNotes('');
      } else {
        alert('Failed to process appeal - please try again');
      }
    } catch (error) {
      console.error('Error processing appeal:', error);
      alert('An error occurred while processing the appeal');
    } finally {
      setIsLoading(false);
    }
  };

  // Show evidence
  const showEvidence = (evidence: string[] | undefined) => {
    if (!evidence || !Array.isArray(evidence)) {
      alert('No evidence available for this appeal');
      return;
    }
    
    const validEvidence = evidence.filter(item => 
      typeof item === 'string' && item.length > 0
    );
    
    if (validEvidence.length === 0) {
      alert('No valid evidence files found');
      return;
    }
    
    setSelectedEvidence(validEvidence);
    setEvidenceIndex(0);
    setShowEvidenceModal(true);
  };

  // Export ban data
  const exportBanData = () => {
    try {
      const data = {
        activeBans: activeBans || [],
        expiredBans: expiredBans || [],
        banHistory: banHistory || [],
        banStats: banStats || {},
        exportDate: new Date().toISOString(),
        version: '1.0',
        exportedBy: user?.username || 'admin',
        totalRecords: (activeBans?.length || 0) + (expiredBans?.length || 0)
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ban-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('Ban data exported successfully');
    } catch (error) {
      console.error('Error exporting ban data:', error);
      alert('Failed to export ban data - please try again');
    }
  };

  // Format remaining time
  const formatRemainingTime = (ban: any) => {
    if (!ban || typeof ban !== 'object') return 'Unknown';
    
    if (ban.banType === 'permanent') {
      return <span className="flex items-center gap-1"><Infinity size={14} /> Permanent</span>;
    }
    
    if (!ban.remainingHours || ban.remainingHours <= 0) {
      return <span className="text-gray-500">Expired</span>;
    }
    
    const hours = Number(ban.remainingHours);
    if (hours < 1) {
      const minutes = Math.ceil(hours * 60);
      return <span className="text-yellow-400">{minutes}m remaining</span>;
    }
    
    if (hours < 24) {
      return <span className="text-orange-400">{Math.ceil(hours)}h remaining</span>;
    }
    
    const days = Math.floor(hours / 24);
    const remainingHours = Math.ceil(hours % 24);
    return <span className="text-red-400">{days}d {remainingHours}h remaining</span>;
  };

  // Get ban reason display
  const getBanReasonDisplay = (reason: string, customReason?: string) => {
    if (!reason || typeof reason !== 'string') {
      return 'Unknown Reason';
    }
    
    const reasonMap: Record<string, { label: string, icon: any, color: string }> = {
      harassment: { label: 'Harassment', icon: AlertTriangle, color: 'text-red-400' },
      spam: { label: 'Spam', icon: MessageSquare, color: 'text-yellow-400' },
      inappropriate_content: { label: 'Inappropriate Content', icon: AlertCircle, color: 'text-orange-400' },
      scam: { label: 'Scam/Fraud', icon: AlertTriangle, color: 'text-red-500' },
      underage: { label: 'Underage', icon: UserCheck, color: 'text-purple-400' },
      payment_fraud: { label: 'Payment Fraud', icon: AlertTriangle, color: 'text-red-600' },
      other: { label: 'Other', icon: Info, color: 'text-gray-400' }
    };
    
    const reasonInfo = reasonMap[reason.toLowerCase()] || { label: reason, icon: Info, color: 'text-gray-400' };
    const Icon = reasonInfo.icon;
    
    return (
      <span className={`flex items-center gap-1 ${reasonInfo.color}`}>
        <Icon size={14} />
        {reasonInfo.label}
        {customReason && <span className="text-gray-400 ml-1">- {customReason}</span>}
      </span>
    );
  };

  if (!banContext) {
    return (
      <RequireAuth role="admin">
        <div className="min-h-screen bg-black text-white">
          <main className="p-8 max-w-7xl mx-auto">
            <div className="bg-[#1a1a1a] border border-red-800 rounded-lg p-8 text-center">
              <AlertTriangle size={48} className="mx-auto text-red-400 mb-4" />
              <h2 className="text-2xl font-bold text-red-400 mb-2">Ban System Unavailable</h2>
              <p className="text-gray-400">
                The ban management system is currently unavailable. Please refresh the page or contact support.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-6 py-2 bg-[#ff950e] text-black rounded-lg hover:bg-[#e88800]"
              >
                Refresh Page
              </button>
            </div>
          </main>
        </div>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth role="admin">
      <div className="min-h-screen bg-black text-white">
        <main className="p-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-[#ff950e] flex items-center">
                <Shield className="mr-3" />
                Ban Management
              </h1>
              <p className="text-gray-400 mt-1">
                Manual ban oversight and appeal processing
              </p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={exportBanData}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
              >
                <Download size={16} />
                Export Data
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-[#ff950e] text-black rounded-lg hover:bg-[#e88800] flex items-center gap-2 transition-colors"
              >
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>
          </div>

          {/* Stats Dashboard */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 text-center hover:border-gray-700 transition-colors">
              <div className="text-2xl font-bold text-red-400">{banStats.totalActiveBans}</div>
              <div className="text-xs text-gray-400">Active Bans</div>
            </div>
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 text-center hover:border-gray-700 transition-colors">
              <div className="text-2xl font-bold text-yellow-400">{banStats.temporaryBans}</div>
              <div className="text-xs text-gray-400">Temporary</div>
            </div>
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 text-center hover:border-gray-700 transition-colors">
              <div className="text-2xl font-bold text-purple-400">{banStats.permanentBans}</div>
              <div className="text-xs text-gray-400">Permanent</div>
            </div>
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 text-center hover:border-gray-700 transition-colors">
              <div className="text-2xl font-bold text-orange-400">{banStats.pendingAppeals}</div>
              <div className="text-xs text-gray-400">Appeals</div>
            </div>
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 text-center hover:border-gray-700 transition-colors">
              <div className="text-2xl font-bold text-blue-400">{banStats.recentBans24h}</div>
              <div className="text-xs text-gray-400">24h Bans</div>
            </div>
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 text-center hover:border-gray-700 transition-colors">
              <div className="text-2xl font-bold text-green-400">{banStats.appealStats.approvedAppeals}</div>
              <div className="text-xs text-gray-400">Approved</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-1 bg-[#1a1a1a] border border-gray-800 rounded-lg p-1 mb-6">
            {[
              { key: 'active', label: 'Active Bans', count: banStats.totalActiveBans, icon: Ban },
              { key: 'expired', label: 'Expired Bans', count: expiredBans.length, icon: Clock },
              { key: 'appeals', label: 'Appeals', count: banStats.pendingAppeals, icon: MessageSquare },
              { key: 'history', label: 'History', count: (banHistory || []).length, icon: FileText },
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
                <span className="hidden sm:inline">{tab.label}</span>
                {tab.count !== null && <span className="ml-1">({tab.count})</span>}
              </button>
            ))}
          </div>

          {/* Filters (for list tabs) */}
          {['active', 'expired', 'appeals'].includes(activeTab) && (
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 mb-6">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search by username or reason..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-[#222] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e] transition-all"
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

                {/* Sort Options */}
                <div className="flex gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-3 py-2 bg-[#222] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
                  >
                    <option value="date">Sort by Date</option>
                    <option value="username">Sort by Username</option>
                    <option value="duration">Sort by Duration</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                    className="px-3 py-2 bg-[#222] border border-gray-700 rounded-lg text-white hover:bg-[#333] transition-colors"
                  >
                    {sortOrder === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Content based on active tab */}
          {activeTab === 'active' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white">Active Bans ({banStats.totalActiveBans})</h2>
                {banStats.totalActiveBans > 0 && (
                  <p className="text-sm text-gray-400">
                    Click on a ban to expand details
                  </p>
                )}
              </div>
              
              {filterAndSortBans(activeBans).length === 0 ? (
                <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-8 text-center">
                  <UserCheck size={48} className="mx-auto text-gray-600 mb-4" />
                  <p className="text-gray-400 text-lg">No active bans found</p>
                  {searchTerm && (
                    <p className="text-gray-500 text-sm mt-2">
                      Try adjusting your search terms or filters
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filterAndSortBans(activeBans).map((ban) => {
                    if (!ban || !ban.id || !ban.username) {
                      console.warn('Skipping invalid ban object:', ban);
                      return null;
                    }
                    
                    const isExpanded = expandedBans.has(ban.id);
                    
                    return (
                      <div 
                        key={ban.id} 
                        className="bg-[#1a1a1a] border border-gray-800 rounded-lg overflow-hidden hover:border-gray-700 transition-all"
                      >
                        {/* Ban Header - Clickable */}
                        <div 
                          className="p-6 cursor-pointer"
                          onClick={() => toggleExpanded(ban.id)}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-semibold text-white">{ban.username}</h3>
                                <span className={`px-2 py-1 text-xs rounded font-medium ${
                                  ban.banType === 'permanent' 
                                    ? 'bg-purple-900/20 text-purple-400' 
                                    : 'bg-yellow-900/20 text-yellow-400'
                                }`}>
                                  {formatRemainingTime(ban)}
                                </span>
                                {ban.appealSubmitted && (
                                  <span className="px-2 py-1 bg-orange-900/20 text-orange-400 text-xs rounded font-medium">
                                    Appeal {ban.appealStatus || 'Pending'}
                                  </span>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-4 text-sm">
                                <div>{getBanReasonDisplay(ban.reason, ban.customReason)}</div>
                                <div className="text-gray-400">
                                  <Calendar size={14} className="inline mr-1" />
                                  {ban.startTime ? new Date(ban.startTime).toLocaleDateString() : 'Unknown'}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </div>
                          </div>
                        </div>
                        
                        {/* Expanded Content */}
                        {isExpanded && (
                          <div className="border-t border-gray-800 p-6 space-y-4 bg-[#0a0a0a]">
                            {/* Full Details Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-400">Banned by:</span>
                                <span className="text-white ml-2">{ban.bannedBy || 'Unknown'}</span>
                              </div>
                              <div>
                                <span className="text-gray-400">Start time:</span>
                                <span className="text-white ml-2">
                                  {ban.startTime ? new Date(ban.startTime).toLocaleString() : 'Unknown'}
                                </span>
                              </div>
                              {ban.endTime && (
                                <div>
                                  <span className="text-gray-400">End time:</span>
                                  <span className="text-white ml-2">{new Date(ban.endTime).toLocaleString()}</span>
                                </div>
                              )}
                              {ban.reportIds && ban.reportIds.length > 0 && (
                                <div>
                                  <span className="text-gray-400">Related reports:</span>
                                  <span className="text-white ml-2">{ban.reportIds.length}</span>
                                </div>
                              )}
                            </div>
                            
                            {/* Admin Notes */}
                            {ban.notes && typeof ban.notes === 'string' && ban.notes.trim() && (
                              <div className="p-3 bg-[#222] rounded-lg">
                                <div className="text-sm text-gray-400 mb-1">Admin Notes:</div>
                                <div className="text-sm text-gray-300">{ban.notes}</div>
                              </div>
                            )}
                            
                            {/* Appeal Info */}
                            {ban.appealSubmitted && ban.appealText && typeof ban.appealText === 'string' && (
                              <div className="p-3 bg-orange-900/10 border border-orange-800 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="text-sm text-orange-400 font-medium">Appeal Message:</div>
                                  {ban.appealEvidence && Array.isArray(ban.appealEvidence) && ban.appealEvidence.length > 0 && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        showEvidence(ban.appealEvidence);
                                      }}
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
                            
                            {/* Action Buttons */}
                            <div className="flex flex-wrap gap-2 pt-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUnban(ban);
                                }}
                                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 flex items-center transition-colors"
                              >
                                <UserCheck size={12} className="mr-1" />
                                Unban
                              </button>
                              
                              {ban.appealSubmitted && ban.appealStatus === 'pending' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAppealReview(ban);
                                  }}
                                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center transition-colors"
                                >
                                  <MessageSquare size={12} className="mr-1" />
                                  Review Appeal
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }).filter(ban => ban !== null)}
                </div>
              )}
            </div>
          )}

          {activeTab === 'expired' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white mb-4">Expired Bans ({expiredBans.length})</h2>
              {filterAndSortBans(expiredBans).length === 0 ? (
                <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-8 text-center">
                  <Clock size={48} className="mx-auto text-gray-600 mb-4" />
                  <p className="text-gray-400 text-lg">No expired bans found</p>
                  {searchTerm && (
                    <p className="text-gray-500 text-sm mt-2">
                      Try adjusting your search terms or filters
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filterAndSortBans(expiredBans).map((ban) => {
                    if (!ban || !ban.id || !ban.username) return null;
                    
                    return (
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
                                  {ban.banType === 'permanent' ? 'Permanent' : 
                                    ban.endTime && ban.startTime ? 
                                      `${Math.ceil((new Date(ban.endTime).getTime() - new Date(ban.startTime).getTime()) / (1000 * 60 * 60))} hours` :
                                      'Unknown'
                                  }
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-400">Start:</span>
                                <span className="text-gray-300 ml-2">
                                  {ban.startTime ? new Date(ban.startTime).toLocaleString() : 'Unknown'}
                                </span>
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
                    );
                  }).filter(ban => ban !== null)}
                </div>
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
                  <p className="text-gray-500 text-sm mt-2">
                    All appeals have been processed or no appeals have been submitted
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingAppeals.map((ban) => {
                    if (!ban || !ban.id || !ban.username) return null;
                    
                    return (
                      <div key={ban.id} className="bg-[#1a1a1a] border border-orange-800 rounded-lg p-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <h3 className="text-lg font-semibold text-white">{ban.username}</h3>
                              <span className="px-2 py-1 bg-orange-900/20 text-orange-400 text-xs rounded font-medium">
                                Appeal {ban.appealStatus || 'Pending'}
                              </span>
                            </div>
                            
                            <div className="bg-orange-900/10 border border-orange-800 rounded-lg p-4 mb-3">
                              <div className="flex items-center justify-between mb-2">
                                <div className="text-sm text-orange-400 font-medium">Appeal Message:</div>
                                {ban.appealEvidence && Array.isArray(ban.appealEvidence) && ban.appealEvidence.length > 0 && (
                                  <button
                                    onClick={() => showEvidence(ban.appealEvidence)}
                                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                                  >
                                    <ImageIcon size={12} />
                                    {ban.appealEvidence.length} Evidence File{ban.appealEvidence.length !== 1 ? 's' : ''}
                                  </button>
                                )}
                              </div>
                              <div className="text-sm text-gray-300 mb-2">{ban.appealText || 'No appeal text provided'}</div>
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
                              <span className="text-gray-300">
                                {ban.banType} ({ban.banType === 'permanent' ? 'Permanent' : formatRemainingTime(ban)})
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-2 ml-4">
                            <button
                              onClick={() => handleAppealReview(ban)}
                              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center transition-colors"
                            >
                              <MessageSquare size={12} className="mr-1" />
                              Review Appeal
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }).filter(ban => ban !== null)}
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white mb-4">Ban History ({(banHistory || []).length})</h2>
              {(!banHistory || banHistory.length === 0) ? (
                <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-8 text-center">
                  <FileText size={48} className="mx-auto text-gray-600 mb-4" />
                  <p className="text-gray-400 text-lg">No ban history found</p>
                  <p className="text-gray-500 text-sm mt-2">
                    Ban actions will appear here as they occur
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {(banHistory || [])
                    .filter(entry => {
                      if (!entry || !entry.username) return false;
                      return searchTerm ? 
                        entry.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (entry.details && entry.details.toLowerCase().includes(searchTerm.toLowerCase())) : true;
                    })
                    .sort((a, b) => {
                      const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
                      const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
                      return timeB - timeA;
                    })
                    .slice(0, 50) // Show last 50 entries
                    .map((entry) => {
                      if (!entry || !entry.id) return null;
                      
                      return (
                        <div key={entry.id} className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-colors">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-1">
                                <span className="font-medium text-white">{entry.username || 'Unknown'}</span>
                                <span className={`px-2 py-1 text-xs rounded font-medium ${
                                  entry.action === 'banned' ? 'bg-red-900/20 text-red-400' :
                                  entry.action === 'unbanned' ? 'bg-green-900/20 text-green-400' :
                                  entry.action === 'appeal_submitted' ? 'bg-orange-900/20 text-orange-400' :
                                  entry.action === 'appeal_approved' ? 'bg-blue-900/20 text-blue-400' :
                                  entry.action === 'appeal_rejected' ? 'bg-red-900/20 text-red-400' :
                                  'bg-gray-900/20 text-gray-400'
                                }`}>
                                  {(entry.action || 'unknown').replace('_', ' ').toUpperCase()}
                                </span>
                              </div>
                              <div className="text-sm text-gray-300 mb-1">{entry.details || 'No details available'}</div>
                              <div className="text-xs text-gray-500">
                                {entry.timestamp ? new Date(entry.timestamp).toLocaleString() : 'Unknown time'} by {entry.adminUsername || 'Unknown admin'}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }).filter(entry => entry !== null)
                  }
                </div>
              )}
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white mb-4">Ban Analytics</h2>
              
              {/* Ban Reasons Chart */}
              <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <BarChart3 size={20} className="text-blue-400" />
                  Ban Reasons Distribution
                </h3>
                <div className="space-y-3">
                  {Object.entries(banStats.bansByReason).map(([reason, count]) => {
                    const total = Object.values(banStats.bansByReason).reduce((sum, val) => sum + Number(val), 0);
                    const percentage = total > 0 ? (Number(count) / total) * 100 : 0;
                    
                    return (
                      <div key={reason}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-gray-300 capitalize">{reason.replace('_', ' ')}</span>
                          <span className="text-sm text-gray-400">{count} ({percentage.toFixed(1)}%)</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-[#ff950e] h-2 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Appeal Statistics */}
              <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <MessageSquare size={20} className="text-orange-400" />
                  Appeal Processing
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">{banStats.appealStats.totalAppeals}</div>
                    <div className="text-xs text-gray-400">Total Appeals</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">{banStats.appealStats.pendingAppeals}</div>
                    <div className="text-xs text-gray-400">Pending</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">{banStats.appealStats.approvedAppeals}</div>
                    <div className="text-xs text-gray-400">Approved</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-400">{banStats.appealStats.rejectedAppeals}</div>
                    <div className="text-xs text-gray-400">Rejected</div>
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
                    <div>Banned by: {selectedBan.bannedBy || 'Unknown'}</div>
                    <div>Ban type: {selectedBan.banType || 'Unknown'}</div>
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
                    maxLength={500}
                  />
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowUnbanModal(false);
                      setSelectedBan(null);
                      setUnbanReason('');
                    }}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmUnban}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center justify-center transition-colors"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Unbanning...
                      </>
                    ) : (
                      <>
                        <UserCheck size={16} className="mr-2" />
                        Unban User
                      </>
                    )}
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
                  <MessageSquare className="mr-2 text-blue-400" />
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
                      <span className="text-white ml-2">{selectedBan.banType || 'Unknown'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Banned by:</span>
                      <span className="text-white ml-2">{selectedBan.bannedBy || 'Unknown'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Date:</span>
                      <span className="text-white ml-2">
                        {selectedBan.startTime ? new Date(selectedBan.startTime).toLocaleDateString() : 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Appeal Message */}
                <div className="bg-orange-900/10 border border-orange-800 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-orange-400 mb-2">User's Appeal</h4>
                  <p className="text-gray-300 text-sm mb-2 whitespace-pre-wrap">
                    {selectedBan.appealText || 'No appeal text provided'}
                  </p>
                  <div className="text-xs text-gray-500">
                    Submitted: {selectedBan.appealDate ? new Date(selectedBan.appealDate).toLocaleString() : 'Unknown'}
                  </div>
                </div>

                {/* Evidence */}
                {selectedBan.appealEvidence && Array.isArray(selectedBan.appealEvidence) && selectedBan.appealEvidence.length > 0 && (
                  <div className="bg-blue-900/10 border border-blue-800 rounded-lg p-4 mb-4">
                    <h4 className="font-semibold text-blue-400 mb-2">Evidence Submitted</h4>
                    <button
                      onClick={() => showEvidence(selectedBan.appealEvidence)}
                      className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-2 transition-colors"
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
                    maxLength={1000}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {appealReviewNotes.length}/1000 characters
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowAppealModal(false);
                      setSelectedBan(null);
                      setAppealReviewNotes('');
                    }}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => confirmAppealDecision('reject')}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center justify-center transition-colors"
                    disabled={!appealReviewNotes.trim() || isLoading}
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <XCircle size={16} className="mr-2" />
                        Reject
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => confirmAppealDecision('approve')}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center justify-center transition-colors"
                    disabled={!appealReviewNotes.trim() || isLoading}
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={16} className="mr-2" />
                        Approve
                      </>
                    )}
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
                    onClick={() => {
                      setShowEvidenceModal(false);
                      setSelectedEvidence([]);
                      setEvidenceIndex(0);
                    }}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <XCircle size={24} />
                  </button>
                </div>
                
                <div className="p-4 flex flex-col items-center">
                  <img 
                    src={selectedEvidence[evidenceIndex]} 
                    alt={`Evidence ${evidenceIndex + 1}`}
                    className="max-w-full max-h-[60vh] object-contain rounded"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const errorDiv = document.createElement('div');
                      errorDiv.className = 'text-gray-400 text-center p-8';
                      errorDiv.textContent = 'Unable to load image';
                      target.parentNode?.insertBefore(errorDiv, target);
                    }}
                  />
                  
                  {selectedEvidence.length > 1 && (
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => setEvidenceIndex(Math.max(0, evidenceIndex - 1))}
                        disabled={evidenceIndex === 0}
                        className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                      >
                        <ArrowLeft size={14} className="mr-1" />
                        Previous
                      </button>
                      <span className="px-3 py-1 bg-gray-800 text-gray-300 rounded">
                        {evidenceIndex + 1} / {selectedEvidence.length}
                      </span>
                      <button
                        onClick={() => setEvidenceIndex(Math.min(selectedEvidence.length - 1, evidenceIndex + 1))}
                        disabled={evidenceIndex === selectedEvidence.length - 1}
                        className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                      >
                        Next
                        <ArrowRight size={14} className="ml-1" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </RequireAuth>
  );
}
