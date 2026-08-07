// src/components/messaging/Composer.tsx
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ImagePlus, Smile, ArrowUp, X, Loader2, Gift, ClipboardList } from 'lucide-react';
import EmojiPicker from './EmojiPicker';

/* =====================================================================
 * One composer, replacing four (two of which were dead code, and the two
 * live ones ~95% identical — down to a Discord-blurple #4752e2 focus ring
 * that appears nowhere else in the product).
 *
 * Fixes carried over from the review:
 *  - Enter-to-send is onKeyDown. The live seller composer used the
 *    deprecated onKeyPress.
 *  - The textarea grows to a readable height instead of a 2-3 line
 *    porthole with an inner scrollbar.
 *  - The character counter is visible as you approach the cap; the old one
 *    silently truncated at 250 with `characterCount={false}`.
 *  - `relative` lives on this wrapper, so the emoji panel always has a
 *    positioned ancestor. On mobile the seller's did not, and the picker
 *    anchored to the viewport and rendered off the top of the screen.
 * ===================================================================== */

const MAX_LENGTH = 1000;
const COUNTER_FROM = 850;

interface ComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  /** Replaces the whole composer, e.g. when a user is blocked. */
  notice?: React.ReactNode;
  placeholder?: string;
  recentEmojis?: string[];
  onEmojiUsed?: (emoji: string) => void;
  onImageSelected?: (file: File) => void;
  imagePreview?: string | null;
  onClearImage?: () => void;
  isUploading?: boolean;
  /** Buyer-only extras. Omitted for sellers and admins. */
  onRequestCustom?: () => void;
  onSendTip?: () => void;
  error?: string | null;
}

export default function Composer({
  value,
  onChange,
  onSend,
  disabled = false,
  notice,
  placeholder = 'Type a message',
  recentEmojis = [],
  onEmojiUsed,
  onImageSelected,
  imagePreview,
  onClearImage,
  isUploading = false,
  onRequestCustom,
  onSendTip,
  error,
}: ComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const [emojiOpen, setEmojiOpen] = useState(false);

  // Grow with content, up to a sensible ceiling.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [value]);

  const canSend = (value.trim().length > 0 || Boolean(imagePreview)) && !disabled && !isUploading;

  const send = useCallback(() => {
    if (!canSend) return;
    onSend();
    // Keep focus without the browser scrolling the page to find it.
    requestAnimationFrame(() => textareaRef.current?.focus({ preventScroll: true }));
  }, [canSend, onSend]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      send();
    }
  };

  const insertEmoji = (emoji: string) => {
    const el = textareaRef.current;
    if (!el) {
      onChange((value + emoji).slice(0, MAX_LENGTH));
    } else {
      const start = el.selectionStart ?? value.length;
      const end = el.selectionEnd ?? value.length;
      const next = (value.slice(0, start) + emoji + value.slice(end)).slice(0, MAX_LENGTH);
      onChange(next);
      requestAnimationFrame(() => {
        el.focus({ preventScroll: true });
        const caret = start + emoji.length;
        el.setSelectionRange(caret, caret);
      });
    }
    onEmojiUsed?.(emoji);
  };

  if (notice) {
    return (
      <div className="shrink-0 border-t border-line bg-surface px-4 py-4 safe-bottom">
        <div className="mx-auto max-w-3xl text-center text-sm text-ink-muted">{notice}</div>
      </div>
    );
  }

  return (
    // `relative` is load-bearing: the emoji panel is absolutely positioned
    // against it. See the note at the top of this file.
    <div className="relative shrink-0 border-t border-line bg-surface px-3 py-3 safe-bottom sm:px-4">
      <div className="mx-auto w-full max-w-3xl">
        <EmojiPicker
          open={emojiOpen}
          recent={recentEmojis}
          onSelect={insertEmoji}
          onClose={() => setEmojiOpen(false)}
          anchorRef={emojiButtonRef}
        />

        {imagePreview && (
          <div className="mb-2 inline-flex items-center gap-2 rounded-md border border-line bg-surface-raised p-2">
            <img src={imagePreview} alt="" className="h-14 w-14 rounded-sm object-cover" />
            <button
              type="button"
              onClick={onClearImage}
              className="rounded-sm p-1 text-ink-muted hover:bg-surface-hover hover:text-ink"
              aria-label="Remove attached image"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}

        {error && (
          <p role="alert" className="mb-2 text-sm text-danger">
            {error}
          </p>
        )}

        <div className="flex items-end gap-2 rounded-lg border border-line bg-surface-overlay px-2 py-1.5 focus-within:border-primary">
          {onImageSelected && (
            <>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) onImageSelected(file);
                  event.target.value = '';
                }}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={disabled || isUploading}
                className="rounded-md p-2 text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink disabled:opacity-50"
                aria-label="Attach an image"
              >
                {isUploading ? (
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                ) : (
                  <ImagePlus className="h-5 w-5" aria-hidden="true" />
                )}
              </button>
            </>
          )}

          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            disabled={disabled}
            maxLength={MAX_LENGTH}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            aria-label="Message"
            className="max-h-40 flex-1 resize-none bg-transparent py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-none disabled:opacity-50"
          />

          <button
            ref={emojiButtonRef}
            type="button"
            onClick={() => setEmojiOpen((open) => !open)}
            disabled={disabled}
            aria-expanded={emojiOpen}
            aria-label="Insert emoji"
            className="rounded-md p-2 text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink disabled:opacity-50"
          >
            <Smile className="h-5 w-5" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={send}
            disabled={!canSend}
            aria-label="Send message"
            className="rounded-full bg-primary p-2 transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            {/* Label colour lives on a child: globals.css declares
                `a { color: … }` unlayered, and an unlayered rule beats a
                Tailwind utility. Icons here are inside a <button>, which
                nothing unlayered targets — but keeping the pattern
                consistent avoids the trap when this becomes a link. */}
            <ArrowUp className="h-4 w-4 text-black" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-1.5 flex items-center gap-2">
          {onRequestCustom && (
            <button
              type="button"
              onClick={onRequestCustom}
              disabled={disabled}
              className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-xs font-medium text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink disabled:opacity-50"
            >
              <ClipboardList className="h-3.5 w-3.5" aria-hidden="true" />
              Custom request
            </button>
          )}
          {onSendTip && (
            <button
              type="button"
              onClick={onSendTip}
              disabled={disabled}
              className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-xs font-medium text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink disabled:opacity-50"
            >
              <Gift className="h-3.5 w-3.5" aria-hidden="true" />
              Send tip
            </button>
          )}

          {value.length >= COUNTER_FROM && (
            <span
              className={`ml-auto text-[11px] tabular-nums ${
                value.length >= MAX_LENGTH ? 'text-danger' : 'text-ink-faint'
              }`}
            >
              {value.length}/{MAX_LENGTH}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
