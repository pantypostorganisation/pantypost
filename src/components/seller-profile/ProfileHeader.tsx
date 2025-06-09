// src/components/seller-profile/ProfileHeader.tsx
'use client';

import Link from 'next/link';
import { Lock, Mail, Gift, DollarSign, MessageCircle, Camera, Video, Users, Star, AlertTriangle } from 'lucide-react';
import TierBadge from '@/components/TierBadge';

interface ProfileHeaderProps {
  username: string;
  profilePic: string | null;
  bio: string;
  isVerified: boolean;
  sellerTierInfo: any;
  user: any;
  onShowSubscribeModal: () => void;
  onShowUnsubscribeModal: () => void;
  onShowTipModal: () => void;
  hasAccess: boolean | undefined;
  subscriptionPrice: number | null;
  totalPhotos: number;
  totalVideos: number;
  followers: number;
  averageRating: number | null;
  reviewsCount: number;
}

export default function ProfileHeader({
  username,
  profilePic,
  bio,
  isVerified,
  sellerTierInfo,
  user,
  onShowSubscribeModal,
  onShowUnsubscribeModal,
  onShowTipModal,
  hasAccess,
  subscriptionPrice,
  totalPhotos,
  totalVideos,
  followers,
  averageRating,
  reviewsCount,
}: ProfileHeaderProps) {
  const showSubscribeButton =
    user?.role === 'buyer' &&
    user.username !== username &&
    !hasAccess;

  const showUnsubscribeButton =
    user?.role === 'buyer' &&
    user.username !== username &&
    hasAccess;

  return (
    <div className="bg-[#1a1a1a] rounded-2xl shadow-xl p-6 sm:p-8 flex flex-col items-center border border-gray-800 relative">
      {/* Profile section with centered profile pic and badge to the right */}
      <div className="flex flex-col items-center relative mb-6 w-full">
        {/* Profile Picture - Centered */}
        <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-[#ff950e] bg-black flex items-center justify-center overflow-hidden shadow-lg">
          {profilePic ? (
            <img
              src={profilePic}
              alt={`${username}'s profile`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-700 flex items-center justify-center text-gray-400 text-6xl font-bold">
              {username ? username.charAt(0).toUpperCase() : '?'}
            </div>
          )}
        </div>
        
        {/* Badge positioned absolutely to the right of profile pic */}
        {sellerTierInfo && sellerTierInfo.tier !== 'None' && (
          <div className="absolute right-0 sm:right-1/4 top-1/2 transform -translate-y-1/2">
            <TierBadge tier={sellerTierInfo.tier} size="2xl" showTooltip={true} />
          </div>
        )}
      </div>
      
      <div className="flex flex-col items-center text-center mb-6">
        <div className="flex items-center justify-center gap-3 mb-2">
          <span className="text-2xl sm:text-3xl font-bold text-white">{username}</span>
          {isVerified ? (
            <div className="relative group">
              <img
                src="/verification_badge.png"
                alt="Verified"
                className="w-6 h-6"
              />
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-20">
                Verified Seller
              </div>
            </div>
          ) : (
            <span className="flex items-center gap-1 text-xs bg-yellow-600 text-black px-2 py-1 rounded-full font-bold shadow">
              <AlertTriangle className="w-4 h-4" />
              Unverified
            </span>
          )}
          <span className="flex items-center gap-1 text-xs bg-green-600 text-white px-2 py-1 rounded-full font-bold shadow">
            Active Now
          </span>
        </div>
        <div className="text-sm text-gray-400 mb-3">Location: Private</div>
        <p className="text-base text-gray-300 font-medium max-w-2xl leading-relaxed">
          {bio || '🧾 Seller bio goes here. This is where the seller can share details about themselves, their offerings, and what subscribers can expect.'}
        </p>
      </div>
      
      <div className="flex flex-wrap justify-center gap-6 sm:gap-8 mb-8 w-full border-t border-b border-gray-700 py-4">
        <div className="flex flex-col items-center">
          <Camera className="w-6 h-6 text-[#ff950e] mb-1" />
          <span className="text-lg font-bold text-white">{totalPhotos}</span>
          <span className="text-xs text-gray-400">Photos</span>
        </div>
        <div className="flex flex-col items-center">
          <Video className="w-6 h-6 text-gray-500 mb-1" />
          <span className="text-lg font-bold text-white">{totalVideos}</span>
          <span className="text-xs text-gray-400">Videos</span>
        </div>
        <div className="flex flex-col items-center">
          <Users className="w-6 h-6 text-[#ff950e] mb-1" />
          <span className="text-lg font-bold text-white">{followers}</span>
          <span className="text-xs text-gray-400">Followers</span>
        </div>
        <div className="flex flex-col items-center">
          <Star className="w-6 h-6 text-[#ff950e] mb-1" />
          {averageRating !== null ? (
            <>
              <span className="text-lg font-bold text-white">{averageRating.toFixed(1)}</span>
              <span className="text-xs text-gray-400 mt-1">({reviewsCount} reviews)</span>
            </>
          ) : (
            <>
              <span className="text-lg font-bold text-white">--</span>
              <span className="text-xs text-gray-400">Rating</span>
            </>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-3 justify-center w-full max-w-lg">
        {showSubscribeButton && (
          <button
            onClick={onShowSubscribeModal}
            className="flex items-center gap-2 bg-[#ff950e] text-black font-bold px-6 py-3 rounded-full shadow-lg hover:bg-[#e0850d] transition text-base"
          >
            <DollarSign className="w-5 h-5" />
            Subscribe {subscriptionPrice ? `($${subscriptionPrice.toFixed(2)}/mo)` : ''}
          </button>
        )}
        {showUnsubscribeButton && (
          <button
            onClick={onShowUnsubscribeModal}
            className="flex items-center gap-2 bg-gray-700 text-white font-bold px-6 py-3 rounded-full shadow-lg hover:bg-red-600 transition text-base"
          >
            <Lock className="w-5 h-5" />
            Unsubscribe
          </button>
        )}
        {user?.role === 'buyer' && user.username !== username && (
          <button
            className="flex items-center gap-2 bg-gray-800 text-[#ff950e] font-bold px-6 py-3 rounded-full shadow-lg hover:bg-gray-700 transition text-base"
            onClick={onShowTipModal}
          >
            <Gift className="w-5 h-5" />
            Tip Seller
          </button>
        )}
        {user?.role === 'buyer' && user.username !== username && (
          <Link
            href={`/buyers/messages?thread=${username}`}
            className="flex items-center gap-2 bg-gray-800 text-white font-bold px-6 py-3 rounded-full shadow-lg hover:bg-gray-700 transition text-base"
          >
            <Mail className="w-5 h-5" />
            Message
          </Link>
        )}
        {user?.role === 'buyer' && user.username !== username && (
          <button
            className="flex items-center gap-2 bg-gray-800 text-gray-500 font-bold px-6 py-3 rounded-full shadow-lg cursor-not-allowed text-base"
            disabled
          >
            <MessageCircle className="w-5 h-5" />
            Custom Request
          </button>
        )}
      </div>
    </div>
  );
}
