# Seller shops were invisible to every logged-out visitor

2 files, frontend only. Extract into the repo root; Replace when asked.
Both parse clean.

## What was happening

Your console log gave the whole sequence for a signed-out visitor:

```
/api/users/testseller/profile        -> 200   (data arrives)
/api/users/testseller/profile/full   -> 401
/api/auth/logout                     -> 401
... "Loading profile..." forever
```

1. `getUser()` fetches the **public** profile. It works. The data the
   page needs is now in hand.
2. `getUserProfile()` then calls `/profile/full`, which requires auth. No
   token, so **401**.
3. The api client's interceptor reads that 401 as a session expiry and
   fires a logout.
4. The resulting throw is caught by the outer handler, so
   `setSellerUser()` never runs -- and the page discards data it had
   already successfully fetched.

**Every logged-out person who followed a link to a seller's shop saw a
permanent spinner.** Not just crawlers -- a buyer clicking a creator's
link, anyone arriving from social, anyone browsing before registering. On
a marketplace whose growth plan is "a creator points their audience at
their shop", that is the most expensive bug in the codebase.

## Two fixes

**1. `/profile/full` is only called when there is a token, and its
failure is now non-fatal.** It is an enhancement, not a requirement: the
public endpoint already returns everything the shop page needs, and
`/full` only adds the gallery. It is wrapped in its own try/catch so it
can never take the page down again.

**The backend is right and was not changed.** `/profile/full` returns
email, phone and age-assurance detail to the owner and admins, and a
curated payload to everyone else. That auth requirement is correct -- the
frontend was simply treating an optional call as mandatory.

**2. The render gate was wrong too.** The page did:

```jsx
if (!user) return <spinner /> "Loading profile...";
```

`user` is the VIEWER, from `useAuth` -- not the seller. So it meant "if
nobody is signed in", and returned a spinner that could never resolve.

The hook had **no loading flag at all**, which is why `!user` was being
used as a stand-in. It now exposes `hasLoaded`, so the page can tell:

- still fetching -> spinner
- loaded, no such seller -> "Seller not found" with a way back to browse
  (previously unreachable; a bad URL span forever)
- loaded -> the shop

## Ship

```powershell
npx tsc --noEmit
git add src/hooks/useSellerProfile.ts "src/app/sellers/[username]/SellerClient.tsx"
git commit -m "Seller shops: render for logged-out visitors"
```

## Test

**Incognito window, signed out, open a seller shop.** You should see the
shop -- name, bio, listings. Before this you got "Loading profile..."
indefinitely.

Then try a username that does not exist: "Seller not found", not a
spinner.

Then signed in, to confirm the gallery still loads (that is the part
`/profile/full` adds).

## Still to come

The page renders client-side. Google runs JS so it will index, but true
SSR -- passing the server wrapper's data down as props -- is faster to
index and works for crawlers that do not run JS. Worth doing now that the
page renders at all.
