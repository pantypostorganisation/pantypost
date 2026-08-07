// src/components/messaging/ImagePreviewModal.tsx
'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';

/* =====================================================================
 * Full-size view of an image from a conversation.
 *
 * Restyled onto the tokens: the close control was a red-500 circle
 * hanging off the corner — danger colour for a neutral action, on a
 * surface colour from Tailwind's default palette rather than ours. It is
 * now a quiet overlay button, and the backdrop matches every other modal.
 *
 * Props are unchanged, so existing call sites keep working.
 * ===================================================================== */

interface ImagePreviewModalProps {
  imageUrl: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ImagePreviewModal({ imageUrl, isOpen, onClose }: ImagePreviewModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Image preview"
    >
      <div className="pop-in relative" onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          onClick={onClose}
          className="absolute right-2 top-2 z-10 rounded-full border border-line-strong bg-surface-overlay/90 p-2 text-ink transition-colors hover:bg-surface-hover"
          aria-label="Close preview"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>

        {imageUrl ? (
          <img
            src={imageUrl}
            alt="Full size preview"
            className="max-h-[90vh] max-w-[90vw] rounded-lg border border-line-strong object-contain shadow-overlay"
            draggable={false}
          />
        ) : (
          <div className="rounded-lg border border-line bg-surface-raised p-8 text-ink-muted">
            Image unavailable
          </div>
        )}
      </div>
    </div>
  );
}
