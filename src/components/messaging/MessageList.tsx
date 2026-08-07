// src/components/messaging/MessageList.tsx
'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown } from 'lucide-react';
import MessageBubble from './MessageBubble';
import TipCard from './TipCard';
import CustomRequestCard from './CustomRequestCard';
import { buildTranscript } from './transcript';
import type { MessagingRole, UICustomRequest, UIMessage } from './types';

/* =====================================================================
 * The transcript.
 *
 * Scroll behaviour is the part everyone gets wrong. The old code had six
 * competing implementations — effects on message count, on typing, on
 * Enter, a setTimeout after send, plus two more in the hooks — several of
 * them running `scrollTo` and `scrollIntoView` inside the same frame with
 * `behavior: 'smooth'` on a container that also had `scroll-smooth`. Three
 * smooth animations fighting.
 *
 * The rule here is the one mature messengers use:
 *
 *   - If you are at the bottom, new messages follow you down.
 *   - If you have scrolled up to read, NOTHING moves the viewport. A pill
 *     appears telling you how many arrived.
 *   - Opening a thread jumps to the bottom instantly, no animation.
 *
 * Browser scroll anchoring is deliberately left ON (no overflow-anchor:
 * none anywhere), so a late-decoding image cannot shove the message you
 * are reading. MessageBubble gives images a fixed aspect ratio for the
 * same reason.
 *
 * Accessibility: a scrollable region has to be focusable, so this carries
 * tabindex, an accessible name, and role="log" + aria-live so a screen
 * reader announces arrivals. Previously new messages were announced to
 * nobody.
 * ===================================================================== */

/** Within this many pixels of the bottom counts as "at the bottom". */
const BOTTOM_THRESHOLD = 120;

interface MessageListProps {
  messages: UIMessage[];
  currentUser: string;
  role: MessagingRole;
  requestsById?: Record<string, UICustomRequest>;
  /** Captured when the thread opens so the divider doesn't move as you read. */
  firstUnreadId?: string | null;
  onImageClick?: (url: string) => void;
  onRetry?: (message: UIMessage) => void;
  onAcceptRequest?: (request: UICustomRequest) => Promise<void> | void;
  onDeclineRequest?: (request: UICustomRequest) => Promise<void> | void;
  onCounterRequest?: (request: UICustomRequest) => void;
  onPayRequest?: (request: UICustomRequest) => void;
  /** Rendered under the last message — the typing indicator goes here. */
  footer?: React.ReactNode;
  /** Changing this jumps to the bottom instantly (i.e. the active thread). */
  threadKey?: string;
}

