// src/components/messaging/transcript.ts
//
// Turns a flat message array into what a transcript should actually look
// like: runs of consecutive messages from one sender, day separators, and
// an unread divider.
//
// The old UI had none of this. Every message was a standalone bubble with
// its own "You • 14:32" header, so ten messages in a row printed the name
// and the time ten times; and because timestamps were time-only, a message
// from last Tuesday was indistinguishable from one an hour ago.

import type { MessageGroup, TranscriptItem, UIMessage } from './types';

/** Messages closer together than this from the same sender are grouped. */
const GROUP_WINDOW_MS = 5 * 60 * 1000;

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export function dayLabel(iso: string): string {
  const date = new Date(iso);
  const today = startOfDay(new Date());
  const that = startOfDay(date);
  const dayMs = 86400000;

  if (that === today) return 'Today';
  if (that === today - dayMs) return 'Yesterday';

  // Within the last week, the weekday alone is the most readable form.
  if (today - that < 7 * dayMs) {
    return date.toLocaleDateString(undefined, { weekday: 'long' });
  }

  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString(
    undefined,
    sameYear
      ? { day: 'numeric', month: 'long' }
      : { day: 'numeric', month: 'long', year: 'numeric' }
  );
}

export function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Build the render list.
 *
 * `firstUnreadId` marks where the "new messages" divider goes. It is
 * captured once when a thread opens rather than recomputed, so the divider
 * doesn't leap around while you are reading.
 */
export function buildTranscript(
  messages: UIMessage[],
  currentUser: string,
  firstUnreadId?: string | null
): TranscriptItem[] {
  const items: TranscriptItem[] = [];
  if (!messages.length) return items;

  let lastDay: number | null = null;
  let current: MessageGroup | null = null;
  let unreadInserted = false;
  let unreadCount = 0;

  if (firstUnreadId) {
    const index = messages.findIndex((m) => m.id === firstUnreadId);
    if (index >= 0) unreadCount = messages.length - index;
  }

  const flush = () => {
    if (current && current.messages.length) {
      items.push({ kind: 'group', key: current.key, group: current });
    }
    current = null;
  };

  for (const message of messages) {
    const when = new Date(message.date);
    const day = startOfDay(when);

    if (day !== lastDay) {
      flush();
      items.push({ kind: 'day', key: `day-${day}`, label: dayLabel(message.date) });
      lastDay = day;
    }

    if (!unreadInserted && firstUnreadId && message.id === firstUnreadId) {
      flush();
      items.push({ kind: 'unread', key: 'unread-divider', count: unreadCount });
      unreadInserted = true;
    }

    const isOwn = message.sender === currentUser;

    /* Structured messages — a custom request, a tip, an image — are their
       own card. Grouping them into a text run would put a negotiation
       card inside a speech bubble, which is exactly what the old UI did. */
    const standalone = message.type !== 'normal';

    const continues =
      current &&
      !standalone &&
      current.sender === message.sender &&
      current.messages[current.messages.length - 1].type === 'normal' &&
      when.getTime() -
        new Date(current.messages[current.messages.length - 1].date).getTime() <
        GROUP_WINDOW_MS;

    if (continues && current) {
      current.messages.push(message);
    } else {
      flush();
      current = {
        key: `group-${message.id}`,
        sender: message.sender,
        isOwn,
        messages: [message],
      };
      if (standalone) flush();
    }
  }

  flush();
  return items;
}
