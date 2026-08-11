# Buyer pages: actually simplified

31 files, frontend only. Extract into the repo root; Replace all.
Every file parsed as TS+JSX; the rebuilt dashboard was typechecked
against stubs of the real hook contracts.

The previous pass was a find-and-replace on colours and radii. That did
not make anything simpler, and you were right to call it. This one
deletes things.

## Dashboard: 740 lines -> 306

It had FOUR collapsible sections -- Overview / Connections / Activity /
Insights -- each with a row of "summary pills" restating its own contents
while collapsed, and TWO MORE collapsibles nested inside one of them.
Plus a six-box stats grid, a quick-actions grid, an activity feed, a
subscriptions list, a favourites list and a spending panel.

An accordion of accordions.

**Now:** balance as the hero number, the two actions that matter (Add
funds, Browse), one line of four figures, recent orders, and your sellers
as a row of avatar chips.

Nothing was hidden behind a click. The sections that are gone were
duplicating pages that already exist and are one tap away -- favourites
and subscriptions belong on the profile, spending belongs in the wallet,
orders belong in My Orders.

**Now unused** (still on disk, no longer imported): `DashboardHeader`,
`StatsGrid`, `QuickActions`, `RecentActivity`, `SubscribedSellers`,
`FeaturedListings`.

## My Orders: one list instead of three

- **Orders were split into three sections** -- "Direct purchases",
  "Custom requests", "Auction wins" -- each with its own heading, icon
  tile, count and empty state. Three orders could produce three headings
  with one card each, and the order you wanted was under whichever
  heading matched how you happened to buy it. Now: ONE list, newest
  first, which is how people actually look ("the one I bought Tuesday").
  A filter row appears only when there are more than three orders AND
  more than one kind.
- **The page had TWO headings** -- its own `<header>` saying "My Orders",
  then `<OrdersHeader />` saying it again -- each inside its own bordered
  card with a shadow. Boxes inside boxes. Now one heading.
- **`OrdersHeader`** was a 14x14 icon tile, a "BUYER HUB" pill, a
  gradient-clipped headline, a marketing sentence, and three feature
  cards advertising "Live Tracking / Real-time updates". That is
  landing-page copy on a page you reach only after logging in. It is now
  a title and an order count.
- **`OrderStats`** was three `rounded-3xl` cards, each with a 56px icon
  tile, an uppercase label, a number and a sentence of explanation, in
  three colour families. It is now one line of three figures -- the same
  treatment as the dashboard, so the two pages read as one product.

## Wallet: crypto gone, and it finally has a title

- **Crypto removed.** It was three layers of choice deep -- a method
  toggle, then six coins each with a green "CHEAPEST" badge -- beside one
  calm card form, and labelled "NOWPayments (80% Fee)", which reads
  alarmingly. Recent Purchases now fills that column.
- `CryptoDepositSection` and `DirectCryptoDepositSection` are NOT in this
  zip. They stay on disk, unimported, so restoring crypto is a two-line
  change.
- **The page had no heading at all** -- `WalletHeader` existed but was
  never rendered, so the wallet opened straight into a card graphic. It
  is rendered now, and rewritten: it was a 16x16 icon tile, a "BUYER HUB"
  pill, a 5xl "Digital Wallet" headline, a line about the "premium
  aesthetic", and a second card advertising "Sync with your dashboard".
- The SegPay card graphic is untouched. It is the best thing on the page.
- Success banner used a tick EMOJI as an icon; now a lucide `Check`.
- Width `max-w-7xl` -> `max-w-6xl`, matching the other pages.

## Plus the styling pass (still included)

Five rogue oranges (`#ffb347`, `#ffb469`, `#ff7a00`, `#ff7b1f`,
`#ff5f1f`) and a stray purple avatar ring normalised to the three-colour
palette; six off-palette darks collapsed onto the surface scale; 100+
banned radii stepped down; 13 gradients flattened; pills converted to
rounded rectangles except genuine circles.

`TierBadge` keeps its six tier colours -- that is a deliberate system,
not drift.

## Verify + ship

```powershell
npx tsc --noEmit
```

Then walk the three pages. What you should notice: they now share one
rhythm -- a plain heading, a single row of figures on a hairline border,
then content. No page announces itself, and nothing is wrapped in a card
inside a card.

## Not yet touched

`/buyers/[username]` and `/buyers/profile` got the styling pass but NOT
the structural one -- I wanted you to see this approach on three pages
before I cut into two more. Say the word.
