// src/components/messaging/ThreadRow.tsx
'use client';

import { ImageIcon, ClipboardList, Gift } from 'lucide-react';
import Avatar from './Avatar';
import type { UIThread } from './types';

/* =====================================================================
 * One conversation in the list.
 *
 * It is a <button>. The old rows were <div onClick> with no role, no
 * tabIndex and no key handler, which made the entire conversation list
 * unreachable by keyboard — you could not tab to a single conversation.
 *
 * The row also now shows a timestamp, which no version did: the buyer
 * sidebar imported date-fns' formatDistanceToNow and never called it, and
 * put an activity string where every other messenger puts the time.
 * ===================================================================== */

/** Compact, list-appropriate: time today, weekday this week, else a date. */
function shortTimestamp(iso?: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const that = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const dayMs = 86400000;

  if (that === startOfToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (that === startOfToday - dayMs) return 'Yesterday';
  if (startOfToday - that < 7 * dayMs) {
    return date.toLocaleDateString(undefined, { weekday: 'short' });
  }
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

interface ThreadRowProps {
  thread: UIThread;
  isActive: boolean;
  currentUser: string;
  onSelect: (username: string) => void;
}

export default function ThreadRow({ thread, isActive, currentUser, onSelect }: ThreadRowProps) {
  const last = thread.lastMessage;
  const fromMe = last?.sender === currentUser;

  /* Icons, not emoji. The old previews used literal 📦 and 🖼️ — and the
     seller and buyer sidebars used *different* glyphs for the same thing. */
  let PreviewIcon: typeof ImageIcon | null = null;
  let previewText = last?.content || '';

  if (last?.type === 'image') {
    PreviewIcon = ImageIcon;
    previewText = last.content || 'Photo';
  } else if (last?.type === 'customRequest') {
    PreviewIcon = ClipboardList;
    previewText = last.meta?.title || 'Custom request';
  } else if (last?.type === 'tip') {
    PreviewIcon = Gift;
    previewText = `Tip${last.meta?.tipAmount ? ` · $${Number(last.meta.tipAmount).toFixed(2)}` : ''}`;
  }

  const unread = thread.unreadCount > 0;

  return (
    <button
      type="button"
      onClick={() => onSelect(thread.username)}
      aria-current={isActive ? 'true' : undefined}
      className={`relative flex w-full items-center gap-3 border-b border-line px-3 py-3 text-left transition-colors ${
        isActive ? 'bg-surface-raised' : 'hover:bg-surface-hover'
      }`}
    >
      {isActive && <span className="absolute inset-y-0 left-0 w-0.5 bg-primary" aria-hidden="true" />}

      <Avatar
        username={thread.username}
        src={thread.profilePic}
        size="lg"
        isVerified={thread.isVerified}
        isOnline={thread.isOnline}
      />

      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-2">
          <span className={`truncate text-sm ${unread ? 'font-semibold text-ink' : 'font-medium text-ink'}`}>
            {thread.username}
          </span>
          <span className="ml-auto shrink-0 text-[11px] text-ink-faint">
            {shortTimestamp(last?.date)}
          </span>
        </span>

        <span className="mt-0.5 flex items-center gap-1.5">
          {PreviewIcon && <PreviewIcon className="h-3.5 w-3.5 shrink-0 text-ink-faint" aria-hidden="true" />}
          <span className={`truncate text-xs ${unread ? 'text-ink' : 'text-ink-muted'}`}>
            {fromMe && last?.type === 'normal' ? 'You: ' : ''}
            {previewText || 'No messages yet'}
          </span>

          {unread && (
            <span className="ml-auto shrink-0 rounded-full bg-primary px-1.5 py-0.5 text-[11px] font-bold text-black">
              {thread.unreadCount > 99 ? '99+' : thread.unreadCount}
              <span className="sr-only"> unread messages</span>
            </span>
          )}
        </span>

        {thread.pendingRequests ? (
          <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-warning-soft px-1.5 py-0.5 text-[10px] font-semibold text-warning">
            {thread.pendingRequests} awaiting you
          </span>
        ) : null}
      </span>
    </button>
  );
}
