// src/app/content-policy/page.tsx
'use client';

import Link from 'next/link';
import { ShieldCheck, XCircle, Eye, Clock, AlertTriangle } from 'lucide-react';

const LAST_UPDATED = '2 August 2026';

export default function ContentPolicyPage() {
  return (
    <main className="min-h-screen bg-black text-white px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <header className="mb-10">
          <p className="inline-flex items-center gap-2 rounded-full border border-[#ff950e]/40 bg-[#ff950e]/10 px-3 py-1 text-xs font-semibold text-[#ff950e]">
            <ShieldCheck className="h-4 w-4" /> Content Policy
          </p>
          <h1 className="mt-3 text-3xl font-bold">Content Policy &amp; Moderation Controls</h1>
          <p className="mt-2 text-sm text-gray-500">Last updated: {LAST_UPDATED}</p>
          <p className="mt-4 text-gray-400 leading-relaxed">
            This policy sets out what may and may not be published on Panty Post, how content is
            reviewed before it appears, and what happens when this policy is breached. It applies
            to every user, without exception.
          </p>
        </header>

        <div className="space-y-10 text-gray-300 leading-relaxed">
          {/* 1 */}
          <section>
            <h2 className="mb-3 text-xl font-semibold text-white">1. Everything is reviewed before it is published</h2>
            <p>
              Panty Post operates <strong className="text-white">pre-publication moderation</strong>.
              No user-generated content becomes publicly visible until it has been reviewed and
              approved by a platform administrator. This applies to:
            </p>
            <ul className="mt-3 space-y-1.5 pl-5 list-disc marker:text-[#ff950e]">
              <li>Listings, including titles, descriptions, tags and all images</li>
              <li>Posts and any attached media</li>
              <li>Profile pictures, for both buyers and sellers</li>
              <li>Gallery images on seller profiles</li>
            </ul>
            <p className="mt-3">
              Until content is approved it is visible only to the person who submitted it. It does
              not appear in browse, search, feeds or on public profiles, and it cannot be reached
              by a direct link.
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="mb-3 text-xl font-semibold text-white">2. Edits return content to review</h2>
            <div className="rounded-xl border border-[#ff950e]/25 bg-[#ff950e]/5 p-4">
              <p>
                Approval applies to the content that was reviewed — not to the listing or post
                indefinitely. If a user later changes a title, description, tags or any image, the
                item automatically returns to the moderation queue and is withdrawn from public
                view until it is approved again.
              </p>
              <p className="mt-3 text-sm text-gray-400">
                This prevents the most obvious way of circumventing review: publishing acceptable
                content, waiting for approval, then substituting something else.
              </p>
            </div>
            <p className="mt-3">
              Changes that do not affect reviewed content — such as price or availability — do not
              trigger re-review.
            </p>
          </section>

          {/* 3 */}
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-xl font-semibold text-white">
              <XCircle className="h-5 w-5 text-red-400" /> 3. Prohibited content
            </h2>
            <p>The following are prohibited and will be removed. Accounts responsible may be suspended or permanently banned.</p>

            <h3 className="mt-5 mb-2 font-semibold text-white">Absolutely prohibited</h3>
            <ul className="space-y-1.5 pl-5 list-disc marker:text-red-400">
              <li>
                Any content involving, depicting or appearing to depict a person under 18, in any
                context. Suspected material is removed immediately and reported to the relevant
                authorities.
              </li>
              <li>
                Content depicting any person who has not given their informed consent to its
                publication.
              </li>
              <li>Content depicting non-consensual acts, coercion, trafficking or exploitation.</li>
              <li>Content depicting bestiality, incest, or acts causing serious physical harm.</li>
              <li>Sexually explicit imagery. Panty Post is a marketplace for physical items, not an explicit content platform.</li>
              <li>Content depicting or promoting illegal activity.</li>
            </ul>

            <h3 className="mt-5 mb-2 font-semibold text-white">Also prohibited</h3>
            <ul className="space-y-1.5 pl-5 list-disc marker:text-amber-400">
              <li>Bodily fluids other than those naturally present on a worn garment; any item posing a biohazard risk.</li>
              <li>Listings for services rather than physical goods, including any offer of in-person meeting or contact.</li>
              <li>Impersonation of another person, or use of another person&apos;s images.</li>
              <li>Personal information about any individual, including addresses, phone numbers or workplaces.</li>
              <li>Content directing users off-platform to avoid fees or moderation.</li>
              <li>Harassment, hate speech, threats, or content demeaning a protected group.</li>
              <li>Copyright-infringing material, including images the uploader does not own.</li>
              <li>Misleading listings, including images that do not depict the item being sold.</li>
            </ul>
          </section>

          {/* 4 */}
          <section>
            <h2 className="mb-3 text-xl font-semibold text-white">4. Consent of everyone depicted</h2>
            <p>
              Anyone appearing in content uploaded to Panty Post must be 18 or over and must have
              consented to that content being published here. By uploading, a user confirms both.
            </p>
            <p className="mt-3">
              Where content shows anyone other than the seller, the seller must, before uploading,
              verify that person&apos;s identity and age using government-issued photographic
              identification, and obtain their written consent to being depicted, to the content
              being published here, and to it being downloaded where that is possible. Those
              records must be kept for as long as the content remains published and produced to us
              within 48 hours if we ask for them.
            </p>

            <p className="mt-3">
              Sellers confirm this when creating each listing. Content for which consent records
              cannot be produced on request is removed immediately.
            </p>

            <p className="mt-3">
              Consent can be withdrawn at any time. If you appear in content on Panty Post and did
              not consent, or no longer consent, tell us through our{' '}
              <Link href="/complaints" className="text-[#ff950e] hover:underline">
                Complaints &amp; Content Removal
              </Link>{' '}
              process. You do not need an account. Content reported this way is removed from public
              view immediately, before any review takes place.
            </p>
          </section>

          {/* 5 */}
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-xl font-semibold text-white">
              <Eye className="h-5 w-5 text-[#ff950e]" /> 5. Who reviews, and how
            </h2>
            <p>
              Review is carried out by trained platform administrators, not by automated filtering
              alone. Each reviewer sees the full submission — all text and all images — before
              making a decision.
            </p>
            <p className="mt-3">Every decision records:</p>
            <ul className="mt-2 space-y-1.5 pl-5 list-disc marker:text-[#ff950e]">
              <li>Which administrator made it</li>
              <li>The date and time</li>
              <li>The outcome, and for a denial, the reason given to the user</li>
            </ul>
            <p className="mt-3">
              Users are notified of the outcome. Where content is denied, the reason is provided so
              it can be corrected and resubmitted.
            </p>
          </section>

          {/* 6 */}
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-xl font-semibold text-white">
              <Clock className="h-5 w-5 text-[#ff950e]" /> 6. Who may upload
            </h2>
            <p>
              Only registered sellers who have completed identity verification may upload listings
              or gallery images. Verification requires government-issued photographic
              identification, reviewed by a person, and confirms both identity and that the seller
              is 18 or over.
            </p>
            <p className="mt-3">
              Verification confirms who someone is. It does not exempt their content from review —
              verified sellers are moderated on exactly the same basis as everyone else.
            </p>
            <p className="mt-3">
              See our{' '}
              <Link href="/age-verification" className="text-[#ff950e] hover:underline">
                Age Verification Policy
              </Link>{' '}
              for detail on how age is established.
            </p>
          </section>

          {/* 7 */}
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-xl font-semibold text-white">
              <AlertTriangle className="h-5 w-5 text-amber-400" /> 7. Enforcement
            </h2>
            <p>Breaches are handled proportionately, according to seriousness and history:</p>
            <ul className="mt-3 space-y-1.5 pl-5 list-disc marker:text-[#ff950e]">
              <li><strong className="text-white">Denial</strong> — the content is not published; the user is told why and may resubmit.</li>
              <li><strong className="text-white">Removal</strong> — previously approved content is withdrawn following a complaint or review.</li>
              <li><strong className="text-white">Warning</strong> — recorded against the account.</li>
              <li><strong className="text-white">Suspension</strong> — access restricted pending investigation.</li>
              <li><strong className="text-white">Permanent ban</strong> — for serious or repeated breaches.</li>
              <li><strong className="text-white">Referral to authorities</strong> — for content suggesting a criminal offence, including any material involving a minor.</li>
            </ul>
            <p className="mt-3">
              Content involving minors, non-consensual material, or credible threats results in
              immediate removal and permanent ban, with no warning.
            </p>
          </section>

          {/* 8 */}
          <section>
            <h2 className="mb-3 text-xl font-semibold text-white">8. Reporting content</h2>
            <p>
              Anyone can report content, whether or not they hold an account, through our{' '}
              <Link href="/complaints" className="text-[#ff950e] hover:underline">
                Complaints &amp; Content Removal
              </Link>{' '}
              process. Every complaint receives a reference number and is investigated and resolved
              within five business days. Reports of non-consensual content or content involving a
              minor are treated as urgent: the content is withdrawn from public view on receipt,
              before review.
            </p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="mb-3 text-xl font-semibold text-white">9. Record keeping</h2>
            <p>
              We retain identity verification records for all sellers, and a complete record of
              moderation decisions and complaint outcomes. These are held securely, are never
              publicly accessible, and are available to authorised administrators only. They can be
              produced to a payment processor, regulator or law enforcement agency on legitimate
              request.
            </p>
          </section>

          {/* Contact */}
          <section className="rounded-xl border border-white/10 bg-[#0b0b0f] p-5">
            <h2 className="mb-2 text-lg font-semibold text-white">Questions about this policy</h2>
            <p className="text-sm">
              Email{' '}
              <a href="mailto:support@pantypost.com" className="text-[#ff950e] hover:underline">
                support@pantypost.com
              </a>
              . To report specific content, please use the{' '}
              <Link href="/complaints" className="text-[#ff950e] hover:underline">
                complaints process
              </Link>{' '}
              so it is properly logged and tracked.
            </p>
            <p className="mt-3 text-xs text-gray-500">
              Operated by G Dykyj &amp; O.S Richards, trading as Panty Post · ABN 16 501 428 474 · Australia
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}