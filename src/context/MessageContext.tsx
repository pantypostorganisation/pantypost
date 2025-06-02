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
        console.warn('Invalid data URL structure');
        return '';
      }
      
      const [, mimeType, isBase64, data] = dataUrlMatch;
      
      // Validate MIME type
      if (!IMAGE_MIME_TYPES.includes(mimeType as any)) {
        console.warn(`Invalid image MIME type: ${mimeType}`);
        return '';
      }
      
      // Validate base64 encoding is present
      if (!isBase64) {
        console.warn('Only base64 encoded images are allowed');
        return '';
      }
      
      // Validate base64 content
      if (!data || data.length === 0) {
        console.warn('Empty image data');
        return '';
      }
      
      // Check for valid base64 characters
      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(data)) {
        console.warn('Invalid base64 characters detected');
        return '';
      }
      
      // Estimate decoded size (base64 is ~33% larger than binary)
      const estimatedSize = (data.length * 3) / 4;
      if (estimatedSize > MAX_IMAGE_SIZE) {
        console.warn(`Image too large: estimated ${estimatedSize} bytes`);
        return '';
      }
      
      if (estimatedSize < MIN_IMAGE_SIZE) {
        console.warn(`Image too small: estimated ${estimatedSize} bytes`);
        return '';
      }
      
      // In development mode, skip detailed binary validation
      if (isDevelopment) {
        console.log('[DEV MODE] Skipping detailed image binary validation');
        return url;
      }
      
      // Decode and validate image header
      try {
        const binaryString = atob(data.substring(0, 64)); // Check first 64 chars
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        // Validate image file signatures (magic numbers)
        const signatures = {
          jpeg: [0xFF, 0xD8, 0xFF],
          png: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
          gif87a: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61],
          gif89a: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61],
          webp: [0x52, 0x49, 0x46, 0x46] // RIFF header
        };
        
        let validSignature = false;
        
        // Check JPEG
        if (mimeType.includes('jpeg') || mimeType.includes('jpg')) {
          validSignature = signatures.jpeg.every((byte, i) => bytes[i] === byte);
        }
        // Check PNG
        else if (mimeType.includes('png')) {
          validSignature = signatures.png.every((byte, i) => bytes[i] === byte);
        }
        // Check GIF
        else if (mimeType.includes('gif')) {
          validSignature = signatures.gif87a.every((byte, i) => bytes[i] === byte) ||
                          signatures.gif89a.every((byte, i) => bytes[i] === byte);
        }
        // Check WebP
        else if (mimeType.includes('webp')) {
          validSignature = signatures.webp.every((byte, i) => bytes[i] === byte);
          // Additional WebP validation
          if (validSignature && bytes.length >= 12) {
            const webpMarker = String.fromCharCode(...Array.from(bytes.slice(8, 12)));
            validSignature = webpMarker === 'WEBP';
          }
        }
        
        if (!validSignature) {
          console.warn(`Invalid ${mimeType} file signature`);
          return '';
        }
        
        // Additional security: scan for suspicious patterns in the decoded data
        const decodedPreview = binaryString.substring(0, 1000);
        const suspiciousPatterns = [
          /<script/i,
          /javascript:/i,
          /onclick/i,
          /onerror/i,
          /<iframe/i,
          /<object/i,
          /<embed/i,
          /\.exe/i,
          /\.bat/i,
          /\.cmd/i,
          /\.com/i,
          /\.pif/i,
          /\.scr/i,
          /\.vbs/i,
          /\.js/i
        ];
        
        for (const pattern of suspiciousPatterns) {
          if (pattern.test(decodedPreview)) {
            console.warn('Suspicious pattern detected in image data');
            return '';
          }
        }
        
      } catch (e) {
        console.warn('Failed to decode/validate base64 image data:', e);
        return '';
      }
      
      return url; // Data URL passed all validations
      
    } catch (e) {
      console.warn('Error validating data URL:', e);
      return '';
    }
  }
  
  // Handle blob URLs with validation
  if (url.startsWith('blob:')) {
    // Validate blob URL format (protocol://domain/uuid)
    const blobPattern = /^blob:(https?:\/\/[^/]+)\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!blobPattern.test(url)) {
      console.warn('Invalid blob URL format');
      return '';
    }
    
    // Extract origin from blob URL
    const blobMatch = url.match(/^blob:(https?:\/\/[^/]+)/);
    if (blobMatch) {
      try {
        const blobOrigin = new URL(blobMatch[1]).hostname;
        // Only allow blob URLs from trusted origins
        if (!TRUSTED_IMAGE_DOMAINS.includes(blobOrigin)) {
          console.warn(`Blob URL from untrusted origin: ${blobOrigin}`);
          return '';
        }
      } catch (e) {
        console.warn('Invalid blob URL origin');
        return '';
      }
    }
    
    return url;
  }
  
  // Handle relative URLs with strict validation
  if (url.startsWith('/')) {
    // Check for path traversal attempts
    const pathTraversalPatterns = [
      /\.\./,           // ..
      /\.\.%2F/i,       // URL encoded ../
      /\.\.%5C/i,       // URL encoded ..\
      /%2E%2E/i,        // Double URL encoded ..
      /\.\.\\/, // ..\
      /\x00/,           // Null byte
      /%00/,            // URL encoded null byte
    ];
    
    for (const pattern of pathTraversalPatterns) {
      if (pattern.test(url)) {
        console.warn('Path traversal attempt detected');
        return '';
      }
    }
    
    // Validate file extension
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const hasValidExtension = allowedExtensions.some(ext => 
      url.toLowerCase().endsWith(ext)
    );
    
    if (!hasValidExtension) {
      // Check if URL has query parameters that might hide the extension
      const urlWithoutQuery = url.split('?')[0];
      const hasValidExtWithoutQuery = allowedExtensions.some(ext => 
        urlWithoutQuery.toLowerCase().endsWith(ext)
      );
      
      if (!hasValidExtWithoutQuery) {
        console.warn('Invalid or missing image file extension');
        return '';
      }
    }
    
    return url;
  }
  
  // Handle absolute URLs with comprehensive validation
  if (url.startsWith('https://') || url.startsWith('http://')) {
    try {
      const urlObj = new URL(url);
      
      // Reject URLs with authentication info
      if (urlObj.username || urlObj.password) {
        console.warn('URLs with authentication info are not allowed');
        return '';
      }
      
      // Validate protocol
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        console.warn(`Invalid protocol: ${urlObj.protocol}`);
        return '';
      }
      
      // Check hostname against whitelist
      const hostname = urlObj.hostname.toLowerCase();
      
      // Reject IP addresses unless they're localhost
      const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
      if (ipPattern.test(hostname) && hostname !== '127.0.0.1') {
        console.warn('Direct IP addresses are not allowed');
        return '';
      }
      
      // Check against trusted domains
      const isTrusted = TRUSTED_IMAGE_DOMAINS.some(domain => {
        if (domain === hostname) return true;
        if (domain.startsWith('.')) {
          // Handle wildcard subdomains
          return hostname.endsWith(domain) || hostname === domain.substring(1);
        }
        return hostname === domain || hostname.endsWith(`.${domain}`);
      });
      
      if (!isTrusted && !isDevelopment) {
        console.warn(`Untrusted image domain: ${hostname}`);
        return '';
      }
      
      // In development, show warning but allow the image
      if (!isTrusted && isDevelopment) {
        console.warn(`[DEV MODE] Allowing untrusted image domain: ${hostname}`);
      }
      
      // Validate path doesn't contain suspicious patterns
      const suspiciousPathPatterns = [
        /\.(php|asp|aspx|jsp|cgi|pl|py|rb|sh|exe|bat|cmd|com|pif|scr|vbs|js)$/i,
        /<script/i,
        /javascript:/i,
        /vbscript:/i,
        /onload=/i,
        /onerror=/i,
        /onclick=/i,
      ];
      
      const fullPath = urlObj.pathname + urlObj.search;
      for (const pattern of suspiciousPathPatterns) {
        if (pattern.test(fullPath)) {
          console.warn('Suspicious pattern in URL path');
          return '';
        }
      }
      
      // Validate image extension in URL
      const pathname = urlObj.pathname.toLowerCase();
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
      const hasValidExtension = allowedExtensions.some(ext => pathname.endsWith(ext));
      
      // Some CDNs don't use extensions, so also check Content-Type hints in URL
      const hasImageTypeHint = /\/(image|img|photo|picture|media)\//i.test(pathname) ||
                              urlObj.searchParams.has('format') ||
                              urlObj.searchParams.has('type');
      
      if (!hasValidExtension && !hasImageTypeHint) {
        console.warn('URL does not appear to point to an image');
        return '';
      }
      
      return url;
      
    } catch (e) {
      console.warn('Invalid URL format:', e);
      return '';
    }
  }
  
  // Reject any other URL schemes (file://, ftp://, etc.)
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
  getReportCount: () => number; // NEW: Added to context
  blockedUsers: { [user: string]: string[] }; // NEW: Expose blocked users
  reportedUsers: { [user: string]: string[] }; // NEW: Expose reported users
  reportLogs: ReportLog[]; // NEW: Expose report logs
};

