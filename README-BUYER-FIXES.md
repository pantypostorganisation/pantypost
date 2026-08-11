# Buyer pages: bug fix, black depth, glows gone, flags fixed

33 files, frontend only. Extract into the repo root; Replace all.
Supersedes the previous buyer zip. Everything parsed as TS+JSX; the
dashboard was typechecked against the real hook contracts.

## 1. The $0 balance was a real bug -- and it is not only my page

`useDashboardData` calculates the balance from:

```js
storageService.getItem('wallet_transactions')
```

That is **legacy localStorage** from before wallets moved to the backend.
The key is empty now, so the hook returns 0 for everyone, always. The
wallet page looked right only because it uses a different source:
`useWallet().getBuyerBalance(username)`.

The dashboard now reads that same source, so the two pages cannot
disagree.

**Left for you to decide:** `useDashboardData` still exposes its broken
`balance`, and anything else importing that hook inherits the bug. I did
not rewire a 500-line hook inside a styling batch. Worth fixing properly
-- say the word and I will.

## 2. Black with depth, not grey

You were right, and the cause was mine: my earlier sweep mapped a lot of
different near-blacks onto `surface-raised`, so every panel landed on the
same mid-grey and the page flattened into a field of it.

Fixed at the token level in `globals.css`, so every page inherits it:

| Token | Was | Now |
|---|---|---|
| `surface` (page) | `#0a0a0a` | **`#050505`** |
| `surface-raised` (cards) | `#141414` | **`#0e0e0e`** |
| `surface-overlay` (inputs) | `#1c1c1c` | **`#161616`** |
| `surface-hover` | `#222222` | **`#1e1e1e`** |

Smaller steps against a near-black page: layers read as depth rather than
as grey boxes. Not pure `#000` for the page, because it makes the steps
above it look muddy and causes halation against white text.

**This changes every page on the site, not just these.** It should be an
improvement everywhere, but it is the one change here with site-wide
blast radius -- worth a quick look at browse and messages after deploying.

## 3. The glows are gone

Removed across all 30 components:
- Blurred orange blobs (`bg-primary/10 blur-3xl`) behind the dashboard
  header, the wallet card and the profile panels -- several of them
  `animate-pulse`, so they breathed.
- `shadow-[#ff950e]/30` halos on buttons.
- `shadow-2xl` / `shadow-lg` on flat panels: depth now comes from the
  surface step, not from a drop shadow that is nearly invisible on dark
  anyway.

Your design notes already ruled out ambient decoration; these were
left over from the old styling and I should have caught them in the
first pass.

## 4. "AUAustralia" -- a Windows problem, not a data one

`flagFromIso2` built a flag emoji from Regional Indicator Symbols ('AU'
-> U+1F1E6 U+1F1FA). Rendering that as a flag needs the OS to ship flag
glyphs, and **Windows does not**. Chrome on Windows draws the two
indicator letters instead, so the "flag" rendered as `AU` directly
against `Australia`.

It looks fine on iPhone and broken on the desktop you work from, which is
why it seemed intermittent.

Now the helper returns the **ISO code**, rendered as a small bordered
chip beside the country name: `[AU] Australia`. Consistent on every OS,
no font dependency, no network request.

If you want real flag artwork later, `CountrySelect.tsx` already uses
flagcdn.com PNGs -- but that adds an external image dependency and needs
the CSP `img-src` to allow it.

## 5. A comment was rendering as text on the live page

The wallet page carried this in its JSX children:

```jsx
/* Crypto removed. Card via SegPay is the funding route now... */
```

A `/* */` comment placed among JSX children is **not a comment** -- React
treats it as literal text, so that whole paragraph was visible on the
live page. Comments inside JSX must be wrapped: `{/* ... */}`.

My mistake, and a genuine bug rather than clutter. Fixed, and I scanned
every other file in this batch for the same pattern -- none found.

## 6. Wallet: two columns, one screen

The deposit form is now split left/right, which is what finally kills the
scrolling:

**Left -- how much:** the card graphic, the amount field, the quick
amounts ($25 / $50 / $100 / $200).

**Right -- paying:** cardholder name, the SegPay secure entry panel, the
deposit/fee/total breakdown, the Deposit button and the trust row
(PCI-DSS, 256-bit SSL, Instant Deposit).

