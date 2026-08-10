// src/components/messaging/TypingIndicator.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import Avatar from './Avatar';

/* =====================================================================
 * "{name} is typing" â€” a small incoming-style bubble in the same left
 * gutter as incoming message groups, with the same-size avatar, so the
 * transcript never shifts sideways when the indicator swaps for the real
 * message.
 *
 * Per the motion brief (Â§12): it fades/slides in, and on stop it plays a
 * slightly faster exit before unmounting rather than vanishing between
 * frames. The keyframes live in globals.css and are neutralised wholesale
 * by the prefers-reduced-motion block there.
 *
 * The previous version carried its own avatar renderer with a purpleâ†’pink
 * gradient fallback, hard-coded hex surfaces and inline style objects for
 * every dot. Props are a superset of the old component's, so the legacy
 * ConversationViews keep compiling until they are deleted.
 * ===================================================================== */

const LEAVE_MS = 160;

interface TypingIndicatorProps {
  username: string;
  isTyping: boolean;
  userPic?: string | null;
}

export default function TypingIndicator({ username, isTyping, userPic }: TypingIndicatorProps) {
  const [mounted, setMounted] = useState(isTyping);
  const [leaving, setLeaving] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isTyping) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setMounted(true);
      setLeaving(false);
    } else if (mounted) {
      setLeaving(true);
      timerRef.current = setTimeout(() => {
        setMounted(false);
        setLeaving(false);
        timerRef.current = null;
      }, LEAVE_MS);
    }
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
    // `mounted` is deliberately not a dependency: it would re-arm the
    // leave timer the moment it flips.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTyping]);

  if (!mounted) return null;

  return (
    <div
      className={`flex items-end gap-2 pt-2 ${leaving ? 'soft-leave' : 'soft-enter'}`}
      aria-live="polite"
      aria-atomic="true"
    >
      <Avatar username={username} src={userPic} size="sm" />

      <div>
        <p className="mb-1 text-xs text-ink-faint">{username} is typing</p>
        <div
          className="inline-flex items-center gap-1 rounded-tl-sm rounded-tr-md rounded-b-md border border-line bg-surface-raised px-3 py-2.5"
          aria-hidden="true"
        >
          {/* Stagger lives in the scoped CSS below, not in utilities:
              the `.typing-dot` rule sets the `animation` SHORTHAND, which
              resets animation-delay to 0 and clobbered the per-dot
              Tailwind delays — so all three bounced in unison. */}
          <span className="typing-dot h-1.5 w-1.5 rounded-full bg-primary" />
          <span className="typing-dot h-1.5 w-1.5 rounded-full bg-primary" />
          <span className="typing-dot h-1.5 w-1.5 rounded-full bg-primary" />
        </div>
      </div>

      {/* Scoped keyframes; globals.css deliberately carries no ambient
          animation, and this one only exists while someone is typing. */}
      <style jsx>{`
        .typing-dot {
          animation: typingBounce 1.4s infinite ease-in-out;
        }
        /* Left to right. Declared AFTER the shorthand above so the delay
           is not reset by it. */
        .typing-dot:nth-child(1) {
          animation-delay: 0ms;
        }
        .typing-dot:nth-child(2) {
          animation-delay: 180ms;
        }
        .typing-dot:nth-child(3) {
          animation-delay: 360ms;
        }
        @keyframes typingBounce {
          0%,
          60%,
          100% {
            transform: translateY(0);
            opacity: 0.5;
          }
          30% {
            transform: translateY(-3px);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}