'use client';

import { useMessages } from '@/context/MessageContext';
import { useListings } from '@/context/ListingContext';
import { useRequests } from '@/context/RequestContext';
import { useWallet } from '@/context/WalletContext';
import RequireAuth from '@/components/RequireAuth';
import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

const ADMIN_ACCOUNTS = ['oakley', 'gerome'];

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
  const { addRequest, getRequestsForUser, respondToRequest, requests, setRequests } = useRequests();
  const { wallet, updateWallet } = useWallet();

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
  const [showPayModal, setShowPayModal] = useState(false);
  const [payingRequest, setPayingRequest] = useState<any>(null);
  const [_, forceRerender] = useState(0);
  const markedThreadsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    forceRerender((v) => v + 1);
  }, [requests, wallet]);

  const threads: { [seller: string]: typeof messages[string] } = {};
  const unreadCounts: { [seller: string]: number } = {};
  let activeMessages: typeof messages[string] = [];

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

  useEffect(() => {
    if (threadParam && user) {
      if (!threads[threadParam]) {
        threads[threadParam] = [];
      }
      setActiveThread(threadParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadParam, user?.username]);

  useEffect(() => {
    if (user && activeThread && !markedThreadsRef.current.has(activeThread)) {
      markMessagesAsRead(user.username, activeThread);
      markMessagesAsRead(activeThread, user.username);
      markedThreadsRef.current.add(activeThread);
      setTimeout(() => forceRerender((v) => v + 1), 0);
    }
  }, [activeThread, user?.username, markMessagesAsRead]);

  const handleReply = () => {
    if (!replyMessage.trim() || !activeThread || !user) return;

    if (sendAsRequest) {
      if (!requestTitle.trim() || !requestPrice || isNaN(Number(requestPrice))) {
        alert('Please enter a valid title and price for your custom request.');
        return;
      }
      const tagsArray = requestTags.split(',').map(tag => tag.trim()).filter(Boolean);
      const requestId = uuidv4();

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

  const inboxSellers = Object.keys(threads);
  if (threadParam && !inboxSellers.includes(threadParam)) {
    inboxSellers.push(threadParam);
  }

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

  const handleEditRequest = (req: typeof buyerRequests[number]) => {
    setEditRequestId(req.id);
    setEditPrice(req.price);
    setEditTitle(req.title);
    setEditTags(req.tags.join(', '));
    setEditMessage(req.description || '');
  };

  const handleEditSubmit = (req: typeof buyerRequests[number]) => {
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

  const handleAccept = (req: typeof buyerRequests[number]) => {
    if (req && req.status === 'pending') {
      respondToRequest(req.id, 'accepted');
      setTimeout(() => forceRerender((v) => v + 1), 0);
    }
  };
  const handleDecline = (req: typeof buyerRequests[number]) => {
    if (req && req.status === 'pending') {
      respondToRequest(req.id, 'rejected');
      setTimeout(() => forceRerender((v) => v + 1), 0);
    }
  };

  // Payment logic
  const handlePayNow = (req: typeof buyerRequests[number]) => {
    setPayingRequest(req);
    setShowPayModal(true);
  };

  const handleConfirmPay = () => {
    if (!user || !payingRequest) return;
    const basePrice = payingRequest.price;
    const markupPrice = Math.round(basePrice * 1.1 * 100) / 100;
    const seller = payingRequest.seller;
    const buyer = payingRequest.buyer;

    // Corrected logic:
    const sellerShare = Math.round(basePrice * 0.9 * 100) / 100;
    const adminCut = Math.round((markupPrice - sellerShare) * 100) / 100;

    if (wallet[buyer] === undefined || wallet[buyer] < markupPrice) {
      setShowPayModal(false);
      setPayingRequest(null);
      alert("Insufficient balance to complete this transaction.");
      return;
    }

    // Deduct from buyer
    updateWallet(buyer, -markupPrice);

    // Credit shared admin wallet (oakley/gerome/admin)
    updateWallet('oakley', adminCut);

    // Credit seller and add order to fulfil
    updateWallet(
      seller,
      sellerShare,
      {
        id: payingRequest.id,
        title: payingRequest.title,
        description: payingRequest.description,
        price: payingRequest.price,
        markedUpPrice: markupPrice,
        date: new Date().toISOString(),
        seller: payingRequest.seller,
        buyer: payingRequest.buyer,
        tags: payingRequest.tags,
      }
    );

    // Mark this request as paid in the requests context
    setRequests((prev: any) =>
      prev.map((r: any) =>
        r.id === payingRequest.id ? { ...r, paid: true, status: 'paid' } : r
      )
    );

    setShowPayModal(false);
    setPayingRequest(null);
    setTimeout(() => forceRerender((v) => v + 1), 0);
  };

  const handleCancelPay = () => {
    setShowPayModal(false);
    setPayingRequest(null);
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

  const threadMessages =
    activeThread
      ? getLatestCustomRequestMessages(threads[activeThread] || [], buyerRequests)
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
                    {threadMessages.map((msg, index) => {
                      let customReq: typeof buyerRequests[number] | undefined = undefined;
                      if (
                        msg.type === 'customRequest' &&
                        msg.meta &&
                        typeof msg.meta.id === 'string'
                      ) {
                        customReq = buyerRequests.find((r) => r.id === msg.meta?.id);
                      }
                      const isLatestCustom =
                        !!customReq &&
                        (customReq.status === 'pending' || customReq.status === 'edited' || customReq.status === 'accepted') &&
                        index === (threadMessages.length - 1) &&
                        msg.type === 'customRequest';

                      const showPayNow =
                        !!customReq &&
                        customReq.status === 'accepted' &&
                        index === (threadMessages.length - 1) &&
                        msg.type === 'customRequest';

                      const markupPrice = customReq ? Math.round(customReq.price * 1.1 * 100) / 100 : 0;
                      const buyerBalance = user ? wallet[user.username] ?? 0 : 0;
                      const canPay = customReq && buyerBalance >= markupPrice;
                      const isPaid = customReq && customReq.paid;

                      const showActionButtons =
                        !!customReq &&
                        isLatestCustom &&
                        customReq.status === 'pending' &&
                        !isLastEditor(customReq);

                      return (
                        <div key={index} className="bg-gray-50 p-3 rounded border">
                          <p className="text-sm text-gray-800 mb-1 font-semibold">
                            <strong>{msg.sender === user?.username ? 'You' : msg.sender}</strong>{' '}
                            <span className="font-normal text-gray-700">
                              on {new Date(msg.date).toLocaleString()}
                            </span>
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
                            <div className="mt-2 text-sm text-pink-700">
                              <p><strong>⚙️ Custom Request</strong></p>
                              <p>📌 Title: {customReq ? customReq.title : msg.meta.title}</p>
                              <p>💰 Price: {customReq ? `$${customReq.price.toFixed(2)}` : `$${msg.meta.price.toFixed(2)}`}</p>
                              <p>🏷️ Tags: {customReq ? customReq.tags.join(', ') : msg.meta.tags.join(', ')}</p>
                              {(customReq ? customReq.description : msg.meta.message) && (
                                <p>📝 {customReq ? customReq.description : msg.meta.message}</p>
                              )}
                              {customReq && (
                                <div>
                                  <span>Status:</span>
                                  {statusBadge(customReq.status)}
                                </div>
                              )}
                              {showActionButtons && (
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
                              {showPayNow && (
                                <div className="flex flex-col gap-2 pt-2">
                                  {isPaid ? (
                                    <span className="text-green-700 font-bold">Paid ✅</span>
                                  ) : (
                                    <>
                                      <button
                                        onClick={() => customReq && canPay && handlePayNow(customReq)}
                                        className={`bg-black text-white px-3 py-1 rounded text-xs hover:bg-green-600 ${!canPay ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        disabled={!canPay}
                                      >
                                        Pay {customReq ? `$${markupPrice.toFixed(2)}` : ''} Now
                                      </button>
                                      {!canPay && (
                                        <span className="text-xs text-red-600">
                                          Insufficient balance to pay ${markupPrice.toFixed(2)}
                                        </span>
                                      )}
                                    </>
                                  )}
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

                  {showPayModal && payingRequest && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
                      <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-lg">
                        <h3 className="text-lg font-bold mb-4">Confirm Payment</h3>
                        <p>
                          Are you sure you want to pay{' '}
                          <span className="font-bold text-green-700">
                            ${payingRequest ? (Math.round(payingRequest.price * 1.1 * 100) / 100).toFixed(2) : ''}
                          </span>
                          ?
                        </p>
                        <div className="flex justify-end gap-2 mt-6">
                          <button
                            onClick={handleCancelPay}
                            className="px-4 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleConfirmPay}
                            className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-800"
                          >
                            Confirm & Pay
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

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
