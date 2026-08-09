# Seller avatars: real photos on the homepage, no clipping on Explore

Two files, frontend only. Extract into the repo root so `src/` merges.

**Supersedes** `pantypost-cards.zip` (homepage card) and
`pantypost-explore-follow.zip`'s Explore page — both are included here
with these fixes on top. If you have not applied those yet, this is
still the correct single extract for those two files; the follow batch's
BACKEND files (`models/Follow.js`, `routes/post.routes.js`) are NOT in
this zip and still need to be deployed separately.

## 1. Homepage cards had no seller photo at all

Not a data problem — my omission. The original card only ever rendered
`listing.seller` as text, so when I rebuilt the footer I drew an
initial-letter circle and never checked whether a photo was available.

It is: `GET /api/listings` runs `populateSellerProfile()`, which attaches
`sellerProfile.pic` from the seller's `profilePic`, and the frontend
converter preserves it. The card just was not reading it.

Now:
- Renders the real photo, resolved through `resolveApiUrl()` so relative
  `/uploads/...` paths become absolute (same helper the browse card uses).
- Falls back to the initial-letter circle if there is no photo, or if the
  image 404s (`onError`) — which matters, because `User.profilePic`
  historically defaulted to a dead `via.placeholder.com` URL.
- **Enlarged 24px → 32px** as requested. The skeleton footer matches.

## 2. Explore avatar was clipped flat at the bottom

The wrapper is a fixed 56px circle with `overflow-hidden`, but the image
was `w-full h-full` with no `object-cover` **class** — only an
`objectFit` prop. A non-square photo therefore rendered at its natural
aspect ratio and got cut off across the bottom of the circle: the dark
band in your screenshot.

Fixed with `object-cover object-center` on the image itself, so it fills
the circle and crops from the centre instead of squashing or clipping.
The loading skeleton's avatar was also 48px against a 56px real avatar,
so the header nudged when a post loaded — now matched.

The other two circles on that page (comment author, comment form) are
initial-letter only, no image, so they cannot clip.

## Verify + ship

```powershell
npx tsc --noEmit
git add src/components/homepage/FeaturedRandom.tsx src/app/explore/page.tsx
git commit -m "Avatars: real seller photos on homepage cards, fix Explore avatar clipping"
```

Frontend only — Vercel deploys on push.

## Worth checking after deploy

If some cards still show the initial rather than a photo, that seller
genuinely has no `profilePic`, OR they still hold the dead
`https://via.placeholder.com/150` default flagged in the project docs.
The fallback handles it gracefully either way, but changing that column
default to `null` is still on the debt list.
