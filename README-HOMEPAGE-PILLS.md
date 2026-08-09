# Homepage: pills -> rounded rectangles

Three files, frontend only. Extract into the repo root so `src/` merges;
Replace when asked.

## What changed

| File | Change |
|---|---|
| `components/homepage/TrustBadges.tsx` | The four trust chips (Secure & Private / Verified Sellers / Safe Payments / Encrypted): `rounded-full` → `rounded-md` |
| `components/homepage/CTASection.tsx` | Both lower-page CTA buttons: `rounded-full` → `rounded-md` |
| `components/homepage/HeroSection.module.css` | Hero CTA radius `14px` → `0.75rem`, matching `--radius-md` |

## Worth knowing

**The two hero buttons were never pills.** "Browse Listings" and "Start
Selling" were already rounded rectangles at a one-off `14px`. I moved
them to `0.75rem` (12px) so every button on the page sits on your three-
step radius scale instead of a bespoke value — a 2px visual change you
will not notice, but it stops the scale drifting.

**Left alone deliberately:**
- `border-radius: 999px` in `HeroSection.module.css` (~line 115) is the
  *sheen overlay's* shape, not the button's. Changing it would square off
  the moving highlight for no reason.
- Circular icon containers in `FeaturesSection` (the 12×12 icon wells)
  are `rounded-full` on purpose — circles, not pills. Your design rules
  allow `rounded-full` for circular icon buttons.
- The primary CTA's inline `style={{ color: '#000' }}` stays. It looks
  redundant next to `text-black`, but it is the workaround for the
  unlayered `a {}` rule in `globals.css` that would otherwise render an
  orange link-button orange-on-orange (invisible). Do not "clean it up"
  without fixing the cascade layer first.

## Not done (say the word)

`FeaturesSection.tsx` and `page.tsx` skeletons use `rounded-xl` /
`rounded-2xl`, which are outside your three-radius rule. That is real
design drift, but it is card corners rather than pills, so it is a
separate (bigger, more visible) change — I did not fold it into a
"buttons" batch.

## Verify + ship

```powershell
npx tsc --noEmit
git add src/components/homepage/TrustBadges.tsx src/components/homepage/CTASection.tsx src/components/homepage/HeroSection.module.css
git commit -m "Homepage: pills to rounded rectangles, hero radius on token scale"
```

Frontend only — Vercel deploys on push, no VPS step.
