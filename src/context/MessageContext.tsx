// src/context/MessageContext.tsx
'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

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

// FIXED: Enhanced image URL sanitization to prevent XSS via data URLs
const sanitizeImageUrl = (url: string): string => {
  if (typeof url !== 'string') return '';
  
  // Handle data URLs with strict validation
  if (url.startsWith('data:image/')) {
    // Only allow specific image MIME types
    const validImageTypes = ['jpeg', 'jpg', 'png', 'gif', 'webp'];
    
    // Extract MIME type and validate format
    const matches = url.match(/^data:image\/(jpeg|jpg|png|gif|webp);base64,/);
    if (!matches) {
      console.warn('Invalid data URL format detected');
      return ''; // Reject invalid data URL format
    }
    
    // Validate base64 content
    const base64Part = url.split(',')[1];
    if (!base64Part) {
      console.warn('Missing base64 content in data URL');
      return '';
    }
    
    // Check if base64 is valid (only allowed characters)
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64Part)) {
      console.warn('Invalid base64 characters detected');
      return '';
    }
    
    // Additional check: ensure the base64 length is reasonable for an image
    // Reject suspiciously small base64 that might contain scripts
    if (base64Part.length < 100) {
      console.warn('Suspiciously small base64 content');
      return '';
    }
    
    // Try to decode a small portion to verify it's actual image data
    try {
      const testDecode = atob(base64Part.substring(0, 50));
      // Check for common image file signatures
      const firstBytes = testDecode.substring(0, 10);
      
      // Common image file signatures (magic numbers)
      const imageSignatures = [
        '\xFF\xD8\xFF', // JPEG
        '\x89PNG', // PNG
        'GIF87a', // GIF
        'GIF89a', // GIF
        'RIFF' // WebP (partial)
      ];
      
      const hasValidSignature = imageSignatures.some(sig => 
        firstBytes.includes(sig)
      );
      
      if (!hasValidSignature && !firstBytes.includes('WEBP')) {
        console.warn('Invalid image file signature detected');
        return '';
      }
    } catch (e) {
      console.warn('Failed to decode base64 for validation');
      return '';
    }
    
    return url; // Data URL is valid
  }
  
  // Handle blob URLs (generally safe as they're browser-generated)
  if (url.startsWith('blob:')) {
    // Validate blob URL format
    if (!/^blob:https?:\/\/[^/]+\/[a-f0-9-]+$/i.test(url)) {
      console.warn('Invalid blob URL format');
      return '';
    }
    return url;
  }
  
  // Handle relative URLs
  if (url.startsWith('/')) {
    // Validate relative URL doesn't contain suspicious patterns
    if (url.includes('../') || url.includes('..\\') || url.includes('%2e%2e')) {
      console.warn('Path traversal attempt detected');
      return '';
    }
    return url;
  }
  
  // Handle absolute URLs (https/http)
  if (url.startsWith('https://') || url.startsWith('http://')) {
    try {
      const urlObj = new URL(url);
      
      // Whitelist of allowed image hosting domains
      const allowedDomains = [
        'localhost',
        '127.0.0.1',
        // Add your trusted image CDN domains here
        // 'your-cdn.com',
        // 'trusted-image-host.com'
      ];
      
      // Check if domain is in whitelist
      const hostname = urlObj.hostname.toLowerCase();
      const isAllowed = allowedDomains.some(domain => 
        hostname === domain || hostname.endsWith(`.${domain}`)
      );
      
      if (!isAllowed) {
        console.warn(`External image URL from untrusted domain: ${hostname}`);
        return ''; // Reject untrusted domains
      }
      
      return url;
    } catch (e) {
      console.warn('Invalid URL format');
      return '';
    }
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

type ReportLog = {
  reporter: string;
  reportee: string;
  messages: Message[];
  date: string;
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

type MessageContextType = {
  messages: { [seller: string]: Message[] };
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
  getMessagesForSeller: (seller: string) => Message[];
  markMessagesAsRead: (userA: string, userB: string) => void;
  blockUser: (blocker: string, blockee: string) => void;
  unblockUser: (blocker: string, blockee: string) => void;
  reportUser: (reporter: string, reportee: string) => void;
  isBlocked: (blocker: string, blockee: string) => boolean;
  hasReported: (reporter: string, reportee: string) => boolean;
};

const MessageContext = createContext<MessageContextType | undefined>(undefined);

export const MessageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<{ [seller: string]: Message[] }>({});
  const [blockedUsers, setBlockedUsers] = useState<{ [user: string]: string[] }>({});
  const [reportedUsers, setReportedUsers] = useState<{ [user: string]: string[] }>({});

  useEffect(() => {
    const stored = localStorage.getItem('panty_messages');
    if (stored) setMessages(JSON.parse(stored));

    const blocked = localStorage.getItem('panty_blocked');
    if (blocked) setBlockedUsers(JSON.parse(blocked));

    const reported = localStorage.getItem('panty_reported');
    if (reported) setReportedUsers(JSON.parse(reported));
  }, []);

  useEffect(() => {
    // No longer strip imageUrl, just save as is
    localStorage.setItem('panty_messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('panty_blocked', JSON.stringify(blockedUsers));
  }, [blockedUsers]);

  useEffect(() => {
    localStorage.setItem('panty_reported', JSON.stringify(reportedUsers));
  }, [reportedUsers]);

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

    setMessages((prev) => {
      const updatedReceiverMessages = [...(prev[sanitizedReceiver] || []), newMessage];
      return {
        ...prev,
        [sanitizedReceiver]: updatedReceiverMessages,
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

    setMessages((prev) => {
      const updatedReceiverMessages = [...(prev[sanitizedSeller] || []), newMessage];
      return {
        ...prev,
        [sanitizedSeller]: updatedReceiverMessages,
      };
    });
  };

  const getMessagesForSeller = (seller: string): Message[] => {
    const sanitizedSeller = sanitizeString(seller);
    return messages[sanitizedSeller] || [];
  };

  const markMessagesAsRead = (userA: string, userB: string) => {
    const sanitizedUserA = sanitizeString(userA);
    const sanitizedUserB = sanitizeString(userB);

    setMessages((prev) => {
      const updatedA = (prev[sanitizedUserA] || []).map((msg) =>
        msg.receiver === sanitizedUserA && msg.sender === sanitizedUserB && !msg.read
          ? { ...msg, read: true }
          : msg
      );
      const updatedB = (prev[sanitizedUserB] || []).map((msg) =>
        msg.receiver === sanitizedUserA && msg.sender === sanitizedUserB && !msg.read
          ? { ...msg, read: true }
          : msg
      );
      return {
        ...prev,
        [sanitizedUserA]: updatedA,
        [sanitizedUserB]: updatedB,
      };
    });
  };

  const blockUser = (blocker: string, blockee: string) => {
    const sanitizedBlocker = sanitizeString(blocker);
    const sanitizedBlockee = sanitizeString(blockee);

    setBlockedUsers((prev) => {
      const updated = [...(prev[sanitizedBlocker] || []), sanitizedBlockee];
      return { ...prev, [sanitizedBlocker]: Array.from(new Set(updated)) };
    });
  };

  const unblockUser = (blocker: string, blockee: string) => {
    const sanitizedBlocker = sanitizeString(blocker);
    const sanitizedBlockee = sanitizeString(blockee);

    setBlockedUsers((prev) => {
      const updated = (prev[sanitizedBlocker] || []).filter((u) => u !== sanitizedBlockee);
      return { ...prev, [sanitizedBlocker]: updated };
    });
  };

  const reportUser = (reporter: string, reportee: string) => {
    const sanitizedReporter = sanitizeString(reporter);
    const sanitizedReportee = sanitizeString(reportee);

    setReportedUsers((prev) => {
      const updated = [...(prev[sanitizedReporter] || []), sanitizedReportee];
      return { ...prev, [sanitizedReporter]: Array.from(new Set(updated)) };
    });

    const pantyMessages = JSON.parse(localStorage.getItem('panty_messages') || '{}');
    const allMessages: Message[] = [];

    (Object.values(pantyMessages) as Message[][]).forEach((msgList) => {
      msgList.forEach((msg) => {
        const between = [msg.sender, msg.receiver];
        if (between.includes(sanitizedReporter) && between.includes(sanitizedReportee)) {
          allMessages.push(msg);
        }
      });
    });

    const existingReports: ReportLog[] = JSON.parse(localStorage.getItem('panty_report_logs') || '[]');

    existingReports.push({
      reporter: sanitizedReporter,
      reportee: sanitizedReportee,
      messages: allMessages,
      date: new Date().toISOString(),
    });

    localStorage.setItem('panty_report_logs', JSON.stringify(existingReports));
  };

  const isBlocked = (blocker: string, blockee: string) => {
    const sanitizedBlocker = sanitizeString(blocker);
    const sanitizedBlockee = sanitizeString(blockee);
    return blockedUsers[sanitizedBlocker]?.includes(sanitizedBlockee) || false;
  };

  const hasReported = (reporter: string, reportee: string) => {
    const sanitizedReporter = sanitizeString(reporter);
    const sanitizedReportee = sanitizeString(reportee);
    return reportedUsers[sanitizedReporter]?.includes(sanitizedReportee) || false;
  };

  return (
    <MessageContext.Provider
      value={{
        messages,
        sendMessage,
        sendCustomRequest,
        getMessagesForSeller,
        markMessagesAsRead,
        blockUser,
        unblockUser,
        reportUser,
        isBlocked,
        hasReported,
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

export const getReportCount = () => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('panty_report_logs');
    const parsed = stored ? JSON.parse(stored) : [];
    return parsed.length;
  }
  return 0;
};