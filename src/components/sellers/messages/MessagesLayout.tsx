// src/components/sellers/messages/MessagesLayout.tsx
'use client';

import React from 'react';
import ThreadsSidebar from './ThreadsSidebar';

interface MessagesLayoutProps {
  children: React.ReactNode;
  isAdmin: boolean;
}

export default function MessagesLayout({ children, isAdmin }: MessagesLayoutProps) {
  return (
    <div className="flex-1 flex flex-col md:flex-row max-w-6xl mx-auto w-full bg-[#121212] rounded-lg shadow-lg overflow-hidden">
      {/* Left column - Message threads */}
      <ThreadsSidebar isAdmin={isAdmin} />
      
      {/* Right column - Active conversation or empty state */}
      <div className="w-full md:w-2/3 flex flex-col bg-[#121212]">
        {children}
      </div>
    </div>
  );
}