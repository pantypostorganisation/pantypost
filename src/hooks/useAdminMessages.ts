// src/hooks/useAdminMessages.ts

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useListings } from '@/context/ListingContext';
import { useMessages } from '@/context/MessageContext';
import { storageService } from '@/services';
import { Message } from '@/types/message';
import { sanitize } from '@/services/security.service';
import { getRateLimiter, RATE_LIMITS } from '@/utils/security/rate-limiter';

export const useAdminMessages = () => {
  const { user } = useAuth();
  const { users } = useListings();
  const { 
    messages, 
    sendMessage, 
    markMessagesAsRead, 
    blockUser, 
    unblockUser, 
    reportUser, 
    isBlocked, 
    hasReported,
    getThreadsForUser,
    getAllThreadsInfo
  } = useMessages();
  
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [filterBy, setFilterBy] = useState<'all' | 'buyers' | 'sellers'>('all');
  const [viewsData, setViewsData] = useState<Record<string, number>>({});
  const [messageUpdate, setMessageUpdate] = useState(0);
  const [showUserDirectory, setShowUserDirectory] = useState(false);
  const [directorySearchQuery, setDirectorySearchQuery] = useState('');
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);
  
  const readThreadsRef = useRef<Set<string>>(new Set());
  const rateLimiter = getRateLimiter();
  
  const isAdmin = !!user && user.role === 'admin';
  const username = user?.username || '';

  // Load views data with error handling
  const loadViews = useCallback(async () => {
    try {
      if (typeof window !== 'undefined') {
        const data = await storageService.getItem<Record<string, number>>('listing_views', {});
        setViewsData(data);
      }
    } catch (error) {
      console.error('Failed to load views data:', error);
      setViewsData({});
    }
  }, []);

  // Load views and handle localStorage events
  useEffect(() => {
    loadViews();
    
    const handleStorageChange = () => loadViews();
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleStorageChange);
    };
  }, [loadViews]);

  // Load previously read threads
  useEffect(() => {
    const loadReadThreads = async () => {
      try {
        if (user) {
          const readThreadsKey = `panty_read_threads_${user.username}`;
          const readThreads = await storageService.getItem<string[]>(readThreadsKey, []);
          if (Array.isArray(readThreads)) {
            readThreadsRef.current = new Set(readThreads);
            setMessageUpdate(prev => prev + 1);
          }
        }
      } catch (error) {
        console.error('Failed to load read threads:', error);
      }
    };
    
    loadReadThreads();
  }, [user]);

  // UPDATED: Use new helper functions from MessageContext
  const { threads, unreadCounts, lastMessages, userProfiles, activeMessages, totalUnreadCount } = useMemo(() => {
    if (!user) return { 
      threads: {}, 
      unreadCounts: {}, 
      lastMessages: {}, 
      userProfiles: {}, 
      activeMessages: [],
      totalUnreadCount: 0 
    };
    
    // Use the new helper functions (no role filter for admin - sees all)
    const threads = getThreadsForUser(user.username);
    const threadInfos = getAllThreadsInfo(user.username);
    
    const unreadCounts: { [userKey: string]: number } = {};
    const lastMessages: { [userKey: string]: Message } = {};
    const userProfiles: { [userKey: string]: { pic: string | null, verified: boolean, role: string } } = {};
    let totalUnreadCount = 0;
    
    Object.entries(threadInfos).forEach(([userKey, info]) => {
      unreadCounts[userKey] = info.unreadCount;
      lastMessages[userKey] = info.lastMessage as Message;
      
      // Get user profile picture and verification status
      try {
        const userInfo = users?.[userKey];
        const isVerified = userInfo?.verified || userInfo?.verificationStatus === 'verified';
        const role = userInfo?.role || 'unknown';
        
        userProfiles[userKey] = { 
          pic: null,
          verified: isVerified,
          role: role
        };
      } catch (error) {
        console.error(`Error processing user profile for ${userKey}:`, error);
        userProfiles[userKey] = { pic: null, verified: false, role: 'unknown' };
      }
      
      // Only add to total if not in readThreadsRef
      if (!readThreadsRef.current.has(userKey) && info.unreadCount > 0) {
        totalUnreadCount += 1;
      }
    });
    
    // Get active messages
    let activeMessages: Message[] = [];
    if (activeThread) {
      activeMessages = threads[activeThread] || [];
    }

    return { threads, unreadCounts, lastMessages, userProfiles, activeMessages, totalUnreadCount };
  }, [user, messages, activeThread, users, messageUpdate, getThreadsForUser, getAllThreadsInfo]);

  // Get all users for directory (exclude the current admin and any admin accounts)
  const allUsers = useMemo(() => {
    const allUsersList = Object.entries(users || {})
      .filter(([uname, userInfo]) => 
        uname !== user?.username && // Exclude current admin user
        userInfo?.role !== 'admin'    // Exclude any admin accounts
      )
      .map(([uname, userInfo]) => {
        const isVerified = userInfo?.verified || userInfo?.verificationStatus === 'verified';
        
        return {
          username: uname,
          role: userInfo?.role || 'unknown',
          verified: isVerified,
          pic: null // Profile pics should be loaded through proper channels
        };
      });
    
    return allUsersList;
  }, [users, user]);

  // Mark messages as read when thread is selected
  useEffect(() => {
    const markThreadAsRead = async () => {
      if (activeThread && user) {
        const hasUnreadMessages = threads[activeThread]?.some(
          msg => !msg.read && msg.sender === activeThread && msg.receiver === user.username
        );
        
        if (hasUnreadMessages) {
          markMessagesAsRead(user.username, activeThread);
          
          if (!readThreadsRef.current.has(activeThread)) {
            readThreadsRef.current.add(activeThread);
            
            if (typeof window !== 'undefined') {
              const readThreadsKey = `panty_read_threads_${user.username}`;
              await storageService.setItem(readThreadsKey, Array.from(readThreadsRef.current));
              
              const event = new CustomEvent('readThreadsUpdated', { 
                detail: { threads: Array.from(readThreadsRef.current), username: user.username }
              });
              window.dispatchEvent(event);
            }
            
            setMessageUpdate(prev => prev + 1);
          }
        }
        
        if (typeof window !== 'undefined') {
          const event = new CustomEvent('threadSelected', { 
            detail: { thread: activeThread, username: user.username }
          });
          window.dispatchEvent(event);
        }
      }
    };
    
    markThreadAsRead();
  }, [activeThread, user, threads, markMessagesAsRead]);

  // Save read threads to localStorage
  useEffect(() => {
    const saveReadThreads = async () => {
      if (user && readThreadsRef.current.size > 0 && typeof window !== 'undefined') {
        const readThreadsKey = `panty_read_threads_${user.username}`;
        const threadsArray = Array.from(readThreadsRef.current);
        await storageService.setItem(readThreadsKey, threadsArray);
        
        const event = new CustomEvent('readThreadsUpdated', { 
          detail: { threads: threadsArray, username: user.username }
        });
        window.dispatchEvent(event);
      }
    };
    
    saveReadThreads();
  }, [messageUpdate, user]);

  const handleSend = useCallback(() => {
    if (!activeThread || (!content.trim() && !selectedImage)) {
      alert('Please enter a message.');
      return;
    }

    // Clear rate limit error
    setRateLimitError(null);

    // Check rate limit
    const rateLimitResult = rateLimiter.check('MESSAGE_SEND', RATE_LIMITS.MESSAGE_SEND);
    if (!rateLimitResult.allowed) {
      setRateLimitError(`Too many messages sent. Please wait ${rateLimitResult.waitTime} seconds.`);
      return;
    }

    // Sanitize message content
    const sanitizedContent = sanitize.strict(content.trim());

    // Validate image URL if provided
    if (selectedImage) {
      const sanitizedImageUrl = sanitize.url(selectedImage);
      if (!sanitizedImageUrl) {
        alert('Invalid image URL');
        return;
      }
    }

    sendMessage(username, activeThread, sanitizedContent, {
      type: selectedImage ? 'image' : 'normal',
      meta: selectedImage ? { imageUrl: selectedImage } : undefined,
    });
    
    setContent('');
    setSelectedImage(null);
  }, [activeThread, content, selectedImage, username, sendMessage, rateLimiter]);

  const handleBlockToggle = useCallback(() => {
    if (!activeThread) return;
    
    // Rate limit block/unblock actions
    const rateLimitResult = rateLimiter.check('REPORT_ACTION', RATE_LIMITS.REPORT_ACTION);
    if (!rateLimitResult.allowed) {
      alert(`Please wait ${rateLimitResult.waitTime} seconds before performing this action.`);
      return;
    }

    if (isBlocked(username, activeThread)) {
      unblockUser(username, activeThread);
    } else {
      blockUser(username, activeThread);
    }
  }, [activeThread, username, isBlocked, unblockUser, blockUser, rateLimiter]);

  const handleReport = useCallback(() => {
    if (activeThread && !hasReported(username, activeThread)) {
      // Rate limit report actions
      const rateLimitResult = rateLimiter.check('REPORT_ACTION', RATE_LIMITS.REPORT_ACTION);
      if (!rateLimitResult.allowed) {
        alert(`Please wait ${rateLimitResult.waitTime} seconds before reporting.`);
        return;
      }
      
      reportUser(username, activeThread);
    }
  }, [activeThread, username, hasReported, reportUser, rateLimiter]);

  const handleThreadSelect = useCallback((userId: string) => {
    // Sanitize username
    const sanitizedUserId = sanitize.username(userId);
    
    if (activeThread === sanitizedUserId) return;
    setActiveThread(sanitizedUserId);
    setShowUserDirectory(false);
  }, [activeThread]);

  const handleStartConversation = useCallback((targetUsername: string) => {
    // Sanitize username
    const sanitizedUsername = sanitize.username(targetUsername);
    
    setActiveThread(sanitizedUsername);
    setShowUserDirectory(false);
  }, []);

  // Create enhanced search setters that sanitize input
  const setSearchQuerySafe = useCallback((value: string | ((prev: string) => string)) => {
    if (typeof value === 'function') {
      setSearchQuery(prev => {
        const newValue = value(prev);
        return sanitize.searchQuery(newValue);
      });
    } else {
      setSearchQuery(sanitize.searchQuery(value));
    }
  }, []);

  const setDirectorySearchQuerySafe = useCallback((value: string | ((prev: string) => string)) => {
    if (typeof value === 'function') {
      setDirectorySearchQuery(prev => {
        const newValue = value(prev);
        return sanitize.searchQuery(newValue);
      });
    } else {
      setDirectorySearchQuery(sanitize.searchQuery(value));
    }
  }, []);

  useEffect(() => {
    if (selectedUser && !activeThread) {
      const sanitizedUser = sanitize.username(selectedUser);
      setActiveThread(sanitizedUser);
    }
  }, [selectedUser, activeThread]);

  const isUserBlocked = !!(activeThread && isBlocked(username, activeThread));
  const isUserReported = !!(activeThread && hasReported(username, activeThread));

  return {
    // Auth & Users
    user,
    isAdmin,
    username,
    allUsers,
    
    // Messages & Threads
    threads,
    unreadCounts,
    lastMessages,
    userProfiles,
    activeMessages,
    totalUnreadCount,
    
    // State
    selectedUser,
    setSelectedUser,
    content,
    setContent, // Keep the original setter for compatibility
    activeThread,
    setActiveThread,
    searchQuery,
    setSearchQuery: setSearchQuerySafe, // Use the safe setter
    selectedImage,
    setSelectedImage,
    filterBy,
    setFilterBy,
    showUserDirectory,
    setShowUserDirectory,
    directorySearchQuery,
    setDirectorySearchQuery: setDirectorySearchQuerySafe, // Use the safe setter
    
    // Computed
    isUserBlocked,
    isUserReported,
    
    // Handlers
    handleSend,
    handleBlockToggle,
    handleReport,
    handleThreadSelect,
    handleStartConversation,
    
    // Other
    viewsData,
    messageUpdate,
    rateLimitError
  };
};
