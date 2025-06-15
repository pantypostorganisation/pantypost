// src/context/MessageContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { sanitizeString } from '@/utils/sanitizeInput';
import { safeStorage } from '@/utils/safeStorage';
import { v4 as uuidv4 } from 'uuid';

// UPDATED: Enhanced Message type with id and isRead
type Message = {
  id?: string;
  sender: string;
  receiver: string;
  content: string;
  date: string;
  isRead?: boolean;
  read?: boolean;
  type?: 'normal' | 'customRequest' | 'image';
  meta?: {
    id?: string;
    title?: string;
    price?: number;
    tags?: string[];
    message?: string;
    imageUrl?: string;
  };
};

// ADDED: Enhanced ReportLog type with processing status
type ReportLog = {
  id?: string;
  reporter: string;
  reportee: string;
  messages: Message[];
  date: string;
  processed?: boolean; // NEW: Track if report has been processed
  banApplied?: boolean;
  banId?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  category?: 'harassment' | 'spam' | 'inappropriate_content' | 'scam' | 'other';
  adminNotes?: string;
  processedBy?: string;
  processedAt?: string;
};

type MessageOptions = {
  type?: 'normal' | 'customRequest' | 'image';
  meta?: {
    id?: string;
    title?: string;
    price?: number;
    tags?: string[];
    message?: string;
    imageUrl?: string;
  };
};

// NEW: Thread type for organized message threads
type MessageThread = {
  [otherParty: string]: Message[];
};

// NEW: Thread info type for additional thread metadata
type ThreadInfo = {
  unreadCount: number;
  lastMessage: Message | null;
  otherParty: string;
};

// NEW: Message notification type
type MessageNotification = {
  buyer: string;
  messageCount: number;
  lastMessage: string;
  timestamp: string;
};

// UPDATED: Enhanced MessageContextType with additional methods
type MessageContextType = {
  messages: { [conversationKey: string]: Message[] };
  sendMessage: (
    sender: string,
    receiver: string,
    content: string,
    options?: MessageOptions
  ) => void;
  sendCustomRequest: (
    buyer: string,
    seller: string,
    content: string,
    title: string,
    price: number,
    tags: string[],
    listingId: string
  ) => void;
  getMessagesForUsers: (userA: string, userB: string) => Message[];
  getThreadsForUser: (username: string, role?: 'buyer' | 'seller') => MessageThread; // NEW
  getThreadInfo: (username: string, otherParty: string) => ThreadInfo; // NEW
  getAllThreadsInfo: (username: string, role?: 'buyer' | 'seller') => { [otherParty: string]: ThreadInfo }; // NEW
  markMessagesAsRead: (userA: string, userB: string) => void;
  blockUser: (blocker: string, blockee: string) => void;
  unblockUser: (blocker: string, blockee: string) => void;
  reportUser: (reporter: string, reportee: string) => void;
  isBlocked: (blocker: string, blockee: string) => boolean;
  hasReported: (reporter: string, reportee: string) => boolean;
  getReportCount: () => number; // NEW: Added to context
  blockedUsers: { [user: string]: string[] }; // NEW: Expose blocked users
  reportedUsers: { [user: string]: string[] }; // NEW: Expose reported users
  reportLogs: ReportLog[]; // NEW: Expose report logs
  messageNotifications: { [seller: string]: MessageNotification[] }; // NEW
  clearMessageNotifications: (seller: string, buyer: string) => void; // NEW
};

const MessageContext = createContext<MessageContextType | undefined>(undefined);

// Helper to create a consistent conversation key
const getConversationKey = (userA: string, userB: string): string => {
  // Sort usernames to ensure consistent key regardless of who is sender/receiver
  return [userA, userB].sort().join('-');
};

