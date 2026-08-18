// src/components/seller-profile/ProfileStats.tsx
'use client';

import { Camera, Video, Users, Star } from 'lucide-react';
import { z } from 'zod';

const PropsSchema = z.object({
  totalPhotos: z.number().int().nonnegative().catch(0),
  totalVideos: z.number().int().nonnegative().catch(0),
  followers: z.number().int().nonnegative().catch(0),
  averageRating: z.number().nullable().optional(),
  reviewsCount: z.number().int().nonnegative().catch(0),
});

interface ProfileStatsProps extends z.infer<typeof PropsSchema> {}

export default function ProfileStats(rawProps: ProfileStatsProps) {
  const parsed = PropsSchema.safeParse(rawProps);
  const {
    totalPhotos = 0,
    totalVideos = 0,
    followers = 0,
    averageRating,
    reviewsCount = 0,
  } = parsed.success ? parsed.data : { totalPhotos: 0, totalVideos: 0, followers: 0, averageRating: null, reviewsCount: 0 };

  const avgDisplay =
    typeof averageRating === 'number' && Number.isFinite(averageRating)
      ? averageRating.toFixed(1)
      : '—';

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
      <div className="bg-surface-raised p-4 rounded-md text-center border border-line">
        <Camera className="w-6 h-6 mx-auto mb-2 text-primary" />
        <p className="text-2xl font-bold text-white">{totalPhotos}</p>
        <p className="text-sm text-ink-muted">Photos</p>
      </div>
      <div className="bg-surface-raised p-4 rounded-md text-center border border-line">
        <Video className="w-6 h-6 mx-auto mb-2 text-primary" />
        <p className="text-2xl font-bold text-white">{totalVideos}</p>
        <p className="text-sm text-ink-muted">Videos</p>
      </div>
      <div className="bg-surface-raised p-4 rounded-md text-center border border-line">
        <Users className="w-6 h-6 mx-auto mb-2 text-primary" />
        <p className="text-2xl font-bold text-white">{followers}</p>
        <p className="text-sm text-ink-muted">Followers</p>
      </div>
      <div className="bg-surface-raised p-4 rounded-md text-center border border-line">
        <Star className="w-6 h-6 mx-auto mb-2 text-primary" />
        <p className="text-2xl font-bold text-white">{avgDisplay}</p>
        <p className="text-sm text-ink-muted">{reviewsCount} {reviewsCount === 1 ? 'Review' : 'Reviews'}</p>
      </div>
    </div>
  );
}