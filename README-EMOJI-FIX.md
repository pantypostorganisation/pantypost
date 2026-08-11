# Emoji corruption -- fixed, and the cause was my pipeline

One file: `src/components/messaging/EmojiPicker.tsx`. Frontend only.
Extract into the repo root; Replace when asked.

## What happened (this one is on me, not you)

Your bundle showed the answer clearly:

| File | State |
|---|---|
| `src/constants/emojis.ts` | clean |
| `src/components/admin/messages/EmojiPicker.tsx` | clean |
| `src/components/messaging/EmojiPicker.tsx` | **174 mojibake markers** |

The only corrupted file is the one I delivered. The two I never touched
are fine.

**The mechanism:** in Windows PowerShell 5.1, `Get-Content -Raw` WITHOUT
`-Encoding UTF8` reads files using the system ANSI codepage, not UTF-8.
So the old bundle script read good UTF-8 emoji as cp1252 and wrote
mojibake into the .txt. I then patched that mojibake, zipped it, and you
extracted it -- writing the corruption into your repo. The next bundle
corrupted it again, which is why you were seeing DOUBLE mojibake
(`Ã°Å¸Ëœâ‚¬` rather than `ð😀`).

It also explains the stray `â€"` and `â€¢` that had been appearing in
other files: those were em-dashes and bullets from my own comments,
mangled on the round trip.

## The fix

**1. All 100 emoji recovered.** Repaired with `ftfy`, run until stable,
then verified: 0 mojibake markers, all four groups intact
(Smileys 30, Gestures 27, Hearts 21, Objects 22), every literal a valid
emoji, file parses as TS+JSX.

**2. Prose is now pure ASCII.** The single em-dash left in a comment was
replaced with `--`. The ONLY non-ASCII left in the file is the emoji data
itself, so even a mis-encoded read has almost nothing to damage. I will
keep code comments ASCII-only from here on.

**3. You already have the fixed bundle script** -- the one with
`-Encoding UTF8` on `Get-Content`. Keep using that version for every
bundle, not just emoji ones.

## Worth checking

Other files I delivered may carry the same damage from earlier rounds.
This finds them:

```powershell
cd "C:\Users\osr99\OneDrive\Documents\GitHub\pantypost"
Get-ChildItem src -Recurse -Include *.ts,*.tsx |
  Select-String -Pattern 'Ã|â€|ðŸ' -Encoding UTF8 |
  Select-Object Path -Unique
```

Anything listed has mojibake. Send me that list (or the files) and I will
repair them the same way. Most will only be em-dashes in comments --
cosmetic, but worth clearing while we know the cause.

## Verify + ship

```powershell
npx tsc --noEmit
git add src/components/messaging/EmojiPicker.tsx
git commit -m "Fix emoji encoding corruption in messaging picker"
```

Then open the picker in a chat: all four groups should show real emoji,
and picking one should insert it correctly into the composer.
