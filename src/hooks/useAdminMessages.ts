import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useListings } from '@/context/ListingContext';
import { useMessages } from '@/context/MessageContext';
import { Message } from '@/types/message';

export const useAdminMessages = () => {
  const { user } = useAuth();
  const { users } = useListings();
  const { messages, sendMessage, markMessagesAsRead, blockUser, unblockUser, reportUser, isBlocked, hasReported } = useMessages();
  
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
  
  const readThreadsRef = useRef<Set<string>>(new Set());
  
  const isAdmin = !!user && (user.username === 'oakley' || user.username === 'gerome');
  const username = user?.username || '';

  // Load views data with error handling
  const loadViews = useCallback(() => {
    try {
      if (typeof window !== 'undefined') {
        const data = localStorage.getItem('listing_views');
        const parsedData = data ? JSON.parse(data) : {};
        setViewsData(parsedData);
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
    try {
      if (user) {
        const readThreadsKey = `panty_read_threads_${user.username}`;
        const readThreads = localStorage.getItem(readThreadsKey);
        if (readThreads) {
          const threads = JSON.parse(readThreads);
          if (Array.isArray(threads)) {
            readThreadsRef.current = new Set(threads);
            setMessageUpdate(prev => prev + 1);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load read threads:', error);
    }
  }, [user]);

  // Prepare threads and messages
  const { threads, unreadCounts, lastMessages, userProfiles, activeMessages, totalUnreadCount } = useMemo(() => {
    const threads: { [user: string]: Message[] } = {};
    const unreadCounts: { [user: string]: number } = {};
    const lastMessages: { [user: string]: Message } = {};
    const userProfiles: { [user: string]: { pic: string | null, verified: boolean, role: string } } = {};
    let totalUnreadCount = 0;
    
    let activeMessages: Message[] = [];

    if (user) {
      // Get all messages for the user
      Object.values(messages).forEach((msgs) => {
        msgs.forEach((msg) => {
          if (msg.sender === user.username || msg.receiver === user.username) {
            const otherParty = msg.sender === user.username ? msg.receiver : msg.sender;
            if (!threads[otherParty]) threads[otherParty] = [];
            threads[otherParty].push(msg);
          }
        });
      });

      // Sort messages in each thread by date
      Object.values(threads).forEach((thread) =>
        thread.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      );
      
      // Get last message and unread count for each thread
      Object.entries(threads).forEach(([userKey, msgs]) => {
        lastMessages[userKey] = msgs[msgs.length - 1];
        
        // Get user profile picture and verification status
        try {
          const storedPic = sessionStorage.getItem(`profile_pic_${userKey}`);
          const userInfo = users?.[userKey];
          const isVerified = userInfo?.verified || userInfo?.verificationStatus === 'verified';
          const role = userInfo?.role || 'unknown';
          
          userProfiles[userKey] = { 
            pic: storedPic, 
            verified: isVerified,
            role: role
          };
        } catch (error) {
          console.error(`Error processing user profile for ${userKey}:`, error);
          userProfiles[userKey] = { pic: null, verified: false, role: 'unknown' };
        }
        
        // Count only messages FROM other user TO admin as unread
        const threadUnreadCount = msgs.filter(
          (msg) => !msg.read && msg.sender === userKey && msg.receiver === user?.username
        ).length;
        
        unreadCounts[userKey] = threadUnreadCount;
        
        // Only add to total if not in readThreadsRef
        if (!readThreadsRef.current.has(userKey) && threadUnreadCount > 0) {
          totalUnreadCount += 1;
        }
      });
    }

    if (activeThread) {
      activeMessages = threads[activeThread] || [];
    }

    return { threads, unreadCounts, lastMessages, userProfiles, activeMessages, totalUnreadCount };
  }, [messages, username, activeThread, users, messageUpdate]);

  // Get all users for directory
  const allUsers = useMemo(() => {
    const allUsersList = Object.entries(users || {})
      .filter(([username, userInfo]) => 
        username !== user?.username && // Exclude current admin user
        username !== 'oakley' && username !== 'gerome' // Exclude other admins
      )
      .map(([username, userInfo]) => {
        const storedPic = sessionStorage.getItem(`profile_pic_${username}`);
        const isVerified = userInfo?.verified || userInfo?.verificationStatus === 'verified';
        
        return {
          username,
          role: userInfo?.role || 'unknown',
          verified: isVerified,
          pic: storedPic
        };
      });
    
    return allUsersList;
  }, [users, user]);

  // Mark messages as read when thread is selected
  useEffect(() => {
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
            localStorage.setItem(readThreadsKey, JSON.stringify(Array.from(readThreadsRef.current)));
            
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
  }, [activeThread, user, threads, markMessagesAsRead]);

  // Save read threads to localStorage
  useEffect(() => {
    if (user && readThreadsRef.current.size > 0 && typeof window !== 'undefined') {
      const readThreadsKey = `panty_read_threads_${user.username}`;
      const threadsArray = Array.from(readThreadsRef.current);
      localStorage.setItem(readThreadsKey, JSON.stringify(threadsArray));
      
      const event = new CustomEvent('readThreadsUpdated', { 
        detail: { threads: threadsArray, username: user.username }
      });
      window.dispatchEvent(event);
    }
  }, [messageUpdate, user]);

  const handleSend = useCallback(() => {
    if (!activeThread || (!content.trim() && !selectedImage)) {
      alert('Please enter a message.');
      return;
    }

    sendMessage(username, activeThread, content.trim(), {
      type: selectedImage ? 'image' : 'normal',
      meta: selectedImage ? { imageUrl: selectedImage } : undefined,
    });
    
    setContent('');
    setSelectedImage(null);
  }, [activeThread, content, selectedImage, username, sendMessage]);

  const handleBlockToggle = useCallback(() => {
    if (!activeThread) return;
    if (isBlocked(username, activeThread)) {
      unblockUser(username, activeThread);
    } else {
      blockUser(username, activeThread);
    }
  }, [activeThread, username, isBlocked, unblockUser, blockUser]);

  const handleReport = useCallback(() => {
    if (activeThread && !hasReported(username, activeThread)) {
      reportUser(username, activeThread);
    }
  }, [activeThread, username, hasReported, reportUser]);

  const handleThreadSelect = useCallback((userId: string) => {
    if (activeThread === userId) return;
    setActiveThread(userId);
    setShowUserDirectory(false);
  }, [activeThread]);

  const handleStartConversation = useCallback((targetUsername: string) => {
    setActiveThread(targetUsername);
    setShowUserDirectory(false);
  }, []);

  useEffect(() => {
    if (selectedUser && !activeThread) {
      setActiveThread(selectedUser);
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
    setContent,
    activeThread,
    setActiveThread,
    searchQuery,
    setSearchQuery,
    selectedImage,
    setSelectedImage,
    filterBy,
    setFilterBy,
    showUserDirectory,
    setShowUserDirectory,
    directorySearchQuery,
    setDirectorySearchQuery,
    
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
    messageUpdate
  };
};