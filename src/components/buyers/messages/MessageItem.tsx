// src/components/buyers/messages/MessageItem.tsx
'use client';

import React, { useRef, useState, useEffect } from 'react';
import { 
  CheckCheck, 
  ShoppingBag, 
  AlertTriangle, 
  Edit2, 
  Check, 
  X 
} from 'lucide-react';
import { isSingleEmoji } from '@/utils/messageHelpers';

interface MessageItemProps {
  msg: any;
  index: number;
  isFromMe: boolean;
  user: any;
  activeThread: string;
  onMessageVisible: (msg: any) => void;
  customReq: any;
  isLatestCustom: boolean;
  isPaid: boolean;
  showPayNow: boolean;
  markupPrice: number;
  canPay: boolean;
  showEditButton: boolean;
  handleAccept: (req: any) => void;
  handleDecline: (req: any) => void;
  handleEditRequest: (req: any) => void;
  handlePayNow: (req: any) => void;
  statusBadge: (status: string) => React.ReactElement;
  setPreviewImage: (image: string | null) => void;
}

// Custom hook for Intersection Observer
function useIntersectionObserver(
  targetRef: React.RefObject<HTMLElement | null>,
  options: IntersectionObserverInit & { onIntersect: () => void }
) {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            options.onIntersect();
          }
        });
      },
      {
        root: options.root,
        rootMargin: options.rootMargin || '0px',
        threshold: options.threshold || 0.5
      }
    );

    const target = targetRef.current;
    if (target) {
      observer.observe(target);
    }

    return () => {
      if (target) {
        observer.unobserve(target);
      }
    };
  }, [targetRef, options.root, options.rootMargin, options.threshold, options.onIntersect]);
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
  showPayNow,
  markupPrice,
  canPay,
  showEditButton,
  handleAccept,
  handleDecline,
  handleEditRequest,
  handlePayNow,
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
          {/* Only show Read/Sent for messages that the buyer sends */}
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
            {(customReq?.tags?.length > 0 || msg.meta.tags?.length > 0) && (
              <p className={isFromMe ? 'text-black' : 'text-[#fefefe]'}><b>Tags:</b> {(customReq?.tags || msg.meta.tags || []).join(', ')}</p>
            )}
            {(customReq?.description || msg.meta.message) && (
              <p className={isFromMe ? 'text-black' : 'text-[#fefefe]'}><b>Message:</b> {customReq?.description || msg.meta.message}</p>
            )}
            
            {/* Status and actions for custom requests */}
            {customReq && isLatestCustom && (
              <div className="mt-3 pt-2 border-t border-white/20 space-y-2">
                <div className="flex items-center justify-between">
                  {statusBadge(customReq.status)}
                  {customReq.lastModifiedBy && customReq.lastModifiedBy !== customReq.buyer && (
                    <span className="text-xs opacity-60">
                      Edited by {customReq.lastModifiedBy}
                    </span>
                  )}
                </div>
                
                {/* Buyer actions */}
                {showEditButton && (
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        customReq && handleEditRequest(customReq);
                      }}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition-colors duration-150 flex items-center w-fit font-medium shadow-sm"
                    >
                      <Edit2 size={12} className="mr-1" />
                      Edit Request
                    </button>
                  </div>
                )}
                
                {/* Accept/Decline buttons (if seller sent back) */}
                {customReq.status === 'pending' && !isFromMe && customReq.lastModifiedBy === activeThread && (
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAccept(customReq);
                      }}
                      className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 transition-colors duration-150 flex items-center w-fit font-medium shadow-sm"
                    >
                      <Check size={12} className="mr-1" />
                      Accept
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDecline(customReq);
                      }}
                      className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700 transition-colors duration-150 flex items-center w-fit font-medium shadow-sm"
                    >
                      <X size={12} className="mr-1" />
                      Decline
                    </button>
                  </div>
                )}
                
                {/* Pay now button */}
                {showPayNow && (
                  <div className="mt-2">
                    {isPaid ? (
                      <span className="text-green-400 font-bold flex items-center">
                        <ShoppingBag size={14} className="mr-1" />
                        Paid ✅
                      </span>
                    ) : (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            customReq && canPay && handlePayNow(customReq);
                          }}
                          className={`bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 ${
                            !canPay ? 'opacity-50 cursor-not-allowed' : ''
                          } transition-colors duration-150 flex items-center w-fit font-medium shadow-sm`}
                          disabled={!canPay}
                        >
                          <ShoppingBag size={12} className="mr-1" />
                          Pay ${customReq ? `${markupPrice.toFixed(2)}` : ''} Now
                        </button>
                        {!canPay && (
                          <span className="text-xs text-red-400 flex items-center mt-1">
                            <AlertTriangle size={12} className="mr-1" />
                            Insufficient balance to pay ${markupPrice.toFixed(2)}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
