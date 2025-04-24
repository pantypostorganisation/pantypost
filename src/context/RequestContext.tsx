"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

export type RequestStatus = 'pending' | 'accepted' | 'declined';

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
};

type RequestContextType = {
  requests: CustomRequest[];
  addRequest: (req: CustomRequest) => void;
  getRequestsForUser: (username: string, role: 'buyer' | 'seller') => CustomRequest[];
  respondToRequest: (id: string, status: RequestStatus, response?: string) => void;
};

const RequestContext = createContext<RequestContextType | undefined>(undefined);

export const useRequests = () => {
  const ctx = useContext(RequestContext);
  if (!ctx) throw new Error('useRequests must be used within a RequestProvider');
  return ctx;
};

export const RequestProvider = ({ children }: { children: React.ReactNode }) => {
  const [requests, setRequests] = useState<CustomRequest[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('panty_custom_requests');
      if (stored) setRequests(JSON.parse(stored));
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('panty_custom_requests', JSON.stringify(requests));
    }
  }, [requests]);

  const addRequest = (req: CustomRequest) => {
    setRequests((prev) => [...prev, req]);
  };

  const getRequestsForUser = (username: string, role: 'buyer' | 'seller') => {
    return requests.filter((r) => r[role] === username);
  };

  const respondToRequest = (id: string, status: RequestStatus, response?: string) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, status, response }
          : r
      )
    );
  };

  return (
    <RequestContext.Provider
      value={{
        requests,
        addRequest,
        getRequestsForUser,
        respondToRequest,
      }}
    >
      {children}
    </RequestContext.Provider>
  );
};
