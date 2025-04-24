'use client';

import { useListings } from '@/context/ListingContext';
import { useRequests } from '@/context/RequestContext';
import RequireAuth from '@/components/RequireAuth';

export default function BuyerRequestInboxPage() {
  const { user } = useListings();
  const { getRequestsForUser } = useRequests();

  if (!user || user.role !== 'buyer') return null;

  const requests = getRequestsForUser(user.username, 'buyer');

  return (
    <RequireAuth role="buyer">
      <main className="p-10 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">📨 Your Custom Requests</h1>

        {requests.length === 0 ? (
          <p className="text-gray-500 italic">You haven't sent any custom requests yet.</p>
        ) : (
          <ul className="space-y-6">
            {requests.map((req) => (
              <li
                key={req.id}
                className="border p-4 rounded-lg shadow bg-white dark:bg-black"
              >
                <h2 className="text-lg font-semibold mb-1">{req.title}</h2>
                <p className="text-sm text-gray-500 mb-2">To: {req.seller}</p>
                <p className="mb-3 text-gray-700">{req.description}</p>
                <p className="text-sm mb-2">💰 Offered: ${req.price.toFixed(2)}</p>

                {Array.isArray(req.tags) && req.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {req.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <p className="text-sm text-gray-600 mb-2">
                  Status:{' '}
                  <span
                    className={`font-medium ${
                      req.status === 'pending'
                        ? 'text-yellow-600'
                        : req.status === 'accepted'
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {req.status.toUpperCase()}
                  </span>
                </p>

                {req.response && (
                  <p className="text-sm text-gray-700 mt-2">
                    <strong>Seller Response:</strong> {req.response}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>
    </RequireAuth>
  );
}
