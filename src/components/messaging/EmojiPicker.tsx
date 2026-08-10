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
 *     listened for `mousedown`, and the toggle sat outside the picker Ã¢â‚¬â€ so
 *     mousedown set open=false, then the button's own click flipped the
 *     now-false value back to true. It reopened every time. The button is
 *     passed in as `anchorRef` and excluded from the outside test.
 *  2. Cells were <span onClick>: not focusable, no role, no keyboard.
 *     They are buttons.
 *
 * Escape closes it, which nothing in the old UI did.
 * ===================================================================== */

const CATEGORIES: { label: string; emojis: string[] }[] = [
  { label: 'Smileys', emojis: ['Ã°Å¸Ëœâ‚¬','Ã°Å¸ËœÆ’','Ã°Å¸Ëœâ€ž','Ã°Å¸ËœÂ','Ã°Å¸Ëœâ€ ','Ã°Å¸Ëœâ€¦','Ã°Å¸Â¤Â£','Ã°Å¸Ëœâ€š','Ã°Å¸â„¢â€š','Ã°Å¸â„¢Æ’','Ã°Å¸Ëœâ€°','Ã°Å¸ËœÅ ','Ã°Å¸Ëœâ€¡','Ã°Å¸Â¥Â°','Ã°Å¸ËœÂ','Ã°Å¸Â¤Â©','Ã°Å¸ËœËœ','Ã°Å¸Ëœâ€”','Ã°Å¸ËœÅ¡','Ã°Å¸Ëœâ„¢','Ã°Å¸Â¥Â²','Ã°Å¸Ëœâ€¹','Ã°Å¸Ëœâ€º','Ã°Å¸ËœÅ“','Ã°Å¸Â¤Âª','Ã°Å¸ËœÂ','Ã°Å¸Â¤â€”','Ã°Å¸Â¤Â­','Ã°Å¸Â¤Â«','Ã°Å¸Â¤â€'] },
  { label: 'Gestures', emojis: ['Ã°Å¸â€˜â€¹','Ã°Å¸Â¤Å¡','Ã¢Å“â€¹','Ã°Å¸â€“ÂÃ¯Â¸Â','Ã°Å¸â€˜Å’','Ã°Å¸Â¤Å’','Ã°Å¸Â¤Â','Ã¢Å“Å’Ã¯Â¸Â','Ã°Å¸Â¤Å¾','Ã°Å¸Â«Â°','Ã°Å¸Â¤Å¸','Ã°Å¸Â¤Ëœ','Ã°Å¸â€˜Ë†','Ã°Å¸â€˜â€°','Ã°Å¸â€˜â€ ','Ã°Å¸â€˜â€¡','Ã°Å¸â€˜Â','Ã°Å¸â€˜Å½','Ã°Å¸â€˜Å ','Ã°Å¸Â¤â€º','Ã°Å¸Â¤Å“','Ã°Å¸â€˜Â','Ã°Å¸â„¢Å’','Ã°Å¸Â«Â¶','Ã°Å¸â„¢Â','Ã°Å¸â€™â€¦','Ã°Å¸â€™Âª'] },
  { label: 'Hearts', emojis: ['Ã¢ÂÂ¤Ã¯Â¸Â','Ã°Å¸Â©Â·','Ã°Å¸Â§Â¡','Ã°Å¸â€™â€º','Ã°Å¸â€™Å¡','Ã°Å¸â€™â„¢','Ã°Å¸Â©Âµ','Ã°Å¸â€™Å“','Ã°Å¸â€“Â¤','Ã°Å¸Â©Â¶','Ã°Å¸Â¤Â','Ã°Å¸Â¤Å½','Ã°Å¸â€™â€','Ã¢ÂÂ£Ã¯Â¸Â','Ã°Å¸â€™â€¢','Ã°Å¸â€™Å¾','Ã°Å¸â€™â€œ','Ã°Å¸â€™â€”','Ã°Å¸â€™â€“','Ã°Å¸â€™Ëœ','Ã°Å¸â€™Â'] },
  { label: 'Objects', emojis: ['Ã°Å¸â€Â¥','Ã¢Å“Â¨','Ã¢Â­Â','Ã°Å¸Å’Å¸','Ã°Å¸â€™Â«','Ã°Å¸â€™Â¯','Ã°Å¸Å½Â','Ã°Å¸Å½â‚¬','Ã°Å¸Å’Â¹','Ã°Å¸Å’Â¸','Ã°Å¸â€™Â','Ã°Å¸â€˜â€”','Ã°Å¸â€˜â„¢','Ã°Å¸Â§Â¦','Ã°Å¸â€˜Â ','Ã°Å¸â€™â€¹','Ã°Å¸Ââ€˜','Ã°Å¸Ââ€™','Ã°Å¸Â¥â€š','Ã°Å¸ÂÂ¾','Ã°Å¸â€™Â¸','Ã°Å¸â€™Â°'] },
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
      // Excluding the toggle is the whole fix Ã¢â‚¬â€ see the note above.
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