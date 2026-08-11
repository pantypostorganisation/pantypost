# Messaging: desktop breathing room + composer buttons

Three files, frontend only. Extract into the repo root; Replace when asked.

## 1. Gap below the composer (laptop/desktop)

The composer was `py-3` at every width, so on a desktop window the input
sat almost flush against the bottom edge while the space above it read as
deliberate. From `sm` up it is now `py-5` — the padding grows on **both**
sides, so the gap under the input matches the one above.

Phones keep `py-3`: the on-screen keyboard and the safe-area inset
already account for that space there, and adding more just costs message
rows.

The blocked-conversation notice got the same treatment so the two states
don't jump when you block or unblock someone.

## 2. Tip / Custom request buttons

Now **rounded rectangles on the same surface and border as the message
input** (`bg-surface-overlay` + `border-line`, `rounded-md`) instead of
solid orange pills.

Beyond matching what you asked for, this fixes a hierarchy problem: two
solid orange buttons were competing with the orange send button, so the
composer had three things shouting at once. Now the send button is the
only filled element and the two actions read as part of the same control
group. They still go half-width each on phones as proper touch targets,
and stay compact from `sm` up.

## 3. The "empty and hollow" desktop chat

Two causes, both fixed:

- **The transcript was capped at `max-w-3xl` (768px)** at every size, so
  on a 1920px screen it was a narrow strip down the middle with dead
  space either side. It now steps up: 768px → `lg:max-w-4xl` (896px) →
  `xl:max-w-5xl` (1024px).
- **Bubbles were mobile-sized.** From `sm` up, padding goes `px-3 py-2` →
  `px-4 py-2.5` and text `14px` → `15px`. Small numbers, but it is the
  difference between "phone app stretched wide" and "desktop messenger".

Bubbles still cap at a percentage of the column (72%), so a wider
transcript does not produce uncomfortably long lines.

## Verify + ship

```powershell
npx tsc --noEmit
git add src/components/messaging/Composer.tsx src/components/messaging/MessageList.tsx src/components/messaging/MessageBubble.tsx
git commit -m "Messaging: desktop spacing and width, composer buttons matched to input"
```

## Tuning

- Still too airy at the bottom → `sm:py-5` back to `sm:py-4`.
- Transcript too wide → drop `xl:max-w-5xl`.
- Want the tip/custom buttons more prominent again → swap
  `bg-surface-overlay` for `bg-primary-soft` and `text-ink` for
  `text-primary`; keeps them quieter than the send button but tinted.
