// src/components/buyers/messages/MessagesList.tsx
'use client';

import React, { useMemo, useCallback } from 'react';
import MessageItem from './MessageItem';
import { VirtualList } from '@/components/VirtualList';
import { Message, CustomRequest } from '@/utils/messageUtils';

interface MessagesListProps {
  messages: Message[];
  currentUser: any;
  activeThread: string;
  buyerRequests: CustomRequest[];
  onMessageVisible: (msg: Message) => void;
  handleAccept: (req: CustomRequest) => void;
  handleDecline: (req: CustomRequest) => void;
  handleEditRequest: (req: CustomRequest) => void;
  handlePayNow: (req: CustomRequest) => void;
  editRequestId: string | null;
  editTitle: string;
  setEditTitle: (title: string) => void;
  editPrice: number | '';
  setEditPrice: (price: number | '') => void;
  editMessage: string;
  setEditMessage: (message: string) => void;
  handleEditSubmit: () => void;
  setEditRequestId: (id: string | null) => void;
  statusBadge: (status: string) => React.ReactElement;
  setPreviewImage: (url: string | null) => void;
  wallet: { [username: string]: number };
  messagesEndRef: React.RefObject<HTMLDivElement | null>; // allow null
}

// Define a concrete item type instead of using typeof messageData[0]
type RowItem = {
  msg: Message;
  index: number;
  isFromMe: boolean;
  customReq?: CustomRequest;
  isLatestCustom: boolean;
  isPaid: boolean;
  showPayNow: boolean;
  markupPrice: number;
  canPay: boolean;
  key: string;
};

export default function MessagesList({
  messages,
  currentUser,
  activeThread,
  buyerRequests,
  onMessageVisible,
  handleAccept,
  handleDecline,
  handleEditRequest,
  handlePayNow,
  editRequestId,
  editTitle,
  setEditTitle,
  editPrice,
  setEditPrice,
  editMessage,
  setEditMessage,
  handleEditSubmit,
  setEditRequestId,
  statusBadge,
  setPreviewImage,
  wallet,
  messagesEndRef
}: MessagesListProps) {
  const messageData: RowItem[] = useMemo(() => {
    return messages.map((msg, index) => {
      const isFromMe = msg.sender === currentUser?.username;

      let customReq: CustomRequest | undefined;
      if (msg.type === 'customRequest' && msg.meta && typeof msg.meta.id === 'string') {
        customReq = buyerRequests.find((r) => r.id === msg.meta?.id);
      }

      const isLatestCustom =
        !!customReq &&
        (customReq.status === 'pending' ||
          customReq.status === 'edited' ||
          customReq.status === 'accepted') &&
        msg.type === 'customRequest';

      const showPayNow =
        !!customReq && customReq.status === 'accepted' && !customReq.paid && msg.type === 'customRequest';

      const base = customReq ? Number(customReq.price) || 0 : 0;
      const markupPrice = Math.round(base * 1.1 * 100) / 100;
      const buyerBalance = currentUser && wallet ? Number(wallet[currentUser.username] || 0) : 0;
      const canPay = !!(customReq && buyerBalance >= markupPrice);
      const isPaid = !!(customReq && (customReq.paid || customReq.status === 'paid'));

      return {
        msg,
        index,
        isFromMe,
        customReq,
        isLatestCustom,
        isPaid,
        showPayNow,
        markupPrice,
        canPay,
        key: `${msg.id || index}-${msg.date}`
      };
    });
  }, [messages, currentUser, buyerRequests, wallet]);

  const renderMessage = useCallback((item: RowItem) => {
    return (
      <MessageItem
        key={item.key}
        msg={item.msg}
        index={item.index}
        isFromMe={item.isFromMe}
        user={currentUser}
        activeThread={activeThread}
        onMessageVisible={onMessageVisible}
        customReq={item.customReq}
        isLatestCustom={item.isLatestCustom}
        isPaid={item.isPaid}
        handleAccept={handleAccept}
        handleDecline={handleDecline}
        handleEditRequest={handleEditRequest}
        editRequestId={editRequestId}
        editTitle={editTitle}
        setEditTitle={setEditTitle}
        editPrice={editPrice}
        setEditPrice={setEditPrice}
        editMessage={editMessage}
        setEditMessage={setEditMessage}
        handleEditSubmit={handleEditSubmit}
        setEditRequestId={setEditRequestId}
        statusBadge={statusBadge}
        setPreviewImage={setPreviewImage}
        showPayNow={item.showPayNow}
        handlePayNow={handlePayNow}
        markupPrice={item.markupPrice}
        canPay={item.canPay}
      />
    );
  }, [
    currentUser,
    activeThread,
    onMessageVisible,
    handleAccept,
    handleDecline,
    handleEditRequest,
    handlePayNow,
    editRequestId,
    editTitle,
    setEditTitle,
    editPrice,
    setEditPrice,
    editMessage,
    setEditMessage,
    handleEditSubmit,
    setEditRequestId,
    statusBadge,
    setPreviewImage
  ]);

  return (
    <div className="flex-1 overflow-hidden bg-[#121212]">
      <div className="h-full max-w-3xl mx-auto">
        <VirtualList
          items={messageData}
          itemHeight={100}
          renderItem={renderMessage}
          className="p-4 h-full overflow-y-auto"
        />
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
