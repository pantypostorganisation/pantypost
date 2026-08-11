// src/components/messaging/MessageBubble.tsx
'use client';

import { Check, CheckCheck, Clock, AlertTriangle, RotateCw } from 'lucide-react';
import { SecureMessageDisplay } from '@/components/ui/SecureMessageDisplay';
import { safeImageSrc } from '@/utils/url';
import { timeLabel } from './transcript';
import type { UIMessage } from './types';

/* =====================================================================
 * One message bubble.
 *
 * What changed from the old MessageItem:
 *
 *  - Bubbles know their position in a run, so a burst of messages reads as
 *    one stack with a single timestamp instead of repeating "You Ã¢â‚¬Â¢ 14:32"
 *    on every line.
 *  - Own bubbles are a low-alpha brand tint, not a saturated orange block.
 *    250 characters of black-on-#ff950e is a wall; the tint reads as
 *    "mine" without shouting, and keeps text at full contrast.
 *  - Delivery state is a glyph on the LAST own message only, which is
 *    where every mature messenger puts it Ã¢â‚¬â€ not the word "Read" on every
 *    bubble, in the header, above the text.
 *  - Pending and failed states are visible, and failed sends can be
 *    retried. Previously an optimistic message was indistinguishable from
 *    a confirmed one and simply vanished after ten seconds.
 * ===================================================================== */

/** A message that is nothing but emoji renders large and unboxed. */
const EMOJI_ONLY = /^(?:\p{Extended_Pictographic}|\p{Emoji_Component}|Ã¯Â¸Â|Ã¢â‚¬Â|\s){1,8}$/u;

function isEmojiOnly(content: string): boolean {
  const trimmed = (content || '').trim();
  if (!trimmed) return false;
  return EMOJI_ONLY.test(trimmed) && /\p{Extended_Pictographic}/u.test(trimmed);
}

interface MessageBubbleProps {
  message: UIMessage;
  isOwn: boolean;
  /** Position within a run of same-sender messages. */
  isFirst: boolean;
  isLast: boolean;
  /** Delivery glyph is drawn only when this is the newest own message. */
  showDeliveryState?: boolean;
  onImageClick?: (url: string) => void;
  onRetry?: (message: UIMessage) => void;
}

export default function MessageBubble({
  message,
  isOwn,
  isFirst,
  isLast,
  showDeliveryState = false,
  onImageClick,
  onRetry,
}: MessageBubbleProps) {
  const isImage = message.type === 'image' && message.meta?.imageUrl;
  const emojiOnly = !isImage && isEmojiOnly(message.content);

  /* Flatten the corner facing the previous/next message in the run, so a
     stack reads as one shape rather than a column of identical pills. */
  const corners = isOwn
    ? `${isFirst ? 'rounded-tr-md' : 'rounded-tr-sm'} ${isLast ? 'rounded-br-md' : 'rounded-br-sm'} rounded-l-md`
    : `${isFirst ? 'rounded-tl-md' : 'rounded-tl-sm'} ${isLast ? 'rounded-bl-md' : 'rounded-bl-sm'} rounded-r-md`;

  const surface = isOwn
    ? 'bg-primary-soft border border-primary-line text-ink'
    : 'bg-surface-raised border border-line text-ink';

  return (
    <div className={`flex w-full ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[85%] flex-col sm:max-w-[72%] ${isOwn ? 'items-end' : 'items-start'}`}>
        {emojiOnly ? (
          <p className="px-1 py-0.5 text-4xl leading-tight">{message.content}</p>
        ) : isImage ? (
          <button
            type="button"
            onClick={() => onImageClick?.(message.meta!.imageUrl as string)}
            className={`group relative overflow-hidden ${corners} border border-line bg-surface-raised`}
            aria-label="Open image full size"
          >
            {/*
              Fixed aspect ratio. Without one, an image that decodes late
              shoves everything above it downward mid-read Ã¢â‚¬â€ the single
              worst thing a transcript can do.
            */}
            <span className="block aspect-[4/5] w-56 max-w-full sm:w-64">
              <img
                src={safeImageSrc(message.meta!.imageUrl)}
                alt={message.content ? message.content : 'Shared image'}
                loading="lazy"
                className="h-full w-full object-cover transition-opacity group-hover:opacity-90"
              />
            </span>
          </button>
        ) : (
          <div className={`${corners} ${surface} px-3 py-2 sm:px-4 sm:py-2.5`}>
            <SecureMessageDisplay
              content={message.content}
              allowBasicFormatting={false}
              as="p"
              className="whitespace-pre-wrap break-words text-sm leading-relaxed sm:text-[0.9375rem]"
            />
          </div>
        )}

        {/* Caption on an image message. */}
        {isImage && message.content ? (
          <p className="mt-1 max-w-full break-words px-1 text-sm text-ink-muted">
            <SecureMessageDisplay content={message.content} allowBasicFormatting={false} />
          </p>
        ) : null}

        {(isLast || message.failed) && (
          <div className="mt-1 flex items-center gap-1.5 px-1">
            <time className="text-[11px] text-ink-faint" dateTime={message.date}>
              {timeLabel(message.date)}
            </time>

            {isOwn && message.failed ? (
              <>
                <AlertTriangle className="h-3 w-3 text-danger" aria-hidden="true" />
                <span className="text-[11px] text-danger">Not sent</span>
                {onRetry && (
                  <button
                    type="button"
                    onClick={() => onRetry(message)}
                    className="ml-0.5 inline-flex items-center gap-1 rounded-sm px-1 text-[11px] text-primary hover:bg-surface-hover"
                  >
                    <RotateCw className="h-3 w-3" aria-hidden="true" />
                    Retry
                  </button>
                )}
              </>
            ) : isOwn && message.pending ? (
              <Clock className="h-3 w-3 text-ink-faint" aria-label="Sending" />
            ) : isOwn && showDeliveryState ? (
              message.isRead || message.read ? (
                <CheckCheck className="h-3.5 w-3.5 text-primary" aria-label="Read" />
              ) : (
                <Check className="h-3.5 w-3.5 text-ink-faint" aria-label="Sent" />
              )
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}