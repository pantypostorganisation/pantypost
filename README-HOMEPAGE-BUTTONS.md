# Homepage buttons: hierarchy, not decoration

Three files, frontend only. Extract into the repo root so `src/` merges;
Replace when asked. **Supersedes `pantypost-homepage-pills.zip`** (that
batch's chip + radius changes are included here).

## The actual problem

The two hero buttons were *identical* — same black fill, same orange
border, same weight. So the page had no primary action, while seller
signup is the stated business priority. "Start Selling" was whispering
at exactly the same volume as "Browse Listings."

## What changed

**Hero (`HeroSection.module.css`)**
- **Start Selling → PRIMARY.** Solid `#ff950e` fill, black label. It is
  now the only filled orange element above the fold, so the eye lands on
  it first. Hover `#ffa733`, press `#e0850d` (your primary-hover /
  primary-press tokens). Flat fill, not a gradient.
- **Browse Listings → SECONDARY (ghost).** Transparent, hairline white
  border, white label; picks up the orange border only on hover.
- **Both bigger:** min-height 3rem → 3.25rem, padding 0.8/1.2rem →
  0.95/1.75rem, label 1.0625rem. The old size read small against a 7xl
  headline.
- **Radius** `14px` → `0.75rem`, matching `--radius-md`, so every button
  on the page shares one scale instead of a bespoke value.
- **Sheen now runs on the PRIMARY only.** It used to sweep across both,
  which made it decoration; on the primary alone it is the one moving
  thing on the page and it points at the action you want. The wrapper
  still measures both buttons for the shared track, so the highlight
  crosses the primary in its correct slice of the cycle — the JS in
  `HeroSection.tsx` is untouched.

**Lower CTA (`CTASection.tsx`)** — same treatment so the page reads
consistently top and bottom: flat orange primary (was an orange
**gradient**, which breaks the "no gradients on surfaces" rule), ghost
secondary, `rounded-md`, same size bump.

**Trust chips (`TrustBadges.tsx`)** — `rounded-full` → `rounded-md`.

## Contrast

Black on `#ff950e` is 9.56:1. White on it is 2.20:1 and fails WCAG AA —
so the primary's label is black everywhere, as your design rules require.

## Do not "clean this up"

`CTASection.tsx` keeps an inline `style={{ color: '#000' }}` on the
primary that looks redundant next to `text-black`. It is not: unlayered
`a {}` rules in `globals.css` beat Tailwind utilities, so an orange
`<Link>` renders orange-on-orange (invisible) without it. It can go once
`globals.css` moves its element selectors into `@layer base`. There is a
comment in the file saying so.

## Noticed, deliberately not changed

`CTASection.tsx` line ~21 has a rotating blurred orange blob
(`animate-spin-medium-reverse`) behind the section. Your design rules say
no ambient background animation. It is not a button, and removing it is a
visible change you did not ask for — say the word and it is a one-line
delete.

## Verify + ship

```powershell
npx tsc --noEmit
git add src/components/homepage/HeroSection.module.css src/components/homepage/CTASection.tsx src/components/homepage/TrustBadges.tsx
git commit -m "Homepage: primary/secondary button hierarchy, flat brand fill, squared corners"
```

Frontend only — Vercel deploys on push, no VPS step.

## If you want to tune it

- Primary feels too loud → drop the glow: remove the `box-shadow` line
  from `.startSellingBtn`.
- Ghost feels too quiet → raise the border to `rgba(255,255,255,0.28)`.
- Want the primary on the LEFT (conventional for a primary action) →
  swap the two `<Button>` blocks in `HeroSection.tsx`; the shine track is
  measured by position, so it re-syncs automatically. I left the order
  alone because the copy speaks to buyers first and the solid fill wins
  attention regardless of side.
