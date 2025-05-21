'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { CheckCheck } from 'lucide-react';
import ImagePreviewModal from './ImagePreviewModal';

type MessageType = 'normal' | 'customRequest' | 'image';

type Message = {
  sender: string;
  receiver: string;
  content: string;
  date: string;
  read?: boolean;
  type?: MessageType;
  meta?: {
    id?: string;
    title?: string;
    price?: number;
    tags?: string[];
    message?: string;
    imageUrl?: string;
  };
};

interface VirtualMessageListProps {
  messages: Message[];
  currentUser: string;
  onLoadMore?: () => void;
  hasMoreMessages?: boolean;
  loading?: boolean;
}

/**
 * VirtualMessageList component for efficient rendering of large message lists
 * This is a drop-in replacement for the static message list, but with better performance
 */
const VirtualMessageList: React.FC<VirtualMessageListProps> = ({
  messages,
  currentUser,
  onLoadMore,
  hasMoreMessages = false,
  loading = false,
}) => {
  const listRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);
  const [initialHeight, setInitialHeight] = useState(0);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  // Setup intersection observer for infinite scrolling
  useEffect(() => {
    if (!loadMoreRef.current || !hasMoreMessages || loading) return;
    
    const observer = new IntersectionObserver(
      entries => {
        const [entry] = entries;
        if (entry.isIntersecting && onLoadMore) {
          onLoadMore();
        }
      },
      { threshold: 0.5 }
    );
    
    observer.observe(loadMoreRef.current);
    
    return () => {
      observer.disconnect();
    };
  }, [hasMoreMessages, onLoadMore, loading]);
  
  // Format time function
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Check if user is at bottom before new messages arrive
  useEffect(() => {
    if (!listRef.current) return;
    
    const { scrollHeight, scrollTop, clientHeight } = listRef.current;
    // Consider "at bottom" if within 150px of the bottom
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 150;
    setIsScrolledToBottom(isAtBottom);
    
    // Save initial height
    if (initialHeight === 0) {
      setInitialHeight(scrollHeight);
    }
  }, [messages, initialHeight]);
  
  // Auto-scroll to bottom if user was already at bottom
  useEffect(() => {
    if (isScrolledToBottom && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, isScrolledToBottom]);
  
  // Render message content based on type
  const renderMessageContent = useCallback((message: Message) => {
    // Image message
    if (message.type === 'image' && message.meta?.imageUrl) {
      return (
        <div className="mt-1 mb-2">
          <img 
            src={message.meta.imageUrl} 
            alt="Shared image" 
            className="max-w-full rounded cursor-pointer hover:opacity-90 transition-opacity"
            loading="lazy"
            onClick={() => setPreviewImage(message.meta?.imageUrl || null)}
          />
          {message.content && (
            <p className="text-white mt-2">{message.content}</p>
          )}
        </div>
      );
    }
    
    // Custom request message
    if (message.type === 'customRequest' && message.meta) {
      return (
        <div className="mt-2 text-sm border-t border-white border-opacity-20 pt-2">
          <p><strong> Custom Request</strong></p>
          <p> Title: {message.meta.title}</p>
          <p> Price: ${message.meta.price != null ? message.meta.price.toFixed(2) : "0.00"}</p>
          <p> Tags: {message.meta.tags?.join(', ')}</p>
          {message.meta.message && <p> {message.meta.message}</p>}
        </div>
      );
    }
    
    // Regular text message
    return <p className="text-white">{message.content}</p>;
  }, []);
  
  return (
    <div 
      ref={listRef}
      className="flex-1 overflow-y-auto p-4 bg-[#121212]"
      aria-live="polite"
      aria-atomic="false"
    >
      {/* "Load More" element at the top */}
      {hasMoreMessages && (
        <div 
          ref={loadMoreRef}
          className="text-center py-2 mb-4"
        >
          {loading ? (
            <div className="flex justify-center items-center py-2">
              <div className="w-5 h-5 border-2 border-[#ff950e] border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-2 text-gray-400 text-sm">Loading...</span>
            </div>
          ) : (
            <button
              onClick={onLoadMore}
              className="bg-[#222] text-gray-300 text-sm px-4 py-2 rounded-full hover:bg-[#333]"
            >
              Load older messages
            </button>
          )}
        </div>
      )}
      
      <div className="max-w-3xl mx-auto space-y-4">
        {messages.map((msg, index) => {
          const isFromMe = msg.sender === currentUser;
          const time = formatTime(msg.date);
          
          return (
            <div 
              key={`${msg.date}-${index}`} 
              className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}
              aria-label={`Message from ${isFromMe ? 'you' : msg.sender}`}
            >
              <div 
                className={`rounded-lg p-3 max-w-[75%] ${
                  isFromMe ? 'bg-[#ff950e] text-white' : 'bg-[#333] text-white'
                }`}
              >
                {/* Message header */}
                <div className="flex items-center text-xs mb-1">
                  <span className={isFromMe ? 'text-white opacity-75' : 'text-gray-300'}>
                    {isFromMe ? 'You' : msg.sender}  {time}
                  </span>
                  {isFromMe && (
                    <span className="ml-2 text-[10px]">
                      {msg.read ? (
                        <span className={`flex items-center ${isFromMe ? 'text-white opacity-75' : 'text-gray-400'}`}>
                          <CheckCheck size={12} className="mr-1" /> Read
                        </span>
                      ) : (
                        <span className={isFromMe ? 'text-white opacity-50' : 'text-gray-400'}>Sent</span>
                      )}
                    </span>
                  )}
                </div>
                
                {/* Message content */}
                {renderMessageContent(msg)}
              </div>
            </div>
          );
        })}
        
        {/* Scroll anchor for auto-scrolling */}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Back to bottom button */}
      {!isScrolledToBottom && messages.length > 20 && (
        <button
          className="fixed bottom-24 right-8 bg-[#ff950e] text-black rounded-full p-2 shadow-lg z-10"
          onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
          aria-label="Scroll to bottom"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
      )}
      
      {/* Image Preview Modal */}
      <ImagePreviewModal
        imageUrl={previewImage || ''}
        isOpen={!!previewImage}
        onClose={() => setPreviewImage(null)}
      />
    </div>
  );
};

export default VirtualMessageList;
