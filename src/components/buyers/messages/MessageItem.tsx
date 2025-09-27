// src/components/buyers/messages/MessageItem.tsx
import React, { useRef, useState } from 'react';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { Message, CustomRequest, isSingleEmoji } from '@/utils/messageUtils';
import { SecureMessageDisplay, SecureImage } from '@/components/ui/SecureMessageDisplay';
import { SecureInput, SecureTextarea } from '@/components/ui/SecureInput';
import { securityService, validationSchemas } from '@/services';
import { 
  sanitizeStrict, 
  sanitizeCurrency, 
  sanitizeNumber 
} from '@/utils/security/sanitization';
import { resolveApiUrl } from '@/utils/url';
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
  isLatestCustom?: boolean;
  isPaid?: boolean;
  handleAccept?: (req: CustomRequest) => void;
  handleDecline?: (req: CustomRequest) => void;
  handleEditRequest?: (req: CustomRequest) => void;
  editRequestId?: string | null;
  editTitle?: string;
  setEditTitle?: (title: string) => void;
  editPrice?: number | '';
  setEditPrice?: (price: number | '') => void;
  editMessage?: string;
  setEditMessage?: (message: string) => void;
  handleEditSubmit?: () => void;
  setEditRequestId?: (id: string | null) => void;
  statusBadge?: (status: string) => React.ReactElement;
  setPreviewImage: (url: string | null) => void;
  showPayNow?: boolean;
  handlePayNow?: (req: CustomRequest) => void;
  markupPrice?: number;
  canPay?: boolean;
  showEditButton?: boolean;
}

export default function MessageItem({
  msg,
  index,
  isFromMe,
  user,
  activeThread,
  onMessageVisible,
  customReq,
  isLatestCustom = false,
  isPaid = false,
  handleAccept,
  handleDecline,
  handleEditRequest,
  editRequestId,
  editTitle = '',
  setEditTitle,
  editPrice = '',
  setEditPrice,
  editMessage = '',
  setEditMessage,
  handleEditSubmit,
  setEditRequestId,
  statusBadge,
  setPreviewImage,
  showPayNow = false,
  handlePayNow,
  markupPrice = 0,
  canPay = false,
  showEditButton = true
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

  // Check if message contains only a single emoji
  const isSingleEmojiMsg = msg.content && isSingleEmoji(msg.content);

  // CRITICAL FIX: Determine if the current user is the last editor
  const isLastEditor = customReq && customReq.lastModifiedBy === user?.username;
  
  // Show action buttons logic
  const showActionButtons = !!customReq &&
    isLatestCustom &&
    (customReq.status === 'pending' || customReq.status === 'edited') &&
    !isLastEditor &&
    !isPaid;

  // Validate edit form before submission
  const handleSecureEditSubmit = () => {
    if (!handleEditSubmit) return;

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

  // FIX: Resolve the image URL if it exists
  const resolvedImageUrl = msg.type === 'image' && msg.meta?.imageUrl 
    ? resolveApiUrl(msg.meta.imageUrl)
    : null;

  // FIX: Also resolve custom request icon URL - provide fallback if null
  const resolvedCustomRequestIcon = resolveApiUrl('/Custom_Request_Icon.png') || '/Custom_Request_Icon.png';
  
  // Log for debugging
  if (msg.type === 'image' && msg.meta?.imageUrl) {
    console.log('[MessageItem] Image message:', { 
      original: msg.meta.imageUrl, 
      resolved: resolvedImageUrl 
    });
  }

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
        
        {/* Image message - FIXED to use resolved URL */}
        {msg.type === 'image' && resolvedImageUrl && (
          <div className="mt-1 mb-2">
            <SecureImage
              src={resolvedImageUrl}
              alt="Shared image"
              className="max-w-full rounded cursor-pointer hover:opacity-90 transition-opacity shadow-sm"
              fallbackSrc="/placeholder-image.png"
              onError={() => console.warn('Failed to load message image:', resolvedImageUrl)}
              onClick={(e: React.MouseEvent<HTMLImageElement>) => {
                e.stopPropagation();
                setPreviewImage(resolvedImageUrl);
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
        
        {/* Text content - Using SecureMessageDisplay for XSS protection */}
        {msg.type !== 'image' && msg.type !== 'customRequest' && (
          <div className={isSingleEmojiMsg ? 'text-3xl' : ''}>
            <SecureMessageDisplay 
              content={msg.content || ''}
              allowBasicFormatting={false}
              className={isFromMe ? 'text-black' : 'text-[#fefefe]'}
            />
          </div>
        )}
        
        {/* Custom request content - Sanitized display */}
        {msg.type === 'customRequest' && msg.meta && (
          <div className={`mt-2 text-sm space-y-1 border-t ${isFromMe ? 'border-black/20' : 'border-white/20'} pt-2`}>
            <div className={`font-semibold flex items-center ${isFromMe ? 'text-black' : 'text-[#fefefe]'}`}>
              <div className="relative mr-2 flex items-center justify-center">
                <div className="bg-white w-6 h-6 rounded-full absolute"></div>
                <SecureImage 
                  src={resolvedCustomRequestIcon}
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
            {customReq && statusBadge && (
              <p className={`flex items-center ${isFromMe ? 'text-black' : 'text-[#fefefe]'}`}>
                <b>Status:</b>
                {statusBadge(customReq.status)}
              </p>
            )}
            
            {/* Show who needs to take action */}
            {customReq && isLatestCustom && (customReq.status === 'pending' || customReq.status === 'edited') && !isPaid && (
              <p className={`text-xs italic ${isFromMe ? 'text-black/70' : 'text-[#fefefe]/70'}`}>
                {isLastEditor ? (
                  <span className="flex items-center">
                    <Clock size={12} className="mr-1" />
                    Waiting for {sanitizedActiveThread} to respond...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <AlertTriangle size={12} className="mr-1" />
                    Action required from you
                  </span>
                )}
              </p>
            )}
            
            {/* Edit form with secure inputs */}
            {editRequestId === customReq?.id && customReq && setEditTitle && setEditPrice && setEditMessage && handleEditSubmit && setEditRequestId && (
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
            
            {/* Action buttons for custom requests */}
            {showActionButtons && handleAccept && handleDecline && handleEditRequest && (
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
            
            {/* Pay now button - only show for buyer when accepted */}
            {showPayNow && customReq?.status === 'accepted' && handlePayNow && (
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
                      Pay ${sanitizeCurrency(markupPrice).toFixed(2)} Now
                    </button>
                    {!canPay && (
                      <span className="text-xs text-red-400 flex items-center">
                        <AlertTriangle size={12} className="mr-1" />
                        Insufficient balance to pay ${sanitizeCurrency(markupPrice).toFixed(2)}
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
