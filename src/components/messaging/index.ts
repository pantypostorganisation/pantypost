// src/components/messaging/index.ts
//
// One messaging component set, shared by buyer, seller and admin.
// Replaces two near-duplicate trees under components/buyers/messages and
// components/seller/messages (plus seven files that nothing imported).

export { default as MessagingLayout } from './MessagingLayout';
export { default as ThreadList } from './ThreadList';
export { default as ThreadRow } from './ThreadRow';
export { default as ConversationHeader } from './ConversationHeader';
export { default as MessageList } from './MessageList';
export { default as MessageBubble } from './MessageBubble';
export { default as CustomRequestCard } from './CustomRequestCard';
export { default as TipCard } from './TipCard';
export { default as Composer } from './Composer';
export { default as EmojiPicker } from './EmojiPicker';
export { default as EmptyConversation } from './EmptyConversation';
export { default as Avatar } from './Avatar';

export { buildTranscript, dayLabel, timeLabel } from './transcript';
export type {
  MessagingRole,
  MessageKind,
  SendState,
  UIMessage,
  UIThread,
  UICustomRequest,
  MessageGroup,
  TranscriptItem,
} from './types';
