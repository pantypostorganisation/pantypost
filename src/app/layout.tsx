// src/app/layout.tsx

import { Inter } from 'next/font/google';
import './globals.css';
import ClientLayout from './ClientLayout';
import type { Metadata, Viewport } from 'next';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true
});

// Metadata without viewport and themeColor
export const metadata: Metadata = {
  title: 'Panty Post - Premium Adult Marketplace',
  description: 'The premier marketplace for adult content and personalized experiences. Connect with verified sellers in a secure, private environment. 21+ only.',
  robots: 'noindex, nofollow',
};

// Separate viewport export with viewport-fit=cover for iOS safe areas
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#ff950e',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className={inter.className}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}