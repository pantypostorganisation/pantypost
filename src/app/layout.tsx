// src/app/layout.tsx
// NO 'use client' here!

import { Inter } from 'next/font/google';
import './globals.css';
import ClientLayout from './ClientLayout';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true
});

export const metadata = {
  title: 'PantyPost - Premium Adult Marketplace | Verified Sellers',
  description: 'The premier marketplace for adult content and personalized experiences. Connect with verified sellers in a secure, private environment. 21+ only.',
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#ff950e',
  robots: 'noindex, nofollow',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className={inter.className}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}