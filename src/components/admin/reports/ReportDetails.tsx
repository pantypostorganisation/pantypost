// src/components/admin/reports/ReportDetails.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { BarChart3, MessageSquare, FileText } from 'lucide-react';
import { SecureTextarea } from '@/components/ui/SecureInput';
import { SecureMessageDisplay } from '@/components/ui/SecureMessageDisplay';
import { sanitizeStrict } from '@/utils/security/sanitization';
import { ReportDetailsProps } from './types';

export default function ReportDetails({
  report,
  userStats,
  onUpdateSeverity,
  onUpdateCategory,
  onUpdateAdminNotes
}: ReportDetailsProps) {
  const [adminNotes, setAdminNotes] = useState(report.adminNotes || '');
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleAdminNotesChange = (value: string) => {
    // Sanitize admin notes input
    const sanitizedValue = sanitizeStrict(value);
    setAdminNotes(sanitizedValue);
  };

  // Auto-save admin notes with debounce
  useEffect(() => {
    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
    }
    
    saveTimeout.current = setTimeout(() => {
      onUpdateAdminNotes(adminNotes);
    }, 1000);

    return () => {
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current);
      }
    };
  }, [adminNotes, onUpdateAdminNotes]);

  return (
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
          Conversation ({report.messages?.length || 0} messages)
        </div>
        <div className="bg-[#111] rounded-lg max-h-64 overflow-y-auto p-3 space-y-2">
          {report.messages && report.messages.length > 0 ? (
            report.messages.map((msg, idx) => (
              <div
                key={idx}
                className={`p-2 rounded text-sm ${
                  msg.sender === report.reporter
                    ? 'bg-blue-900/20 text-blue-300'
                    : 'bg-gray-800 text-gray-300'
                }`}
              >
                <div className="font-semibold">{msg.sender}</div>
                <div className="text-xs text-gray-500">
                  {new Date(msg.date).toLocaleString()}
                </div>
                <SecureMessageDisplay 
                  content={msg.content}
                  className="mt-1"
                  allowBasicFormatting={false}
                  maxLength={500}
                />
              </div>
            ))
          ) : (
            <div className="text-gray-500 text-center py-4">No messages available</div>
          )}
        </div>
      </div>

      {/* Severity and Category Controls */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Severity</label>
          <select
            value={report.severity || 'medium'}
            onChange={(e) => onUpdateSeverity(e.target.value as any)}
            className="w-full px-3 py-2 bg-[#222] border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
          <select
            value={report.category || 'other'}
            onChange={(e) => onUpdateCategory(e.target.value as any)}
            className="w-full px-3 py-2 bg-[#222] border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
          >
            <option value="harassment">Harassment</option>
            <option value="spam">Spam</option>
            <option value="inappropriate_content">Inappropriate Content</option>
            <option value="scam">Scam</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {/* Admin Notes */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <FileText size={14} className="text-gray-400" />
          <span className="text-sm font-medium text-gray-300">Admin Notes</span>
          <span className="text-xs text-gray-500">(Auto-saves)</span>
        </div>
        <SecureTextarea
          value={adminNotes}
          onChange={handleAdminNotesChange}
          placeholder="Add internal notes about this report..."
          rows={3}
          maxLength={1000}
          characterCount={true}
          sanitize={true}
          sanitizer={sanitizeStrict}
        />
      </div>

      {/* Processed Info */}
      {report.processed && (
        <div className="p-3 bg-gray-900 border border-gray-700 rounded-lg text-sm">
          <div className="text-gray-400">
            Processed by: <span className="text-white">{report.processedBy || 'Unknown'}</span>
          </div>
          {report.processedAt && (
            <div className="text-gray-400">
              Processed at: <span className="text-white">{new Date(report.processedAt).toLocaleString()}</span>
            </div>
          )}
          {report.banApplied && (
            <div className="text-red-400 mt-1">Ban was applied</div>
          )}
        </div>
      )}
    </div>
  );
}
