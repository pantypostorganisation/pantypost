// src/app/offline/page.tsx

import { WifiOff, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <WifiOff className="h-20 w-20 text-gray-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">
            You're Offline
          </h1>
          <p className="text-gray-400">
            It looks like you've lost your internet connection. Please check
            your connection and try again.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full flex items-center justify-center gap-2 bg-[#ff950e] text-black px-6 py-3 rounded-lg font-semibold hover:bg-[#ff8c00] transition-colors"
          >
            <RefreshCw className="h-5 w-5" />
            Try Again
          </button>

          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
          >
            <Home className="h-5 w-5" />
            Go to Homepage
          </Link>
        </div>

        <div className="mt-8 p-4 bg-gray-900 rounded-lg">
          <h2 className="text-sm font-semibold text-white mb-2">
            While offline, you can:
          </h2>
          <ul className="text-sm text-gray-400 space-y-1 text-left">
            <li>• View previously cached pages</li>
            <li>• Access your saved products</li>
            <li>• Read messages you've already loaded</li>
          </ul>
        </div>
      </div>
    </div>
  );
}