'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export type Message = {
  sender: string;
  receiver: string;
  content: string;
  date: string;
  read?: boolean;
  type?: 'normal' | 'customRequest';
  meta?: {
    id?: string;
    title: string;
    price: number;
    tags: string[];
    message?: string; // <-- Added for custom request message body
  };
};

type ReportLog = {
  reporter: string;
  reportee: string;
  messages: Message[];
  date: string;
};

type MessageOptions = {
  type?: 'normal' | 'customRequest';
  meta?: {
    id?: string;
    title: string;
    price: number;
    tags: string[];
    message?: string; // <-- Added for custom request message body
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
    tags: string[]
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

    const newMessage: Message = {
      sender,
      receiver,
      content,
      date: new Date().toISOString(),
      read: false,
      ...(options?.type && { type: options.type }),
      ...(options?.meta && { meta: options.meta }),
    };

    setMessages((prev) => {
      const updatedReceiverMessages = [...(prev[receiver] || []), newMessage];
      return {
        ...prev,
        [receiver]: updatedReceiverMessages,
      };
    });
  };

  const sendCustomRequest = (
    buyer: string,
    seller: string,
    content: string,
    title: string,
    price: number,
    tags: string[]
  ) => {
    if (isBlocked(seller, buyer)) return;

    const newMessage: Message = {
      sender: buyer,
      receiver: seller,
      content,
      date: new Date().toISOString(),
      read: false,
      type: 'customRequest',
      meta: {
        title,
        price,
        tags,
        message: content, // Store the custom request message body
      },
    };

    setMessages((prev) => {
      const updatedReceiverMessages = [...(prev[seller] || []), newMessage];
      return {
        ...prev,
        [seller]: updatedReceiverMessages,
      };
    });
  };

  const getMessagesForSeller = (seller: string): Message[] => {
    return messages[seller] || [];
  };

  // --- READ RECEIPTS LOGIC (REFINED) ---
  // Mark all messages between userA and userB as read for userA (the reader)
  const markMessagesAsRead = (userA: string, userB: string) => {
    setMessages((prev) => {
      // Update messages stored under userA
      const updatedA = (prev[userA] || []).map((msg) =>
        msg.receiver === userA && msg.sender === userB && !msg.read
          ? { ...msg, read: true }
          : msg
      );
      // Update messages stored under userB
      const updatedB = (prev[userB] || []).map((msg) =>
        msg.receiver === userA && msg.sender === userB && !msg.read
          ? { ...msg, read: true }
          : msg
      );
      return {
        ...prev,
        [userA]: updatedA,
        [userB]: updatedB,
      };
    });
  };

  const blockUser = (blocker: string, blockee: string) => {
    setBlockedUsers((prev) => {
      const updated = [...(prev[blocker] || []), blockee];
      return { ...prev, [blocker]: Array.from(new Set(updated)) };
    });
  };

  const unblockUser = (blocker: string, blockee: string) => {
    setBlockedUsers((prev) => {
      const updated = (prev[blocker] || []).filter((u) => u !== blockee);
      return { ...prev, [blocker]: updated };
    });
  };

  const reportUser = (reporter: string, reportee: string) => {
    setReportedUsers((prev) => {
      const updated = [...(prev[reporter] || []), reportee];
      return { ...prev, [reporter]: Array.from(new Set(updated)) };
    });

    const pantyMessages = JSON.parse(localStorage.getItem('panty_messages') || '{}');
    const allMessages: Message[] = [];

    (Object.values(pantyMessages) as Message[][]).forEach((msgList) => {
      msgList.forEach((msg) => {
        const between = [msg.sender, msg.receiver];
        if (between.includes(reporter) && between.includes(reportee)) {
          allMessages.push(msg);
        }
      });
    });

    const existingReports: ReportLog[] = JSON.parse(localStorage.getItem('panty_report_logs') || '[]');

    existingReports.push({
      reporter,
      reportee,
      messages: allMessages,
      date: new Date().toISOString(),
    });

    localStorage.setItem('panty_report_logs', JSON.stringify(existingReports));
  };

  const isBlocked = (blocker: string, blockee: string) => {
    return blockedUsers[blocker]?.includes(blockee) || false;
  };

  const hasReported = (reporter: string, reportee: string) => {
    return reportedUsers[reporter]?.includes(reportee) || false;
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

// Export getReportCount for use in Header.tsx
export const getReportCount = () => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('panty_report_logs');
    const parsed = stored ? JSON.parse(stored) : [];
    return parsed.length;
  }
  return 0;
};
