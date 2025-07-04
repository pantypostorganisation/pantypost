// src/components/seller/messages/MessagesList.tsx
'use client';

import React, { useState, useCallback, useRef } from 'react';
import MessageItem from './MessageItem';

interface MessagesListProps {
  threadMessages: any[];
  sellerRequests: any[];
  user: any;
  activeThread: string;
  handleAccept: (requestId: string) => void;
  handleDecline: (requestId: string) => void;
  handleEditRequest: (requestId: string, title: string, price: number, message: string) => void;
  handleEditSubmit: () => void;
  handleMessageVisible: (msg: any) => void;
  editRequestId: string | null;
  setEditRequestId: (id: string | null) => void;
  editPrice: number | '';
  setEditPrice: (price: number | '') => void;
  editTitle: string;
  setEditTitle: (title: string) => void;
  editMessage: string;
  setEditMessage: (message: string) => void;
  setPreviewImage: (url: string | null) => void;
}

export default function MessagesList({
  threadMessages,
  sellerRequests,
  user,
  activeThread,
  handleAccept,
  handleDecline,
  handleEditRequest,
  handleEditSubmit,
  handleMessageVisible,
  editRequestId,
  setEditRequestId,
  editPrice,
  setEditPrice,
  editTitle,
  setEditTitle,
  editMessage,
  setEditMessage,
  setPreviewImage
}: MessagesListProps) {
  // Create status badge
  const createStatusBadge = (status: string) => {
    const badgeClasses: { [key: string]: string } = {
      pending: "bg-yellow-500 text-black",
      accepted: "bg-green-500 text-white",
      rejected: "bg-red-500 text-white",
      paid: "bg-blue-500 text-white",
      edited: "bg-purple-500 text-white",
      cancelled: "bg-gray-500 text-white"
    };

    return (
      <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${badgeClasses[status] || 'bg-gray-500 text-white'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Find the latest custom request message
  let latestCustomRequestIndex = -1;
  for (let i = threadMessages.length - 1; i >= 0; i--) {
    if (threadMessages[i].type === 'customRequest' && threadMessages[i].meta?.id) {
      latestCustomRequestIndex = i;
      break;
    }
  }

  return (
    <>
      {threadMessages.map((msg, index) => {
        const isFromMe = msg.sender === user?.username;
        
        // Find the custom request if this is a custom request message
        const customReq = msg.type === 'customRequest' && msg.meta && msg.meta.id
          ? sellerRequests.find(req => req.id === msg.meta.id)
          : null;

        // Check if this is the latest custom request message
        const isLatestCustom = index === latestCustomRequestIndex;

        const isPaid = customReq && (customReq.paid || customReq.status === 'paid');

        // Show action buttons if:
        // 1. This is a custom request
        // 2. This is the latest custom request message
        // 3. The request is pending or edited
        // 4. The request is pending with the current user (seller)
        const showActionButtons = !!customReq &&
          isLatestCustom &&
          !isPaid &&
          (customReq.status === 'pending' || customReq.status === 'edited') &&
          customReq.pendingWith === user?.username;
        
        return (
          <MessageItem
            key={index}
            msg={msg}
            index={index}
            isFromMe={isFromMe}
            user={user}
            activeThread={activeThread}
            onMessageVisible={handleMessageVisible}
            customReq={customReq}
            isLatestCustom={isLatestCustom}
            isPaid={isPaid}
            showActionButtons={showActionButtons}
            handleAccept={() => customReq && handleAccept(customReq.id)}
            handleDecline={() => customReq && handleDecline(customReq.id)}
            handleEditRequest={() => customReq && handleEditRequest(customReq.id, customReq.title, customReq.price, customReq.description || '')}
            editRequestId={editRequestId}
            editTitle={editTitle}
            setEditTitle={setEditTitle}
            editPrice={editPrice}
            setEditPrice={setEditPrice}
            editMessage={editMessage}
            setEditMessage={setEditMessage}
            handleEditSubmit={handleEditSubmit}
            setEditRequestId={setEditRequestId}
            statusBadge={createStatusBadge}
            setPreviewImage={setPreviewImage}
          />
        );
      })}
    </>
  );
}
