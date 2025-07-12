// src/components/sellers/messages/ThreadListItem.tsx
'use client';

import React from 'react';
import { Clock, BadgeCheck } from 'lucide-react';
import { formatTimeAgo, getInitial } from '@/utils/messageUtils';
import { sanitizeStrict } from '@/utils/security/sanitization';

interface ThreadListItemProps {
  buyer: string;
  lastMessage: any;
  isActive: boolean;
  buyerProfile: {
    pic: string | null;
    verified: boolean;
  };
  unreadCount: number;
  onClick: () => void;
}

export default function ThreadListItem({
  buyer,
  lastMessage,
  isActive,
  buyerProfile,
  unreadCount,
  onClick
}: ThreadListItemProps) {
  
  const sanitizedBuyer = sanitizeStrict(buyer);
  
  // Debug click handler
  const handleClick = () => {
    console.log('=== ThreadListItem Click Debug ===');
    console.log('Buyer:', buyer);
    console.log('onClick function exists:', !!onClick);
    console.log('Calling onClick...');
    
    if (onClick) {
      onClick();
      console.log('onClick called successfully');
    } else {
      console.error('onClick is not defined!');
    }
  };
  
  return (
    <div 
      onClick={handleClick}
      className={`flex items-center p-3 cursor-pointer relative border-b border-gray-800 ${
        isActive ? 'bg-[#2a2a2a]' : 'hover:bg-[#1a1a1a]'
      } transition-colors duration-150 ease-in-out`}
      style={{ userSelect: 'none' }} // Prevent text selection on click
    >
      {/* Active indicator */}
      {isActive && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#ff950e]"></div>
      )}
      
      {/* Avatar with unread indicator */}
      <div className="relative mr-3 pointer-events-none">
        <div className="relative w-12 h-12 rounded-full bg-[#333] flex items-center justify-center text-white font-bold overflow-hidden shadow-md">
          {buyerProfile?.pic ? (
            <img src={buyerProfile.pic} alt={sanitizedBuyer} className="w-full h-full object-cover" />
          ) : (
            getInitial(sanitizedBuyer)
          )}
          
          {/* Verified badge if applicable */}
          {buyerProfile?.verified && (
            <div className="absolute bottom-0 right-0 bg-[#1a1a1a] p-0.5 rounded-full border border-[#ff950e] shadow-sm">
              <BadgeCheck size={12} className="text-[#ff950e]" />
            </div>
          )}
        </div>
        
        {/* Unread indicator */}
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#ff950e] text-black text-xs rounded-full flex items-center justify-center font-bold border-2 border-[#121212] shadow-lg">
            {unreadCount}
          </div>
        )}
      </div>
      
      {/* Message preview */}
      <div className="flex-1 min-w-0 pointer-events-none">
        <div className="flex justify-between">
          <h3 className="font-bold text-white truncate">{sanitizedBuyer}</h3>
          <span className="text-xs text-gray-400 whitespace-nowrap ml-1 flex items-center">
            <Clock size={12} className="mr-1" />
            {lastMessage ? formatTimeAgo(lastMessage.date) : ''}
          </span>
        </div>
        <p className="text-sm text-gray-400 truncate">
          {lastMessage ? (
            lastMessage.type === 'customRequest' 
              ? '🛒 Custom Request'
              : lastMessage.type === 'image'
                ? '📷 Image'
                : sanitizeStrict(lastMessage.content || '')
          ) : ''}
        </p>
      </div>
    </div>
  );
}
