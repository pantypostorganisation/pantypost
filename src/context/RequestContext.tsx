// src/context/RequestContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type RequestStatus = 'pending' | 'accepted' | 'rejected' | 'edited' | 'paid';

export type CustomRequest = {
  id: string;
  buyer: string;
  seller: string;
  title: string;
  description: string;
  price: number;
  tags: string[];
  status: RequestStatus;
  date: string;
  response?: string;
  paid?: boolean;
  // Add these fields to track the message-based flow
  messageThreadId?: string; // Links to the conversation
  lastModifiedBy?: string; // Who made the last edit
  originalMessageId?: string; // Reference to original message
};

type RequestContextType = {
  requests: CustomRequest[];
  setRequests: React.Dispatch<React.SetStateAction<CustomRequest[]>>;
  addRequest: (req: CustomRequest) => void;
  getRequestsForUser: (username: string, role: 'buyer' | 'seller') => CustomRequest[];
  getRequestById: (id: string) => CustomRequest | undefined;
  respondToRequest: (
    id: string,
    status: RequestStatus,
    response?: string,
    updateFields?: Partial<Pick<CustomRequest, 'title' | 'price' | 'tags' | 'description'>>,
    modifiedBy?: string
  ) => void;
  markRequestAsPaid: (id: string) => void;
  // Helper functions for message-based workflow
  getActiveRequestsForThread: (buyer: string, seller: string) => CustomRequest[];
  getLatestRequestInThread: (buyer: string, seller: string) => CustomRequest | undefined;
};

const RequestContext = createContext<RequestContextType | undefined>(undefined);

export const useRequests = () => {
  const ctx = useContext(RequestContext);
  if (!ctx) throw new Error('useRequests must be used within a RequestProvider');
  return ctx;
};

export const RequestProvider = ({ children }: { children: React.ReactNode }) => {
  const [requests, setRequests] = useState<CustomRequest[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load initial data from localStorage only once
  useEffect(() => {
    if (typeof window !== 'undefined' && !isInitialized) {
      try {
        const stored = localStorage.getItem('panty_custom_requests');
        if (stored) {
          const parsedRequests = JSON.parse(stored);
          // Migrate old requests to include new fields if they don't exist
          const migratedRequests = parsedRequests.map((req: any) => ({
            ...req,
            messageThreadId: req.messageThreadId || `${req.buyer}-${req.seller}`,
            lastModifiedBy: req.lastModifiedBy || req.buyer,
            originalMessageId: req.originalMessageId || req.id
          }));
          setRequests(migratedRequests);
        }
        setIsInitialized(true);
      } catch (error) {
        console.error('Error loading requests from localStorage:', error);
        setIsInitialized(true);
      }
    }
  }, [isInitialized]);

  // Save to localStorage whenever requests change
  useEffect(() => {
    if (typeof window !== 'undefined' && isInitialized) {
      try {
        localStorage.setItem('panty_custom_requests', JSON.stringify(requests));
      } catch (error) {
        console.error('Error saving requests to localStorage:', error);
      }
    }
  }, [requests, isInitialized]);

  const addRequest = (req: CustomRequest) => {
    const requestWithDefaults = {
      ...req,
      messageThreadId: req.messageThreadId || `${req.buyer}-${req.seller}`,
      lastModifiedBy: req.lastModifiedBy || req.buyer,
      originalMessageId: req.originalMessageId || req.id
    };
    setRequests((prev) => [...prev, requestWithDefaults]);
  };

  const getRequestsForUser = (username: string, role: 'buyer' | 'seller') => {
    return requests.filter((r) => r[role] === username);
  };

  const getRequestById = (id: string) => {
    return requests.find((r) => r.id === id);
  };

  // Enhanced respond function that tracks who made the last modification
  const respondToRequest = (
    id: string,
    status: RequestStatus,
    response?: string,
    updateFields?: Partial<Pick<CustomRequest, 'title' | 'price' | 'tags' | 'description'>>,
    modifiedBy?: string
  ) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status,
              response,
              lastModifiedBy: modifiedBy || r.lastModifiedBy,
              ...(updateFields || {}),
            }
          : r
      )
    );
  };

  // Mark request as paid (when payment is processed)
  const markRequestAsPaid = (id: string) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'paid' as RequestStatus,
              paid: true
            }
          : r
      )
    );
  };

  // Get all active requests between two users
  const getActiveRequestsForThread = (buyer: string, seller: string) => {
    return requests.filter((r) => 
      r.buyer === buyer && 
      r.seller === seller && 
      r.status !== 'rejected' && 
      r.status !== 'paid'
    );
  };

  // Get the most recent request in a conversation thread
  const getLatestRequestInThread = (buyer: string, seller: string) => {
    const threadRequests = requests
      .filter((r) => r.buyer === buyer && r.seller === seller)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return threadRequests[0];
  };

  return (
    <RequestContext.Provider
      value={{
        requests,
        setRequests,
        addRequest,
        getRequestsForUser,
        getRequestById,
        respondToRequest,
        markRequestAsPaid,
        getActiveRequestsForThread,
        getLatestRequestInThread,
      }}
    >
      {children}
    </RequestContext.Provider>
  );
};
