// src/components/messaging/MessageList.tsx
'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown } from 'lucide-react';
import Avatar from './Avatar';
import MessageBubble from './MessageBubble';
import TipCard from './TipCard';
import CustomRequestCard, { type RequestEditState } from './CustomRequestCard';
import { buildTranscript } from './transcript';
import type { MessagingRole, UICustomRequest, UIMessage } from './types';

/* =====================================================================
 * The transcript.
 *
 * Scroll behaviour is the part everyone gets wrong. The old code had six
 * competing implementations — effects on message count, on typing, on
 * Enter, a setTimeout after send, plus two more in the hooks — several of
 * them running `scrollTo` and `scrollIntoView` inside the same frame with
 * `behavior: 'smooth'` on a container that also had `scroll-smooth`.
 *
 * The rule here is the one mature messengers use:
 *
 *   - If you are at the bottom, new messages follow you down.
 *   - If you have scrolled up to read, NOTHING moves the viewport. A pill
 *     appears telling you how many arrived.
 *   - Opening a thread jumps to the bottom instantly, no animation.
 *
 * MOTION (per the implementation brief): a new message fades in with a
 * few pixels of travel, and the existing stack GLIDES rather than snaps.
 * In a bottom-anchored chat the stack's apparent movement IS the scroll,
 * so the glide is a ~280ms eased scroll — no animation library, and the
 * whole system is disabled by the prefers-reduced-motion block in
 * globals.css plus a matchMedia check for the JS-driven part. History
 * loading and thread opening never animate: only messages that arrive
 * while you're watching do.
 *
 * Incoming groups carry the sender's avatar (Messenger's model); outgoing
 * groups do not repeat yours. The avatar sits at the bottom of the group,
 * and the typing indicator shares the same gutter, so the transcript
 * never shifts sideways when one swaps for the other.
 *
 * READ MARKING lives here too: one IntersectionObserver over the whole
 * list, marking an incoming message read when at least half of it has
 * actually been on screen. The old UI created an observer per message.
 *
 * Accessibility: the scrollable region is focusable and named, with
 * role="log" + aria-live so a screen reader announces arrivals.
 * ===================================================================== */

/** Within this many pixels of the bottom counts as "at the bottom". */
const BOTTOM_THRESHOLD = 120;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

interface MessageListProps {
  messages: UIMessage[];
  currentUser: string;
  role: MessagingRole;
  /** The other participant — drawn beside their message groups. */
  peerUsername: string;
  peerPic?: string | null;
  requestsById?: Record<string, UICustomRequest>;
  /** Captured when the thread opens so the divider doesn't move as you read. */
  firstUnreadId?: string | null;
  onImageClick?: (url: string) => void;
  onRetry?: (message: UIMessage) => void;
  /** Called once per incoming message when it has genuinely been seen. */
  onMessageVisible?: (message: UIMessage) => void;
  onAcceptRequest?: (request: UICustomRequest) => Promise<void> | void;
  onDeclineRequest?: (request: UICustomRequest) => Promise<void> | void;
  onCounterRequest?: (request: UICustomRequest) => void;
  onPayRequest?: (request: UICustomRequest) => void;
  /** Counter-offer form state, threaded through to the request card. */
  requestEditState?: RequestEditState;
  /** Rendered under the last message — the typing indicator goes here. */
  footer?: React.ReactNode;
  /** Change this when the footer appears/grows (e.g. typing starts) so a
      reader sitting at the bottom is nudged down with it. */
  footerSignal?: unknown;
  /** Changing this jumps to the bottom instantly (i.e. the active thread). */
  threadKey?: string;
}

