// src/components/buyers/messages/MessageItem.tsx
import React, { useRef, useState } from 'react';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { Message, CustomRequest, isSingleEmoji } from '@/utils/messageUtils';
import {
  CheckCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Edit3,
  ShoppingBag,
  AlertTriangle,
  X
} from 'lucide-react';

export interface MessageItemProps {
  msg: Message;
  index: number;
  isFromMe: boolean;
  user: any;
  activeThread: string;
  onMessageVisible: (msg: Message) => void;
  customReq?: CustomRequest;
  isLatestCustom: boolean;
  isPaid: boolean;
  handleAccept: (req: CustomRequest) => void;
  handleDecline: (req: CustomRequest) => void;
  handleEditRequest: (req: CustomRequest) => void;
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
  showPayNow: boolean;
  handlePayNow: (req: CustomRequest) => void;
  markupPrice: number;
  canPay: boolean;
  showEditButton?: boolean; // Add this optional prop
}

// Determine if the user is the last editor of a custom request
function isLastEditor(customReq: CustomRequest | undefined, threadMessages: Message[], user: any): boolean {
  if (!customReq) return false;
  const lastMsg = threadMessages
    .filter(
      (msg) =>
        msg.type === 'customRequest' &&
        msg.meta &&
        msg.meta.id === customReq.id
    )
    .slice(-1)[0];
  return lastMsg && lastMsg.sender === user?.username;
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
  setPreviewImage,
  showPayNow,
  handlePayNow,
  markupPrice,
  canPay,
  showEditButton = true // Default to true to maintain existing behavior
}: MessageItemProps) {
  const messageRef = useRef<HTMLDivElement>(null);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);

  // Use Intersection Observer to track when message becomes visible
  useIntersectionObserver(messageRef, {
    threshold: 0.8, // Message is considered "read" when 80% visible
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

  // Check if message contains only a single emoji
  const isSingleEmojiMsg = msg.content && isSingleEmoji(msg.content);

  // Determine if we should show action buttons
  const showActionButtons = !!customReq &&
    isLatestCustom &&
    customReq.status === 'pending' &&
    customReq.lastModifiedBy !== user?.username;

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
        
        {/* Text content - Different colors for sent vs received */}
        {msg.type !== 'image' && msg.type !== 'customRequest' && (
          <p className={`${isFromMe ? 'text-black' : 'text-[#fefefe]'} ${isSingleEmojiMsg ? 'text-3xl' : ''}`}>
            {msg.content}
          </p>
        )}
        
        {/* Custom request content - ADAPTIVE TEXT COLOR */}
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
            
            {/* Edit form */}
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
            
            {/* Action buttons for custom requests */}
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
                {showEditButton && (
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
                )}
              </div>
            )}
            
            {/* Pay now button */}
            {showPayNow && (
              <div className="flex flex-col gap-2 pt-2">
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
                      <span className="text-xs text-red-400 flex items-center">
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
    </div>
  );
}
