# Footer rebuild + one surface for the whole shell

3 files. Frontend only. Parses and typechecks clean.

The footer renders on **every page** (via `ClientLayout`), not just the
homepage -- which is why it is worth structuring properly.

## The background question

You asked whether the footer should be darker, black, or match the page.
It was rendering **lighter than the page above it**, which reads as more
important than it is -- a footer should recede.

"Match the page it is on" cannot be done directly: the footer is a
**sibling of `<main>`**, so a page's own background stops above it. CSS
has no way to ask what the page behind it is using.

So instead the footer now **paints nothing at all** and inherits the app
shell. And the shell moved from raw `bg-black` (`#000000`) to
**`bg-surface`** (`#050505`) -- the same token every page uses.

That matters: before this, the shell and the pages disagreed by five
points of lightness, so anything transparent sitting on the shell was
subtly darker than the page it belonged to. Now the shell, the pages and
the footer are all one token and cannot drift apart. A page that sets its
own background still gets a footer matching the shell rather than a
mismatched slab.

The `LoadingFallback` was changed to match too, or it flashes a slightly
different black before the app paints.

## What else changed in the footer

**Terms and Privacy appeared twice** -- once as "Terms" / "Privacy" in the
top row, again as "Terms of Service" / "Privacy Policy" below. Same
destinations, different labels, a few pixels apart. Deduplicated.

**Fifteen links, all the same orange.** Nothing read as more important
than anything else. Links are now muted and go orange on hover, so orange
means "interactive" rather than decorating everything. The only
permanently orange items are the two that matter in a bad moment:
Contact support and Report content.

**A rotating blurred orange blob** (`animate-spin-medium` on a radial
gradient) ran behind it on every page. Removed -- ambient background
animation is out per the design rules.

**Three labelled columns** -- identity, Explore, Safety & legal --
replacing two flat rows of links followed by four stacked paragraphs.

Tokens throughout, no raw hex, framer-motion dropped.

## The P mark

`public/p-mark.png` -- last night's icon with the black background
removed, beside the wordmark.

Extracting it needed a flood fill from the edges rather than "remove all
black": the envelope outline and the counter of the P are themselves
black, so stripping every dark pixel would have punched holes through the
artwork.

**The P is white, so this asset disappears on a light background.** Fine
in the footer; do not reuse it on anything pale without a dark plate.

## Kept deliberately

**Merchant identification.** Payment processors require the operating
entity to be identifiable on the site itself, not only in the terms -- so
the ABN and trading name stay on every page.

**"Complaints & Content Removal" wording is unchanged.** The original
file notes that the processor's review checks for that exact phrase.

## Ship

```powershell
npx tsc --noEmit
git add src/components/homepage/Footer.tsx src/app/ClientLayout.tsx public/p-mark.png
git commit -m "Footer: transparent, three columns, deduplicated; shell on bg-surface"
```

**Worth a look after deploying:** the shell background change touches
every page. It should be invisible (5 points of lightness), but if any
page looked right against pure black specifically, this is the change
that would show it.
