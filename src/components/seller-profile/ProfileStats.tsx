// src/components/seller-profile/ProfileStats.tsx
'use client';

import { Camera, Video, Users, Star } from 'lucide-react';

interface ProfileStatsProps {
  totalPhotos: number;
  totalVideos: number;
  followers: number;
  averageRating: number | null;
  reviewsCount: number;
}

export default function ProfileStats({
  totalPhotos,
  totalVideos,
  followers,
  averageRating,
  reviewsCount,
}: ProfileStatsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
      <div className="bg-[#1a1a1a] p-4 rounded-xl text-center border border-gray-800">
        <Camera className="w-6 h-6 mx-auto mb-2 text-[#ff950e]" />
        <p className="text-2xl font-bold text-white">{totalPhotos}</p>
        <p className="text-sm text-gray-400">Photos</p>
      </div>
      <div className="bg-[#1a1a1a] p-4 rounded-xl text-center border border-gray-800">
        <Video className="w-6 h-6 mx-auto mb-2 text-[#ff950e]" />
        <p className="text-2xl font-bold text-white">{totalVideos}</p>
        <p className="text-sm text-gray-400">Videos</p>
      </div>
      <div className="bg-[#1a1a1a] p-4 rounded-xl text-center border border-gray-800">
        <Users className="w-6 h-6 mx-auto mb-2 text-[#ff950e]" />
        <p className="text-2xl font-bold text-white">{followers}</p>
        <p className="text-sm text-gray-400">Followers</p>
      </div>
      <div className="bg-[#1a1a1a] p-4 rounded-xl text-center border border-gray-800">
        <Star className="w-6 h-6 mx-auto mb-2 text-[#ff950e]" />
        <p className="text-2xl font-bold text-white">
          {averageRating ? averageRating.toFixed(1) : '—'}
        </p>
        <p className="text-sm text-gray-400">{reviewsCount} Reviews</p>
      </div>
    </div>
  );
}
