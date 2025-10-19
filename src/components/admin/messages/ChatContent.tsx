// src/components/admin/messages/ChatContent.tsx
'use client';

import { useRef, useCallback, useState, useEffect, useMemo } from 'react';
import {
  ArrowRightCircle,
  CheckCheck,
  X,
  Paperclip,
  Smile,
  ShieldAlert,
  AlertTriangle,
  Clock,
  BadgeCheck,
  MessageCircle,
  MessageSquarePlus,
  Plus
} from 'lucide-react';
import ImagePreviewModal from '@/components/messaging/ImagePreviewModal';
import { Message } from '@/types/message';
import EmojiPicker from './EmojiPicker';
import { SecureTextarea } from '@/components/ui/SecureInput';
import { SecureMessageDisplay, SecureImage } from '@/components/ui/SecureMessageDisplay';
import { sanitizeStrict, sanitizeCurrency } from '@/utils/security/sanitization';
import { securityService } from '@/services/security.service';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

interface ChatContentProps {
  activeThread: string | null;
  activeMessages: Message[];
  userProfiles: { [user: string]: { pic: string | null; verified: boolean; role: string } };
  content: string;
  setContent: React.Dispatch<React.SetStateAction<string>>;
  selectedImage: string | null;
  setSelectedImage: React.Dispatch<React.SetStateAction<string | null>>;
  isUserBlocked: boolean;
  isUserReported: boolean;
  onSend: () => void;
  onBlockToggle: () => void;
  onReport: () => void;
  onStartNewConversation: () => void;
  username: string;
}

