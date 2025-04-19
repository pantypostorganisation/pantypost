'use client';

import { useParams } from 'next/navigation';
import { useListings } from '@/context/ListingContext';
import { useWallet } from '@/context/WalletContext';
import { useReviews } from '@/context/ReviewContext';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import StarRating from '@/components/StarRating';

export default function SellerProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { listings, user } = useListings();
  const { orderHistory } = useWallet();
  const { getReviewsForSeller, addReview, hasReviewed } = useReviews();

  const [bio, setBio] = useState('');
  const [profilePic, setProfilePic] = useState<string | null>(null);

  const sellerListings = listings.filter((listing) => listing.seller === username);
  const reviews = getReviewsForSeller(username);

  const hasPurchased = orderHistory.some(
    (order) => order.seller === username && order.buyer === user?.username
  );

  const alreadyReviewed = user?.username && hasReviewed(username, user.username);

  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
      : null;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedBio = sessionStorage.getItem(`profile_bio_${username}`);
      const storedPic = sessionStorage.getItem(`profile_pic_${username}`);
      if (storedBio) setBio(storedBio);
      if (storedPic) setProfilePic(storedPic);
    }
  }, [username]);

  const handleSubmit = () => {
    if (!user?.username || rating < 1 || rating > 5 || !comment.trim()) return;

    addReview(username, {
      reviewer: user.username,
      rating,
      comment,
      date: new Date().toISOString(),
    });

    setSubmitted(true);
    setComment('');
    setRating(5);
  };

  useEffect(() => {
    if (submitted) {
      const timeout = setTimeout(() => setSubmitted(false), 2000);
      return () => clearTimeout(timeout);
    }
  }, [submitted]);

  return (
    <main className="p-10 max-w-4xl mx-auto">
      <div className="flex items-center gap-6 mb-8">
        {profilePic ? (
          <img
            src={profilePic}
            alt={`${username}'s profile picture`}
            className="w-24 h-24 rounded-full object-cover border"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-gray-300" />
        )}
        <div>
          <h1 className="text-3xl font-bold">{username}'s Profile</h1>
          <p className="text-sm text-gray-600 mt-1">
            {bio || '🧾 Seller bio goes here.'}
          </p>
          {averageRating !== null && (
            <div className="mt-2 flex items-center gap-2">
              <StarRating rating={averageRating} />
              <span className="text-gray-500 text-sm">
                ({averageRating.toFixed(1)} stars from {reviews.length}{' '}
                {reviews.length === 1 ? 'review' : 'reviews'})
              </span>
            </div>
          )}
        </div>
      </div>

      <h2 className="text-2xl font-semibold mb-4">Listings by {username}</h2>

      {sellerListings.length === 0 ? (
        <p className="text-gray-500 italic">This seller has no active listings.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          {sellerListings.map((listing) => (
            <div key={listing.id} className="border rounded p-4 shadow bg-white dark:bg-black">
              <img
                src={listing.imageUrl}
                alt={listing.title}
                className="w-full h-48 object-cover rounded mb-3"
              />
              <h3 className="text-lg font-semibold">{listing.title}</h3>
              <p className="text-sm text-gray-600 mb-2">
                {listing.description.length > 100
                  ? listing.description.slice(0, 100) + '...'
                  : listing.description}
              </p>
              <p className="text-pink-600 font-bold mb-2">
                ${listing.markedUpPrice.toFixed(2)}
              </p>
              <Link
                href={`/browse/${listing.id}`}
                className="inline-block text-sm bg-pink-600 text-white px-4 py-2 rounded hover:bg-pink-700"
              >
                View Listing
              </Link>
            </div>
          ))}
        </div>
      )}

      <h2 className="text-2xl font-semibold mb-4">Reviews</h2>

      {reviews.length === 0 ? (
        <p className="text-gray-500 italic">No reviews yet.</p>
      ) : (
        <ul className="space-y-4 mb-8">
          {reviews.map((review, i) => (
            <li key={i} className="bg-white border rounded p-4 shadow">
              <div className="flex items-center gap-2 mb-1">
                <StarRating rating={review.rating} size="sm" />
                <span className="text-gray-500 text-xs">
                  by {review.reviewer} on{' '}
                  {new Date(review.date).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm">{review.comment}</p>
            </li>
          ))}
        </ul>
      )}

      {user?.role === 'buyer' && hasPurchased && !alreadyReviewed && (
        <div className="border-t pt-6 mt-6" id="review-form">
          <h3 className="text-xl font-bold mb-2">Leave a Review</h3>
          <label className="block text-sm mb-1">Rating</label>
          <select
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            className="mb-3 border rounded px-2 py-1"
          >
            {[5, 4, 3, 2, 1].map((r) => (
              <option key={r} value={r}>
                {r} Star{r > 1 ? 's' : ''}
              </option>
            ))}
          </select>

          <label className="block text-sm mb-1">Comment</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full border rounded p-2 mb-3"
            rows={3}
          />

          <button
            onClick={handleSubmit}
            className="bg-pink-600 text-white px-4 py-2 rounded hover:bg-pink-700"
          >
            Submit Review
          </button>

          {submitted && (
            <p className="text-green-600 mt-2 text-sm">✅ Review submitted!</p>
          )}
        </div>
      )}
    </main>
  );
}
