// src/components/sellers/messages/MessagesHeader.tsx
'use client';

import React from 'react';
import { MessageCircle, Users, Mail, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface MessageStats {
  totalThreads: number;
  totalUnreadMessages: number;
  totalUnreadThreads: number;
  customRequests: number;
}

interface MessagesHeaderProps {
  stats: MessageStats;
}

const MessagesHeader: React.FC<MessagesHeaderProps> = ({ stats }) => {
  return (
    <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <MessageCircle className="w-8 h-8 text-purple-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Messages</h1>
              <p className="text-gray-400 mt-1">Manage your conversations with buyers</p>
            </div>
          </div>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-[#1a1a1a] rounded-lg p-4 border border-gray-800"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Chats</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.totalThreads}</p>
              </div>
              <Users className="w-8 h-8 text-purple-400 opacity-50" />
            </div>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-[#1a1a1a] rounded-lg p-4 border border-gray-800"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Unread Messages</p>
                <p className="text-2xl font-bold text-orange-400 mt-1">{stats.totalUnreadMessages}</p>
              </div>
              <Mail className="w-8 h-8 text-orange-400 opacity-50" />
            </div>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-[#1a1a1a] rounded-lg p-4 border border-gray-800"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Unread Chats</p>
                <p className="text-2xl font-bold text-pink-400 mt-1">{stats.totalUnreadThreads}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-pink-400 opacity-50" />
            </div>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-[#1a1a1a] rounded-lg p-4 border border-gray-800"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Custom Requests</p>
                <p className="text-2xl font-bold text-green-400 mt-1">{stats.customRequests}</p>
              </div>
              <MessageCircle className="w-8 h-8 text-green-400 opacity-50" />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default MessagesHeader;