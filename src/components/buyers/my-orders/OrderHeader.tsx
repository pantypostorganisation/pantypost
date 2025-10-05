// src/components/buyers/my-orders/OrderHeader.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Star } from 'lucide-react';
import { Order } from '@/context/WalletContext';
import { OrderStyles } from '@/utils/orderUtils';
import { SecureMessageDisplay } from '@/components/ui/SecureMessageDisplay';

interface OrderHeaderProps {
  order: Order;
  type: 'auction' | 'direct' | 'custom';
  styles: OrderStyles;
}

export default function OrderHeader({ order, type, styles }: OrderHeaderProps) {
  const isCustom = type === 'custom';
  const isAuction = type === 'auction';

  const [imageSrc, setImageSrc] = useState<string>('');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);

    if (!order.imageUrl || order.imageUrl === 'undefined' || order.imageUrl === 'null') {
      const placeholder = `https://via.placeholder.com/150/1a1a1a/ff950e?text=${encodeURIComponent(
        (order.title || '').substring(0, 10)
      )}`;
      setImageSrc(placeholder);
      setImageLoaded(true);
      return;
    }

    const imageUrl = order.imageUrl.trim();

    if (imageUrl.startsWith('data:image/')) {
      setImageSrc(imageUrl);
      setImageLoaded(true);
      return;
    }

    if (imageUrl.includes('cloudinary.com') || imageUrl.includes('res.cloudinary.com')) {
      setImageSrc(imageUrl);
      return;
    }

    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      setImageSrc(imageUrl);
      return;
    }

    if (imageUrl.startsWith('/')) {
      setImageSrc(imageUrl);
      return;
    }

    setImageSrc(imageUrl);
  }, [order.imageUrl, order.title]);

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageError(true);
    const fallbackUrl = `https://via.placeholder.com/150/1a1a1a/ff950e?text=${encodeURIComponent(
      (order.title || '').substring(0, 10)
    )}`;
    if (imageSrc !== fallbackUrl) {
      setImageSrc(fallbackUrl);
      setImageLoaded(true);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">
      {/* Product Image or Custom Request Icon */}
      <div className="relative">
        {isCustom ? (
          <div className="w-24 h-24 bg-gradient-to-br from-blue-900/30 to-cyan-900/30 rounded-xl border-2 border-blue-500/30 flex items-center justify-center shadow-lg">
            <Settings className="w-10 h-10 text-blue-400" />
          </div>
        ) : (
          <div className="relative w-24 h-24">
            {!imageLoaded && !imageError && imageSrc && !imageSrc.startsWith('data:') && (
              <div className="absolute inset-0 bg-gray-700 rounded-xl border-2 border-gray-600 animate-pulse" />
            )}
            {imageSrc && (
              <img
                src={imageSrc}
                alt={order.title}
                className={`w-24 h-24 object-cover rounded-xl border-2 border-gray-600 shadow-lg transition-opacity duration-200 ${
                  imageLoaded || imageSrc.startsWith('data:') ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            )}
            {!imageSrc && (
              <div className="w-24 h-24 bg-gradient-to-br from-gray-800 to-gray-700 rounded-xl border-2 border-gray-600 flex items-center justify-center shadow-lg">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-500 mb-1">
                    {(order.title || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="text-xs text-gray-500">No Image</div>
                </div>
              </div>
            )}
          </div>
        )}
        {styles.badgeContent}
      </div>

      {/* Order Title and Price */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-xl text-white truncate">
              <SecureMessageDisplay content={order.title} allowBasicFormatting={false} as="span" />
            </h3>
            {isAuction && <Star className="w-5 h-5 text-purple-400 flex-shrink-0" />}
            {isCustom && <Settings className="w-5 h-5 text-blue-400 flex-shrink-0" />}
          </div>

          <div className="bg-[#ff950e]/10 border border-[#ff950e]/30 rounded-lg px-3 py-2 ml-4">
            <div className="text-xs text-[#ff950e]/80 font-medium text-center">Total Paid</div>
            <div className="text-[#ff950e] font-bold text-lg text-center">
              ${(order.markedUpPrice || order.price).toFixed(2)}
            </div>
          </div>
        </div>

        <div className="text-gray-300 text-sm mb-4 line-clamp-2">
          <SecureMessageDisplay content={order.description} allowBasicFormatting={false} />
        </div>
      </div>
    </div>
  );
}
