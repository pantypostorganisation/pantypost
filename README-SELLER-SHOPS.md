# Seller shops were invisible to everyone who was not logged in

2 files, frontend only. Extract into the repo root; Replace when asked.

## The finding

I went looking for why seller shops render "Loading profile..." to a
crawler. The cause is worse than a crawler problem:

```jsx
const { user, sellerUser, ... } = useSellerProfile(username);

if (!user) {
  return <spinner /> "Loading profile...";
}
```

**`user` is the VIEWER, from `useAuth` -- not the seller.**

So `if (!user)` means "if nobody is signed in". A signed-out visitor got
a spinner that could never resolve, because waiting does not sign anyone
in.

**Every logged-out person who followed a link to a seller's shop saw a
permanent loading spinner.** Not just Googlebot -- a real buyer clicking
a creator's link, someone arriving from social, anyone browsing before
they register. On a marketplace whose growth plan is "a creator sends
their audience to their shop", that is the single most expensive bug in
the codebase.

It is also the real reason those pages cannot rank. The metadata work
was correct and necessary, but a crawler still found a spinner behind it.

**The data was never the problem.** `useSellerProfile`'s fetch guards
only on `!username`, so seller data loads perfectly well without a token.
It was purely the render gate.

## The fix

`useSellerProfile` had **no loading flag at all** -- which is why `!user`
was being used as a stand-in. It now exposes `hasLoaded`, set when the
fetch settles regardless of outcome.

The page then distinguishes three real states:

- **still fetching** -> spinner
- **loaded, no such seller** -> "Seller not found" with a way back to
  browse (previously unreachable, because the old gate caught everyone
  first)
- **loaded** -> the shop

## What this does NOT do yet

The page still renders client-side. A crawler now gets the shop instead
of a spinner **once JavaScript runs**, which Google does execute -- but
it is slower to index than server-rendered HTML, and other crawlers do
not run JS at all.

True server-rendering means passing the seller data from the server
wrapper (which already fetches it for `generateMetadata`) down as props.
That is a bigger change and worth doing separately, now that the page
actually renders at all.

## Ship

```powershell
npx tsc --noEmit
git add src/hooks/useSellerProfile.ts "src/app/sellers/[username]/SellerClient.tsx"
git commit -m "Seller shops: fix gate that blocked all logged-out visitors"
```

## Test this one properly

Open an **incognito window** and go to a seller's shop, signed out. You
should see the shop. Before this change you would have seen "Loading
profile..." indefinitely.

Worth trying a URL that does not exist too -- it should say "Seller not
found" rather than spinning.
