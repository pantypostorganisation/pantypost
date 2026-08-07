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
 * Both role pages render THIS and pass their hook's state in; the
 * differences between buyer and seller are props, not parallel trees.
 *
 * WEBSOCKET STABILITY — the lesson this file now embodies:
 *
 * The context value returned by useWebSocket() is NOT identity-stable
 * across renders. The first version of this file put it (and callbacks
 * derived from it) in effect dependency arrays, so every re-render of
 * the pane re-ran cleanups. The sender's pane re-renders on every
 * keystroke, and one of those cleanups emitted `isTyping: false` — so
 * the other person watched the indicator strobe on and off for the
 * entire time you typed. The same instability was re-firing thread
 * focus/blur at the server per render.
 *
 * The rule now: the live context is read through a ref at call time.
 * Effects key on the CONVERSATION (conversationKey / activeThread),
 * never on the context object. The one exception is the subscription
 * effect, which keeps wsContext in its deps so a rebuilt provider is
 * re-subscribed — but it no longer touches any state in its body, so
 * re-running it is invisible.
 *
 * Typing protocol details:
 *  - Emits are throttled to ~1/second while typing continues (doubling
 *    as a keepalive), with a 3-second quiet timer sending the stop.
 *  - Incoming `false` is applied after a 500ms grace window, cancelled
 *    by any `true` — jitter and out-of-order events cannot blink the
 *    indicator. A 6-second failsafe hides it if events stop entirely.
 *  - The conversation key is the server's form — sorted RAW usernames.
 *    The old buyer view sanitised one side of the comparison, which is
 *    why typing events were silently dropped for some usernames.
 *
 * PRESENCE: the activity line and the green dot render only once the
 * lookup for THIS username has finished. Both old views ignored the
 * hook's `loading` flag, so flicking between threads showed the
 * previous person's "Active now" under the new person's name.
 * ===================================================================== */

/** Grace before honouring an isTyping:false — cancelled by any true. */
const TYPING_FALSE_GRACE_MS = 500;
/** Hide if typing events stop arriving entirely (keepalive is ~1s). */
const TYPING_FAILSAFE_MS = 6000;

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

  /* Live context behind a ref: senders read this at call time, so the
     context's per-render identity churn cannot invalidate anything. */
  const wsRef = useRef(wsContext);
  wsRef.current = wsContext;

  const { activityStatus, loading: activityLoading } = useUserActivityStatus(activeThread);

  const conversationKey = getConversationKey(currentUser, activeThread);

  /* ---- Presence line under the name ----
     Nothing renders until the lookup for THIS username has finished;
     otherwise thread-switching shows the previous person's status. */
  const activityReady = !activityLoading && Boolean(activityStatus);
  const isOnline = activityReady && Boolean(activityStatus?.isOnline) && !isBlocked;
  const activityLine = isBlocked
    ? 'Blocked'
    : activityReady && activityStatus
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

  /* ---- Focus / blur so the server can suppress push for the open thread.
     Keyed on the conversation only; the context is read through the ref,
     so provider churn cannot spam focus/blur pairs at the server. */
  useEffect(() => {
    wsRef.current?.sendMessage?.('thread:focus', {
      threadId: conversationKey,
      otherUser: activeThread,
    });
    return () => {
      wsRef.current?.sendMessage?.('thread:blur', {
        threadId: conversationKey,
        otherUser: activeThread,
      });
    };
  }, [conversationKey, activeThread]);

  /* ---- Incoming typing ---- */
  const [otherTyping, setOtherTyping] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHideTimer = () => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };

  /* Reset lives in its own thread-keyed effect. It must NOT live in the
     subscription effect's body: that effect legitimately re-runs when
     the provider rebuilds, and resetting there is what blanked the
     indicator between keepalives in the first version. */
  useEffect(() => {
    setOtherTyping(false);
    clearHideTimer();
  }, [activeThread]);

  useEffect(() => {
    if (!wsContext?.subscribe) return;

    const handle = (data: { conversationId?: string; username?: string; isTyping?: boolean }) => {
      if (data?.conversationId !== conversationKey) return;
      if (data?.username !== activeThread) return;

      if (data.isTyping) {
        clearHideTimer();
        setOtherTyping(true);
        // Failsafe: keepalives arrive ~1/s; silence means they're gone.
        hideTimerRef.current = setTimeout(() => setOtherTyping(false), TYPING_FAILSAFE_MS);
      } else {
        // Grace window: a stray false between keepalives must not blink.
        clearHideTimer();
        hideTimerRef.current = setTimeout(() => setOtherTyping(false), TYPING_FALSE_GRACE_MS);
      }
    };

    const unsubscribe = wsContext.subscribe('message:typing', handle);
    return () => {
      unsubscribe?.();
    };
    // wsContext stays in deps so a rebuilt provider is re-subscribed;
    // with a state-free body, the re-run is invisible.
  }, [wsContext, conversationKey, activeThread]);

  useEffect(() => clearHideTimer, []);

  /* ---- Outgoing typing ---- */
  const isTypingRef = useRef(false);
  const lastEmitRef = useRef(0);
  const quietTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopTyping = useCallback(() => {
    if (quietTimerRef.current) {
      clearTimeout(quietTimerRef.current);
      quietTimerRef.current = null;
    }
    if (isTypingRef.current) {
      isTypingRef.current = false;
      wsRef.current?.sendMessage?.('message:typing', {
        conversationId: conversationKey,
        isTyping: false,
      });
    }
  }, [conversationKey]);

  /* Leaving the conversation (or unmounting) must not strand a dangling
     "is typing" — but ONLY those events may trigger it. The latest
     stopTyping is reached through a ref precisely so that callback
     identity can never join the dependency array: depending on it is
     what fired a phantom stop on every keystroke's re-render. */
  const stopTypingRef = useRef(stopTyping);
  useEffect(() => {
    stopTypingRef.current = stopTyping;
  }, [stopTyping]);

  useEffect(() => {
    return () => stopTypingRef.current();
  }, [activeThread]);

  const handleComposerChange = useCallback(
    (value: string) => {
      composer.onChange(value);

      if (value.trim()) {
        const now = Date.now();
        if (!isTypingRef.current || now - lastEmitRef.current > 1000) {
          wsRef.current?.sendMessage?.('message:typing', {
            conversationId: conversationKey,
            isTyping: true,
          });
          lastEmitRef.current = now;
          isTypingRef.current = true;
        }
        if (quietTimerRef.current) clearTimeout(quietTimerRef.current);
        quietTimerRef.current = setTimeout(() => stopTypingRef.current(), 3000);
      } else {
        stopTypingRef.current();
      }
    },
    [composer, conversationKey]
  );

  const handleSend = useCallback(() => {
    stopTypingRef.current();
    composer.onSend();
  }, [composer]);

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
