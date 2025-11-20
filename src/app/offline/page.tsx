// src/app/offline/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { WifiOff, RefreshCw, Home, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : false
  );
  const [justCameOnline, setJustCameOnline] = useState(false);

  // Reload handler (kept simple and resilient)
  const handleReload = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }, []);

  // When we come back online, flash a status and redirect shortly
  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
      setJustCameOnline(true);

      // After a short pause, try to take the user back where they were.
      const timer = setTimeout(() => {
        // Prefer going back if there’s history
        if (typeof window !== 'undefined') {
          if (window.history.length > 1) {
            window.history.back();
          } else {
            window.location.replace('/');
          }
        }
      }, 1200);

      return () => clearTimeout(timer);
    }

    function handleOffline() {
      setIsOnline(false);
      setJustCameOnline(false);
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        {/* Online status banner */}
        {justCameOnline && (
          <div
            className="mb-4 inline-flex items-center gap-2 px-3 py-2 rounded-md bg-green-900/20 border border-green-700/30 text-green-400 text-sm"
            role="status"
            aria-live="polite"
          >
            <CheckCircle2 className="h-4 w-4" />
            Back online! Redirecting…
          </div>
        )}

        {/* Main icon & heading */}
        <div className="mb-8">
          <WifiOff className="h-20 w-20 text-gray-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">You&apos;re Offline</h1>
          <p className="text-gray-400">
            It looks like you&apos;ve lost your internet connection. Please check your
            connection and try again.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleReload}
            className="w-full flex items-center justify-center gap-2 bg-[#ff950e] text-black px-6 py-3 rounded-lg font-semibold hover:bg-[#ff8c00] transition-colors disabled:opacity-70"
            aria-disabled={false}
          >
            <RefreshCw className="h-5 w-5" />
            Try Again
          </button>

          <Link
            href="/"
            prefetch={false}
            className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
          >
            <Home className="h-5 w-5" />
            Go to Homepage
          </Link>
        </div>

        {/* Tips */}
        <div className="mt-8 p-4 bg-gray-900 rounded-lg">
          <h2 className="text-sm font-semibold text-white mb-2">While offline, you can:</h2>
          <ul className="text-sm text-gray-400 space-y-1 text-left">
            <li>• View previously cached pages</li>
            <li>• Access your saved products</li>
            <li>• Read messages you&apos;ve already loaded</li>
          </ul>
        </div>

        {/* Connection state hint */}
        <p className="mt-4 text-xs text-gray-600" aria-live="polite">
          Status: {isOnline ? 'Online (redirecting…)' : 'Offline'}
        </p>
      </div>
    </div>
  );
}
