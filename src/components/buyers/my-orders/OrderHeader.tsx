// src/components/buyers/my-orders/OrderHeader.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Settings, Star, ShoppingBag, Gavel } from 'lucide-react';
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

  const accentColor = styles.accentColor;
  const accentWithAlpha = (alpha: string) => `${accentColor}${alpha}`;

  const accentBorderStyle: React.CSSProperties = {
    borderColor: `${accentWithAlpha('55')}`,
  };
  const accentPillStyle: React.CSSProperties = {
    backgroundColor: accentWithAlpha('24'),
    borderColor: `${accentWithAlpha('55')}`,
    color: accentColor,
  };

  const typeMeta = useMemo(() => {
    if (isAuction) {
      return { label: 'Auction win', icon: Gavel } as const;
    }

    if (isCustom) {
      return { label: 'Custom request', icon: Settings } as const;
    }

    return { label: 'Direct purchase', icon: ShoppingBag } as const;
  }, [isAuction, isCustom]);

  const TypeIcon = typeMeta.icon;

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
    <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[auto,1fr,auto] lg:items-start lg:gap-8">
      {/* Product Image or Custom Request Icon */}
      <div className="flex flex-shrink-0 flex-col items-center gap-4 lg:items-start">
        <div className="relative h-28 w-28 overflow-hidden rounded-2xl border border-white/10 bg-black/40">
          {isCustom ? (
            <div className="flex h-full w-full items-center justify-center bg-black/40">
              <Settings className="h-10 w-10 text-sky-300" />
            </div>
          ) : (
            <>
              {!imageLoaded && !imageError && imageSrc && !imageSrc.startsWith('data:') && (
                <div className="absolute inset-0 animate-pulse rounded-2xl bg-white/5" />
              )}
              {imageSrc ? (
                <img
                  src={imageSrc}
                  alt={order.title}
                  className={`h-full w-full object-cover transition-opacity duration-200 ${
                    imageLoaded || imageSrc.startsWith('data:') ? 'opacity-100' : 'opacity-0'
                  }`}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-black/40 text-gray-500">
                  <span className="text-3xl font-semibold">{(order.title || '?').charAt(0).toUpperCase()}</span>
                  <span className="text-xs uppercase tracking-widest">No image</span>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex justify-center lg:justify-start">
          <span
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wider"
            style={accentPillStyle}
          >
            <TypeIcon className="h-3.5 w-3.5" />
            {typeMeta.label}
          </span>
        </div>
      </div>

      {/* Order Title and Price */}
      <div className="flex min-w-0 flex-1 flex-col gap-4 lg:pr-4">
        <div className="flex min-w-0 flex-col gap-2">
          <h3 className="text-2xl font-semibold text-white sm:text-[1.6rem]">
            <SecureMessageDisplay content={order.title} allowBasicFormatting={false} as="span" />
          </h3>
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 font-medium text-gray-300">
              Order ID: <span className="font-mono text-[11px] text-gray-400">{order.id ? order.id.slice(0, 10) : '—'}</span>
            </span>
            {isAuction && <Star className="h-4 w-4 text-purple-300" />}
            {isCustom && <Settings className="h-4 w-4 text-sky-300" />}
          </div>
        </div>

        <div className="text-sm text-gray-300">
          <SecureMessageDisplay content={order.description} allowBasicFormatting={false} />
        </div>
      </div>

      <div
        className="flex flex-col rounded-2xl border px-4 py-3 text-right lg:min-w-[220px] lg:self-start"
        style={accentBorderStyle}
      >
        <span className="text-xs font-medium uppercase tracking-wider text-gray-400">Total paid</span>
        <span className="text-2xl font-bold" style={{ color: accentColor }}>
          ${(order.markedUpPrice || order.price).toFixed(2)}
        </span>
        <span className="text-[11px] text-gray-500">Includes seller payout & platform fee</span>
      </div>
    </div>
  );
}
