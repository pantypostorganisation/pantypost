// src/components/seller/messages/ChatHeader.tsx
'use client';

import React from 'react';
import { BadgeCheck, Sparkles, AlertTriangle, ShieldAlert } from 'lucide-react';
import { getInitial } from '@/utils/messageUtils';
import { sanitizeStrict } from '@/utils/security/sanitization';
import { formatActivityStatus } from '@/utils/format';
import { useUserActivityStatus } from '@/hooks/useUserActivityStatus';
import { SecureImage } from '@/components/ui/SecureMessageDisplay';

interface ChatHeaderProps {
  activeThread: string;
  buyerProfile: {
    pic: string | null;
    verified: boolean;
  } | undefined; // allow undefined and handle safely
  isUserReported: boolean;
  isUserBlocked: boolean;
  onReport: () => void;
  onBlockToggle: () => void;
}

export default function ChatHeader({
  activeThread,
  buyerProfile,
  isUserReported,
  isUserBlocked,
  onReport,
  onBlockToggle,
}: ChatHeaderProps) {
  const sanitizedActiveThread = sanitizeStrict(activeThread);

  // Guard against undefined shape while loading
  const { activityStatus = { isOnline: false, lastActive: null }, loading } =
    useUserActivityStatus(activeThread);

  const getActivityDisplay = () => {
    if (isUserBlocked) return 'Blocked';
    if (loading) return '...';
    return formatActivityStatus(activityStatus.isOnline, activityStatus.lastActive);
  };

  const verified = !!buyerProfile?.verified;
  const pic = buyerProfile?.pic || null;

  return (
    <div className="px-4 py-3 flex items-center justify-between border-b border-gray-800 bg-[#1a1a1a]">
      <div className="flex items-center">
        <div className="relative w-10 h-10 rounded-full bg-[#333] flex items-center justify-center text-white font-bold mr-3 overflow-hidden shadow-md">
          {pic ? (
            <SecureImage src={pic} alt={sanitizedActiveThread} className="w-full h-full object-cover" />
          ) : (
            getInitial(sanitizedActiveThread)
          )}

          {verified && (
            <div className="absolute bottom-0 right-0 bg-[#1a1a1a] p-0.5 rounded-full border border-[#ff950e] shadow-sm">
              <BadgeCheck size={12} className="text-[#ff950e]" aria-label="Verified" />
            </div>
          )}

          {activityStatus?.isOnline && !isUserBlocked && (
            <div
              className="absolute bottom-0 left-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#1a1a1a]"
              aria-label="Online"
            />
          )}
        </div>
        <div>
          <h2 className="font-bold text-lg text-white">{sanitizedActiveThread}</h2>
          <p
            className={`text-xs flex items-center ${
              activityStatus?.isOnline && !isUserBlocked ? 'text-green-400' : 'text-gray-400'
            }`}
          >
            {activityStatus?.isOnline && !isUserBlocked && (
              <Sparkles size={12} className="mr-1 text-green-400" />
            )}
            {getActivityDisplay()}
          </p>
        </div>
      </div>

      <div className="flex space-x-2 text-white">
        <button
          onClick={onReport}
          disabled={isUserReported}
          className={`px-3 py-1 text-xs border rounded flex items-center ${
            isUserReported ? 'text-gray-400 border-gray-500' : 'text-red-500 border-red-500 hover:bg-red-500/10'
          } transition-colors duration-150`}
          title={isUserReported ? 'Already reported' : 'Report user'}
          aria-disabled={isUserReported}
        >
          <AlertTriangle size={12} className="mr-1" />
          {isUserReported ? 'Reported' : 'Report'}
        </button>
        <button
          onClick={onBlockToggle}
          className={`px-3 py-1 text-xs border rounded flex items-center ${
            isUserBlocked
              ? 'text-green-500 border-green-500 hover:bg-green-500/10'
              : 'text-red-500 border-red-500 hover:bg-red-500/10'
          } transition-colors duration-150`}
          title={isUserBlocked ? 'Unblock user' : 'Block user'}
        >
          <ShieldAlert size={12} className="mr-1" />
          {isUserBlocked ? 'Unblock' : 'Block'}
        </button>
      </div>
    </div>
  );
}
