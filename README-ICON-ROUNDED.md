# New P icon -- rounded corners (18%)

21 image files. Frontend only. Extract into the repo root and **Replace
all**. No code changes -- `layout.tsx` already points at these paths.

## On the rounding, and why my earlier caution was misplaced

I said not to round them. That was the wrong call, and worth explaining
so it does not confuse anyone later.

The original bug was that the **whole background** was transparent, so
Google composited its own background straight through the middle of the
mark. Rounded corners are a different thing entirely: only the four
corners are cut away.

Verified on the built files: **2.5% of pixels fully transparent** (the
corners), **96.9% fully opaque**. The mark itself is solid black behind
white and orange -- nothing can show through it.

18% radius, which is close to what iOS uses. The mask is drawn at 4x and
downsampled so the curve stays smooth at 32px, where a directly-drawn
rounded rectangle goes visibly jagged.

## Two files deliberately left SQUARE

**`icon-maskable-*.png`** -- Android applies its own mask to these on the
home screen. Rounding an already-rounded icon leaves a visible notch, so
these stay square and opaque with wider padding (24%) to suit Android's
80% safe zone.

**`favicon.ico`** -- the ICO format does not carry alpha reliably in
older browsers, which is the only reason that file still exists. Square
and opaque.

Everything else is rounded.

## Padding: 17%, and it took two attempts

Built at 10% first and the circular crop Google applies **sliced the
top-left of the P's bowl and the bottom of the stem**. The mark has to
fit the INSCRIBED CIRCLE, not the square -- a circle's usable width near
the corners is far smaller than it looks. Verified against a rendered
crop, not estimated.

## Files

| Path | Corners | Used by |
|---|---|---|
| `public/icons/icon-512x512.png` | rounded | **Google Search**, JSON-LD logo |
| `public/icons/icon-192x192.png` | rounded | apple-touch-icon |
| `public/icons/icon-96x96.png` | rounded | browser tabs |
| `public/icons/icon-{72,128,144,152,384}*` | rounded | PWA manifest |
| `public/icons/icon-maskable-*` | **square** | Android home screen |
| `public/favicon.ico` | **square** | older browsers |
| `public/favicon.png`, `public/icon.png` | rounded | legacy paths |
| `public/googlesearchimage.png` | rounded | og:image, social cards |

Skip `googlesearchimage.png` if you would rather keep a more detailed
image for social sharing, where it renders large.

## Ship

```powershell
git add public/icons public/favicon.ico public/favicon.png public/icon.png public/googlesearchimage.png
git commit -m "New P icon, rounded corners"
git push origin main
```

Hard-refresh (Ctrl+Shift+R) for the tab. If it looks unchanged, try an
incognito window -- browsers cache favicons hard. Google takes days to
weeks regardless.
