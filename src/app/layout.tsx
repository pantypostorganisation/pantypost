// src/app/layout.tsx
import { Inter } from 'next/font/google';
import './globals.css';
import ClientLayout from './ClientLayout';
import type { Metadata, Viewport } from 'next';

// The `variable` option exposes Inter as a CSS custom property, which
// globals.css consumes as --font-sans. Without it, the stylesheet fell
// back to Arial and overrode the font entirely — Inter was downloaded
// on every page load and then discarded.
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-inter',
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
    'Panty Post - The premier discreet marketplace to buy and sell used panties. Connect with verified sellers, secure payments, and complete anonymity. 18+ adult platform.',
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

  /* ICONS -- declared ONCE, here.
   *
   * This used to declare them twice: this block AND a set of
   * hand-written <link rel="icon"> tags in <head> below. Next generates
   * link tags from this metadata, so the manual ones were duplicates,
   * and the two could disagree.
   *
   * It also pointed every entry at /favicon.ico while CLAIMING sizes of
   * 256, 48, 32 and 16 -- one 32px file described four different ways.
   * Google reads those size attributes: it looked for a 48 or a 256,
   * found neither, and fell back to a 32px image scaled up. That is why
   * the search result looked poor no matter what was in
   * src/app/icon.png, which these declarations were overriding anyway.
   *
   * Now each entry points at a real file at its real size. PNG, because
   * Google requires a square icon at least 48x48 (ideally a multiple of
   * 48) and iOS will not reliably render .ico for a home-screen icon.
   *
   * favicon.ico is kept for older browsers only, where it is genuinely
   * the right format. */
  icons: {
    icon: [
      { url: '/icons/icon-512x512.png', type: 'image/png', sizes: '512x512' },
      { url: '/icons/icon-192x192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icons/icon-96x96.png', type: 'image/png', sizes: '96x96' },
      { url: '/favicon.ico', type: 'image/x-icon', sizes: '32x32' },
    ],
    shortcut: ['/favicon.ico'],
    apple: [{ url: '/icons/icon-192x192.png', type: 'image/png', sizes: '180x180' }],
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
      'Safe, anonymous platform to buy and sell used panties. Verified sellers, secure transactions, complete privacy. 18+ only.',
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
  classification: 'Adult Content - 18+',
};

// Separate viewport export with viewport-fit=cover for iOS safe areas
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  /* The mobile keyboard problem.

     By default a browser shrinks only the *visual* viewport when the
     on-screen keyboard opens — the layout viewport, which is what dvh and
     position:fixed measure against, stays full height. So a chat composer
     pinned to the bottom of the screen ends up underneath the keyboard.

     'resizes-content' shrinks the layout viewport too, so dvh recalculates
     and the composer sits directly above the keyboard. Chrome 108+ and
     Firefox 132+ honour it; Safari ignores it for now, which is why the
     transcript is a normal flex child rather than position:fixed — Safari
     then scrolls the focused input into view by itself. */
  interactiveWidget: 'resizes-content',
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
    <html lang="en" className={inter.variable}>
      <head>
        {/* NOTE: no hand-written <meta name="viewport"> here.
            Next generates it from the `viewport` export above; a manual tag
            duplicates it and silently drops whatever the export sets —
            including interactive-widget. */}

        {/* NOTE: no hand-written <link rel="icon"> tags here.
            Next generates them from the `icons` block in the metadata
            export above. Writing them by hand as well produced two sets
            of declarations pointing at different files with different
            claimed sizes -- which is what made the favicon unpredictable.
            Change icons in ONE place: the metadata export. */}

        <link rel="manifest" href="/manifest.json" />

        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Age restriction meta tags */}
        <meta name="rating" content="adult" />
        <meta name="age" content="18" />
        {/* RTA label — recognised by parental filtering software. */}
        <meta name="RATING" content="RTA-5042-1996-1400-1577-RTA" />

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
                // Google reads this for the knowledge panel; it wants a
                // real image, not a 32px .ico.
                logo: `${BASE_URL}/icons/icon-512x512.png`,
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
