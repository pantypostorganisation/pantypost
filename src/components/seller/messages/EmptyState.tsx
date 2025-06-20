// src/components/sellers/messages/EmptyState.tsx
'use client';

import React from 'react';
import { MessageCircle } from 'lucide-react';

export default function EmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center text-gray-400">
      <div className="text-center p-4">
        <div className="flex justify-center mb-4">
          <MessageCircle size={64} className="text-gray-600" />
        </div>
        <p className="text-xl mb-2">Select a conversation to view messages</p>
        <p className="text-sm">Your messages will appear here</p>
      </div>
    </div>
  );
}