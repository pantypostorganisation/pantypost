// src/components/browse-detail/TrustBadges.tsx
'use client';

import { Shield, Package, BadgeCheck } from 'lucide-react';
import { TrustBadgesProps } from '@/types/browseDetail';

/* Icons were previously green, blue and purple — three unrelated hues
   for three items of equal weight. One muted treatment reads as a set.

   Wording is kept short here because the substantive versions of these
   assurances appear directly beneath the purchase button, where they
   actually influence the decision. */
const BADGES = [
  { icon: Shield, label: 'Secure payment' },
  { icon: Package, label: 'Discreet delivery' },
  { icon: BadgeCheck, label: 'ID-verified sellers' },
];

export default function TrustBadges({}: TrustBadgesProps) {
  return (
    <div className="grid grid-cols-3 gap-3 border-t border-line pt-4">
      {BADGES.map(({ icon: Icon, label }) => (
        <div key={label} className="flex flex-col items-center gap-1.5 text-center">
          <Icon className="h-4 w-4 text-ink-faint" />
          <p className="text-xs text-ink-muted">{label}</p>
        </div>
      ))}
    </div>
  );
}
