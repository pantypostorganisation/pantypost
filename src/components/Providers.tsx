'use client';

import { Suspense } from 'react';
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
import MessageNotifications from '@/components/MessageNotifications';

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

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BanProvider>
          <WalletProvider>
            <MessageProvider>
              <RequestProvider>
                <ListingProvider>
                  <ReviewProvider>
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
                  </ReviewProvider>
                </ListingProvider>
              </RequestProvider>
            </MessageProvider>
          </WalletProvider>
        </BanProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}