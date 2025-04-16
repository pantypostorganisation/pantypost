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
};

const MessageContext = createContext<MessageContextType | undefined>(undefined);

export const MessageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<{ [seller: string]: Message[] }>({});

  // Load messages from localStorage on mount
  useEffect(() => {
    // Use a stable JSON string for comparison
    const current = localStorage.getItem('panty_messages');
    const next = JSON.stringify(messages);
  
    if (current !== next) {
      localStorage.setItem('panty_messages', next);
    }
  }, [messages]);

  // Save messages to localStorage on change
  useEffect(() => {
    localStorage.setItem('panty_messages', JSON.stringify(messages));
  }, [messages]);

  const sendMessage = (sender: string, receiver: string, content: string) => {
    const newMessage: Message = {
      sender,
      receiver,
      content,
      date: new Date().toISOString(),
      read: false,
    };

    setMessages((prev) => ({
      ...prev,
      [receiver]: [...(prev[receiver] || []), newMessage],
    }));
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

  return (
    <MessageContext.Provider
      value={{
        messages,
        sendMessage,
        getMessagesForSeller,
        markMessagesAsRead,
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