export const MessageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<{ [conversationKey: string]: Message[] }>({});
  const [blockedUsers, setBlockedUsers] = useState<{ [user: string]: string[] }>({});
  const [reportedUsers, setReportedUsers] = useState<{ [user: string]: string[] }>({});
  // NEW: State for report logs
  const [reportLogs, setReportLogs] = useState<ReportLog[]>([]);
  // NEW: State for message notifications
  const [messageNotifications, setMessageNotifications] = useState<{ [seller: string]: MessageNotification[] }>({});

  useEffect(() => {
    // Load messages with migration support
    const storedMessages = safeStorage.getItem('messages', null);
    if (storedMessages) {
      // Check if migration is needed
      const needsMigration = Object.values(storedMessages).some(
        value => !Array.isArray(value) || (value.length > 0 && !value[0].sender)
      );
      
      if (needsMigration) {
        console.log('Migrating message format...');
        const migrated: { [key: string]: Message[] } = {};
        
        // Old format: messages stored under receiver's username
        Object.entries(storedMessages).forEach(([key, msgs]) => {
          if (Array.isArray(msgs)) {
            msgs.forEach((msg: any) => {
              if (msg.sender && msg.receiver) {
                const conversationKey = getConversationKey(msg.sender, msg.receiver);
                if (!migrated[conversationKey]) {
                  migrated[conversationKey] = [];
                }
                migrated[conversationKey].push(msg);
              }
            });
          }
        });
        
        setMessages(migrated);
        safeStorage.setItem('messages', migrated);
      } else {
        setMessages(storedMessages);
      }
    }

    // Load other data with fallbacks
    const blocked = safeStorage.getItem('blocked', {}) || {};
    setBlockedUsers(blocked);

    const reported = safeStorage.getItem('reported', {}) || {};
    setReportedUsers(reported);

    const storedReportLogs = safeStorage.getItem('report_logs', []) || [];
    setReportLogs(storedReportLogs);
    
    const storedNotifications = safeStorage.getItem('message_notifications', {}) || {};
    setMessageNotifications(storedNotifications);
  }, []);

  useEffect(() => {
    safeStorage.setItem('messages', messages);
  }, [messages]);

  useEffect(() => {
    safeStorage.setItem('blocked', blockedUsers);
  }, [blockedUsers]);

  useEffect(() => {
    safeStorage.setItem('reported', reportedUsers);
  }, [reportedUsers]);

  // NEW: Save report logs to localStorage
  useEffect(() => {
    safeStorage.setItem('report_logs', reportLogs);
  }, [reportLogs]);

  // NEW: Save message notifications to localStorage
  useEffect(() => {
    safeStorage.setItem('message_notifications', messageNotifications);
  }, [messageNotifications]);

  const sendMessage = (
    sender: string,
    receiver: string,
    content: string,
    options?: MessageOptions
  ) => {
    const sanitizedSender = sanitizeString(sender);
    const sanitizedReceiver = sanitizeString(receiver);
    const sanitizedContent = sanitizeString(content);
    const conversationKey = getConversationKey(sanitizedSender, sanitizedReceiver);

    const newMessage: Message = {
      id: uuidv4(), // UPDATED: Always generate an ID
      sender: sanitizedSender,
      receiver: sanitizedReceiver,
      content: sanitizedContent,
      date: new Date().toISOString(),
      isRead: false, // UPDATED: Add isRead flag
      read: false,
      type: options?.type || 'normal',
      meta: options?.meta,
    };

    setMessages((prev) => ({
      ...prev,
      [conversationKey]: [...(prev[conversationKey] || []), newMessage],
    }));

    // NEW: Create notification if sender is buyer and receiver is seller
    // Note: You'll need to import or pass the users data to check roles
    // For now, we'll create notifications for all messages to sellers
    if (options?.type !== 'customRequest') { // Don't create notifications for custom requests
      setMessageNotifications(prev => {
        const sellerNotifs = prev[receiver] || [];
        const existingIndex = sellerNotifs.findIndex(n => n.buyer === sender);
        
        if (existingIndex >= 0) {
          // Update existing notification
          const updated = [...sellerNotifs];
          updated[existingIndex] = {
            buyer: sender,
            messageCount: updated[existingIndex].messageCount + 1,
            lastMessage: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
            timestamp: new Date().toISOString()
          };
          return {
            ...prev,
            [receiver]: updated
          };
        } else {
          // Create new notification
          return {
            ...prev,
            [receiver]: [...sellerNotifs, {
              buyer: sender,
              messageCount: 1,
              lastMessage: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
              timestamp: new Date().toISOString()
            }]
          };
        }
      });
    }
  };

  const sendCustomRequest = (
    buyer: string,
    seller: string,
    content: string,
    title: string,
    price: number,
    tags: string[],
    listingId: string
  ) => {
    sendMessage(buyer, seller, content, {
      type: 'customRequest',
      meta: {
        id: uuidv4(),
        title,
        price,
        tags,
        message: content,
      },
    });
  };

  const getMessagesForUsers = (userA: string, userB: string): Message[] => {
    const conversationKey = getConversationKey(userA, userB);
    return messages[conversationKey] || [];
  };

  // NEW: Get all threads for a user
  const getThreadsForUser = (username: string, role?: 'buyer' | 'seller'): MessageThread => {
    const threads: MessageThread = {};
    
    Object.entries(messages).forEach(([key, msgs]) => {
      msgs.forEach(msg => {
        // Check if user is involved in this message
        if (msg.sender === username || msg.receiver === username) {
          const otherParty = msg.sender === username ? msg.receiver : msg.sender;
          
          // Initialize thread if it doesn't exist
          if (!threads[otherParty]) {
            threads[otherParty] = [];
          }
          
          // Add message to thread
          threads[otherParty].push(msg);
        }
      });
    });
    
    // Sort messages in each thread by date
    Object.values(threads).forEach(thread => {
      thread.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    });
    
    return threads;
  };

  // NEW: Get thread info for a specific conversation
  const getThreadInfo = (username: string, otherParty: string): ThreadInfo => {
    const conversationKey = getConversationKey(username, otherParty);
    const threadMessages = messages[conversationKey] || [];
    
    // Count unread messages (messages TO the user that are not read)
    const unreadCount = threadMessages.filter(
      msg => msg.receiver === username && !msg.read && !msg.isRead
    ).length;
    
    // Get last message
    const lastMessage = threadMessages.length > 0 ? 
      threadMessages[threadMessages.length - 1] : null;
    
    return {
      unreadCount,
      lastMessage,
      otherParty
    };
  };

  // NEW: Get all thread info for a user
  const getAllThreadsInfo = (username: string, role?: 'buyer' | 'seller'): { [otherParty: string]: ThreadInfo } => {
    const threads = getThreadsForUser(username, role);
    const threadInfos: { [otherParty: string]: ThreadInfo } = {};
    
    Object.keys(threads).forEach(otherParty => {
      threadInfos[otherParty] = getThreadInfo(username, otherParty);
    });
    
    return threadInfos;
  };

  const markMessagesAsRead = (userA: string, userB: string) => {
    const conversationKey = getConversationKey(userA, userB);

    setMessages((prev) => {
      const conversationMessages = prev[conversationKey] || [];
      const updatedMessages = conversationMessages.map((msg) =>
        msg.receiver === userA && msg.sender === userB && !msg.read
          ? { ...msg, read: true }
          : msg
      );

      return {
        ...prev,
        [conversationKey]: updatedMessages,
      };
    });
  };

  // NEW: Clear message notifications
  const clearMessageNotifications = (seller: string, buyer: string) => {
    setMessageNotifications(prev => {
      const sellerNotifs = prev[seller] || [];
      const filtered = sellerNotifs.filter(n => n.buyer !== buyer);
      
      if (filtered.length === sellerNotifs.length) {
        return prev; // No change
      }
      
      return {
        ...prev,
        [seller]: filtered
      };
    });
  };

  const blockUser = (blocker: string, blockee: string) => {
    const sanitizedBlocker = sanitizeString(blocker);
    const sanitizedBlockee = sanitizeString(blockee);

    setBlockedUsers((prev) => {
      const blockerList = prev[sanitizedBlocker] || [];
      if (!blockerList.includes(sanitizedBlockee)) {
        return {
          ...prev,
          [sanitizedBlocker]: [...blockerList, sanitizedBlockee],
        };
      }
      return prev;
    });
  };

  const unblockUser = (blocker: string, blockee: string) => {
    const sanitizedBlocker = sanitizeString(blocker);
    const sanitizedBlockee = sanitizeString(blockee);

    setBlockedUsers((prev) => {
      const blockerList = prev[sanitizedBlocker] || [];
      return {
        ...prev,
        [sanitizedBlocker]: blockerList.filter((b) => b !== sanitizedBlockee),
      };
    });
  };

  const reportUser = (reporter: string, reportee: string) => {
    const sanitizedReporter = sanitizeString(reporter);
    const sanitizedReportee = sanitizeString(reportee);

    // Add to reported users list
    setReportedUsers((prev) => {
      const reporterList = prev[sanitizedReporter] || [];
      if (!reporterList.includes(sanitizedReportee)) {
        return {
          ...prev,
          [sanitizedReporter]: [...reporterList, sanitizedReportee],
        };
      }
      return prev;
    });

    // NEW: Create a report log entry
    const conversationKey = getConversationKey(reporter, reportee);
    const reportMessages = messages[conversationKey] || [];
    
    const newReport: ReportLog = {
      id: uuidv4(),
      reporter: sanitizedReporter,
      reportee: sanitizedReportee,
      messages: reportMessages,
      date: new Date().toISOString(),
      processed: false,
      category: 'other'
    };
    
    setReportLogs(prev => [...prev, newReport]);
  };

  const isBlocked = (blocker: string, blockee: string): boolean => {
    const sanitizedBlocker = sanitizeString(blocker);
    const sanitizedBlockee = sanitizeString(blockee);
    return blockedUsers[sanitizedBlocker]?.includes(sanitizedBlockee) ?? false;
  };

  const hasReported = (reporter: string, reportee: string): boolean => {
    const sanitizedReporter = sanitizeString(reporter);
    const sanitizedReportee = sanitizeString(reportee);
    return reportedUsers[sanitizedReporter]?.includes(sanitizedReportee) ?? false;
  };

  // NEW: Get count of unprocessed reports
  const getReportCount = (): number => {
    return reportLogs.filter(report => !report.processed).length;
  };

  return (
    <MessageContext.Provider
      value={{
        messages,
        sendMessage,
        sendCustomRequest,
        getMessagesForUsers,
        getThreadsForUser, // NEW
        getThreadInfo, // NEW
        getAllThreadsInfo, // NEW
        markMessagesAsRead,
        blockUser,
        unblockUser,
        reportUser,
        isBlocked,
        hasReported,
        getReportCount, // NEW: Added to context
        blockedUsers, // NEW: Expose blocked users
        reportedUsers, // NEW: Expose reported users
        reportLogs, // NEW: Expose report logs
        messageNotifications, // NEW
        clearMessageNotifications // NEW
      }}
    >
      {children}
    </MessageContext.Provider>
  );
};

export const useMessages = () => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error('useMessages must be used within a MessageProvider');
  }
  return context;
};

// UPDATED: Enhanced external getReportCount function for header use
export const getReportCount = (): number => {
  const reports = safeStorage.getItem<ReportLog[]>('report_logs', []) || [];
  if (!Array.isArray(reports)) return 0;
  
  // Count only unprocessed reports
  const pendingReports = reports.filter(report => 
    report && 
    typeof report === 'object' && 
    !report.processed
  );
  
  return pendingReports.length;
};