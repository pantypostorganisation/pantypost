// src/components/messaging/EmojiPicker.tsx
'use client';

import { useEffect, useRef } from 'react';
import { Clock, X } from 'lucide-react';

/* =====================================================================
 * One emoji picker.
 *
 * There were four before: two dedicated files (both dead code) and two
 * inline copies pasted into the buyer and seller ConversationViews.
 *
 * Two bugs are fixed here:
 *
 *  1. The toggle button could not close it. The old close-on-outside-click
 *     listened for `mousedown`, and the toggle sat outside the picker -- so
 *     mousedown set open=false, then the button's own click flipped the
 *     now-false value back to true. It reopened every time. The button is
 *     passed in as `anchorRef` and excluded from the outside test.
 *  2. Cells were <span onClick>: not focusable, no role, no keyboard.
 *     They are buttons.
 *
 * Escape closes it, which nothing in the old UI did.
 * ===================================================================== */

const CATEGORIES: { label: string; emojis: string[] }[] = [
  { label: 'Smileys', emojis: ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇','🥰','😍','🤩','😘','😗','😚','😙','🥲','😋','😛','😜','🤪','😝','🤗','🤭','🤫','🤔'] },
  { label: 'Gestures', emojis: ['👋','🤚','✋','🖐️','👌','🤌','🤏','✌️','🤞','🫰','🤟','🤘','👈','👉','👆','👇','👍','👎','👊','🤛','🤜','👏','🙌','🫶','🙏','💅','💪'] },
  { label: 'Hearts', emojis: ['❤️','🩷','🧡','💛','💚','💙','🩵','💜','🖤','🩶','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝'] },
  { label: 'Objects', emojis: ['🔥','✨','⭐','🌟','💫','💯','🎁','🎀','🌹','🌸','💐','👗','👙','🧦','👠','💋','🍑','🍒','🥂','🍾','💸','💰'] },
];

interface EmojiPickerProps {
  open: boolean;
  recent: string[];
  onSelect: (emoji: string) => void;
  onClose: () => void;
  /** The toggle button. Clicks on it must not count as "outside". */
  anchorRef?: React.RefObject<HTMLElement | null>;
}

export default function EmojiPicker({ open, recent, onSelect, onClose, anchorRef }: EmojiPickerProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target)) return;
      // Excluding the toggle is the whole fix -- see the note above.
      if (anchorRef?.current?.contains(target)) return;
      onClose();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Choose an emoji"
      className="pop-in custom-scrollbar absolute bottom-full left-0 right-0 z-30 mb-2 max-h-64 overflow-y-auto rounded-md border border-line-strong bg-surface-overlay p-3 shadow-overlay sm:right-auto sm:w-80"
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Emoji</span>
        <button
          type="button"
          onClick={onClose}
          className="rounded-sm p-1 text-ink-muted hover:bg-surface-hover hover:text-ink"
          aria-label="Close emoji picker"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>

      {recent.length > 0 && (
        <section className="mb-3">
          <h4 className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-ink-faint">
            <Clock className="h-3 w-3" aria-hidden="true" />
            Recent
          </h4>
          <div className="grid grid-cols-8 gap-0.5">
            {recent.slice(0, 16).map((emoji) => (
              <button
                key={`recent-${emoji}`}
                type="button"
                onClick={() => onSelect(emoji)}
                className="rounded-sm p-1 text-xl leading-none hover:bg-surface-hover"
              >
                {emoji}
              </button>
            ))}
          </div>
        </section>
      )}

      {CATEGORIES.map((category) => (
        <section key={category.label} className="mb-3 last:mb-0">
          <h4 className="mb-1.5 text-[11px] font-medium text-ink-faint">{category.label}</h4>
          <div className="grid grid-cols-8 gap-0.5">
            {category.emojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => onSelect(emoji)}
                className="rounded-sm p-1 text-xl leading-none hover:bg-surface-hover"
              >
                {emoji}
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}