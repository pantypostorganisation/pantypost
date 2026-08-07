// src/components/messaging/ConversationPane.tsx
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { useWebSocket } from '@/context/WebSocketContext';
import { useUserActivityStatus } from '@/hooks/useUserActivityStatus';
import { formatActivityStatus } from '@/utils/format';
import type { Message } from '@/types/message';
import ConversationHeader from './ConversationHeader';
import MessageList from './MessageList';
import Composer from './Composer';
import TypingIndicator from './TypingIndicator';
import { type RequestEditState } from './CustomRequestCard';
import { collapseSupersededRequests, getConversationKey } from './transcript';
import type { MessagingRole, UICustomRequest, UIMessage } from './types';

/* =====================================================================
 * One conversation, assembled: header, transcript, typing, composer.
 *
 * This is the piece the shared set was missing. The header, list and
 * composer existed, but the connective tissue — typing events, thread
 * focus/blur, presence, read-marking, the unread divider — still lived
 * only inside the two old ConversationViews, duplicated and diverging.
 * Both role pages now render THIS and pass their hook's state in; the
 * differences between buyer and seller are props, not parallel trees.
 *
 * Websocket details worth knowing:
 *
 *  - The typing/focus conversation key is the server's form — sorted RAW
 *    usernames. The old buyer view sanitised one side of the comparison,
 *    which is why typing events were silently dropped for some usernames.
 *  - Typing emits are throttled to one per second while typing continues,
 *    and a 3-second quiet timer sends the stop. Incoming "typing" is
 *    auto-hidden after 5 seconds in case the stop event never arrives.
 * ===================================================================== */

/** What the composer needs from the role hook. */
export interface PaneComposerBindings {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  /** Uploaded-image URL awaiting send, if any. */
  imagePreviewUrl?: string | null;
  onImageFile?: (file: File) => void;
  onClearImage?: () => void;
  isUploading?: boolean;
  uploadError?: string | null;
  recentEmojis?: string[];
  /** The hook's emoji handler — appends AND records recents. */
  onEmojiSelect?: (emoji: string) => void;
  /** Buyer-only. */
  onRequestCustom?: () => void;
  onSendTip?: () => void;
}

export interface ConversationPaneProps {
  role: MessagingRole;
  currentUser: string;
  /** The other participant's username. */
  activeThread: string;
  /** Raw thread messages from the hook, oldest first. */
  messages: Message[];
  profilePic?: string | null;
  isVerified?: boolean;
  isBlocked: boolean;
  hasReported: boolean;
  onBack: () => void;
  onBlockToggle: () => void;
  onReport: () => void;
  composer: PaneComposerBindings;
  /** Custom requests involving this conversation, keyed by request id. */
  requestsById?: Record<string, UICustomRequest>;
  onAcceptRequest?: (request: UICustomRequest) => Promise<void> | void;
  onDeclineRequest?: (request: UICustomRequest) => Promise<void> | void;
  onCounterRequest?: (request: UICustomRequest) => void;
  onPayRequest?: (request: UICustomRequest) => void;
  requestEditState?: RequestEditState;
  /** Mark an incoming message as read once it has been seen. */
  onMessageVisible?: (message: Message) => void;
  onImagePreview?: (url: string) => void;
}

