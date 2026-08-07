// src/components/messaging/ConversationHeader.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, MoreVertical, UserCircle, Ban, Flag, ShieldOff } from 'lucide-react';
import Avatar from './Avatar';
import type { MessagingRole } from './types';

/* =====================================================================
 * ONE header, responsive by CSS.
 *
 * There were four copies: each ConversationView contained a
 * renderMobileHeader() and a renderDesktopHeader() of ~120 near-identical
 * lines, and the buyer and seller each had their own pair. They differed
 * only in text-lg vs default and py-3 vs py-2.
 *
 * The back arrow is `md:hidden` rather than conditional JSX, so there is
 * one tree and resizing the window doesn't remount anything.
 *
 * Profile links use next/link. Every live header used
 * `window.location.href`, a full document reload that throws away the
 * websocket, all context state and the message cache — to go one route
 * across.
 * ===================================================================== */

interface ConversationHeaderProps {
  username: string;
  profilePic?: string | null;
  isVerified?: boolean;
  isOnline?: boolean;
  activity?: string | null;
  role: MessagingRole;
  isBlocked?: boolean;
  onBack: () => void;
  onBlockToggle?: () => void;
  onReport?: () => void;
  hasReported?: boolean;
}

export default function ConversationHeader({
  username,
  profilePic,
  isVerified,
  isOnline,
  activity,
  role,
  isBlocked = false,
  onBack,
  onBlockToggle,
  onReport,
  hasReported = false,
}: ConversationHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!menuOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (menuRef.current?.contains(target)) return;
      if (triggerRef.current?.contains(target)) return;
      setMenuOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  // Sellers browse buyers; buyers browse seller shops. Admin gets neither.
  const profileHref = role === 'buyer' ? `/sellers/${encodeURIComponent(username)}` : null;

  return (
    <header className="flex shrink-0 items-center gap-3 border-b border-line bg-surface px-3 py-2.5 sm:px-4">
      <button
        type="button"
        onClick={onBack}
        className="-ml-1 rounded-md p-1.5 text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink md:hidden"
        aria-label="Back to conversations"
      >
        <ArrowLeft className="h-5 w-5" aria-hidden="true" />
      </button>

      <Avatar
        username={username}
        src={profilePic}
        size="md"
        isVerified={isVerified}
        isOnline={isOnline}
      />

      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-ink">{username}</p>
        {activity ? (
          <p className={`truncate text-xs ${isOnline ? 'text-success' : 'text-ink-faint'}`}>{activity}</p>
        ) : null}
      </div>

      <div className="relative">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-label="Conversation options"
          className="rounded-md p-1.5 text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink"
        >
          <MoreVertical className="h-5 w-5" aria-hidden="true" />
        </button>

        {menuOpen && (
          <div
            ref={menuRef}
            role="menu"
            className="absolute right-0 top-full z-30 mt-1 w-52 overflow-hidden rounded-md border border-line-strong bg-surface-overlay py-1 shadow-overlay"
          >
            {profileHref && (
              <Link
                href={profileHref}
                role="menuitem"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm no-underline hover:bg-surface-hover"
              >
                <UserCircle className="h-4 w-4 shrink-0 text-ink-muted" aria-hidden="true" />
                <span className="text-ink">View shop</span>
              </Link>
            )}

            {onReport && (
              <button
                type="button"
                role="menuitem"
                disabled={hasReported}
                onClick={() => {
                  onReport();
                  setMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink hover:bg-surface-hover disabled:opacity-50"
              >
                <Flag className="h-4 w-4 shrink-0 text-ink-muted" aria-hidden="true" />
                {hasReported ? 'Reported' : 'Report user'}
              </button>
            )}

            {onBlockToggle && (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onBlockToggle();
                  setMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-surface-hover"
              >
                {isBlocked ? (
                  <>
                    <ShieldOff className="h-4 w-4 shrink-0 text-ink-muted" aria-hidden="true" />
                    <span className="text-ink">Unblock</span>
                  </>
                ) : (
                  <>
                    <Ban className="h-4 w-4 shrink-0 text-danger" aria-hidden="true" />
                    <span className="text-danger">Block user</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
