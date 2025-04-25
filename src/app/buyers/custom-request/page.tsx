'use client';

import Link from 'next/link';

export default function CustomRequestPage() {
  return (
    <main className="p-10 max-w-xl mx-auto text-center">
      <h1 className="text-3xl font-bold mb-6 text-pink-700">How to Send a Custom Request</h1>
      <div className="mb-8 text-lg text-gray-800">
        <ol className="list-decimal list-inside space-y-3 text-left mx-auto max-w-md">
          <li>
            <b>Go to a listing</b> you’re interested in on the{' '}
            <Link href="/browse" className="text-pink-600 underline">Browse Listings</Link> page.
          </li>
          <li>
            Click the <b>Message [seller username]</b> button.
          </li>
          <li>
            In the chat modal, <b>tick</b> the{' '}
            <span className="inline-block bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded font-semibold">
              Send as custom request
            </span>{' '}
            checkbox.
          </li>
          <li>
            Fill out the <b>Title</b>, <b>Price</b>, <b>Tags</b>, and your <b>Message</b>.
          </li>
          <li>
            Click{' '}
            <span className="inline-block bg-pink-600 text-white px-2 py-0.5 rounded font-semibold">
              Send Request
            </span>
            .
          </li>
        </ol>
      </div>
      <p className="mb-8 text-gray-600">
        All custom requests are now sent directly through the messaging system for a smoother, more secure experience.
      </p>
      <Link
        href="/browse"
        className="inline-block bg-pink-600 text-white px-6 py-2 rounded hover:bg-pink-700 transition"
      >
        Browse Listings
      </Link>
    </main>
  );
}
