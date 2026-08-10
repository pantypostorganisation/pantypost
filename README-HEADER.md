# Header: fits on a laptop, rounded rectangles throughout

One file: `src/components/Header.tsx`. Frontend only. Extract into the
repo root; Replace when asked.

## The laptop problem

As admin you carry 11 nav items plus search, balance and the user chip.
At 1366x768 that does not fit, and the row was squeezing the search box.

**No burger.** Instead there is now a laptop tier:

| Width | Behaviour |
|---|---|
| < 768px | burger menu (unchanged) |
| 768–1279px | **icon-only nav** — every item still present, labels visually hidden, tighter padding and gaps |
| 1280px+ | full labels for buyer/seller items, roomier padding |

**Admin nav is icon-only at every width.** Nine admin items with labels
need roughly 2100px before they fit alongside search, balance and the
user chip — so restoring labels at 1280px was never going to work, and at
1900px the row still overflowed: the logo was pushed off the left edge
and Log out off the right. Each admin icon now carries a `title` tooltip,
and the label stays in the accessibility tree via `sr-only`.

Two flex fixes came with it:
- **`shrink-0` on the logo.** Without it flex treats the logo as
  compressible, so once the row overflowed it was squeezed to nothing.
- **`min-w-0` on the right-hand cluster**, so it shrinks rather than
  shoving its siblings out of the header.

Labels use `sr-only xl:not-sr-only`, **not** `hidden`. That matters: a
screen reader still announces "Browse", "Approval", "Withdrawals" on the
icon-only tier, where `hidden` would have stripped the accessible name
off every button in the header.

Also reclaimed: the search box was a fixed 448px — now 220px below xl,
full width above. The "(admin)" suffix beside your username is hidden
below xl, since the crown icon already says it.

## Rounded rectangles everywhere, 33% sharper

Buttons are `rounded-sm` — **8px, down from the original 12px**, which is
exactly a third less round, and it is the next step down your existing
three-radius scale rather than a bespoke value. 27 controls converted,
including the signed-out **Log In** and **Sign Up** buttons and the
mobile burger.

The notifications popover sits one step rounder at `rounded-md` (12px):
a container should not share its children's radius, or the nesting reads
wrong. Circular things — avatars, count badges — stay `rounded-full`.

## Cleaned while in there

- **All 15+ gradient backgrounds flattened.** Each nav item had its own
  `bg-gradient-to-r from-…-900/20 to-…-900/20` plus a coloured border, so
  one navigation row carried six competing colour stories. Now a uniform
  flat surface with a uniform border. **Icon colours are untouched**, so
  Reports is still red, Traffic still blue, Approval still purple — the
  colour coding survives, the background noise does not.
- Raw hex tokenised (`#1a1a1a`, `#222`, `#333`, `#444`, `#ff950e`,
  `#ff6b00`) — the off-family `#ff6b00` is gone, which is a bug per your
  design notes.
- **Sign Up restored as the primary CTA.** Flattening the gradients
  initially turned it into a grey button with black text (invisible); it
  is now a solid `bg-primary` fill with a black label — white on
  `#ff950e` is 2.20:1 and fails AA. Its inline `style={{ color: '#000' }}`
  stays: it is the guard against the unlayered `a {}` rule in
  globals.css. Log In beside it is now a quiet ghost button.

## Verify + ship

```powershell
npx tsc --noEmit
git add src/components/Header.tsx
git commit -m "Header: laptop icon-only tier, rounded rectangles, flatten gradients"
```

Test by dragging the window from wide to ~1300px: labels should drop away
at 1280 and every item stay visible and clickable. Then narrower than
768px, the burger appears as before.

## If you want to tune it

- Labels disappearing too early/late → change `xl:` to `lg:` (1024) or
  `2xl:` (1536) on the `sr-only` spans.
- Want them sharper still → `rounded-sm` to `rounded-none` is the only
  step left; anything between would mean inventing a fourth radius.
- Admin tooltips are already in place (`title` on each item).
- Count badges (Reports/Approval/Messages) are `bg-danger` red; flattening
  the gradients had briefly turned them grey, which defeats the point of
  a notification badge.
- Want the coloured icons neutralised too (one accent, orange only for
  the active page) → that is the next step if the row still reads busy,
  but it needs active-route detection, which the header does not do yet.
