// src/components/sellers/messages/MessagesList.tsx
'use client';

import React from 'react';
import MessageItem from './MessageItem';
import { useSellerMessages } from '@/hooks/useSellerMessages';
import { Clock, CheckCircle2, XCircle, Edit3, ShoppingBag } from 'lucide-react';

interface MessagesListProps {
  threadMessages: any[];
  sellerRequests: any[];
  user: any;
  activeThread: string;
}

export default function MessagesList({ 
  threadMessages, 
  sellerRequests, 
  user, 
  activeThread 
}: MessagesListProps) {
  const {
    handleMessageVisible,
    handleAccept,
    handleDecline,
    handleEditRequest,
    editRequestId,
    editTitle,
    setEditTitle,
    editPrice,
    setEditPrice,
    editMessage,
    setEditMessage,
    handleEditSubmit,
    setEditRequestId,
    setPreviewImage
  } = useSellerMessages();

  // Determine if the user is the last editor
  function isLastEditor(customReq: any) {
    if (!customReq) return false;
    const lastMsg = threadMessages
      .filter(
        (msg) =>
          msg.type === 'customRequest' &&
          msg.meta &&
          msg.meta.id === customReq.id
      )
      .slice(-1)[0];
    return lastMsg && lastMsg.sender === user?.username;
  }

  // Status badge function
  const createStatusBadge = (status: string) => {
    let color = 'bg-yellow-400 text-black';
    let label = status.toUpperCase();
    let icon = <Clock size={12} className="mr-1" />;
    
    if (status === 'accepted') {
      color = 'bg-green-500 text-white';
      icon = <CheckCircle2 size={12} className="mr-1" />;
    }
    else if (status === 'rejected') {
      color = 'bg-red-500 text-white';
      icon = <XCircle size={12} className="mr-1" />;
    }
    else if (status === 'edited') {
      color = 'bg-blue-500 text-white';
      icon = <Edit3 size={12} className="mr-1" />;
    }
    else if (status === 'paid') {
      color = 'bg-green-600 text-white';
      icon = <ShoppingBag size={12} className="mr-1" />;
    }
    else if (status === 'pending') {
      color = 'bg-yellow-400 text-black';
      icon = <Clock size={12} className="mr-1" />;
    }
    
    return (
      <span className={`ml-2 px-2 py-0.5 rounded text-xs font-bold flex items-center ${color} shadow-sm`}>
        {icon}
        {label}
      </span>
    );
  };

  return (
    <>
      {threadMessages.map((msg, index) => {
        const isFromMe = msg.sender === user?.username;
        
        let customReq: any = undefined;
        let metaId: string | undefined = undefined;
        if (
          msg.type === 'customRequest' &&
          typeof msg.meta === 'object' &&
          msg.meta !== null &&
          'id' in msg.meta &&
          typeof (msg.meta as any).id === 'string'
        ) {
          metaId = (msg.meta as any).id as string;
          customReq = sellerRequests.find((r) => r.id === metaId);
        }

        const isLatestCustom =
          !!customReq &&
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
            statusBadge={createStatusBadge}
            setPreviewImage={setPreviewImage}
          />
        );
      })}
    </>
  );
}