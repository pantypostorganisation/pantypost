# Explore: sticky nav bar pinned correctly

Two files, frontend only. Extract into the repo root; Replace all.
Supersedes `pantypost-avatar-fix.zip` (that batch's fixes are included).

## What was wrong

The bar was `sticky top-16` — a 64px offset that assumed a fixed site
header above it. But the header (`ClientLayout` -> `Header`) is
`relative`, so it scrolls away with the page. The bar therefore pinned
64px BELOW the top of the window, leaving a gap with post images
scrolling through it — exactly what your screenshot shows.

## Now

`sticky top-0`, which gives precisely the two states you described:

**At the top of the page**
```
[Header]
(space)
[Nav bar]
[Posts]
```

**Scrolled down**
```
[Nav bar]   <- pinned flush to the top of the window
[Posts]     <- passing underneath
```

Pure CSS sticky — no scroll listener, no JS measurement, so there is
nothing to fall out of sync and nothing that can fight the header. Works
identically on mobile, tablet and desktop.

Also:
- `z-30` (was `z-20`) so it sits above post media badges but well below
  modals, which use z-50/z-100.
- Background `bg-surface/95`, dropping to `/80` only where the browser
  actually supports `backdrop-filter`, so text stays readable over
  scrolling images rather than ghosting through.
- A hairline shadow so the pinned bar reads as a layer above the feed.

## Also included

- Avatar rendered as a plain `<img>` (OptimizedImage applies className to
  its wrapper div, not the image — that was the real cause of the
  clipping).
- Verification badge removed from Explore posts.
- Homepage cards show the real seller photo at 32px.

## Verify + ship

```powershell
npx tsc --noEmit
git add src/app/explore/page.tsx src/components/homepage/FeaturedRandom.tsx
git commit -m "Explore: pin filter bar to viewport top; avatar and badge fixes"
```

Frontend only — Vercel deploys on push.
