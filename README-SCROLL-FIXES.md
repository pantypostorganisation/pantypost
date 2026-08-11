# Messaging: message order + scroll rebound

Two files, frontend only. Extract into the repo root; Replace when asked.

## Bug 2 — a sent message appears ABOVE earlier ones, then drops

`useSellerMessages` merges real and optimistic messages and sorts them
purely on `date`:

```js
combinedMessages.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
```

But an **optimistic** message carries the **browser's** clock, while real
messages carry the **server's**. If your machine is even a few seconds
behind the VPS, the message you just sent sorts *before* messages you
sent moments earlier — so it renders above them. Then the websocket echo
arrives with the real server timestamp and it re-sorts to the end. That
is the jump you are seeing, and it explains why it only affects messages
you send.

**Fix:** optimistic messages are pinned last regardless of timestamp.
They are by definition the newest thing in the thread, so their position
does not need to be inferred from a clock we do not control:

```js
if (aOptimistic !== bOptimistic) return aOptimistic ? 1 : -1;
return new Date(a.date).getTime() - new Date(b.date).getTime();
```

## Bug 1 — the transcript jumps too far, then rebounds

The glide measures its target every frame as
`scrollHeight - clientHeight`. That handles content **growing** mid-flight
(an image decoding) correctly. It did not handle content **shrinking**.

The common trigger: the other person stops typing and their message
arrives at the same moment. The typing indicator fades and unmounts,
removing ~50px — but the glide had already measured the bottom *with* the
indicator present, so it scrolls past where the bottom will end up. When
the indicator goes, the browser clamps `scrollTop` to the smaller
maximum, and the view springs back up. Overshoot, then rebound.

Two fixes:

1. **The glide never eases backwards.** If the recalculated target ends
   up above the current position, it snaps to the new bottom and stops
   rather than animating the transcript upwards. It also lands on the
   exact bottom on completion, instead of wherever the easing finished
   against a target that moved.

2. **A ResizeObserver corrects shrinks instantly.** While pinned to the
   bottom, any reduction in content height re-pins immediately with no
   animation, so there is nothing to see. Growth is deliberately ignored
   — that is what the message and typing-indicator effects animate.

That also covers the same problem from any other collapsing element, not
just the typing indicator.

## Verify

```powershell
npx tsc --noEmit
```

Both files were parsed with Babel (TS + JSX) and `MessageList` was
typechecked against stubs before packaging.

Then on a phone, with two accounts:
- Have the other account type, then send. The transcript should settle
  once, with no overshoot and no spring back.
- Send several messages quickly yourself. Each should appear at the
  BOTTOM immediately and stay there — no hop above the previous message.

```powershell
git add src/components/messaging/MessageList.tsx src/hooks/useSellerMessages.ts
git commit -m "Messaging: pin optimistic messages last; stop scroll overshoot on content shrink"
```

## Important: the buyer hook probably has the same order bug

`useBuyerMessages.ts` was not in the bundle you sent, but it does the same
merge-and-sort. If sending from the BUYER side still shows the hop, send
me that file and I will apply the identical fix. The scroll fix is shared
(both roles render the same `MessageList`), so that half is already done
for both.
