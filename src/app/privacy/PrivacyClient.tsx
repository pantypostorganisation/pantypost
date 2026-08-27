// src/app/privacy/PrivacyClient.tsx
'use client';

import Link from 'next/link';
import { Lock, Database, Share2, UserCheck, Trash2 } from 'lucide-react';

const LAST_UPDATED = '2 August 2026';

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-black text-white px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <header className="mb-10">
          <p className="inline-flex items-center gap-2 rounded-sm border border-[#ff950e]/40 bg-[#ff950e]/10 px-3 py-1 text-xs font-semibold text-[#ff950e]">
            <Lock className="h-4 w-4" /> Privacy
          </p>
          <h1 className="mt-3 text-3xl font-bold">Privacy Policy</h1>
          <p className="mt-2 text-sm text-gray-500">Last updated: {LAST_UPDATED}</p>
          <p className="mt-4 text-gray-400 leading-relaxed">
            This policy explains what personal information Panty Post collects, why, who it is
            shared with, and the rights you have over it. We are an Australian business and comply
            with the Privacy Act 1988 (Cth) and the Australian Privacy Principles.
          </p>
        </header>

        <div className="space-y-10 text-gray-300 leading-relaxed">
          {/* Who we are */}
          <section>
            <h2 className="mb-3 text-xl font-semibold text-white">1. Who we are</h2>
            <p>
              Panty Post is operated by G Dykyj &amp; O.S Richards, trading as Panty Post
              (ABN 16 501 428 474), an Australian partnership. We are the data controller for the
              information described in this policy.
            </p>
            <p className="mt-3">
              Contact:{' '}
              <a href="mailto:support@pantypost.com" className="text-[#ff950e] hover:underline">
                support@pantypost.com
              </a>
            </p>
          </section>

          {/* What we collect */}
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-xl font-semibold text-white">
              <Database className="h-5 w-5 text-[#ff950e]" /> 2. What we collect
            </h2>

            <h3 className="mt-4 mb-2 font-semibold text-white">Account information</h3>
            <ul className="space-y-1.5 pl-5 list-disc marker:text-[#ff950e]">
              <li>Username and email address</li>
              <li>A cryptographically hashed password — we never store or see your actual password</li>
              <li>Country, if you choose to provide it</li>
              <li>Profile biography and picture, if you provide them</li>
            </ul>

            <h3 className="mt-5 mb-2 font-semibold text-white">Identity verification (sellers)</h3>
            <ul className="space-y-1.5 pl-5 list-disc marker:text-[#ff950e]">
              <li>Government-issued photographic identification</li>
              <li>A photograph of you holding a verification code we issue</li>
            </ul>
            <p className="mt-2 text-sm text-gray-400">
              This is sensitive information under the Privacy Act. It is collected only to confirm
              identity and age, is held under the protections described in section 5, and is used
              for no other purpose.
            </p>

            <h3 className="mt-5 mb-2 font-semibold text-white">Transaction information</h3>
            <ul className="space-y-1.5 pl-5 list-disc marker:text-[#ff950e]">
              <li>Purchases, sales, wallet balances and transaction history</li>
              <li>Delivery addresses, where you provide one to complete an order</li>
            </ul>
            <p className="mt-2 text-sm text-gray-400">
              We do not store full card numbers. Card payments are processed by our payment
              provider, who handles that data directly.
            </p>

            <h3 className="mt-5 mb-2 font-semibold text-white">Content and communications</h3>
            <ul className="space-y-1.5 pl-5 list-disc marker:text-[#ff950e]">
              <li>Listings, posts, images and gallery content you upload</li>
              <li>Messages exchanged with other users</li>
              <li>Reviews you write or receive</li>
              <li>Reports or complaints you submit</li>
            </ul>

            <h3 className="mt-5 mb-2 font-semibold text-white">Technical information</h3>
            <ul className="space-y-1.5 pl-5 list-disc marker:text-[#ff950e]">
              <li>IP address, retained for security and abuse prevention</li>
              <li>Browser and device information</li>
              <li>Activity such as login times and pages viewed</li>
            </ul>
          </section>

          {/* Why */}
          <section>
            <h2 className="mb-3 text-xl font-semibold text-white">3. Why we collect it</h2>
            <ul className="space-y-1.5 pl-5 list-disc marker:text-[#ff950e]">
              <li>To operate your account and the marketplace</li>
              <li>To confirm sellers are who they say they are, and are 18 or over</li>
              <li>To review content before publication, as required by our Content Policy</li>
              <li>To process payments and maintain accurate financial records</li>
              <li>To investigate complaints, reports and suspected breaches</li>
              <li>To detect and prevent fraud and abuse</li>
              <li>To meet our legal obligations and those of our payment processors</li>
            </ul>
            <p className="mt-3">
              We do not sell your personal information. We do not use it for advertising profiling.
            </p>
          </section>

          {/* Sharing */}
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-xl font-semibold text-white">
              <Share2 className="h-5 w-5 text-[#ff950e]" /> 4. Who we share it with
            </h2>
            <ul className="space-y-2.5 pl-5 list-disc marker:text-[#ff950e]">
              <li>
                <strong className="text-white">Other users</strong> — only what you choose to make
                public: your username, profile picture, biography, approved content, and any
                delivery address you provide to a seller to fulfil an order.
              </li>
              <li>
                <strong className="text-white">Didit</strong> — our identity and age verification
                provider. When you verify, Didit receives your identity document and the details
                needed to confirm you are over 18 and who you say you are.
              </li>
              <li>
                <strong className="text-white">Segpay</strong> — our payment processor (once
                payments are live). Segpay receives the information required to process
                transactions and meet its compliance obligations, including, on legitimate
                request, evidence that a seller was verified.
              </li>
              <li>
                <strong className="text-white">Vercel</strong> — delivers the website itself and,
                like any host, processes technical data such as your IP address when you load a
                page.
              </li>
              <li>
                <strong className="text-white">Hostinger</strong> — hosts our application server
                and database. Your account data lives on our own server infrastructure with
                Hostinger, not in a third-party database service.
              </li>
              <li>
                <strong className="text-white">Email delivery</strong> — our email provider
                processes your email address to deliver account emails such as verification codes
                and receipts.
              </li>
              <li>
                <strong className="text-white">Law enforcement and regulators</strong> — where we
                are legally required to, or where we reasonably believe disclosure is necessary to
                prevent serious harm. Content involving a minor is reported proactively.
              </li>
            </ul>
            <p className="mt-3 text-sm text-gray-400">
              Some providers are located outside Australia. Where personal information is disclosed
              overseas we take reasonable steps to ensure it is handled consistently with the
              Australian Privacy Principles.
            </p>
          </section>

          {/* Security */}
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-xl font-semibold text-white">
              <Lock className="h-5 w-5 text-[#ff950e]" /> 5. How we protect it
            </h2>
            <ul className="space-y-1.5 pl-5 list-disc marker:text-[#ff950e]">
              <li>All traffic is encrypted in transit using TLS.</li>
              <li>Passwords are hashed and salted; they are never stored in a readable form.</li>
              <li>
                Identity documents are never publicly accessible. They can be viewed only by
                authorised administrators through short-lived links that expire automatically,
                cannot be shared, and are never cached.
              </li>
              <li>Sensitive fields are excluded from all public API responses by default.</li>
              <li>Administrative access is restricted and every action is logged.</li>
            </ul>
            <p className="mt-3">
              If a data breach occurs that is likely to result in serious harm, we will notify
              affected individuals and the Office of the Australian Information Commissioner as
              required by the Notifiable Data Breaches scheme.
            </p>
          </section>

          {/* Retention */}
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-xl font-semibold text-white">
              <Trash2 className="h-5 w-5 text-[#ff950e]" /> 6. How long we keep it
            </h2>
            <ul className="space-y-1.5 pl-5 list-disc marker:text-[#ff950e]">
              <li><strong className="text-white">Account information</strong> — while your account is open, then deleted or anonymised on request.</li>
              <li><strong className="text-white">Identity documents</strong> — the raw images of your identity document are automatically deleted 30 days after a verification decision. The verification record itself (the outcome, date and reviewer) is retained as evidence of the check, and we may retain document evidence for longer where our payment processor’s compliance rules require it.</li>
              <li><strong className="text-white">Transaction records</strong> — seven years, as required by Australian tax and financial record-keeping law.</li>
              <li><strong className="text-white">Moderation and complaint records</strong> — retained to evidence that review and investigation took place.</li>
              <li><strong className="text-white">Messages</strong> — while both accounts remain open.</li>
            </ul>
          </section>

          {/* Rights */}
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-xl font-semibold text-white">
              <UserCheck className="h-5 w-5 text-[#ff950e]" /> 7. Your rights
            </h2>
            <p>Under the Privacy Act you may:</p>
            <ul className="mt-3 space-y-1.5 pl-5 list-disc marker:text-[#ff950e]">
              <li>Ask for a copy of the personal information we hold about you</li>
              <li>Ask us to correct anything inaccurate</li>
              <li>Ask us to delete your information, subject to records we must retain by law</li>
              <li>Withdraw consent for content depicting you to remain published</li>
              <li>Complain about how we have handled your information</li>
            </ul>
            <p className="mt-3">
              Email{' '}
              <a href="mailto:support@pantypost.com" className="text-[#ff950e] hover:underline">
                support@pantypost.com
              </a>{' '}
              and we will respond within 30 days.
            </p>
            <p className="mt-3">
              To request removal of content depicting you, use our{' '}
              <Link href="/complaints" className="text-[#ff950e] hover:underline">
                Complaints &amp; Content Removal
              </Link>{' '}
              process — it is faster and does not require an account.
            </p>
            <p className="mt-3">
              If you are not satisfied with our response, you may complain to the Office of the
              Australian Information Commissioner at oaic.gov.au.
            </p>
          </section>

          {/* Cookies */}
          <section>
            <h2 className="mb-3 text-xl font-semibold text-white">8. Cookies and local storage</h2>
            <p>
              We use browser storage to keep you signed in, remember your preferences, and record
              that you have confirmed your age. We use analytics to understand how the site is used
              in aggregate. We do not use advertising or cross-site tracking cookies.
            </p>
          </section>

          {/* Children */}
          <section>
            <h2 className="mb-3 text-xl font-semibold text-white">9. Children</h2>
            <p>
              Panty Post is strictly for adults aged 18 and over. We do not knowingly collect
              information from anyone under 18. If we become aware that we have, the account is
              closed immediately and the information deleted. See our{' '}
              <Link href="/age-verification" className="text-[#ff950e] hover:underline">
                Age Verification Policy
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-white">10. Changes to this policy</h2>
            <p>
              We will post any changes on this page and update the date above. Material changes
              will be notified to account holders by email.
            </p>
          </section>

          <section className="rounded-lg border border-white/10 bg-[#0b0b0f] p-5">
            <p className="text-sm">
              Questions:{' '}
              <a href="mailto:support@pantypost.com" className="text-[#ff950e] hover:underline">
                support@pantypost.com
              </a>
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

