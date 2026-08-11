# Buyer pages: uniform styling + crypto removed

30 files, frontend only. Extract into the repo root; Replace all.
Covers `/wallet/buyer`, `/buyers/dashboard`, `/buyers/my-orders` and the
buyer profile pages.

Every file parsed as TS+JSX before packaging.

## Wallet: crypto is gone

`/wallet/buyer` is now the card flow, full stop. The crypto column was
three layers of choice deep -- a payment-method toggle, then six coins,
each with its own green "CHEAPEST" badge -- sitting next to a single calm
card form. It also carried a "NOWPayments (80% Fee)" label, which reads
alarmingly whatever it means.

The second column now shows Recent Purchases, so the layout keeps its
rhythm instead of leaving a hole.

**`CryptoDepositSection.tsx` and `DirectCryptoDepositSection.tsx` are NOT
in this zip.** They stay on disk untouched and are simply no longer
imported, so bringing crypto back later is a two-line change rather than
a rebuild. Nothing else references them -- they are now dead code, and
you can delete them whenever you are sure.

Also on that page: the success banner used a green tick EMOJI as an icon;
it is now a lucide `Check`, and the orphaned `paymentMethod` state that
the toggle used has been removed.

## Everything else: made uniform

The four pages had drifted a long way from browse/messages/homepage,
which is what you said you like. Fixed across all 30 files:

- **Off-palette colours normalised.** Five rogue oranges were in use
  (`#ffb347`, `#ffb469`, `#ff7a00`, `#ff7b1f`, `#ff5f1f`) plus a lone
  purple avatar ring (`#a855f7`). The palette has exactly three oranges;
  everything now maps to `primary` / `primary-hover` / `primary-press`.
- **Off-palette darks** (`#0c0c0c`, `#0b0b0b`, `#181818`, `#161616`,
  `#020202`, `#050505`) collapsed onto `surface` / `surface-raised` /
  `surface-overlay`.
- **All banned radii gone** -- 100+ instances of `rounded-xl`,
  `rounded-2xl` and `rounded-3xl` stepped down to `rounded-lg` /
  `rounded-md`.
- **All gradients removed** from surfaces (13 of them) -- flat, per the
  design rules.
- **Pills to rounded rectangles**, with genuine circles left alone: the
  sweep only converts a `rounded-full` when the element is NOT square
  (matching `w-N`/`h-N`), so avatars, dots and spinners keep their shape.

## Deliberately unchanged

**`TierBadge.tsx` keeps its six tier colours.** Tease / Flirt / Obsession
/ Desire / Goddess are a deliberate colour system, not drift -- flattening
them to orange would destroy the tier hierarchy. Only its radii and
surfaces were touched.

`#ff950e` survives in a handful of places as an opacity-modified utility
(`ring-[#ff950e]/10`, `shadow-[#ff950e]/30`) -- tokens cannot express
those, so the raw value is correct there.

## Verify + ship

```powershell
npx tsc --noEmit
git add src/app/wallet/buyer/page.tsx src/app/buyers src/components/wallet/buyer src/components/buyers src/components/TierBadge.tsx src/components/StarRating.tsx src/components/ui/Skeleton.tsx
git commit -m "Buyer pages: uniform tokens/radii, remove crypto deposit column"
```

Walk all four pages after deploying -- wallet, dashboard, my-orders,
profile -- plus an order card expanded, since that is the densest thing
in the set.

## Honest caveat

This was a systematic styling pass, not a redesign of each page's
layout. It makes the four pages consistent with browse/messages/homepage
and removes the drift. If a specific page still feels cluttered
STRUCTURALLY -- too many boxes, wrong hierarchy, like the auction section
was -- tell me which one and I will restructure it properly the way I did
the auction card.
