// src/components/admin/resolved/ResolvedEntry.tsx
'use client';

import { useState } from 'react';
import { User, Calendar, Shield, AlertTriangle, ChevronDown, ChevronUp, RotateCcw, Trash2, MessageSquare, FileText } from 'lucide-react';
import type { ResolvedEntryProps } from '@/types/resolved';

const getSeverityColor = (severity?: string) => {
  switch (severity) {
    case 'critical': return 'text-red-500';
    case 'high': return 'text-orange-500';
    case 'medium': return 'text-yellow-500';
    case 'low': return 'text-green-500';
    default: return 'text-gray-500';
  }
};

const getSeverityIcon = (severity?: string) => {
  switch (severity) {
    case 'critical': return Shield;
    case 'high': return AlertTriangle;
    case 'medium': return AlertTriangle;
    case 'low': return AlertTriangle;
    default: return AlertTriangle;
  }
};

export default function ResolvedEntry({
  report,
  index,
  isExpanded,
  isSelected,
  onToggleExpanded,
  onToggleSelected,
  onRestore,
  onDelete
}: ResolvedEntryProps) {
  const SeverityIcon = getSeverityIcon(report.severity);

  return (
    <div 
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
            onChange={onToggleSelected}
            className="mt-1 w-4 h-4 text-[#ff950e] bg-gray-700 border-gray-600 rounded focus:ring-[#ff950e]"
          />
          
          {/* Main Content */}
          <div 
            className="flex-1 cursor-pointer"
            onClick={onToggleExpanded}
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-gray-400" />
                    <span className="font-semibold text-white">
                      {report.reporter} → {report.reportee}
                    </span>
                  </div>
                  
                  {report.banApplied ? (
                    <span className="px-2 py-0.5 bg-red-900/20 text-red-400 text-xs rounded-md border border-red-800">
                      Ban Applied
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-green-900/20 text-green-400 text-xs rounded-md border border-green-800">
                      No Ban
                    </span>
                  )}

                  {report.severity && (
                    <div className={`flex items-center gap-1 ${getSeverityColor(report.severity)}`}>
                      <SeverityIcon size={14} />
                      <span className="text-xs font-medium uppercase">{report.severity}</span>
                    </div>
                  )}

                  {report.category && (
                    <span className="text-xs text-gray-400">
                      {report.category.replace(/_/g, ' ')}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <div className="flex items-center gap-1">
                    <Calendar size={14} />
                    <span>Resolved: {new Date(report.date).toLocaleDateString()}</span>
                  </div>
                  {report.resolvedBy && (
                    <span>By: {report.resolvedBy}</span>
                  )}
                  {report.resolvedReason && (
                    <span>Reason: {report.resolvedReason}</span>
                  )}
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRestore();
                  }}
                  className="p-2 hover:bg-[#222] rounded transition"
                  title="Restore to active reports"
                >
                  <RotateCcw size={16} className="text-yellow-500" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="p-2 hover:bg-[#222] rounded transition"
                  title="Delete permanently"
                >
                  <Trash2 size={16} className="text-red-500" />
                </button>
                <div className="pl-2">
                  {isExpanded ? (
                    <ChevronUp size={20} className="text-gray-400" />
                  ) : (
                    <ChevronDown size={20} className="text-gray-400" />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-800 bg-[#0d0d0d] p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Report Details */}
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                <FileText size={14} />
                Report Details
              </h4>
              <div className="space-y-2 text-sm">
                {report.originalReportDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Original Report Date:</span>
                    <span className="text-gray-300">{new Date(report.originalReportDate).toLocaleDateString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Resolution Date:</span>
                  <span className="text-gray-300">{new Date(report.date).toLocaleDateString()}</span>
                </div>
                {report.banId && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Ban ID:</span>
                    <span className="text-gray-300 font-mono text-xs">{report.banId}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Processing Info */}
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-3">Processing Information</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Resolved By:</span>
                  <span className="text-gray-300">{report.resolvedBy || 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Resolution:</span>
                  <span className="text-gray-300">{report.resolvedReason || 'No reason provided'}</span>
                </div>
                {report.banApplied !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Ban Applied:</span>
                    <span className={report.banApplied ? 'text-red-400' : 'text-green-400'}>
                      {report.banApplied ? 'Yes' : 'No'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Admin Notes */}
          {(report.notes || report.adminNotes) && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Admin Notes</h4>
              <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-3">
                <p className="text-sm text-gray-400 whitespace-pre-wrap">
                  {report.notes || report.adminNotes}
                </p>
              </div>
            </div>
          )}

          {/* Messages */}
          {report.messages && report.messages.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <MessageSquare size={14} />
                Reported Messages ({report.messages.length})
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {report.messages.map((msg, idx) => (
                  <div key={idx} className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-sm font-medium text-white">
                        {msg.sender} → {msg.receiver}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(msg.date).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300">{msg.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
