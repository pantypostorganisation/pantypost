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
    messages,
  } = useMessages();
  const { getRequestsForUser, respondToRequest, addRequest } = useRequests();

  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [editRequestId, setEditRequestId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<number | ''>('');
  const [editTitle, setEditTitle] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editMessage, setEditMessage] = useState('');
  const [_, forceRerender] = useState(0);
  const markedThreadsRef = useRef<Set<string>>(new Set());

  const sellerMessages = user ? getMessagesForSeller(user.username) : [];
  const requests = user ? getRequestsForUser(user.username, 'seller') : [];

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

  // Mark as read for both sides and force re-render
  useEffect(() => {
    if (activeThread && user && !markedThreadsRef.current.has(activeThread)) {
      markMessagesAsRead(user.username, activeThread);
      markMessagesAsRead(activeThread, user.username);
      markedThreadsRef.current.add(activeThread);
      setTimeout(() => forceRerender((v) => v + 1), 0);
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

  // --- Helper for status badge ---
  function statusBadge(status: string) {
    let color = 'bg-yellow-500 text-white';
    let label = status.toUpperCase();
    if (status === 'accepted') color = 'bg-green-600 text-white';
    else if (status === 'rejected') color = 'bg-red-600 text-white';
    else if (status === 'edited') color = 'bg-blue-600 text-white';
    return (
      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${color}`}>
        {label}
      </span>
    );
  }

  // --- Handle edit custom request ---
  const handleEditRequest = (req: typeof requests[number]) => {
    setEditRequestId(req.id);
    setEditPrice(req.price);
    setEditTitle(req.title);
    setEditTags(req.tags.join(', '));
    setEditMessage(req.description || '');
  };

  const handleEditSubmit = (req: typeof requests[number]) => {
    if (!user || !activeThread || !editRequestId) return;
    respondToRequest(editRequestId, 'edited', editMessage);
    sendMessage(
      user.username,
      activeThread,
      `[PantyPost Custom Request Edited] ${editTitle}`,
      {
        type: 'customRequest',
        meta: {
          id: req.id,
          title: editTitle,
          price: Number(editPrice),
          tags: editTags.split(',').map((t) => t.trim()).filter(Boolean),
          message: editMessage,
        },
      }
    );
    setEditRequestId(null);
    setEditPrice('');
    setEditTitle('');
    setEditTags('');
    setEditMessage('');
  };

  // --- Handle accept/reject for seller on EDITED requests ---
  const handleAcceptEdited = (req: typeof requests[number]) => {
    respondToRequest(req.id, 'accepted');
  };
  const handleRejectEdited = (req: typeof requests[number]) => {
    respondToRequest(req.id, 'rejected');
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
                          {unread > 0 && activeThread !== sender && (
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
                      let metaId: string | undefined = undefined;
                      if (
                        msg.type === 'customRequest' &&
                        typeof msg.meta === 'object' &&
                        msg.meta !== null &&
                        'id' in msg.meta &&
                        typeof (msg.meta as any).id === 'string'
                      ) {
                        metaId = (msg.meta as any).id as string;
                        customReq = requests.find((r) => r.id === metaId);
                      }

                      // Only show action buttons to the party who did NOT make the last edit
                      const showEditedActions =
                        customReq &&
                        customReq.status === 'edited' &&
                        ((msg.sender !== user?.username && index === (threads[activeThread]?.length ?? 1) - 1) ||
                          (msg.sender === user?.username && index === (threads[activeThread]?.length ?? 1) - 1));

                      return (
                        <div key={index} className="bg-gray-50 p-3 rounded border">
                          <p className="text-sm mb-1 text-black">
                            <strong>{msg.sender === user?.username ? 'You' : msg.sender}</strong> on{' '}
                            {new Date(msg.date).toLocaleString()}
                            {/* --- READ RECEIPT INDICATOR --- */}
                            {msg.sender === user?.username && (
                              <span className="ml-2 text-[10px] font-semibold">
                                {msg.read ? (
                                  <span className="text-green-600">Read</span>
                                ) : (
                                  <span className="text-gray-400">Unread</span>
                                )}
                              </span>
                            )}
                          </p>
                          <p className="text-black">{msg.content}</p>
                          {customReq && (
                            <div className="mt-2 text-sm text-orange-700 space-y-1">
                              <p className="font-semibold">🛠️ Custom Request</p>
                              <p><b>Title:</b> {customReq.title}</p>
                              <p><b>Price:</b> ${customReq.price.toFixed(2)}</p>
                              <p><b>Tags:</b> {customReq.tags.join(', ')}</p>
                              {customReq.description && (
                                <p><b>Message:</b> {customReq.description}</p>
                              )}
                              <p>
                                <b>Status:</b>
                                {statusBadge(customReq.status)}
                              </p>
                              {/* Show action buttons for EDITED status */}
                              {customReq && customReq.status === 'edited' && showEditedActions && (
                                <div className="flex gap-2 pt-2">
                                  <button
                                    onClick={() => handleAcceptEdited(customReq)}
                                    className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-800"
                                  >
                                    Accept
                                  </button>
                                  <button
                                    onClick={() => handleRejectEdited(customReq)}
                                    className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-800"
                                  >
                                    Reject
                                  </button>
                                  <button
                                    onClick={() => handleEditRequest(customReq)}
                                    className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-800"
                                  >
                                    Edit
                                  </button>
                                </div>
                              )}
                              {/* Edit form */}
                              {editRequestId === customReq?.id && (
                                <div className="mt-2 space-y-2">
                                  <input
                                    type="text"
                                    placeholder="Title"
                                    value={editTitle}
                                    onChange={e => setEditTitle(e.target.value)}
                                    className="w-full p-2 border rounded text-black"
                                  />
                                  <input
                                    type="number"
                                    placeholder="Price (USD)"
                                    value={editPrice}
                                    onChange={e => setEditPrice(Number(e.target.value))}
                                    className="w-full p-2 border rounded text-black"
                                  />
                                  <input
                                    type="text"
                                    placeholder="Tags (comma-separated)"
                                    value={editTags}
                                    onChange={e => setEditTags(e.target.value)}
                                    className="w-full p-2 border rounded text-black"
                                  />
                                  <textarea
                                    placeholder="Message"
                                    value={editMessage}
                                    onChange={e => setEditMessage(e.target.value)}
                                    className="w-full p-2 border rounded text-black"
                                  />
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleEditSubmit(customReq!)}
                                      className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-800"
                                    >
                                      Submit Edit
                                    </button>
                                    <button
                                      onClick={() => setEditRequestId(null)}
                                      className="bg-gray-300 text-black px-3 py-1 rounded text-xs hover:bg-gray-400"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
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
