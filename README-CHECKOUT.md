# Address before payment

9 files. **Backend deploys FIRST** -- there is a new endpoint.

```
# VPS
cd /var/www/pantypost/pantypost-backend
git pull origin main
pm2 restart pantypost-api
```
then push the frontend.

## What was wrong

Money moved before anyone asked where to ship. The address was collected
AFTERWARDS, from a panel on every card in My Orders -- which is why you
have 48 orders sitting on "awaiting shipment" with a "Confirm delivery
address" prompt on each. Auction wins were worse: `auctionSettlement.js`
created the winning order with `deliveryAddress: undefined` outright.

## The design decision

**The address is stored on the BUYER, not per order.** That one choice
solves three problems at once:

- **Bidding:** captured once, right after the first bid. Bid again on
  that auction or any other and it is already there -- never asked twice.
- **Auction settlement:** can attach a real address to the winning order.
- **Checkout:** prefills, so a repeat buyer confirms instead of retyping.

Orders still take their own COPY at purchase time. An order must record
where it was actually sent, and must not change if the buyer later moves.

## Backend

**`models/User.js`** -- `deliveryAddress` subdocument plus a
`hasDeliveryAddress()` method (fullName, line 1, city, postcode and
country required; line 2 and state optional, because plenty of real
addresses have neither).

**`routes/profilebuyer.routes.js`**
- `GET /api/profilebuyer` now returns `deliveryAddress` and
  `hasDeliveryAddress`.
- **`PUT /api/profilebuyer/delivery-address`** (new) -- validates and
  saves. Deliberately its own endpoint rather than part of `PATCH /`: an
  address is a different kind of change from a bio, and mixing them means
  a bio edit could wipe a shipping address.

**`services/auctionSettlement.js`** -- reads the winner's saved address
and copies it onto the order. Tolerant of a missing one: an auction must
still settle and pay the seller, and My Orders keeps its prompt for
anything that slips through (including every order placed before this).

## Frontend

**`services/deliveryAddress.service.ts`** (new) -- get/save/clear with a
one-per-session cache, so the post-bid check is not a round trip on every
bid. It **re-exports** `DeliveryAddress` from `@/types/order` rather than
defining its own -- I did define one at first, and the typecheck caught it
immediately: mine had `state` optional, the canonical one has it
required.

**`components/browse-detail/CheckoutModal.tsx`** (new) -- item, seller,
delivery address (prefilled, editable) and the full price breakdown, with
Confirm disabled until there is a complete address and enough balance.
Item price and platform fee are shown separately, because the listed
price and the charge differ and a buyer discovering that on their
statement is how chargebacks begin.

**`app/browse/[id]/page.tsx`** -- checkout is mounted HERE, at page
level, and this is the important bit:

> **There were three ways to buy on this page** -- PurchaseSection's own
> button, the sticky bar, and the drop claim -- and they took two
> different code paths. A modal owned by one of them would have left the
> others charging cards with no address. Everything now funnels through
> `openCheckout`, and the confirmed address is threaded down through
> `handlePurchase` -> `purchaseListingAndRemove` -> `purchaseListing` ->
> the order.

**`PurchaseSection.tsx`** -- keeps its guards (admin, own listing,
premium lock) and then hands off. It no longer charges anyone itself.

**`useBrowseDetail.ts`** -- `handlePurchase(address?)` forwards the
address; drops carry it too. After a successful bid it checks for a saved
address and raises `needsBidAddress`.

**Address is requested AFTER the bid, never before.** Auctions are won by
seconds; a form in front of the bid would cost people listings. The bid
is already placed and confirmed when the prompt appears, and it cannot
make a successful bid look failed.

## Audit findings (found and fixed after the first build)

I re-traced the whole chain rather than trusting it. Two real problems:

**1. The address was going to the wrong function.** My patch replaced the
first `deliveryAddress: undefined` in `WalletContext.tsx` -- which turned
out to be inside `purchaseCustomRequest`, not `purchaseListing`. Two
consequences, both bad: normal purchases would still have shipped with no
address, AND `purchaseCustomRequest` would have thrown a ReferenceError
on a variable that does not exist in its scope, the first time anyone
paid a custom request. Reverted and applied to the correct function.

**2. The address rules disagreed across four layers.** My new endpoint
treated `state` as optional, but `AddressConfirmationModal` validates it
as required, the `DeliveryAddress` type has it required, and
`PUT /api/orders/:id/address` rejects an address without it. A buyer
could have saved an address that later failed order-level validation --
the sort of inconsistency that only surfaces at the worst moment. All
four now use the same field set.

## Two more caught by your tsc run

**`trackEvent` takes one object, not two arguments.** I wrote
`trackEvent('checkout_started', { listingId })`; the real signature is
`trackEvent({ action, category, label, value })`, as used four other
times in that same file. I should have read one of them instead of
assuming. Now `begin_checkout` and `purchase_confirmed` events in the
`ecommerce` category.

**`DeliveryAddress` was never imported into `ListingContext`.** My patch
script looked for `import { ... } from '@/types/order'` but the file uses
`import type { Order } from '@/types/order'` -- so the replace matched
nothing, silently, while still printing "imported". A no-op replace that
reports success is worse than one that fails loudly; the type annotation
went in with no type behind it.

Both fixed. This is exactly why the repo-level `tsc` run matters -- my
harnesses stub these modules, so neither error could surface there.

## Test

1. **Buy now** on a normal listing -> modal shows item, address, fee,
   total. Confirm -> charged, order has the address.
2. **Buy from the sticky bar** (narrow window / phone) -> same modal.
   This is the path that previously bypassed everything.
3. **Second purchase** -> address is already filled in.
4. **Change** in the modal -> edit, save, and it persists to the next
   purchase.
5. **Place a bid** -> bid succeeds first, THEN the address prompt appears.
   Bid again -> no prompt.
6. **Win an auction** -> the order carries the address (previously
   `undefined`).
7. Wallet with insufficient funds -> Confirm stays disabled.

## Note

Old orders still show "Add delivery address" in My Orders, which is
correct -- they genuinely have none. New orders should not.
