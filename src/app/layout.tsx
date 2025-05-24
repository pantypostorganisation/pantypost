// src/app/layout.tsx
'use client';

import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Header from '../components/Header';
import AgeVerificationModal from '../components/AgeVerificationModal';
import { ListingProvider } from '../context/ListingContext';
import { WalletProvider } from '../context/WalletContext';
import { MessageProvider } from '../context/MessageContext';
import { ReviewProvider } from '../context/ReviewContext';
import { RequestProvider } from '../context/RequestContext';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { usePathname } from 'next/navigation'; // Add this import

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname(); // Add this hook
  
  // Check if we're on auth pages
  const isAuthPage = pathname === '/login' || pathname === '/signup';

  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary>
          <WalletProvider>
            <MessageProvider>
              <ReviewProvider>
                <RequestProvider>
                  <ListingProvider>
                    {!isAuthPage && <Header />} {/* Conditionally render Header */}
                    <AgeVerificationModal />
                    {children}
                  </ListingProvider>
                </RequestProvider>
              </ReviewProvider>
            </MessageProvider>
          </WalletProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