export default function ChatContent({
  activeThread,
  activeMessages,
  userProfiles,
  content,
  setContent,
  selectedImage,
  setSelectedImage,
  isUserBlocked,
  isUserReported,
  onSend,
  onBlockToggle,
  onReport,
  onStartNewConversation,
  username
}: ChatContentProps) {
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages]);

  const getInitial = (name: string) => (name ? name.charAt(0).toUpperCase() : '?');

  const isSingleEmoji = (text: string) => {
    // Robust single-emoji check
    try {
      const emojiRegex =
        /^(\p{Emoji_Presentation}|\p{Extended_Pictographic})(\u200d(\p{Emoji_Presentation}|\p{Extended_Pictographic}))*$/u;
      return !!text && emojiRegex.test(text.trim());
    } catch {
      // Fallback if Unicode props unsupported
      return false;
    }
  };

  const handleImageSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0] || null;
      setImageError(null);
      if (!file) return;

      const validation = securityService.validateFileUpload(file, {
        maxSize: MAX_IMAGE_SIZE,
        allowedTypes: ALLOWED_IMAGE_TYPES,
        allowedExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp']
      });

      if (!validation.valid) {
        setImageError(validation.error || 'Invalid file');
        return;
      }

      setIsImageLoading(true);
      const reader = new FileReader();

      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setIsImageLoading(false);
      };

      reader.onerror = () => {
        setImageError('Failed to read the image file. Please try again.');
        setIsImageLoading(false);
      };

      reader.readAsDataURL(file);
    },
    [setSelectedImage]
  );

  const triggerFileInput = useCallback(() => fileInputRef.current?.click(), []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        onSend();
      }
    },
    [onSend]
  );

  const handleEmojiSelect = useCallback(
    (emoji: string) => {
      setContent((prev) => `${prev}${emoji}`);
      inputRef.current?.focus();
    },
    [setContent]
  );

  const sanitizedActiveThread = useMemo(
    () => (activeThread ? sanitizeStrict(activeThread) : null),
    [activeThread]
  );
  const sanitizedUsername = useMemo(() => sanitizeStrict(username), [username]);

  if (!activeThread) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        <div className="text-center p-4">
          <div className="flex justify-center mb-4">
            <MessageCircle size={64} className="text-gray-600" />
          </div>
          <p className="text-xl mb-2">Select a conversation to view messages</p>
          <p className="text-sm mb-4">Your messages will appear here</p>
          <button
            onClick={onStartNewConversation}
            className="px-4 py-2 bg-[#ff950e] text-black font-medium rounded-lg hover:bg-[#e88800] transition-colors flex items-center justify-center mx-auto"
          >
            <MessageSquarePlus size={16} className="mr-2" />
            Start New Conversation
          </button>
        </div>
      </div>
    );
  }

  const canSend = (!!content.trim() || !!selectedImage) && !isImageLoading;

  return (
    <>
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-gray-800 bg-[#1a1a1a]">
        <div className="flex items-center">
          <div className="relative w-10 h-10 rounded-full bg-[#333] flex items-center justify-center text-white font-bold mr-3 overflow-hidden shadow-md">
            {userProfiles[activeThread]?.pic ? (
              <SecureImage
                src={userProfiles[activeThread].pic}
                alt={sanitizedActiveThread || ''}
                className="w-full h-full object-cover"
              />
            ) : (
              getInitial(sanitizedActiveThread || '')
            )}

            {userProfiles[activeThread]?.verified && (
              <div className="absolute bottom-0 right-0 bg-[#1a1a1a] p-0.5 rounded-full border border-[#ff950e] shadow-sm">
                <BadgeCheck size={12} className="text-[#ff950e]" />
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-1">
              <h2 className="font-bold text-lg text-white">
                <SecureMessageDisplay content={sanitizedActiveThread || ''} allowBasicFormatting={false} />
              </h2>
              <span className="text-xs px-2 py-0.5 rounded bg-[#333] text-gray-300">
                {userProfiles[activeThread]?.role === 'buyer'
                  ? 'Buyer'
                  : userProfiles[activeThread]?.role === 'seller'
                  ? 'Seller'
                  : 'User'}
              </span>
            </div>
            <p className="text-xs text-[#ff950e] flex items-center">
              <Clock size={12} className="mr-1 text-[#ff950e]" />
              Admin conversation
            </p>
          </div>
        </div>

        <div className="flex space-x-2 text-white">
          <button
            onClick={onReport}
            disabled={isUserReported}
            className={`px-3 py-1 text-xs border rounded flex items-center ${
              isUserReported
                ? 'text-gray-400 border-gray-500'
                : 'text-red-500 border-red-500 hover:bg-red-500/10'
            } transition-colors duration-150`}
            aria-disabled={isUserReported}
          >
            <AlertTriangle size={12} className="mr-1" />
            {isUserReported ? 'Reported' : 'Report'}
          </button>
          <button
            onClick={onBlockToggle}
            className={`px-3 py-1 text-xs border rounded flex items-center ${
              isUserBlocked
                ? 'text-green-500 border-green-500 hover:bg-green-500/10'
                : 'text-red-500 border-red-500 hover:bg-red-500/10'
            } transition-colors duration-150`}
          >
            <ShieldAlert size={12} className="mr-1" />
            {isUserBlocked ? 'Unblock' : 'Block'}
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-[#121212]">
        <div className="max-w-3xl mx-auto space-y-4">
          {activeMessages.map((msg, index) => {
            const isFromMe = msg.sender === username;
            const time = new Date(msg.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const isSingleEmojiMsg = !!msg.content && isSingleEmoji(msg.content);
            const sanitizedSender = sanitizeStrict(msg.sender || '');

            return (
              <div key={`${msg.id || 'm'}-${index}`} className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`rounded-lg p-3 max-w-[75%] ${
                    isFromMe ? 'bg-[#ff950e] text-white shadow-lg' : 'bg-[#333] text-white shadow-md'
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-center text-xs mb-1">
                    <span className={isFromMe ? 'text-white/75' : 'text-gray-300'}>
                      {isFromMe ? 'You' : sanitizedSender} • {time}
                    </span>
                    {isFromMe && (
                      <span className="ml-2 text-[10px]">
                        {msg.read ? (
                          <span className={`flex items-center ${isFromMe ? 'text-white/75' : 'text-gray-400'}`}>
                            <CheckCheck size={12} className="mr-1" /> Read
                          </span>
                        ) : (
                          <span className={isFromMe ? 'text-white/60' : 'text-gray-400'}>Sent</span>
                        )}
                      </span>
                    )}
                  </div>

                  {/* Image message */}
                  {msg.type === 'image' && msg.meta?.imageUrl && (
                    <div className="mt-1 mb-2">
                      <SecureImage
                        src={msg.meta.imageUrl}
                        alt="Shared image"
                        className="max-w-full rounded cursor-pointer hover:opacity-90 transition-opacity shadow-sm"
                        onClick={(e: React.MouseEvent<HTMLImageElement>) => {
                          e.stopPropagation();
                          setPreviewImage(msg.meta?.imageUrl || null);
                        }}
                      />
                      {msg.content && (
                        <div className={`mt-2 ${isSingleEmojiMsg ? 'text-3xl' : ''}`}>
                          <SecureMessageDisplay content={msg.content} allowBasicFormatting={false} className="text-white" />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Text message */}
                  {msg.type !== 'image' && msg.type !== 'customRequest' && (
                    <div className={isSingleEmojiMsg ? 'text-3xl' : ''}>
                      <SecureMessageDisplay content={msg.content || ''} allowBasicFormatting={false} className="text-white" />
                    </div>
                  )}

                  {/* Custom request */}
                  {msg.type === 'customRequest' && msg.meta && (
                    <div className="mt-2 text-sm text-orange-400 space-y-1 border-t border-white/20 pt-2">
                      <p className="font-semibold flex items-center">
                        <Paperclip size={16} className="mr-1" />
                        Custom Request
                      </p>
                      <p>
                        <b>Title:</b> {sanitizeStrict(msg.meta.title || '')}
                      </p>
                      <p>
                        <b>Price:</b> $
                        {Number(sanitizeCurrency(msg.meta.price ?? 0)).toFixed(2)}
                      </p>
                      <p>
                        <b>Tags:</b> {(msg.meta.tags || []).map((tag) => sanitizeStrict(tag)).join(', ')}
                      </p>
                      {msg.meta.message && (
                        <div>
                          <b>Message:</b>{' '}
                          <SecureMessageDisplay content={msg.meta.message} allowBasicFormatting={false} className="inline text-orange-400" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Composer */}
      {!isUserBlocked && (
        <div className="relative border-t border-gray-800 bg-[#1a1a1a]">
          {showEmojiPicker && <EmojiPicker onEmojiSelect={handleEmojiSelect} onClose={() => setShowEmojiPicker(false)} />}

          {/* Selected image preview */}
          {selectedImage && (
            <div className="px-4 pt-3 pb-2">
              <div className="relative inline-block">
                <SecureImage src={selectedImage} alt="Preview" className="max-h-20 rounded shadow-md" />
                <button
                  onClick={() => {
                    setSelectedImage(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 text-xs shadow-md transform transition-transform hover:scale-110"
                  style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  aria-label="Remove attached image"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Image states */}
          {isImageLoading && (
            <div className="px-4 pt-3 pb-0 text-sm text-gray-400" role="status" aria-live="polite">
              Loading image...
            </div>
          )}
          {imageError && (
            <div className="px-4 pt-3 pb-0 text-sm text-red-400 flex items-center" role="alert" aria-live="assertive">
              <AlertTriangle size={14} className="mr-1" />
              {imageError}
            </div>
          )}

          {/* Input */}
          <div className="px-4 py-3">
            <div className="relative mb-2">
              <SecureTextarea
                ref={inputRef}
                value={content}
                onChange={setContent}
                onKeyDown={handleKeyDown}
                placeholder={selectedImage ? 'Add a caption...' : 'Type a message'}
                className="w-full p-3 pr-24 rounded-lg bg-[#222] border border-gray-700 text-white focus:outline-none focus:ring-1 focus:ring-[#ff950e] min-h-[40px] max-h-20 resize-none overflow-auto leading-tight"
                rows={1}
                maxLength={250}
                characterCount={false}
                sanitize
              />

              <input
                type="file"
                accept={ALLOWED_IMAGE_TYPES.join(',')}
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleImageSelect}
              />

              <div className="absolute right-3 top-1/2 -translate-y-1/2 mt-[-4px] flex items-center gap-2">
                <button
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.stopPropagation();
                    if (isImageLoading) return;
                    triggerFileInput();
                  }}
                  className="flex items-center justify-center h-8 w-8 rounded-full bg-[#2b2b2b] text-gray-300 hover:text-white hover:bg-[#333] transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Attach Image"
                  aria-label="Attach image"
                  type="button"
                  disabled={isImageLoading}
                >
                  <Plus size={18} />
                </button>

                {/* Emoji button */}
                <button
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.stopPropagation();
                    setShowEmojiPicker((v) => !v);
                  }}
                  className={`flex items-center justify-center h-8 w-8 rounded-full ${
                    showEmojiPicker ? 'bg-[#ff950e] text-black' : 'text-[#ff950e] hover:bg-[#333]'
                  } transition-colors duration-150`}
                  title="Emoji"
                  type="button"
                  aria-pressed={showEmojiPicker}
                >
                  <Smile size={20} className="flex-shrink-0" />
                </button>
              </div>
            </div>

            {content.length > 0 && <div className="text-xs text-gray-400 mb-2 text-right">{content.length}/250</div>}

            {/* Actions */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <button
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.stopPropagation();
                    setShowEmojiPicker((v) => !v);
                  }}
                  className={`md:hidden w-[52px] h-[52px] flex items-center justify-center rounded-full shadow-md text-black text-2xl ${
                    showEmojiPicker ? 'bg-[#e88800]' : 'bg-[#ff950e] hover:bg-[#e88800]'
                  } transition-colors duration-150`}
                  title="Emoji"
                  aria-label="Emoji"
                  type="button"
                >
                  <Smile size={26} />
                </button>
              </div>

              <button
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.stopPropagation();
                  onSend();
                }}
                disabled={!canSend}
                className={`flex items-center justify-center gap-2 px-4 py-1.5 rounded-2xl transition-colors duration-150 shadow-md text-sm font-semibold ${
                  canSend
                    ? 'bg-[#ff950e] text-black hover:bg-[#e88800]'
                    : 'bg-[#2b2b2b] text-gray-500 cursor-not-allowed'
                }`}
                type="button"
              >
                <span>Send</span>
                <ArrowRightCircle size={16} className="flex-shrink-0" />
              </button>
            </div>
          </div>
        </div>
      )}

      {isUserBlocked && (
        <div className="p-4 border-t border-gray-800 text-center text-sm text-red-400 bg-[#1a1a1a] flex items-center justify-center">
          <ShieldAlert size={16} className="mr-2" />
          You have blocked this user
          <button
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.stopPropagation();
              onBlockToggle();
            }}
            className="ml-2 underline text-gray-400 hover:text-white transition-colors duration-150"
          >
            Unblock
          </button>
        </div>
      )}

      <ImagePreviewModal imageUrl={previewImage || ''} isOpen={!!previewImage} onClose={() => setPreviewImage(null)} />
    </>
  );
}
