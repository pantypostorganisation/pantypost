// src/components/seller-verification/VerificationBenefits.tsx
'use client';

import { sanitizeStrict } from '@/utils/security/sanitization';

interface BenefitCardProps {
  imageSrc: string;
  imageAlt: string;
  title: string;
  description: string;
}

function BenefitCard({ imageSrc, imageAlt, title, description }: BenefitCardProps) {
  const safeAlt = sanitizeStrict(imageAlt);
  const safeTitle = sanitizeStrict(title);
  const safeDesc = sanitizeStrict(description);

  return (
    <div className="bg-[#1a1a1a] p-4 rounded-lg border border-gray-800 flex flex-col items-center">
      <img src={imageSrc} alt={safeAlt} className="w-7 h-7 object-contain mb-3" />
      <h3 className="font-medium mb-1">{safeTitle}</h3>
      <p className="text-gray-400 text-xs text-center">{safeDesc}</p>
    </div>
  );
}

export default function VerificationBenefits() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
      <BenefitCard
        imageSrc="/verification_badge.png"
        imageAlt="Verification Badge"
        title="Verified Badge"
        description="Display a verified badge on your profile and listings"
      />
      <BenefitCard
        imageSrc="/more_listings_icon.png"
        imageAlt="More Listings"
        title="More Listings"
        description="Post up to 25 listings (unverified sellers can post only 2)"
      />
      <BenefitCard
        imageSrc="/more_sales_icon.png"
        imageAlt="More Sales"
        title="More Sales"
        description="Verified sellers typically get more sales due to higher trust"
      />
    </div>
  );
}
