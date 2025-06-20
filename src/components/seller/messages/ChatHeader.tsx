// src/components/sellers/messages/ChatHeader.tsx
'use client';

import React from 'react';
import { BadgeCheck, Sparkles, AlertTriangle, ShieldAlert } from 'lucide-react';
import { getInitial } from '@/utils/messageUtils';

interface ChatHeaderProps {
  activeThread: string;
  buyerProfile: {
    pic: string | null;
    verified: boolean;
  };
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
  onBlockToggle
}: ChatHeaderProps) {
  return (
    <div className="px-4 py-3 flex items-center justify-between border-b border-gray-800 bg-[#1a1a1a]">
      <div className="flex items-center">
        <div className="relative w-10 h-10 rounded-full bg-[#333] flex items-center justify-center text-white font-bold mr-3 overflow-hidden shadow-md">
          {buyerProfile?.pic ? (
            <img src={buyerProfile.pic} alt={activeThread} className="w-full h-full object-cover" />
          ) : (
            getInitial(activeThread)
          )}
          
          {/* Verified badge if applicable */}
          {buyerProfile?.verified && (
            <div className="absolute bottom-0 right-0 bg-[#1a1a1a] p-0.5 rounded-full border border-[#ff950e] shadow-sm">
              <BadgeCheck size={12} className="text-[#ff950e]" />
            </div>
          )}
        </div>
        <div>
          <h2 className="font-bold text-lg text-white">{activeThread}</h2>
          <p className="text-xs text-[#ff950e] flex items-center">
            <Sparkles size={12} className="mr-1 text-[#ff950e]" />
            Active now
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
        >
          <AlertTriangle size={12} className="mr-1" />
          {isUserReported ? 'Reported' : 'Report'}
        </button>
        <button
          onClick={onBlockToggle}
          className={`px-3 py-1 text-xs border rounded flex items-center ${
            isUserBlocked ? 'text-green-500 border-green-500 hover:bg-green-500/10' : 'text-red-500 border-red-500 hover:bg-red-500/10'
          } transition-colors duration-150`}
        >
          <ShieldAlert size={12} className="mr-1" />
          {isUserBlocked ? 'Unblock' : 'Block'}
        </button>
      </div>
    </div>
  );
}