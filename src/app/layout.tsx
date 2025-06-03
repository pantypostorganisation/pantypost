// src/app/layout.tsx
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
  display: 'swap', // ✅ ADDED: Better font loading performance
  preload: true
});

export const metadata: Metadata = {
  title: 'PantyPost - Premium Adult Marketplace',
  description: 'The premier marketplace for adult content and personalized experiences.',
  keywords: 'adult marketplace, premium content, personalized experiences',
  robots: 'noindex, nofollow',
  viewport: 'width=device-width, initial-scale=1', // ✅ ADDED: Mobile optimization
  themeColor: '#ff950e', // ✅ ADDED: Theme color for mobile browsers
};

// ✅ ADDED: Individual error boundaries for each provider
function ContextErrorBoundary({ children, contextName }: { children: React.ReactNode; contextName: string }) {
  return (
    <ErrorBoundary fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-400 mb-2">Context Error</h2>
          <p className="text-gray-400">Failed to load {contextName}. Please refresh the page.</p>
        </div>
      </div>
    }>
      {children}
    </ErrorBoundary>
  );
}

// ✅ ADDED: Loading component for better UX
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
        {/* ✅ ADDED: Preload critical resources */}
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
            <ContextErrorBoundary contextName="Authentication">
              <AuthProvider>
                <ContextErrorBoundary contextName="Wallet">
                  <WalletProvider>
                    <ContextErrorBoundary contextName="Ban System">
                      <BanProvider>
                        <ContextErrorBoundary contextName="Listings">
                          <ListingProvider>
                            <ContextErrorBoundary contextName="Messages">
                              <MessageProvider>
                                <ContextErrorBoundary contextName="Requests">
                                  <RequestProvider>
                                    <ContextErrorBoundary contextName="Reviews">
                                      <ReviewProvider>
                                        <BanCheck>
                                          <AgeVerificationModal />
                                          <Header />
                                          <main className="min-h-screen">
                                            {children}
                                          </main>
                                        </BanCheck>
                                      </ReviewProvider>
                                    </ContextErrorBoundary>
                                  </RequestProvider>
                                </ContextErrorBoundary>
                              </MessageProvider>
                            </ContextErrorBoundary>
                          </ListingProvider>
                        </ContextErrorBoundary>
                      </BanProvider>
                    </ContextErrorBoundary>
                  </WalletProvider>
                </ContextErrorBoundary>
              </AuthProvider>
            </ContextErrorBoundary>
          </Suspense>
        </ErrorBoundary>
      </body>
    </html>
  );
}
