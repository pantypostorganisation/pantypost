# Homepage featured cards: one consistent structure

One file: `src/components/homepage/FeaturedRandom.tsx`. Frontend only.
Extract into the repo root so `src/` merges; Replace when asked.

## What was wrong

The two card variants laid out differently, which is why nothing lined
up in your screenshot:

- **Auction cards:** price inside a purple box ABOVE the seller, seller
  alone on the last line.
- **Standard cards:** price on the SAME row as the seller, right-aligned.

Same component, two arrangements. Side by side they agreed on nothing, so
the eye had nowhere to settle.

## Fixed order — identical on both variants

```
image  ->  title  ->  description  ->  price line  ->  seller row
```

- **Seller row is pinned to the bottom** (`mt-auto`) with a hairline
  separator above it, so it reads as the card's footer and sits on the
  same line across a whole row — regardless of how long the title or
  description runs. That is what actually makes the grid look aligned.
- **The description slot has a reserved two-line height**, so a card with
  a short description doesn't ride up relative to its neighbours.
- **Price is in the same place and shape on both.** Auctions no longer
  get their own box — they add a "Current bid" / "Starting bid" label and
  a bid-count line underneath, instead of changing the layout.
- **The grid now stretches items** (`items-stretch`) so every card in a
  row is the same height.
- The auction countdown stays on the image (bottom-left) — the one
  deliberate difference, since it's time-critical and belongs on the
  photo rather than in the text column.

## Drift cleaned while in there

- **All raw hex gone** — the card was on `#1a1a1a`/`#111`/`#131313`/
  `gray-800`/`gray-400` and an off-family `#ffb347`. Now on tokens.
- **Gradients removed** (card background, badges, image scrim, skeletons)
  — flat surfaces per the design rules.
- **`rounded-xl` → `rounded-lg`**, badges to `rounded-sm`.
- Purple auction badge now uses the `auction` token rather than a
  hardcoded purple gradient.
- **Skeleton rewritten to mirror the real card exactly** (square image,
  title, two-line description slot, price, seller footer) so nothing
  shifts when data lands.
- Image ratio is now `aspect-square` at every breakpoint; it was `4/5` on
  mobile and square above, so cards changed proportion at the breakpoint.

## One thing to decide

Your browse card (`src/components/browse/ListingCard.tsx`, the documented
reference pattern) orders it **title -> rating + seller -> price**, i.e.
price last, because price is the decision signal. You asked for the
seller last, which is what this does — so the two surfaces now order
those two elements differently.

Both are defensible; consistency between them matters more than which
wins. Say the word and I'll flip browse to match this, or flip this to
match browse.

## Verify + ship

```powershell
npx tsc --noEmit
git add src/components/homepage/FeaturedRandom.tsx
git commit -m "Homepage cards: single consistent layout, seller pinned to footer, tokens"
```

Frontend only — Vercel deploys on push, no VPS step.

## Note on judging it

Your current listings use a white "TEST" placeholder image, which is why
the tops of the cards look odd. Judge the final spacing against a real
photo — the square crop and the scrim read very differently with actual
product imagery.
