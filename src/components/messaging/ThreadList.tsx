// src/components/messaging/ThreadList.tsx
'use client';

import { useMemo, useState } from 'react';
import { Search, X, MessageSquare, Inbox } from 'lucide-react';
import ThreadRow from './ThreadRow';
import type { MessagingRole, UIThread } from './types';

/* =====================================================================
 * The conversation list.
 *
 * The Starred/favourites tab is deliberately gone. It stored favourites in
 * plain useState, so starring was lost on every reload, and the starred
 * rows rendered a degraded variant with no avatar, preview or unread
 * badge. Shipping a feature that forgets what you told it is worse than
 * not having it; it can come back when there is a field to persist it in.
 * ===================================================================== */

interface ThreadListProps {
  threads: UIThread[];
  activeThread: string | null;
  currentUser: string;
  role: MessagingRole;
  onSelect: (username: string) => void;
  isLoading?: boolean;
}

export default function ThreadList({
  threads,
  activeThread,
  currentUser,
  role,
  onSelect,
  isLoading = false,
}: ThreadListProps) {
  const [query, setQuery] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);

  const totalUnread = useMemo(
    () => threads.reduce((sum, thread) => sum + (thread.unreadCount || 0), 0),
    [threads]
  );

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return threads.filter((thread) => {
      if (unreadOnly && !thread.unreadCount) return false;
      if (!needle) return true;
      // Search names *and* the last message — searching usernames alone,
      // as before, is close to useless once you have more than a few.
      return (
        thread.username.toLowerCase().includes(needle) ||
        (thread.lastMessage?.content || '').toLowerCase().includes(needle)
      );
    });
  }, [threads, query, unreadOnly]);

  const counterpartyLabel = role === 'seller' ? 'buyers' : role === 'buyer' ? 'sellers' : 'users';

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface">
      <div className="shrink-0 border-b border-line px-3 py-3">
        <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-ink">
          <MessageSquare className="h-4 w-4 text-primary" aria-hidden="true" />
          Messages
        </h2>

        <div className="relative">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Search ${counterpartyLabel} and messages`}
            aria-label={`Search ${counterpartyLabel} and messages`}
            className="search-field w-full py-2 pl-8 pr-8 text-sm text-ink placeholder:text-ink-faint"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-ink-faint hover:text-ink"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="mt-2 flex gap-1.5">
          <button
            type="button"
            onClick={() => setUnreadOnly(false)}
            aria-pressed={!unreadOnly}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
              !unreadOnly ? 'bg-primary text-black' : 'border border-line text-ink-muted hover:bg-surface-hover'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setUnreadOnly(true)}
            aria-pressed={unreadOnly}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
              unreadOnly ? 'bg-primary text-black' : 'border border-line text-ink-muted hover:bg-surface-hover'
            }`}
          >
            Unread{totalUnread > 0 ? ` (${totalUnread})` : ''}
          </button>
        </div>
      </div>

      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {isLoading && threads.length === 0 ? (
          /* A real skeleton. The old list said "No conversations yet" while
             data was still in flight, which reads as "you have no
             customers". */
          <ul className="animate-pulse space-y-px p-3" aria-label="Loading conversations">
            {[0, 1, 2, 3].map((i) => (
              <li key={i} className="flex items-center gap-3 py-2">
                <span className="h-12 w-12 shrink-0 rounded-full bg-surface-raised" />
                <span className="flex-1 space-y-2">
                  <span className="block h-3 w-1/3 rounded-sm bg-surface-raised" />
                  <span className="block h-3 w-2/3 rounded-sm bg-surface-raised" />
                </span>
              </li>
            ))}
          </ul>
        ) : visible.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <Inbox className="mx-auto mb-2 h-8 w-8 text-ink-faint" aria-hidden="true" />
            <p className="text-sm text-ink-muted">
              {query || unreadOnly ? 'No conversations match' : 'No conversations yet'}
            </p>
            {(query || unreadOnly) && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setUnreadOnly(false);
                }}
                className="mt-2 text-xs font-semibold text-primary hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          visible.map((thread) => (
            <ThreadRow
              key={thread.username}
              thread={thread}
              isActive={thread.username === activeThread}
              currentUser={currentUser}
              onSelect={onSelect}
            />
          ))
        )}
      </div>
    </div>
  );
}
