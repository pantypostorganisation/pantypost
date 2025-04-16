'use client';

import { useMessages } from '@/context/MessageContext';
import { useListings } from '@/context/ListingContext';
import RequireAuth from '@/components/RequireAuth';
import { useEffect, useState, useRef } from 'react';

export default function SellerMessagesPage() {
  const { user } = useListings();
  const {
    getMessagesForSeller,
    markMessagesAsRead,
    sendMessage,
    blockUser,
    reportUser,
    isBlocked,
    hasReported,
  } = useMessages();

  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const markedThreadsRef = useRef<Set<string>>(new Set());

  const sellerMessages = user ? getMessagesForSeller(user.username) : [];

  const threads = sellerMessages.reduce<{ [sender: string]: typeof sellerMessages }>((acc, msg) => {
    if (!acc[msg.sender]) acc[msg.sender] = [];
    acc[msg.sender].push(msg);
    return acc;
  }, {});

  Object.values(threads).forEach((thread) =>
    thread.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  );

  const unreadCounts: { [sender: string]: number } = {};
  sellerMessages.forEach((msg) => {
    if (!msg.read && msg.receiver === user?.username) {
      unreadCounts[msg.sender] = (unreadCounts[msg.sender] || 0) + 1;
    }
  });

  useEffect(() => {
    if (activeThread && user && !markedThreadsRef.current.has(activeThread)) {
      markMessagesAsRead(user.username, activeThread);
      markedThreadsRef.current.add(activeThread);
    }
  }, [activeThread, user, markMessagesAsRead]);

  const handleReply = () => {
    if (!replyMessage.trim() || !activeThread || !user) return;
    sendMessage(user.username, activeThread, replyMessage);
    setReplyMessage('');
  };

  const handleBlock = () => {
    if (user && activeThread) blockUser(user.username, activeThread);
  };

  const handleReport = () => {
    if (user && activeThread) reportUser(user.username, activeThread);
  };

  const isUserBlocked = user && activeThread && isBlocked(user.username, activeThread);
  const isUserReported = user && activeThread && hasReported(user.username, activeThread);

  return (
    <RequireAuth role="seller">
      <main className="p-8 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">📩 Messages</h1>

        {Object.keys(threads).length === 0 ? (
          <p className="text-gray-600">You haven’t received any messages yet.</p>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
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

            <section className="md:col-span-2 bg-white rounded border shadow p-4 flex flex-col">
              {activeThread ? (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="font-semibold">Conversation with {activeThread}</h2>
                    <div className="space-x-2">
                      <button
                        onClick={handleBlock}
                        className="text-xs px-2 py-1 border rounded text-red-500 border-red-500 hover:bg-red-50"
                      >
                        {isUserBlocked ? 'Blocked' : 'Block'}
                      </button>
                      <button
                        onClick={handleReport}
                        className="text-xs px-2 py-1 border rounded text-orange-500 border-orange-500 hover:bg-orange-50"
                      >
                        {isUserReported ? 'Reported' : 'Report'}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 mb-4">
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

                  {!isUserBlocked && (
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
                  )}

                  {isUserBlocked && (
                    <p className="text-center text-sm text-red-500 italic">
                      You have blocked this buyer.
                    </p>
                  )}
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