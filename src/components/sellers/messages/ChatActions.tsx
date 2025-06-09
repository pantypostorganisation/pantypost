// src/components/sellers/messages/ChatActions.tsx
'use client';

import React, { useRef, useEffect } from 'react';
import { Shield, AlertTriangle, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface ChatActionsProps {
  onBlock: () => void;
  onReport: () => void;
  onClose: () => void;
}

const ChatActions: React.FC<ChatActionsProps> = ({ onBlock, onReport, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);
  
  return (
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, scale: 0.95, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      className="absolute right-0 mt-2 w-48 bg-[#2a2a2a] border border-gray-700 rounded-lg shadow-xl overflow-hidden z-50"
    >
      <div className="py-1">
        <button
          onClick={() => {
            onBlock();
            onClose();
          }}
          className="w-full px-4 py-3 text-left hover:bg-[#3a3a3a] transition-colors flex items-center gap-3"
        >
          <Shield className="w-5 h-5 text-blue-400" />
          <span className="text-white">Block User</span>
        </button>
        
        <button
          onClick={() => {
            onReport();
            onClose();
          }}
          className="w-full px-4 py-3 text-left hover:bg-[#3a3a3a] transition-colors flex items-center gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-orange-400" />
          <span className="text-white">Report User</span>
        </button>
      </div>
    </motion.div>
  );
};

export default ChatActions;