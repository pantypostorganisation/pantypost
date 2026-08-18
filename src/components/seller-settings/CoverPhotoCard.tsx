// src/components/seller-settings/CoverPhotoCard.tsx
'use client';

import { RefObject } from 'react';
import { ImagePlus, Loader2, Clock3, Trash2 } from 'lucide-react';

interface CoverPhotoCardProps {
  coverPhoto: string | null;
  /** True when the shown banner is queued rather than live. */
  isPending: boolean;
  isUploading: boolean;
  error?: string;
  inputRef: RefObject<HTMLInputElement | null>;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
}

/**
 * Cover photos go through the same pre-publication review as profile
 * pictures and gallery images — uploading queues the banner, it does not
 * publish it. The card says so plainly rather than letting a seller
 * assume buyers can already see it.
 */
export default function CoverPhotoCard({
  coverPhoto,
  isPending,
  isUploading,
  error,
  inputRef,
  onChange,
  onRemove,
}: CoverPhotoCardProps) {
  const openPicker = () => inputRef.current?.click();

  return (
    <section className="rounded-lg border border-line bg-surface-raised p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium text-ink">Cover photo</h2>
          <p className="mt-1 text-xs text-ink-muted">
            The banner across the top of your shop page. Wide images work best — around
            1600×540. Max 8MB.
          </p>
        </div>

        {isPending && (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-warning-soft bg-warning-soft px-3 py-1 text-xs font-medium text-warning">
            <Clock3 className="h-3.5 w-3.5" />
            Awaiting review
          </span>
        )}
      </div>

      {/* 3:1 preview — the same proportion the shop header renders, so
          what a seller sees here is what buyers will get. */}
      <div className="relative aspect-[3/1] w-full overflow-hidden rounded-md border border-line bg-surface-overlay">
        {coverPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverPhoto}
            alt="Cover photo preview"
            className="h-full w-full object-cover"
          />
        ) : (
          <button
            type="button"
            onClick={openPicker}
            disabled={isUploading}
            className="flex h-full w-full flex-col items-center justify-center gap-2 text-ink-faint transition-colors hover:text-ink-muted disabled:opacity-60"
          >
            <ImagePlus className="h-6 w-6" />
            <span className="text-sm">Add a cover photo</span>
          </button>
        )}

        {isUploading && (
          <div className="absolute inset-0 grid place-items-center bg-surface/70">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={onChange}
        className="hidden"
      />

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={openPicker}
          disabled={isUploading}
          className="rounded-md border border-line px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-line-strong disabled:opacity-60"
        >
          {coverPhoto ? 'Replace' : 'Upload'}
        </button>

        {coverPhoto && (
          <button
            type="button"
            onClick={onRemove}
            disabled={isUploading}
            className="inline-flex items-center gap-1.5 rounded-md border border-line px-4 py-2 text-sm font-medium text-ink-muted transition-colors hover:border-danger hover:text-danger disabled:opacity-60"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {isPending ? 'Withdraw' : 'Remove'}
          </button>
        )}

        <p className="text-xs text-ink-faint">
          Uploading submits the image for review — it is not saved with the button below.
        </p>
      </div>

      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
    </section>
  );
}