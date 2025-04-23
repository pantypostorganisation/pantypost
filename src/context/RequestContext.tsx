'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type RequestStatus = 'pending' | 'accepted' | 'declined';

export type CustomRequest = {
  id: string;
  buyer: string;
  seller: string;
  title: string;
  description: string;
  price: number;
  tags?: string[];
  status: RequestStatus;
  response?: string;
  date: string;
};

type RequestContextType = {
  requests: CustomRequest[];
  addRequest: (request: CustomRequest) => void;
  respondToRequest: (id: string, status: RequestStatus, response?: string) => void;
  getRequestsForUser: (username: string, role: 'buyer' | 'seller') => CustomRequest[];
};

const RequestContext = createContext<RequestContextType | undefined>(undefined);

export const RequestProvider = ({ children }: { children: ReactNode }) => {
  const [requests, setRequests] = useState<CustomRequest[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('custom_requests');
    if (stored) setRequests(JSON.parse(stored));
  }, []);

  useEffect(() => {
    localStorage.setItem('custom_requests', JSON.stringify(requests));
  }, [requests]);

  const addRequest = (request: CustomRequest) => {
    setRequests((prev) => [...prev, request]);
  };

  const respondToRequest = (id: string, status: RequestStatus, response?: string) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status, response: response || '' } : r
      )
    );
  };

  const getRequestsForUser = (username: string, role: 'buyer' | 'seller') => {
    return requests.filter((r) =>
      role === 'buyer' ? r.buyer === username : r.seller === username
    );
  };

  return (
    <RequestContext.Provider
      value={{ requests, addRequest, respondToRequest, getRequestsForUser }}
    >
      {children}
    </RequestContext.Provider>
  );
};

export const useRequests = () => {
  const context = useContext(RequestContext);
  if (!context) throw new Error('useRequests must be used within a RequestProvider');
  return context;
};
