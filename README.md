# Messaging rewire — install & verify

13 files. Extract this zip into the repo root
(`C:\Users\osr99\OneDrive\Documents\GitHub\pantypost`) so the `src` folder
in the zip merges with the repo's `src`. Windows will ask about replacing
11 existing files — say **Replace** for all. Two files are new
(`ConversationPane.tsx`, and this README which you can delete).

## What this is

Both messaging pages now render the **shared** component set in
`src/components/messaging/` instead of the two old duplicate trees. One UI,
role differences expressed as props: buyers get TIP / CUSTOM REQUEST
buttons, sellers don't. Plus the motion system from the implementation
brief: new messages fade in with a few pixels of travel and the stack
glides — never snaps.

## Files

| File | Change |
|---|---|
| `src/components/messaging/ConversationPane.tsx` | **NEW** — assembles header + transcript + typing + composer; owns websocket typing/focus, presence, read-marking, the unread divider |
| `src/components/messaging/MessageList.tsx` | rewritten — glide scrolling (custom eased scroll, cancelled by any user input), entrance animations, incoming avatar gutter, single IntersectionObserver read-marking |
| `src/components/messaging/TypingIndicator.tsx` | rewritten on tokens (was purple-pink gradient + raw hex); soft enter/leave |
| `src/components/messaging/ImagePreviewModal.tsx` | rewritten on tokens (was red-500 close button); entrance motion |
| `src/components/messaging/CustomRequestCard.tsx` | inline counter-offer form; turn fallback when `pendingWith` missing; buyer Pay button shows fee-inclusive total |
| `src/components/messaging/Composer.tsx` | delegated emoji mode (prevents double-insert with the hooks); TIP/CUSTOM chips restyled as primary-tinted pills; 250-char cap with a **visible** counter |
| `src/components/messaging/ConversationHeader.tsx` | avatar+name click → seller shop (buyer role); menu entrance motion |
| `src/components/messaging/EmojiPicker.tsx` | dark scrollbar + entrance motion |
| `src/components/messaging/transcript.ts` | + `getConversationKey` (sorted RAW usernames — fixes dropped typing events) and `collapseSupersededRequests` (one card per negotiation) |
| `src/components/messaging/index.ts` | exports updated |
| `src/app/buyers/messages/page.tsx` | rewired; keeps the 3 buyer modals with unchanged contracts |
| `src/app/sellers/messages/page.tsx` | rewired; normalises this hook's `{pic, verified}` profile shape |
| `src/app/globals.css` | + Firefox dark scrollbar; + messaging motion keyframes (all governed by the existing `prefers-reduced-motion` block) |

## Verify (run from repo root)

```powershell
npx tsc --noEmit
```
(2–4 min. `next.config.ts` ignores build errors, so this is the only real guard.)

Then `npm run dev` and, logged in as **both** roles:

1. Open a thread → transcript appears **already at the bottom**, no scroll animation, page itself never scrolls.
2. Scroll up, have the other account send → a "1 new message" pill appears; you are **not** yanked down. Click it → smooth glide.
3. Send a message → it fades in from the right and the stack glides up.
4. Other account types → "is typing" fades in above the composer with their avatar; fades out on stop.
5. Incoming messages sit LEFT with the sender's avatar once per group; yours sit RIGHT with the orange tint; one tick/double-tick on your **latest** message only.
6. Custom request: seller taps **Counter** → inline form in the card → submit → buyer sees the counter, stale cards are collapsed to one. Accept as buyer → **Pay $X.XX** shows the fee-inclusive total.
7. Buyer sends a tip → renders as a green card for **both** sides.
8. Block from the header menu → composer is replaced by a notice with an inline Unblock.
9. Mobile width: list ↔ conversation switch, back arrow works, site header hides while a thread is open.
10. Emoji picker: opens/closes from its own button, has recents, dark scrollbar.

## Stage (never `git add -A`)

```powershell
git add src/components/messaging/transcript.ts src/components/messaging/TypingIndicator.tsx src/components/messaging/ImagePreviewModal.tsx src/components/messaging/CustomRequestCard.tsx src/components/messaging/Composer.tsx src/components/messaging/ConversationHeader.tsx src/components/messaging/MessageList.tsx src/components/messaging/ConversationPane.tsx src/components/messaging/index.ts src/components/messaging/EmojiPicker.tsx src/app/buyers/messages/page.tsx src/app/sellers/messages/page.tsx src/app/globals.css
git commit -m "Messaging: wire both pages onto shared component set with motion system"
```

Push to **origin** only. Frontend deploys via Vercel on push; no backend
change in this batch.

## Do NOT delete yet

`components/buyers/messages/*` (except the 3 modals, still used),
`components/seller/messages/*`, and `messaging/MessageInput.tsx` /
`messaging/VirtualMessageList.tsx` are now dead **as far as messaging is
concerned**, but check nothing else imports the last two first:

```powershell
git grep -l "messaging/VirtualMessageList" ; git grep -l "messaging/MessageInput"
```

If both come back empty, they can all go in a cleanup commit (~75KB).
The old ConversationViews still compile against the new TypingIndicator /
ImagePreviewModal by design, so nothing breaks in the meantime.

## Brief coverage / honest gaps

Met: left/right model, grouping, entrance + stack-glide motion (no
Framer Motion needed — CSS + one small eased scroll), optimistic sends,
no-yank + "new messages" pill, typing in/out, read state on last own
message, date separators, clickable header identity, reduced-motion
respected, laptop-height two-pane layout.

Deliberately not done (needs backend/data-layer work that doesn't exist):
older-message pagination (§18 — hooks load whole threads), reactions
(§14), replies (§15), in-conversation search (§5). "Plum/pink" from the
brief was overridden by the locked design system — outgoing bubbles use
the brand's low-alpha **orange** tint, which is the brief's intent
("tasteful accent tint") in Panty Post's actual colours.

## Known follow-ups

- The three buyer modals (tip / payment / custom request) still use the
  old styling — functional, contracts unchanged, restyle next session.
- ThreadList has no loading flag from the hooks, so an empty list says
  "No conversations yet" during the very first fetch.
- Retry-send UI exists in MessageBubble but the hooks don't expose a
  retry action yet.
- `handleConfirmPay` in the buyer hook still uses `alert()` for
  insufficient balance.
- Admin messages page not yet migrated to the shared set.
- Typing indicator's *removal* collapses its height instantly after the
  fade (only visible if typing stops without a message arriving).
