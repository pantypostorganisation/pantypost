// src/app/error.tsx

'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Page error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <AlertTriangle className="h-20 w-20 text-red-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">
            Something went wrong!
          </h1>
          <p className="text-gray-400">
            We're sorry, but something unexpected happened. Please try again or contact support if the problem persists.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={reset}
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

        {error.digest && (
          <p className="mt-8 text-xs text-gray-600">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}