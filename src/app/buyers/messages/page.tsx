'use client';

import { useMessages } from '@/context/MessageContext';
import { useListings } from '@/context/ListingContext';
import { useRequests } from '@/context/RequestContext';
import RequireAuth from '@/components/RequireAuth';
import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

export default function BuyerMessagesPage() {
  const { user } = useListings();
  const {
    messages,
    sendMessage,
    markMessagesAsRead,
    blockUser,
    unblockUser,
    reportUser,
    isBlocked,
    hasReported,
  } = useMessages();
  const { addRequest, getRequestsForUser, respondToRequest } = useRequests();

  const searchParams = useSearchParams();
  const threadParam = searchParams?.get('thread');

  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [sendAsRequest, setSendAsRequest] = useState(false);
  const [requestTitle, setRequestTitle] = useState('');
  const [requestPrice, setRequestPrice] = useState<number | ''>('');
  const [requestTags, setRequestTags] = useState('');
  const [editRequestId, setEditRequestId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPrice, setEditPrice] = useState<number | ''>('');
  const [editTags, setEditTags] = useState('');
  const [editMessage, setEditMessage] = useState('');
  const [_, forceRerender] = useState(0); // for forcing re-render after marking as read
  const markedThreadsRef = useRef<Set<string>>(new Set());

  const threads: { [seller: string]: typeof messages[string] } = {};
  const unreadCounts: { [seller: string]: number } = {};
  let activeMessages: typeof messages[string] = [];

  // --- Get all custom requests for this buyer ---
  const buyerRequests = user ? getRequestsForUser(user.username, 'buyer') : [];

  if (user) {
    Object.values(messages).forEach((msgs) => {
      msgs.forEach((msg) => {
        if (msg.sender === user.username || msg.receiver === user.username) {
          const otherParty = msg.sender === user.username ? msg.receiver : msg.sender;
          if (!threads[otherParty]) threads[otherParty] = [];
          threads[otherParty].push(msg);
        }
      });
    });

    Object.values(threads).forEach((thread) =>
      thread.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    );

    Object.entries(threads).forEach(([seller, msgs]) => {
      unreadCounts[seller] = msgs.filter(
        (msg) => !msg.read && msg.receiver === user.username
      ).length;
    });

    if (activeThread) {
      activeMessages = threads[activeThread] || [];
    }
  }

  // --- FIX: Ensure threadParam is always in threads, even if empty ---
  useEffect(() => {
    if (threadParam && user) {
      if (!threads[threadParam]) {
        threads[threadParam] = [];
      }
      setActiveThread(threadParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadParam, user?.username]);

  // --- FIX: Mark as read for both sides and force re-render ---
  useEffect(() => {
    if (user && activeThread && !markedThreadsRef.current.has(activeThread)) {
      markMessagesAsRead(user.username, activeThread); // Mark as read in buyer's inbox
      markMessagesAsRead(activeThread, user.username); // Mark as read in seller's inbox
      markedThreadsRef.current.add(activeThread);
      setTimeout(() => forceRerender((v) => v + 1), 0); // Force re-render so unread count disappears
    }
  }, [activeThread, user?.username]);

  const handleReply = () => {
    if (!replyMessage.trim() || !activeThread || !user) return;

    if (sendAsRequest) {
      if (!requestTitle.trim() || !requestPrice || isNaN(Number(requestPrice))) {
        alert('Please enter a valid title and price for your custom request.');
        return;
      }
      const tagsArray = requestTags.split(',').map(tag => tag.trim()).filter(Boolean);
      const requestId = uuidv4();

      // 1. Save the request in RequestContext
      addRequest({
        id: requestId,
        buyer: user.username,
        seller: activeThread,
        title: requestTitle.trim(),
        description: replyMessage.trim(),
        price: Number(requestPrice),
        tags: tagsArray,
        status: 'pending',
        date: new Date().toISOString(),
      });

      // 2. Send the message with meta
      sendMessage(
        user.username,
        activeThread,
        `[PantyPost Custom Request] ${requestTitle.trim()}`,
        {
          type: 'customRequest',
          meta: {
            id: requestId,
            title: requestTitle.trim(),
            price: Number(requestPrice),
            tags: tagsArray,
            message: replyMessage.trim(),
          }
        }
      );
      setRequestTitle('');
      setRequestPrice('');
      setRequestTags('');
      setSendAsRequest(false);
    } else {
      sendMessage(user.username, activeThread, replyMessage);
    }
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

  // --- FIX: Always show threadParam in inbox, even if no messages exist ---
  const inboxSellers = Object.keys(threads);
  if (threadParam && !inboxSellers.includes(threadParam)) {
    inboxSellers.push(threadParam);
  }

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
  const handleEditRequest = (req: typeof buyerRequests[number]) => {
    setEditRequestId(req.id);
    setEditPrice(req.price);
    setEditTitle(req.title);
    setEditTags(req.tags.join(', '));
    setEditMessage(req.description || '');
  };

  const handleEditSubmit = (req: typeof buyerRequests[number]) => {
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

  // --- Handle accept/reject for buyer on EDITED requests ---
  const handleAcceptEdited = (req: typeof buyerRequests[number]) => {
    respondToRequest(req.id, 'accepted');
  };
  const handleRejectEdited = (req: typeof buyerRequests[number]) => {
    respondToRequest(req.id, 'rejected');
  };

  return (
    <RequireAuth role="buyer">
      <main className="p-8 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">📨 Your Messages</h1>

        {!user ? (
          <p className="text-gray-600">Please log in to view your messages.</p>
        ) : inboxSellers.length === 0 ? (
          <p className="text-gray-600">No conversations yet.</p>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            <aside className="bg-white rounded border shadow p-4">
              <h2 className="font-semibold mb-4">Inbox</h2>
              <ul className="space-y-2">
                {inboxSellers.map((seller) => {
                  const unread = unreadCounts[seller] || 0;
                  const latest = threads[seller]?.[threads[seller].length - 1];
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
                          {unread > 0 && activeThread !== seller && (
                            <span className="text-xs text-white bg-pink-600 rounded-full px-2 py-0.5">
                              {unread}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate">
                          {latest?.content?.slice(0, 40) ?? ''}
                          {latest ? '...' : ''}
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
                    {(threads[activeThread] || []).map((msg, index) => {
                      // Find the matching custom request (if any)
                      let customReq;
                      if (
                        msg.type === 'customRequest' &&
                        msg.meta &&
                        typeof msg.meta.id === 'string'
                      ) {
                        customReq = buyerRequests.find((r) => r.id === msg.meta?.id);
                      }
                      // Only show action buttons to the party who did NOT make the last edit
                      const showEditedActions =
                        customReq &&
                        customReq.status === 'edited' &&
                        ((msg.sender !== user?.username && index === (threads[activeThread]?.length ?? 1) - 1) ||
                          (msg.sender === user?.username && index === (threads[activeThread]?.length ?? 1) - 1));

                      return (
                        <div key={index} className="bg-gray-50 p-3 rounded border">
                          <p className="text-sm text-gray-800 mb-1 font-semibold">
                            <strong>{msg.sender === user?.username ? 'You' : msg.sender}</strong>{' '}
                            <span className="font-normal text-gray-700">
                              on {new Date(msg.date).toLocaleString()}
                            </span>
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

                          {msg.type === 'customRequest' && msg.meta && (
                            <div className="mt-2 text-sm text-pink-700">
                              <p><strong>⚙️ Custom Request</strong></p>
                              <p>📌 Title: {msg.meta.title}</p>
                              <p>💰 Price: ${msg.meta.price.toFixed(2)}</p>
                              <p>🏷️ Tags: {msg.meta.tags.join(', ')}</p>
                              {msg.meta.message && (
                                <p>📝 {msg.meta.message}</p>
                              )}
                              {customReq && (
                                <div>
                                  <span>Status:</span>
                                  {statusBadge(customReq.status)}
                                </div>
                              )}
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
                                      onClick={() => handleEditSubmit(customReq)}
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
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          type="checkbox"
                          checked={sendAsRequest}
                          onChange={() => setSendAsRequest((prev) => !prev)}
                          id="sendAsRequest"
                        />
                        <label htmlFor="sendAsRequest" className="text-sm font-medium text-gray-700">
                          Send as custom request
                        </label>
                      </div>
                      {sendAsRequest && (
                        <div className="space-y-2 mb-2">
                          <input
                            type="text"
                            placeholder="Title"
                            value={requestTitle}
                            onChange={(e) => setRequestTitle(e.target.value)}
                            className="w-full p-2 border rounded text-black"
                          />
                          <input
                            type="number"
                            placeholder="Price (USD)"
                            value={requestPrice}
                            onChange={(e) => setRequestPrice(Number(e.target.value))}
                            className="w-full p-2 border rounded text-black"
                          />
                          <input
                            type="text"
                            placeholder="Tags (comma-separated)"
                            value={requestTags}
                            onChange={(e) => setRequestTags(e.target.value)}
                            className="w-full p-2 border rounded text-black"
                          />
                        </div>
                      )}
                      <textarea
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        placeholder="Type your reply..."
                        className="w-full p-2 border rounded mb-2 text-black"
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
                      You have blocked this seller.
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
