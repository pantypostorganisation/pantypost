// src/app/admin/reports/page.tsx
'use client';

import { useEffect, useState } from 'react';
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
  Zap,
  Brain,
  Scale,
  Lightbulb
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
  const { user } = useListings();
  const { 
    banUser, 
    getActiveBans, 
    getBanStats, 
    getBanInfo, 
    getRecommendedBanDuration, 
    getUserEscalation,
    validateBanInput
  } = useBans();
  
  const [reports, setReports] = useState<ReportLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState<'all' | 'unprocessed' | 'processed'>('unprocessed');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all');
  const [selectedReport, setSelectedReport] = useState<ReportLog | null>(null);
  const [showBanModal, setShowBanModal] = useState(false);
  const [showRecommendationModal, setShowRecommendationModal] = useState(false);
  const [banForm, setBanForm] = useState({
    username: '',
    banType: 'temporary' as 'temporary' | 'permanent',
    hours: '24',
    reason: 'harassment' as any,
    customReason: '',
    notes: ''
  });
  const [recommendation, setRecommendation] = useState<any>(null);
  const [isProcessingBan, setIsProcessingBan] = useState(false);
  
  // ✅ Safe state for ban info to prevent render-time state updates
  const [reportBanInfo, setReportBanInfo] = useState<{[key: string]: any}>({});

  // Load reports
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('panty_report_logs');
      if (stored) {
        const parsed: ReportLog[] = JSON.parse(stored);
        // Add IDs and additional fields if missing
        const enhancedReports = parsed.map((report, index) => ({
          ...report,
          id: report.id || `report_${Date.now()}_${index}`,
          processed: report.processed || false,
          severity: report.severity || 'medium',
          category: report.category || 'other'
        }));
        enhancedReports.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setReports(enhancedReports);
      }
    }
  }, []);

  // ✅ Safely update ban info without triggering render-time state updates
  useEffect(() => {
    const updateBanInfo = () => {
      try {
        const newBanInfo: {[key: string]: any} = {};
        let hasChanges = false;
        
        // Get unique reportees from filtered reports
        const uniqueReportees = [...new Set(filteredReports.map(r => r.reportee))];
        
        uniqueReportees.forEach(reportee => {
          try {
            // Only check if we don't already have recent info
            const banInfo = getBanInfo(reportee);
            if (JSON.stringify(banInfo) !== JSON.stringify(reportBanInfo[reportee])) {
              newBanInfo[reportee] = banInfo;
              hasChanges = true;
            }
          } catch (error) {
            console.error(`Error getting ban info for ${reportee}:`, error);
            newBanInfo[reportee] = null;
            hasChanges = true;
          }
        });
        
        if (hasChanges) {
          setReportBanInfo(prev => ({ ...prev, ...newBanInfo }));
        }
      } catch (error) {
        console.error('Error updating ban info:', error);
      }
    };

    // Debounce the update to prevent excessive calls
    const timeoutId = setTimeout(updateBanInfo, 100);
    return () => clearTimeout(timeoutId);
  }, [filteredReports, getBanInfo]); // Dependencies

  // Save reports
  const saveReports = (newReports: ReportLog[]) => {
    setReports(newReports);
    localStorage.setItem('panty_report_logs', JSON.stringify(newReports));
    window.dispatchEvent(new Event('updateReports'));
  };

  // Filter reports
  const filteredReports = reports.filter(report => {
    const matchesSearch = searchTerm ? 
      report.reporter.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reportee.toLowerCase().includes(searchTerm.toLowerCase()) : true;
    
    const matchesFilter = filterBy === 'all' ? true :
      filterBy === 'processed' ? report.processed :
      !report.processed;
    
    const matchesSeverity = severityFilter === 'all' ? true :
      report.severity === severityFilter;
    
    return matchesSearch && matchesFilter && matchesSeverity;
  });

  // Get escalation info for a user - with error handling
  const getEscalationInfo = (username: string) => {
    try {
      return getUserEscalation(username);
    } catch (error) {
      console.error('Error getting escalation info:', error);
      return {
        username,
        offenseCount: 0,
        lastOffenseDate: '',
        escalationLevel: 0,
        offenseHistory: []
      };
    }
  };

  // Show recommendation modal
  const showBanRecommendation = (username: string, reason: any) => {
    try {
      const rec = getRecommendedBanDuration(username, reason);
      const escalation = getEscalationInfo(username);
      setRecommendation({ ...rec, escalation, username, reason });
      setShowRecommendationModal(true);
    } catch (error) {
      console.error('Error getting recommendation:', error);
      alert('Error getting ban recommendation');
    }
  };

  // Handle intelligent ban with recommendation
  const handleIntelligentBan = async (username: string, reason: any, useRecommendation: boolean = true) => {
    setIsProcessingBan(true);
    
    try {
      let duration: number | 'permanent';
      let notes = '';
      
      if (useRecommendation && recommendation) {
        duration = recommendation.duration;
        notes = `Progressive discipline - ${recommendation.reasoning}`;
      } else {
        duration = banForm.banType === 'permanent' ? 'permanent' : parseInt(banForm.hours);
        notes = banForm.notes;
      }
      
      const adminUsername = user?.username || 'admin';
      const reportIds = selectedReport ? [selectedReport.id!] : [];
      
      // Validate the ban input
      const validation = validateBanInput(username, duration, reason);
      if (!validation.valid) {
        alert(`Invalid ban parameters: ${validation.error}`);
        return;
      }
      
      const success = await banUser(
        username,
        duration,
        reason,
        banForm.customReason || undefined,
        adminUsername,
        reportIds,
        notes
      );
      
      if (success) {
        // Mark report as processed with ban applied
        if (selectedReport) {
          const updatedReports = reports.map(report => 
            report.id === selectedReport.id ? {
              ...report,
              processed: true,
              banApplied: true,
              processedBy: adminUsername,
              processedAt: new Date().toISOString(),
              adminNotes: notes
            } : report
          );
          saveReports(updatedReports);
        }
        
        // Clear ban info cache for this user
        setReportBanInfo(prev => ({ ...prev, [username]: null }));
        
        setShowBanModal(false);
        setShowRecommendationModal(false);
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
    setRecommendation(null);
  };

  // Handle quick ban with intelligence
  const handleQuickBan = async (username: string, hours: number, reason: string) => {
    // Show recommendation first for transparency
    showBanRecommendation(username, reason as any);
  };

  // Mark report as resolved without ban
  const handleMarkResolved = (report: ReportLog) => {
    const adminUsername = user?.username || 'admin';
    const updatedReports = reports.map(r => 
      r.id === report.id ? {
        ...r,
        processed: true,
        banApplied: false,
        processedBy: adminUsername,
        processedAt: new Date().toISOString()
      } : r
    );
    saveReports(updatedReports);
    alert(`Marked report as resolved without ban`);
  };

  // Delete report
  const handleDeleteReport = (reportId: string) => {
    const updatedReports = reports.filter(r => r.id !== reportId);
    saveReports(updatedReports);
    alert('Report deleted');
  };

  // Update report severity
  const updateReportSeverity = (reportId: string, severity: ReportLog['severity']) => {
    const updatedReports = reports.map(r => 
      r.id === reportId ? { ...r, severity } : r
    );
    saveReports(updatedReports);
  };

  // Get severity color
  const getSeverityColor = (severity: ReportLog['severity']) => {
    switch (severity) {
      case 'low': return 'text-green-400 bg-green-900/20';
      case 'medium': return 'text-yellow-400 bg-yellow-900/20';
      case 'high': return 'text-orange-400 bg-orange-900/20';
      case 'critical': return 'text-red-400 bg-red-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  // Get escalation level color
  const getEscalationColor = (level: number) => {
    if (level <= 1) return 'text-green-400';
    if (level <= 2) return 'text-yellow-400';
    if (level <= 3) return 'text-orange-400';
    if (level <= 4) return 'text-red-400';
    return 'text-purple-400';
  };

  // Get ban stats
  const banStats = getBanStats();

  return (
    <RequireAuth role="admin">
      <main className="p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#ff950e] flex items-center">
              <Shield className="mr-3" />
              Intelligent Reports & Moderation
            </h1>
            <p className="text-gray-400 mt-1">
              AI-powered progressive discipline system with escalation tracking
            </p>
          </div>
          
          {/* Enhanced Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-400">{banStats.totalActiveBans}</div>
              <div className="text-xs text-gray-400">Active Bans</div>
            </div>
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400">{filteredReports.filter(r => !r.processed).length}</div>
              <div className="text-xs text-gray-400">Pending</div>
            </div>
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-orange-400">{banStats.appealStats.pendingAppeals}</div>
              <div className="text-xs text-gray-400">Appeals</div>
            </div>
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-400">{banStats.escalationStats.level4 + banStats.escalationStats.level5}</div>
              <div className="text-xs text-gray-400">High Risk</div>
            </div>
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">{banStats.recentBans24h}</div>
              <div className="text-xs text-gray-400">24h Bans</div>
            </div>
          </div>
        </div>

        {/* Enhanced Filters */}
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search by username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#222] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
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

            {/* Refresh */}
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-[#ff950e] text-black rounded-lg hover:bg-[#e88800] flex items-center font-medium"
            >
              <RefreshCw size={16} className="mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Reports List */}
        {filteredReports.length === 0 ? (
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-8 text-center">
            <AlertTriangle size={48} className="mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400 text-lg">No reports found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReports.map((report) => {
              // ✅ Safe access to ban info - no function calls during render
              const userBanInfo = reportBanInfo[report.reportee];
              const escalationInfo = getEscalationInfo(report.reportee);
              
              return (
                <div key={report.id} className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6">
                  {/* Report Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <User size={16} className="text-gray-400" />
                          <span className="font-semibold text-white">
                            {report.reporter} → {report.reportee}
                          </span>
                          {userBanInfo && (
                            <span className="px-2 py-1 bg-red-900/20 text-red-400 text-xs rounded font-medium">
                              BANNED
                            </span>
                          )}
                          {escalationInfo && escalationInfo.escalationLevel > 0 && (
                            <span className={`px-2 py-1 text-xs rounded font-medium ${getEscalationColor(escalationInfo.escalationLevel)} bg-opacity-20`}>
                              Level {escalationInfo.escalationLevel} ({escalationInfo.offenseCount} offenses)
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-400 flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            {new Date(report.date).toLocaleString()}
                          </span>
                          {report.processedBy && (
                            <span className="flex items-center gap-1">
                              <CheckCircle size={14} />
                              Processed by {report.processedBy}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Severity Badge */}
                    <div className="flex items-center gap-2">
                      <select
                        value={report.severity}
                        onChange={(e) => updateReportSeverity(report.id!, e.target.value as any)}
                        className={`px-2 py-1 text-xs rounded border-0 font-medium ${getSeverityColor(report.severity)}`}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                      
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
                  </div>

                  {/* Escalation Info */}
                  {escalationInfo && escalationInfo.escalationLevel > 0 && (
                    <div className="mb-4 p-3 bg-purple-900/10 border border-purple-800 rounded-lg">
                      <div className="flex items-center gap-2 text-purple-400 mb-2">
                        <TrendingUp size={16} />
                        <span className="font-medium">User History & Risk Assessment</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Escalation Level:</span>
                          <span className={`ml-2 font-medium ${getEscalationColor(escalationInfo.escalationLevel)}`}>
                            Level {escalationInfo.escalationLevel}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400">Total Offenses:</span>
                          <span className="text-white ml-2">{escalationInfo.offenseCount}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Last Offense:</span>
                          <span className="text-white ml-2">
                            {escalationInfo.lastOffenseDate ? new Date(escalationInfo.lastOffenseDate).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                      </div>
                      
                      {escalationInfo.offenseHistory.length > 0 && (
                        <div className="mt-3">
                          <div className="text-gray-400 text-xs mb-2">Recent Violations:</div>
                          <div className="flex flex-wrap gap-2">
                            {escalationInfo.offenseHistory.slice(-3).map((offense, i) => (
                              <span key={i} className="px-2 py-1 bg-gray-900/50 text-gray-300 text-xs rounded">
                                {offense.reason} ({new Date(offense.date).toLocaleDateString()})
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Messages Preview */}
                  <div className="mb-4">
                    <div className="text-sm text-gray-400 mb-2 flex items-center gap-1">
                      <MessageSquare size={14} />
                      {report.messages.length} message(s) in conversation
                    </div>
                    <div className="bg-[#222] rounded-lg p-3 max-h-32 overflow-y-auto">
                      {report.messages.slice(-2).map((msg, i) => (
                        <div key={i} className="text-sm mb-2">
                          <span className="text-[#ff950e] font-medium">{msg.sender}:</span>
                          <span className="text-gray-300 ml-2">{msg.content}</span>
                        </div>
                      ))}
                      {report.messages.length > 2 && (
                        <div className="text-xs text-gray-500">... and {report.messages.length - 2} more messages</div>
                      )}
                    </div>
                  </div>

                  {/* Admin Notes */}
                  {report.adminNotes && (
                    <div className="mb-4 p-3 bg-blue-900/20 border border-blue-800 rounded-lg">
                      <div className="text-sm text-blue-400 font-medium mb-1">Admin Notes:</div>
                      <div className="text-sm text-gray-300">{report.adminNotes}</div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    {!report.processed && (
                      <>
                        {/* Intelligent Ban Button */}
                        <button
                          onClick={() => showBanRecommendation(report.reportee, 'harassment')}
                          className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 flex items-center"
                        >
                          <Brain size={12} className="mr-1" />
                          Smart Ban
                        </button>
                        
                        {/* Quick Ban Buttons */}
                        <button
                          onClick={() => handleQuickBan(report.reportee, 1, 'harassment')}
                          className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 flex items-center"
                        >
                          <Timer size={12} className="mr-1" />
                          1 Hour
                        </button>
                        <button
                          onClick={() => handleQuickBan(report.reportee, 24, 'harassment')}
                          className="px-3 py-1 bg-orange-600 text-white text-sm rounded hover:bg-orange-700 flex items-center"
                        >
                          <Timer size={12} className="mr-1" />
                          24 Hours
                        </button>
                        <button
                          onClick={() => handleQuickBan(report.reportee, 168, 'harassment')}
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 flex items-center"
                        >
                          <Timer size={12} className="mr-1" />
                          7 Days
                        </button>
                        
                        {/* Custom Ban */}
                        <button
                          onClick={() => {
                            setSelectedReport(report);
                            setBanForm(prev => ({ ...prev, username: report.reportee }));
                            setShowBanModal(true);
                          }}
                          className="px-3 py-1 bg-red-700 text-white text-sm rounded hover:bg-red-800 flex items-center"
                        >
                          <Ban size={12} className="mr-1" />
                          Custom Ban
                        </button>
                        
                        {/* Resolve without ban */}
                        <button
                          onClick={() => handleMarkResolved(report)}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 flex items-center"
                        >
                          <CheckCircle size={12} className="mr-1" />
                          Resolve (No Ban)
                        </button>
                      </>
                    )}
                    
                    {/* View Details */}
                    <button
                      onClick={() => setSelectedReport(selectedReport?.id === report.id ? null : report)}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center"
                    >
                      <Eye size={12} className="mr-1" />
                      {selectedReport?.id === report.id ? 'Hide' : 'View'} Details
                    </button>
                    
                    {/* Delete */}
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this report?')) {
                          handleDeleteReport(report.id!);
                        }
                      }}
                      className="px-3 py-1 bg-red-800 text-white text-sm rounded hover:bg-red-900 flex items-center"
                    >
                      <Trash2 size={12} className="mr-1" />
                      Delete
                    </button>
                  </div>
                  
                  {/* Expanded Details */}
                  {selectedReport?.id === report.id && (
                    <div className="mt-4 pt-4 border-t border-gray-700">
                      <h4 className="text-lg font-semibold text-white mb-3">Full Conversation</h4>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {report.messages.map((msg, i) => (
                          <div key={i} className="bg-[#222] p-3 rounded">
                            <div className="flex justify-between items-start mb-1">
                              <span className="font-medium text-[#ff950e]">{msg.sender}</span>
                              <span className="text-xs text-gray-500">
                                {new Date(msg.date).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-gray-300">{msg.content}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Smart Recommendation Modal */}
        {showRecommendationModal && recommendation && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <Brain className="mr-2 text-purple-400" />
                Intelligent Ban Recommendation
              </h3>
              
              <div className="space-y-6">
                {/* User Info */}
                <div className="bg-[#222] rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <Target size={16} className="text-blue-400" />
                    User Assessment: {recommendation.username}
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Current Level:</span>
                      <span className={`ml-2 font-medium ${getEscalationColor(recommendation.escalation?.escalationLevel || 0)}`}>
                        Level {recommendation.escalation?.escalationLevel || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Total Offenses:</span>
                      <span className="text-white ml-2">{recommendation.escalation?.offenseCount || 0}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Recommended Level:</span>
                      <span className={`ml-2 font-medium ${getEscalationColor(recommendation.level)}`}>
                        Level {recommendation.level}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Violation Type:</span>
                      <span className="text-white ml-2 capitalize">{recommendation.reason.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>
                
                {/* Recommendation */}
                <div className="bg-purple-900/20 border border-purple-800 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-400 mb-3 flex items-center gap-2">
                    <Lightbulb size={16} />
                    AI Recommendation
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <span className="text-gray-400">Recommended Action:</span>
                      <span className="text-white ml-2 font-medium">
                        {recommendation.duration === 'permanent' ? 'Permanent Ban' : `${recommendation.duration} Hour Ban`}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Reasoning:</span>
                      <p className="text-gray-300 mt-1 text-sm">{recommendation.reasoning}</p>
                    </div>
                  </div>
                </div>
                
                {/* Escalation History */}
                {recommendation.escalation?.offenseHistory?.length > 0 && (
                  <div className="bg-[#222] rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                      <BarChart3 size={16} className="text-orange-400" />
                      Violation History
                    </h4>
                    <div className="space-y-2">
                      {recommendation.escalation.offenseHistory.slice(-5).map((offense: any, i: number) => (
                        <div key={i} className="flex justify-between items-center text-sm">
                          <span className="text-gray-300 capitalize">{offense.reason.replace('_', ' ')}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400">Weight: {offense.weight}</span>
                            <span className="text-gray-500">{new Date(offense.date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowRecommendationModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                  disabled={isProcessingBan}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowBanModal(true);
                    setBanForm(prev => ({ 
                      ...prev, 
                      username: recommendation.username,
                      banType: recommendation.duration === 'permanent' ? 'permanent' : 'temporary',
                      hours: recommendation.duration === 'permanent' ? '24' : recommendation.duration.toString(),
                      reason: recommendation.reason,
                      notes: `Progressive discipline - ${recommendation.reasoning}`
                    }));
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center"
                  disabled={isProcessingBan}
                >
                  <Scale size={16} className="mr-2" />
                  Customize
                </button>
                <button
                  onClick={() => handleIntelligentBan(recommendation.username, recommendation.reason, true)}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center justify-center"
                  disabled={isProcessingBan}
                >
                  {isProcessingBan ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Applying...
                    </>
                  ) : (
                    <>
                      <Zap size={16} className="mr-2" />
                      Apply Recommendation
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Custom Ban Modal */}
        {showBanModal && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <Ban className="mr-2 text-red-400" />
                Custom Ban User
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
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                  disabled={isProcessingBan}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleIntelligentBan(banForm.username, banForm.reason, false)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center justify-center"
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
      </main>
    </RequireAuth>
  );
}
