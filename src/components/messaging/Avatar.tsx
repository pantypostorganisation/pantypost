// src/components/messaging/Avatar.tsx
'use client';

import { useState } from 'react';
import { BadgeCheck } from 'lucide-react';
import { safeImageSrc, isDeadPlaceholderUrl } from '@/utils/url';

/* =====================================================================
 * ONE avatar, used everywhere in messaging.
 *
 * The old code had four ways of drawing one, and every one of them could
 * show a broken image:
 *
 *   - User.profilePic defaulted to `https://via.placeholder.com/150`,
 *     a service that no longer resolves. Accounts that never uploaded a
 *     picture rendered as a broken-file icon in chat.
 *   - The buyer sidebar's <img onError> set style.display='none' and then
 *     wrote parentElement.innerHTML with the username interpolated in —
 *     ripping a node out from under React, which can throw NotFoundError
 *     on the next render of that row.
 *   - Fallbacks were a purple→pink gradient that appears nowhere else in
 *     the product.
 *
 * Here: if there is no usable image we draw an initial on a tinted circle,
 * derived deterministically from the username so a person keeps the same
 * colour everywhere. No network request, nothing to break.
 * ===================================================================== */

const SIZES = {
  sm: { box: 'h-8 w-8', text: 'text-xs', badge: 'h-3 w-3' },
  md: { box: 'h-10 w-10', text: 'text-sm', badge: 'h-3.5 w-3.5' },
  lg: { box: 'h-12 w-12', text: 'text-base', badge: 'h-4 w-4' },
} as const;

/* Tinted fills only — the accent at low alpha, never a saturated block.
   Deterministic per username so the same person is the same colour in the
   thread list, the header and the transcript. */
const TINTS = [
  'bg-primary-soft text-primary',
  'bg-success-soft text-success',
  'bg-auction-soft text-auction',
  'bg-warning-soft text-warning',
] as const;

function tintFor(username: string): string {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = (hash * 31 + username.charCodeAt(i)) >>> 0;
  }
  return TINTS[hash % TINTS.length];
}

interface AvatarProps {
  username: string;
  src?: string | null;
  size?: keyof typeof SIZES;
  isVerified?: boolean;
  isOnline?: boolean;
  className?: string;
}

export default function Avatar({
  username,
  src,
  size = 'md',
  isVerified = false,
  isOnline = false,
  className = '',
}: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const dims = SIZES[size];

  // Treat the retired placeholder host as no image at all.
  const usable = src && !isDeadPlaceholderUrl(src) ? safeImageSrc(src) : null;
  const showImage = Boolean(usable) && !failed;
  const initial = (username || '?').charAt(0).toUpperCase();

  return (
    <div className={`relative shrink-0 ${dims.box} ${className}`}>
      {showImage ? (
        <img
          src={usable as string}
          alt=""
          /* Decorative: the username is always rendered as text next to
             this, so announcing it twice is noise for a screen reader. */
          aria-hidden="true"
          className={`${dims.box} rounded-full border border-line object-cover`}
          /* State, not DOM surgery — see the note at the top of this file. */
          onError={() => setFailed(true)}
        />
      ) : (
        <div
          aria-hidden="true"
          className={`${dims.box} ${dims.text} ${tintFor(
            username
          )} flex items-center justify-center rounded-full border border-line font-semibold`}
        >
          {initial}
        </div>
      )}

      {isVerified && (
        <BadgeCheck
          className={`absolute -bottom-0.5 -right-0.5 ${dims.badge} rounded-full bg-surface text-primary`}
          aria-hidden="true"
        />
      )}

      {isOnline && !isVerified && (
        <span
          className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface bg-success"
          aria-hidden="true"
        />
      )}
    </div>
  );
}
