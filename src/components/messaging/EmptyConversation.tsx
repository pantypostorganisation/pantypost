// src/components/messaging/EmptyConversation.tsx
'use client';

import { MessagesSquare } from 'lucide-react';

/* =====================================================================
 * Shown on desktop when no conversation is selected.
 *
 * The old EmptyState was a marketing page: a gradient hero, a permanently
 * pulsing halo, four "Pro Tips", a stats grid hard-coded to `--`, and a
 * fake unread badge that counted 1 to 5 on an eight-second loop forever
 * (leaking an interval per cycle on the buyer side). A messenger shows a
 * line of text.
 * ===================================================================== */

export default function EmptyConversation({ hasThreads }: { hasThreads: boolean }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <MessagesSquare className="mb-3 h-10 w-10 text-ink-faint" aria-hidden="true" />
      <p className="text-sm font-medium text-ink">
        {hasThreads ? 'Select a conversation' : 'No conversations yet'}
      </p>
      <p className="mt-1 max-w-xs text-sm text-ink-muted">
        {hasThreads
          ? 'Choose someone from the list to read and reply.'
          : 'When someone messages you, the conversation will appear here.'}
      </p>
    </div>
  );
}
