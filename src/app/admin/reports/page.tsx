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
  RefreshCw
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
  const { banUser, getActiveBans, getBanStats, getBanInfo } = useBans();
  
  const [reports, setReports] = useState<ReportLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState<'all' | 'unprocessed' | 'processed'>('unprocessed');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all');
  const [selectedReport, setSelectedReport] = useState<ReportLog | null>(null);
  const [showBanModal, setShowBanModal] = useState(false);
  const [banForm, setBanForm] = useState({
    username: '',
    banType: 'temporary' as 'temporary' | 'permanent',
    hours: '24',
    reason: 'harassment' as any,
    customReason: '',
    notes: ''
  });

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

  // Handle ban user
  const handleBanUser = () => {
    if (!banForm.username) return;
    
    const adminUsername = user?.username || 'admin';
    const hours = banForm.banType === 'permanent' ? 'permanent' : parseInt(banForm.hours);
    const reportIds = selectedReport ? [selectedReport.id!] : [];
    
    const success = banUser(
      banForm.username,
      hours,
      banForm.reason,
      banForm.customReason,
      adminUsername,
      reportIds,
      banForm.notes
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
            adminNotes: banForm.notes
          } : report
        );
        saveReports(updatedReports);
      }
      
      setShowBanModal(false);
      setBanForm({
        username: '',
        banType: 'temporary',
        hours: '24',
        reason: 'harassment',
        customReason: '',
        notes: ''
      });
      
      alert(`Successfully banned ${banForm.username} ${banForm.banType === 'permanent' ? 'permanently' : `for ${banForm.hours} hours`}`);
    } else {
      alert('Failed to ban user. They may already be banned.');
    }
  };

  // Handle quick ban
  const handleQuickBan = (username: string, hours: number, reason: string) => {
    const adminUsername = user?.username || 'admin';
    const success = banUser(username, hours, reason as any, '', adminUsername);
    
    if (success) {
      alert(`Successfully banned ${username} for ${hours} hours`);
    } else {
      alert('Failed to ban user. They may already be banned.');
    }
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
              Enhanced Reports & Bans
            </h1>
            <p className="text-gray-400 mt-1">
              Manage user reports and apply temporary or permanent bans
            </p>
          </div>
          
          {/* Quick Stats */}
          <div className="flex gap-4">
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-400">{banStats.totalActiveBans}</div>
              <div className="text-xs text-gray-400">Active Bans</div>
            </div>
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400">{filteredReports.filter(r => !r.processed).length}</div>
              <div className="text-xs text-gray-400">Pending Reports</div>
            </div>
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-orange-400">{banStats.pendingAppeals}</div>
              <div className="text-xs text-gray-400">Pending Appeals</div>
            </div>
          </div>
        </div>

        {/* Filters */}
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
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
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
              const userBanInfo = getBanInfo(report.reportee);
              
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
                        {/* Quick Ban Buttons */}
                        <button
                          onClick={() => handleQuickBan(report.reportee, 1, 'harassment')}
                          className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 flex items-center"
                        >
                          <Timer size={12} className="mr-1" />
                          1 Hour Ban
                        </button>
                        <button
                          onClick={() => handleQuickBan(report.reportee, 24, 'harassment')}
                          className="px-3 py-1 bg-orange-600 text-white text-sm rounded hover:bg-orange-700 flex items-center"
                        >
                          <Timer size={12} className="mr-1" />
                          24 Hour Ban
                        </button>
                        <button
                          onClick={() => handleQuickBan(report.reportee, 168, 'harassment')}
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 flex items-center"
                        >
                          <Timer size={12} className="mr-1" />
                          7 Day Ban
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
                  onClick={() => setShowBanModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBanUser}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center justify-center"
                >
                  <Ban size={16} className="mr-2" />
                  Apply Ban
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </RequireAuth>
  );
}