Stacked, that ran well past a laptop viewport. Side by side it fits, and
the split matches the two decisions actually being made. It collapses
back to one column below `lg`, so phones are unaffected.

Page width back to `max-w-5xl` to hold the two columns.

## 6b. No containers

The form no longer sits in a panel at all. It was a bordered card
containing two more bordered cards (the SegPay placeholder and the totals
box), inside a page that is already a surface -- boxes within a box.

Removed: the outer `<section>` border and background, the dashed box and
48px icon tile around the SegPay placeholder, and the panel around the
deposit/fee/total summary (now just a hairline rule above it). The
transactions disclosure is a hairline and a row rather than another card.

The only two edges left on the page are the ones that should be there:
the card graphic itself, and the quick-amount buttons.

Structure now comes from the two-column split, one hairline above the
totals, and one above the transactions row. Nothing else.

## 6b2. Trust badges and duplicate copy

The three chips -- "PCI-DSS Compliant", "256-bit SSL", "Instant Deposit"
-- were bordered pills in green, blue and purple. Three more colour
families on a page with one accent, saying the same thing three ways.

Replaced with one quiet line under the form:
**"Fast & secure payments powered by SegPay"**.

That made "Secure payment powered by SegPay" under the "Add funds"
heading redundant, so it went too -- same duplication as the page
subtitle. If you want it back under the heading instead of at the foot,
it is one line to move.

## 6c. Deposit history: 341 lines -> 86

Recent Purchases is gone from the wallet entirely -- purchases are not
deposits, and `/buyers/my-orders` owns them properly.

Deposit history sits behind **"Show recent transactions"**, collapsed by
default, using a native `<details>`: no state, keyboard accessible, and
it only fetches when opened.

Inside it is now **amount and date, nothing else**. It previously had a
48px icon tile, an "All Deposits" headline, a subtitle, a Refresh button,
FOUR stat cards (total / card / crypto / status), type filters, sort
controls, and rows carrying status pills, payment method, network, tx
hash and an explorer link -- all inside a disclosure that already says
what it contains. The crypto stats were doubly redundant now that crypto
is gone from the page.

The one thing kept beyond amount and date: a small Failed/Pending label,
because "where is my money" is the question this list exists to answer.

## 6d. Everything else that was making it tall

Recent Purchases is gone from the wallet entirely -- purchases are not
deposits, and `/buyers/my-orders` already owns them properly. Showing
them here meant the wallet was answering a question nobody asked it.

Deposit history now sits behind **"Show recent transactions"** below the
card, using a native `<details>` element: no state to manage, keyboard
accessible for free, and it only fetches history when you actually open
it.

So the default view is exactly three things: your balance, the card, and
the amount field. Page width dropped from `max-w-6xl` to `max-w-2xl`,
because a single column of content has no business being 1152px wide.

`RecentPurchases.tsx` is no longer imported by the wallet -- it is left
on disk untouched.


It was roughly 1400px of content for about 700px of viewport: page
padding `py-8`, an 8-unit gap stack, a two-column grid with another
8-unit gap, then a full-width deposits panel below all of it.

- The layout is now **one row**: the deposit form on the left (7 parts),
  Recent Purchases and All Deposits stacked on the right (5 parts). The
  deposits panel no longer sits below everything.
- Page padding `py-8` -> `py-6`; gaps `8` -> `5`.
- Panel padding `p-6/sm:p-8` -> `p-5` across all three.
- The card graphic is capped at 380px (was 448px) -- it is the tallest
  single element, and this keeps the amount field and quick-amount
  buttons above the fold on a laptop without shrinking it on mobile.
- The section header lost its 48px icon tile and dropped from `text-2xl`
  to `text-base`: the icon sat directly above a picture of a credit card,
  and "Card Deposit" as a 24px headline was competing with the balance.

## Verify + ship

```powershell
npx tsc --noEmit
```

Check the dashboard balance now matches the wallet, and look at browse
and messages too, since the token change touches every page.

## Still not structurally rebuilt

`/buyers/[username]` and `/buyers/profile` have the styling, the glow
removal and the flag fix -- but not the structural cut I did on the
dashboard and my-orders.
