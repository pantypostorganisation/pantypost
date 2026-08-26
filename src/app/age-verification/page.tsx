// src/app/age-verification/page.tsx
'use client';

import Link from 'next/link';
import { ShieldCheck, UserCheck, Lock, Globe } from 'lucide-react';

const LAST_UPDATED = '2 August 2026';

export default function AgeVerificationPolicyPage() {
  return (
    <main className="min-h-screen bg-black text-white px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <header className="mb-10">
          <p className="inline-flex items-center gap-2 rounded-sm border border-[#ff950e]/40 bg-[#ff950e]/10 px-3 py-1 text-xs font-semibold text-[#ff950e]">
            <ShieldCheck className="h-4 w-4" /> Age Verification
          </p>
          <h1 className="mt-3 text-3xl font-bold">Age Verification Policy &amp; Controls</h1>
          <p className="mt-2 text-sm text-gray-500">Last updated: {LAST_UPDATED}</p>
          <p className="mt-4 text-gray-400 leading-relaxed">
            Panty Post is restricted to adults. This policy explains the minimum age, how age is
            established for each type of user, and how identity documents are handled and
            protected.
          </p>
        </header>

        <div className="space-y-10 text-gray-300 leading-relaxed">
          {/* 1 */}
          <section>
            <h2 className="mb-3 text-xl font-semibold text-white">1. Minimum age</h2>
            <div className="rounded-lg border border-[#ff950e]/25 bg-[#ff950e]/5 p-4">
              <p>
                You must be <strong className="text-white">18 years of age or older</strong> to
                hold an account or use Panty Post in any capacity, as a buyer or a seller.
              </p>
              <p className="mt-3">
                Where the law of a user&apos;s own jurisdiction sets a higher minimum age for
                accessing adult material, that higher age applies to them.
              </p>
            </div>
            <p className="mt-3">
              Anyone appearing in content published on Panty Post must also be 18 or over. See our{' '}
              <Link href="/content-policy" className="text-[#ff950e] hover:underline">
                Content Policy
              </Link>
              .
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-xl font-semibold text-white">
              <UserCheck className="h-5 w-5 text-[#ff950e]" /> 2. Sellers: identity verification
            </h2>
            <p>
              Every seller must complete identity verification before they can list an item or
              upload any image. Verification is mandatory, not optional, and requires:
            </p>
            <ul className="mt-3 space-y-1.5 pl-5 list-disc marker:text-[#ff950e]">
              <li>
                A valid <strong className="text-white">government-issued photographic
                identification document</strong> — passport, driver licence or national identity
                card — showing the holder&apos;s full name and date of birth
              </li>
              <li>
                A <strong className="text-white">photograph of the seller holding a unique code</strong>{' '}
                issued by us at the time of application, confirming the person applying is the
                person shown on the document
              </li>
            </ul>
            <p className="mt-3">
              Both are reviewed by a trained administrator, not by automated matching alone. The
              reviewer confirms the document is valid, the date of birth shows the applicant is 18
              or over, and the person in the code photograph matches the document.
            </p>
            <p className="mt-3">
              Applications are approved or rejected with a recorded reason. Rejected applicants may
              reapply. Attempts are rate limited to deter repeated submission of fraudulent
              documents.
            </p>
          </section>

          {/* 3 */}
          <section>
            <h2 className="mb-3 text-xl font-semibold text-white">3. Buyers: age assurance</h2>
            <p>
              All users must confirm they are 18 or over before accessing the platform, and must
              accept our Terms of Service, which require it.
            </p>
            <p className="mt-3">
              We are implementing{' '}
              <strong className="text-white">third-party age assurance</strong> for buyers, using an
              independent provider. This is designed to meet the standards set out in Australia&apos;s
              Age-Restricted Material Codes and equivalent requirements in the United Kingdom,
              France, Italy and the United States, which require age checks to be accurate, robust,
              fair and reliable, and which do not accept self-declaration alone.
            </p>
            <p className="mt-3">
              Age assurance will be carried out by a specialist provider so that Panty Post does not
              hold the underlying identity or biometric data. We will confirm only whether a user
              meets the age threshold.
            </p>
          </section>

          {/* 4 */}
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-xl font-semibold text-white">
              <Globe className="h-5 w-5 text-[#ff950e]" /> 4. Jurisdictional requirements
            </h2>
            <p>
              The minimum age is 18 everywhere we operate. What varies by jurisdiction is the
              standard of proof required, and we apply the stricter standard where one applies:
            </p>
            <ul className="mt-3 space-y-1.5 pl-5 list-disc marker:text-[#ff950e]">
              <li>
                <strong className="text-white">Australia</strong> — age assurance under the Online
                Safety Act 2021 and the Age-Restricted Material Codes administered by the eSafety
                Commissioner
              </li>
              <li>
                <strong className="text-white">United Kingdom</strong> — highly effective age
                assurance under the Online Safety Act 2023
              </li>
              <li>
                <strong className="text-white">United States</strong> — state age verification laws
                where applicable
              </li>
              <li>
                <strong className="text-white">France and Italy</strong> — national age verification
                requirements for adult services
              </li>
            </ul>
            <p className="mt-3 text-sm text-gray-400">
              We do not rely on location detection to decide a user&apos;s minimum age. A single 18+
              threshold applies to everyone, so the outcome cannot be altered by masking location.
            </p>
          </section>

          {/* 5 */}
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-xl font-semibold text-white">
              <Lock className="h-5 w-5 text-[#ff950e]" /> 5. How identity documents are protected
            </h2>
            <p>
              Identity documents are among the most sensitive information we hold, and are treated
              accordingly:
            </p>
            <ul className="mt-3 space-y-1.5 pl-5 list-disc marker:text-[#ff950e]">
              <li>They are never publicly accessible and cannot be reached by any public URL.</li>
              <li>
                They can be viewed only by authorised administrators, through short-lived access
                links that expire automatically and cannot be shared or reused.
              </li>
              <li>They are excluded from all public profile and API responses.</li>
              <li>They are never cached by browsers or intermediate servers.</li>
              <li>Every access attempt is logged.</li>
            </ul>
            <p className="mt-3">
              Documents are retained only as long as necessary to evidence that verification was
              carried out, as required by our payment processors and by law, and are then securely
              deleted. See our{' '}
              <Link href="/privacy" className="text-[#ff950e] hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </section>

          {/* 6 */}
          <section>
            <h2 className="mb-3 text-xl font-semibold text-white">6. If we believe a user is underage</h2>
            <p>
              If we have reason to believe an account holder is under 18, the account is suspended
              immediately and all associated content is withdrawn from public view pending
              investigation. Where the belief is confirmed, the account is permanently closed and
              its content deleted.
            </p>
            <p className="mt-3">
              Content that appears to involve a person under 18 is removed immediately and reported
              to the relevant authorities. This is not subject to any review window or appeal.
            </p>
            <p className="mt-3">
              To report a suspected underage user or content, use our{' '}
              <Link href="/complaints" className="text-[#ff950e] hover:underline">
                Complaints &amp; Content Removal
              </Link>{' '}
              process. No account is required. These reports are treated as the highest priority.
            </p>
          </section>

          {/* 7 */}
          <section>
            <h2 className="mb-3 text-xl font-semibold text-white">7. Parental controls</h2>
            <p>
              We support parents and guardians in restricting access to adult material. Panty Post
              is labelled for filtering software, and we recommend device-level and
              network-level controls alongside it. Tools and guidance for Australian families are
              published by the eSafety Commissioner.
            </p>
          </section>

          <section className="rounded-lg border border-white/10 bg-[#0b0b0f] p-5">
            <h2 className="mb-2 text-lg font-semibold text-white">Questions about this policy</h2>
            <p className="text-sm">
              Email{' '}
              <a href="mailto:support@pantypost.com" className="text-[#ff950e] hover:underline">
                support@pantypost.com
              </a>
              .
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

