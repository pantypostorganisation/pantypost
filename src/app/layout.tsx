// src/app/layout.tsx
import { Inter } from 'next/font/google';
import './globals.css';
import ClientLayout from './ClientLayout';
import type { Metadata, Viewport } from 'next';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
});

// Base URL for canonical URLs
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://pantypost.com';

// SEO-Optimized Global Metadata
export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'Panty Post - Buy & Sell Used Panties Safely | Anonymous Marketplace',
    template: '%s | PantyPost',
  },
  description:
    'Panty Post - The premier discreet marketplace to buy and sell used panties. Connect with verified sellers, secure payments, and complete anonymity. 21+ adult platform.',
  keywords: [
    'buy used panties',
    'sell used panties',
    'used panties marketplace',
    'worn panties online',
    'discreet panty selling',
    'anonymous used underwear sales',
    'verified panty sellers',
    'premium intimate apparel marketplace',
  ],
  authors: [{ name: 'PantyPost' }],
  creator: 'PantyPost',
  publisher: 'PantyPost',

  // FAVICON CONFIGURATION - PNG for Google Search, ICO for browser fallback
  icons: {
    icon: [
      // PNG first - Google Search prefers PNG format, must be 48px+ 
      { url: '/favicon.png', type: 'image/png', sizes: '48x48' },
      { url: '/favicon.png', type: 'image/png', sizes: '32x32' },
      { url: '/favicon.png', type: 'image/png', sizes: '16x16' },
      // ICO fallback for older browsers
      { url: '/favicon.ico', type: 'image/x-icon', sizes: 'any' },
    ],
    shortcut: ['/favicon.png'],
    apple: [
      { url: '/favicon.png', sizes: '180x180', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192' },
    ],
    other: [
      {
        rel: 'icon',
        url: '/favicon.png',
        type: 'image/png',
      },
    ],
  },

  alternates: {
    canonical: '/',
    languages: {
      'en-US': '/',
      'en-GB': '/',
    },
  },

  // CRITICAL: Enable indexing for production
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // Open Graph - Using googlesearchimage.png for social sharing
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: BASE_URL,
    siteName: 'PantyPost',
    title: 'Panty Post - Buy & Sell Used Panties | Discreet Anonymous Marketplace',
    description:
      'Safe, anonymous platform to buy and sell used panties. Verified sellers, secure transactions, complete privacy. 21+ only.',
    images: [
      {
        url: `${BASE_URL}/googlesearchimage.png`,
        width: 512,
        height: 512,
        alt: 'PantyPost - Premium Used Panties Marketplace',
      },
    ],
  },

  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'Panty Post - Buy & Sell Used Panties Anonymously',
    description: 'Discreet marketplace for used panties. Verified sellers, secure payments, complete privacy.',
    images: [`${BASE_URL}/googlesearchimage.png`],
    creator: '@pantypost',
  },

  // Verification tags
  verification: {
    google: 'Gsm1a2UpYcIATRHoie3WTPlp416gBAxw2f5vqEPWNwY',
  },

  // Additional meta tags
  category: 'adult marketplace',
  classification: 'Adult Content - 21+',
};

// Separate viewport export with viewport-fit=cover for iOS safe areas
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ff950e' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
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

        {/* PWA tags */}
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />

        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* 
          FAVICON - Google Search requires:
          1. PNG format (preferred over ICO)
          2. At least 48x48 pixels
          3. Stable URL (avoid frequent version changes once indexed)
        */}
        <link rel="icon" href="/favicon.png" type="image/png" sizes="48x48" />
        <link rel="icon" href="/favicon.png" type="image/png" sizes="32x32" />
        <link rel="icon" href="/favicon.png" type="image/png" sizes="16x16" />
        <link rel="shortcut icon" href="/favicon.png" type="image/png" />
        {/* ICO fallback for older browsers */}
        <link rel="icon" href="/favicon.ico" sizes="any" />

        {/* Age restriction meta tag */}
        <meta name="rating" content="adult" />
        <meta name="age" content="21" />

        {/* Structured Data */}
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'PantyPost',
              url: BASE_URL,
              description: 'Premier marketplace for buying and selling used panties anonymously',
              potentialAction: {
                '@type': 'SearchAction',
                target: {
                  '@type': 'EntryPoint',
                  urlTemplate: `${BASE_URL}/browse?search={search_term_string}`,
                },
                'query-input': 'required name=search_term_string',
              },
              publisher: {
                '@type': 'Organization',
                name: 'PantyPost',
                url: BASE_URL,
                logo: `${BASE_URL}/favicon.png`,
                sameAs: ['https://twitter.com/pantypost', 'https://www.instagram.com/pantypost'],
              },
            }),
          }}
        />
      </head>
      <body className={inter.className}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
