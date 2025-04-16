'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export type Message = {
  sender: string;
  receiver: string;
  content: string;
  date: string;
  read?: boolean;
};

type MessageContextType = {
  messages: { [seller: string]: Message[] };
  sendMessage: (sender: string, receiver: string, content: string) => void;
  getMessagesForSeller: (seller: string) => Message[];
  markMessagesAsRead: (seller: string, sender: string) => void;
  blockUser: (blocker: string, blockee: string) => void;
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

  const sendMessage = (sender: string, receiver: string, content: string) => {
    if (isBlocked(receiver, sender)) return; // Don't allow messages if sender is blocked by receiver

    const newMessage: Message = {
      sender,
      receiver,
      content,
      date: new Date().toISOString(),
      read: false,
    };

    setMessages((prev) => {
      const updatedReceiverMessages = [...(prev[receiver] || []), newMessage];
      return {
        ...prev,
        [receiver]: updatedReceiverMessages,
      };
    });
  };

  const getMessagesForSeller = (seller: string): Message[] => {
    return messages[seller] || [];
  };

  const markMessagesAsRead = (seller: string, sender: string) => {
    setMessages((prev) => {
      const updatedMessages = (prev[seller] || []).map((msg) =>
        msg.sender === sender ? { ...msg, read: true } : msg
      );
      return {
        ...prev,
        [seller]: updatedMessages,
      };
    });
  };

  const blockUser = (blocker: string, blockee: string) => {
    setBlockedUsers((prev) => {
      const updated = [...(prev[blocker] || []), blockee];
      return { ...prev, [blocker]: Array.from(new Set(updated)) };
    });
  };

  const reportUser = (reporter: string, reportee: string) => {
    setReportedUsers((prev) => {
      const updated = [...(prev[reporter] || []), reportee];
      return { ...prev, [reporter]: Array.from(new Set(updated)) };
    });
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
        getMessagesForSeller,
        markMessagesAsRead,
        blockUser,
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