# Explore avatar clipping — actual root cause fixed

Two files, frontend only. Extract into the repo root; Replace all.
Supersedes `pantypost-badge-avatars.zip` and `pantypost-avatars.zip`.

## What the browser told us

```
classes:        ''                                          <- the <img> had NO classes
parentClasses:  'relative w-full h-full object-cover ...'   <- they went to the wrapper DIV
naturalSize:    '611 x 407'
renderedSize:   '56 x 37'                                   <- 37px tall in a 56px circle
```

**`OptimizedImage` applies `className` to its wrapper `<div>`, not to the
`<img>` inside it.** So `w-full h-full` never reached the image. It
rendered at its own aspect ratio — 611x407 is 1.5:1, and 56 / 1.5 = 37px
tall — leaving a 19px empty band at the bottom of the circle. What looked
like a clipped photo was actually empty space.

`object-fit: cover` could not fix it: object-fit only does anything when
the element's box differs from its content, and here the box *was* the
content size. That is why my previous attempt changed nothing.

## The fix

The avatar is now a plain `<img>` with `h-full w-full object-cover
object-center` directly on the image — the same approach your browse card
uses. It fills the circle and crops from the centre.

The two remaining `OptimizedImage` uses on that page (post media, upload
previews) pass `fill`, which is next/image's fill mode — a different
mechanism that positions absolutely and works correctly. Left alone.

## Also included

- Verification badge removed from Explore posts (every seller is verified
  before they can list, and `/verification_badge.png` 404s anyway).
- Homepage cards render the real seller photo at 32px with an
  initial-letter fallback.
- Explore loading skeleton avatar matched to 56px.

## Worth knowing

`OptimizedImage`'s className behaviour will bite anywhere else it is used
WITHOUT `fill` and expected to resize the image. Worth a grep when
convenient:

```powershell
git grep -n "OptimizedImage" -- src | Select-String -NotMatch "fill"
```

## Verify + ship

```powershell
npx tsc --noEmit
git add src/app/explore/page.tsx src/components/homepage/FeaturedRandom.tsx
git commit -m "Explore: fix avatar sizing (OptimizedImage className goes to wrapper), remove verification badge"
```
