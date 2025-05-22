import { useState, useEffect, useRef, useCallback } from 'react';

type Message = {
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

interface UsePaginatedMessagesOptions {
  pageSize?: number;
  initialPage?: number;
  sortDirection?: 'ascending' | 'descending';
  loadMoreTriggerIndex?: number;
}

/**
 * Custom hook to provide efficient pagination for message lists
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
    loadMoreTriggerIndex = 5
  } = options;

  // Keep original messages reference to detect changes
  const messagesRef = useRef<Message[]>([]);

  // State for pagination
  const [page, setPage] = useState(initialPage);
  const [displayedMessages, setDisplayedMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [allLoaded, setAllLoaded] = useState(false);

  // Track conversation to reset pagination when it changes
  const conversationId = useRef<string | null>(null);

  // Generate a conversation ID based on participants
  const getConversationId = useCallback((messages: Message[]): string => {
    if (messages.length === 0) return 'empty';
    const sampleMessage = messages[0];
    return `${sampleMessage.sender}-${sampleMessage.receiver}`;
  }, []);

  // Helper function to find the latest message by date
  const getLatestMessageDate = useCallback((messages: Message[]): number => {
    if (messages.length === 0) return 0;
    
    return Math.max(...messages.map(msg => new Date(msg.date).getTime()));
  }, []);

  // Reset pagination when conversation changes
  useEffect(() => {
    const currentConversationId = getConversationId(messages);

    if (currentConversationId !== conversationId.current) {
      // New conversation detected
      conversationId.current = currentConversationId;
      setPage(initialPage);
      setAllLoaded(false);

      // Get initial page of messages
      if (messages.length > 0) {
        const sorted = sortMessages(messages, sortDirection);
        const initialMessages = sorted.slice(0, pageSize);
        setDisplayedMessages(initialMessages);
        setAllLoaded(initialMessages.length >= sorted.length);
      } else {
        setDisplayedMessages([]);
        setAllLoaded(true);
      }
    }
  }, [messages, initialPage, pageSize, sortDirection, getConversationId]);

  // Helper function to sort messages
  const sortMessages = (messages: Message[], direction: 'ascending' | 'descending'): Message[] => {
    return [...messages].sort((a, b) => {
      const timeA = new Date(a.date).getTime();
      const timeB = new Date(b.date).getTime();
      return direction === 'ascending' ? timeA - timeB : timeB - timeA;
    });
  };

  // Effect to load more messages when page changes
  useEffect(() => {
    // Skip initial page (already handled)
    if (page === initialPage) return;

    const loadMoreMessages = async () => {
      setIsLoading(true);

      try {
        // Simulate network delay for smoother UX
        await new Promise(resolve => setTimeout(resolve, 200));

        const sorted = sortMessages(messages, sortDirection);
        const start = page * pageSize;
        const end = Math.min((page + 1) * pageSize, sorted.length);

        // Get messages for the current page
        const newDisplayedMessages = sorted.slice(start, end);

        setDisplayedMessages(prevMessages => [...prevMessages, ...newDisplayedMessages]);
        setAllLoaded(end >= sorted.length);
      } finally {
        setIsLoading(false);
      }
    };

    loadMoreMessages();
  }, [page, messages, pageSize, sortDirection, initialPage]);

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
        // FIX: Get the actual latest message date from all previous messages
        const oldLatestDate = getLatestMessageDate(messagesRef.current);

        // Find new messages (those with date newer than the latest in our ref)
        const newMessages = messages.filter(msg =>
          new Date(msg.date).getTime() > oldLatestDate
        );

        // If there are new messages, add them to displayed messages
        if (newMessages.length > 0 && isCurrent) {
          const sorted = sortMessages(newMessages, sortDirection);
          setDisplayedMessages(prev => [...prev, ...sorted]);
        }
      }

      // Update reference
      messagesRef.current = messages;
    }

    return () => {
      isCurrent = false;
    };
  }, [messages, displayedMessages, getConversationId, sortDirection, getLatestMessageDate]);

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
    setPage(prevPage => prevPage + 1);
  }, [isLoading, allLoaded]);

  // Reset pagination data
  const reset = useCallback(() => {
    setPage(initialPage);
    setAllLoaded(false);
    conversationId.current = null;

    // Load initial page
    if (messages.length > 0) {
      const sorted = sortMessages(messages, sortDirection);
      const initialMessages = sorted.slice(0, pageSize);
      setDisplayedMessages(initialMessages);
      setAllLoaded(initialMessages.length >= sorted.length);
    } else {
      setDisplayedMessages([]);
      setAllLoaded(true);
    }

    messagesRef.current = messages;
  }, [messages, initialPage, pageSize, sortDirection]);

  return {
    displayedMessages,
    isLoading,
    hasMore: !allLoaded,
    loadMore,
    reset,
    page,
    allLoaded
  };
}