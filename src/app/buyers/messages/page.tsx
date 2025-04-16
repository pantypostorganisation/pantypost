'use client';

import { useMessages } from '@/context/MessageContext';
import { useListings } from '@/context/ListingContext';
import RequireAuth from '@/components/RequireAuth';
import { useEffect, useState, useRef } from 'react';

export default function BuyerMessagesPage() {
  const { user } = useListings();
  const { messages, sendMessage, markMessagesAsRead } = useMessages();
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const markedThreadsRef = useRef<Set<string>>(new Set());

  if (!user) return null;

  // Group all messages involving this buyer (by seller)
  const threads: { [seller: string]: typeof messages[string] } = {};

  Object.values(messages).forEach((msgs) => {
    msgs.forEach((msg) => {
      if (msg.sender === user.username || msg.receiver === user.username) {
        const otherParty = msg.sender === user.username ? msg.receiver : msg.sender;
        if (!threads[otherParty]) threads[otherParty] = [];
        threads[otherParty].push(msg);
      }
    });
  });

  // Sort each thread by date
  Object.values(threads).forEach((thread) =>
    thread.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  );

  // Unread count per seller
  const unreadCounts: { [seller: string]: number } = {};
  Object.entries(threads).forEach(([seller, msgs]) => {
    unreadCounts[seller] = msgs.filter(
      (msg) => !msg.read && msg.receiver === user.username
    ).length;
  });

  // Mark as read when opening a thread
  useEffect(() => {
    if (activeThread && !markedThreadsRef.current.has(activeThread)) {
      markMessagesAsRead(user.username, activeThread);
      markedThreadsRef.current.add(activeThread);
    }
  }, [activeThread]);

  const handleReply = () => {
    if (!replyMessage.trim() || !activeThread) return;
    sendMessage(user.username, activeThread, replyMessage);
    setReplyMessage('');
  };

  return (
    <RequireAuth role="buyer">
      <main className="p-8 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">📨 Your Messages</h1>

        {Object.keys(threads).length === 0 ? (
          <p className="text-gray-600">No conversations yet.</p>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {/* Sidebar */}
            <aside className="bg-white rounded border shadow p-4">
              <h2 className="font-semibold mb-4">Inbox</h2>
              <ul className="space-y-2">
                {Object.keys(threads).map((seller) => {
                  const unread = unreadCounts[seller];
                  const latest = threads[seller][threads[seller].length - 1];
                  return (
                    <li key={seller}>
                      <button
                        onClick={() => setActiveThread(seller)}
                        className={`block w-full text-left px-3 py-2 rounded hover:bg-pink-50 ${
                          activeThread === seller ? 'bg-pink-100' : 'bg-gray-50'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-semibold">{seller}</span>
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

            {/* Conversation Thread */}
            <section className="md:col-span-2 bg-white rounded border shadow p-4 flex flex-col">
              {activeThread ? (
                <>
                  <h2 className="font-semibold mb-4">
                    Conversation with {activeThread}
                  </h2>
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 mb-4">
                    {threads[activeThread].map((msg, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded border">
                        <p className="text-sm text-gray-500 mb-1">
                          <strong>{msg.sender === user.username ? 'You' : msg.sender}</strong>{' '}
                          on {new Date(msg.date).toLocaleString()}
                        </p>
                        <p>{msg.content}</p>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4 mt-auto">
                    <textarea
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      placeholder="Type your reply..."
                      className="w-full p-2 border rounded mb-2"
                    />
                    <div className="text-right">
                      <button
                        onClick={handleReply}
                        className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded"
                      >
                        Send Reply
                      </button>
                    </div>
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
