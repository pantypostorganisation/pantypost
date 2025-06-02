// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
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

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'PantyPost - Premium Adult Marketplace',
  description: 'The premier marketplace for adult content and personalized experiences.',
  keywords: 'adult marketplace, premium content, personalized experiences',
  robots: 'noindex, nofollow', // Prevent search engine indexing for adult content
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-black text-white min-h-screen`}>
        <ErrorBoundary>
          <WalletProvider>  {/* ✅ Move this FIRST */}
            <BanProvider>
              <ListingProvider>  {/* ✅ Now this can use useWallet */}
                <MessageProvider>
                  <RequestProvider>
                    <ReviewProvider>
                      <BanCheck>
                        <AgeVerificationModal />
                        <Header />
                        {children}
                      </BanCheck>
                    </ReviewProvider>
                  </RequestProvider>
                </MessageProvider>
              </ListingProvider>
            </BanProvider>
          </WalletProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
