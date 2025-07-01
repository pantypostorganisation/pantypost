// src/components/buyers/messages/MessagesList.tsx
'use client';

import React from 'react';
import MessageItem from './MessageItem';
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
  return (
    <div className="flex-1 overflow-y-auto bg-[#121212]">
      <div className="max-w-3xl mx-auto space-y-4 p-4">
        {messages.map((msg, index) => {
          const isFromMe = msg.sender === currentUser?.username;
          
          // Get custom request info if available
          let customReq: CustomRequest | undefined = undefined;
          if (msg.type === 'customRequest' && msg.meta && typeof msg.meta.id === 'string') {
            customReq = buyerRequests.find((r: CustomRequest) => r.id === msg.meta?.id);
          }
          
          const isLatestCustom = !!customReq &&
            (customReq.status === 'pending' || customReq.status === 'edited' || customReq.status === 'accepted') &&
            index === (messages.length - 1) &&
            msg.type === 'customRequest';
          
          const showPayNow = !!customReq &&
            customReq.status === 'accepted' &&
            index === (messages.length - 1) &&
            msg.type === 'customRequest';
          
          const markupPrice = customReq ? Math.round(customReq.price * 1.1 * 100) / 100 : 0;
          const buyerBalance = currentUser ? wallet[currentUser.username] ?? 0 : 0;
          const canPay = !!(customReq && buyerBalance >= markupPrice);
          const isPaid = !!(customReq && (customReq.paid || customReq.status === 'paid'));
          
          return (
            <MessageItem
              key={`${msg.id || index}-${msg.date}`}
              msg={msg}
              index={index}
              isFromMe={isFromMe}
              user={currentUser}
              activeThread={activeThread}
              onMessageVisible={onMessageVisible}
              customReq={customReq}
              isLatestCustom={isLatestCustom}
              isPaid={isPaid}
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
              showPayNow={showPayNow}
              handlePayNow={handlePayNow}
              markupPrice={markupPrice}
              canPay={canPay}
            />
          );
        })}
        
        {/* Auto-scroll anchor */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}