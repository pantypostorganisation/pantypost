'use client';

import { useListings } from '@/context/ListingContext';
import { useRequests, RequestStatus } from '@/context/RequestContext';
import RequireAuth from '@/components/RequireAuth';
import { useState } from 'react';

export default function SellerRequestInboxPage() {
  const { user } = useListings();
  const { getRequestsForUser, respondToRequest } = useRequests();

  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');

  if (!user || user.role !== 'seller') return null;

  const requests = getRequestsForUser(user.username, 'seller');

  const handleRespond = (id: string, status: RequestStatus) => {
    respondToRequest(id, status, responseText);
    setRespondingId(null);
    setResponseText('');
  };

  return (
    <RequireAuth role="seller">
      <main className="p-10 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">📥 Incoming Custom Requests</h1>

        {requests.length === 0 ? (
          <p className="text-gray-500 italic">No custom requests received yet.</p>
        ) : (
          <ul className="space-y-6">
            {requests.map((req) => (
              <li
                key={req.id}
                className="border p-4 rounded-lg shadow bg-white dark:bg-black"
              >
                <h2 className="text-lg font-semibold mb-1">{req.title}</h2>
                <p className="text-sm text-gray-500 mb-2">From: {req.buyer}</p>
                <p className="mb-3 text-gray-700">{req.description}</p>
                <p className="text-sm mb-2">💵 Offered: ${req.price.toFixed(2)}</p>

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

                <p className="text-sm text-gray-600 mb-3">
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

                {req.status === 'pending' && respondingId !== req.id && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => setRespondingId(req.id)}
                      className="text-sm bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
                    >
                      Respond
                    </button>
                    <button
                      onClick={() => handleRespond(req.id, 'declined')}
                      className="text-sm bg-red-500 text-white px-4 py-1 rounded hover:bg-red-600"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => handleRespond(req.id, 'accepted')}
                      className="text-sm bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700"
                    >
                      Accept
                    </button>
                  </div>
                )}

                {respondingId === req.id && (
                  <div className="mt-4">
                    <textarea
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      rows={3}
                      className="w-full border rounded px-3 py-2 mb-2"
                      placeholder="Enter your response or ask for more details"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRespond(req.id, 'accepted')}
                        className="text-sm bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleRespond(req.id, 'declined')}
                        className="text-sm bg-red-500 text-white px-4 py-1 rounded hover:bg-red-600"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => {
                          setRespondingId(null);
                          setResponseText('');
                        }}
                        className="text-sm bg-gray-300 text-black px-4 py-1 rounded hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {req.response && req.status !== 'pending' && (
                  <div className="mt-3 text-sm text-gray-700">
                    <strong>Response:</strong> {req.response}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>
    </RequireAuth>
  );
}
