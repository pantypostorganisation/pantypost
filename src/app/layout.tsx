// src/app/layout.tsx

'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';
import Header from '@/components/Header';
import AgeVerificationModal from '@/components/AgeVerificationModal';
import BanCheck from '@/components/BanCheck';
import MessageNotifications from '@/components/MessageNotifications';
import { MockApiDevTools } from '@/components/MockApiDevTools';
import { PWAInstall } from '@/components/PWAInstall';
import { Suspense, useState, useEffect } from 'react';

// Run environment validation (only in development and on server side)
if (process.env.NODE_ENV === 'development' && typeof window === 'undefined') {
  import('../lib/validateEnv');
}

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true
});

// Simple loading component
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff950e] mx-auto mb-4"></div>
        <p className="text-gray-400">Loading PantyPost...</p>
      </div>
    </div>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator && window.location.hostname !== 'localhost') {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(registration => console.log('SW registered:', registration))
          .catch(error => console.log('SW registration failed:', error));
      });
    }
  }, []);

  // Prevent SSR/hydration issues by only rendering after mount
  if (!mounted) {
    return (
      <html lang="en">
        <body className={inter.className}>
          <LoadingFallback />
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <head>
        <title>PantyPost - Premium Adult Marketplace | Verified Sellers</title>
        <meta name="description" content="The premier marketplace for adult content and personalized experiences. Connect with verified sellers in a secure, private environment. 21+ only." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#ff950e" />
        <meta name="robots" content="noindex, nofollow" />
        
        {/* PWA Manifest and Icons */}
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className={inter.className}>
        <Providers>
          <Suspense fallback={<LoadingFallback />}>
            <div className="min-h-screen bg-black text-white">
              <BanCheck>
                <Header />
                <main className="flex-grow">
                  {children}
                </main>
                <AgeVerificationModal />
                <MessageNotifications />
              </BanCheck>
            </div>
          </Suspense>
          {/* PWA Install Prompt */}
          <PWAInstall />
          {/* Mock API Dev Tools - Outside BanCheck so it's always accessible during development */}
          <MockApiDevTools />
        </Providers>
      </body>
    </html>
  );
}