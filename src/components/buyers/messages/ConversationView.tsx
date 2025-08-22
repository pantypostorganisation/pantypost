import React, { useCallback, useContext, useEffect, useState, useRef } from 'react';
import { WalletContext } from '@/context/WalletContext';
import { useWebSocket } from '@/context/WebSocketContext';
import {
  BadgeCheck,
  AlertTriangle,
  ShieldAlert,
  X,
  Smile,
  Sparkles,
  Clock,
  CheckCircle2,
  XCircle,
  Edit3,
  ShoppingBag,
  Package,
} from 'lucide-react';
import MessageItem from './MessageItem';
import TypingIndicator from '@/components/messaging/TypingIndicator';
import { getLatestCustomRequestMessages, Message, CustomRequest, getInitial } from '@/utils/messageUtils';
import { SecureTextarea } from '@/components/ui/SecureInput';
import { SecureImage } from '@/components/ui/SecureMessageDisplay';
import { sanitizeStrict, sanitizeUsername } from '@/utils/security/sanitization';
import { formatActivityStatus } from '@/utils/format';
import { useUserActivityStatus } from '@/hooks/useUserActivityStatus';
import { ALL_EMOJIS } from '@/constants/emojis'; // ← single source of truth

// Helper to get conversation key (use sanitized usernames)
const getConversationKey = (userA: string, userB: string): string => {
  const a = sanitizeUsername(userA);
  const b = sanitizeUsername(userB);
  return [a, b].sort().join('-');
};

// Create a status badge component
export function statusBadge(status: string): React.ReactElement {
  let color = 'bg-yellow-400 text-black';
  let label = status.toUpperCase();
  let icon = <Clock size={12} className="mr-1" />;

  if (status === 'accepted') {
    color = 'bg-green-500 text-white';
    icon = <CheckCircle2 size={12} className="mr-1" />;
  } else if (status === 'rejected') {
    color = 'bg-red-500 text-white';
    icon = <XCircle size={12} className="mr-1" />;
  } else if (status === 'edited') {
    color = 'bg-blue-500 text-white';
    icon = <Edit3 size={12} className="mr-1" />;
  } else if (status === 'paid') {
    color = 'bg-green-600 text-white';
    icon = <ShoppingBag size={12} className="mr-1" />;
  } else if (status === 'pending') {
    color = 'bg-yellow-400 text-black';
    icon = <Clock size={12} className="mr-1" />;
  }

  return (
    <span className={`ml-2 px-2 py-0.5 rounded text-xs font-bold flex items-center ${color} shadow-sm`}>
      {icon}
      {label}
    </span>
  );
}

interface ConversationViewProps {
  activeThread: string;
  threads: { [seller: string]: Message[] };
  user: any;
  sellerProfiles: { [seller: string]: { pic: string | null; verified: boolean } };
  buyerRequests: CustomRequest[];
  wallet: { [username: string]: number };
  previewImage: string | null;
  setPreviewImage: (url: string | null) => void;
  showEmojiPicker: boolean;
  setShowEmojiPicker: (show: boolean) => void;
  recentEmojis: string[];
  replyMessage: string;
  setReplyMessage: (message: string) => void;
  selectedImage: string | null;
  setSelectedImage: (image: string | null) => void;
  isImageLoading: boolean;
  imageError: string | null;
  editRequestId: string | null;
  setEditRequestId: (id: string | null) => void;
  editPrice: number | '';
  setEditPrice: (price: number | '') => void;
  editTitle: string;
  setEditTitle: (title: string) => void;
  editTags: string;
  setEditTags: (tags: string) => void;
  editMessage: string;
  setEditMessage: (message: string) => void;
  handleReply: () => void;
  handleBlockToggle: () => void;
  handleReport: () => void;
  handleAccept: (req: CustomRequest) => void;
  handleDecline: (req: CustomRequest) => void;
  handleEditRequest: (req: CustomRequest) => void;
  handleEditSubmit: () => void;
  handlePayNow: (req: CustomRequest) => void;
  handleImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleMessageVisible: (msg: Message) => void;
  handleEmojiClick: (emoji: string) => void;
  isUserBlocked: boolean;
  isUserReported: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  messagesContainerRef: React.RefObject<HTMLDivElement | null>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  emojiPickerRef: React.RefObject<HTMLDivElement | null>;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  lastManualScrollTime: React.RefObject<number>;
  setShowCustomRequestModal: (show: boolean) => void;
  setShowTipModal: (show: boolean) => void;
}

