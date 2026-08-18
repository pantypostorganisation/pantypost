// src/app/page.tsx
//
// Server component. The interactive homepage lives in HomeClient.tsx and
// is rendered unchanged; this wrapper exists for exactly two reasons:
//
// 1. A canonical URL. The root layout used to declare `canonical: '/'`
//    for the whole site (removed -- see the comment there); the homepage
//    is the ONE page whose canonical really is '/', and now it is the
//    only page that says so.
//
// 2. Structured data in the server HTML. The schemas used to be built in
//    the client component and injected with next/script, which also let
//    a fabricated aggregateRating (4.8 stars, "10,000 reviews") live
//    here unnoticed. That block is gone -- fake review markup is a
//    Google spam-policy violation and a false claim in front of a
//    payment processor. The FAQPage schema below is generated from
//    HOMEPAGE_FAQ, the same array FAQSection renders on screen, so the
//    markup can never disagree with the visible page.

import type { Metadata } from 'next';
import HomeClient from './HomeClient';
import { HOMEPAGE_FAQ } from '@/utils/homepage-constants';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://pantypost.com';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

export default function Home() {
  const marketplaceSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Panty Post - Buy & Sell Used Panties Marketplace',
    description:
      'Discreet marketplace to buy and sell worn underwear. Every listing is reviewed before it goes live.',
    url: BASE_URL,
    mainEntity: {
      '@type': 'OnlineMarketplace',
      name: 'PantyPost',
      description:
        'Marketplace for buying and selling worn underwear, with identity-verified sellers and pre-publication review of every listing.',
      url: BASE_URL,
      potentialAction: [
        {
          '@type': 'BuyAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${BASE_URL}/browse`,
            actionPlatform: [
              'http://schema.org/DesktopWebPlatform',
              'http://schema.org/MobileWebPlatform',
            ],
          },
        },
        {
          '@type': 'SellAction',
          target: {
            '@type': 'EntryPoint',
            /* Was /login -- the same wrong target the homepage's visible
               Create Account button once had. Someone deciding to sell
               has no account to log in to. */
            urlTemplate: `${BASE_URL}/signup`,
            actionPlatform: [
              'http://schema.org/DesktopWebPlatform',
              'http://schema.org/MobileWebPlatform',
            ],
          },
        },
      ],
    },
  } as const;

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: HOMEPAGE_FAQ.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(marketplaceSchema).replace(/</g, '\\u003c'),
        }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema).replace(/</g, '\\u003c'),
        }}
      />
      <HomeClient />
    </>
  );
}
