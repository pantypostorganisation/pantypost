// src/components/sellers/messages/MessageBubble.tsx
'use client';

import React from 'react';
import { CheckCheck, Check, Image as ImageIcon } from 'lucide-react';
import { Message } from '@/types/seller-message';

// Helper function to format time
const formatTime = (date: Date): string => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

interface UserProfile {
  pic: string | null;
  verified: boolean;
  role: string;
}

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  userProfile: UserProfile | null;
  onImageClick?: (imageUrl: string) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwnMessage,
  userProfile,
  onImageClick
}) => {
  const getInitial = (username: string) => username.charAt(0).toUpperCase();
  
  const isSingleEmoji = (content: string) => {
    const emojiRegex = /^(\p{Emoji_Presentation}|\p{Extended_Pictographic})(\u200d(\p{Emoji_Presentation}|\p{Extended_Pictographic}))*$/u;
    return emojiRegex.test(content.trim());
  };
  
  const isEmojiOnly = message.type !== 'image' && isSingleEmoji(message.content);
  
  return (
    <div className={`flex gap-3 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      {/* Avatar for other's messages */}
      {!isOwnMessage && (
        <div className="flex-shrink-0 mt-auto">
          {userProfile?.pic ? (
            <img
              src={userProfile.pic}
              alt={message.sender}
              className="w-8 h-8 rounded-full object-cover border border-gray-700"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold">
              {getInitial(message.sender)}
            </div>
          )}
        </div>
      )}
      
      {/* Message Content */}
      <div className={`max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
        <div
          className={`
            relative group
            ${isEmojiOnly 
              ? 'bg-transparent p-2' 
              : isOwnMessage 
                ? 'bg-purple-600 text-white rounded-2xl rounded-br-md px-4 py-2' 
                : 'bg-[#2a2a2a] text-white rounded-2xl rounded-bl-md px-4 py-2'
            }
          `}
        >
          {/* Image Message */}
          {message.type === 'image' && message.meta?.imageUrl ? (
            <div 
              className="cursor-pointer"
              onClick={() => onImageClick?.(message.meta!.imageUrl!)}
            >
              <img
                src={message.meta.imageUrl}
                alt="Shared image"
                className="max-w-full rounded-lg"
                style={{ maxHeight: '300px' }}
              />
              {message.content !== 'Image' && (
                <p className="mt-2 text-sm">{message.content}</p>
              )}
            </div>
          ) : (
            /* Text Message */
            <p className={`${isEmojiOnly ? 'text-4xl' : 'text-sm'} break-words`}>
              {message.content}
            </p>
          )}
          
          {/* Message Info (Time & Read Status) */}
          {!isEmojiOnly && (
            <div className={`flex items-center gap-1 mt-1 ${
              isOwnMessage ? 'justify-end' : 'justify-start'
            }`}>
              <span className={`text-xs ${
                isOwnMessage ? 'text-purple-200' : 'text-gray-500'
              }`}>
                {formatTime(new Date(message.date))}
              </span>
              {isOwnMessage && (
                message.read ? (
                  <CheckCheck className="w-3 h-3 text-purple-200" />
                ) : (
                  <Check className="w-3 h-3 text-purple-200" />
                )
              )}
            </div>
          )}
        </div>
        
        {/* Emoji-only message time */}
        {isEmojiOnly && (
          <div className={`flex items-center gap-1 mt-1 ${
            isOwnMessage ? 'justify-end' : 'justify-start'
          }`}>
            <span className="text-xs text-gray-500">
              {formatTime(new Date(message.date))}
            </span>
            {isOwnMessage && (
              message.read ? (
                <CheckCheck className="w-3 h-3 text-gray-500" />
              ) : (
                <Check className="w-3 h-3 text-gray-500" />
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;