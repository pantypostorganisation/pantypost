// src/components/sellers/messages/MessageInputContainer.tsx
'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import MessageInput from './MessageInput';
import EmojiPicker from './EmojiPicker';
import { useSellerMessages } from '@/hooks/useSellerMessages';
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE } from '@/constants/emojis';

interface MessageInputContainerProps {
  isUserBlocked: boolean;
  onBlockToggle: () => void;
}

export default function MessageInputContainer({ 
  isUserBlocked, 
  onBlockToggle 
}: MessageInputContainerProps) {
  const {
    replyMessage,
    setReplyMessage,
    selectedImage,
    setSelectedImage,
    imageError,
    setImageError,
    isImageLoading,
    setIsImageLoading,
    showEmojiPicker,
    setShowEmojiPicker,
    recentEmojis,
    handleEmojiClick,
    handleReply
  } = useSellerMessages();

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
    handleReply();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 0);
  }, [handleReply]);

  // Handle image selection
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
  }, [setImageError, setIsImageLoading, setSelectedImage]);

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
        onImageSelect={handleImageSelect}
      />
    </div>
  );
}