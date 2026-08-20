// src/app/explore/page.tsx
//
// Server component. The feed lives in ExploreClient.tsx, rendered
// unchanged. This wrapper exists so /explore stops serving the generic
// homepage title, gets its own canonical, and carries the adult-rating
// tags -- the feed shows seller-posted imagery, which makes it an
// explicit surface like /browse, and those tags belong on explicit
// surfaces only (see src/app/layout.tsx for the history).

import type { Metadata } from 'next';
import ExploreClient from './ExploreClient';

export const metadata: Metadata = {
  title: 'Explore - Seller Posts & Updates',
  description:
    'The Panty Post feed: posts, photos and updates from verified sellers. Follow your favourites and never miss a drop.',
  alternates: { canonical: '/explore' },
  other: {
    rating: 'adult',
    RATING: 'RTA-5042-1996-1400-1577-RTA',
  },
};

export default function ExplorePage() {
  return <ExploreClient />;
}
