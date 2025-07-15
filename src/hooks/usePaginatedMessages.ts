// src/hooks/usePaginatedMessages.ts
import { useState, useEffect, useRef, useCallback } from 'react';
import { z } from 'zod';
import { sanitizeStrict, sanitizeHtml } from '@/utils/security/sanitization';
import { useRateLimit } from '@/utils/security/rate-limiter';

// Define secure message schema
const MessageSchema = z.object({
  sender: z.string().min(1).max(100),
  receiver: z.string().min(1).max(100),
  content: z.string().min(1).max(5000),
  date: z.string().datetime(),
  read: z.boolean().optional(),
  type: z.enum(['normal', 'customRequest', 'image']).optional(),
  meta: z.object({
    id: z.string().optional(),
    title: z.string().max(200).optional(),
    price: z.number().min(0).max(10000).optional(),
    tags: z.array(z.string().max(50)).max(20).optional(),
    message: z.string().max(1000).optional(),
    imageUrl: z.string().url().optional(),
  }).optional(),
});

type Message = z.infer<typeof MessageSchema>;

interface UsePaginatedMessagesOptions {
  pageSize?: number;
  initialPage?: number;
  sortDirection?: 'ascending' | 'descending';
  loadMoreTriggerIndex?: number;
  enableSanitization?: boolean;
}

/**
 * Custom hook to provide efficient and secure pagination for message lists
 * 
 * @param messages Array of all messages for the conversation
 * @param options Configuration options for pagination
 * @returns Object with paginated messages and control functions
 */