export default function MessageList({
  messages,
  currentUser,
  role,
  peerUsername,
  peerPic,
  requestsById,
  firstUnreadId,
  onImageClick,
  onRetry,
  onMessageVisible,
  onAcceptRequest,
  onDeclineRequest,
  onCounterRequest,
  onPayRequest,
  requestEditState,
  footer,
  footerSignal,
  threadKey,
}: MessageListProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [atBottom, setAtBottom] = useState(true);
  const [missed, setMissed] = useState(0);

  const atBottomRef = useRef(true);
  const lastCountRef = useRef(messages.length);

  /* ---- Entrance animation bookkeeping ----
     Ids in this set existed before the current render, so they must not
     animate. The set is snapshotted on thread open (history never
     animates) and topped up after every commit. */
  const seenIdsRef = useRef<Set<string>>(new Set());

  /* ---- Read marking ---- */
  const nodeByIdRef = useRef(new Map<string, HTMLElement>());
  const messageByIdRef = useRef(new Map<string, UIMessage>());
  const reportedRef = useRef(new Set<string>());

  const registerNode = useCallback(
    (id: string) => (el: HTMLElement | null) => {
      if (el) nodeByIdRef.current.set(id, el);
      else nodeByIdRef.current.delete(id);
    },
    []
  );

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

  /* ---- The glide ----
     A short eased scroll, recomputing the target each frame so content
     that grows mid-glide (a decoding image, the typing indicator) is
     still landed on. Any user input cancels it immediately — the machine
     never fights the person. */
  const glideCancelRef = useRef<(() => void) | null>(null);

  const scrollToBottom = useCallback((smooth = false, duration = 280) => {
    const el = scrollerRef.current;
    if (!el) return;

    glideCancelRef.current?.();

    if (!smooth || prefersReducedMotion()) {
      el.scrollTop = el.scrollHeight;
      return;
    }

    const start = el.scrollTop;
    const startedAt = performance.now();
    const easeOutQuint = (t: number) => 1 - Math.pow(1 - t, 5);
    let frame = 0;
    let cancelled = false;

    const cancel = () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      el.removeEventListener('wheel', cancel);
      el.removeEventListener('touchstart', cancel);
      el.removeEventListener('pointerdown', cancel);
      if (glideCancelRef.current === cancel) glideCancelRef.current = null;
    };

    el.addEventListener('wheel', cancel, { passive: true });
    el.addEventListener('touchstart', cancel, { passive: true });
    el.addEventListener('pointerdown', cancel, { passive: true });
    glideCancelRef.current = cancel;

    const step = (now: number) => {
      if (cancelled) return;
      const t = Math.min(1, (now - startedAt) / duration);
      const target = el.scrollHeight - el.clientHeight;
      el.scrollTop = start + (target - start) * easeOutQuint(t);
      if (t < 1) frame = requestAnimationFrame(step);
      else cancel();
    };
    frame = requestAnimationFrame(step);
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
     list flash at the top first. History present at open is snapshotted
     as seen, so nothing animates. */
  useLayoutEffect(() => {
    atBottomRef.current = true;
    setAtBottom(true);
    setMissed(0);
    lastCountRef.current = messages.length;
    reportedRef.current.clear();
    seenIdsRef.current = new Set(messages.map((m) => m.id));
    glideCancelRef.current?.();
    scrollToBottom(false);
    // Only when the conversation changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadKey]);

  // New messages: follow if the reader (or the sender) is at the bottom
  // of intent, otherwise count them into the pill.
  useLayoutEffect(() => {
    const added = messages.length - lastCountRef.current;
    lastCountRef.current = messages.length;
    if (added <= 0) return;

    const newest = messages[messages.length - 1];
    const mine = newest?.sender === currentUser;

    if (atBottomRef.current || mine) {
      scrollToBottom(true);
    } else {
      setMissed((n) => n + added);
    }
  }, [messages, currentUser, scrollToBottom]);

  /* After every commit, everything currently rendered has been seen. */
  useEffect(() => {
    for (const message of messages) seenIdsRef.current.add(message.id);
  }, [messages]);

  /* The typing indicator appearing grows the content without changing the
     message count. A reader at the bottom is nudged down with it. */
  useEffect(() => {
    if (atBottomRef.current) scrollToBottom(true, 240);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [footerSignal]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  /* One observer for the whole list. Marks a message seen when ≥50% of it
     has been inside the scroller, then forgets it. */
  useEffect(() => {
    if (!onMessageVisible || !scrollerRef.current) return;

    messageByIdRef.current = new Map(messages.map((m) => [m.id, m]));

    const candidates = messages.filter(
      (m) =>
        m.sender !== currentUser &&
        !m.isRead &&
        !m.read &&
        !m.pending &&
        !reportedRef.current.has(m.id)
    );
    if (candidates.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const id = (entry.target as HTMLElement).dataset.mid;
          if (!id || reportedRef.current.has(id)) continue;
          const message = messageByIdRef.current.get(id);
          if (!message) continue;
          reportedRef.current.add(id);
          observer.unobserve(entry.target);
          onMessageVisible(message);
        }
      },
      { root: scrollerRef.current, threshold: 0.5 }
    );

    for (const message of candidates) {
      const node = nodeByIdRef.current.get(message.id);
      if (node) observer.observe(node);
    }

    return () => observer.disconnect();
  }, [messages, currentUser, onMessageVisible]);

  /* A message animates in only when it is genuinely new to this open
     thread: unseen id, and either incoming or our own optimistic send.
     A bulk fill into an empty list is history loading, not arrival. */
  const canAnimate = seenIdsRef.current.size > 0 || messages.length <= 1;

  const entranceClass = (message: UIMessage, isOwn: boolean): string => {
    if (!canAnimate) return '';
    if (seenIdsRef.current.has(message.id)) return '';
    if (isOwn && !message.pending) return '';
    return isOwn ? 'msg-enter-right' : 'msg-enter-left';
  };

  const renderMessage = (message: UIMessage, group: { isOwn: boolean }, index: number, count: number) => {
    const isFirst = index === 0;
    const isLast = index === count - 1;
    const anim = entranceClass(message, group.isOwn);

    if (message.type === 'tip') {
      return (
        <div key={message.id} ref={registerNode(message.id)} data-mid={message.id} className={`w-full ${anim}`}>
          <TipCard message={message} isOwn={group.isOwn} currentUser={currentUser} />
        </div>
      );
    }

    if (message.type === 'customRequest') {
      const requestId = message.meta?.id || message.id;
      return (
        <div key={message.id} ref={registerNode(message.id)} data-mid={message.id} className={`w-full ${anim}`}>
          <CustomRequestCard
            message={message}
            request={requestsById?.[requestId]}
            isOwn={group.isOwn}
            currentUser={currentUser}
            role={role}
            onAccept={onAcceptRequest}
            onDecline={onDeclineRequest}
            onCounter={onCounterRequest}
            onPay={onPayRequest}
            editState={requestEditState}
          />
        </div>
      );
    }

    return (
      <div key={message.id} ref={registerNode(message.id)} data-mid={message.id} className={`w-full ${anim}`}>
        <MessageBubble
          message={message}
          isOwn={group.isOwn}
          isFirst={isFirst}
          isLast={isLast}
          showDeliveryState={group.isOwn && message.id === lastOwnId}
          onImageClick={onImageClick}
          onRetry={onRetry}
        />
      </div>
    );
  };

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
            const count = group.messages.length;

            /* Incoming groups get the sender's avatar, bottom-aligned —
               once per group, never per line. Outgoing groups stay bare.
               The typing indicator uses the same-size avatar in the same
               gutter, so swapping one for the other never shifts the
               column sideways. */
            if (!group.isOwn) {
              // A brand-new group fades its avatar in with its first bubble.
              const firstAnim = entranceClass(group.messages[0], false);
              return (
                <div key={item.key} className="mt-2 flex w-full items-end gap-2">
                  <Avatar
                    username={peerUsername}
                    src={peerPic}
                    size="sm"
                    className={`mb-5 ${firstAnim}`}
                  />
                  <div className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
                    {group.messages.map((message, index) => renderMessage(message, group, index, count))}
                  </div>
                </div>
              );
            }

            return (
              <div key={item.key} className="mt-2 flex w-full flex-col items-end gap-0.5">
                {group.messages.map((message, index) => renderMessage(message, group, index, count))}
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
        /* Positioning and animation on separate elements: the entrance
           keyframes own `transform` while filling, and would otherwise
           permanently stomp the -translate-x-1/2 centering. */
        <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2">
          <button
            type="button"
            onClick={() => scrollToBottom(true, 320)}
            className="pop-in pointer-events-auto flex items-center gap-2 rounded-full border border-line-strong bg-surface-overlay px-3 py-1.5 shadow-raised transition-colors hover:bg-surface-hover"
          >
          <ArrowDown className="h-3.5 w-3.5 text-ink" aria-hidden="true" />
          <span className="text-xs font-semibold text-ink">
            {missed > 0 ? `${missed} new ${missed === 1 ? 'message' : 'messages'}` : 'Jump to latest'}
          </span>
          </button>
        </div>
      )}
    </div>
  );
}
