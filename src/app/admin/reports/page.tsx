// src/app/admin/reports/page.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useListings } from '@/context/ListingContext';
import { useBans } from '@/context/BanContext';
import RequireAuth from '@/components/RequireAuth';
import {
  Shield,
  Clock,
  AlertTriangle,
  Ban,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  MessageSquare,
  Trash2,
  Eye,
  Filter,
  Search,
  UserX,
  Timer,
  Infinity,
  FileText,
  BarChart3,
  RefreshCw,
  TrendingUp,
  Target,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Info,
  Activity,
  MessageCircle,
  Archive,
  ExternalLink,
  Flag,
  ShieldAlert,
  EyeOff,
  Users
} from 'lucide-react';

type Message = {
  sender: string;
  receiver: string;
  content: string;
  date: string;
  read?: boolean;
};

type ReportLog = {
  id?: string;
  reporter: string;
  reportee: string;
  messages: Message[];
  date: string;
  processed?: boolean;
  banApplied?: boolean;
  banId?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  category?: 'harassment' | 'spam' | 'inappropriate_content' | 'scam' | 'other';
  adminNotes?: string;
  processedBy?: string;
  processedAt?: string;
};

export default function AdminReportsPage() {
  const { user } = useAuth();
  
  // Safely handle the ban context
  let banContext: any = null;
  let banContextError: string | null = null;
  
  try {
    banContext = useBans();
  } catch (error) {
    console.error('Error initializing ban context:', error);
    banContextError = 'Ban management system not available';
    banContext = {
      banUser: () => Promise.resolve(false),
      getActiveBans: () => [],
      getBanStats: () => ({
        totalActiveBans: 0,
        temporaryBans: 0,
        permanentBans: 0,
        pendingAppeals: 0,
        recentBans24h: 0,
        bansByReason: {},
        appealStats: { totalAppeals: 0, pendingAppeals: 0, approvedAppeals: 0, rejectedAppeals: 0 }
      }),
      getBanInfo: () => null,
      validateBanInput: () => ({ valid: true })
    };
  }

  // State variables
  const [reports, setReports] = useState<ReportLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState<'all' | 'unprocessed' | 'processed'>('unprocessed');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'harassment' | 'spam' | 'inappropriate_content' | 'scam' | 'other'>('all');
  const [selectedReport, setSelectedReport] = useState<ReportLog | null>(null);
  const [expandedReports, setExpandedReports] = useState<Set<string>>(new Set());
  const [showBanModal, setShowBanModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'severity' | 'reporter'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [banForm, setBanForm] = useState({
    username: '',
    banType: 'temporary' as 'temporary' | 'permanent',
    hours: '24',
    reason: 'harassment' as any,
    customReason: '',
    notes: ''
  });
  const [isProcessingBan, setIsProcessingBan] = useState(false);
  const [reportBanInfo, setReportBanInfo] = useState<{[key: string]: any}>({});
  const [adminNotes, setAdminNotes] = useState('');
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Auto-save admin notes
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);

  // Load reports
  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = () => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('panty_report_logs');
      if (stored) {
        try {
          const parsed: ReportLog[] = JSON.parse(stored);
          const enhancedReports = parsed.map((report, index) => ({
            ...report,
            id: report.id || `report_${Date.now()}_${index}`,
            processed: report.processed || false,
            severity: report.severity || 'medium',
            category: report.category || 'other'
          }));
          enhancedReports.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setReports(enhancedReports);
          setLastRefresh(new Date());
        } catch (error) {
          console.error('Error parsing stored reports:', error);
          setReports([]);
        }
      }
    }
  };

  // Calculate user report statistics (for admin decision-making)
  const getUserReportStats = (username: string) => {
    const userReports = reports.filter(report => report.reportee === username);
    const activeReports = userReports.filter(report => !report.processed);
    const totalReports = userReports.length;
    
    // Get current ban status
    const banInfo = banContext && typeof banContext.getBanInfo === 'function' 
      ? banContext.getBanInfo(username) 
      : null;
    
    return {
      totalReports,
      activeReports: activeReports.length,
      processedReports: totalReports - activeReports.length,
      isBanned: !!banInfo,
      banInfo,
      reportHistory: userReports.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    };
  };

  // Calculate filtered and sorted reports
  const filteredAndSortedReports = (() => {
    let filtered = reports.filter(report => {
      if (!report) return false;
      
      const matchesSearch = searchTerm ? 
        (report.reporter && report.reporter.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (report.reportee && report.reportee.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (report.adminNotes && report.adminNotes.toLowerCase().includes(searchTerm.toLowerCase())) : true;
      
      const matchesFilter = filterBy === 'all' ? true :
        filterBy === 'processed' ? report.processed :
        !report.processed;
      
      const matchesSeverity = severityFilter === 'all' ? true :
        report.severity === severityFilter;
        
      const matchesCategory = categoryFilter === 'all' ? true :
        report.category === categoryFilter;
      
      return matchesSearch && matchesFilter && matchesSeverity && matchesCategory;
    });

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'severity':
          const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          comparison = (severityOrder[a.severity || 'medium'] || 2) - (severityOrder[b.severity || 'medium'] || 2);
          break;
        case 'reporter':
          comparison = (a.reporter || '').localeCompare(b.reporter || '');
          break;
        case 'date':
        default:
          comparison = new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime();
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return filtered;
  })();

  // Update ban info
  useEffect(() => {
    if (!banContext || !filteredAndSortedReports.length) return;
    
    const updateBanInfo = () => {
      try {
        const newBanInfo: {[key: string]: any} = {};
        const uniqueReportees = [...new Set(filteredAndSortedReports.map(r => r.reportee))];
        
        uniqueReportees.forEach(reportee => {
          if (reportee && typeof banContext.getBanInfo === 'function') {
            try {
              const banInfo = banContext.getBanInfo(reportee);
              newBanInfo[reportee] = banInfo;
            } catch (error) {
              console.error(`Error getting ban info for ${reportee}:`, error);
              newBanInfo[reportee] = null;
            }
          }
        });
        
        setReportBanInfo(newBanInfo);
      } catch (error) {
        console.error('Error updating ban info:', error);
      }
    };

    const timeoutId = setTimeout(updateBanInfo, 100);
    return () => clearTimeout(timeoutId);
  }, [filteredAndSortedReports, banContext]);

  // Save reports
  const saveReports = (newReports: ReportLog[]) => {
    setReports(newReports);
    localStorage.setItem('panty_report_logs', JSON.stringify(newReports));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('updateReports'));
    }
  };

  // Auto-save admin notes with debounce
  const saveAdminNotes = (reportId: string, notes: string) => {
    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
    }
    
    saveTimeout.current = setTimeout(() => {
      const updatedReports = reports.map(report => 
        report.id === reportId ? { ...report, adminNotes: notes } : report
      );
      saveReports(updatedReports);
    }, 1000); // Save after 1 second of no typing
  };

  // Toggle expanded state
  const toggleExpanded = (reportId: string) => {
    setExpandedReports(prev => {
      const newSet = new Set(prev);
      if (newSet.has(reportId)) {
        newSet.delete(reportId);
      } else {
        newSet.add(reportId);
      }
      return newSet;
    });
  };

  // Handle manual ban (simple admin decision)
  const handleManualBan = async (username: string, reason: any) => {
    if (!banContext || typeof banContext.banUser !== 'function') {
      alert('Ban system not available');
      return;
    }
    
    setIsProcessingBan(true);
    
    try {
      const duration = banForm.banType === 'permanent' ? 'permanent' : parseInt(banForm.hours);
      const adminUsername = user?.username || 'admin';
      const reportIds = selectedReport ? [selectedReport.id!] : [];
      
      if (typeof banContext.validateBanInput === 'function') {
        const validation = banContext.validateBanInput(username, duration, reason);
        if (!validation.valid) {
          alert(`Invalid ban parameters: ${validation.error}`);
          return;
        }
      }
      
      const success = await banContext.banUser(
        username,
        duration,
        reason,
        banForm.customReason || undefined,
        adminUsername,
        reportIds,
        banForm.notes
      );
      
      if (success) {
        if (selectedReport) {
          const updatedReports = reports.map(report => 
            report.id === selectedReport.id ? {
              ...report,
              processed: true,
              banApplied: true,
              processedBy: adminUsername,
              processedAt: new Date().toISOString(),
              adminNotes: (report.adminNotes || '') + `\n[Ban Applied: ${duration} ${duration === 'permanent' ? '' : 'hours'} for ${reason}]`
            } : report
          );
          saveReports(updatedReports);
          
          // Add to resolved reports
          const resolvedEntry = {
            reporter: selectedReport.reporter,
            reportee: selectedReport.reportee,
            date: new Date().toISOString(),
            resolvedBy: adminUsername,
            resolvedReason: `Ban applied: ${duration} ${duration === 'permanent' ? '' : 'hours'} for ${reason}`,
            banApplied: true,
            notes: selectedReport.adminNotes || 'No admin notes'
          };
          
          const existingResolved = localStorage.getItem('panty_report_resolved');
          const resolvedList = existingResolved ? JSON.parse(existingResolved) : [];
          resolvedList.push(resolvedEntry);
          localStorage.setItem('panty_report_resolved', JSON.stringify(resolvedList));
        }
        
        setReportBanInfo(prev => ({ ...prev, [username]: null }));
        
        setShowBanModal(false);
        resetBanForm();
        
        const durationText = duration === 'permanent' ? 'permanently' : `for ${duration} hours`;
        alert(`Successfully banned ${username} ${durationText}`);
      } else {
        alert('Failed to ban user. They may already be banned or invalid parameters provided.');
      }
    } catch (error) {
      console.error('Error applying ban:', error);
      alert('An error occurred while applying the ban.');
    } finally {
      setIsProcessingBan(false);
    }
  };

  // Reset ban form
  const resetBanForm = () => {
    setBanForm({
      username: '',
      banType: 'temporary',
      hours: '24',
      reason: 'harassment',
      customReason: '',
      notes: ''
    });
  };

  // Mark report as resolved
  const handleMarkResolved = (report: ReportLog) => {
    setSelectedReport(report);
    setShowResolveModal(true);
  };

  const confirmResolve = () => {
    if (!selectedReport) return;
    
    const adminUsername = user?.username || 'admin';
    
    // First, update the report as processed
    const updatedReports = reports.map(r => 
      r.id === selectedReport.id ? {
        ...r,
        processed: true,
        banApplied: false,
        processedBy: adminUsername,
        processedAt: new Date().toISOString(),
        adminNotes: (r.adminNotes || '') + '\n[Resolved without ban]'
      } : r
    );
    saveReports(updatedReports);
    
    // Then, add to resolved reports
    const resolvedEntry = {
      reporter: selectedReport.reporter,
      reportee: selectedReport.reportee,
      date: new Date().toISOString(),
      resolvedBy: adminUsername,
      resolvedReason: 'Resolved without ban',
      banApplied: false,
      notes: selectedReport.adminNotes || 'No admin notes'
    };
    
    const existingResolved = localStorage.getItem('panty_report_resolved');
    const resolvedList = existingResolved ? JSON.parse(existingResolved) : [];
    resolvedList.push(resolvedEntry);
    localStorage.setItem('panty_report_resolved', JSON.stringify(resolvedList));
    
    setShowResolveModal(false);
    setSelectedReport(null);
    alert(`Report marked as resolved without ban`);
  };

  // Delete report
  const handleDeleteReport = (reportId: string) => {
    if (confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
      const updatedReports = reports.filter(r => r.id !== reportId);
      saveReports(updatedReports);
      alert('Report deleted');
    }
  };

  // Update report severity
  const updateReportSeverity = (reportId: string, severity: ReportLog['severity']) => {
    const updatedReports = reports.map(r => 
      r.id === reportId ? { ...r, severity } : r
    );
    saveReports(updatedReports);
  };

  // Update report category
  const updateReportCategory = (reportId: string, category: ReportLog['category']) => {
    const updatedReports = reports.map(r => 
      r.id === reportId ? { ...r, category } : r
    );
    saveReports(updatedReports);
  };

  // Get severity color and icon
  const getSeverityInfo = (severity: ReportLog['severity']) => {
    switch (severity) {
      case 'low': 
        return { 
          color: 'text-green-400 bg-green-900/20', 
          icon: Activity, 
          label: 'Low' 
        };
      case 'medium': 
        return { 
          color: 'text-yellow-400 bg-yellow-900/20', 
          icon: AlertCircle, 
          label: 'Medium' 
        };
      case 'high': 
        return { 
          color: 'text-orange-400 bg-orange-900/20', 
          icon: AlertTriangle, 
          label: 'High' 
        };
      case 'critical': 
        return { 
          color: 'text-red-400 bg-red-900/20', 
          icon: ShieldAlert, 
          label: 'Critical' 
        };
      default: 
        return { 
          color: 'text-gray-400 bg-gray-900/20', 
          icon: Info, 
          label: 'Unknown' 
        };
    }
  };

  // Get category icon
  const getCategoryIcon = (category: ReportLog['category']) => {
    switch (category) {
      case 'harassment': return AlertTriangle;
      case 'spam': return MessageSquare;
      case 'inappropriate_content': return EyeOff;
      case 'scam': return ShieldAlert;
      default: return Flag;
    }
  };

  // Get ban stats
  const banStats = banContext && typeof banContext.getBanStats === 'function' ? 
    banContext.getBanStats() : {
      totalActiveBans: 0,
      temporaryBans: 0,
      permanentBans: 0,
      pendingAppeals: 0,
      recentBans24h: 0,
      bansByReason: {},
      appealStats: { totalAppeals: 0, pendingAppeals: 0, approvedAppeals: 0, rejectedAppeals: 0 }
    };

  // Calculate report stats
  const reportStats = {
    total: reports.length,
    unprocessed: reports.filter(r => !r.processed).length,
    processed: reports.filter(r => r.processed).length,
    critical: reports.filter(r => r.severity === 'critical' && !r.processed).length,
    today: reports.filter(r => {
      const reportDate = new Date(r.date);
      const today = new Date();
      return reportDate.toDateString() === today.toDateString();
    }).length,
    withBans: reports.filter(r => r.banApplied).length
  };

  return (
    <RequireAuth role="admin">
      <main className="p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#ff950e] flex items-center">
              <Shield className="mr-3" />
              Reports & Moderation
            </h1>
            <p className="text-gray-400 mt-1">
              Review user reports and make manual ban decisions
            </p>
            {banContextError && (
              <p className="text-red-400 text-sm mt-2 flex items-center">
                <AlertTriangle size={14} className="mr-1" />
                {banContextError}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-400">
              Last refresh: {lastRefresh.toLocaleTimeString()}
            </div>
            <button
              onClick={loadReports}
              className="px-4 py-2 bg-[#ff950e] text-black rounded-lg hover:bg-[#e88800] flex items-center font-medium transition-colors"
            >
              <RefreshCw size={16} className="mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 text-center hover:border-gray-700 transition-colors">
            <div className="text-2xl font-bold text-white">{reportStats.total}</div>
            <div className="text-xs text-gray-400">Total Reports</div>
          </div>
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 text-center hover:border-gray-700 transition-colors">
            <div className="text-2xl font-bold text-yellow-400">{reportStats.unprocessed}</div>
            <div className="text-xs text-gray-400">Pending</div>
          </div>
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 text-center hover:border-gray-700 transition-colors">
            <div className="text-2xl font-bold text-red-400">{reportStats.critical}</div>
            <div className="text-xs text-gray-400">Critical</div>
          </div>
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 text-center hover:border-gray-700 transition-colors">
            <div className="text-2xl font-bold text-blue-400">{reportStats.today}</div>
            <div className="text-xs text-gray-400">Today</div>
          </div>
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 text-center hover:border-gray-700 transition-colors">
            <div className="text-2xl font-bold text-green-400">{reportStats.processed}</div>
            <div className="text-xs text-gray-400">Processed</div>
          </div>
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 text-center hover:border-gray-700 transition-colors">
            <div className="text-2xl font-bold text-purple-400">{reportStats.withBans}</div>
            <div className="text-xs text-gray-400">Resulted in Bans</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative xl:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search by username or notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#222] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e] transition-all"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as any)}
              className="px-3 py-2 bg-[#222] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
            >
              <option value="all">All Reports</option>
              <option value="unprocessed">Unprocessed</option>
              <option value="processed">Processed</option>
            </select>

            {/* Severity Filter */}
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as any)}
              className="px-3 py-2 bg-[#222] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as any)}
              className="px-3 py-2 bg-[#222] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
            >
              <option value="all">All Categories</option>
              <option value="harassment">Harassment</option>
              <option value="spam">Spam</option>
              <option value="inappropriate_content">Inappropriate Content</option>
              <option value="scam">Scam</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Sort Options */}
          <div className="flex gap-2 mt-4">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-[#222] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
            >
              <option value="date">Sort by Date</option>
              <option value="severity">Sort by Severity</option>
              <option value="reporter">Sort by Reporter</option>
            </select>
            <button
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 bg-[#222] border border-gray-700 rounded-lg text-white hover:bg-[#333] transition-colors"
            >
              {sortOrder === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>

        {/* Reports List */}
        {filteredAndSortedReports.length === 0 ? (
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-8 text-center">
            <AlertTriangle size={48} className="mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400 text-lg">No reports found</p>
            {searchTerm && (
              <p className="text-gray-500 text-sm mt-2">
                Try adjusting your search terms or filters
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAndSortedReports.map((report) => {
              if (!report || !report.id || !report.reportee) {
                return null;
              }
              
              const userBanInfo = reportBanInfo[report.reportee];
              const userStats = getUserReportStats(report.reportee);
              const severityInfo = getSeverityInfo(report.severity);
              const CategoryIcon = getCategoryIcon(report.category);
              const isExpanded = expandedReports.has(report.id);
              
              return (
                <div 
                  key={report.id} 
                  className={`bg-[#1a1a1a] border ${
                    report.severity === 'critical' ? 'border-red-800' : 
                    report.severity === 'high' ? 'border-orange-800' : 
                    'border-gray-800'
                  } rounded-lg overflow-hidden hover:border-gray-700 transition-all`}
                >
                  {/* Report Header - Clickable */}
                  <div 
                    className="p-6 cursor-pointer"
                    onClick={() => toggleExpanded(report.id!)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <div className="flex items-center gap-2">
                            <User size={16} className="text-gray-400" />
                            <span className="font-semibold text-white">
                              {report.reporter} → {report.reportee}
                            </span>
                          </div>
                          
                          {/* Status Badges */}
                          {userBanInfo && (
                            <span className="px-2 py-1 bg-red-900/20 text-red-400 text-xs rounded font-medium">
                              BANNED
                            </span>
                          )}
                          
                          {/* User Report History - Simple Count */}
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 bg-purple-900/20 text-purple-400 text-xs rounded font-medium flex items-center gap-1">
                              <Users size={12} />
                              {userStats.totalReports} Total Reports
                            </span>
                            {userStats.activeReports > 0 && (
                              <span className="px-2 py-1 bg-red-900/20 text-red-400 text-xs rounded font-medium">
                                {userStats.activeReports} Active
                              </span>
                            )}
                          </div>
                          
                          {report.processed ? (
                            <span className="flex items-center gap-1 px-2 py-1 bg-green-900/20 text-green-400 text-xs rounded font-medium">
                              <CheckCircle size={12} />
                              Processed
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 px-2 py-1 bg-yellow-900/20 text-yellow-400 text-xs rounded font-medium">
                              <Clock size={12} />
                              Pending
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-6 text-sm">
                          {/* Severity */}
                          <div className="flex items-center gap-2">
                            <severityInfo.icon size={14} className={severityInfo.color.split(' ')[0]} />
                            <select
                              value={report.severity}
                              onChange={(e) => {
                                e.stopPropagation();
                                updateReportSeverity(report.id!, e.target.value as any);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className={`px-2 py-0.5 text-xs rounded border-0 font-medium ${severityInfo.color} bg-opacity-20`}
                            >
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                              <option value="critical">Critical</option>
                            </select>
                          </div>
                          
                          {/* Category */}
                          <div className="flex items-center gap-2">
                            <CategoryIcon size={14} className="text-gray-400" />
                            <select
                              value={report.category}
                              onChange={(e) => {
                                e.stopPropagation();
                                updateReportCategory(report.id!, e.target.value as any);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="px-2 py-0.5 text-xs rounded bg-gray-800 text-gray-300 border-0"
                            >
                              <option value="harassment">Harassment</option>
                              <option value="spam">Spam</option>
                              <option value="inappropriate_content">Inappropriate</option>
                              <option value="scam">Scam</option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                          
                          {/* Date */}
                          <div className="flex items-center gap-1 text-gray-400">
                            <Calendar size={14} />
                            {new Date(report.date).toLocaleString()}
                          </div>
                          
                          {report.processedBy && (
                            <div className="flex items-center gap-1 text-gray-400">
                              <CheckCircle size={14} />
                              by {report.processedBy}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <span className="text-gray-400">
                          {report.messages ? report.messages.length : 0} messages
                        </span>
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t border-gray-800 p-6 space-y-4 bg-[#0a0a0a]">
                      {/* User Report History - Simple Statistics */}
                      <div className="p-3 bg-purple-900/10 border border-purple-800 rounded-lg">
                        <div className="flex items-center gap-2 text-purple-400 mb-2">
                          <BarChart3 size={16} />
                          <span className="font-medium">Report Summary for {report.reportee}</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-400">Total Reports:</span>
                            <span className="text-white ml-2 font-medium">{userStats.totalReports}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Active Reports:</span>
                            <span className="text-red-400 ml-2 font-medium">{userStats.activeReports}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Processed Reports:</span>
                            <span className="text-green-400 ml-2 font-medium">{userStats.processedReports}</span>
                          </div>
                        </div>
                        
                        {userStats.isBanned && (
                          <div className="mt-3 p-2 bg-red-900/20 border border-red-800 rounded">
                            <div className="text-red-400 text-sm font-medium">Currently Banned</div>
                            <div className="text-gray-300 text-xs">
                              {userStats.banInfo?.banType === 'permanent' ? 'Permanent ban' : 
                               `${userStats.banInfo?.remainingHours || 0} hours remaining`}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Messages */}
                      <div>
                        <div className="text-sm text-gray-400 mb-2 flex items-center gap-1">
                          <MessageSquare size={14} />
                          Conversation ({report.messages ? report.messages.length : 0} messages)
                        </div>
                        {report.messages && report.messages.length > 0 && (
                          <div className="bg-[#222] rounded-lg p-3 max-h-64 overflow-y-auto space-y-2">
                            {report.messages.map((msg, i) => (
                              <div key={i} className="border-b border-gray-700 last:border-0 pb-2 last:pb-0">
                                <div className="flex justify-between items-start mb-1">
                                  <span className="font-medium text-[#ff950e]">{msg.sender}</span>
                                  <span className="text-xs text-gray-500">
                                    {new Date(msg.date).toLocaleString()}
                                  </span>
                                </div>
                                <p className="text-gray-300 text-sm">{msg.content}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Admin Notes */}
                      <div>
                        <div className="text-sm text-gray-400 mb-2 flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <FileText size={14} />
                            Admin Notes
                          </span>
                          {editingReportId === report.id ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingReportId(null);
                              }}
                              className="text-xs text-blue-400 hover:text-blue-300"
                            >
                              Done
                            </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingReportId(report.id!);
                                setAdminNotes(report.adminNotes || '');
                              }}
                              className="text-xs text-blue-400 hover:text-blue-300"
                            >
                              Edit
                            </button>
                          )}
                        </div>
                        {editingReportId === report.id ? (
                          <textarea
                            value={adminNotes}
                            onChange={(e) => {
                              setAdminNotes(e.target.value);
                              saveAdminNotes(report.id!, e.target.value);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full p-3 bg-[#222] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e] resize-none"
                            rows={3}
                            placeholder="Add notes about this report..."
                          />
                        ) : (
                          <div className="p-3 bg-[#222] rounded-lg text-gray-300 text-sm">
                            {report.adminNotes || <span className="text-gray-500 italic">No notes added</span>}
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2 pt-2">
                        {!report.processed && (
                          <>
                            {/* Quick Ban Buttons */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedReport(report);
                                setBanForm(prev => ({ 
                                  ...prev, 
                                  username: report.reportee,
                                  reason: report.category || 'harassment',
                                  hours: '1'
                                }));
                                setShowBanModal(true);
                              }}
                              className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 flex items-center transition-colors"
                              disabled={!banContext}
                            >
                              <Timer size={12} className="mr-1" />
                              Ban 1 Hour
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedReport(report);
                                setBanForm(prev => ({ 
                                  ...prev, 
                                  username: report.reportee,
                                  reason: report.category || 'harassment',
                                  hours: '24'
                                }));
                                setShowBanModal(true);
                              }}
                              className="px-3 py-1 bg-orange-600 text-white text-sm rounded hover:bg-orange-700 flex items-center transition-colors"
                              disabled={!banContext}
                            >
                              <Timer size={12} className="mr-1" />
                              Ban 24 Hours
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedReport(report);
                                setBanForm(prev => ({ 
                                  ...prev, 
                                  username: report.reportee,
                                  reason: report.category || 'harassment',
                                  hours: '168'
                                }));
                                setShowBanModal(true);
                              }}
                              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 flex items-center transition-colors"
                              disabled={!banContext}
                            >
                              <Timer size={12} className="mr-1" />
                              Ban 7 Days
                            </button>
                            
                            {/* Custom Ban */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedReport(report);
                                setBanForm(prev => ({ 
                                  ...prev, 
                                  username: report.reportee,
                                  reason: report.category || 'harassment'
                                }));
                                setShowBanModal(true);
                              }}
                              className="px-3 py-1 bg-red-700 text-white text-sm rounded hover:bg-red-800 flex items-center transition-colors"
                              disabled={!banContext}
                            >
                              <Ban size={12} className="mr-1" />
                              Custom Ban
                            </button>
                            
                            {/* Resolve without ban */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkResolved(report);
                              }}
                              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 flex items-center transition-colors"
                            >
                              <CheckCircle size={12} className="mr-1" />
                              Resolve (No Ban)
                            </button>
                          </>
                        )}
                        
                        {/* Delete */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteReport(report.id!);
                          }}
                          className="px-3 py-1 bg-red-800 text-white text-sm rounded hover:bg-red-900 flex items-center transition-colors"
                        >
                          <Trash2 size={12} className="mr-1" />
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Custom Ban Modal */}
        {showBanModal && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <Ban className="mr-2 text-red-400" />
                Manual Ban Decision
              </h3>
              
              <div className="space-y-4">
                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Username</label>
                  <input
                    type="text"
                    value={banForm.username}
                    onChange={(e) => setBanForm(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#222] border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
                  />
                </div>
                
                {/* Ban Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Ban Type</label>
                  <select
                    value={banForm.banType}
                    onChange={(e) => setBanForm(prev => ({ ...prev, banType: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-[#222] border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
                  >
                    <option value="temporary">Temporary</option>
                    <option value="permanent">Permanent</option>
                  </select>
                </div>
                
                {/* Duration (if temporary) */}
                {banForm.banType === 'temporary' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Duration (hours)</label>
                    <input
                      type="number"
                      min="1"
                      max="8760"
                      value={banForm.hours}
                      onChange={(e) => setBanForm(prev => ({ ...prev, hours: e.target.value }))}
                      className="w-full px-3 py-2 bg-[#222] border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
                    />
                  </div>
                )}
                
                {/* Reason */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Reason</label>
                  <select
                    value={banForm.reason}
                    onChange={(e) => setBanForm(prev => ({ ...prev, reason: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#222] border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
                  >
                    <option value="harassment">Harassment</option>
                    <option value="spam">Spam</option>
                    <option value="inappropriate_content">Inappropriate Content</option>
                    <option value="scam">Scam/Fraud</option>
                    <option value="underage">Underage</option>
                    <option value="payment_fraud">Payment Fraud</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                {/* Custom Reason */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Custom Reason (optional)</label>
                  <input
                    type="text"
                    value={banForm.customReason}
                    onChange={(e) => setBanForm(prev => ({ ...prev, customReason: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#222] border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
                    placeholder="Additional details..."
                  />
                </div>
                
                {/* Admin Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Admin Notes</label>
                  <textarea
                    value={banForm.notes}
                    onChange={(e) => setBanForm(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#222] border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
                    rows={3}
                    placeholder="Internal notes about this ban..."
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowBanModal(false);
                    resetBanForm();
                  }}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                  disabled={isProcessingBan}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleManualBan(banForm.username, banForm.reason)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center justify-center transition-colors"
                  disabled={isProcessingBan}
                >
                  {isProcessingBan ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Applying...
                    </>
                  ) : (
                    <>
                      <Ban size={16} className="mr-2" />
                      Apply Ban
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Resolve Modal */}
        {showResolveModal && selectedReport && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <CheckCircle className="mr-2 text-green-400" />
                Resolve Report
              </h3>
              
              <p className="text-gray-300 mb-4">
                Are you sure you want to mark this report as resolved without applying a ban?
              </p>
              
              <div className="bg-[#222] rounded-lg p-3 mb-4">
                <div className="text-sm text-gray-400">Reporter: <span className="text-white">{selectedReport.reporter}</span></div>
                <div className="text-sm text-gray-400">Reported: <span className="text-white">{selectedReport.reportee}</span></div>
                <div className="text-sm text-gray-400">Date: <span className="text-white">{new Date(selectedReport.date).toLocaleString()}</span></div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowResolveModal(false);
                    setSelectedReport(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmResolve}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center justify-center transition-colors"
                >
                  <CheckCircle size={16} className="mr-2" />
                  Confirm Resolve
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </RequireAuth>
  );
}