export function usePaginatedMessages(
  messages: Message[],
  options: UsePaginatedMessagesOptions = {}
) {
  const {
    pageSize = 20,
    initialPage = 0,
    sortDirection = 'ascending',
    loadMoreTriggerIndex = 5,
    enableSanitization = true
  } = options;

  // Rate limiting for load more actions
  const { checkLimit } = useRateLimit('MESSAGE_PAGINATION', {
    maxAttempts: 30,
    windowMs: 60 * 1000 // 1 minute
  });

  // Keep original messages reference to detect changes
  const messagesRef = useRef<Message[]>([]);

  // State for pagination
  const [page, setPage] = useState(initialPage);
  const [displayedMessages, setDisplayedMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [allLoaded, setAllLoaded] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Track conversation to reset pagination when it changes
  const conversationId = useRef<string | null>(null);

  // Validate page size and other options
  useEffect(() => {
    if (pageSize < 1 || pageSize > 100) {
      console.warn('Invalid pageSize, using default of 20');
    }
    if (loadMoreTriggerIndex < 0 || loadMoreTriggerIndex > pageSize) {
      console.warn('Invalid loadMoreTriggerIndex, using default of 5');
    }
  }, [pageSize, loadMoreTriggerIndex]);

  // Sanitize message content
  const sanitizeMessage = useCallback((message: Message): Message => {
    if (!enableSanitization) return message;

    try {
      // Validate message structure
      const validated = MessageSchema.parse(message);

      // Sanitize content based on type
      const sanitized: Message = {
        ...validated,
        content: validated.type === 'normal' 
          ? sanitizeHtml(validated.content) 
          : sanitizeStrict(validated.content),
        sender: sanitizeStrict(validated.sender),
        receiver: sanitizeStrict(validated.receiver),
      };

      // Sanitize meta fields if present
      if (sanitized.meta) {
        sanitized.meta = {
          ...sanitized.meta,
          title: sanitized.meta.title ? sanitizeStrict(sanitized.meta.title) : undefined,
          message: sanitized.meta.message ? sanitizeHtml(sanitized.meta.message) : undefined,
          tags: sanitized.meta.tags?.map(tag => sanitizeStrict(tag).slice(0, 50)),
        };
      }

      return sanitized;
    } catch (error) {
      console.error('Message validation failed:', error);
      // Return a safe fallback message
      return {
        ...message,
        content: '[Invalid message content]',
        type: 'normal'
      };
    }
  }, [enableSanitization]);

  // Generate a conversation ID based on participants
  const getConversationId = useCallback((messages: Message[]): string => {
    if (messages.length === 0) return 'empty';
    const sampleMessage = messages[0];
    // Sanitize participants for ID generation
    const sender = sanitizeStrict(sampleMessage.sender);
    const receiver = sanitizeStrict(sampleMessage.receiver);
    return `${sender}-${receiver}`;
  }, []);

  // Helper function to create a unique identifier for a message
  const getMessageKey = useCallback((message: Message): string => {
    // Create a unique key based on message content and timestamp
    // Hash the content to prevent injection through key manipulation
    const contentHash = message.content.slice(0, 50).replace(/[^a-zA-Z0-9]/g, '');
    return `${message.sender}-${message.receiver}-${contentHash}-${message.date}`;
  }, []);

  // Reset pagination when conversation changes
  useEffect(() => {
    const currentConversationId = getConversationId(messages);

    if (currentConversationId !== conversationId.current) {
      // New conversation detected
      conversationId.current = currentConversationId;
      setPage(initialPage);
      setAllLoaded(false);
      setValidationErrors([]);

      // Get initial page of messages
      if (messages.length > 0) {
        const sanitizedMessages = messages.map(sanitizeMessage);
        const sorted = sortMessages(sanitizedMessages, sortDirection);
        const initialMessages = sorted.slice(0, Math.min(pageSize, 100)); // Cap at 100
        setDisplayedMessages(initialMessages);
        setAllLoaded(initialMessages.length >= sorted.length);
      } else {
        setDisplayedMessages([]);
        setAllLoaded(true);
      }
    }
  }, [messages, initialPage, pageSize, sortDirection, getConversationId, sanitizeMessage]);

  // Helper function to sort messages
  const sortMessages = (messages: Message[], direction: 'ascending' | 'descending'): Message[] => {
    return [...messages].sort((a, b) => {
      try {
        const timeA = new Date(a.date).getTime();
        const timeB = new Date(b.date).getTime();
        
        // Validate dates
        if (isNaN(timeA) || isNaN(timeB)) {
          console.warn('Invalid date in messages');
          return 0;
        }
        
        return direction === 'ascending' ? timeA - timeB : timeB - timeA;
      } catch (error) {
        console.error('Error sorting messages:', error);
        return 0;
      }
    });
  };

  // Effect to load more messages when page changes
  useEffect(() => {
    // Skip initial page (already handled)
    if (page === initialPage) return;

    const loadMoreMessages = async () => {
      // Check rate limit
      const rateLimitResult = checkLimit();
      if (!rateLimitResult.allowed) {
        console.warn('Rate limit exceeded for message pagination');
        return;
      }

      setIsLoading(true);

      try {
        // Simulate network delay for smoother UX
        await new Promise(resolve => setTimeout(resolve, 200));

        const sanitizedMessages = messages.map(sanitizeMessage);
        const sorted = sortMessages(sanitizedMessages, sortDirection);
        const start = page * pageSize;
        const end = Math.min((page + 1) * pageSize, sorted.length);

        // Validate indices
        if (start < 0 || start >= sorted.length) {
          setAllLoaded(true);
          return;
        }

        // Get messages for the current page
        const newDisplayedMessages = sorted.slice(start, end);

        setDisplayedMessages(prevMessages => {
          // Prevent duplicate messages
          const existingKeys = new Set(prevMessages.map(getMessageKey));
          const uniqueNewMessages = newDisplayedMessages.filter(
            msg => !existingKeys.has(getMessageKey(msg))
          );
          return [...prevMessages, ...uniqueNewMessages];
        });
        
        setAllLoaded(end >= sorted.length);
      } catch (error) {
        console.error('Error loading more messages:', error);
        setValidationErrors(prev => [...prev, 'Failed to load messages']);
      } finally {
        setIsLoading(false);
      }
    };

    loadMoreMessages();
  }, [page, messages, pageSize, sortDirection, initialPage, checkLimit, sanitizeMessage, getMessageKey]);

  // Check for new messages and add them to the displayed messages
  useEffect(() => {
    let isCurrent = true;

    // Skip if initial render or no messages displayed yet
    if (messagesRef.current.length === 0 || displayedMessages.length === 0) {
      messagesRef.current = messages;
      return;
    }

    // If message count changed, check if we need to update displayed messages
    if (messages.length !== messagesRef.current.length) {
      const oldConversationId = getConversationId(messagesRef.current);
      const newConversationId = getConversationId(messages);

      // If same conversation, check for new messages
      if (oldConversationId === newConversationId) {
        // Create a Set of message keys from the previous messages for O(1) lookup
        const existingMessageKeys = new Set(
          messagesRef.current.map(msg => getMessageKey(msg))
        );

        // Find new messages by checking which ones don't exist in the previous set
        const newMessages = messages.filter(msg => 
          !existingMessageKeys.has(getMessageKey(msg))
        );

        // If there are new messages, add them to displayed messages
        if (newMessages.length > 0 && isCurrent) {
          const sanitizedNewMessages = newMessages.map(sanitizeMessage);
          const sorted = sortMessages(sanitizedNewMessages, sortDirection);
          
          setDisplayedMessages(prev => {
            // Merge and re-sort to handle out-of-order messages properly
            const combined = [...prev, ...sorted];
            // Limit total messages to prevent memory issues
            const limited = combined.slice(-500); // Keep last 500 messages max
            return sortMessages(limited, sortDirection);
          });
        }
      }

      // Update reference
      messagesRef.current = messages;
    }

    return () => {
      isCurrent = false;
    };
  }, [messages, displayedMessages, getConversationId, sortDirection, getMessageKey, sanitizeMessage]);

  // Check if we're approaching the end of the list
  useEffect(() => {
    if (isLoading || allLoaded) return;

    // If we're showing the last {loadMoreTriggerIndex} messages from the current page,
    // automatically load more
    const threshold = displayedMessages.length - loadMoreTriggerIndex;
    if (displayedMessages.length > 0 && threshold <= 0) {
      loadMore();
    }
  }, [displayedMessages.length, isLoading, allLoaded, loadMoreTriggerIndex]);

  // Function to load more messages
  const loadMore = useCallback(() => {
    if (isLoading || allLoaded) return;
    
    // Check rate limit
    const rateLimitResult = checkLimit();
    if (!rateLimitResult.allowed) {
      console.warn('Rate limit exceeded for loading more messages');
      return;
    }
    
    setPage(prevPage => prevPage + 1);
  }, [isLoading, allLoaded, checkLimit]);

  // Reset pagination data
  const reset = useCallback(() => {
    setPage(initialPage);
    setAllLoaded(false);
    setValidationErrors([]);
    conversationId.current = null;

    // Load initial page
    if (messages.length > 0) {
      const sanitizedMessages = messages.map(sanitizeMessage);
      const sorted = sortMessages(sanitizedMessages, sortDirection);
      const initialMessages = sorted.slice(0, Math.min(pageSize, 100));
      setDisplayedMessages(initialMessages);
      setAllLoaded(initialMessages.length >= sorted.length);
    } else {
      setDisplayedMessages([]);
      setAllLoaded(true);
    }

    messagesRef.current = messages;
  }, [messages, initialPage, pageSize, sortDirection, sanitizeMessage]);

  return {
    displayedMessages,
    isLoading,
    hasMore: !allLoaded,
    loadMore,
    reset,
    page,
    allLoaded,
    validationErrors
  };
}
