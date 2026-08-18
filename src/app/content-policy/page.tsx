// src/app/content-policy/page.tsx
//
// Server component. The interactive page lives in ContentPolicyClient.tsx and is
// rendered unchanged. Until this wrapper existed, this route was a
// client component with no metadata of its own -- so it served the
// generic homepage title AND inherited the root layout's canonical,
// which declared it a duplicate of the homepage. Google agreed, and
// declined to index it.

import type { Metadata } from 'next';
import ContentPolicyClient from './ContentPolicyClient';

export const metadata: Metadata = {
  title: 'Content Policy',
  description:
    'What can and cannot be listed on PantyPost, and how every listing, photo and profile is reviewed by a moderator before it goes live.',
  alternates: { canonical: '/content-policy' },
};

export default function Page() {
  return <ContentPolicyClient />;
}
