// src/app/buyers/messages/page.tsx
'use client';

import React, { useCallback, useEffect, useMemo } from 'react';
import RequireAuth from '@/components/RequireAuth';
import BanCheck from '@/components/BanCheck';
import { useBuyerMessages } from '@/hooks/useBuyerMessages';
import {
  MessagingLayout,
  ThreadList,
  ConversationPane,
  EmptyConversation,
  ImagePreviewModal,
} from '@/components/messaging';
import type { UICustomRequest, UIThread } from '@/components/messaging';
import CustomRequestModal from '@/components/buyers/messages/CustomRequestModal';
import PaymentModal from '@/components/buyers/messages/PaymentModal';
import TipModal from '@/components/buyers/messages/TipModal';

/* =====================================================================
 * Buyer messages — now a thin adapter over the SHARED messaging set.
 *
 * The interesting code lives in components/messaging/*. This file only:
 *   1. maps the hook's thread map into UIThread rows,
 *   2. binds the hook's composer / request state onto ConversationPane,
 *   3. keeps the buyer-only modals (custom request, payment, tip).
 *
 * The old page rendered components/buyers/messages/{ThreadsSidebar,
 * ConversationView} — one half of two parallel, drifting trees. Those
 * files are now unreferenced and can be deleted in a later cleanup pass.
 * ===================================================================== */

/** Requests arrive from RequestContext with server fields (pendingWith,
    lastEditedBy) that the legacy CustomRequest type predates. */
function toUIRequest(request: any): UICustomRequest {
  return {
    id: request.id,
    title: request.title || '',
    description: request.description || '',
    price: Number(request.price) || 0,
    tags: Array.isArray(request.tags) ? request.tags : [],
    status: request.status || 'pending',
    pendingWith: request.pendingWith,
    lastEditedBy: request.lastEditedBy,
    lastModifiedBy: request.lastModifiedBy,
    paid: Boolean(request.paid),
  };
}

