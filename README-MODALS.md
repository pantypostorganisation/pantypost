# Messaging modals: tokens, sharper corners, dismissal

Three files, frontend only. Extract into the repo root; Replace when asked.

These were the last part of the messaging surface still on the old
styling — deliberately left alone during the rewire so the batch stayed
reviewable. They now match everything around them.

## What changed

**All raw hex gone** — the three modals carried `#1a1a1a`, `#222`,
`#333`, `#444`, `gray-700/800`, and, in two of them, **`#e88800`**: an
orange that is not in the palette at all and which
`design-system-notes.md` names explicitly as a bug ("There is only one
orange family... anything else is a bug"). Everything is on tokens now.

**Corners sharpened to match messaging.** Containers `rounded-xl` (16px)
→ `rounded-lg` (12px); inner controls and buttons → `rounded-md` (8px).
Containers stay one step rounder than their children, per the nested
radius rule.

**Entrance motion.** All three use the `pop-in` class that the emoji
picker, image preview and header menu already use, so overlays across the
app now appear the same way. It is governed by the existing
`prefers-reduced-motion` block.

**Escape closes them**, and **clicking the backdrop closes them**, with
`stopPropagation` on the panel so clicking inside the dialog never
dismisses it. Every other dismissable surface in the app already
supported this; a payment dialog that traps you until you locate the X is
exactly the friction that becomes a support message.

`role="dialog"` and `aria-modal="true"` added on the panels.

## Icons: the broken PNG is gone

`CustomRequestModal` was rendering
`<img src="/Custom_Request_Icon.png">` on top of a white circle. That file
is **not in `public/`** — same as `noise.png`, `verification_badge.png`
and the rest — so it displayed as a broken image on a white dot. That is
almost certainly the "gross" bit.

Your design rules are **lucide-react only, no emoji as icons**, so it is
now a lucide icon in a tinted tile. And since I was there, all three
headers now share one shape:

| Modal | Icon | Why |
|---|---|---|
| Custom Request | `ClipboardList` | same icon as the composer's "Custom request" button |
| Send a Tip | `Gift` | same icon as the composer's "Send tip" button |
| Confirm Payment | `DollarSign` | unchanged |

Each sits in a 40px `rounded-md` `bg-primary-soft` tile with a
`text-primary` glyph, so the three dialogs finally look related.

Two extras this caught:
- `TipModal`'s header icon was `text-pink-500` — a second accent colour
  the palette does not contain.
- Its success confirmation used a heart; it is now a `Check`, which reads
  as "done" rather than decorative.

## Caught while building

Two of the three imported `React` **without** `useEffect`, so adding the
Escape handler would have failed the build. Both imports fixed.

Swapping the icons also orphaned two further `Heart` usages inside
`TipModal` that the import change would have broken. All three files were
verified: parsed with Babel (TS + JSX), checked that every file using
`useEffect` imports it, and checked that every lucide icon referenced is
in that file's import list.

## Left alone on purpose

**The fee breakdown in `CustomRequestModal` is already correct** — it
shows Base Price, Platform Fee (10%) and "Total You'll Pay" as separate
lines, with the total emphasised. That is exactly what a processor wants
to see, so I only re-tokenised its colours and did not restructure it.

`TipModal` correctly states "No platform fees on tips", which matches the
backend.

## Verify + ship

```powershell
npx tsc --noEmit
git add src/components/buyers/messages/CustomRequestModal.tsx src/components/buyers/messages/TipModal.tsx src/components/buyers/messages/PaymentModal.tsx
git commit -m "Messaging modals: tokens, sharper radii, entrance motion, escape/backdrop dismissal"
```

Test each: open from the composer, press **Escape** (should close), click
the dark area outside (should close), click inside the dialog (should
NOT close), then complete a request/tip end to end to confirm nothing in
the flow changed.

## Note

Only styling and dismissal changed — no props, no handlers, no
validation, no money logic touched. The buyer messages page needs no
changes.
