// src/app/complaints/page.tsx
//
// Server component. The interactive page lives in ComplaintsClient.tsx and is
// rendered unchanged. Until this wrapper existed, this route was a
// client component with no metadata of its own -- so it served the
// generic homepage title AND inherited the root layout's canonical,
// which declared it a duplicate of the homepage. Google agreed, and
// declined to index it.

import type { Metadata } from 'next';
import ComplaintsClient from './ComplaintsClient';

export const metadata: Metadata = {
  title: 'Complaints & Content Removal',
  description:
    'Report a listing, image or user, or request content removal. Every complaint is answered within five business days.',
  alternates: { canonical: '/complaints' },
};

export default function Page() {
  return <ComplaintsClient />;
}