export default function MessageList({
  messages,
  currentUser,
  role,
  requestsById,
  firstUnreadId,
  onImageClick,
  onRetry,
  onAcceptRequest,
  onDeclineRequest,
  onCounterRequest,
  onPayRequest,
  footer,
  threadKey,
}: MessageListProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [atBottom, setAtBottom] = useState(true);
  const [missed, setMissed] = useState(0);

  const atBottomRef = useRef(true);
  const lastCountRef = useRef(messages.length);

  const items = useMemo(
    () => buildTranscript(messages, currentUser, firstUnreadId),
    [messages, currentUser, firstUnreadId]
  );

  /** id of the newest own message — the only one that shows a delivery glyph. */
  const lastOwnId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].sender === currentUser) return messages[i].id;
    }
    return null;
  }, [messages, currentUser]);

  const scrollToBottom = useCallback((smooth = false) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  const handleScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    const bottom = distance <= BOTTOM_THRESHOLD;
    atBottomRef.current = bottom;
    setAtBottom(bottom);
    if (bottom) setMissed(0);
  }, []);

  /* Opening a thread starts at the bottom. useLayoutEffect so it happens
     before paint — the old code did this in a plain effect and you saw the
     list flash at the top first. Nothing keyed on the thread at all, so
     switching conversations inherited the previous scroll offset. */
  useLayoutEffect(() => {
    atBottomRef.current = true;
    setAtBottom(true);
    setMissed(0);
    lastCountRef.current = messages.length;
    scrollToBottom(false);
    // Only when the conversation changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadKey]);

  // New messages: follow if the reader is at the bottom, otherwise count them.
  useLayoutEffect(() => {
    const added = messages.length - lastCountRef.current;
    lastCountRef.current = messages.length;
    if (added <= 0) return;

    const newest = messages[messages.length - 1];
    const mine = newest?.sender === currentUser;

    if (atBottomRef.current || mine) {
      scrollToBottom(atBottomRef.current);
    } else {
      setMissed((n) => n + added);
    }
  }, [messages, currentUser, scrollToBottom]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return (
    <div className="relative min-h-0 flex-1">
      <div
        ref={scrollerRef}
        // Focusable + named: a scrollable region must be keyboard reachable.
        tabIndex={0}
        role="log"
        aria-live="polite"
        aria-label="Conversation"
        className="custom-scrollbar h-full overflow-y-auto overscroll-contain px-3 py-4 sm:px-4"
      >
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-1">
          {items.map((item) => {
            if (item.kind === 'day') {
              return (
                <div key={item.key} className="my-3 flex items-center gap-3" aria-hidden="true">
                  <span className="h-px flex-1 bg-line" />
                  <span className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">
                    {item.label}
                  </span>
                  <span className="h-px flex-1 bg-line" />
                </div>
              );
            }

            if (item.kind === 'unread') {
              return (
                <div key={item.key} className="my-3 flex items-center gap-3">
                  <span className="h-px flex-1 bg-primary-line" />
                  <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-semibold text-primary">
                    {item.count} new {item.count === 1 ? 'message' : 'messages'}
                  </span>
                  <span className="h-px flex-1 bg-primary-line" />
                </div>
              );
            }

            const { group } = item;

            return (
              <div key={item.key} className={`flex flex-col gap-0.5 ${group.isOwn ? 'items-end' : 'items-start'} mt-2`}>
                {group.messages.map((message, index) => {
                  const isFirst = index === 0;
                  const isLast = index === group.messages.length - 1;

                  if (message.type === 'tip') {
                    return (
                      <TipCard
                        key={message.id}
                        message={message}
                        isOwn={group.isOwn}
                        currentUser={currentUser}
                      />
                    );
                  }

                  if (message.type === 'customRequest') {
                    const requestId = message.meta?.id || message.id;
                    return (
                      <CustomRequestCard
                        key={message.id}
                        message={message}
                        request={requestsById?.[requestId]}
                        isOwn={group.isOwn}
                        currentUser={currentUser}
                        role={role}
                        onAccept={onAcceptRequest}
                        onDecline={onDeclineRequest}
                        onCounter={onCounterRequest}
                        onPay={onPayRequest}
                      />
                    );
                  }

                  return (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      isOwn={group.isOwn}
                      isFirst={isFirst}
                      isLast={isLast}
                      showDeliveryState={group.isOwn && message.id === lastOwnId}
                      onImageClick={onImageClick}
                      onRetry={onRetry}
                    />
                  );
                })}
              </div>
            );
          })}

          {footer}
        </div>
      </div>

      {/* Jump to latest. Only while scrolled away — the old UI had no
          affordance at all, so messages arriving while you read history
          were simply invisible. */}
      {!atBottom && (
        <button
          type="button"
          onClick={() => scrollToBottom(true)}
          className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-line-strong bg-surface-overlay px-3 py-1.5 shadow-raised transition-colors hover:bg-surface-hover"
        >
          <ArrowDown className="h-3.5 w-3.5 text-ink" aria-hidden="true" />
          <span className="text-xs font-semibold text-ink">
            {missed > 0 ? `${missed} new ${missed === 1 ? 'message' : 'messages'}` : 'Jump to latest'}
          </span>
        </button>
      )}
    </div>
  );
}
