// src/components/sellers/messages/EmptyState.tsx
'use client';

import React from 'react';
import { MessageCircle, Users, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const EmptyState: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md mx-auto p-8"
      >
        <div className="relative mb-6">
          <div className="w-24 h-24 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto">
            <MessageCircle className="w-12 h-12 text-purple-400" />
          </div>
          <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-pink-500/20 rounded-full flex items-center justify-center">
            <Users className="w-8 h-8 text-pink-400" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-3">
          Select a conversation
        </h2>
        
        <p className="text-gray-400 mb-6">
          Choose a buyer from the list to start messaging
        </p>
        
        <div className="flex items-center justify-center gap-2 text-gray-500">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Pick a chat from the sidebar</span>
        </div>
        
        {/* Tips */}
        <div className="mt-8 space-y-3">
          <div className="bg-[#1a1a1a] rounded-lg p-4 text-left">
            <p className="text-sm text-gray-300 font-medium mb-1">💡 Pro tip</p>
            <p className="text-xs text-gray-500">
              Reply quickly to buyer messages to improve your response rate and build trust
            </p>
          </div>
          
          <div className="bg-[#1a1a1a] rounded-lg p-4 text-left">
            <p className="text-sm text-gray-300 font-medium mb-1">🛡️ Stay safe</p>
            <p className="text-xs text-gray-500">
              Never share personal information or communicate outside the platform
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default EmptyState;