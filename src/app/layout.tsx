'use client';

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

// Simple error fallback
function SimpleErrorFallback({ error, reset }: { error?: Error; reset?: () => void }) {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-bold text-red-400 mb-2">Something went wrong</h2>
        <p className="text-gray-400 mb-4">Please try refreshing the page</p>
        <button 
          onClick={() => {
            if (typeof window !== 'undefined') {
              localStorage.clear();
              sessionStorage.clear();
              window.location.reload();
            }
          }}
          className="bg-[#ff950e] text-black px-4 py-2 rounded-lg font-semibold hover:bg-[#ff6b00] transition-colors"
        >
          Reset & Reload
        </button>
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
        {/* Essential meta tags */}
        <title>PantyPost - Premium Adult Marketplace | Verified Sellers</title>
        <meta name="description" content="The premier marketplace for adult content and personalized experiences. Connect with verified sellers in a secure, private environment. 21+ only." />
        <meta name="keywords" content="adult marketplace, premium content, verified sellers, secure platform, private messaging, subscription service" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#ff950e" />
        <meta name="robots" content="noindex, nofollow" />
        <meta name="rating" content="adult" />
        <meta name="content-rating" content="mature" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="PantyPost - Premium Adult Marketplace" />
        <meta property="og:description" content="The premier marketplace for adult content and personalized experiences." />
        <meta property="og:image" content="/logo.png" />
        <meta property="og:site_name" content="PantyPost" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="PantyPost - Premium Adult Marketplace" />
        <meta name="twitter:description" content="The premier marketplace for adult content and personalized experiences." />
        <meta name="twitter:image" content="/logo.png" />
        
        {/* Performance hints */}
        <link rel="preload" href="/logo.png" as="image" />
        <link rel="preload" href="/phone-mockup.png" as="image" />
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        
        {/* PWA meta tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        
        {/* Canonical URL */}
        <link rel="canonical" href="https://pantypost.com" />
        
        {/* Structured data for the website */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "PantyPost",
              "description": "The premier marketplace for adult content and personalized experiences",
              "url": "https://pantypost.com",
              "potentialAction": {
                "@type": "SearchAction",
                "target": {
                  "@type": "EntryPoint",
                  "urlTemplate": "https://pantypost.com/browse?q={search_term_string}"
                },
                "query-input": "required name=search_term_string"
              },
              "audience": {
                "@type": "Audience",
                "audienceType": "Adult"
              }
            })
          }}
        />
      </head>
      <body className={`${inter.className} bg-black text-white min-h-screen antialiased`}>
        <ErrorBoundary fallback={<SimpleErrorFallback />}>
          <Suspense fallback={<LoadingFallback />}>
            <AuthProvider>
              <WalletProvider>
                <BanProvider>
                  <ListingProvider>
                    <MessageProvider>
                      <RequestProvider>
                        <ReviewProvider>
                          <ErrorBoundary fallback={<SimpleErrorFallback />}>
                            <BanCheck>
                              <ErrorBoundary fallback={<SimpleErrorFallback />}>
                                <AgeVerificationModal />
                                <Header />
                                {/* Removed main wrapper to prevent nesting issues */}
                                {children}
                              </ErrorBoundary>
                            </BanCheck>
                          </ErrorBoundary>
                        </ReviewProvider>
                      </RequestProvider>
                    </MessageProvider>
                  </ListingProvider>
                </BanProvider>
              </WalletProvider>
            </AuthProvider>
          </Suspense>
        </ErrorBoundary>
      </body>
    </html>
  );
}
