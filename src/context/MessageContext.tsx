// src/context/MessageContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { sanitizeString } from '@/utils/sanitizeInput';
import { v4 as uuidv4 } from 'uuid';
import { messagesService, storageService } from '@/services';

// Enhanced Message type with id and isRead
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

// Enhanced ReportLog type with processing status
type ReportLog = {
  id?: string;
  reporter: string;
  reportee: string;
  messages: Message[];
  date: string;
  processed?: boolean;
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

// Thread type for organized message threads
type MessageThread = {
  [otherParty: string]: Message[];
};

// Thread info type for additional thread metadata
type ThreadInfo = {
  unreadCount: number;
  lastMessage: Message | null;
  otherParty: string;
};

// Message notification type
type MessageNotification = {
  buyer: string;
  messageCount: number;
  lastMessage: string;
  timestamp: string;
};

// Enhanced MessageContextType with additional methods
type MessageContextType = {
  messages: { [conversationKey: string]: Message[] };
  sendMessage: (
    sender: string,
    receiver: string,
    content: string,
    options?: MessageOptions
  ) => Promise<void>;
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
  getThreadsForUser: (username: string, role?: 'buyer' | 'seller') => MessageThread;
  getThreadInfo: (username: string, otherParty: string) => ThreadInfo;
  getAllThreadsInfo: (username: string, role?: 'buyer' | 'seller') => { [otherParty: string]: ThreadInfo };
  markMessagesAsRead: (userA: string, userB: string) => Promise<void>;
  blockUser: (blocker: string, blockee: string) => Promise<void>;
  unblockUser: (blocker: string, blockee: string) => Promise<void>;
  reportUser: (reporter: string, reportee: string) => Promise<void>;
  isBlocked: (blocker: string, blockee: string) => boolean;
  hasReported: (reporter: string, reportee: string) => boolean;
  getReportCount: () => number;
  blockedUsers: { [user: string]: string[] };
  reportedUsers: { [user: string]: string[] };
  reportLogs: ReportLog[];
  messageNotifications: { [seller: string]: MessageNotification[] };
  clearMessageNotifications: (seller: string, buyer: string) => void;
};

const MessageContext = createContext<MessageContextType | undefined>(undefined);

// Helper to create a consistent conversation key
const getConversationKey = (userA: string, userB: string): string => {
  return [userA, userB].sort().join('-');
};

export const MessageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<{ [conversationKey: string]: Message[] }>({});
  const [blockedUsers, setBlockedUsers] = useState<{ [user: string]: string[] }>({});
  const [reportedUsers, setReportedUsers] = useState<{ [user: string]: string[] }>({});
  const [reportLogs, setReportLogs] = useState<ReportLog[]>([]);
  const [messageNotifications, setMessageNotifications] = useState<{ [seller: string]: MessageNotification[] }>({});

  // Load initial data using services
  useEffect(() => {
    const loadData = async () => {
      if (typeof window === 'undefined') return;

      try {
        // Load messages - using storageService since messagesService doesn't have a getAllMessages method
        const storedMessages = await storageService.getItem<{ [key: string]: Message[] }>('panty_messages', {});
        
        // Migrate old format if needed
        const needsMigration = Object.values(storedMessages).some(
          value => !Array.isArray(value) || (value.length > 0 && !value[0].sender)
        );
        
        if (needsMigration) {
          console.log('Migrating message format...');
          const migrated: { [key: string]: Message[] } = {};
          
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
          await storageService.setItem('panty_messages', migrated);
        } else {
          setMessages(storedMessages);
        }

        // Load blocked users
        const blocked = await storageService.getItem<{ [user: string]: string[] }>('panty_blocked', {});
        setBlockedUsers(blocked);

        // Load reported users
        const reported = await storageService.getItem<{ [user: string]: string[] }>('panty_reported', {});
        setReportedUsers(reported);

        // Load report logs
        const reports = await storageService.getItem<ReportLog[]>('panty_report_logs', []);
        setReportLogs(reports);

        // Load message notifications
        const notifications = await storageService.getItem<{ [seller: string]: MessageNotification[] }>('panty_message_notifications', {});
        setMessageNotifications(notifications);
      } catch (error) {
        console.error('Error loading message data:', error);
      }
    };

    loadData();
  }, []);

  // Save data whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      storageService.setItem('panty_messages', messages);
    }
  }, [messages]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      storageService.setItem('panty_blocked', blockedUsers);
    }
  }, [blockedUsers]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      storageService.setItem('panty_reported', reportedUsers);
    }
  }, [reportedUsers]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      storageService.setItem('panty_report_logs', reportLogs);
    }
  }, [reportLogs]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      storageService.setItem('panty_message_notifications', messageNotifications);
    }
  }, [messageNotifications]);

  const sendMessage = async (
    sender: string,
    receiver: string,
    content: string,
    options?: MessageOptions
  ) => {
    const sanitizedSender = sanitizeString(sender);
    const sanitizedReceiver = sanitizeString(receiver);
    const sanitizedContent = sanitizeString(content);

    try {
      const result = await messagesService.sendMessage({
        sender: sanitizedSender,
        receiver: sanitizedReceiver,
        content: sanitizedContent,
        type: options?.type,
        meta: options?.meta,
      });

      if (result.success && result.data) {
        const conversationKey = getConversationKey(sanitizedSender, sanitizedReceiver);
        setMessages(prev => ({
          ...prev,
          [conversationKey]: [...(prev[conversationKey] || []), result.data!],
        }));

        // Update notifications if needed
        if (options?.type !== 'customRequest') {
          setMessageNotifications(prev => {
            const sellerNotifs = prev[sanitizedReceiver] || [];
            const existingIndex = sellerNotifs.findIndex(n => n.buyer === sanitizedSender);
            
            if (existingIndex >= 0) {
              const updated = [...sellerNotifs];
              updated[existingIndex] = {
                buyer: sanitizedSender,
                messageCount: updated[existingIndex].messageCount + 1,
                lastMessage: sanitizedContent.substring(0, 50) + (sanitizedContent.length > 50 ? '...' : ''),
                timestamp: new Date().toISOString()
              };
              return {
                ...prev,
                [sanitizedReceiver]: updated
              };
            } else {
              return {
                ...prev,
                [sanitizedReceiver]: [...sellerNotifs, {
                  buyer: sanitizedSender,
                  messageCount: 1,
                  lastMessage: sanitizedContent.substring(0, 50) + (sanitizedContent.length > 50 ? '...' : ''),
                  timestamp: new Date().toISOString()
                }]
              };
            }
          });
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
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

  const getThreadsForUser = (username: string, role?: 'buyer' | 'seller'): MessageThread => {
    const threads: MessageThread = {};
    
    Object.entries(messages).forEach(([key, msgs]) => {
      msgs.forEach(msg => {
        if (msg.sender === username || msg.receiver === username) {
          const otherParty = msg.sender === username ? msg.receiver : msg.sender;
          
          if (!threads[otherParty]) {
            threads[otherParty] = [];
          }
          
          threads[otherParty].push(msg);
        }
      });
    });
    
    Object.values(threads).forEach(thread => {
      thread.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    });
    
    return threads;
  };

  const getThreadInfo = (username: string, otherParty: string): ThreadInfo => {
    const conversationKey = getConversationKey(username, otherParty);
    const threadMessages = messages[conversationKey] || [];
    
    const unreadCount = threadMessages.filter(
      msg => msg.receiver === username && !msg.read && !msg.isRead
    ).length;
    
    const lastMessage = threadMessages.length > 0 ? 
      threadMessages[threadMessages.length - 1] : null;
    
    return {
      unreadCount,
      lastMessage,
      otherParty
    };
  };

  const getAllThreadsInfo = (username: string, role?: 'buyer' | 'seller'): { [otherParty: string]: ThreadInfo } => {
    const threads = getThreadsForUser(username, role);
    const threadInfos: { [otherParty: string]: ThreadInfo } = {};
    
    Object.keys(threads).forEach(otherParty => {
      threadInfos[otherParty] = getThreadInfo(username, otherParty);
    });
    
    return threadInfos;
  };

  const markMessagesAsRead = async (userA: string, userB: string) => {
    try {
      const result = await messagesService.markMessagesAsRead(userA, userB);
      
      if (result.success) {
        const conversationKey = getConversationKey(userA, userB);
        setMessages(prev => {
          const conversationMessages = prev[conversationKey] || [];
          const updatedMessages = conversationMessages.map(msg =>
            msg.receiver === userA && msg.sender === userB && !msg.read
              ? { ...msg, read: true, isRead: true }
              : msg
          );

          return {
            ...prev,
            [conversationKey]: updatedMessages,
          };
        });

        clearMessageNotifications(userA, userB);
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const clearMessageNotifications = (seller: string, buyer: string) => {
    setMessageNotifications(prev => {
      const sellerNotifs = prev[seller] || [];
      const filtered = sellerNotifs.filter(n => n.buyer !== buyer);
      
      if (filtered.length === sellerNotifs.length) {
        return prev;
      }
      
      return {
        ...prev,
        [seller]: filtered
      };
    });
  };

  const blockUser = async (blocker: string, blockee: string) => {
    const sanitizedBlocker = sanitizeString(blocker);
    const sanitizedBlockee = sanitizeString(blockee);

    try {
      const result = await messagesService.blockUser({
        blocker: sanitizedBlocker,
        blocked: sanitizedBlockee,
      });

      if (result.success) {
        setBlockedUsers(prev => {
          const blockerList = prev[sanitizedBlocker] || [];
          if (!blockerList.includes(sanitizedBlockee)) {
            return {
              ...prev,
              [sanitizedBlocker]: [...blockerList, sanitizedBlockee],
            };
          }
          return prev;
        });
      }
    } catch (error) {
      console.error('Error blocking user:', error);
    }
  };

  const unblockUser = async (blocker: string, blockee: string) => {
    const sanitizedBlocker = sanitizeString(blocker);
    const sanitizedBlockee = sanitizeString(blockee);

    try {
      const result = await messagesService.unblockUser({
        blocker: sanitizedBlocker,
        blocked: sanitizedBlockee,
      });

      if (result.success) {
        setBlockedUsers(prev => {
          const blockerList = prev[sanitizedBlocker] || [];
          return {
            ...prev,
            [sanitizedBlocker]: blockerList.filter(b => b !== sanitizedBlockee),
          };
        });
      }
    } catch (error) {
      console.error('Error unblocking user:', error);
    }
  };

  const reportUser = async (reporter: string, reportee: string) => {
    const sanitizedReporter = sanitizeString(reporter);
    const sanitizedReportee = sanitizeString(reportee);

    const conversationKey = getConversationKey(reporter, reportee);
    const reportMessages = messages[conversationKey] || [];

    try {
      const result = await messagesService.reportUser({
        reporter: sanitizedReporter,
        reportee: sanitizedReportee,
        messages: reportMessages,
      });

      if (result.success) {
        setReportedUsers(prev => {
          const reporterList = prev[sanitizedReporter] || [];
          if (!reporterList.includes(sanitizedReportee)) {
            return {
              ...prev,
              [sanitizedReporter]: [...reporterList, sanitizedReportee],
            };
          }
          return prev;
        });

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
      }
    } catch (error) {
      console.error('Error reporting user:', error);
    }
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
        getThreadsForUser,
        getThreadInfo,
        getAllThreadsInfo,
        markMessagesAsRead,
        blockUser,
        unblockUser,
        reportUser,
        isBlocked,
        hasReported,
        getReportCount,
        blockedUsers,
        reportedUsers,
        reportLogs,
        messageNotifications,
        clearMessageNotifications
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

// Enhanced external getReportCount function for header use
export const getReportCount = async (): Promise<number> => {
  try {
    if (typeof window === 'undefined') return 0;
    
    const reports = await storageService.getItem<ReportLog[]>('panty_report_logs', []);
    if (!Array.isArray(reports)) return 0;
    
    const pendingReports = reports.filter(report => 
      report && 
      typeof report === 'object' && 
      !report.processed
    );
    
    return pendingReports.length;
  } catch (error) {
    console.error('Error getting external report count:', error);
    return 0;
  }
};
