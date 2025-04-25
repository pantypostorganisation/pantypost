'use client';

import { useMessages } from '@/context/MessageContext';
import { useListings } from '@/context/ListingContext';
import { useRequests } from '@/context/RequestContext';
import RequireAuth from '@/components/RequireAuth';
import { useEffect, useState, useRef } from 'react';

export default function SellerMessagesPage() {
  const { user, addSellerNotification } = useListings();
  const {
    getMessagesForSeller,
    markMessagesAsRead,
    sendMessage,
    blockUser,
    unblockUser,
    reportUser,
    isBlocked,
    hasReported,
  } = useMessages();
  const { respondToRequest, getRequestsForUser } = useRequests();

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
    addSellerNotification(user.username, `💌 You replied to buyer: ${activeThread}`);
    setReplyMessage('');
  };

  const handleBlockToggle = () => {
    if (!user || !activeThread) return;
    if (isBlocked(user.username, activeThread)) {
      unblockUser(user.username, activeThread);
    } else {
      blockUser(user.username, activeThread);
    }
  };

  const handleReport = () => {
    if (user && activeThread && !hasReported(user.username, activeThread)) {
      reportUser(user.username, activeThread);
    }
  };

  const isUserBlocked = !!(user && activeThread && isBlocked(user.username, activeThread));
  const isUserReported = !!(user && activeThread && hasReported(user.username, activeThread));

  // For custom request approval
  const requests = user ? getRequestsForUser(user.username, 'seller') : [];

  const handleApproveRequest = (reqId: string) => {
    respondToRequest(reqId, 'accepted', 'Approved! I will fulfill your request soon.');
  };

  const handleDeclineRequest = (reqId: string) => {
    respondToRequest(reqId, 'declined', 'Sorry, I cannot fulfill this request.');
  };

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
                        className={`block w-full text-left px-3 py-2 rounded hover:bg-orange-50 ${
                          activeThread === sender ? 'bg-orange-100' : 'bg-gray-50'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-semibold">{sender}</span>
                          {unread > 0 && (
                            <span className="text-xs text-white bg-[#ff950e] rounded-full px-2 py-0.5">
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
                        onClick={handleBlockToggle}
                        className={`text-xs px-2 py-1 border rounded ${
                          isUserBlocked
                            ? 'text-green-600 border-green-600 hover:bg-green-50'
                            : 'text-red-500 border-red-500 hover:bg-red-50'
                        }`}
                      >
                        {isUserBlocked ? 'Unblock' : 'Block'}
                      </button>
                      <button
                        onClick={handleReport}
                        disabled={isUserReported}
                        className={`text-xs px-2 py-1 border rounded ${
                          isUserReported
                            ? 'text-gray-400 border-gray-300 cursor-not-allowed'
                            : 'text-orange-500 border-orange-500 hover:bg-orange-50'
                        }`}
                      >
                        {isUserReported ? 'Reported' : 'Report'}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 mb-4">
                    {threads[activeThread].map((msg, index) => {
                      let customReq: typeof requests[number] | undefined = undefined;
                      if (
                        msg.type === 'customRequest' &&
                        typeof msg.meta === 'object' &&
                        msg.meta !== null &&
                        'id' in msg.meta &&
                        typeof (msg.meta as any).id === 'string'
                      ) {
                        customReq = requests.find((r) => r.id === (msg.meta as any).id);
                      }

                      return (
                        <div key={index} className="bg-gray-50 p-3 rounded border">
                          <p className="text-sm mb-1 text-black">
                            <strong>{msg.sender === user?.username ? 'You' : msg.sender}</strong> on{' '}
                            {new Date(msg.date).toLocaleString()}
                          </p>
                          <p className="text-black">{msg.content}</p>
                          {customReq ? (
                            <div className="mt-2 text-sm text-orange-700">
                              <p>
                                <strong>🛠️ Custom Request</strong>
                              </p>
                              <p><b>Title:</b> {customReq.title}</p>
                              <p><b>Price:</b> ${customReq.price.toFixed(2)}</p>
                              <p><b>Tags:</b> {customReq.tags.join(', ')}</p>
                              {msg.meta?.message && (
                                <p><b>Message:</b> {msg.meta.message}</p>
                              )}
                              <p>
                                Status:{' '}
                                <span
                                  className={
                                    customReq.status === 'pending'
                                      ? 'text-yellow-600'
                                      : customReq.status === 'accepted'
                                      ? 'text-green-600'
                                      : 'text-red-600'
                                  }
                                >
                                  {customReq.status.toUpperCase()}
                                </span>
                              </p>
                              {customReq.status === 'pending' && (
                                <div className="flex gap-2 mt-2">
                                  <button
                                    onClick={() => handleApproveRequest(customReq!.id)}
                                    className="bg-[#ff950e] text-white px-3 py-1 rounded hover:bg-orange-600 text-xs"
                                  >
                                    Accept
                                  </button>
                                  <button
                                    onClick={() => handleDeclineRequest(customReq!.id)}
                                    className="bg-black text-white px-3 py-1 rounded hover:bg-gray-800 text-xs"
                                  >
                                    Decline
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>

                  {!isUserBlocked && (
                    <div className="border-t pt-4 mt-auto">
                      <textarea
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        placeholder="Type your reply..."
                        className="w-full p-2 border rounded mb-2 text-black"
                      />
                      <div className="text-right">
                        <button
                          onClick={handleReply}
                          className="bg-black hover:bg-[#ff950e] hover:text-black text-white px-4 py-2 rounded"
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
