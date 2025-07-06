// src/components/seller/messages/MessageItem.tsx
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
import { SecureMessageDisplay, SecureImage } from '@/components/ui/SecureMessageDisplay';
import { SecureInput, SecureTextarea } from '@/components/ui/SecureInput';
import { securityService, validationSchemas } from '@/services';
import { 
  sanitizeStrict, 
  sanitizeCurrency, 
  sanitizeNumber 
} from '@/utils/security/sanitization';

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
  handleAccept: () => void;
  handleDecline: () => void;
  handleEditRequest: () => void;
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
  const [editErrors, setEditErrors] = useState<{
    title?: string;
    price?: string;
    description?: string;
  }>({});

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

  // Validate edit form before submission
  const handleSecureEditSubmit = () => {
    // Validate the custom request data
    const validationResult = securityService.validateAndSanitize(
      {
        title: editTitle,
        description: editMessage,
        price: typeof editPrice === 'string' ? parseFloat(editPrice) || 0 : editPrice
      },
      validationSchemas.messageSchemas.customRequest
    );

    if (!validationResult.success) {
      setEditErrors(validationResult.errors || {});
      return;
    }

    // Clear errors and submit
    setEditErrors({});
    handleEditSubmit();
  };

  // Sanitize display names
  const sanitizedSender = sanitizeStrict(msg.sender || '');
  const sanitizedActiveThread = sanitizeStrict(activeThread || '');
  const sanitizedUsername = sanitizeStrict(user?.username || '');

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
            {isFromMe ? 'You' : sanitizedSender} • {time}
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
        
        {/* Image message with secure display */}
        {msg.type === 'image' && msg.meta?.imageUrl && (
          <div className="mt-1 mb-2">
            <SecureImage
              src={msg.meta.imageUrl}
              alt="Shared image"
              className="max-w-full rounded cursor-pointer hover:opacity-90 transition-opacity shadow-sm"
              onError={() => console.error('Failed to load image')}
              onClick={(e: React.MouseEvent<HTMLImageElement>) => {
                e.stopPropagation();
                setPreviewImage(msg.meta?.imageUrl || null);
              }}
            />
            {msg.content && (
              <div className={`mt-2 ${isSingleEmojiMsg ? 'text-3xl' : ''}`}>
                <SecureMessageDisplay 
                  content={msg.content}
                  allowBasicFormatting={false}
                  className={isFromMe ? 'text-black' : 'text-[#fefefe]'}
                />
              </div>
            )}
          </div>
        )}
        
        {/* Text content with XSS protection */}
        {msg.type !== 'image' && msg.type !== 'customRequest' && (
          <div className={isSingleEmojiMsg ? 'text-3xl' : ''}>
            <SecureMessageDisplay 
              content={msg.content || ''}
              allowBasicFormatting={false}
              className={isFromMe ? 'text-black' : 'text-[#fefefe]'}
            />
          </div>
        )}
        
        {/* Custom request content with sanitized display */}
        {msg.type === 'customRequest' && msg.meta && (
          <div className={`mt-2 text-sm space-y-1 border-t ${isFromMe ? 'border-black/20' : 'border-white/20'} pt-2`}>
            <div className={`font-semibold flex items-center ${isFromMe ? 'text-black' : 'text-[#fefefe]'}`}>
              <div className="relative mr-2 flex items-center justify-center">
                <div className="bg-white w-6 h-6 rounded-full absolute"></div>
                <SecureImage 
                  src="/Custom_Request_Icon.png" 
                  alt="Custom Request" 
                  className="w-8 h-8 relative z-10"
                />
              </div>
              Custom Request
            </div>
            
            {/* Sanitize all displayed custom request data */}
            <p className={isFromMe ? 'text-black' : 'text-[#fefefe]'}>
              <b>Title:</b> {sanitizeStrict(customReq ? customReq.title : msg.meta.title || '')}
            </p>
            <p className={isFromMe ? 'text-black' : 'text-[#fefefe]'}>
              <b>Price:</b> ${sanitizeCurrency(customReq ? customReq.price : msg.meta.price || 0).toFixed(2)}
            </p>
            {(customReq ? customReq.description : msg.meta.message) && (
              <div className={isFromMe ? 'text-black' : 'text-[#fefefe]'}>
                <b>Message:</b> 
                <SecureMessageDisplay 
                  content={customReq ? customReq.description : msg.meta.message || ''}
                  allowBasicFormatting={false}
                  className="inline"
                />
              </div>
            )}
            {customReq && (
              <p className={`flex items-center ${isFromMe ? 'text-black' : 'text-[#fefefe]'}`}>
                <b>Status:</b>
                {statusBadge(customReq.status)}
              </p>
            )}
            
            {/* Show who needs to take action with sanitized names */}
            {customReq && isLatestCustom && (customReq.status === 'pending' || customReq.status === 'edited') && !isPaid && (
              <p className={`text-xs italic ${isFromMe ? 'text-black/70' : 'text-[#fefefe]/70'}`}>
                {customReq.pendingWith === sanitizedUsername ? (
                  <span className="flex items-center">
                    <Clock size={12} className="mr-1" />
                    Action required from you
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Clock size={12} className="mr-1" />
                    Waiting for {sanitizeStrict(customReq.pendingWith || sanitizedActiveThread)} to respond...
                  </span>
                )}
              </p>
            )}
            
            {/* Action buttons */}
            {showActionButtons && !isPaid && (
              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAccept();
                  }}
                  className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 flex items-center transition-colors duration-150 font-medium shadow-sm"
                >
                  <CheckCircle2 size={12} className="mr-1" />
                  Accept
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDecline();
                  }}
                  className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700 flex items-center transition-colors duration-150 font-medium shadow-sm"
                >
                  <XCircle size={12} className="mr-1" />
                  Decline
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditRequest();
                  }}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 flex items-center transition-colors duration-150 font-medium shadow-sm"
                >
                  <Edit3 size={12} className="mr-1" />
                  Edit
                </button>
              </div>
            )}
            
            {/* Edit form with secure inputs */}
            {editRequestId === customReq?.id && customReq && (
              <div className="mt-3 space-y-2 bg-white/90 p-3 rounded border border-black/20 shadow-sm">
                <SecureInput
                  type="text"
                  placeholder="Title"
                  value={editTitle}
                  onChange={setEditTitle}
                  error={editErrors.title}
                  touched={true}
                  className="w-full p-2 border rounded bg-white border-gray-300 text-black placeholder-gray-500"
                  onClick={(e: React.MouseEvent) => e.stopPropagation()}
                  maxLength={100}
                />
                <SecureInput
                  type="number"
                  placeholder="Price (USD)"
                  value={editPrice.toString()}
                  onChange={(val: string) => {
                    const sanitized = sanitizeNumber(val, 0.01, 1000);
                    setEditPrice(val === '' ? '' : sanitized);
                  }}
                  error={editErrors.price}
                  touched={true}
                  min="0.01"
                  max="1000"
                  step="0.01"
                  className="w-full p-2 border rounded bg-white border-gray-300 text-black placeholder-gray-500"
                  onClick={(e: React.MouseEvent) => e.stopPropagation()}
                />
                <SecureTextarea
                  placeholder="Message"
                  value={editMessage}
                  onChange={setEditMessage}
                  error={editErrors.description}
                  touched={true}
                  maxLength={500}
                  characterCount={true}
                  className="w-full p-2 border rounded bg-white border-gray-300 text-black placeholder-gray-500 min-h-[80px]"
                  onClick={(e: React.MouseEvent) => e.stopPropagation()}
                />
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSecureEditSubmit();
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
                      setEditErrors({});
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
