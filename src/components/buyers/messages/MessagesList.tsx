// src/components/buyers/messages/MessagesList.tsx
'use client';

import React from 'react';
import MessageItem from './MessageItem';
import EditRequestForm from './EditRequestForm';

interface MessagesListProps {
  threadMessages: any[];
  threadRequests: any[];
  user: any;
  activeThread: string;
  wallet: { [username: string]: number };
  handleAccept: (req: any) => void;
  handleDecline: (req: any) => void;
  handleEditRequest: (req: any) => void;
  handleEditSubmit: () => void;
  handlePayNow: (req: any) => void;
  handleMessageVisible: (msg: any) => void;
  editRequestId: string | null;
  setEditRequestId: (id: string | null) => void;
  editPrice: number | '';
  setEditPrice: (price: number | '') => void;
  editTitle: string;
  setEditTitle: (title: string) => void;
  editTags: string;
  setEditTags: (tags: string) => void;
  editMessage: string;
  setEditMessage: (message: string) => void;
  setPreviewImage: (image: string | null) => void;
}

export default function MessagesList({
  threadMessages,
  threadRequests,
  user,
  activeThread,
  wallet,
  handleAccept,
  handleDecline,
  handleEditRequest,
  handleEditSubmit,
  handlePayNow,
  handleMessageVisible,
  editRequestId,
  setEditRequestId,
  editPrice,
  setEditPrice,
  editTitle,
  setEditTitle,
  editTags,
  setEditTags,
  editMessage,
  setEditMessage,
  setPreviewImage
}: MessagesListProps) {
  // Helper to check if buyer made the last edit
  const isLastEditor = (req: any) => {
    return req.lastModifiedBy === user?.username;
  };
  
  // Create status badge helper
  const createStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Pending' },
      accepted: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Accepted' },
      rejected: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Declined' },
      edited: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Edited' },
      paid: { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'Paid' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };
  
  return (
    <>
      {threadMessages.map((msg, index) => {
        const isFromMe = msg.sender === user?.username;
        
        // Find matching custom request
        const customReq = msg.type === 'customRequest' && msg.meta?.id
          ? threadRequests.find(req => req.id === msg.meta.id)
          : null;
        
        // Only show action buttons on the LATEST custom request message
        const isLatestCustom = !!customReq &&
          (customReq.status === 'pending' || customReq.status === 'edited' || customReq.status === 'accepted') &&
          index === (threadMessages.length - 1) &&
          msg.type === 'customRequest';
        
        const isPaid = customReq && (customReq.paid || customReq.status === 'paid');
        
        // Buyer sees pay button if request is accepted and not paid
        const showPayNow = !!customReq && 
          customReq.status === 'accepted' && 
          !isPaid && 
          isLatestCustom;
        
        // Calculate markup price for display
        const markupPrice = customReq ? Math.round(customReq.price * 1.1 * 100) / 100 : 0;
        const canPay = wallet[user?.username] >= markupPrice;
        
        // Show edit button if buyer is not the last editor
        const showEditButton = !!customReq && 
          isLatestCustom && 
          customReq.status === 'pending' && 
          !isLastEditor(customReq);
        
        // Show edit form if this request is being edited
        if (editRequestId === customReq?.id) {
          return (
            <EditRequestForm
              key={index}
              editTitle={editTitle}
              setEditTitle={setEditTitle}
              editPrice={editPrice}
              setEditPrice={setEditPrice}
              editTags={editTags}
              setEditTags={setEditTags}
              editMessage={editMessage}
              setEditMessage={setEditMessage}
              handleEditSubmit={handleEditSubmit}
              setEditRequestId={setEditRequestId}
            />
          );
        }
        
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
            showPayNow={showPayNow}
            markupPrice={markupPrice}
            canPay={canPay}
            showEditButton={showEditButton}
            handleAccept={handleAccept}
            handleDecline={handleDecline}
            handleEditRequest={handleEditRequest}
            handlePayNow={handlePayNow}
            statusBadge={createStatusBadge}
            setPreviewImage={setPreviewImage}
          />
        );
      })}
    </>
  );
}
