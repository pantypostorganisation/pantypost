'use client';

import { useMessages } from '@/context/MessageContext';
import { useListings } from '@/context/ListingContext';
import RequireAuth from '@/components/RequireAuth';
import { useEffect, useState, useRef } from 'react';

export default function SellerMessagesPage() {
  const { user } = useListings();
  const { getMessagesForSeller, markMessagesAsRead } = useMessages();
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const markedThreadsRef = useRef<Set<string>>(new Set()); // track read threads

  const sellerMessages = user ? getMessagesForSeller(user.username) : [];

  // Group messages by sender (buyer ➜ seller)
  const threads = sellerMessages.reduce<{ [sender: string]: typeof sellerMessages }>((acc, msg) => {
    if (!acc[msg.sender]) acc[msg.sender] = [];
    acc[msg.sender].push(msg);
    return acc;
  }, {});

  // Track unread counts
  const unreadCounts: { [sender: string]: number } = {};
  sellerMessages.forEach((msg) => {
    if (!msg.read && msg.receiver === user?.username) {
      unreadCounts[msg.sender] = (unreadCounts[msg.sender] || 0) + 1;
    }
  });

  // Mark as read only once when thread is opened
  useEffect(() => {
    if (activeThread && user && !markedThreadsRef.current.has(activeThread)) {
      markMessagesAsRead(user.username, activeThread);
      markedThreadsRef.current.add(activeThread); // ✅ mark it so we don’t repeat it
    }
  }, [activeThread, user, markMessagesAsRead]);

  return (
    <RequireAuth role="seller">
      <main className="p-8 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">📩 Messages</h1>

        {Object.keys(threads).length === 0 ? (
          <p className="text-gray-600">You haven’t received any messages yet.</p>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {/* Sidebar - buyer list */}
            <aside className="bg-white rounded border shadow p-4">
              <h2 className="font-semibold mb-4">Inbox</h2>
              <ul className="space-y-2">
                {Object.keys(threads).map((sender) => {
                  const unread = unreadCounts[sender] || 0;
                  const latest = threads[sender][threads[sender].length - 1];
                  return (
                    <li key={sender}>
                      <button
                        onClick={() => setActiveThread(sender)}
                        className={`block w-full text-left px-3 py-2 rounded hover:bg-pink-50 ${
                          activeThread === sender ? 'bg-pink-100' : 'bg-gray-50'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-semibold">{sender}</span>
                          {unread > 0 && (
                            <span className="text-xs text-white bg-pink-600 rounded-full px-2 py-0.5">
                              {unread}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate">
                          {latest.content.slice(0, 40)}...
                        </p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </aside>

            {/* Conversation view */}
            <section className="md:col-span-2 bg-white rounded border shadow p-4">
              {activeThread ? (
                <>
                  <h2 className="font-semibold mb-4">Conversation with {activeThread}</h2>
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                    {threads[activeThread].map((msg, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded border">
                        <p className="text-sm text-gray-500 mb-1">
                          <strong>{msg.sender === user?.username ? 'You' : msg.sender}</strong> on{' '}
                          {new Date(msg.date).toLocaleString()}
                        </p>
                        <p>{msg.content}</p>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-gray-500">Select a conversation to view messages.</p>
              )}
            </section>
          </div>
        )}
      </main>
    </RequireAuth>
  );
}
