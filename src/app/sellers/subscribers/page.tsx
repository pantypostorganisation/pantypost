// src/app/sellers/subscribers/page.tsx
'use client';

import BanCheck from '@/components/BanCheck';
import { useListings } from '@/context/ListingContext';
import RequireAuth from '@/components/RequireAuth';
import { useMessages } from '@/context/MessageContext';
import { useState } from 'react';

export default function SellerSubscribersPage() {
  const { user, subscriptions, users } = useListings();
  const { sendMessage } = useMessages();
  const [messageModal, setMessageModal] = useState<string | null>(null);
  const [messageContent, setMessageContent] = useState('');
  const [messageSent, setMessageSent] = useState(false);

  if (!user || user.role !== 'seller') return null;

  // Find all buyers who have subscribed to this seller
  const subscribers: string[] = Object.entries(subscriptions)
    .filter(([_, sellers]) => Array.isArray(sellers) && sellers.includes(user.username))
    .map(([buyer]) => buyer);

  return (
    <BanCheck>
      <RequireAuth role="seller">
        <main className="p-10 max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">🧾 Your Subscribers</h1>
          {subscribers.length === 0 ? (
            <p className="text-gray-500 italic">No subscribers yet.</p>
          ) : (
            <ul className="space-y-4">
              {subscribers.map((buyer) => (
                <li
                  key={buyer}
                  className="border rounded p-4 shadow bg-white dark:bg-black flex justify-between items-center"
                >
                  <div>
                    <h3 className="text-lg font-semibold">{buyer}</h3>
                    <p className="text-sm text-gray-500">Subscribed to you</p>
                  </div>
                  <button
                    onClick={() => setMessageModal(buyer)}
                    className="text-sm bg-pink-600 text-white px-4 py-2 rounded hover:bg-pink-700"
                  >
                    Message
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Message Modal */}
          {messageModal && (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
              <div className="bg-white dark:bg-gray-800 p-6 rounded shadow-lg w-full max-w-sm">
                <h2 className="text-lg font-bold mb-3">Message {messageModal}</h2>
                <textarea
                  className="w-full border rounded p-2 mb-3"
                  rows={4}
                  placeholder="Type your message..."
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setMessageModal(null)}
                    className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      const trimmed = messageContent.trim();
                      if (!trimmed) return;
                      sendMessage(user.username, messageModal, trimmed);
                      setMessageSent(true);
                      setTimeout(() => {
                        setMessageModal(null);
                        setMessageContent('');
                        setMessageSent(false);
                      }, 1500);
                    }}
                    className="bg-pink-600 text-white px-4 py-2 rounded hover:bg-pink-700"
                  >
                    {messageSent ? '✅ Sent!' : 'Send'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </RequireAuth>
    </BanCheck>
  );
}
