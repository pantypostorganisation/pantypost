'use client';

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ListingProvider } from '@/context/ListingContext';
import { MessageProvider } from '@/context/MessageContext';
import { WalletProvider } from '@/context/WalletContext';
import { RequestProvider } from '@/context/RequestContext';
import { ReviewProvider } from '@/context/ReviewContext';
import { BanProvider } from '@/context/BanContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import Header from '@/components/Header';
import AgeVerificationModal from '@/components/AgeVerificationModal';
import BanCheck from '@/components/BanCheck';
import { Suspense } from 'react';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true
});

// Auth-specific error boundary
function AuthErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-400 mb-2">Authentication Error</h2>
          <p className="text-gray-400 mb-4">There was an issue with login/logout. Please try again.</p>
          <button 
            onClick={() => {
              // Clear any stored auth data and reload
              localStorage.clear();
              sessionStorage.clear();
              window.location.reload();
            }}
            className="bg-[#ff950e] text-black px-4 py-2 rounded-lg font-semibold hover:bg-[#ff6b00] transition-colors"
          >
            Reset & Reload
          </button>
        </div>
      </div>
    }>
      {children}
    </ErrorBoundary>
  );
}

// Loading component
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
  return (
    <html lang="en">
      <head>
        <title>PantyPost - Premium Adult Marketplace</title>
        <meta name="description" content="The premier marketplace for adult content and personalized experiences." />
        <meta name="keywords" content="adult marketplace, premium content, personalized experiences" />
        <meta name="robots" content="noindex, nofollow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#ff950e" />
        <link rel="preload" href="/logo.png" as="image" />
        <link rel="preload" href="/phone-mockup.png" as="image" />
      </head>
      <body className={`${inter.className} bg-black text-white min-h-screen antialiased`}>
        <ErrorBoundary fallback={
          <div className="min-h-screen bg-black text-white flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-red-400 mb-4">Application Error</h1>
              <p className="text-gray-400 mb-4">Something went wrong. Please refresh the page.</p>
              <button 
                onClick={() => window.location.reload()} 
                className="bg-[#ff950e] text-black px-4 py-2 rounded-lg font-semibold hover:bg-[#ff6b00] transition-colors"
              >
                Refresh Page
              </button>
            </div>
          </div>
        }>
          <Suspense fallback={<LoadingFallback />}>
            <AuthErrorBoundary>
              <AuthProvider>
                <ErrorBoundary fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center"><div>Wallet Error</div></div>}>
                  <WalletProvider>
                    <ErrorBoundary fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center"><div>Ban Check Error</div></div>}>
                      <BanProvider>
                        <ErrorBoundary fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center"><div>Listing Error</div></div>}>
                          <ListingProvider>
                            <ErrorBoundary fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center"><div>Message Error</div></div>}>
                              <MessageProvider>
                                <ErrorBoundary fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center"><div>Request Error</div></div>}>
                                  <RequestProvider>
                                    <ErrorBoundary fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center"><div>Review Error</div></div>}>
                                      <ReviewProvider>
                                        <BanCheck>
                                          <AgeVerificationModal />
                                          <Header />
                                          <main className="min-h-screen">
                                            {children}
                                          </main>
                                        </BanCheck>
                                      </ReviewProvider>
                                    </ErrorBoundary>
                                  </RequestProvider>
                                </ErrorBoundary>
                              </MessageProvider>
                            </ErrorBoundary>
                          </ListingProvider>
                        </ErrorBoundary>
                      </BanProvider>
                    </ErrorBoundary>
                  </WalletProvider>
                </ErrorBoundary>
              </AuthProvider>
            </AuthErrorBoundary>
          </Suspense>
        </ErrorBoundary>
      </body>
    </html>
  );
}

