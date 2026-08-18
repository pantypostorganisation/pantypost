// src/app/privacy/page.tsx
//
// Server component. The interactive page lives in PrivacyClient.tsx and is
// rendered unchanged. Until this wrapper existed, this route was a
// client component with no metadata of its own -- so it served the
// generic homepage title AND inherited the root layout's canonical,
// which declared it a duplicate of the homepage. Google agreed, and
// declined to index it.

import type { Metadata } from 'next';
import PrivacyClient from './PrivacyClient';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'How PantyPost collects, uses and protects your data, and the choices you have about it.',
  alternates: { canonical: '/privacy' },
};

export default function Page() {
  return <PrivacyClient />;
}
