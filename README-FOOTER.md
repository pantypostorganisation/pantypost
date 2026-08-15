# Footer rebuild

One file: `src/components/homepage/Footer.tsx`. Frontend only. Parses and
typechecks clean.

It renders on **every page** (via `ClientLayout`), not just the homepage,
which is why it is worth structuring properly.

## What was wrong

**Terms and Privacy appeared twice.** Once in the top row as "Terms" and
"Privacy", again in the row below as "Terms of Service" and "Privacy
Policy". Same destinations, different labels, a few pixels apart.

**Fifteen links, all the same orange.** Nothing read as more or less
important than anything else, and it was a lot of accent for one region
of the page.

**A rotating blurred orange blob** behind everything --
`animate-spin-medium` on a 96px radial gradient, running on every page.
Ambient background animation is out per the design rules.

**No grouping.** Two rows of links, then four stacked paragraphs, then
two more links. A flat pile.

## Now

**Three labelled columns:** identity, Explore, and Safety & legal. The
compliance links are grouped together because that is how someone
looking for them thinks about them.

**Links are muted by default and go orange on hover**, so orange now
means "you can interact with this" rather than decorating everything at
once. The only permanently-orange items are the two that matter in a bad
moment: Contact support and Report content.

**The duplication is gone** -- Terms and Privacy are filtered out of the
Explore column since Safety & legal already lists them under their full
legal names.

**The legal block is condensed** from four stacked paragraphs to two,
with the entity, ABN and contact email on one line.

Tokens throughout, no raw hex, framer-motion dropped entirely.

## The P mark

`public/p-mark.png` -- the icon from last night, with the black
background removed, sitting beside the wordmark.

Extracting it took a flood fill from the edges rather than "remove all
black": the envelope outline and the counter of the P are themselves
black, so stripping every dark pixel would have punched holes straight
through the artwork. Only black reachable from outside the mark counts as
background.

Transparent rather than the black tile because a black square on a
near-black footer reads as a mistake rather than a logo.

**One thing to know:** the P is white, so this asset **disappears on a
light background**. Fine in the footer, but do not reuse it on anything
pale without an outline or a dark plate behind it.

Plain `<img>` rather than `next/image`: it is a small decorative asset at
a fixed 32px, so the optimisation pipeline would cost a request and gain
nothing. `aria-hidden` because the wordmark sits right beside it and a
screen reader should not announce the brand twice.

## Kept deliberately

**The merchant identification block.** Payment processors require the
operating entity to be identifiable on the site itself, not only in the
terms -- so the ABN and trading name stay on every page despite being the
least glamorous thing on it.

**"Complaints & Content Removal" wording is unchanged.** The original
file carries a comment saying the processor's review checks for that
exact phrase. Not reworded.

## Ship

```powershell
npx tsc --noEmit
git add src/components/homepage/Footer.tsx public/p-mark.png
git commit -m "Footer: three columns, deduplicated links, remove ambient animation"
```

## Note

The mojibake you saw earlier (`┬⌐` for `©`) was PowerShell's console
encoding mangling curl output, **not** the source. This file was clean.
Nothing to fix.
