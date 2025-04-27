'use client';

import { useParams } from 'next/navigation';
import { useListings } from '@/context/ListingContext';
import { useWallet } from '@/context/WalletContext';
import { useReviews } from '@/context/ReviewContext';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import StarRating from '@/components/StarRating';
import { Lock, Mail, Gift, UserPlus, DollarSign, MessageCircle, ArrowRight, BadgeCheck, AlertTriangle } from 'lucide-react';

export default function SellerProfilePage() {
  const { username } = useParams<{ username: string }>();
  const {
    listings,
    user,
    users,
    subscribeToSeller,
    isSubscribed,
    unsubscribeFromSeller,
    subscriptions,
  } = useListings();
  const { orderHistory, getBuyerBalance, setBuyerBalance, getSellerBalance, setSellerBalance } = useWallet();
  const { getReviewsForSeller, addReview, hasReviewed } = useReviews();

  // Profile info
  const [bio, setBio] = useState('');
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [subscriptionPrice, setSubscriptionPrice] = useState<number | null>(null);

  // Modals
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [showUnsubscribeModal, setShowUnsubscribeModal] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Tip
  const [tipAmount, setTipAmount] = useState('');
  const [tipSuccess, setTipSuccess] = useState(false);
  const [tipError, setTipError] = useState('');

  // Review
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Subscription
  const [justSubscribed, setJustSubscribed] = useState(false);

  // Listings
  const hasAccess = user?.username && isSubscribed(user.username, username);
  const standardListings = listings.filter(
    (listing) => listing.seller === username && !listing.isPremium
  );
  const premiumListings = listings.filter(
    (listing) => listing.seller === username && listing.isPremium
  );

  // Stats
  const reviews = getReviewsForSeller(username);
  const hasPurchased = orderHistory.some(
    (order) => order.seller === username && order.buyer === user?.username
  );
  const alreadyReviewed = user?.username && hasReviewed(username, user.username);

  // Followers (subscriptions)
  const followers = Object.entries(subscriptions).filter(([_, sellers]) =>
    sellers.includes(username)
  ).length;

  // Stats for media
  const totalPhotos = [...standardListings, ...premiumListings].length;
  const totalVideos = 0; // Placeholder, add video support if needed

  // Average rating
  const averageRating =
    reviews.length > 0
      ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
      : null;

  // --- VERIFIED BADGE LOGIC ---
  const sellerUser = users?.[username];
  const isVerified = sellerUser?.verified || sellerUser?.verificationStatus === 'verified';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedBio = sessionStorage.getItem(`profile_bio_${username}`);
      const storedPic = sessionStorage.getItem(`profile_pic_${username}`);
      const storedSub = sessionStorage.getItem(`subscription_price_${username}`);
      if (storedBio) setBio(storedBio);
      if (storedPic) setProfilePic(storedPic);
      if (storedSub) setSubscriptionPrice(parseFloat(storedSub));
    }
  }, [username]);

  // Review submit
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

  // Subscribe
  const handleConfirmSubscribe = () => {
    if (user?.username && user.role === 'buyer') {
      subscribeToSeller(user.username, username, subscriptionPrice ?? 0);
      setJustSubscribed(true);
      setShowSubscribeModal(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  // Unsubscribe
  const handleConfirmUnsubscribe = () => {
    if (user?.username && user.role === 'buyer') {
      unsubscribeFromSeller(user.username, username);
      setJustSubscribed(false);
      setShowUnsubscribeModal(false);
    }
  };

  // Tip Seller
  const handleTip = () => {
    setTipError('');
    setTipSuccess(false);
    if (!user?.username || user.role !== 'buyer') {
      setTipError('You must be logged in as a buyer to tip.');
      return;
    }
    const amount = parseFloat(tipAmount);
    if (isNaN(amount) || amount <= 0) {
      setTipError('Enter a valid tip amount.');
      return;
    }
    const balance = getBuyerBalance(user.username);
    if (balance < amount) {
      setTipError('Insufficient wallet balance.');
      return;
    }
    setBuyerBalance(user.username, balance - amount);

    // CREDIT THE SELLER
    if (username) {
      setSellerBalance(username, getSellerBalance(username) + amount);
    }

    setTipSuccess(true);
    setTipAmount('');
    setTimeout(() => {
      setShowTipModal(false);
      setTipSuccess(false);
    }, 1500);
  };

  // Action buttons
  const showSubscribe =
    user?.role === 'buyer' &&
    user.username !== username &&
    !isSubscribed(user.username, username);

  const showUnsubscribe =
    user?.role === 'buyer' &&
    user.username !== username &&
    isSubscribed(user.username, username);

  // UI
  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      {/* Just bring the card down 10px */}
      <div className="mt-[10px]" />
      {showToast && (
        <div className="fixed top-6 right-6 z-50 bg-green-600 text-white px-4 py-2 rounded shadow-lg">
          ✅ Subscribed to {username} successfully!
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-[#171717] rounded-2xl shadow-xl p-8 flex flex-col items-center mb-10 border border-[#222]">
        <div className="w-32 h-32 rounded-full border-4 border-primary bg-black flex items-center justify-center overflow-hidden -mt-20 mb-4 shadow-lg">
          {profilePic ? (
            <img
              src={profilePic}
              alt={`${username}'s profile`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-800" />
          )}
        </div>
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl font-bold text-white">{username}</span>
            {isVerified ? (
              <span className="flex items-center gap-1 text-xs bg-[#ff950e] text-black px-2 py-0.5 rounded-full font-semibold">
                <BadgeCheck className="w-4 h-4 mr-1" />
                Verified Seller
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs bg-yellow-600 text-black px-2 py-0.5 rounded-full font-semibold">
                <AlertTriangle className="w-4 h-4 mr-1" />
                Unverified Seller
              </span>
            )}
            <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full font-semibold">
              Active Now
            </span>
          </div>
          <div className="text-sm text-gray-400 mb-2">Location: Private</div>
          <div className="text-center text-base text-gray-200 font-medium mb-4 max-w-md">
            {bio || '🧾 Seller bio goes here.'}
          </div>
          {/* Stats */}
          <div className="flex gap-6 mb-6">
            <div className="flex flex-col items-center">
              <span className="text-lg font-bold text-white">{totalPhotos}</span>
              <span className="text-xs text-gray-400">Photos</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-lg font-bold text-white">{totalVideos}</span>
              <span className="text-xs text-gray-400">Videos</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-lg font-bold text-white">{followers}</span>
              <span className="text-xs text-gray-400">Followers</span>
            </div>
            <div className="flex flex-col items-center">
              {averageRating !== null ? (
                <>
                  <StarRating rating={averageRating} />
                  <span className="text-xs text-gray-400 mt-1">{averageRating.toFixed(1)}</span>
                </>
              ) : (
                <>
                  <span className="text-lg font-bold text-white">--</span>
                  <span className="text-xs text-gray-400">Rating</span>
                </>
              )}
            </div>
          </div>
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 justify-center mb-2 w-full">
            <button
              className="flex items-center gap-2 bg-primary text-black font-bold px-5 py-2 rounded-full shadow hover:bg-primary-dark transition"
              onClick={() => setShowTipModal(true)}
            >
              <Gift className="w-4 h-4" />
              Tip Seller
            </button>
            {/* Follow button removed */}
            {showSubscribe && (
              <button
                onClick={handleConfirmSubscribe}
                className="flex items-center gap-2 bg-primary text-black font-bold px-5 py-2 rounded-full shadow hover:bg-primary-dark transition"
              >
                <DollarSign className="w-4 h-4" />
                Subscribe {subscriptionPrice ? `($${subscriptionPrice.toFixed(2)}/mo)` : ''}
              </button>
            )}
            {showUnsubscribe && (
              <button
                onClick={handleConfirmUnsubscribe}
                className="flex items-center gap-2 bg-[#333] text-white font-bold px-5 py-2 rounded-full shadow hover:bg-red-600 transition"
              >
                <Lock className="w-4 h-4" />
                Unsubscribe
              </button>
            )}
            <Link
              href={`/buyers/messages`}
              className="flex items-center gap-2 bg-[#222] text-primary font-bold px-5 py-2 rounded-full shadow hover:bg-primary hover:text-black transition"
            >
              <Mail className="w-4 h-4" />
              Message
            </Link>
            <button
              className="flex items-center gap-2 bg-[#222] text-primary font-bold px-5 py-2 rounded-full shadow hover:bg-primary hover:text-black transition"
              disabled
            >
              <MessageCircle className="w-4 h-4" />
              Custom Request
            </button>
          </div>
        </div>
      </div>

      {/* Listings Section */}
      <div className="mt-10">
        <h2 className="text-2xl font-semibold mb-4 text-white">Listings by {username}</h2>
        {standardListings.length === 0 && premiumListings.length === 0 ? (
          <p className="text-gray-500 italic">This seller has no active listings.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-6 mb-10">
            {[...standardListings, ...premiumListings].map((listing) => (
              <div
                key={listing.id}
                className="rounded-2xl border border-[#222] bg-[#171717] shadow-lg p-4 relative flex flex-col"
              >
                <div className="relative mb-3">
                  <img
                    src={listing.imageUrl}
                    alt={listing.title}
                    className={`w-full h-48 object-cover rounded-xl ${
                      listing.isPremium && !hasAccess ? 'blur-sm' : ''
                    }`}
                  />
                  {listing.isPremium && !hasAccess && (
                    <div className="absolute inset-0 flex items-center justify-center text-sm bg-black bg-opacity-60 text-white font-semibold rounded-xl">
                      <Lock className="w-6 h-6 mr-2" />
                      Subscribe to unlock
                    </div>
                  )}
                </div>
                <h3 className="text-lg font-semibold flex items-center gap-2 text-white">
                  {listing.title}
                  {listing.isPremium && (
                    <span className="text-xs bg-primary text-black px-2 py-0.5 rounded-full">
                      Premium
                    </span>
                  )}
                </h3>
                <p className="text-sm text-gray-400 mb-2">
                  {listing.description.length > 100
                    ? listing.description.slice(0, 100) + '...'
                    : listing.description}
                </p>
                <p className="text-primary font-bold mb-2">
                  ${listing.markedUpPrice.toFixed(2)}
                </p>
                {(!listing.isPremium || hasAccess) && (
                  <Link
                    href={`/browse/${listing.id}`}
                    className="inline-block text-sm bg-primary text-black px-4 py-2 rounded-full hover:bg-primary-dark font-bold transition"
                  >
                    View Listing
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reviews Section */}
      <div className="mt-10">
        <h2 className="text-2xl font-semibold mb-4 text-white">Reviews</h2>
        {reviews.length === 0 ? (
          <p className="text-gray-500 italic">No reviews yet.</p>
        ) : (
          <ul className="space-y-4 mb-8">
            {reviews.map((review, i) => (
              <li key={i} className="bg-[#171717] border border-[#222] rounded-2xl p-4 shadow">
                <div className="flex items-center gap-2 mb-1">
                  <StarRating rating={review.rating} />
                  <span className="text-gray-400 text-xs">
                    by {review.reviewer} on{' '}
                    {new Date(review.date).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-white">{review.comment}</p>
              </li>
            ))}
          </ul>
        )}

        {user?.role === 'buyer' && hasPurchased && !alreadyReviewed && (
          <div className="border-t border-[#222] pt-6 mt-6" id="review-form">
            <h3 className="text-xl font-bold mb-2 text-white">Leave a Review</h3>
            <label className="block text-sm mb-1 text-white">Rating</label>
            <select
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              className="mb-3 border rounded px-2 py-1 bg-black text-white"
            >
              {[5, 4, 3, 2, 1].map((r) => (
                <option key={r} value={r}>
                  {r} Star{r > 1 ? 's' : ''}
                </option>
              ))}
            </select>

            <label className="block text-sm mb-1 text-white">Comment</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full border rounded p-2 mb-3 bg-black text-white"
              rows={3}
            />

            <button
              onClick={handleSubmit}
              className="bg-primary text-black px-4 py-2 rounded-full hover:bg-primary-dark font-bold transition"
            >
              Submit Review
            </button>

            {submitted && (
              <p className="text-green-500 mt-2 text-sm">✅ Review submitted!</p>
            )}
          </div>
        )}
      </div>

      {/* Modals (Tip, Subscribe, Unsubscribe) remain unchanged */}
      {showTipModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div className="bg-[#171717] p-8 rounded-2xl shadow-2xl w-full max-w-sm border border-[#222]">
            <h2 className="text-xl font-bold text-primary mb-4 text-center">Tip {username}</h2>
            <input
              type="number"
              min="1"
              step="0.01"
              value={tipAmount}
              onChange={e => setTipAmount(e.target.value)}
              className="w-full p-3 rounded-lg border border-[#333] bg-black text-white mb-4 text-lg"
              placeholder="Enter tip amount"
            />
            {tipError && <div className="text-red-500 text-sm mb-2">{tipError}</div>}
            {tipSuccess && <div className="text-green-500 text-sm mb-2">Tip sent! 🎉</div>}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowTipModal(false)}
                className="px-4 py-2 rounded-full bg-[#222] text-white hover:bg-[#333] transition"
              >
                Cancel
              </button>
              <button
                onClick={handleTip}
                className="px-4 py-2 rounded-full bg-primary text-black font-bold hover:bg-primary-dark transition"
              >
                Send Tip
              </button>
            </div>
          </div>
        </div>
      )}

      {showSubscribeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div className="bg-[#171717] p-8 rounded-2xl shadow-2xl w-full max-w-sm border border-[#222]">
            <h2 className="text-xl font-bold text-primary mb-4 text-center">Confirm Subscription</h2>
            <p className="mb-6 text-center text-white">
              Subscribe to <strong>{username}</strong> for{' '}
              <span className="text-primary font-bold">
                ${subscriptionPrice?.toFixed(2) ?? '...'}/month
              </span>
              ?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowSubscribeModal(false)}
                className="px-4 py-2 rounded-full bg-[#222] text-white hover:bg-[#333] transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSubscribe}
                className="px-4 py-2 rounded-full bg-primary text-black font-bold hover:bg-primary-dark transition"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {showUnsubscribeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div className="bg-[#171717] p-8 rounded-2xl shadow-2xl w-full max-w-sm border border-[#222]">
            <h2 className="text-xl font-bold text-red-500 mb-4 text-center">Confirm Unsubscription</h2>
            <p className="mb-6 text-center text-white">
              Are you sure you want to unsubscribe from <strong>{username}</strong>?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowUnsubscribeModal(false)}
                className="px-4 py-2 rounded-full bg-[#222] text-white hover:bg-[#333] transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmUnsubscribe}
                className="px-4 py-2 rounded-full bg-red-600 text-white font-bold hover:bg-red-700 transition"
              >
                Unsubscribe
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
