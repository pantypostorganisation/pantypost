// src/components/sellers/messages/CustomRequestCard.tsx
'use client';

import React from 'react';
import { ShoppingBag, Tag, DollarSign, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';

interface CustomRequestData {
  id?: string;
  title?: string;
  price?: number;
  tags?: string[];
  message?: string;
}

interface CustomRequestCardProps {
  request: CustomRequestData;
  isOwnMessage: boolean;
}

const CustomRequestCard: React.FC<CustomRequestCardProps> = ({ request, isOwnMessage }) => {
  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`
        max-w-sm rounded-2xl p-4 space-y-3
        ${isOwnMessage 
          ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white' 
          : 'bg-gradient-to-br from-orange-500 to-red-500 text-white'
        }
      `}>
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="p-2 bg-white/20 rounded-lg">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-lg">Custom Request</h3>
        </div>
        
        {/* Content */}
        <div className="space-y-2">
          {request.title && (
            <div>
              <p className="text-sm opacity-80">Title:</p>
              <p className="font-semibold">{request.title}</p>
            </div>
          )}
          
          {request.price && (
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 opacity-80" />
              <span className="font-bold text-xl">${request.price.toFixed(2)}</span>
            </div>
          )}
          
          {request.tags && request.tags.length > 0 && (
            <div>
              <p className="text-sm opacity-80 mb-1">Tags:</p>
              <div className="flex flex-wrap gap-1">
                {request.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-white/20 rounded-full text-xs"
                  >
                    <Tag className="w-3 h-3" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {request.message && (
            <div className="mt-3 pt-3 border-t border-white/20">
              <div className="flex items-start gap-2">
                <MessageSquare className="w-4 h-4 opacity-80 flex-shrink-0 mt-0.5" />
                <p className="text-sm">{request.message}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default CustomRequestCard;