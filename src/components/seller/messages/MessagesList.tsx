// src/components/sellers/messages/MessagesList.tsx
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
  // Helper to check if the current user was the last to edit a request
  const isLastEditor = (req: any) => {
    if (!req.editHistory || req.editHistory.length === 0) {
      return req.buyer === user?.username;
    }
    const lastEdit = req.editHistory[req.editHistory.length - 1];
    return lastEdit.editedBy === user?.username;
  };

  // Create status badge
  const createStatusBadge = (status: string) => {
    const badgeClasses: { [key: string]: string } = {
      pending: "bg-yellow-500 text-black",
      accepted: "bg-green-500 text-white",
      declined: "bg-red-500 text-white",
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

  // Fixed handleEditRequest wrapper - now correctly passes just the request object
  const handleEditRequestWrapper = useCallback((req: any) => {
    handleEditRequest(req.id, req.title, req.price, req.description || req.message || '');
  }, [handleEditRequest]);

  return (
    <>
      {threadMessages.map((msg, index) => {
        const isFromMe = msg.sender === user?.username;
        
        // Find the custom request if this is a custom request message
        const customReq = msg.type === 'customRequest' && msg.meta && msg.meta.id
          ? sellerRequests.find(req => req.id === msg.meta.id)
          : null;

        // Only show action buttons on the LATEST custom request message
        const isLatestCustom = !!customReq &&
          (customReq.status === 'pending' || customReq.status === 'edited' || customReq.status === 'accepted') &&
          index === (threadMessages.length - 1) &&
          msg.type === 'customRequest';

        const isPaid = customReq && (customReq.paid || customReq.status === 'paid');

        const showActionButtons =
          !!customReq &&
          isLatestCustom &&
          customReq.status === 'pending' &&
          !isLastEditor(customReq);
        
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
            handleAccept={handleAccept}
            handleDecline={handleDecline}
            handleEditRequest={handleEditRequestWrapper}
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
