// src/components/buyers/messages/EmptyState.tsx
'use client';

import React from 'react';
import { MessageSquare, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function EmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center bg-[#121212] p-8">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-[#222] rounded-full flex items-center justify-center mx-auto mb-4">
          <MessageSquare className="w-10 h-10 text-[#ff950e]" />
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-2">Start a Conversation</h2>
        
        <p className="text-gray-400 mb-6">
          Connect with verified sellers to find exactly what you're looking for. 
          Browse listings and message sellers directly.
        </p>
        
        <Link
          href="/browse"
          className="inline-flex items-center gap-2 bg-[#ff950e] text-black px-6 py-3 rounded-lg font-medium hover:bg-[#e88800] transition-colors"
        >
          Browse Listings
          <ArrowRight size={18} />
        </Link>
        
        <div className="mt-8 text-sm text-gray-500">
          <p className="mb-2">💡 Pro Tips:</p>
          <ul className="text-left space-y-1">
            <li>• Be respectful and clear in your messages</li>
            <li>• Use custom requests for specific items</li>
            <li>• Check seller profiles for verification status</li>
            <li>• Read seller reviews before purchasing</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
