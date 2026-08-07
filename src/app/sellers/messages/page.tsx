// src/app/sellers/messages/page.tsx
'use client';

import React, { useCallback, useEffect, useMemo } from 'react';
import RequireAuth from '@/components/RequireAuth';
import BanCheck from '@/components/BanCheck';
import { useSellerMessages } from '@/hooks/useSellerMessages';
import {
  MessagingLayout,
  ThreadList,
  ConversationPane,
  EmptyConversation,
  ImagePreviewModal,
} from '@/components/messaging';
import type { UICustomRequest, UIThread } from '@/components/messaging';

/* =====================================================================
 * Seller messages — the same shared set the buyer page renders.
 *
 * Role differences are expressed as props, not as a second component
 * tree: no tip / custom-request buttons in the composer, request actions
 * call the seller hook's id-based handlers, and "view profile" in the
 * header points at the buyer rather than a shop.
 *
 * components/seller/messages/* is now unreferenced dead code, to be
 * deleted in a later cleanup pass.
 * ===================================================================== */

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

export default function SellerMessagesPage() {
  const {
    // Auth
    user,

    // Messages & threads
    threads,
    uiUnreadCounts,
    lastMessages,
    buyerProfiles,
    activeThread,
    setActiveThread,

    // UI State
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
    sellerRequests,
    editRequestId,
    setEditRequestId,
    editPrice,
    setEditPrice,
    editTitle,
    setEditTitle,
    editMessage,
    setEditMessage,

    // Actions
    handleReply,
    handleBlockToggle,
    handleReport,
    handleAccept,
    handleDecline,
    handleEditRequest,
    handleEditSubmit,
    handleImageSelect,
    handleMessageVisible,
    handleEmojiClick,

    // Status (booleans for the active thread on this hook)
    isUserBlocked,
    isUserReported,
  } = useSellerMessages();

  /* ---- Normalise the hook's map types once ----
     This hook's messages pass through a Zod schema that omits `id`, so
     `lastMessages` is typed without the one field UIMessage requires.
     The runtime objects carry it, and ThreadRow never reads it — hence
     the through-unknown cast. (The schema gap itself is logged in the
     debt list: validation is silently stripping a field the app uses.) */
  const lastMessageMap = lastMessages as unknown as {
    [buyer: string]: UIThread['lastMessage'];
  };

  /* ClientLayout hides the site header on mobile while a thread is open. */
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('threadStateChange', { detail: { hasActiveThread: !!activeThread } })
    );
  }, [activeThread]);

  /* ---- Requests, indexed and counted ---- */
  const requestsById = useMemo(() => {
    const map: Record<string, UICustomRequest> = {};
    (sellerRequests || []).forEach((request: any) => {
      if (request?.id) map[request.id] = toUIRequest(request);
    });
    return map;
  }, [sellerRequests]);

  const awaitingMeByBuyer = useMemo(() => {
    const counts: Record<string, number> = {};
    if (!user) return counts;
    (sellerRequests || []).forEach((request: any) => {
      const open = request?.status === 'pending' || request?.status === 'edited';
      if (!open) return;
      const myTurn = request.pendingWith
        ? request.pendingWith === user.username
        : (request.lastModifiedBy || request.lastEditedBy) !== user.username;
      if (!myTurn) return;
      const buyer = request.buyer;
      if (buyer) counts[buyer] = (counts[buyer] || 0) + 1;
    });
    return counts;
  }, [sellerRequests, user]);

  /* ---- Thread map → sorted rows ----
     Note the profile shape: this hook exposes { pic, verified }, the buyer
     hook exposes { profilePic, isVerified }. Normalised here so the shared
     components only ever see one vocabulary. */
  const threadRows: UIThread[] = useMemo(() => {
    return Object.keys(threads)
      .map((buyer) => ({
        username: buyer,
        lastMessage: lastMessageMap[buyer],
        unreadCount: uiUnreadCounts[buyer] || 0,
        profilePic: buyerProfiles[buyer]?.pic ?? null,
        isVerified: buyerProfiles[buyer]?.verified ?? false,
        pendingRequests: awaitingMeByBuyer[buyer] || 0,
      }))
      .sort((a, b) => {
        const ta = a.lastMessage?.date ? new Date(a.lastMessage.date).getTime() : 0;
        const tb = b.lastMessage?.date ? new Date(b.lastMessage.date).getTime() : 0;
        return tb - ta;
      });
  }, [threads, lastMessageMap, uiUnreadCounts, buyerProfiles, awaitingMeByBuyer]);

  /* Seller's edit-price state is number | ''; the card's input speaks
     strings. Parse at the boundary. */
  const setEditPriceFromString = useCallback(
    (value: string) => {
      const cleaned = value.replace(/[^\d.]/g, '');
      const parsed = parseFloat(cleaned);
      setEditPrice(cleaned === '' || Number.isNaN(parsed) ? '' : parsed);
    },
    [setEditPrice]
  );

  const activeMessages = activeThread ? threads[activeThread] || [] : [];
  const activeProfile = activeThread ? buyerProfiles[activeThread] : undefined;

  if (!user) {
    return (
      <BanCheck>
        <RequireAuth role="seller">
          <div className="flex h-full items-center justify-center bg-surface">
            <div className="loading-spinner" aria-label="Loading messages" />
          </div>
        </RequireAuth>
      </BanCheck>
    );
  }

  return (
    <BanCheck>
      <RequireAuth role="seller">
        <main className="h-full min-h-0 w-full overflow-hidden bg-surface">
          <MessagingLayout
            hasActiveThread={!!activeThread}
            sidebar={
              <ThreadList
                threads={threadRows}
                activeThread={activeThread}
                currentUser={user.username}
                role="seller"
                onSelect={setActiveThread}
              />
            }
            conversation={
              activeThread ? (
                <ConversationPane
                  role="seller"
                  currentUser={user.username}
                  activeThread={activeThread}
                  messages={activeMessages}
                  profilePic={activeProfile?.pic ?? null}
                  isVerified={activeProfile?.verified ?? false}
                  isBlocked={isUserBlocked}
                  hasReported={isUserReported}
                  onBack={() => setActiveThread(null)}
                  onBlockToggle={handleBlockToggle}
                  onReport={handleReport}
                  composer={{
                    value: replyMessage,
                    onChange: setReplyMessage,
                    onSend: handleReply,
                    imagePreviewUrl: selectedImage,
                    onImageFile: handleImageSelect,
                    onClearImage: () => setSelectedImage(null),
                    isUploading: isImageLoading,
                    uploadError: imageError,
                    recentEmojis,
                    onEmojiSelect: handleEmojiClick,
                  }}
                  requestsById={requestsById}
                  onAcceptRequest={(request) => handleAccept(request.id)}
                  onDeclineRequest={(request) => handleDecline(request.id)}
                  onCounterRequest={(request) =>
                    handleEditRequest(request.id, request.title, request.price, request.description)
                  }
                  requestEditState={{
                    requestId: editRequestId,
                    title: editTitle,
                    price: editPrice === '' ? '' : String(editPrice),
                    message: editMessage,
                    setTitle: setEditTitle,
                    setPrice: setEditPriceFromString,
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

        {previewImage && (
          <ImagePreviewModal imageUrl={previewImage} isOpen onClose={() => setPreviewImage(null)} />
        )}
      </RequireAuth>
    </BanCheck>
  );
}
