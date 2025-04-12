'use client';

import { useMessages } from '@/context/MessageContext';
import { useListings } from '@/context/ListingContext';
import RequireAuth from '@/components/RequireAuth';

export default function SellerMessagesPage() {
  const { user } = useListings();
  const { getMessagesForSeller } = useMessages();

  const sellerMessages = user ? getMessagesForSeller(user.username) : [];

  return (
    <RequireAuth role="seller">
      <main className="p-8 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">📩 Messages</h1>

        {sellerMessages.length === 0 ? (
          <p className="text-gray-600">You haven’t received any messages yet.</p>
        ) : (
          <div className="space-y-4">
            {sellerMessages.map((msg, index) => (
              <div key={index} className="p-4 bg-white rounded shadow border">
                <p className="text-sm text-gray-500 mb-2">
                  From <span className="font-semibold">{msg.sender}</span> on{' '}
                  {new Date(msg.date).toLocaleString()}
                </p>
                <p className="text-gray-800">{msg.content}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </RequireAuth>
  );
}
