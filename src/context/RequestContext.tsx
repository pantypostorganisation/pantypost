"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

// Add "paid" to RequestStatus
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
  paid?: boolean; // <-- add this
};

type RequestContextType = {
  requests: CustomRequest[];
  setRequests: React.Dispatch<React.SetStateAction<CustomRequest[]>>; // <-- add this
  addRequest: (req: CustomRequest) => void;
  getRequestsForUser: (username: string, role: 'buyer' | 'seller') => CustomRequest[];
  respondToRequest: (
    id: string,
    status: RequestStatus,
    response?: string,
    updateFields?: Partial<Pick<CustomRequest, 'title' | 'price' | 'tags' | 'description'>>
  ) => void;
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
          setRequests(parsedRequests);
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
    setRequests((prev) => [...prev, req]);
  };

  const getRequestsForUser = (username: string, role: 'buyer' | 'seller') => {
    return requests.filter((r) => r[role] === username);
  };

  // FIX: respondToRequest now updates all editable fields if provided
  const respondToRequest = (
    id: string,
    status: RequestStatus,
    response?: string,
    updateFields?: Partial<Pick<CustomRequest, 'title' | 'price' | 'tags' | 'description'>>
  ) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status,
              response,
              ...(updateFields || {}),
            }
          : r
      )
    );
  };

  return (
    <RequestContext.Provider
      value={{
        requests,
        setRequests,
        addRequest,
        getRequestsForUser,
        respondToRequest,
      }}
    >
      {children}
    </RequestContext.Provider>
  );
};

