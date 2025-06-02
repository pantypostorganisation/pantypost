'use client';

import { useEffect, useState } from 'react';
import { useListings } from '@/context/ListingContext';
import RequireAuth from '@/components/RequireAuth';
import {
  CheckCircle,
  Calendar,
  User,
  RotateCcw,
  Trash2,
  Search,
  Filter,
  Archive,
  Clock,
  ArrowLeft,
  RefreshCw,
  FileText,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Users,
  Info,
  AlertTriangle,
  Download,
  Upload
} from 'lucide-react';

type ResolvedReport = {
  reporter: string;
  reportee: string;
  date: string; // This is the resolution date
  originalReportDate?: string; // Optional: original report date
  resolvedBy?: string;
  resolvedReason?: string;
  banApplied?: boolean;
  notes?: string;
};

type Message = {
  sender: string;
  receiver: string;
  content: string;
  date: string;
  read?: boolean;
};

type ReportLog = {
  reporter: string;
  reportee: string;
  messages: Message[];
  date: string;
};

export default function ResolvedReportsPage() {
  const { user } = useListings();
  const [resolved, setResolved] = useState<ResolvedReport[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState<'all' | 'banned' | 'nobanned'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'reporter' | 'reportee'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [expandedReports, setExpandedReports] = useState<Set<number>>(new Set());
  const [selectedReports, setSelectedReports] = useState<Set<number>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [showImportModal, setShowImportModal] = useState(false);

  useEffect(() => {
    loadResolvedReports();
  }, []);

  const loadResolvedReports = () => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('panty_report_resolved');
      if (stored) {
        try {
          const parsed: ResolvedReport[] = JSON.parse(stored);
          // Sort by date, newest first
          parsed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setResolved(parsed);
          setLastRefresh(new Date());
        } catch (error) {
          console.error('Error parsing resolved reports:', error);
          setResolved([]);
        }
      }
    }
  };

  const saveResolved = (newResolved: ResolvedReport[]) => {
    setResolved(newResolved);
    localStorage.setItem('panty_report_resolved', JSON.stringify(newResolved));
  };

  // Toggle expanded state
  const toggleExpanded = (index: number) => {
    setExpandedReports(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  // Toggle selection
  const toggleSelection = (index: number) => {
    setSelectedReports(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
    setShowBulkActions(true);
  };

  // Select all
  const selectAll = () => {
    const allIndices = filteredAndSortedReports.map((_, index) => index);
    setSelectedReports(new Set(allIndices));
    setShowBulkActions(true);
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedReports(new Set());
    setShowBulkActions(false);
  };

  // Filter and sort reports
  const filteredAndSortedReports = (() => {
    let filtered = resolved.filter(report => {
      const matchesSearch = searchTerm ? 
        (report.reporter && report.reporter.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (report.reportee && report.reportee.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (report.notes && report.notes.toLowerCase().includes(searchTerm.toLowerCase())) : true;
      
      const matchesFilter = filterBy === 'all' ? true :
        filterBy === 'banned' ? report.banApplied === true :
        report.banApplied !== true;
      
      return matchesSearch && matchesFilter;
    });

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'reporter':
          comparison = (a.reporter || '').localeCompare(b.reporter || '');
          break;
        case 'reportee':
          comparison = (a.reportee || '').localeCompare(b.reportee || '');
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

  // Handle undo resolution
  const handleUndo = (entry: ResolvedReport, index: number) => {
    // Remove from resolved
    const actualIndex = resolved.indexOf(entry);
    const updatedResolved = [...resolved];
    updatedResolved.splice(actualIndex, 1);
    saveResolved(updatedResolved);

    // Restore to active reports
    let thread: Message[] = [];
    const messagesRaw = localStorage.getItem('panty_messages');
    if (messagesRaw) {
      const allMessages = JSON.parse(messagesRaw);
      Object.values(allMessages as { [key: string]: any[] }).forEach((msgList) => {
        msgList.forEach((msg) => {
          const between = [msg.sender, msg.receiver];
          if (between.includes(entry.reporter) && between.includes(entry.reportee)) {
            thread.push(msg);
          }
        });
      });
    }

    // Always restore the report, even if no messages found
    const newReport: ReportLog = {
      reporter: entry.reporter,
      reportee: entry.reportee,
      messages: thread,
      date: entry.date,
    };

    const existingReportsRaw = localStorage.getItem('panty_report_logs');
    const existingReports = existingReportsRaw ? JSON.parse(existingReportsRaw) : [];
    existingReports.push(newReport);
    localStorage.setItem('panty_report_logs', JSON.stringify(existingReports));

    // Dispatch event to update report counter
    window.dispatchEvent(new Event('updateReports'));

    alert(`Restored report from ${entry.reporter} about ${entry.reportee}.`);
  };

  // Bulk actions
  const handleBulkUndo = () => {
    if (selectedReports.size === 0) return;
    
    if (confirm(`Are you sure you want to restore ${selectedReports.size} reports?`)) {
      const toRestore = Array.from(selectedReports).map(i => filteredAndSortedReports[i]);
      toRestore.forEach(report => handleUndo(report, 0));
      clearSelection();
    }
  };

  const handleBulkDelete = () => {
    if (selectedReports.size === 0) return;
    
    if (confirm(`Are you sure you want to permanently delete ${selectedReports.size} reports? This cannot be undone.`)) {
      const toDelete = Array.from(selectedReports).map(i => filteredAndSortedReports[i]);
      const updatedResolved = resolved.filter(r => !toDelete.includes(r));
      saveResolved(updatedResolved);
      clearSelection();
      alert(`${toDelete.length} reports deleted.`);
    }
  };

  // Export data
  const exportData = () => {
    const data = {
      resolvedReports: resolved,
      exportDate: new Date().toISOString(),
      exportedBy: user?.username || 'admin',
      totalRecords: resolved.length
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resolved-reports-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import data
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.resolvedReports && Array.isArray(data.resolvedReports)) {
          const imported = data.resolvedReports as ResolvedReport[];
          const merged = [...resolved, ...imported];
          // Remove duplicates based on reporter + reportee + date
          const unique = merged.filter((report, index, self) =>
            index === self.findIndex((r) => (
              r.reporter === report.reporter &&
              r.reportee === report.reportee &&
              r.date === report.date
            ))
          );
          saveResolved(unique);
          alert(`Imported ${imported.length} reports. Total: ${unique.length}`);
          setShowImportModal(false);
        } else {
          alert('Invalid file format');
        }
      } catch (error) {
        alert('Error importing file');
        console.error('Import error:', error);
      }
    };
    reader.readAsText(file);
  };

  // Calculate stats
  const stats = {
    total: resolved.length,
    withBans: resolved.filter(r => r.banApplied).length,
    withoutBans: resolved.filter(r => !r.banApplied).length,
    today: resolved.filter(r => {
      const reportDate = new Date(r.date);
      const today = new Date();
      return reportDate.toDateString() === today.toDateString();
    }).length,
    thisWeek: resolved.filter(r => {
      const reportDate = new Date(r.date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return reportDate >= weekAgo;
    }).length
  };

  if (!user || (user.username !== 'oakley' && user.username !== 'gerome')) {
    return (
      <RequireAuth role="admin">
        <main className="p-8 max-w-4xl mx-auto">
          <div className="bg-[#1a1a1a] border border-red-800 rounded-lg p-8 text-center">
            <AlertTriangle size={48} className="mx-auto text-red-400 mb-4" />
            <h1 className="text-2xl font-bold mb-4 text-red-400">🔒 Access Denied</h1>
            <p className="text-gray-400">You do not have permission to view this page.</p>
            <button
              onClick={() => window.history.back()}
              className="mt-4 px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center mx-auto"
            >
              <ArrowLeft size={16} className="mr-2" />
              Go Back
            </button>
          </div>
        </main>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth role="admin">
      <main className="p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#ff950e] flex items-center">
              <CheckCircle className="mr-3" />
              Resolved Reports Archive
            </h1>
            <p className="text-gray-400 mt-1">
              View and manage previously resolved reports
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-400">
              Last refresh: {lastRefresh.toLocaleTimeString()}
            </div>
            <button
              onClick={loadResolvedReports}
              className="px-4 py-2 bg-[#ff950e] text-black rounded-lg hover:bg-[#e88800] flex items-center font-medium transition-colors"
            >
              <RefreshCw size={16} className="mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 text-center hover:border-gray-700 transition-colors">
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <div className="text-xs text-gray-400">Total Resolved</div>
          </div>
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 text-center hover:border-gray-700 transition-colors">
            <div className="text-2xl font-bold text-red-400">{stats.withBans}</div>
            <div className="text-xs text-gray-400">With Bans</div>
          </div>
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 text-center hover:border-gray-700 transition-colors">
            <div className="text-2xl font-bold text-green-400">{stats.withoutBans}</div>
            <div className="text-xs text-gray-400">No Bans</div>
          </div>
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 text-center hover:border-gray-700 transition-colors">
            <div className="text-2xl font-bold text-blue-400">{stats.today}</div>
            <div className="text-xs text-gray-400">Today</div>
          </div>
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 text-center hover:border-gray-700 transition-colors">
            <div className="text-2xl font-bold text-purple-400">{stats.thisWeek}</div>
            <div className="text-xs text-gray-400">This Week</div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search by username or notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#222] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e] transition-all"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value as any)}
                className="px-3 py-2 bg-[#222] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
              >
                <option value="all">All Reports</option>
                <option value="banned">With Bans</option>
                <option value="nobanned">No Bans</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 bg-[#222] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
              >
                <option value="date">Sort by Date</option>
                <option value="reporter">Sort by Reporter</option>
                <option value="reportee">Sort by Reportee</option>
              </select>

              <button
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 bg-[#222] border border-gray-700 rounded-lg text-white hover:bg-[#333] transition-colors"
              >
                {sortOrder === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowImportModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center transition-colors"
              >
                <Upload size={16} className="mr-2" />
                Import
              </button>
              <button
                onClick={exportData}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center transition-colors"
              >
                <Download size={16} className="mr-2" />
                Export
              </button>
            </div>
          </div>

          {/* Bulk Actions */}
          {showBulkActions && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-700">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-400">
                  {selectedReports.size} selected
                </span>
                <button
                  onClick={selectAll}
                  className="text-sm text-blue-400 hover:text-blue-300"
                >
                  Select All
                </button>
                <button
                  onClick={clearSelection}
                  className="text-sm text-gray-400 hover:text-white"
                >
                  Clear Selection
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleBulkUndo}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center transition-colors"
                >
                  <RotateCcw size={14} className="mr-1" />
                  Restore Selected
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 flex items-center transition-colors"
                >
                  <Trash2 size={14} className="mr-1" />
                  Delete Selected
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Reports List */}
        {filteredAndSortedReports.length === 0 ? (
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-8 text-center">
            <Archive size={48} className="mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400 text-lg">No resolved reports found</p>
            {searchTerm && (
              <p className="text-gray-500 text-sm mt-2">
                Try adjusting your search terms or filters
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAndSortedReports.map((entry, i) => {
              const isExpanded = expandedReports.has(i);
              const isSelected = selectedReports.has(i);
              
              return (
                <div 
                  key={i} 
                  className={`bg-[#1a1a1a] border ${
                    isSelected ? 'border-[#ff950e]' : 'border-gray-800'
                  } rounded-lg overflow-hidden hover:border-gray-700 transition-all`}
                >
                  {/* Report Header */}
                  <div className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelection(i)}
                        className="mt-1 w-4 h-4 text-[#ff950e] bg-gray-700 border-gray-600 rounded focus:ring-[#ff950e]"
                      />
                      
                      {/* Main Content */}
                      <div 
                        className="flex-1 cursor-pointer"
                        onClick={() => toggleExpanded(i)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <div className="flex items-center gap-2">
                                <User size={16} className="text-gray-400" />
                                <span className="font-semibold text-white">
                                  {entry.reporter} → {entry.reportee}
                                </span>
                              </div>
                              
                              {entry.banApplied ? (
                                <span className="px-2 py-1 bg-red-900/20 text-red-400 text-xs rounded font-medium">
                                  Ban Applied
                                </span>
                              ) : (
                                <span className="px-2 py-1 bg-green-900/20 text-green-400 text-xs rounded font-medium">
                                  No Ban
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-gray-400">
                              <span className="flex items-center gap-1">
                                <Calendar size={14} />
                                Resolved: {new Date(entry.date).toLocaleString()}
                              </span>
                              {entry.resolvedBy && (
                                <span className="flex items-center gap-1">
                                  <User size={14} />
                                  by {entry.resolvedBy}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUndo(entry, i);
                              }}
                              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center transition-colors"
                            >
                              <RotateCcw size={14} className="mr-1" />
                              Restore
                            </button>
                            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-gray-700">
                        {entry.notes && (
                          <div className="mb-3">
                            <div className="text-sm text-gray-400 mb-1 flex items-center gap-1">
                              <FileText size={14} />
                              Admin Notes
                            </div>
                            <div className="p-3 bg-[#222] rounded-lg text-gray-300 text-sm">
                              {entry.notes}
                            </div>
                          </div>
                        )}
                        
                        {entry.resolvedReason && (
                          <div>
                            <div className="text-sm text-gray-400 mb-1">Resolution Reason</div>
                            <div className="p-3 bg-[#222] rounded-lg text-gray-300 text-sm">
                              {entry.resolvedReason}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex justify-end gap-2 mt-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('Are you sure you want to permanently delete this report?')) {
                                const updatedResolved = [...resolved];
                                const actualIndex = resolved.indexOf(entry);
                                updatedResolved.splice(actualIndex, 1);
                                saveResolved(updatedResolved);
                              }
                            }}
                            className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 flex items-center transition-colors"
                          >
                            <Trash2 size={14} className="mr-1" />
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Import Modal */}
        {showImportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <Upload className="mr-2 text-blue-400" />
                Import Resolved Reports
              </h3>
              
              <p className="text-gray-300 mb-4">
                Select a JSON file exported from this system to import resolved reports.
              </p>
              
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="w-full px-3 py-2 bg-[#222] border border-gray-700 rounded text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-[#ff950e] file:text-black hover:file:bg-[#e88800]"
              />
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </RequireAuth>
  );
}
