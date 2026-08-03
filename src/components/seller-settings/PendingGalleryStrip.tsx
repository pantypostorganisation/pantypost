// src/components/seller-settings/PendingGalleryStrip.tsx
'use client';

import { Clock3, X } from 'lucide-react';

interface PendingEntry {
  id: string;
  url: string;
  submittedAt?: string;
}

interface PendingGalleryStripProps {
  images: PendingEntry[];
  onWithdraw: (id: string) => void;
}

/**
 * Gallery images sitting in the moderation queue.
 *
 * Kept separate from the approved gallery on purpose: the two are
 * deleted through different endpoints (approved by index, queued by
 * subdocument id), and merging them risks removing the wrong image.
 * Showing them at all is the point — a seller who cannot see their own
 * queued uploads reasonably concludes the upload failed.
 */
export default function PendingGalleryStrip({ images, onWithdraw }: PendingGalleryStripProps) {
  if (images.length === 0) return null;

  return (
    <section className="rounded-lg border border-line bg-surface-raised p-5">
      <div className="mb-3 flex items-center gap-2">
        <Clock3 className="h-4 w-4 text-warning" />
        <h2 className="text-sm font-medium text-ink">
          {images.length} {images.length === 1 ? 'image' : 'images'} awaiting review
        </h2>
      </div>

      <p className="mb-4 text-xs text-ink-muted">
        These have uploaded successfully and are queued for moderation. They appear on your
        shop page once approved. You can withdraw any of them before then.
      </p>

      <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
        {images.map((image) => (
          <li key={image.id} className="relative">
            <div className="aspect-square overflow-hidden rounded-md border border-line bg-surface-overlay">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.url}
                alt="Awaiting review"
                className="h-full w-full object-cover opacity-70"
              />
            </div>
            <button
              type="button"
              onClick={() => onWithdraw(image.id)}
              aria-label="Withdraw this image"
              title="Withdraw this image"
              className="absolute -right-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full border border-line bg-surface-overlay text-ink-muted transition-colors hover:border-danger hover:text-danger"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
