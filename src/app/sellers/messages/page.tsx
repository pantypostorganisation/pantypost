'use client';

import { useMessages } from '@/context/MessageContext';
import { useListings } from '@/context/ListingContext';
import { useRequests } from '@/context/RequestContext';
import { useWallet } from '@/context/WalletContext';
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
  const { getRequestsForUser, respondToRequest, requests } = useRequests();
  const { wallet } = useWallet();

  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [editRequestId, setEditRequestId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<number | ''>('');
  const [editTitle, setEditTitle] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editMessage, setEditMessage] = useState('');
  const [_, forceRerender] = useState(0);
  const markedThreadsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    forceRerender((v) => v + 1);
  }, [requests, wallet]);

  let sellerMessages: any[] = [];
  if (user) {
    sellerMessages = Object.values(messages)
      .flat()
      .filter(
        (msg: any) =>
          msg.sender === user.username || msg.receiver === user.username
      );
  }
  const sellerRequests = user ? getRequestsForUser(user.username, 'seller') : [];

  const threads: { [buyer: string]: typeof sellerMessages } = {};
  if (user) {
    sellerMessages.forEach((msg) => {
      const otherParty =
        msg.sender === user.username ? msg.receiver : msg.sender;
      if (!threads[otherParty]) threads[otherParty] = [];
      threads[otherParty].push(msg);
    });
  }

  Object.values(threads).forEach((thread) =>
    thread.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  );

  const unreadCounts: { [buyer: string]: number } = {};
  sellerMessages.forEach((msg) => {
    if (!msg.read && msg.receiver === user?.username) {
      const otherParty = msg.sender === user?.username ? msg.receiver : msg.sender;
      unreadCounts[otherParty] = (unreadCounts[otherParty] || 0) + 1;
    }
  });

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
    setTimeout(() => forceRerender((v) => v + 1), 0);
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

  function statusBadge(status: string) {
    let color = 'bg-yellow-500 text-white';
    let label = status.toUpperCase();
    if (status === 'accepted') color = 'bg-green-600 text-white';
    else if (status === 'rejected') color = 'bg-red-600 text-white';
    else if (status === 'edited') color = 'bg-blue-600 text-white';
    else if (status === 'paid') color = 'bg-green-800 text-white';
    else if (status === 'pending') color = 'bg-yellow-500 text-white';
    return (
      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${color}`}>
        {label}
      </span>
    );
  }

  const handleEditRequest = (req: typeof sellerRequests[number]) => {
    setEditRequestId(req.id);
    setEditPrice(req.price);
    setEditTitle(req.title);
    setEditTags(req.tags.join(', '));
    setEditMessage(req.description || '');
  };

  // When editing, always set status to 'pending'
  const handleEditSubmit = (req: typeof sellerRequests[number]) => {
    if (!user || !activeThread || !editRequestId) return;
    respondToRequest(
      editRequestId,
      'pending',
      editMessage,
      {
        title: editTitle,
        price: Number(editPrice),
        tags: editTags.split(',').map((t) => t.trim()).filter(Boolean),
        description: editMessage,
      }
    );
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
    setTimeout(() => forceRerender((v) => v + 1), 0);
  };

  const handleAccept = (req: typeof sellerRequests[number]) => {
    if (req.status === 'pending') {
      respondToRequest(req.id, 'accepted');
      setTimeout(() => forceRerender((v) => v + 1), 0);
    }
  };
  const handleDecline = (req: typeof sellerRequests[number]) => {
    if (req.status === 'pending') {
      respondToRequest(req.id, 'rejected');
      setTimeout(() => forceRerender((v) => v + 1), 0);
    }
  };

  function getLatestCustomRequestMessages(messages: any[], requests: any[]) {
    const seen = new Set();
    const result: any[] = [];
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.type === 'customRequest' && msg.meta && msg.meta.id) {
        if (!seen.has(msg.meta.id)) {
          seen.add(msg.meta.id);
          result.unshift(msg);
        }
      } else {
        result.unshift(msg);
      }
    }
    return result;
  }

  const inboxBuyers = Object.keys(threads);
  const threadMessages =
    activeThread
      ? getLatestCustomRequestMessages(threads[activeThread] || [], sellerRequests)
      : [];

  function isLastEditor(customReq: any) {
    if (!customReq) return false;
    const lastMsg = threadMessages
      .filter(
        (msg) =>
          msg.type === 'customRequest' &&
          msg.meta &&
          msg.meta.id === customReq.id
      )
      .slice(-1)[0];
    return lastMsg && lastMsg.sender === user?.username;
  }

  return (
    <RequireAuth role="seller">
      <main className="p-8 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">📩 Messages</h1>

        {inboxBuyers.length === 0 ? (
          <p className="text-gray-600">You haven’t received any messages yet.</p>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            <aside className="bg-white rounded border shadow p-4">
              <h2 className="font-semibold mb-4">Inbox</h2>
              <ul className="space-y-2">
                {inboxBuyers.map((buyer) => {
                  const unread = unreadCounts[buyer] || 0;
                  const latest = threads[buyer][threads[buyer].length - 1];
                  return (
                    <li key={buyer}>
                      <button
                        onClick={() => setActiveThread(buyer)}
                        className={`block w-full text-left px-3 py-2 rounded hover:bg-orange-50 ${
                          activeThread === buyer ? 'bg-orange-100' : 'bg-gray-50'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-semibold">{buyer}</span>
                          {unread > 0 && activeThread !== buyer && (
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
                    {threadMessages.map((msg, index) => {
                      let customReq: typeof sellerRequests[number] | undefined = undefined;
                      let metaId: string | undefined = undefined;
                      if (
                        msg.type === 'customRequest' &&
                        typeof msg.meta === 'object' &&
                        msg.meta !== null &&
                        'id' in msg.meta &&
                        typeof (msg.meta as any).id === 'string'
                      ) {
                        metaId = (msg.meta as any).id as string;
                        customReq = sellerRequests.find((r) => r.id === metaId);
                      }

                      const isLatestCustom =
                        !!customReq &&
                        (customReq.status === 'pending' || customReq.status === 'edited' || customReq.status === 'accepted') &&
                        index === (threadMessages.length - 1) &&
                        msg.type === 'customRequest';

                      const isPaid = customReq && (customReq.paid || customReq.status === 'paid');

                      const showActionButtons =
                        !!customReq &&
                        isLatestCustom &&
                        customReq.status === 'pending' &&
                        !isLastEditor(customReq);

                      return (
                        <div key={index} className="bg-gray-50 p-3 rounded border">
                          <p className="text-sm mb-1 text-black">
                            <strong>{msg.sender === user?.username ? 'You' : msg.sender}</strong> on{' '}
                            {new Date(msg.date).toLocaleString()}
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
                          {msg.type !== 'customRequest' && (
                            <p className="text-black">{msg.content}</p>
                          )}
                          {msg.type === 'customRequest' && msg.meta && (
                            <div className="mt-2 text-sm text-orange-700 space-y-1">
                              <p className="font-semibold">🛠️ Custom Request</p>
                              <p><b>Title:</b> {customReq ? customReq.title : msg.meta.title}</p>
                              <p><b>Price:</b> {customReq ? `$${customReq.price.toFixed(2)}` : `$${msg.meta.price.toFixed(2)}`}</p>
                              <p><b>Tags:</b> {customReq ? customReq.tags.join(', ') : msg.meta.tags.join(', ')}</p>
                              {(customReq ? customReq.description : msg.meta.message) && (
                                <p><b>Message:</b> {customReq ? customReq.description : msg.meta.message}</p>
                              )}
                              {customReq && (
                                <p>
                                  <b>Status:</b>
                                  {statusBadge(customReq.status)}
                                </p>
                              )}
                              {isPaid && (
                                <span className="text-green-700 font-bold">Paid ✅</span>
                              )}
                              {showActionButtons && !isPaid && (
                                <div className="flex gap-2 pt-2">
                                  <button
                                    onClick={() => customReq && handleAccept(customReq)}
                                    className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-800"
                                  >
                                    Accept
                                  </button>
                                  <button
                                    onClick={() => customReq && handleDecline(customReq)}
                                    className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-800"
                                  >
                                    Decline
                                  </button>
                                  <button
                                    onClick={() => customReq && handleEditRequest(customReq)}
                                    className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-800"
                                  >
                                    Edit
                                  </button>
                                </div>
                              )}
                              {editRequestId === customReq?.id && customReq && (
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
                                      onClick={() => customReq && handleEditSubmit(customReq)}
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
