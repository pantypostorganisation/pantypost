// src/hooks/useAdminMessages.ts
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useListings } from '@/context/ListingContext';
import { useMessages } from '@/context/MessageContext';
import { storageService } from '@/services';
import { Message } from '@/types/message';
import { sanitize } from '@/services/security.service';
import { getRateLimiter, RATE_LIMITS } from '@/utils/security/rate-limiter';

const MAX_MESSAGE_LENGTH = 2000;

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
    getAllThreadsInfo,
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
  const mountedRef = useRef(true);

  const isAdmin = !!user && user.role === 'admin';
  const username = user?.username || '';

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Load views data with error handling
  const loadViews = useCallback(async () => {
    try {
      if (typeof window !== 'undefined') {
        const data = await storageService.getItem<Record<string, number>>('listing_views', {});
        if (mountedRef.current) setViewsData(data);
      }
    } catch (error) {
      console.error('Failed to load views data:', error);
      if (mountedRef.current) setViewsData({});
    }
  }, []);

  // Load views and handle localStorage events
  useEffect(() => {
    loadViews();

    const handleStorageChange = () => {
      void loadViews();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      window.addEventListener('focus', handleStorageChange);
      return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('focus', handleStorageChange);
      };
    }

    return () => {};
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
            if (mountedRef.current) setMessageUpdate((prev) => prev + 1);
          }
        }
      } catch (error) {
        console.error('Failed to load read threads:', error);
      }
    };

    void loadReadThreads();
  }, [user]);

  // Derive threads + counts + last messages + profiles
  const { threads, unreadCounts, lastMessages, userProfiles, activeMessages, totalUnreadCount } = useMemo(() => {
    if (!user) {
      return {
        threads: {},
        unreadCounts: {},
        lastMessages: {},
        userProfiles: {},
        activeMessages: [],
        totalUnreadCount: 0,
      };
    }

    const threads = getThreadsForUser(user.username);
    const threadInfos = getAllThreadsInfo(user.username);

    const unreadCounts: { [userKey: string]: number } = {};
    const lastMessages: { [userKey: string]: Message } = {};
    const userProfiles: { [userKey: string]: { pic: string | null; verified: boolean; role: string } } = {};
    let totalUnreadCount = 0;

    Object.entries(threadInfos).forEach(([userKey, info]) => {
      unreadCounts[userKey] = info.unreadCount;
      lastMessages[userKey] = info.lastMessage as Message;

      try {
        const userInfo = users?.[userKey];
        const isVerified = Boolean(userInfo?.verified || userInfo?.verificationStatus === 'verified');
        const role = userInfo?.role || 'unknown';

        userProfiles[userKey] = {
          pic: null, // Load via approved channels only
          verified: isVerified,
          role,
        };
      } catch (error) {
        console.error(`Error processing user profile for ${userKey}:`, error);
        userProfiles[userKey] = { pic: null, verified: false, role: 'unknown' };
      }

      if (!readThreadsRef.current.has(userKey) && info.unreadCount > 0) {
        totalUnreadCount += 1;
      }
    });

    let activeMessages: Message[] = [];
    if (activeThread) {
      activeMessages = threads[activeThread] || [];
    }

    return { threads, unreadCounts, lastMessages, userProfiles, activeMessages, totalUnreadCount };
  }, [user, messages, activeThread, users, messageUpdate, getThreadsForUser, getAllThreadsInfo]);

  // Get all users for directory (exclude current admin and any admin accounts)
  const allUsers = useMemo(() => {
    const allUsersList = Object.entries(users || {})
      .filter(
        ([uname, userInfo]) =>
          uname !== user?.username && // exclude current admin
          userInfo?.role !== 'admin', // exclude admins
      )
      .map(([uname, userInfo]) => {
        const isVerified = Boolean(userInfo?.verified || userInfo?.verificationStatus === 'verified');
        return {
          username: uname,
          role: userInfo?.role || 'unknown',
          verified: isVerified,
          pic: null, // handled elsewhere
        };
      });

    return allUsersList;
  }, [users, user]);

  // Mark messages as read when thread is selected
  useEffect(() => {
    const markThreadAsRead = async () => {
      if (!activeThread || !user) return;

      const hasUnreadMessages = (threads[activeThread] || []).some(
        (msg) => !msg.read && msg.sender === activeThread && msg.receiver === user.username,
      );

      if (hasUnreadMessages) {
        markMessagesAsRead(user.username, activeThread);

        if (!readThreadsRef.current.has(activeThread)) {
          readThreadsRef.current.add(activeThread);

          if (typeof window !== 'undefined') {
            const readThreadsKey = `panty_read_threads_${user.username}`;
            await storageService.setItem(readThreadsKey, Array.from(readThreadsRef.current));

            const event = new CustomEvent('readThreadsUpdated', {
              detail: { threads: Array.from(readThreadsRef.current), username: user.username },
            });
            window.dispatchEvent(event);
          }

          if (mountedRef.current) setMessageUpdate((prev) => prev + 1);
        }
      }

      if (typeof window !== 'undefined') {
        const event = new CustomEvent('threadSelected', {
          detail: { thread: activeThread, username: user.username },
        });
        window.dispatchEvent(event);
      }
    };

    void markThreadAsRead();
  }, [activeThread, user, threads, markMessagesAsRead]);

  // Save read threads to localStorage (persist)
  useEffect(() => {
    const saveReadThreads = async () => {
      if (user && readThreadsRef.current.size > 0 && typeof window !== 'undefined') {
        const readThreadsKey = `panty_read_threads_${user.username}`;
        const threadsArray = Array.from(readThreadsRef.current);
        await storageService.setItem(readThreadsKey, threadsArray);

        const event = new CustomEvent('readThreadsUpdated', {
          detail: { threads: threadsArray, username: user.username },
        });
        window.dispatchEvent(event);
      }
    };

    void saveReadThreads();
  }, [messageUpdate, user]);

  const handleSend = useCallback(() => {
    if (!activeThread) {
      alert('Please select a conversation.');
      return;
    }
    if (!username) {
      alert('Please log in to send messages.');
      return;
    }

    // Sanitize & validate content
    const raw = typeof content === 'string' ? content : '';
    const sanitizedContent = sanitize.strict(raw).trim();

    if (!sanitizedContent && !selectedImage) {
      alert('Please enter a message.');
      return;
    }
    if (sanitizedContent.length > MAX_MESSAGE_LENGTH) {
      alert(`Messages must be ${MAX_MESSAGE_LENGTH} characters or fewer.`);
      return;
    }

    // Clear prior rate limit error
    setRateLimitError(null);

    // Rate limit per-sender
    const rl = rateLimiter.check('MESSAGE_SEND', { ...RATE_LIMITS.MESSAGE_SEND, identifier: username });
    if (!rl.allowed) {
      setRateLimitError(`Too many messages sent. Please wait ${rl.waitTime} seconds.`);
      return;
    }

    // Validate/sanitize image URL if provided
    let imageUrl: string | undefined;
    if (selectedImage) {
      const sanitizedImageUrl = sanitize.url(selectedImage);
      if (!sanitizedImageUrl) {
        alert('Invalid image URL');
        return;
      }
      imageUrl = sanitizedImageUrl;
    }

    // Send using sanitized values only
    sendMessage(username, activeThread, sanitizedContent, {
      type: imageUrl ? 'image' : 'normal',
      meta: imageUrl ? { imageUrl } : undefined,
    });

    setContent('');
    setSelectedImage(null);
  }, [activeThread, content, selectedImage, username, sendMessage, rateLimiter]);

  const handleBlockToggle = useCallback(() => {
    if (!activeThread || !username) return;

    const rl = rateLimiter.check('REPORT_ACTION', { ...RATE_LIMITS.REPORT_ACTION, identifier: username });
    if (!rl.allowed) {
      alert(`Please wait ${rl.waitTime} seconds before performing this action.`);
      return;
    }

    if (isBlocked(username, activeThread)) {
      unblockUser(username, activeThread);
    } else {
      blockUser(username, activeThread);
    }
  }, [activeThread, username, isBlocked, unblockUser, blockUser, rateLimiter]);

  const handleReport = useCallback(() => {
    if (!activeThread || !username) return;

    const rl = rateLimiter.check('REPORT_ACTION', { ...RATE_LIMITS.REPORT_ACTION, identifier: username });
    if (!rl.allowed) {
      alert(`Please wait ${rl.waitTime} seconds before reporting.`);
      return;
    }

    if (!hasReported(username, activeThread)) {
      reportUser(username, activeThread);
    }
  }, [activeThread, username, hasReported, reportUser, rateLimiter]);

  const handleThreadSelect = useCallback(
    (userId: string) => {
      const sanitizedUserId = sanitize.username(userId);
      if (activeThread === sanitizedUserId) return;
      setActiveThread(sanitizedUserId);
      setShowUserDirectory(false);
    },
    [activeThread],
  );

  const handleStartConversation = useCallback((targetUsername: string) => {
    const sanitizedUsername = sanitize.username(targetUsername);
    setActiveThread(sanitizedUsername);
    setShowUserDirectory(false);
  }, []);

  // Sanitized search setters with basic length guard
  const setSearchQuerySafe = useCallback((value: string | ((prev: string) => string)) => {
    if (typeof value === 'function') {
      setSearchQuery((prev) => {
        const v = (value as (p: string) => string)(prev);
        return sanitize.searchQuery(v).slice(0, 200);
      });
    } else {
      setSearchQuery(sanitize.searchQuery(value).slice(0, 200));
    }
  }, []);

  const setDirectorySearchQuerySafe = useCallback((value: string | ((prev: string) => string)) => {
    if (typeof value === 'function') {
      setDirectorySearchQuery((prev) => {
        const v = (value as (p: string) => string)(prev);
        return sanitize.searchQuery(v).slice(0, 200);
      });
    } else {
      setDirectorySearchQuery(sanitize.searchQuery(value).slice(0, 200));
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
    setContent, // keep raw setter (we sanitize on send)
    activeThread,
    setActiveThread,
    searchQuery,
    setSearchQuery: setSearchQuerySafe,
    selectedImage,
    setSelectedImage,
    filterBy,
    setFilterBy,
    showUserDirectory,
    setShowUserDirectory,
    directorySearchQuery,
    setDirectorySearchQuery: setDirectorySearchQuerySafe,

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
    rateLimitError,
  };
};
