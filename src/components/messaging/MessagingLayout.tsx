// src/components/messaging/MessagingLayout.tsx
'use client';

/* =====================================================================
 * The two-pane shell — responsive in CSS, with ONE tree.
 *
 * This is the fix for the "squished on a laptop" and "flashes the sidebar
 * on a phone" problems, and they were the same root cause: both pages
 * decided the breakpoint in JavaScript.
 *
 *     const [isMobile, setIsMobile] = useState(false);
 *     useEffect(() => setIsMobile(window.innerWidth < 768), []);
 *
 * `false` on the server and on the first client render means the desktop
 * layout always painted first — so a phone rendered a 320px sidebar, then
 * threw it away. And because ConversationView then branched into two
 * completely separate JSX trees, crossing the breakpoint unmounted and
 * remounted the whole subtree, losing scroll position and re-registering
 * every listener.
 *
 * Here both panes are always in the tree and Tailwind decides which is
 * visible. No JS, no flash, no remount, and it reflows continuously as you
 * resize instead of snapping between two hard-coded layouts.
 *
 * Height comes from the parent (ClientLayout pins messaging routes to the
 * viewport), so this never does its own viewport arithmetic. Both pages
 * used to, and both got it wrong in different directions.
 * ===================================================================== */

interface MessagingLayoutProps {
  sidebar: React.ReactNode;
  conversation: React.ReactNode;
  /** Drives which pane is visible on mobile. */
  hasActiveThread: boolean;
}

export default function MessagingLayout({
  sidebar,
  conversation,
  hasActiveThread,
}: MessagingLayoutProps) {
  return (
    <div className="flex h-full min-h-0 w-full overflow-hidden bg-surface">
      {/* List: full width on mobile until a thread is open, then a fixed
          rail from md up. `flex` beats `hidden` at the same breakpoint. */}
      <aside
        className={`h-full min-h-0 w-full shrink-0 flex-col border-r border-line md:flex md:w-72 lg:w-80 ${
          hasActiveThread ? 'hidden' : 'flex'
        }`}
        aria-label="Conversations"
      >
        {sidebar}
      </aside>

      {/* Conversation. min-w-0 is essential: a flex child defaults to
          min-width:auto, so one long unbroken word in a message would
          otherwise widen this column and squeeze the sidebar. The seller
          page was missing exactly this. */}
      <section
        className={`h-full min-h-0 w-full min-w-0 flex-1 flex-col md:flex ${
          hasActiveThread ? 'flex' : 'hidden'
        }`}
        aria-label="Conversation"
      >
        {conversation}
      </section>
    </div>
  );
}
