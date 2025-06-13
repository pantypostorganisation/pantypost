// src/components/sellers/messages/MessageItem.tsx
'use client';

import React, { useRef, useState } from 'react';
import {
  CheckCheck,
  Check,
  Clock,
  CheckCircle2,
  XCircle,
  Edit3,
  ShoppingBag,
  X
} from 'lucide-react';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { isSingleEmoji } from '@/utils/messageUtils';

interface MessageItemProps {
  msg: any;
  index: number;
  isFromMe: boolean;
  user: any;
  activeThread: string;
  onMessageVisible: (msg: any) => void;
  customReq?: any;
  isLatestCustom: boolean;
  isPaid: boolean;
  showActionButtons: boolean;
  handleAccept: (req: any) => void;
  handleDecline: (req: any) => void;
  handleEditRequest: (req: any) => void;
  editRequestId: string | null;
  editTitle: string;
  setEditTitle: (title: string) => void;
  editPrice: number | '';
  setEditPrice: (price: number | '') => void;
  editMessage: string;
  setEditMessage: (message: string) => void;
  handleEditSubmit: () => void;
  setEditRequestId: (id: string | null) => void;
  statusBadge: (status: string) => React.ReactElement;
  setPreviewImage: (url: string | null) => void;
}

export default function MessageItem({
  msg,
  index,
  isFromMe,
  user,
  activeThread,
  onMessageVisible,
  customReq,
  isLatestCustom,
  isPaid,
  showActionButtons,
  handleAccept,
  handleDecline,
  handleEditRequest,
  editRequestId,
  editTitle,
  setEditTitle,
  editPrice,
  setEditPrice,
  editMessage,
  setEditMessage,
  handleEditSubmit,
  setEditRequestId,
  statusBadge,
  setPreviewImage
}: MessageItemProps) {
  const messageRef = useRef<HTMLDivElement>(null);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);

  // Use Intersection Observer to track when message becomes visible
  useIntersectionObserver(messageRef, {
    threshold: 0.8,
    onIntersect: () => {
      if (!hasBeenVisible && !isFromMe && !msg.read) {
        setHasBeenVisible(true);
        onMessageVisible(msg);
      }
    }
  });

  const time = new Date(msg.date).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  const isSingleEmojiMsg = msg.content && isSingleEmoji(msg.content);

  return (
    <div ref={messageRef} className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}>
      <div className={`rounded-lg p-3 max-w-[75%] ${
        isFromMe 
          ? 'bg-[#ff950e] text-black shadow-lg' 
          : 'bg-[#303030] text-[#fefefe] shadow-md'
      }`}>
        {/* Message header */}
        <div className="flex items-center text-xs mb-1">
          <span className={isFromMe ? 'text-black opacity-75' : 'text-[#fefefe] opacity-75'}>
            {isFromMe ? 'You' : msg.sender} • {time}
          </span>
          {isFromMe && (
            <span className="ml-2 text-[10px]">
              {msg.read ? (
                <span className={`flex items-center ${isFromMe ? 'text-black opacity-60' : 'text-[#fefefe] opacity-60'}`}>
                  <CheckCheck size={12} className="mr-1" /> Read
                </span>
              ) : (
                <span className={isFromMe ? 'text-black opacity-50' : 'text-[#fefefe] opacity-50'}>Sent</span>
              )}
            </span>
          )}
        </div>
        
        {/* Image message */}
        {msg.type === 'image' && msg.meta?.imageUrl && (
          <div className="mt-1 mb-2">
            <img 
              src={msg.meta.imageUrl} 
              alt="Shared image" 
              className="max-w-full rounded cursor-pointer hover:opacity-90 transition-opacity shadow-sm"
              onClick={(e) => {
                e.stopPropagation();
                setPreviewImage(msg.meta?.imageUrl || null);
              }}
            />
            {msg.content && (
              <p className={`${isFromMe ? 'text-black' : 'text-[#fefefe]'} mt-2 ${isSingleEmojiMsg ? 'text-3xl' : ''}`}>
                {msg.content}
              </p>
            )}
          </div>
        )}
        
        {/* Text content */}
        {msg.type !== 'image' && msg.type !== 'customRequest' && (
          <p className={`${isFromMe ? 'text-black' : 'text-[#fefefe]'} ${isSingleEmojiMsg ? 'text-3xl' : ''}`}>
            {msg.content}
          </p>
        )}
        
        {/* Custom request content */}
        {msg.type === 'customRequest' && msg.meta && (
          <div className={`mt-2 text-sm space-y-1 border-t ${isFromMe ? 'border-black/20' : 'border-white/20'} pt-2`}>
            <div className={`font-semibold flex items-center ${isFromMe ? 'text-black' : 'text-[#fefefe]'}`}>
              <div className="relative mr-2 flex items-center justify-center">
                <div className="bg-white w-6 h-6 rounded-full absolute"></div>
                <img src="/Custom_Request_Icon.png" alt="Custom Request" className="w-8 h-8 relative z-10" />
              </div>
              Custom Request
            </div>
            <p className={isFromMe ? 'text-black' : 'text-[#fefefe]'}><b>Title:</b> {customReq ? customReq.title : msg.meta.title}</p>
            <p className={isFromMe ? 'text-black' : 'text-[#fefefe]'}><b>Price:</b> ${customReq ? customReq.price.toFixed(2) : msg.meta.price?.toFixed(2)}</p>
            {(customReq ? customReq.description : msg.meta.message) && (
              <p className={isFromMe ? 'text-black' : 'text-[#fefefe]'}><b>Message:</b> {customReq ? customReq.description : msg.meta.message}</p>
            )}
            {customReq && (
              <p className={`flex items-center ${isFromMe ? 'text-black' : 'text-[#fefefe]'}`}>
                <b>Status:</b>
                {statusBadge(customReq.status)}
              </p>
            )}
            {showActionButtons && !isPaid && (
              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    customReq && handleAccept(customReq);
                  }}
                  className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 flex items-center transition-colors duration-150 font-medium shadow-sm"
                >
                  <CheckCircle2 size={12} className="mr-1" />
                  Accept
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    customReq && handleDecline(customReq);
                  }}
                  className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700 flex items-center transition-colors duration-150 font-medium shadow-sm"
                >
                  <XCircle size={12} className="mr-1" />
                  Decline
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    customReq && handleEditRequest(customReq);
                  }}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 flex items-center transition-colors duration-150 font-medium shadow-sm"
                >
                  <Edit3 size={12} className="mr-1" />
                  Edit
                </button>
              </div>
            )}
            {editRequestId === customReq?.id && customReq && (
              <div className="mt-3 space-y-2 bg-white/90 p-3 rounded border border-black/20 shadow-sm">
                <input
                  type="text"
                  placeholder="Title"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="w-full p-2 border rounded bg-white border-gray-300 text-black placeholder-gray-500 focus:border-[#ff950e] focus:outline-none focus:ring-1 focus:ring-[#ff950e]"
                  onClick={(e) => e.stopPropagation()}
                />
                <input
                  type="number"
                  placeholder="Price (USD)"
                  value={editPrice}
                  onChange={e => {
                    const val = e.target.value;
                    setEditPrice(val === '' ? '' : Number(val));
                  }}
                  min="0.01"
                  step="0.01"
                  className="w-full p-2 border rounded bg-white border-gray-300 text-black placeholder-gray-500 focus:border-[#ff950e] focus:outline-none focus:ring-1 focus:ring-[#ff950e]"
                  onClick={(e) => e.stopPropagation()}
                />
                <textarea
                  placeholder="Message"
                  value={editMessage}
                  onChange={e => setEditMessage(e.target.value)}
                  className="w-full p-2 border rounded bg-white border-gray-300 text-black placeholder-gray-500 focus:border-[#ff950e] focus:outline-none focus:ring-1 focus:ring-[#ff950e]"
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditSubmit();
                    }}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 flex items-center transition-colors duration-150 font-medium shadow-sm"
                  >
                    <Edit3 size={12} className="mr-1" />
                    Submit Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditRequestId(null);
                    }}
                    className="bg-gray-600 text-white px-3 py-1 rounded text-xs hover:bg-gray-700 flex items-center transition-colors duration-150 font-medium shadow-sm"
                  >
                    <X size={12} className="mr-1" />
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
