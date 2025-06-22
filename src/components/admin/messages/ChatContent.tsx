'use client';

import { useRef, useCallback, useState, useEffect } from 'react';
import {
  ArrowRightCircle,
  CheckCheck,
  X,
  Paperclip,
  Smile,
  Image,
  ShieldAlert,
  AlertTriangle,
  Clock,
  BadgeCheck,
  MessageCircle,
  MessageSquarePlus
} from 'lucide-react';
import ImagePreviewModal from '@/components/messaging/ImagePreviewModal';
import { Message } from '@/types/message';
import EmojiPicker from './EmojiPicker';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB limit for images
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

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeMessages]);

  const getInitial = (username: string) => {
    return username.charAt(0).toUpperCase();
  };

  const isSingleEmoji = (content: string) => {
    const emojiRegex = /^(\p{Emoji_Presentation}|\p{Extended_Pictographic})(\u200d(\p{Emoji_Presentation}|\p{Extended_Pictographic}))*$/u;
    return emojiRegex.test(content);
  };

  const handleImageSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setImageError(null);
    
    if (!file) return;
    
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setImageError("Please select a valid image file (JPEG, PNG, GIF, WEBP)");
      return;
    }
    
    if (file.size > MAX_IMAGE_SIZE) {
      setImageError(`Image too large. Maximum size is ${MAX_IMAGE_SIZE / (1024 * 1024)}MB`);
      return;
    }
    
    setIsImageLoading(true);
    
    const reader = new FileReader();
    
    reader.onloadend = () => {
      setSelectedImage(reader.result as string);
      setIsImageLoading(false);
    };
    
    reader.onerror = () => {
      setImageError("Failed to read the image file. Please try again.");
      setIsImageLoading(false);
    };
    
    reader.readAsDataURL(file);
  }, [setSelectedImage]);

  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  }, [onSend]);

  const handleEmojiSelect = useCallback((emoji: string) => {
    setContent(prev => prev + emoji);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [setContent]);

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

  return (
    <>
      {/* Conversation header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-gray-800 bg-[#1a1a1a]">
        <div className="flex items-center">
          <div className="relative w-10 h-10 rounded-full bg-[#333] flex items-center justify-center text-white font-bold mr-3 overflow-hidden shadow-md">
            {userProfiles[activeThread]?.pic ? (
              <img src={userProfiles[activeThread].pic} alt={activeThread} className="w-full h-full object-cover" />
            ) : (
              getInitial(activeThread)
            )}
            
            {/* Verified badge if applicable */}
            {userProfiles[activeThread]?.verified && (
              <div className="absolute bottom-0 right-0 bg-[#1a1a1a] p-0.5 rounded-full border border-[#ff950e] shadow-sm">
                <BadgeCheck size={12} className="text-[#ff950e]" />
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-1">
              <h2 className="font-bold text-lg text-white">{activeThread}</h2>
              <span className="text-xs px-2 py-0.5 rounded bg-[#333] text-gray-300">
                {userProfiles[activeThread]?.role === 'buyer' ? 'Buyer' : 
                 userProfiles[activeThread]?.role === 'seller' ? 'Seller' : 'User'}
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
              isUserReported ? 'text-gray-400 border-gray-500' : 'text-red-500 border-red-500 hover:bg-red-500/10'
            } transition-colors duration-150`}
          >
            <AlertTriangle size={12} className="mr-1" />
            {isUserReported ? 'Reported' : 'Report'}
          </button>
          <button
            onClick={onBlockToggle}
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
      <div className="flex-1 overflow-y-auto p-4 bg-[#121212]">
        <div className="max-w-3xl mx-auto space-y-4">
          {activeMessages.map((msg, index) => {
            const isFromMe = msg.sender === username;
            const time = new Date(msg.date).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            });
            
            const isSingleEmojiMsg = msg.content && isSingleEmoji(msg.content);
            
            return (
              <div key={index} className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`rounded-lg p-3 max-w-[75%] ${
                  isFromMe 
                    ? 'bg-[#ff950e] text-white shadow-lg' 
                    : 'bg-[#333] text-white shadow-md'
                }`}>
                  {/* Message header */}
                  <div className="flex items-center text-xs mb-1">
                    <span className={isFromMe ? 'text-white opacity-75' : 'text-gray-300'}>
                      {isFromMe ? 'You' : msg.sender} • {time}
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
                  
                  {/* Image message */}
                  {msg.type === 'image' && msg.meta?.imageUrl && (
                    <div className="mt-1 mb-2">
                      <img 
                        src={msg.meta.imageUrl} 
                        alt="Shared image" 
                        className="max-w-full rounded cursor-pointer hover:opacity-90 transition-opacity shadow-sm"
                        onClick={(e: React.MouseEvent<HTMLImageElement>) => {
                          e.stopPropagation();
                          setPreviewImage(msg.meta?.imageUrl || null);
                        }}
                      />
                      {msg.content && (
                        <p className={`text-white mt-2 ${isSingleEmojiMsg ? 'text-3xl' : ''}`}>
                          {msg.content}
                        </p>
                      )}
                    </div>
                  )}
                  
                  {/* Text content */}
                  {msg.type !== 'image' && msg.type !== 'customRequest' && (
                    <p className={`text-white ${isSingleEmojiMsg ? 'text-3xl' : ''}`}>
                      {msg.content}
                    </p>
                  )}
                  
                  {/* Custom request content */}
                  {msg.type === 'customRequest' && msg.meta && (
                    <div className="mt-2 text-sm text-orange-400 space-y-1 border-t border-white/20 pt-2">
                      <p className="font-semibold flex items-center">
                        <Paperclip size={16} className="mr-1" />
                        Custom Request
                      </p>
                      <p><b>Title:</b> {msg.meta.title}</p>
                      <p><b>Price:</b> ${msg.meta.price?.toFixed(2)}</p>
                      <p><b>Tags:</b> {msg.meta.tags?.join(', ')}</p>
                      {msg.meta.message && <p><b>Message:</b> {msg.meta.message}</p>}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          
          {/* Auto-scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Message input and emoji picker */}
      {!isUserBlocked && (
        <div className="relative border-t border-gray-800 bg-[#1a1a1a]">
          {/* Emoji Picker */}
          {showEmojiPicker && (
            <EmojiPicker
              onEmojiSelect={handleEmojiSelect}
              onClose={() => setShowEmojiPicker(false)}
            />
          )}
          
          {/* Selected image preview */}
          {selectedImage && (
            <div className="px-4 pt-3 pb-2">
              <div className="relative inline-block">
                <img src={selectedImage} alt="Preview" className="max-h-20 rounded shadow-md" />
                <button
                  onClick={() => {
                    setSelectedImage(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 text-xs shadow-md transform transition-transform hover:scale-110"
                  style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          )}
          
          {/* Image loading and error states */}
          {isImageLoading && (
            <div className="px-4 pt-3 pb-0 text-sm text-gray-400">
              Loading image...
            </div>
          )}
          
          {imageError && (
            <div className="px-4 pt-3 pb-0 text-sm text-red-400 flex items-center">
              <AlertTriangle size={14} className="mr-1" />
              {imageError}
            </div>
          )}
          
          {/* Message input */}
          <div className="px-4 py-3">
            <div className="relative mb-2">
              <textarea
                ref={inputRef}
                value={content}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={selectedImage ? "Add a caption..." : "Type a message"}
                className="w-full p-3 pr-12 rounded-lg bg-[#222] border border-gray-700 text-white focus:outline-none focus:ring-1 focus:ring-[#ff950e] min-h-[40px] max-h-20 resize-none overflow-auto leading-tight"
                rows={1}
                maxLength={250}
              />
              
              {/* Emoji button */}
              <button
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.stopPropagation();
                  setShowEmojiPicker(!showEmojiPicker);
                }}
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 mt-[-4px] flex items-center justify-center h-8 w-8 rounded-full ${
                  showEmojiPicker 
                    ? 'bg-[#ff950e] text-black' 
                    : 'text-[#ff950e] hover:bg-[#333]'
                } transition-colors duration-150`}
                title="Emoji"
                type="button"
              >
                <Smile size={20} className="flex-shrink-0" />
              </button>
            </div>
            
            {/* Character count */}
            {content.length > 0 && (
              <div className="text-xs text-gray-400 mb-2 text-right">
                {content.length}/250
              </div>
            )}
            
            {/* Bottom row with attachment and send buttons */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                {/* Attachment button */}
                <button
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.stopPropagation();
                    triggerFileInput();
                  }}
                  disabled={isImageLoading}
                  className={`w-[52px] h-[52px] flex items-center justify-center rounded-full shadow-md ${
                    isImageLoading 
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                      : 'bg-[#ff950e] text-black hover:bg-[#e88800]'
                  } transition-colors duration-150`}
                  title="Attach Image"
                  aria-label="Attach Image"
                >
                  <Image size={26} />
                </button>
                
                {/* Emoji button (mobile) */}
                <button
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.stopPropagation();
                    setShowEmojiPicker(!showEmojiPicker);
                  }}
                  className={`md:hidden w-[52px] h-[52px] flex items-center justify-center rounded-full shadow-md text-black text-2xl ${
                    showEmojiPicker 
                      ? 'bg-[#e88800]' 
                      : 'bg-[#ff950e] hover:bg-[#e88800]'
                  } transition-colors duration-150`}
                  title="Emoji"
                  aria-label="Emoji"
                >
                  <Smile size={26} />
                </button>
                
                {/* Hidden file input */}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleImageSelect}
                />
              </div>
              
              {/* Send Button */}
              <button
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.stopPropagation();
                  onSend();
                }}
                disabled={(!content.trim() && !selectedImage) || isImageLoading}
                className={`flex items-center justify-center px-5 py-2 rounded-full ${
                  (!content.trim() && !selectedImage) || isImageLoading
                    ? 'bg-[#c17200] cursor-not-allowed text-gray-300'
                    : 'bg-[#ff950e] text-black hover:bg-[#e88800]'
                } transition-colors duration-150 shadow-md`}
              >
                <span className="mr-1">Send</span>
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
      
      {/* Image Preview Modal */}
      <ImagePreviewModal
        imageUrl={previewImage || ''}
        isOpen={!!previewImage}
        onClose={() => setPreviewImage(null)}
      />
    </>
  );
}