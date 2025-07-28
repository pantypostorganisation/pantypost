// src/app/not-found.tsx
'use client'; // Add this to fix the onClick error

import Link from 'next/link';
import { Home, Search, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        {/* 404 Animation */}
        <div className="mb-8 relative">
          <div className="text-[120px] font-bold text-gray-800 select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-6xl animate-pulse text-[#ff950e]">
              💔
            </div>
          </div>
        </div>

        {/* Error Message */}
        <h1 className="text-3xl font-bold text-white mb-4">
          Oops! Page Not Found
        </h1>
        <p className="text-gray-400 mb-8">
          The page you're looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2 bg-[#ff950e] text-black px-6 py-3 rounded-lg font-semibold hover:bg-[#ff8c00] transition-colors"
          >
            <Home className="h-5 w-5" />
            Go to Homepage
          </Link>

          <Link
            href="/browse"
            className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
          >
            <Search className="h-5 w-5" />
            Browse Products
          </Link>

          <button
            onClick={() => window.history.back()}
            className="w-full flex items-center justify-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}