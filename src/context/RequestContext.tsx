// src/context/RequestContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { safeStorage } from '@/utils/safeStorage';

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
  paid?: boolean;
  messageThreadId?: string; // Links to the message conversation
  lastModifiedBy?: string; // Track who made the last modification
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
      const storedRequests = safeStorage.getItem<CustomRequest[]>('panty_custom_requests', []);
      // Migrate old requests to include new fields if they don't exist
      const migratedRequests = (storedRequests || []).map((req: any) => ({
        ...req,
        messageThreadId: req.messageThreadId || `${req.buyer}-${req.seller}`,
        lastModifiedBy: req.lastModifiedBy || req.buyer,
        originalMessageId: req.originalMessageId || req.id
      }));
      setRequests(migratedRequests);
      setIsInitialized(true);
    }
  }, [isInitialized]);

  // Save to localStorage whenever requests change
  useEffect(() => {
    if (typeof window !== 'undefined' && isInitialized) {
      safeStorage.setItem('panty_custom_requests', requests);
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
      prev.map((r) => {
        if (r.id === id) {
          return {
            ...r,
            status,
            lastModifiedBy: modifiedBy || r.seller,
            ...(updateFields || {})
          };
        }
        return r;
      })
    );
  };

  const markRequestAsPaid = (id: string) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'paid' as RequestStatus, paid: true } : r))
    );
  };

  // Helper function to get all active requests for a buyer-seller thread
  const getActiveRequestsForThread = (buyer: string, seller: string): CustomRequest[] => {
    const threadId = `${buyer}-${seller}`;
    return requests.filter(
      r => r.messageThreadId === threadId && (r.status === 'pending' || r.status === 'accepted' || r.status === 'edited')
    );
  };

  // Helper function to get the latest request in a thread
  const getLatestRequestInThread = (buyer: string, seller: string): CustomRequest | undefined => {
    const threadRequests = requests.filter(
      r => r.buyer === buyer && r.seller === seller
    );
    
    if (threadRequests.length === 0) return undefined;
    
    // Sort by date descending and return the first
    return threadRequests.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0];
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
        getLatestRequestInThread
      }}
    >
      {children}
    </RequestContext.Provider>
  );
};