const MessageContext = createContext<MessageContextType | undefined>(undefined);

export const MessageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<{ [seller: string]: Message[] }>({});
  const [blockedUsers, setBlockedUsers] = useState<{ [user: string]: string[] }>({});
  const [reportedUsers, setReportedUsers] = useState<{ [user: string]: string[] }>({});
  // NEW: State for report logs
  const [reportLogs, setReportLogs] = useState<ReportLog[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('panty_messages');
    if (stored) setMessages(JSON.parse(stored));

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

  // UPDATED: Enhanced reportUser function with proper report log creation
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

    // NEW: Create enhanced report log with processing status
    const newReport: ReportLog = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      reporter: sanitizedReporter,
      reportee: sanitizedReportee,
      messages: allMessages,
      date: new Date().toISOString(),
      processed: false, // NEW: Start as unprocessed
      severity: 'medium', // NEW: Default severity
      category: 'other' // NEW: Default category
    };

    setReportLogs(prev => [...prev, newReport]);

    // Dispatch event to update UI counters
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('updateReports'));
    }
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

  // NEW: Enhanced getReportCount function that counts only pending reports
  const getReportCount = (): number => {
    try {
      // Count only reports that are NOT processed
      const pendingReports = reportLogs.filter(report => 
        report && !report.processed
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
        getMessagesForSeller,
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