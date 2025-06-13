// src/components/sellers/messages/MessageInputContainer.tsx
'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import MessageInput from './MessageInput';
import EmojiPicker from './EmojiPicker';
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE } from '@/constants/emojis';

interface MessageInputContainerProps {
  isUserBlocked: boolean;
  onBlockToggle: () => void;
  activeThread: string;
  replyMessage: string;
  setReplyMessage: (message: string) => void;
  selectedImage: string | null;
  setSelectedImage: (image: string | null) => void;
  isImageLoading: boolean;
  setIsImageLoading: (loading: boolean) => void;
  imageError: string | null;
  setImageError: (error: string | null) => void;
  showEmojiPicker: boolean;
  setShowEmojiPicker: (show: boolean) => void;
  recentEmojis: string[];
  handleReply: () => void;
  handleEmojiClick: (emoji: string) => void;
  handleImageSelect: (file: File) => void;
}

export default function MessageInputContainer({ 
  isUserBlocked, 
  onBlockToggle,
  activeThread,
  replyMessage,
  setReplyMessage,
  selectedImage,
  setSelectedImage,
  isImageLoading,
  setIsImageLoading,
  imageError,
  setImageError,
  showEmojiPicker,
  setShowEmojiPicker,
  recentEmojis,
  handleReply,
  handleEmojiClick,
  handleImageSelect
}: MessageInputContainerProps) {

  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Handle clicks outside emoji picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [setShowEmojiPicker]);

  // Focus input after emoji selection
  const handleEmojiClickWithFocus = useCallback((emoji: string) => {
    handleEmojiClick(emoji);
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 0);
  }, [handleEmojiClick]);

  // Handle reply with input focus
  const handleReplyWithFocus = useCallback(() => {
    console.log('handleReplyWithFocus called', { activeThread, replyMessage, hasImage: !!selectedImage });
    
    // Don't send if no active thread
    if (!activeThread) {
      console.error('No active thread selected');
      return;
    }

    // Don't send if message is empty and no image
    if (!replyMessage.trim() && !selectedImage) {
      console.log('Cannot send empty message');
      return;
    }

    console.log('Calling handleReply...');
    
    handleReply();
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 0);
  }, [activeThread, replyMessage, selectedImage, handleReply]);

  // Handle image selection from file input
  const handleImageSelectFromInput = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setImageError(null);
    
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setImageError("Please select a valid image file (JPEG, PNG, GIF, WEBP)");
      return;
    }
    
    if (file.size > MAX_IMAGE_SIZE) {
      setImageError(`Image too large. Maximum size is ${MAX_IMAGE_SIZE / (1024 * 1024)}MB`);
      return;
    }
    
    handleImageSelect(file);
  }, [setImageError, handleImageSelect]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleReplyWithFocus();
    }
  }, [handleReplyWithFocus]);

  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="relative">
      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div ref={emojiPickerRef}>
          <EmojiPicker
            recentEmojis={recentEmojis}
            onEmojiClick={handleEmojiClickWithFocus}
          />
        </div>
      )}
      
      <MessageInput
        ref={inputRef}
        replyMessage={replyMessage}
        setReplyMessage={setReplyMessage}
        selectedImage={selectedImage}
        setSelectedImage={setSelectedImage}
        imageError={imageError}
        isImageLoading={isImageLoading}
        showEmojiPicker={showEmojiPicker}
        setShowEmojiPicker={setShowEmojiPicker}
        isUserBlocked={isUserBlocked}
        onReply={handleReplyWithFocus}
        onKeyDown={handleKeyDown}
        onImageClick={triggerFileInput}
        onBlockToggle={onBlockToggle}
        fileInputRef={fileInputRef}
        emojiPickerRef={emojiPickerRef}
        onImageSelect={handleImageSelectFromInput}
      />
    </div>
  );
}
