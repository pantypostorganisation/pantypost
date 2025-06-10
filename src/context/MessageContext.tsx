// src/context/MessageContext.tsx
'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

// Content Security Policy compliant image validation
const IMAGE_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'] as const;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB limit
const MIN_IMAGE_SIZE = 1024; // 1KB minimum to prevent empty/malicious files

// Trusted domains for external images
const TRUSTED_IMAGE_DOMAINS = [
  'localhost',
  '127.0.0.1',
  // Add your CDN domains here when you have them
  // 'cdn.pantypost.com',
  // 'images.pantypost.com'
];

// For development, we'll be more permissive
const isDevelopment = typeof window !== 'undefined' && 
                     (window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1' ||
                      window.location.hostname.includes('localhost'));

// Sanitization utilities
const sanitizeString = (str: string): string => {
  if (typeof str !== 'string') return '';
  return str
    .replace(/[<>]/g, '') // Remove < and > to prevent HTML
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/data:/gi, '') // Remove data: URLs (except for images, see below)
    .replace(/\u0000/g, '') // Remove null bytes
    .replace(/&/g, '&amp;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
};

const sanitizeNumber = (num: number): number => {
  const parsed = parseFloat(String(num));
  return isNaN(parsed) ? 0 : parsed;
};

const sanitizeArray = (arr: string[]): string[] => {
  if (!Array.isArray(arr)) return [];
  return arr.map(item => sanitizeString(item)).filter(Boolean);
};

// Enhanced image validation with multiple security layers
const sanitizeImageUrl = (url: string): string => {
  if (typeof url !== 'string') return '';
  
  // Reject suspiciously long URLs that might contain encoded payloads
  if (url.length > 65536) { // 64KB limit for URLs
    console.warn('Image URL exceeds maximum length');
    return '';
  }
  
  // Handle data URLs with comprehensive validation
  if (url.startsWith('data:')) {
    try {
      // Parse data URL structure
      const dataUrlMatch = url.match(/^data:([^;]+)(;base64)?,(.*)$/);
      if (!dataUrlMatch) {
        console.warn('Invalid data URL format');
        return '';
      }
      
      const [, mimeType, , data] = dataUrlMatch;
      
      // Validate MIME type
      if (!IMAGE_MIME_TYPES.includes(mimeType as any)) {
        console.warn(`Unsupported image MIME type: ${mimeType}`);
        return '';
      }
      
      // Validate base64 data
      if (!data || data.length === 0) {
        console.warn('Empty image data');
        return '';
      }
      
      // Check data size (rough estimate: base64 is ~33% larger than binary)
      const estimatedSize = (data.length * 0.75);
      if (estimatedSize > MAX_IMAGE_SIZE) {
        console.warn(`Image too large: ~${(estimatedSize / 1024 / 1024).toFixed(2)}MB`);
        return '';
      }
      
      if (estimatedSize < MIN_IMAGE_SIZE) {
        console.warn('Image suspiciously small');
        return '';
      }
      
      // Basic base64 validation
      if (!/^[A-Za-z0-9+/]+=*$/.test(data.replace(/\s/g, ''))) {
        console.warn('Invalid base64 data');
        return '';
      }
      
      return url;
    } catch (error) {
      console.error('Error validating data URL:', error);
      return '';
    }
  }
  
  // Handle regular URLs
  try {
    const parsedUrl = new URL(url);
    
    // Only allow HTTPS in production
    if (!isDevelopment && parsedUrl.protocol !== 'https:') {
      console.warn('Only HTTPS URLs allowed in production');
      return '';
    }
    
    // Check against trusted domains in production
    if (!isDevelopment && !TRUSTED_IMAGE_DOMAINS.includes(parsedUrl.hostname)) {
      console.warn(`Untrusted image domain: ${parsedUrl.hostname}`);
      return '';
    }
    
    // Basic path validation
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const hasValidExtension = validExtensions.some(ext => 
      parsedUrl.pathname.toLowerCase().endsWith(ext)
    );
    
    if (!hasValidExtension && !isDevelopment) {
      console.warn('Image URL must have a valid image extension');
      return '';
    }
    
    return url;
  } catch (error) {
    // If URL parsing fails, it's not a valid URL
    console.warn('Invalid URL format:', error);
    return '';
  }
  
  // Reject any other URL schemes
  console.warn('Unsupported URL scheme');
  return '';
};

