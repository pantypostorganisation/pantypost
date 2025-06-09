// src/components/sellers/messages/ChatWindow.tsx
'use client';

import React, { useRef, useEffect } from 'react';
import { ArrowLeft, MoreVertical, Shield, AlertTriangle, BadgeCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import ImagePreviewModal from './ImagePreviewModal';
import CustomRequestCard from './CustomRequestCard';
import ChatActions from './ChatActions';
import { Message } from '@/types/seller-message';

interface UserProfile {
  pic: string | null;
  verified: boolean;
  role: string;
}

interface ChatWindowProps {
  buyer: string;
  messages: Message[];
  userProfile: UserProfile;
  onSendMessage: (buyer: string, content: string, type?: 'normal' | 'image', imageUrl?: string) => void;
  onBlock: () => void;
  onReport: () => void;
  onBack?: () => void;
  isMobileView: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  buyer,
  messages,
  userProfile,
  onSendMessage,
  onBlock,
  onReport,
  onBack,
  isMobileView
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showActions, setShowActions] = React.useState(false);
  const [previewImage, setPreviewImage] = React.useState<string | null>(null);
  
  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSendMessage = (content: string, image?: string | null) => {
    if (image) {
      onSendMessage(buyer, 'Image', 'image', image);
    } else if (content.trim()) {
      onSendMessage(buyer, content);
    }
  };
  
  const getInitial = (username: string) => username.charAt(0).toUpperCase();
  
  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="bg-[#1a1a1a] border-b border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isMobileView && onBack && (
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-400" />
              </button>
            )}
            
            {/* User Avatar */}
            <div className="relative">
              {userProfile?.pic ? (
                <img
                  src={userProfile.pic}
                  alt={buyer}
                  className="w-10 h-10 rounded-full object-cover border-2 border-gray-700"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                  {getInitial(buyer)}
                </div>
              )}
            </div>
            
            {/* User Info */}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-white">{buyer}</h2>
                {userProfile?.verified && (
                  <BadgeCheck className="w-4 h-4 text-blue-400" />
                )}
              </div>
              <p className="text-xs text-gray-400">Buyer</p>
            </div>
          </div>
          
          {/* Actions Button */}
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <MoreVertical className="w-5 h-5 text-gray-400" />
            </button>
            
            <AnimatePresence>
              {showActions && (
                <ChatActions
                  onBlock={onBlock}
                  onReport={onReport}
                  onClose={() => setShowActions(false)}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((message, index) => {
            const isOwnMessage = message.sender !== buyer;
            
            if (message.type === 'customRequest' && message.meta) {
              return (
                <motion.div
                  key={`${message.date}-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <CustomRequestCard
                    request={message.meta}
                    isOwnMessage={isOwnMessage}
                  />
                </motion.div>
              );
            }
            
            return (
              <motion.div
                key={`${message.date}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <MessageBubble
                  message={message}
                  isOwnMessage={isOwnMessage}
                  userProfile={isOwnMessage ? null : userProfile}
                  onImageClick={setPreviewImage}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>
      
      {/* Message Input */}
      <div className="border-t border-gray-800 bg-[#1a1a1a] px-4 py-4">
        <MessageInput
          onSendMessage={handleSendMessage}
          placeholder="Type a message..."
          autoFocus={!isMobileView}
        />
      </div>
      
      {/* Image Preview Modal */}
      <AnimatePresence>
        {previewImage && (
          <ImagePreviewModal
            imageUrl={previewImage}
            onClose={() => setPreviewImage(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatWindow;