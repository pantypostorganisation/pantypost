# Messaging: typing dots stagger + 33% sharper corners

Eight files, frontend only. Extract into the repo root; Replace when asked.
The six messaging files not included here were unaffected.

## 1. Typing dots now run left to right

They were bouncing in unison. My bug, and a subtle one:

```jsx
<span className="typing-dot ... [animation-delay:200ms]" />
```
```css
.typing-dot { animation: typingBounce 1.4s infinite ease-in-out; }
```

`animation` is a **shorthand**, and a shorthand resets every longhand it
covers — including `animation-delay`. Because the scoped `.typing-dot`
rule wins over the utility, all three dots were forced back to delay 0.

The stagger now lives in the scoped CSS, declared after the shorthand so
nothing resets it:

```css
.typing-dot:nth-child(1) { animation-delay: 0ms; }
.typing-dot:nth-child(2) { animation-delay: 180ms; }
.typing-dot:nth-child(3) { animation-delay: 360ms; }
```

180ms spacing against a 1.4s cycle gives a clear left-to-right travel
without the last dot lagging far behind the first.

## 2. Every corner one step sharper

Each radius moved down one step of your three-radius scale — about a
third sharper each time, and no new values invented:

| Was | Now |
|---|---|
| `rounded-lg` (16px) | `rounded-md` (12px) |
| `rounded-md` (12px) | `rounded-sm` (8px) |
| `rounded-sm` (8px) | unchanged — nothing below it but square |

Applies to message bubbles, the composer, custom-request and tip cards,
the conversation header, emoji picker and image modal — including the
corner-specific variants (`rounded-tl-lg` -> `rounded-tl-md`, etc).

`rounded-full` is untouched: avatars, dots and the jump-to-latest pill
are circles by intent, not rounded rectangles.

**Message bubble grouping still works.** Bubbles use asymmetric corners
so consecutive messages from one sender read as a stack — the joined
corners are now `sm` against `md` outer corners, so the effect is
preserved, just tighter.

## Worth a look before you commit

Bubbles are the one place this may go too far — chat bubbles read as
bubbles partly *because* they are round, and at 12px outer / 8px joined
they sit closer to cards than speech. Everything else (composer, cards,
picker) benefits.

If the bubbles specifically feel wrong, revert just their two lines in
`MessageBubble.tsx` (65-66) from `md` back to `lg` and keep the rest
sharp. One edit, no other files involved.

## Verify + ship

```powershell
npx tsc --noEmit
git add src/components/messaging/Composer.tsx src/components/messaging/ConversationHeader.tsx src/components/messaging/CustomRequestCard.tsx src/components/messaging/EmojiPicker.tsx src/components/messaging/ImagePreviewModal.tsx src/components/messaging/MessageBubble.tsx src/components/messaging/TipCard.tsx src/components/messaging/TypingIndicator.tsx
git commit -m "Messaging: stagger typing dots left-to-right, sharpen corners one step"
```

Test the dots by having the other account type for a few seconds — the
bounce should visibly travel left to right, not pulse together.
