// src/context/RequestContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { storageService } from '@/services';
import { sanitizeStrict } from '@/utils/security/sanitization';
import { messageSchemas } from '@/utils/validation/schemas';
import { z } from 'zod';

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
  lastEditedBy?: string; // NEW: Track who last edited (buyer or seller)
  pendingWith?: string; // NEW: Track who needs to respond (buyer or seller)
};

// Validation schemas
const requestSchema = z.object({
  title: messageSchemas.customRequest.shape.title,
  description: messageSchemas.customRequest.shape.description,
  price: messageSchemas.customRequest.shape.price,
  tags: z.array(z.string().max(30)).max(10).optional(),
});

const responseSchema = z.string().min(1).max(500);

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

  // Load initial data from localStorage using service
  useEffect(() => {
    const loadData = async () => {
      if (typeof window === 'undefined' || isInitialized) return;
      
      try {
        const stored = await storageService.getItem<CustomRequest[]>('panty_custom_requests', []);
        
        // Migrate and sanitize old requests
        const migratedRequests = stored.map((req: any) => ({
          ...req,
          title: sanitizeStrict(req.title || ''),
          description: sanitizeStrict(req.description || ''),
          response: req.response ? sanitizeStrict(req.response) : undefined,
          tags: Array.isArray(req.tags) ? req.tags.map((tag: string) => sanitizeStrict(tag).slice(0, 30)) : [],
          messageThreadId: req.messageThreadId || `${req.buyer}-${req.seller}`,
          lastModifiedBy: req.lastModifiedBy || req.buyer,
          originalMessageId: req.originalMessageId || req.id,
          lastEditedBy: req.lastEditedBy || req.buyer,
          pendingWith: req.pendingWith || req.seller
        }));
        
        setRequests(migratedRequests);
        setIsInitialized(true);
      } catch (error) {
        console.error('Error loading requests from localStorage:', error);
        setIsInitialized(true);
      }
    };

    loadData();
  }, [isInitialized]);

  // Save to localStorage whenever requests change using service
  useEffect(() => {
    if (typeof window !== 'undefined' && isInitialized) {
      storageService.setItem('panty_custom_requests', requests);
    }
  }, [requests, isInitialized]);

  const addRequest = (req: CustomRequest) => {
    // Validate request data
    const validation = requestSchema.safeParse({
      title: req.title,
      description: req.description,
      price: req.price,
      tags: req.tags,
    });

    if (!validation.success) {
      console.error('Invalid request data:', validation.error);
      return;
    }

    const requestWithDefaults = {
      ...req,
      title: sanitizeStrict(validation.data.title),
      description: sanitizeStrict(validation.data.description),
      price: validation.data.price,
      tags: validation.data.tags?.map(tag => sanitizeStrict(tag).slice(0, 30)) || [],
      messageThreadId: req.messageThreadId || `${req.buyer}-${req.seller}`,
      lastModifiedBy: req.lastModifiedBy || req.buyer,
      originalMessageId: req.originalMessageId || req.id,
      lastEditedBy: req.buyer,
      pendingWith: req.seller
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
    // Validate response if provided
    if (response) {
      const responseValidation = responseSchema.safeParse(response);
      if (!responseValidation.success) {
        console.error('Invalid response:', responseValidation.error);
        return;
      }
    }

    // Validate update fields if provided
    if (updateFields) {
      const updateValidation = requestSchema.partial().safeParse(updateFields);
      if (!updateValidation.success) {
        console.error('Invalid update fields:', updateValidation.error);
        return;
      }
    }

    setRequests((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        
        // Determine who it's pending with based on who modified it
        let pendingWith = r.pendingWith;
        let lastEditedBy = r.lastEditedBy;
        
        if (status === 'edited' && modifiedBy) {
          // If edited, it's pending with the other party
          pendingWith = modifiedBy === r.buyer ? r.seller : r.buyer;
          lastEditedBy = modifiedBy;
        } else if (status === 'accepted' || status === 'rejected') {
          // No longer pending with anyone
          pendingWith = undefined;
        }
        
        return {
          ...r,
          status,
          response: response ? sanitizeStrict(response) : r.response,
          lastModifiedBy: modifiedBy || r.lastModifiedBy,
          lastEditedBy: status === 'edited' ? lastEditedBy : r.lastEditedBy,
          pendingWith,
          ...(updateFields ? {
            title: updateFields.title ? sanitizeStrict(updateFields.title) : r.title,
            description: updateFields.description ? sanitizeStrict(updateFields.description) : r.description,
            price: updateFields.price ?? r.price,
            tags: updateFields.tags?.map(tag => sanitizeStrict(tag).slice(0, 30)) || r.tags,
          } : {}),
        };
      })
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
              paid: true,
              pendingWith: undefined
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