export default function BuyerMessagesPage() {
  const {
    // Auth & context
    user,
    wallet,

    // Messages & threads
    threads,
    uiUnreadCounts,
    lastMessages,
    sellerProfiles,
    activeThread,
    setActiveThread,
    buyerRequests,

    // UI State
    mounted,
    previewImage,
    setPreviewImage,
    recentEmojis,

    // Message input
    replyMessage,
    setReplyMessage,
    selectedImage,
    setSelectedImage,
    isImageLoading,
    imageError,

    // Custom requests
    showCustomRequestModal,
    setShowCustomRequestModal,
    customRequestForm,
    setCustomRequestForm,
    customRequestErrors,
    isSubmittingRequest,
    editRequestId,
    setEditRequestId,
    editPrice,
    setEditPrice,
    editTitle,
    setEditTitle,
    editMessage,
    setEditMessage,

    // Payment
    showPayModal,
    setShowPayModal,
    payingRequest,
    setPayingRequest,
    handleConfirmPay,

    // Tips
    showTipModal,
    setShowTipModal,
    tipAmount,
    setTipAmount,
    tipResult,
    setTipResult,

    // Actions
    handleReply,
    handleBlockToggle,
    handleReport,
    handleAccept,
    handleDecline,
    handleEditRequest,
    handleEditSubmit,
    handlePayNow,
    handleImageSelect,
    handleMessageVisible,
    handleEmojiClick,
    handleSendTip,
    handleCustomRequestSubmit,
    closeCustomRequestModal,

    // Status checks
    isUserBlocked,
    isUserReported,
  } = useBuyerMessages();

  /* ---- Normalise the hook's map types once ----
     The hook's memos early-return `{}` before a user exists, so these
     come back typed `{record} | {}` and TypeScript refuses to
     string-index the empty branch. The values are also the hook's
     Message shape, whose `id` is optional, while UIThread.lastMessage
     requires one — ThreadRow never reads `id`, and the runtime objects
     from Mongo always carry it, hence the through-unknown cast. */
  const lastMessageMap = lastMessages as unknown as {
    [seller: string]: UIThread['lastMessage'];
  };
  const unreadMap = uiUnreadCounts as { [seller: string]: number };
  const profileMap = sellerProfiles as {
    [seller: string]: { profilePic: string | null; isVerified: boolean };
  };

  /* ClientLayout hides the site header on mobile while a thread is open;
     this event is how it knows. Dispatching regardless of viewport is
     fine — the layout applies it only where it matters. */
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('threadStateChange', { detail: { hasActiveThread: !!activeThread } })
    );
  }, [activeThread]);

  /* ---- Requests, indexed and counted ----
     Two indexes on purpose: the card renders the UI shape, but the hook's
     handlers (handleAccept, handlePayNow → handleConfirmPay) read fields
     the UI shape deliberately drops — request.seller above all. Action
     callbacks therefore hand back the RAW hook object. */
  const requestsById = useMemo(() => {
    const map: Record<string, UICustomRequest> = {};
    (buyerRequests || []).forEach((request: any) => {
      if (request?.id) map[request.id] = toUIRequest(request);
    });
    return map;
  }, [buyerRequests]);

  const rawRequestsById = useMemo(() => {
    const map: Record<string, any> = {};
    (buyerRequests || []).forEach((request: any) => {
      if (request?.id) map[request.id] = request;
    });
    return map;
  }, [buyerRequests]);

  const awaitingMeBySeller = useMemo(() => {
    const counts: Record<string, number> = {};
    if (!user) return counts;
    (buyerRequests || []).forEach((request: any) => {
      const open = request?.status === 'pending' || request?.status === 'edited';
      if (!open) return;
      const myTurn = request.pendingWith
        ? request.pendingWith === user.username
        : (request.lastModifiedBy || request.lastEditedBy) !== user.username;
      if (!myTurn) return;
      const seller = request.seller;
      if (seller) counts[seller] = (counts[seller] || 0) + 1;
    });
    return counts;
  }, [buyerRequests, user]);

  /* ---- Thread map → sorted rows ---- */
  const threadRows: UIThread[] = useMemo(() => {
    return Object.keys(threads)
      .map((seller) => ({
        username: seller,
        lastMessage: lastMessageMap[seller],
        unreadCount: unreadMap[seller] || 0,
        profilePic: profileMap[seller]?.profilePic ?? null,
        isVerified: profileMap[seller]?.isVerified ?? false,
        pendingRequests: awaitingMeBySeller[seller] || 0,
      }))
      .sort((a, b) => {
        const ta = a.lastMessage?.date ? new Date(a.lastMessage.date).getTime() : 0;
        const tb = b.lastMessage?.date ? new Date(b.lastMessage.date).getTime() : 0;
        return tb - ta;
      });
  }, [threads, lastMessageMap, unreadMap, profileMap, awaitingMeBySeller]);

  /* The modal types its form as {title, price, description}; the hook's
     form also carries tags and hoursWorn. The modal only ever updates via
     functional set with a spread, so state is safe either way — this
     wrapper exists purely to bridge the two TypeScript shapes. */
  const handleCustomRequestFormChange = useCallback(
    (update: any) => {
      setCustomRequestForm((prev: any) =>
        typeof update === 'function' ? { ...prev, ...update(prev) } : { ...prev, ...update }
      );
    },
    [setCustomRequestForm]
  );

  /* The hook validates uploads via a change-event handler; the shared
     composer hands over a File. Bridging here beats editing a 53KB hook
     mid-UI-rebuild. */
  const handleImageFile = useCallback(
    (file: File) => {
      handleImageSelect({ target: { files: [file], value: '' } } as unknown as React.ChangeEvent<HTMLInputElement>);
    },
    [handleImageSelect]
  );

  const activeMessages = activeThread ? threads[activeThread] || [] : [];
  const activeProfile = activeThread ? profileMap[activeThread] : undefined;

  if (!mounted || !user) {
    return (
      <BanCheck>
        <RequireAuth role="buyer">
          <div className="flex h-full items-center justify-center bg-surface">
            <div className="loading-spinner" aria-label="Loading messages" />
          </div>
        </RequireAuth>
      </BanCheck>
    );
  }

  return (
    <BanCheck>
      <RequireAuth role="buyer">
        {/* Height comes from ClientLayout, which pins messaging routes to
            the viewport. No local viewport arithmetic — both old pages did
            their own and both got it wrong in different directions. */}
        <main className="h-full min-h-0 w-full overflow-hidden bg-surface">
          <MessagingLayout
            hasActiveThread={!!activeThread}
            sidebar={
              <ThreadList
                threads={threadRows}
                activeThread={activeThread}
                currentUser={user.username}
                role="buyer"
                onSelect={setActiveThread}
              />
            }
            conversation={
              activeThread ? (
                <ConversationPane
                  role="buyer"
                  currentUser={user.username}
                  activeThread={activeThread}
                  messages={activeMessages}
                  profilePic={activeProfile?.profilePic ?? null}
                  isVerified={activeProfile?.isVerified ?? false}
                  isBlocked={isUserBlocked(activeThread)}
                  hasReported={isUserReported(activeThread)}
                  onBack={() => setActiveThread(null)}
                  onBlockToggle={handleBlockToggle}
                  onReport={handleReport}
                  composer={{
                    value: replyMessage,
                    onChange: setReplyMessage,
                    onSend: handleReply,
                    imagePreviewUrl: selectedImage,
                    onImageFile: handleImageFile,
                    onClearImage: () => setSelectedImage(null),
                    isUploading: isImageLoading,
                    uploadError: imageError,
                    recentEmojis,
                    onEmojiSelect: handleEmojiClick,
                    onRequestCustom: () => setShowCustomRequestModal(true),
                    onSendTip: () => setShowTipModal(true),
                  }}
                  requestsById={requestsById}
                  onAcceptRequest={(request) => handleAccept(rawRequestsById[request.id] ?? request)}
                  onDeclineRequest={(request) => handleDecline(rawRequestsById[request.id] ?? request)}
                  onCounterRequest={(request) => handleEditRequest(rawRequestsById[request.id] ?? request)}
                  onPayRequest={(request) => handlePayNow(rawRequestsById[request.id] ?? request)}
                  requestEditState={{
                    requestId: editRequestId,
                    title: editTitle,
                    price: String(editPrice ?? ''),
                    message: editMessage,
                    setTitle: setEditTitle,
                    setPrice: setEditPrice,
                    setMessage: setEditMessage,
                    onSubmit: handleEditSubmit,
                    onCancel: () => setEditRequestId(null),
                  }}
                  onMessageVisible={handleMessageVisible}
                  onImagePreview={setPreviewImage}
                />
              ) : (
                <EmptyConversation hasThreads={threadRows.length > 0} />
              )
            }
          />
        </main>

        {/* ---- Buyer-only modals (unchanged contracts) ---- */}
        {previewImage && (
          <ImagePreviewModal imageUrl={previewImage} isOpen onClose={() => setPreviewImage(null)} />
        )}

        {showCustomRequestModal && activeThread && (
          <CustomRequestModal
            show={showCustomRequestModal}
            onClose={closeCustomRequestModal}
            activeThread={activeThread}
            onSubmit={handleCustomRequestSubmit}
            customRequestForm={{
              title: customRequestForm.title ?? '',
              price: customRequestForm.price ?? '',
              description: customRequestForm.description ?? '',
            }}
            setCustomRequestForm={handleCustomRequestFormChange}
            customRequestErrors={customRequestErrors}
            isSubmittingRequest={isSubmittingRequest}
            wallet={wallet || {}}
            user={user}
          />
        )}

        {showPayModal && payingRequest && activeThread && (
          <PaymentModal
            show={showPayModal}
            onClose={() => {
              setShowPayModal(false);
              setPayingRequest(null);
            }}
            payingRequest={payingRequest}
            wallet={wallet || {}}
            user={user}
            onConfirmPay={handleConfirmPay}
          />
        )}

        {showTipModal && activeThread && (
          <TipModal
            show={showTipModal}
            onClose={() => {
              setShowTipModal(false);
              setTipAmount('');
              setTipResult(null);
            }}
            activeThread={activeThread}
            tipAmount={tipAmount}
            setTipAmount={setTipAmount}
            tipResult={tipResult}
            wallet={wallet || {}}
            user={user}
            onSendTip={handleSendTip}
          />
        )}
      </RequireAuth>
    </BanCheck>
  );
}
