// src/app/terms/page.tsx
//
// Server component. The interactive page lives in TermsClient.tsx and is
// rendered unchanged. Until this wrapper existed, this route was a
// client component with no metadata of its own -- so it served the
// generic homepage title AND inherited the root layout's canonical,
// which declared it a duplicate of the homepage. Google agreed, and
// declined to index it.

import type { Metadata } from 'next';
import TermsClient from './TermsClient';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'The terms that govern buying and selling on PantyPost, including eligibility, payments, and acceptable use.',
  alternates: { canonical: '/terms' },
};

export default function Page() {
  return <TermsClient />;
}
