// src/utils/optimisticMessages.ts
//
// WHY THIS EXISTS: the duplicate-message bug.
//
// Sending a message showed it twice, and one copy vanished about ten
// seconds later. The cause is that there are two independent optimistic
// systems that don't know about each other:
//
//   1. MessageContext.sendMessage posts to the API and adds nothing
//      locally — the comment says "Message will be added via WebSocket
//      echo". Its own reconciliation keys off `_optimisticId`, which the
//      server never echoes back.
//   2. useBuyerMessages / useSellerMessages each keep a *separate*
//      `optimisticMessages` map, insert their own copy on send, and merge
//      it into the thread unconditionally.
//
// So the optimistic copy renders, then the websocket echo adds the real
// message, and both are on screen. The only thing that removed the
// optimistic one was a `message:new` window handler matching on content
// AND a 5-second timestamp window — which fails if the client and server
// clocks differ by more than five seconds, or if the two sanitisers
// (sanitizeHtml on the way out, sanitizeStrict on the way back) disagree
// about the content by so much as a character. When it failed, the copy
// survived until a 10-second sweeper deleted it. Hence: two messages, one
// disappears after ten seconds.
//
// This reconciles the two lists directly at merge time instead. The
// optimistic copy stops rendering the moment the real one is present, so
// the duplicate is impossible regardless of clock skew, event ordering or
// sanitiser differences — none of which we control.

interface ReconcilableMessage {
  sender: string;
  receiver: string;
  content?: string;
  date: string;
  type?: string;
  meta?: { imageUrl?: string } | null;
}

/** Generous by design: this absorbs client/server clock skew. Safe to be
 *  wide because matching is one-to-one — see below. */
const DEFAULT_WINDOW_MS = 5 * 60 * 1000;

function sameContent(a: ReconcilableMessage, b: ReconcilableMessage): boolean {
  if ((a.type || 'normal') !== (b.type || 'normal')) return false;

  // An image message may carry an empty body, so the URL is what identifies it.
  const aImage = a.meta?.imageUrl;
  const bImage = b.meta?.imageUrl;
  if (aImage || bImage) return aImage === bImage;

  return (a.content || '') === (b.content || '');
}

/**
 * Return only those optimistic messages that the real thread does NOT yet
 * contain.
 *
 * Matching is ONE-TO-ONE: each real message can cancel at most one
 * optimistic message. That matters — send "ok" twice in quick succession
 * and a naive `some()` check would hide both optimistic copies against the
 * single real message that had arrived, so the second would blink out and
 * back. Consuming matches prevents that.
 */
export function reconcileOptimistic<T extends ReconcilableMessage>(
  realMessages: T[],
  optimisticMessages: T[],
  windowMs: number = DEFAULT_WINDOW_MS
): T[] {
  if (!optimisticMessages || optimisticMessages.length === 0) return [];
  if (!realMessages || realMessages.length === 0) return optimisticMessages;

  const consumed = new Set<number>();

  return optimisticMessages.filter((optimistic) => {
    const optimisticTime = new Date(optimistic.date).getTime();

    const matchIndex = realMessages.findIndex((real, index) => {
      if (consumed.has(index)) return false;
      if (real.sender !== optimistic.sender) return false;
      if (real.receiver !== optimistic.receiver) return false;
      if (!sameContent(real, optimistic)) return false;

      const realTime = new Date(real.date).getTime();
      if (Number.isNaN(realTime) || Number.isNaN(optimisticTime)) return true;
      return Math.abs(realTime - optimisticTime) < windowMs;
    });

    if (matchIndex === -1) return true;

    consumed.add(matchIndex);
    return false;
  });
}
