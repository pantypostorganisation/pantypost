// src/components/sellers/messages/MobileNavigation.tsx
'use client';

import React from 'react';
import { MessageCircle, Users } from 'lucide-react';
import { motion } from 'framer-motion';

interface MobileNavigationProps {
  showChat: boolean;
  hasUnread: boolean;
  onNavigate: (showChat: boolean) => void;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({ showChat, hasUnread, onNavigate }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#1a1a1a] border-t border-gray-800 md:hidden">
      <div className="flex items-center">
        <button
          onClick={() => onNavigate(false)}
          className={`flex-1 py-4 flex flex-col items-center gap-1 transition-colors ${
            !showChat ? 'text-purple-400' : 'text-gray-400'
          }`}
        >
          <div className="relative">
            <Users className="w-6 h-6" />
            {hasUnread && !showChat && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full" />
            )}
          </div>
          <span className="text-xs">Chats</span>
        </button>
        
        <button
          onClick={() => onNavigate(true)}
          className={`flex-1 py-4 flex flex-col items-center gap-1 transition-colors ${
            showChat ? 'text-purple-400' : 'text-gray-400'
          }`}
          disabled={!showChat}
        >
          <MessageCircle className="w-6 h-6" />
          <span className="text-xs">Messages</span>
        </button>
      </div>
    </div>
  );
};

export default MobileNavigation;