export type Message = {
  sender: string;
  receiver: string;
  content: string;
  date: string;
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

  useEffect(() => {
    const stored = localStorage.getItem('panty_messages');
    if (stored) {
      try {
        const parsedMessages = JSON.parse(stored);
        
        // Migrate old format if needed
        const needsMigration = Object.values(parsedMessages).some(
          value => !Array.isArray(value) || (value.length > 0 && !value[0].sender)
        );
        
        if (needsMigration) {
          console.log('Migrating message format...');
          const migrated: { [key: string]: Message[] } = {};
          
          // Old format: messages stored under receiver's username
          Object.entries(parsedMessages).forEach(([key, msgs]) => {
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
          localStorage.setItem('panty_messages', JSON.stringify(migrated));
        } else {
          setMessages(parsedMessages);
        }
      } catch (error) {
        console.error('Error parsing messages:', error);
        setMessages({});
      }
    }

    const blocked = localStorage.getItem('panty_blocked');
    if (blocked) setBlockedUsers(JSON.parse(blocked));

    const reported = localStorage.getItem('panty_reported');
    if (reported) setReportedUsers(JSON.parse(reported));

    // NEW: Load report logs
    const storedReports = localStorage.getItem('panty_report_logs');
    if (storedReports) {
      try {
        setReportLogs(JSON.parse(storedReports));
      } catch (error) {
        console.error('Error parsing report logs:', error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('panty_messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('panty_blocked', JSON.stringify(blockedUsers));
  }, [blockedUsers]);

  useEffect(() => {
    localStorage.setItem('panty_reported', JSON.stringify(reportedUsers));
  }, [reportedUsers]);

  // NEW: Save report logs to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('panty_report_logs', JSON.stringify(reportLogs));
    }
  }, [reportLogs]);

  const sendMessage = (
    sender: string,
    receiver: string,
    content: string,
    options?: MessageOptions
  ) => {
    if (isBlocked(receiver, sender)) return;

    // Sanitize inputs
    const sanitizedSender = sanitizeString(sender);
    const sanitizedReceiver = sanitizeString(receiver);
    const sanitizedContent = sanitizeString(content);

    let sanitizedMeta = undefined;
    if (options?.meta) {
      sanitizedMeta = {
        id: options.meta.id ? sanitizeString(options.meta.id) : undefined,
        title: options.meta.title ? sanitizeString(options.meta.title) : undefined,
        price: options.meta.price ? sanitizeNumber(options.meta.price) : undefined,
        tags: options.meta.tags ? sanitizeArray(options.meta.tags) : undefined,
        message: options.meta.message ? sanitizeString(options.meta.message) : undefined,
        imageUrl: options.meta.imageUrl ? sanitizeImageUrl(options.meta.imageUrl) : undefined,
      };
      
      // If image validation failed, log warning but still send in development
      if (options.meta.imageUrl && !sanitizedMeta.imageUrl) {
        if (isDevelopment) {
          console.warn('Image validation failed in development mode, sending anyway');
          // In development, use the original URL even if validation failed
          sanitizedMeta.imageUrl = options.meta.imageUrl;
        } else {
          console.error('Image validation failed, message not sent');
          return;
        }
      }
    }

    const newMessage: Message = {
      sender: sanitizedSender,
      receiver: sanitizedReceiver,
      content: sanitizedContent,
      date: new Date().toISOString(),
      read: false,
      type: options?.type || 'normal',
      meta: sanitizedMeta,
    };

    const conversationKey = getConversationKey(sanitizedSender, sanitizedReceiver);

    setMessages((prev) => {
      const updatedMessages = [...(prev[conversationKey] || []), newMessage];
      return {
        ...prev,
        [conversationKey]: updatedMessages,
      };
    });
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
    if (isBlocked(seller, buyer)) return;

    // Sanitize inputs
    const sanitizedBuyer = sanitizeString(buyer);
    const sanitizedSeller = sanitizeString(seller);
    const sanitizedContent = sanitizeString(content);
    const sanitizedTitle = sanitizeString(title);
    const sanitizedPrice = sanitizeNumber(price);
    const sanitizedTags = sanitizeArray(tags);
    const sanitizedListingId = sanitizeString(listingId);

    const newMessage: Message = {
      sender: sanitizedBuyer,
      receiver: sanitizedSeller,
      content: sanitizedContent,
      date: new Date().toISOString(),
      read: false,
      type: 'customRequest',
      meta: {
        id: sanitizedListingId,
        title: sanitizedTitle,
        price: sanitizedPrice,
        tags: sanitizedTags,
        message: sanitizedContent,
      },
    };

    const conversationKey = getConversationKey(sanitizedBuyer, sanitizedSeller);

    setMessages((prev) => {
      const updatedMessages = [...(prev[conversationKey] || []), newMessage];
      return {
        ...prev,
        [conversationKey]: updatedMessages,
      };
    });
  };

  const getMessagesForUsers = (userA: string, userB: string): Message[] => {
    const conversationKey = getConversationKey(userA, userB);
    return messages[conversationKey] || [];
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
    const conversationMessages = getMessagesForUsers(sanitizedReporter, sanitizedReportee);
    const reportLog: ReportLog = {
      id: `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      reporter: sanitizedReporter,
      reportee: sanitizedReportee,
      messages: conversationMessages,
      date: new Date().toISOString(),
      processed: false,
      severity: 'medium', // Default severity
      category: 'other', // Default category
    };

    setReportLogs((prev) => [...prev, reportLog]);
  };

  const isBlocked = (blocker: string, blockee: string): boolean => {
    const sanitizedBlocker = sanitizeString(blocker);
    const sanitizedBlockee = sanitizeString(blockee);
    const blockerList = blockedUsers[sanitizedBlocker] || [];
    return blockerList.includes(sanitizedBlockee);
  };

  const hasReported = (reporter: string, reportee: string): boolean => {
    const sanitizedReporter = sanitizeString(reporter);
    const sanitizedReportee = sanitizeString(reportee);
    const reporterList = reportedUsers[sanitizedReporter] || [];
    return reporterList.includes(sanitizedReportee);
  };

  // NEW: Get count of unprocessed reports
  const getReportCount = (): number => {
    try {
      const pendingReports = reportLogs.filter(report => 
        report && 
        typeof report === 'object' && 
        !report.processed
      );
      return pendingReports.length;
    } catch (error) {
      console.error('Error getting report count:', error);
      return 0;
    }
  };

  return (
    <MessageContext.Provider
      value={{
        messages,
        sendMessage,
        sendCustomRequest,
        getMessagesForUsers,
        markMessagesAsRead,
        blockUser,
        unblockUser,
        reportUser,
        isBlocked,
        hasReported,
        getReportCount, // NEW: Added to context
        blockedUsers, // NEW: Expose blocked users
        reportedUsers, // NEW: Expose reported users
        reportLogs // NEW: Expose report logs
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
  try {
    if (typeof window === 'undefined') return 0;
    
    const storedReports = localStorage.getItem('panty_report_logs');
    if (!storedReports) return 0;
    
    const reports: ReportLog[] = JSON.parse(storedReports);
    if (!Array.isArray(reports)) return 0;
    
    // Count only unprocessed reports
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
