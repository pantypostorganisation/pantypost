// src/app/layout.tsx
// Keep this as a client component for now since your entire app is client-side
'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import EnhancedProviders from '@/components/Providers.enhanced';
import Header from '@/components/Header';
import AgeVerificationModal from '@/components/AgeVerificationModal';
import BanCheck from '@/components/BanCheck';
import MessageNotifications from '@/components/MessageNotifications';
import { Suspense, useState, useEffect } from 'react';

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
      </head>
      <body className={inter.className}>
        <EnhancedProviders>
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
        </EnhancedProviders>
      </body>
    </html>
  );
}
