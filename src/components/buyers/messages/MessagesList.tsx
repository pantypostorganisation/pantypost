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
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

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
  // Prepare message data with all necessary props
  const messageData = useMemo(() => {
    return messages.map((msg, index) => {
      const isFromMe = msg.sender === currentUser?.username;
      
      // Get custom request info if available
      let customReq: CustomRequest | undefined = undefined;
      if (msg.type === 'customRequest' && msg.meta && typeof msg.meta.id === 'string') {
        customReq = buyerRequests.find((r: CustomRequest) => r.id === msg.meta?.id);
      }
      
      const isLatestCustom = !!customReq &&
        (customReq.status === 'pending' || customReq.status === 'edited' || customReq.status === 'accepted') &&
        msg.type === 'customRequest';
      
      // Show pay now button for accepted requests that aren't paid yet
      const showPayNow = !!customReq &&
        customReq.status === 'accepted' &&
        !customReq.paid &&
        msg.type === 'customRequest';
      
      const markupPrice = customReq ? Math.round(customReq.price * 1.1 * 100) / 100 : 0;
      const buyerBalance = currentUser && wallet ? (wallet[currentUser.username] || 0) : 0;
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

  // Render function for virtual list
  const renderMessage = useCallback((item: typeof messageData[0]) => {
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
          itemHeight={100} // Adjust based on average message height
          renderItem={renderMessage}
          className="p-4 h-full overflow-y-auto"
        />
        
        {/* Auto-scroll anchor */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
