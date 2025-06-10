// src/hooks/useSellerMessages.ts
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useListings } from '@/context/ListingContext';
import { useMessages } from '@/context/MessageContext';
import { useRequests } from '@/context/RequestContext';
import { useWallet } from '@/context/WalletContext';
import { useMessageData } from './useMessageData';

export function useSellerMessages() {
  const { user } = useAuth();
  const { addSellerNotification, users } = useListings();
  const { messages } = useMessages();
  const { requests } = useRequests();
  const { wallet } = useWallet();
  
  const messageData = useMessageData();
  
  // State for UI
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState<'all' | 'unread'>('all');
  
  // State for message input
  const [replyMessage, setReplyMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [recentEmojis, setRecentEmojis] = useState<string[]>([]);
  
  // State for custom request editing
  const [editRequestId, setEditRequestId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<number | ''>('');
  const [editTitle, setEditTitle] = useState('');
  const [editMessage, setEditMessage] = useState('');
  
  // Update UI when messages change
  useEffect(() => {
    messageData.setMessageUpdate(prev => prev + 1);
  }, [messages, messageData.setMessageUpdate]);
  
  // Load recent emojis from localStorage
  useEffect(() => {
    const storedRecentEmojis = localStorage.getItem('panty_recent_emojis');
    if (storedRecentEmojis) {
      try {
        const parsed = JSON.parse(storedRecentEmojis);
        if (Array.isArray(parsed)) {
          setRecentEmojis(parsed.slice(0, 30));
        }
      } catch (e) {
        console.error('Failed to parse recent emojis', e);
      }
    }
  }, []);
  
  // Save recent emojis to localStorage
  useEffect(() => {
    if (recentEmojis.length > 0) {
      localStorage.setItem('panty_recent_emojis', JSON.stringify(recentEmojis));
    }
  }, [recentEmojis]);
  
  // Handle emoji selection
  const handleEmojiClick = useCallback((emoji: string) => {
    setReplyMessage(prev => prev + emoji);
    
    setRecentEmojis(prev => {
      const filtered = prev.filter(e => e !== emoji);
      return [emoji, ...filtered].slice(0, 30);
    });
  }, []);
  
  // Handle sending messages
  const handleReply = useCallback(() => {
    const textContent = replyMessage.trim();

    if (!textContent && !selectedImage) {
      return;
    }

    if (selectedImage) {
      messageData.handleSendMessage(textContent || 'Image', 'image', selectedImage);
    } else {
      messageData.handleSendMessage(textContent);
    }

    setReplyMessage('');
    setSelectedImage(null);
    setShowEmojiPicker(false);
  }, [replyMessage, selectedImage, messageData.handleSendMessage]);
  
  // Handle custom request editing
  const handleEditRequest = useCallback((req: any) => {
    if (!req || typeof req !== 'object') return;
    
    setEditRequestId(req.id || null);
    setEditPrice(typeof req.price === 'number' ? req.price : '');
    setEditTitle(req.title || '');
    setEditMessage(req.description || '');
  }, []);
  
  const handleEditSubmit = useCallback(() => {
    if (!user || !messageData.activeThread || !editRequestId) return;
    
    if (!editTitle.trim() || editPrice === '' || isNaN(Number(editPrice)) || Number(editPrice) <= 0) {
      alert('Please enter a valid title and price for your edit.');
      return;
    }
    
    const priceValue = Number(editPrice);
    const tagsArray: string[] = [];
    
    messageData.respondToRequest(
      editRequestId,
      'pending',
      editMessage,
      {
        title: editTitle,
        price: priceValue,
        tags: tagsArray,
        description: editMessage,
      }
    );

    setEditRequestId(null);
    setEditPrice('');
    setEditTitle('');
    setEditMessage('');
  }, [
    user, 
    messageData.activeThread, 
    editRequestId, 
    editTitle, 
    editPrice, 
    editMessage, 
    messageData.respondToRequest
  ]);
  
  const handleAccept = useCallback((req: any) => {
    if (req && req.status === 'pending') {
      messageData.respondToRequest(req.id, 'accepted');
    }
  }, [messageData.respondToRequest]);
  
  const handleDecline = useCallback((req: any) => {
    if (req && req.status === 'pending') {
      messageData.respondToRequest(req.id, 'rejected');
    }
  }, [messageData.respondToRequest]);
  
  const isAdmin = user?.username === 'oakley' || user?.username === 'gerome';
  
  return {
    // Auth & admin status
    isAdmin,
    
    // Context data
    users,
    messages,
    requests,
    wallet,
    
    // Message data (includes user)
    ...messageData,
    
    // UI state
    previewImage,
    setPreviewImage,
    searchQuery,
    setSearchQuery,
    filterBy,
    setFilterBy,
    
    // Message input state
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
    
    // Custom request state
    editRequestId,
    setEditRequestId,
    editPrice,
    setEditPrice,
    editTitle,
    setEditTitle,
    editMessage,
    setEditMessage,
    
    // Handlers
    handleEmojiClick,
    handleReply,
    handleEditRequest,
    handleEditSubmit,
    handleAccept,
    handleDecline,
    
    // Utility
    addSellerNotification
  };
}