'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

type Message = {
  sender: string;
  receiver: string;
  content: string;
  date: string;
};

type MessageContextType = {
  messages: { [seller: string]: Message[] };
  sendMessage: (sender: string, receiver: string, content: string) => void;
  getMessagesForSeller: (seller: string) => Message[];
};

const MessageContext = createContext<MessageContextType | undefined>(undefined);

export const MessageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<{ [seller: string]: Message[] }>({});

  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('panty_messages');
    if (stored) {
      setMessages(JSON.parse(stored));
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('panty_messages', JSON.stringify(messages));
  }, [messages]);

  const sendMessage = (sender: string, receiver: string, content: string) => {
    const newMessage: Message = {
      sender,
      receiver,
      content,
      date: new Date().toISOString(),
    };

    setMessages((prev) => ({
      ...prev,
      [receiver]: [...(prev[receiver] || []), newMessage],
    }));
  };

  const getMessagesForSeller = (seller: string): Message[] => {
    return messages[seller] || [];
  };

  return (
    <MessageContext.Provider value={{ messages, sendMessage, getMessagesForSeller }}>
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
