# Orders to fulfil: 710 lines -> 581

One file, frontend only. Extract into the repo root; Replace when asked.
Parsed and typechecked against the real `OrdersSection` prop contract.

## What it was

This is the page a seller uses to get parcels out the door. It had:

- A `rounded-3xl` header panel with a **"FULFILMENT HUB"** label in 0.4em
  tracking, a **pulsing** shopping-bag icon, a gradient refresh button,
  and a backdrop-blurred card announcing "Auto-refreshing every 30
  seconds".
- A second `rounded-3xl` panel just for the status filter, with its own
  uppercase 0.3em heading.
- **THREE separate order sections** -- Direct / Auctions / Custom requests
  -- each with its own heading, gradient icon tile (purple, blue-cyan,
  orange) and empty state.
- A green **"Fulfilment health"** panel restating counts already shown at
  the top, beside an orange gradient "Orders needing addresses" panel.

**Six colour families** -- orange, yellow, blue, green, purple, emerald.

## Now

Heading, one line of three figures, a status filter row, **one list**.

**The three sections are the main change.** How an order was bought is a
detail on the row, not a filing system. Split three ways, three orders
could produce three headings with one row each, and a seller hunting for
"the one I need to post today" had to look in three places. It is now a
single list sorted newest first, which is how you actually look for an
order.

The status filter (All / Awaiting action / In progress / Completed) does
the narrowing, and it still works across everything at once.

**Status badges use the platform's own tokens** -- warning while it waits
on the seller, primary while in progress, success once gone. Was three
blocks in yellow, blue and green: three colour families for what is one
progression.

**"Orders needing addresses" is one line.** It only ever applies to
orders placed before checkout started collecting the address up front, so
it does not need a panel.

## Removed as dead

`OrderStats` (replaced by the figures row), plus the `ListFilter`,
`CheckCircle2`, `Settings` and `Gavel` icons and the `standardCount` /
`customRequestCount` variables -- all of which only fed the old
three-section layout.

`OrdersSection`, `AddressDisplay` and `ShippingControls` are unchanged
and still do the real work.

## Caught while building

I wired the refresh button to `handleManualRefresh` -- a name I made up.
The real loader is `fetchSellerOrders({ silent: false })`. The typecheck
caught it; it would have been a crash on click.

## Verify + ship

```powershell
npx tsc --noEmit
git add src/app/sellers/orders-to-fulfil/page.tsx
git commit -m "Orders to fulfil: one list, tokens, remove duplicate panels"
```

Check with a mix of direct, auction and custom-request orders, and use
the status filter -- the single list is the part worth eyeballing.
