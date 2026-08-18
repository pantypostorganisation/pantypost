// src/components/homepage/Footer.tsx
'use client';

import Link from 'next/link';
import { FOOTER_LINKS } from '@/utils/homepage-constants';

/* =====================================================================
 * FOOTER
 *
 * What this replaced:
 *
 *  - A rotating, blurred orange blob (`animate-spin-medium`, a 96px-tall
 *    radial gradient) sitting behind everything. Ambient background
 *    animation is out per the design rules, and it ran on every page.
 *
 *  - Duplicate links. Terms and Privacy appeared TWICE -- once in the
 *    top row as "Terms" / "Privacy", again below as "Terms of Service" /
 *    "Privacy Policy". Same destinations, different labels, in the same
 *    region.
 *
 *  - Fifteen links all in the same orange on black, so nothing read as
 *    more or less important than anything else.
 *
 *  - Two rows of links, then four stacked paragraphs, then two more
 *    links -- a flat pile with no grouping.
 *
 * Now: three labelled columns, one accent, and the legal text as a quiet
 * block at the base. Links are muted by default and go orange on hover,
 * so the orange means "you can interact with this" rather than
 * decorating everything at once.
 * ===================================================================== */

/* Links that must be reachable from every page without logging in.
 *
 * The "Complaints & Content Removal" label is required by our payment
 * processor's compliance rules and must not be reworded -- their review
 * checks for this exact wording.
 *
 * Declared here rather than in FOOTER_LINKS so these cannot be removed
 * by an unrelated change to the marketing navigation. */
const COMPLIANCE_LINKS = [
  { href: '/complaints', label: 'Complaints & Content Removal' },
  { href: '/content-policy', label: 'Content Policy' },
  { href: '/age-verification', label: 'Age Verification' },
  { href: '/terms', label: 'Terms of Service' },
  { href: '/privacy', label: 'Privacy Policy' },
];

/* FOOTER_LINKS carries Guides / Terms / Privacy / Help. Terms and
   Privacy are dropped here because COMPLIANCE_LINKS above already lists
   them with their full legal names -- listing both was the duplication
   this rebuild removes. */
const EXPLORE_LINKS = FOOTER_LINKS.filter(
  (link) => !['/terms', '/privacy'].includes(link.href)
);

const HelpCircleIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <path d="M12 17h.01" />
  </svg>
);

const ShieldIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const linkClass =
  'text-sm text-ink-muted transition-colors hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    // No background of its own. The footer is a sibling of <main>, so a
    // page's own background stops above it -- painting one here meant the
    // footer sat as a panel LIGHTER than the page above it, which reads
    // as more important than it is.
    //
    // Transparent, it inherits the app shell (ClientLayout), which is now
    // bg-surface. Footer, shell and pages therefore all sit on one token,
    // and a page that sets its own background still gets a footer that
    // matches the shell rather than a mismatched slab. Separation comes
    // from the hairline alone.
    <footer className="border-t border-line">
      <div className="mx-auto max-w-6xl px-6 py-12 md:px-8">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1.5fr]">
          {/* Identity */}
          <div>
            {/* Transparent so it sits on the footer surface rather than
                in its own black tile -- a black square on a near-black
                background reads as a mistake.

                Plain <img> rather than next/image: a small fixed-size
                asset, so the optimisation pipeline would cost a request
                and gain nothing. */}
            {/* The mark alone, no wordmark beside it. It is no longer
                decorative, so it carries the brand name as its alt text
                rather than being hidden from screen readers. */}
            <img
              src="/p-mark.png"
              alt="Panty Post"
              width={40}
              height={40}
              className="mb-3 h-10 w-10"
            />
            <p className="max-w-xs text-sm leading-relaxed text-ink-faint">
              A discreet marketplace for worn underwear. Every listing reviewed before it goes
              live.
            </p>
          </div>

          {/* Explore */}
          <nav aria-label="Site">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink">Explore</h3>
            <ul className="space-y-2">
              {EXPLORE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={linkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/browse" className={linkClass}>
                  Browse listings
                </Link>
              </li>
            </ul>
          </nav>

          {/* Safety and legal, grouped together because that is how
              someone looking for them thinks about them. */}
          <nav aria-label="Safety and legal">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink">
              Safety &amp; legal
            </h3>
            <ul className="space-y-2">
              {COMPLIANCE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={linkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* The two actions someone in trouble needs, kept prominent and
            separated from the navigation above. */}
        <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 border-t border-line pt-6">
          <Link
            href="/help"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
          >
            <HelpCircleIcon />
            Contact support
          </Link>
          <Link
            href="/complaints"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
          >
            <ShieldIcon />
            Report content
          </Link>
        </div>

        {/* Merchant identification and the safety statement.
            Payment processors require the operating entity to be
            identifiable on the site itself, not only in the terms --
            which is why this stays despite being the least glamorous
            block on the page. Muted, but present on every page. */}
        <div className="mt-8 space-y-2 border-t border-line pt-6 text-xs leading-relaxed text-ink-faint">
          <p>
            &copy; {currentYear} Panty Post (PantyPost). All rights reserved. Operated by G Dykyj
            &amp; O.S Richards, trading as Panty Post &middot; ABN 16 501 428 474 &middot; Australia
            &middot;{' '}
            <a
              href="mailto:support@pantypost.com"
              className="transition-colors hover:text-primary"
            >
              support@pantypost.com
            </a>
          </p>
          <p className="max-w-3xl">
            All users must be 18 or over. Every listing, post and image is reviewed before
            publication. We do not permit content published without the consent of everyone
            depicted. If you believe such content appears here, please use our{' '}
            <Link href="/complaints" className="text-ink-muted underline transition-colors hover:text-primary">
              Complaints &amp; Content Removal
            </Link>{' '}
            process. No account is required.
          </p>
        </div>
      </div>
    </footer>
  );
}
