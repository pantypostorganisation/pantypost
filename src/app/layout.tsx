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

// Base URL for canonical URLs
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://pantypost.com';

// SEO-Optimized Global Metadata
export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'Panty Post - Buy & Sell Used Panties Safely | Anonymous Marketplace',
    template: '%s | PantyPost'
  },
  description: 'The premier discreet marketplace to buy and sell used panties. Connect with verified sellers, secure payments, and complete anonymity. 21+ adult platform.',
  keywords: [
    'buy used panties',
    'sell used panties',
    'used panties marketplace',
    'worn panties online',
    'discreet panty selling',
    'anonymous used underwear sales',
    'verified panty sellers',
    'premium intimate apparel marketplace'
  ],
  authors: [{ name: 'PantyPost' }],
  creator: 'PantyPost',
  publisher: 'PantyPost',
  alternates: {
    canonical: '/',
    languages: {
      'en-US': '/',
      'en-GB': '/',
    },
  },
  
  // CRITICAL: Enable indexing for production (CHANGED FROM noindex)
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
  
  // Open Graph
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: BASE_URL,
    siteName: 'PantyPost',
    title: 'Panty Post - Buy & Sell Used Panties | Discreet Anonymous Marketplace',
    description: 'Safe, anonymous platform to buy and sell used panties. Verified sellers, secure transactions, complete privacy. 21+ only.',
    images: [
      {
        url: `${BASE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'PantyPost - Premium Used Panties Marketplace',
      },
    ],
  },
  
  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'Panty Post - Buy & Sell Used Panties Anonymously',
    description: 'Discreet marketplace for used panties. Verified sellers, secure payments, complete privacy.',
    images: [`${BASE_URL}/og-image.png`],
    creator: '@pantypost',
  },
  
  // Verification tags (add your codes after GSC setup)
  verification: {
    google: 'Gsm1a2UpYcIATRHoie3WTPlp416gBAxw2f5vqEPWNwY', // Google HTML tag verification code
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
    { media: '(prefers-color-scheme: dark)', color: '#000000' }
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
        
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        
        {/* Age restriction meta tag */}
        <meta name="rating" content="adult" />
        <meta name="age" content="21" />
        
        {/* Structured Data - Organization & WebSite */}
        <script
          type="application/ld+json"
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
                  urlTemplate: `${BASE_URL}/browse?search={search_term_string}`
                },
                'query-input': 'required name=search_term_string'
              },
              publisher: {
                '@type': 'Organization',
                name: 'PantyPost',
                url: BASE_URL,
                logo: `${BASE_URL}/logo.png`,
                sameAs: [
                  'https://twitter.com/pantypost',
                  'https://www.instagram.com/pantypost'
                ]
              }
            })
          }}
        />
      </head>
      <body className={inter.className}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}