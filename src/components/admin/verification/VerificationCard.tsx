// src/components/admin/verification/VerificationCard.tsx
'use client';

import { ChevronRight, Clock, Shield, Upload } from 'lucide-react';
import type { VerificationCardProps } from '@/types/verification';

export default function VerificationCard({ 
  user, 
  onSelect, 
  getTimeAgo 
}: VerificationCardProps) {
  const hasAllDocs = user.verificationDocs && (
    user.verificationDocs.codePhoto && 
    (user.verificationDocs.idFront || user.verificationDocs.passport)
  );

  return (
    <div
      onClick={onSelect}
      className="bg-[#0e0e0e] border border-[#222] rounded-xl p-4 hover:border-[#ff950e] transition-all duration-200 cursor-pointer group"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#1a1a1a] rounded-full flex items-center justify-center border border-[#333] group-hover:border-[#ff950e] transition-colors">
            <Shield className="w-6 h-6 text-[#ff950e]" />
          </div>
          <div>
            <h3 className="font-bold text-white text-lg group-hover:text-[#ff950e] transition-colors">
              {user.username}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <Clock className="w-3 h-3 text-gray-500" />
              <span className="text-xs text-gray-400">
                Requested {getTimeAgo(user.verificationRequestedAt)}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {hasAllDocs ? (
            <div className="flex items-center gap-2 text-green-500">
              <Upload className="w-4 h-4" />
              <span className="text-xs font-medium">Docs Complete</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-yellow-500">
              <Upload className="w-4 h-4" />
              <span className="text-xs font-medium">Docs Incomplete</span>
            </div>
          )}
          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#ff950e] transition-colors" />
        </div>
      </div>
    </div>
  );
}
