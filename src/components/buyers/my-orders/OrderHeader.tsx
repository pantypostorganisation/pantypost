// src/components/buyers/my-orders/OrderHeader.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Star } from 'lucide-react';
import { Order } from '@/context/WalletContext';
import { OrderStyles } from '@/utils/orderUtils';

interface OrderHeaderProps {
  order: Order;
  type: 'auction' | 'direct' | 'custom';
  styles: OrderStyles;
}

export default function OrderHeader({ order, type, styles }: OrderHeaderProps) {
  const isCustom = type === 'custom';
  const isAuction = type === 'auction';
  
  // State to manage image source and prevent flicker
  const [imageSrc, setImageSrc] = useState<string>('');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    // Reset states when order changes
    setImageLoaded(false);
    setImageError(false);
    
    // Debug logging
    console.log('OrderHeader - Processing order:', order.title);
    console.log('OrderHeader - imageUrl:', order.imageUrl);
    console.log('OrderHeader - Full order object:', order);
    
    // Determine the image source
    if (!order.imageUrl || order.imageUrl === 'undefined' || order.imageUrl === 'null') {
      console.log('OrderHeader - No valid imageUrl, using placeholder');
      // Use a placeholder service with the order title
      const placeholder = `https://via.placeholder.com/150/1a1a1a/ff950e?text=${encodeURIComponent(order.title.substring(0, 10))}`;
      setImageSrc(placeholder);
      setImageLoaded(true);
      return;
    }

    const imageUrl = order.imageUrl.trim();

    // If it's a data URL (base64), use it directly
    if (imageUrl.startsWith('data:image/')) {
      console.log('OrderHeader - Data URL detected');
      setImageSrc(imageUrl);
      setImageLoaded(true);
      return;
    }

    // If it's a Cloudinary URL, use it directly
    if (imageUrl.includes('cloudinary.com') || imageUrl.includes('res.cloudinary.com')) {
      console.log('OrderHeader - Cloudinary URL detected');
      setImageSrc(imageUrl);
      return;
    }

    // If it's an HTTP/HTTPS URL, use it
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      console.log('OrderHeader - External URL detected');
      setImageSrc(imageUrl);
      return;
    }

    // If it starts with /, assume it's a local path
    if (imageUrl.startsWith('/')) {
      console.log('OrderHeader - Local path detected');
      setImageSrc(imageUrl);
      return;
    }

    // Otherwise, try to use it as-is (might be a relative path)
    console.log('OrderHeader - Using URL as-is:', imageUrl);
    setImageSrc(imageUrl);
  }, [order.imageUrl, order.title, order]);

  const handleImageLoad = () => {
    console.log('OrderHeader - Image loaded successfully');
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = () => {
    console.log('OrderHeader - Image failed to load:', imageSrc);
    setImageError(true);
    
    // Fallback to a better placeholder
    const fallbackUrl = `https://via.placeholder.com/150/1a1a1a/ff950e?text=${encodeURIComponent(order.title.substring(0, 10))}`;
    
    // Only update if we're not already showing the fallback (to prevent infinite loop)
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
            {/* Show loading state only for external images */}
            {!imageLoaded && !imageError && imageSrc && !imageSrc.startsWith('data:') && (
              <div className="absolute inset-0 bg-gray-700 rounded-xl border-2 border-gray-600 animate-pulse" />
            )}
            
            {/* Always render the img tag to attempt loading */}
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
            
            {/* Show a styled placeholder if no image source */}
            {!imageSrc && (
              <div className="w-24 h-24 bg-gradient-to-br from-gray-800 to-gray-700 rounded-xl border-2 border-gray-600 flex items-center justify-center shadow-lg">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-500 mb-1">
                    {order.title.charAt(0).toUpperCase()}
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
            <h3 className="font-bold text-xl text-white truncate">{order.title}</h3>
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
        
        <p className="text-gray-300 text-sm mb-4 line-clamp-2">{order.description}</p>
      </div>
    </div>
  );
}
