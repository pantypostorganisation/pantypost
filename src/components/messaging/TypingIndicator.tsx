// src/components/messaging/TypingIndicator.tsx
'use client';

import React from 'react';

interface TypingIndicatorProps {
  username: string;
  isTyping: boolean;
  userPic?: string | null;
}

export default function TypingIndicator({ username, isTyping, userPic }: TypingIndicatorProps) {
  if (!isTyping) return null;

  return (
    <div className="flex items-end gap-2 mb-3" style={{ animation: 'fadeIn 0.3s ease-out' }}>
      {/* User Avatar */}
      <div className="flex-shrink-0">
        {userPic ? (
          <img 
            src={userPic} 
            alt={username} 
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
            {username.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      
      {/* Typing Bubble Container */}
      <div className="flex flex-col">
        <div className="text-xs text-gray-400 mb-1">
          {username} is typing
        </div>
        
        {/* Clean bubble without tail */}
        <div 
          className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded shadow-sm"
          style={{
            background: 'linear-gradient(135deg, #2a2a2a 0%, #1f1f1f 100%)',
            border: '1px solid rgba(255, 149, 14, 0.15)',
            borderRadius: '6px',
            width: 'fit-content',
            minWidth: '48px',
            maxWidth: '56px'
          }}
        >
          {/* Typing dots */}
          <span 
            className="typing-dot"
            style={{
              width: '5px',
              height: '5px',
              background: '#ff950e',
              borderRadius: '50%',
              display: 'inline-block',
              animation: 'typingBounce 1.4s infinite ease-in-out',
              animationDelay: '0ms'
            }}
          />
          <span 
            className="typing-dot"
            style={{
              width: '5px',
              height: '5px',
              background: '#ff950e',
              borderRadius: '50%',
              display: 'inline-block',
              animation: 'typingBounce 1.4s infinite ease-in-out',
              animationDelay: '200ms'
            }}
          />
          <span 
            className="typing-dot"
            style={{
              width: '5px',
              height: '5px',
              background: '#ff950e',
              borderRadius: '50%',
              display: 'inline-block',
              animation: 'typingBounce 1.4s infinite ease-in-out',
              animationDelay: '400ms'
            }}
          />
        </div>
      </div>
      
      {/* Inline styles for animations - REDUCED BOUNCE HEIGHT */}
      <style jsx>{`
        @keyframes typingBounce {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.6;
          }
          30% {
            transform: translateY(-4px);
            opacity: 1;
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}