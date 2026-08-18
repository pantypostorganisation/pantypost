# Blog guides + seller settings

12 files, frontend only. Extract into the repo root; Replace when asked.
All parse as TS+JSX.

## The blog guides

**77 banned radii between them** -- `rounded-xl`, `2xl` and `3xl` -- plus
20 pills, 11 gradients and four raw hex values including `#ff7a00`, an
orange that is not in your palette.

All stepped onto the three-radius scale, pills to rounded rectangles
(genuine circles untouched), hex to tokens.

**I was deliberately conservative here.** A long-form article can carry
more decoration than a wallet screen, so this is a consistency pass, not
a redesign -- the structure, headings and voice are untouched. These are
your only pages that can rank before you have inventory; they needed to
stop looking like a different website, not to be rewritten.

## Seller settings

Ten components swept: hex to tokens, 38 banned radii down the scale,
pills to rounded rectangles, decorative gradients flattened.

## Three invisible-text bugs caught

Flattening a gradient button to a flat surface **keeps the black label**,
which produces a button you cannot read. This happened three times:

- **`TierProgressCard`** -- the "maximum tier achieved" panel
- **`ReferralSection`** -- the numbered step badges
- Both were restored to a solid `bg-primary` fill, where black text is
  9.56:1 and passes AA comfortably.

The same trap appeared in the seller shop batch. It is worth knowing the
signature: `bg-surface-raised ... text-black` is always wrong.

## Also fixed

- **`#ff8c00` and `#ff7a00`** -- two more rogue oranges. The palette has
  exactly three; anything else is drift.
- **A `🎉` emoji** used as an icon in the tier panel, against the design
  rules. Removed rather than swapped, since the text says the same thing.
- Form inputs moved off `bg-black` onto `bg-surface`, so they match the
  page now that surface IS black.

## Two gradients deliberately kept

`TierDetailsModal`'s tier colour ramp and `LocationPrivacyCard`'s subtle
panel -- both are doing real work rather than decorating a surface. The
sweep was written to spare scrims and colour ramps after the seller-shop
batch nearly blacked out a cover photo.

## Ship

```powershell
npx tsc --noEmit
git add src/app/blog src/components/seller-settings
git commit -m "Blog guides and seller settings: tokens, radii, fix invisible buttons"
```

Check the settings page at Goddess tier if you can -- that panel is the
one that was unreadable.

## Not in this batch

`ListingForm.tsx` -- 44KB, the surface sellers spend the most time in. It
has validation, image upload and drop configuration, so it deserves a
proper pass rather than a sweep tacked onto the end of this one.