export default function ConversationView(props: ConversationViewProps) {
  const {
    activeThread,
    threads,
    user,
    sellerProfiles,
    buyerRequests,
    wallet,
    previewImage,
    setPreviewImage,
    showEmojiPicker,
    setShowEmojiPicker,
    recentEmojis,
    replyMessage,
    setReplyMessage,
    selectedImage,
    setSelectedImage,
    isImageLoading,
    imageError,
    editRequestId,
    setEditRequestId,
    editPrice,
    setEditPrice,
    editTitle,
    setEditTitle,
    editTags,
    setEditTags,
    editMessage,
    setEditMessage,
    handleReply,
    handleBlockToggle,
    handleReport,
    handleAccept,
    handleDecline,
    handleEditRequest,
    handleEditSubmit,
    handlePayNow,
    handleImageSelect,
    handleMessageVisible,
    handleEmojiClick,
    isUserBlocked,
    isUserReported,
    messagesEndRef,
    messagesContainerRef,
    fileInputRef,
    emojiPickerRef,
    inputRef,
    lastManualScrollTime,
    setShowCustomRequestModal,
    setShowTipModal,
  } = props;

  const walletContext = useContext(WalletContext);
  const wsContext = useWebSocket();

  const [isSellerTyping, setIsSellerTyping] = useState(false);

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);
  const lastTypingEmitRef = useRef(0);
  const autoHideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasScrolledForTypingRef = useRef(false);
  const userHasScrolledRef = useRef(false);

  const { activityStatus, loading: activityLoading } = useUserActivityStatus(activeThread);

  const threadMessages = getLatestCustomRequestMessages(threads[activeThread] || [], buyerRequests);

  useEffect(() => {
    if (!activeThread || !user || !wsContext?.sendMessage) return;

    const threadId = getConversationKey(user.username, activeThread);
    wsContext.sendMessage('thread:focus', { threadId, otherUser: sanitizeUsername(activeThread) });

    return () => {
      wsContext.sendMessage('thread:blur', { threadId, otherUser: sanitizeUsername(activeThread) });
    };
  }, [activeThread, user, wsContext]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollHeight, scrollTop, clientHeight } = container;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      if (!isAtBottom) {
        userHasScrolledRef.current = true;
        lastManualScrollTime.current = Date.now();
      } else {
        userHasScrolledRef.current = false;
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [activeThread, messagesContainerRef, lastManualScrollTime]);

  useEffect(() => {
    if (!wsContext || !activeThread || !user) return;

    const conversationId = getConversationKey(user.username, activeThread);
    const handleTypingEvent = (data: any) => {
      if (data.conversationId === conversationId && data.username === sanitizeUsername(activeThread)) {
        if (autoHideTimeoutRef.current) {
          clearTimeout(autoHideTimeoutRef.current);
          autoHideTimeoutRef.current = null;
        }
        setIsSellerTyping(!!data.isTyping);
        if (data.isTyping && messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
        if (data.isTyping) {
          autoHideTimeoutRef.current = setTimeout(() => {
            setIsSellerTyping(false);
            autoHideTimeoutRef.current = null;
          }, 5000);
        }
      }
    };

    const unsubscribe = wsContext?.subscribe('message:typing', handleTypingEvent);
    return () => {
      if (autoHideTimeoutRef.current) {
        clearTimeout(autoHideTimeoutRef.current);
        autoHideTimeoutRef.current = null;
      }
      unsubscribe?.();
    };
  }, [activeThread, user, wsContext, messagesEndRef]);

  const handleTypingChange = useCallback(
    (value: string) => {
      setReplyMessage(value);
      if (wsContext && activeThread && user) {
        const conversationId = getConversationKey(user.username, activeThread);
        const now = Date.now();

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        if (value.trim()) {
          if (!isTypingRef.current || now - lastTypingEmitRef.current > 1000) {
            wsContext.sendMessage('message:typing', { conversationId, isTyping: true });
            lastTypingEmitRef.current = now;
            isTypingRef.current = true;
          }
          typingTimeoutRef.current = setTimeout(() => {
            isTypingRef.current = false;
            wsContext.sendMessage('message:typing', { conversationId, isTyping: false });
          }, 3000);
        } else if (isTypingRef.current) {
          isTypingRef.current = false;
          wsContext.sendMessage('message:typing', { conversationId, isTyping: false });
        }
      }
    },
    [activeThread, setReplyMessage, user, wsContext]
  );

  const stopTyping = useCallback(() => {
    if (wsContext && activeThread && user && isTypingRef.current) {
      const conversationId = getConversationKey(user.username, activeThread);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      isTypingRef.current = false;
      wsContext.sendMessage('message:typing', { conversationId, isTyping: false });
    }
  }, [activeThread, user, wsContext]);

  useEffect(() => {
    if (isSellerTyping && messagesEndRef.current) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [isSellerTyping, messagesEndRef]);

  function isLastEditor(customReq: CustomRequest | undefined) {
    if (!customReq) return false;
    const lastMsg = threadMessages
      .filter((msg: Message) => msg.type === 'customRequest' && msg.meta && msg.meta.id === customReq.id)
      .slice(-1)[0];
    return !!lastMsg && lastMsg.sender === user?.username;
  }

  const messageSanitizer = (value: string): string => value.replace(/<[^>]*>/g, '').slice(0, 250);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleReply();
      }
    },
    [handleReply]
  );

  const triggerFileInput = useCallback(() => fileInputRef.current?.click(), [fileInputRef]);

  const stableHandleReply = useCallback(() => {
    stopTyping();
    handleReply();
  }, [handleReply, stopTyping]);

  const stableHandleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleImageSelect(e);
  }, [handleImageSelect]);

  const getActivityDisplay = () => {
    if (isUserBlocked) return 'Blocked';
    if (activityLoading) return '...';
    return formatActivityStatus(activityStatus.isOnline, activityStatus.lastActive);
  };

  return (
    <>
      {/* Conversation header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-gray-800 bg-[#1a1a1a]">
        <div className="flex items-center">
          <div className="relative w-10 h-10 rounded-full bg-[#333] flex items-center justify-center text-white font-bold mr-3 overflow-hidden shadow-md">
            {sellerProfiles[activeThread]?.pic ? (
              <SecureImage
                src={sellerProfiles[activeThread].pic}
                alt={sanitizeUsername(activeThread)}
                className="w-full h-full object-cover"
                fallbackSrc="/placeholder-avatar.png"
              />
            ) : (
              getInitial(sanitizeUsername(activeThread))
            )}

            {sellerProfiles[activeThread]?.verified && (
              <div className="absolute bottom-0 right-0 bg-[#1a1a1a] p-0.5 rounded-full border border-[#ff950e] shadow-sm">
                <BadgeCheck size={12} className="text-[#ff950e]" />
              </div>
            )}

            {activityStatus.isOnline && !isUserBlocked && (
              <div className="absolute bottom-0 left-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#1a1a1a]" />
            )}
          </div>
          <div>
            <h2 className="font-bold text-lg text-white">{sanitizeStrict(activeThread)}</h2>
            <p
              className={`text-xs flex items-center ${
                activityStatus.isOnline && !isUserBlocked ? 'text-[#ff950e]' : 'text-gray-400'
              }`}
            >
              {activityStatus.isOnline && !isUserBlocked && <Sparkles size={12} className="mr-1 text-[#ff950e]" />}
              {getActivityDisplay()}
            </p>
          </div>
        </div>

        <div className="flex space-x-2 text-white">
          <button
            onClick={handleReport}
            disabled={isUserReported}
            className={`px-3 py-1 text-xs border rounded flex items-center ${
              isUserReported ? 'text-gray-400 border-gray-500' : 'text-red-500 border-red-500 hover:bg-red-500/10'
            } transition-colors duration-150`}
          >
            <AlertTriangle size={12} className="mr-1" />
            {isUserReported ? 'Reported' : 'Report'}
          </button>
          <button
            onClick={handleBlockToggle}
            className={`px-3 py-1 text-xs border rounded flex items-center ${
              isUserBlocked ? 'text-green-500 border-green-500 hover:bg-green-500/10' : 'text-red-500 border-red-500 hover:bg-red-500/10'
            } transition-colors duration-150`}
          >
            <ShieldAlert size={12} className="mr-1" />
            {isUserBlocked ? 'Unblock' : 'Block'}
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-[#121212]" ref={messagesContainerRef}>
        <div className="max-w-3xl mx-auto space-y-4 p-4">
          {threadMessages.map((msg: Message, index: number) => {
            const isFromMe = msg.sender === user?.username;

            let customReq: CustomRequest | undefined;
            if (msg.type === 'customRequest' && msg.meta && typeof msg.meta.id === 'string') {
              customReq = buyerRequests.find((r: CustomRequest) => r.id === msg.meta?.id);
            }

            const isLatestCustom =
              !!customReq &&
              (customReq.status === 'pending' || customReq.status === 'edited' || customReq.status === 'accepted') &&
              msg.type === 'customRequest';

            const showPayNow = !!customReq && customReq.status === 'accepted' && !customReq.paid && msg.type === 'customRequest';

            const markupPrice = customReq ? Math.round(customReq.price * 1.1 * 100) / 100 : 0;
            const currentBalance = user && walletContext ? walletContext.getBuyerBalance(user.username) : 0;
            const canPay = !!(customReq && currentBalance >= markupPrice);
            const isPaid = !!(customReq && (customReq.paid || customReq.status === 'paid'));

            const stableKey = msg.id ?? `${sanitizeUsername(msg.sender || 'unknown')}-${msg.date}-${index}`;

            return (
              <MessageItem
                key={stableKey}
                msg={msg}
                index={index}
                isFromMe={isFromMe}
                user={user}
                activeThread={activeThread}
                onMessageVisible={handleMessageVisible}
                customReq={customReq}
                isLatestCustom={isLatestCustom}
                isPaid={isPaid}
                handleAccept={handleAccept}
                handleDecline={handleDecline}
                handleEditRequest={handleEditRequest}
                editRequestId={editRequestId}
                editTitle={editTitle}
                setEditTitle={setEditTitle}
                editPrice={editPrice}
                setEditPrice={setEditPrice}
                editMessage={editMessage}
                setEditMessage={setEditMessage}
                handleEditSubmit={handleEditSubmit}
                setEditRequestId={setEditRequestId}
                statusBadge={statusBadge}
                setPreviewImage={setPreviewImage}
                showPayNow={showPayNow}
                handlePayNow={handlePayNow}
                markupPrice={markupPrice}
                canPay={canPay}
              />
            );
          })}

          <TypingIndicator username={activeThread} isTyping={isSellerTyping} userPic={sellerProfiles[activeThread]?.pic} />

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Composer */}
      {!isUserBlocked && (
        <div className="relative border-t border-gray-800 bg-[#1a1a1a]">
          {/* Selected image preview */}
          {selectedImage && (
            <div className="px-4 pt-3 pb-2">
              <div className="relative inline-block">
                <SecureImage src={selectedImage} alt="Selected preview" className="max-h-20 rounded shadow-md" />
                <button
                  onClick={() => {
                    setSelectedImage(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 text-xs shadow-md transform transition-transform hover:scale-110"
                  style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  aria-label="Remove attached image"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          )}

          {isImageLoading && <div className="px-4 pt-3 pb-0 text-sm text-gray-400">Loading image...</div>}

          {imageError && (
            <div className="px-4 pt-3 pb-0 text-sm text-red-400 flex items-center">
              <AlertTriangle size={14} className="mr-1" />
              {sanitizeStrict(imageError)}
            </div>
          )}

          {/* Input */}
          <div className="px-4 py-3">
            <div className="relative mb-2">
              <SecureTextarea
                ref={inputRef}
                value={replyMessage}
                onChange={handleTypingChange}
                onKeyPress={handleKeyDown}
                placeholder={selectedImage ? 'Add a caption...' : 'Type a message'}
                className="w-full p-3 pr-12 !bg-[#222] !border-gray-700 !text-white focus:!outline-none focus:!ring-1 focus:!ring-[#ff950e] min-h-[40px] max-h-20 !resize-none overflow-auto leading-tight"
                rows={1}
                maxLength={250}
                sanitizer={messageSanitizer}
                characterCount={false}
                aria-label="Message"
              />

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowEmojiPicker(!showEmojiPicker);
                }}
                className={`absolute right-3 top-1/2 -translate-y-1/2 mt-[-4px] flex items-center justify-center h-8 w-8 rounded-full ${
                  showEmojiPicker ? 'bg-[#ff950e] text-black' : 'text-[#ff950e] hover:bg-[#333]'
                } transition-colors duration-150`}
                title="Emoji"
                type="button"
                aria-label="Toggle emoji picker"
              >
                <Smile size={20} className="flex-shrink-0" />
              </button>
            </div>

            {replyMessage.length > 0 && (
              <div className="text-xs text-gray-400 mb-2 text-right">{replyMessage.length}/250</div>
            )}

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-0">
                <img
                  src="/Send_Tip_Icon.png"
                  alt="Send Tip"
                  className="w-14 h-14 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowTipModal(true);
                  }}
                  title="Send Tip"
                />

                <img
                  src="/Attach_Image_Icon.png"
                  alt="Attach Image"
                  className={`w-14 h-14 cursor-pointer hover:opacity-80 transition-opacity ${
                    isImageLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  onClick={(e) => {
                    if (isImageLoading) return;
                    e.stopPropagation();
                    triggerFileInput();
                  }}
                  title="Attach Image"
                />

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowEmojiPicker(!showEmojiPicker);
                  }}
                  className="md:hidden border-none p-0 bg-transparent focus:outline-none"
                  title="Emoji"
                  aria-label="Emoji"
                >
                  <Smile size={52} className="text-[#ff950e]" />
                </button>

                <img
                  src="/Custom_Request_Icon.png"
                  alt="Custom Request"
                  className="w-14 h-14 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowCustomRequestModal(true);
                  }}
                  title="Send Custom Request"
                />

                {/* Hidden file input with strict types */}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={stableHandleImageSelect}
                />
              </div>

              <img
                src="/Send_Button.png"
                alt="Send"
                onClick={(e) => {
                  e.stopPropagation();
                  stableHandleReply();
                }}
                className={`cursor-pointer hover:opacity-90 transition-opacity h-11 ${
                  (!replyMessage.trim() && !selectedImage) || isImageLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                style={{ pointerEvents: (!replyMessage.trim() && !selectedImage) || isImageLoading ? 'none' : 'auto' }}
              />
            </div>
          </div>

          {/* Inline emoji picker (grid) */}
          {showEmojiPicker && (
            <div
              ref={emojiPickerRef}
              className="absolute left-0 right-0 mx-4 bottom-full mb-2 bg-black border border-gray-800 shadow-lg z-50 rounded-lg overflow-hidden"
            >
              {/* Recent */}
              {recentEmojis.length > 0 && (
                <div className="px-3 pt-3">
                  <div className="text-xs text-gray-400 mb-2">Recent</div>
                  <div className="grid grid-cols-8 gap-1 mb-3">
                    {recentEmojis.slice(0, 16).map((emoji: string, idx: number) => (
                      <span
                        key={`recent-${idx}`}
                        onClick={() => handleEmojiClick(emoji)}
                        className="emoji-button flex items-center justify-center text-xl rounded-full w-10 h-10 cursor-pointer bg-black hover:bg-[#222] transition-colors duration-150"
                      >
                        {emoji}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* All emojis (shared constant) */}
              <div className="px-3 pt-2 pb-3">
                {recentEmojis.length > 0 && <div className="text-xs text-gray-400 mb-2">All Emojis</div>}
                <div className="grid grid-cols-8 gap-1 p-0 overflow-auto" style={{ maxHeight: '200px' }}>
                  {ALL_EMOJIS.map((emoji, idx) => (
                    <span
                      key={`emoji-${idx}`}
                      onClick={() => handleEmojiClick(emoji)}
                      className="emoji-button flex items-center justify-center text-xl rounded-full w-10 h-10 cursor-pointer bg-black hover:bg-[#222] transition-colors duration-150"
                    >
                      {emoji}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {isUserBlocked && (
        <div className="p-4 border-t border-gray-800 text-center text-sm text-red-400 bg-[#1a1a1a] flex items-center justify-center">
          <ShieldAlert size={16} className="mr-2" />
          You have blocked this seller
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleBlockToggle();
            }}
            className="ml-2 underline text-gray-400 hover:text-white transition-colors duration-150"
          >
            Unblock
          </button>
        </div>
      )}

      <style jsx global>{`
        .emoji-button::before {
          content: '';
          display: block;
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background-color: black;
          z-index: -1;
        }
        .emoji-button {
          position: relative;
          z-index: 1;
        }
      `}</style>
    </>
  );
}
