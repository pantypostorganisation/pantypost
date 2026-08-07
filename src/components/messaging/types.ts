// src/components/messaging/types.ts
//
// Shared vocabulary for the messaging UI. Buyer, seller and admin all
// render the same components; the differences are expressed as a `role`
// and a set of optional callbacks, not as three parallel component trees.
//
// Before this, buyer and seller each had their own ChatHeader,
// ConversationView, MessageItem, MessageInput, MessagesList, ThreadsSidebar,
// EmptyState and EmojiPicker — roughly 80% identical, drifting apart, with
// seven of those files unreachable dead code.

export type MessagingRole = 'buyer' | 'seller' | 'admin';

export type MessageKind = 'normal' | 'image' | 'customRequest' | 'tip';

/** Delivery state of an outgoing message. */
export type SendState = 'sending' | 'sent' | 'read' | 'failed';

export interface UIMessage {
  id: string;
  sender: string;
  receiver: string;
  content: string;
  /** ISO string. */
  date: string;
  type: MessageKind;
  isRead?: boolean;
  read?: boolean;
  meta?: {
    title?: string;
    price?: number;
    tags?: string[];
    message?: string;
    imageUrl?: string;
    tipAmount?: number;
    id?: string;
  };
  /** Set on optimistic messages that have not been confirmed yet. */
  pending?: boolean;
  /** Set when a send failed and can be retried. */
  failed?: boolean;
}

export interface UIThread {
  /** The other participant's username. */
  username: string;
  lastMessage?: UIMessage;
  unreadCount: number;
  profilePic?: string | null;
  isVerified?: boolean;
  /** Presence string, e.g. "Active now". Omitted when unknown. */
  activity?: string | null;
  isOnline?: boolean;
  /** Number of custom requests awaiting this user's response. */
  pendingRequests?: number;
}

export interface UICustomRequest {
  id: string;
  title: string;
  description: string;
  price: number;
  tags: string[];
  status: 'pending' | 'accepted' | 'rejected' | 'edited' | 'paid';
  /** Whose turn it is. Undefined once settled. */
  pendingWith?: string;
  lastEditedBy?: string;
  lastModifiedBy?: string;
  paid?: boolean;
}

/**
 * Consecutive messages from one sender, close together in time, drawn as a
 * single stack with one timestamp — the thing every mature messenger does
 * and the old UI did not, which is why a five-message burst printed the
 * sender's name and the time five times.
 */
export interface MessageGroup {
  key: string;
  sender: string;
  isOwn: boolean;
  messages: UIMessage[];
}

/** A day separator or a run of messages. */
export type TranscriptItem =
  | { kind: 'day'; key: string; label: string }
  | { kind: 'unread'; key: string; count: number }
  | { kind: 'group'; key: string; group: MessageGroup };