export default function ConversationPane({
  role,
  currentUser,
  activeThread,
  messages,
  profilePic,
  isVerified,
  isBlocked,
  hasReported,
  onBack,
  onBlockToggle,
  onReport,
  composer,
  requestsById,
  onAcceptRequest,
  onDeclineRequest,
  onCounterRequest,
  onPayRequest,
  requestEditState,
  onMessageVisible,
  onImagePreview,
}: ConversationPaneProps) {
  const wsContext = useWebSocket();
  const { activityStatus } = useUserActivityStatus(activeThread);

  const conversationKey = getConversationKey(currentUser, activeThread);

  /* ---- Presence line under the name ---- */
  const isOnline = Boolean(activityStatus?.isOnline) && !isBlocked;
  const activityLine = isBlocked
    ? 'Blocked'
    : activityStatus
      ? formatActivityStatus(activityStatus.isOnline, activityStatus.lastActive)
      : null;

  /* ---- Raw hook messages → UI messages ---- */
  const originalByIdRef = useRef(new Map<string, Message>());

  const uiMessages: UIMessage[] = useMemo(() => {
    originalByIdRef.current = new Map();
    const list = messages.map((message, index) => {
      const optimistic = Boolean((message as { _optimistic?: boolean })._optimistic);
      const id = message.id || `${message.sender}-${message.date}-${index}`;
      originalByIdRef.current.set(id, message);
      return {
        id,
        sender: message.sender,
        receiver: message.receiver,
        content: message.content || '',
        date: message.date,
        type: (message.type || 'normal') as UIMessage['type'],
        isRead: message.isRead,
        read: message.read,
        meta: message.meta,
        pending: optimistic,
      };
    });
    /* One card per request: every counter-offer emits another
       customRequest message, and the stale ones showed stale buttons. */
    return collapseSupersededRequests(list);
  }, [messages]);

  /* ---- Unread divider: captured once per opened thread ---- */
  const [firstUnreadId, setFirstUnreadId] = useState<string | null>(null);
  const capturedForRef = useRef<string | null>(null);

  useEffect(() => {
    if (capturedForRef.current === activeThread) return;
    if (uiMessages.length === 0) return; // wait for the thread to load once
    capturedForRef.current = activeThread;
    const first = uiMessages.find(
      (m) => m.sender !== currentUser && !m.isRead && !m.read && !m.pending
    );
    setFirstUnreadId(first ? first.id : null);
  }, [activeThread, uiMessages, currentUser]);

  /* ---- Focus / blur so the server can suppress push for the open thread ---- */
  useEffect(() => {
    if (!wsContext?.sendMessage) return;
    wsContext.sendMessage('thread:focus', { threadId: conversationKey, otherUser: activeThread });
    return () => {
      wsContext.sendMessage?.('thread:blur', { threadId: conversationKey, otherUser: activeThread });
    };
  }, [wsContext, conversationKey, activeThread]);

  /* ---- Incoming typing ---- */
  const [otherTyping, setOtherTyping] = useState(false);
  const hideTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setOtherTyping(false);
    if (!wsContext?.subscribe) return;

    const handle = (data: { conversationId?: string; username?: string; isTyping?: boolean }) => {
      if (data?.conversationId !== conversationKey) return;
      if (data?.username !== activeThread) return;

      if (hideTypingTimeoutRef.current) {
        clearTimeout(hideTypingTimeoutRef.current);
        hideTypingTimeoutRef.current = null;
      }
      setOtherTyping(Boolean(data.isTyping));
      if (data.isTyping) {
        hideTypingTimeoutRef.current = setTimeout(() => setOtherTyping(false), 5000);
      }
    };

    const unsubscribe = wsContext.subscribe('message:typing', handle);
    return () => {
      if (hideTypingTimeoutRef.current) {
        clearTimeout(hideTypingTimeoutRef.current);
        hideTypingTimeoutRef.current = null;
      }
      unsubscribe?.();
    };
  }, [wsContext, conversationKey, activeThread]);

  /* ---- Outgoing typing ---- */
  const isTypingRef = useRef(false);
  const lastEmitRef = useRef(0);
  const quietTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopTyping = useCallback(() => {
    if (quietTimeoutRef.current) {
      clearTimeout(quietTimeoutRef.current);
      quietTimeoutRef.current = null;
    }
    if (isTypingRef.current && wsContext?.sendMessage) {
      isTypingRef.current = false;
      wsContext.sendMessage('message:typing', {
        conversationId: conversationKey,
        isTyping: false,
      });
    }
  }, [wsContext, conversationKey]);

  const handleComposerChange = useCallback(
    (value: string) => {
      composer.onChange(value);
      if (!wsContext?.sendMessage) return;

      if (value.trim()) {
        const now = Date.now();
        if (!isTypingRef.current || now - lastEmitRef.current > 1000) {
          wsContext.sendMessage('message:typing', {
            conversationId: conversationKey,
            isTyping: true,
          });
          lastEmitRef.current = now;
          isTypingRef.current = true;
        }
        if (quietTimeoutRef.current) clearTimeout(quietTimeoutRef.current);
        quietTimeoutRef.current = setTimeout(stopTyping, 3000);
      } else {
        stopTyping();
      }
    },
    [composer, wsContext, conversationKey, stopTyping]
  );

  const handleSend = useCallback(() => {
    stopTyping();
    composer.onSend();
  }, [composer, stopTyping]);

  // Leaving the conversation must not strand a dangling "is typing".
  useEffect(() => stopTyping, [activeThread, stopTyping]);

  /* ---- Read marking: translate UI ids back to the hook's Message ---- */
  const handleVisible = useCallback(
    (uiMessage: UIMessage) => {
      const original = originalByIdRef.current.get(uiMessage.id);
      if (original) onMessageVisible?.(original);
    },
    [onMessageVisible]
  );

  const blockedNotice = (
    <span className="inline-flex flex-wrap items-center justify-center gap-2">
      <ShieldAlert className="h-4 w-4 shrink-0 text-danger" aria-hidden="true" />
      <span>You&rsquo;ve blocked {activeThread}.</span>
      <button
        type="button"
        onClick={onBlockToggle}
        className="font-semibold text-primary hover:underline"
      >
        Unblock to message
      </button>
    </span>
  );

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface">
      <ConversationHeader
        username={activeThread}
        profilePic={profilePic}
        isVerified={isVerified}
        isOnline={isOnline}
        activity={activityLine}
        role={role}
        isBlocked={isBlocked}
        onBack={onBack}
        onBlockToggle={onBlockToggle}
        onReport={onReport}
        hasReported={hasReported}
      />

      <MessageList
        messages={uiMessages}
        currentUser={currentUser}
        role={role}
        peerUsername={activeThread}
        peerPic={profilePic}
        requestsById={requestsById}
        firstUnreadId={firstUnreadId}
        threadKey={activeThread}
        onImageClick={onImagePreview}
        onMessageVisible={onMessageVisible ? handleVisible : undefined}
        onAcceptRequest={onAcceptRequest}
        onDeclineRequest={onDeclineRequest}
        onCounterRequest={onCounterRequest}
        onPayRequest={onPayRequest}
        requestEditState={requestEditState}
        footerSignal={otherTyping}
        footer={
          <TypingIndicator
            username={activeThread}
            isTyping={otherTyping && !isBlocked}
            userPic={profilePic}
          />
        }
      />

      <Composer
        value={composer.value}
        onChange={handleComposerChange}
        onSend={handleSend}
        notice={isBlocked ? blockedNotice : undefined}
        placeholder={`Message ${activeThread}`}
        recentEmojis={composer.recentEmojis}
        onEmojiSelect={composer.onEmojiSelect}
        onImageSelected={composer.onImageFile}
        imagePreview={composer.imagePreviewUrl}
        onClearImage={composer.onClearImage}
        isUploading={composer.isUploading}
        error={composer.uploadError}
        onRequestCustom={composer.onRequestCustom}
        onSendTip={composer.onSendTip}
      />
    </div>
  );
}
