# Checkout swap-out fix + approval counter

4 files, frontend only. Extract into the repo root; Replace when asked.
All parsed as TS+JSX; the checkout modal typechecked.

## 1. Checkout flashed, then the old address dialog took over

My bug, and an obvious one in hindsight. `CheckoutModal` had this:

```jsx
if (editingAddress) {
  return <AddressConfirmationModal ... />;   // returns INSTEAD of checkout
}
```

When the buyer had no saved address, `editingAddress` flipped true as
soon as the lookup came back -- so checkout rendered for a moment while
the address loaded, then returned a completely different component. From
the buyer's side the order summary simply vanished and was replaced by
the old dialog.

**There is no handoff now.** The address fields live inside checkout. One
dialog, one step: see the item, see the total, fill in the address, press
Confirm purchase.

A second cause was waiting behind it: the post-bid
`AddressConfirmationModal` on the listing page is a fixed z-50 overlay
too, so if a bid prompt were pending it would stack over checkout. It is
now gated on `!checkoutOpen`.

## 2. Wide, two columns

`max-w-md` -> **`max-w-3xl`**, and on desktop the dialog is split:

- **Left:** photo, title, seller, then Item / Platform fee / Total and
  the wallet balance.
- **Right:** the delivery address fields.

Single column on mobile. The button now reads **"Confirm purchase -
$X.XX"** and stays disabled until the address is complete and the balance
covers the total.

**The address is saved BEFORE charging.** If saving fails, nothing is
charged and it says so -- better than taking money for an order that
cannot be posted.

## 3. Approval counter now updates immediately

The header polls `getPendingCounts()` every 60 seconds and on window
focus. Neither helps the admin who just approved something in that same
window: focus never changes, so the badge sat stale for up to a minute
and looked broken.

Approving or denying now dispatches a `pantypost:approval-count-changed`
event and the header refetches at once. A DOM event rather than shared
state because the two components are in unrelated trees, and rather than
a websocket because it only ever needs to reach the tab the admin is
already looking at. The 60s poll and focus refresh stay, since they cover
a second admin working elsewhere.

## Test

**Checkout:** Buy now on a listing -> wide modal, summary left, address
right. It must NOT be replaced by another dialog. Fill in the address ->
Confirm purchase -> charged once. Buy again -> address prefilled.

**Approvals:** open `/admin/approval` with items pending, note the header
badge, approve one -> the badge should drop immediately, not a minute
later.

## Still open

- `PurchaseSection`'s dead `handlePurchase` prop (harmless, but it is
  vestigial now that everything routes through checkout).
- Seller My Listings UI.
- Crypto webhook signature check.
