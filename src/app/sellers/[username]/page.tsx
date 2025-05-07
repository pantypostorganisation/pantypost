'use client';

import { useParams } from 'next/navigation';
import { useListings } from '@/context/ListingContext';
import { useWallet } from '@/context/WalletContext';
import { useReviews } from '@/context/ReviewContext';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import StarRating from '@/components/StarRating';
import {
  Lock, Mail, Gift, DollarSign, MessageCircle, ArrowRight,
  BadgeCheck, AlertTriangle, Camera, Video, Users, Star, Crown, Clock
} from 'lucide-react';

export default function SellerProfilePage() {
  const { username } = useParams<{ username: string }>();
  const {
    listings,
    user,
    users,
    isSubscribed,
    subscribeToSeller,
    unsubscribeFromSeller,
    subscriptions,
  } = useListings();
  const {
    orderHistory,
    getBuyerBalance,
    getSellerBalance,
    sendTip,
  } = useWallet();
  const { getReviewsForSeller, addReview, hasReviewed } = useReviews();

  // Profile info
  const [bio, setBio] = useState('');
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [subscriptionPrice, setSubscriptionPrice] = useState<number | null>(null);

  // Modals
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [showUnsubscribeModal, setShowUnsubscribeModal] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);
  const [showToast, setShowToast] = useState(false); // For subscribe success

  // Tip
  const [tipAmount, setTipAmount] = useState('');
  const [tipSuccess, setTipSuccess] = useState(false);
  const [tipError, setTipError] = useState('');

  // Review
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

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

  // Calculate total photos and videos from listings
  const sellerListings = listings.filter(listing => listing.seller === username);
  const totalPhotos = sellerListings.filter(listing => listing.imageUrls && listing.imageUrls.length > 0).length;
  const totalVideos = 0; // Assuming no video count available from current data structure

  // Followers (subscriptions) - Use context subscriptions object
  const followers = Object.entries(subscriptions)
    .filter(([_, sellers]) => Array.isArray(sellers) && sellers.includes(username))
    .length;

  // Average rating
  const averageRating =
    reviews.length > 0
      ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
      : null;

  // --- VERIFIED BADGE LOGIC ---
  const sellerUser = users?.[username];
  const isVerified = sellerUser?.verified || sellerUser?.verificationStatus === 'verified';

  // Load profile info from sessionStorage on mount
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

  // Subscribe - Use subscribeToSeller from context
  const handleConfirmSubscribe = () => {
    if (!user?.username || user.role !== 'buyer' || subscriptionPrice === null) {
      alert('Cannot subscribe. Please check your login status and seller subscription price.');
      return;
    }
    const success = subscribeToSeller(user.username, username, subscriptionPrice);
    if (success) {
      setShowSubscribeModal(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } else {
      alert('Subscription failed. Insufficient balance or another error occurred.');
      setShowSubscribeModal(false);
    }
  };

  // Unsubscribe - Use unsubscribeFromSeller from context
  const handleConfirmUnsubscribe = () => {
    if (!user?.username || user.role !== 'buyer') return;
    unsubscribeFromSeller(user.username, username);
    setShowUnsubscribeModal(false);
  };

  // Tip Seller - Use sendTip from context
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
    const success = sendTip(user.username, username, amount);
    if (!success) {
      setTipError('Insufficient wallet balance.');
      return;
    }
    setTipSuccess(true);
    setTipAmount('');
    setTimeout(() => {
      setShowTipModal(false);
      setTipSuccess(false);
    }, 1500);
  };

  // Action buttons visibility
  const showSubscribeButton =
    user?.role === 'buyer' &&
    user.username !== username &&
    !isSubscribed(user.username, username);

  const showUnsubscribeButton =
    user?.role === 'buyer' &&
    user.username !== username &&
    isSubscribed(user.username, username);

  // UI
  return (
    <main className="min-h-screen bg-black text-white">
      {/* Banner/Background Image (Optional) */}
      <div className="w-full h-48 bg-gradient-to-r from-[#ff950e] to-yellow-600 relative" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24">
        {showToast && (
          <div className="fixed top-6 right-6 z-50 bg-green-600 text-white px-4 py-2 rounded shadow-lg">
            ✅ Subscribed to {username} successfully!
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-[#1a1a1a] rounded-2xl shadow-xl p-6 sm:p-8 flex flex-col items-center border border-gray-800 relative">
          {/* Profile Picture */}
          <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-[#ff950e] bg-black flex items-center justify-center overflow-hidden mb-4 shadow-lg">
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

          {/* Seller Info */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-2">
              <span className="text-2xl sm:text-3xl font-bold text-white">{username}</span>
              {isVerified ? (
                <span className="flex items-center gap-1 text-xs bg-[#ff950e] text-black px-2 py-1 rounded-full font-bold shadow">
                  <BadgeCheck className="w-4 h-4" />
                  Verified
                </span>
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

          {/* Stats */}
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
                  <span className="text-xs text-gray-400 mt-1">({reviews.length} reviews)</span>
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
          <div className="flex flex-wrap gap-3 justify-center w-full max-w-lg">
            {showSubscribeButton && (
              <button
                onClick={() => setShowSubscribeModal(true)}
                className="flex items-center gap-2 bg-[#ff950e] text-black font-bold px-6 py-3 rounded-full shadow-lg hover:bg-[#e0850d] transition text-base"
              >
                <DollarSign className="w-5 h-5" />
                Subscribe {subscriptionPrice ? `($${subscriptionPrice.toFixed(2)}/mo)` : ''}
              </button>
            )}
            {showUnsubscribeButton && (
              <button
                onClick={() => setShowUnsubscribeModal(true)}
                className="flex items-center gap-2 bg-gray-700 text-white font-bold px-6 py-3 rounded-full shadow-lg hover:bg-red-600 transition text-base"
              >
                <Lock className="w-5 h-5" />
                Unsubscribe
              </button>
            )}
            {user?.role === 'buyer' && user.username !== username && (
              <button
                className="flex items-center gap-2 bg-gray-800 text-[#ff950e] font-bold px-6 py-3 rounded-full shadow-lg hover:bg-gray-700 transition text-base"
                onClick={() => setShowTipModal(true)}
              >
                <Gift className="w-5 h-5" />
                Tip Seller
              </button>
            )}
            {user?.role === 'buyer' && user.username !== username && (
              <Link
                href={`/buyers/messages?recipient=${username}`}
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

        {/* Listings Section */}
        <div className="mt-12">
          <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-white">Listings by {username}</h2>
          {standardListings.length === 0 && premiumListings.length === 0 ? (
            <div className="text-center py-10 bg-[#1a1a1a] rounded-xl border border-dashed border-gray-700 text-gray-400 italic shadow-lg">
              <p className="text-lg mb-2">This seller has no active listings.</p>
              {user?.username === username && (
                <p className="text-sm mt-1">Go to <Link href="/sellers/my-listings" className="text-[#ff950e] hover:underline">My Listings</Link> to create one.</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...standardListings, ...premiumListings].map((listing) => (
                <div
                  key={listing.id}
                  className="rounded-xl border border-gray-800 bg-[#1a1a1a] shadow-lg hover:shadow-xl transition relative flex flex-col overflow-hidden"
                >
                  <div className="relative w-full h-56 overflow-hidden">
                    <img
                      src={listing.imageUrls?.[0]}
                      alt={listing.title}
                      className={`w-full h-full object-cover transition-transform duration-300 hover:scale-105 ${listing.isPremium && !hasAccess ? 'blur-sm' : ''
                        }`}
                    />
                    {listing.isPremium && !hasAccess && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center bg-black bg-opacity-70 text-white font-bold rounded-xl p-4">
                        <Lock className="w-8 h-8 mb-2 text-[#ff950e]" />
                        <span className="text-lg mb-2">Premium Content</span>
                        <p className="text-sm text-gray-300 mb-4">Subscribe to {username} to unlock this listing.</p>
                        {user?.role === 'buyer' && user.username !== username && (
                          <button
                            onClick={() => setShowSubscribeModal(true)}
                            className="bg-[#ff950e] text-black text-sm font-bold px-4 py-2 rounded-full hover:bg-[#e0850d] transition"
                          >
                            Subscribe Now
                          </button>
                        )}
                      </div>
                    )}
                    {listing.isPremium && hasAccess && (
                      <div className="absolute top-3 right-3 z-10">
                        <span className="bg-[#ff950e] text-black text-xs px-3 py-1.5 rounded-full font-bold flex items-center shadow">
                          <Crown className="w-4 h-4 mr-1" /> Premium
                        </span>
                      </div>
                    )}
                    {listing.hoursWorn !== undefined && listing.hoursWorn !== null && (
                      <div className="absolute bottom-3 left-3 bg-black bg-opacity-70 text-white text-xs px-2.5 py-1.5 rounded-full flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {listing.hoursWorn} Hours Worn
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex flex-col flex-grow">
                    <h3 className="text-lg font-bold text-white mb-2">{listing.title}</h3>
                    <p className="text-sm text-gray-400 mb-3 line-clamp-2 flex-grow">
                      {listing.description}
                    </p>
                    {listing.tags && listing.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-auto mb-3">
                        {listing.tags.map((tag, idx) => (
                          <span key={idx} className="bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex justify-between items-center mt-auto pt-3 border-t border-gray-700">
                      <p className="text-[#ff950e] font-bold text-xl">
                        ${listing.markedUpPrice.toFixed(2)}
                      </p>
                      {(!listing.isPremium || hasAccess) && (
                        <Link
                          href={`/browse/${listing.id}`}
                          className="inline-flex items-center gap-1 text-sm bg-[#ff950e] text-black px-4 py-2 rounded-full hover:bg-[#e0850d] font-bold transition"
                        >
                          View <ArrowRight className="w-4 h-4" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reviews Section */}
        <div className="mt-12">
          <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-white">Reviews</h2>
          {reviews.length === 0 ? (
            <div className="text-center py-10 bg-[#1a1a1a] rounded-xl border border-dashed border-gray-700 text-gray-400 italic shadow-lg">
              <p className="text-lg">No reviews yet.</p>
            </div>
          ) : (
            <ul className="space-y-6 mb-8">
              {reviews.map((review, i) => (
                <li key={i} className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6 shadow-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <StarRating rating={review.rating} />
                    <span className="text-gray-400 text-sm">
                      by <span className="font-semibold text-white">{review.reviewer}</span> on{' '}
                      {new Date(review.date).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-base text-gray-300 leading-relaxed">{review.comment}</p>
                </li>
              ))}
            </ul>
          )}

          {user?.role === 'buyer' && hasPurchased && !alreadyReviewed && (
            <div className="border-t border-gray-700 pt-8 mt-8" id="review-form">
              <h3 className="text-xl font-bold mb-4 text-white">Leave a Review</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">Rating</label>
                <select
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="block w-full max-w-[100px] border border-gray-700 rounded-lg px-3 py-2 bg-black text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
                >
                  {[5, 4, 3, 2, 1].map((r) => (
                    <option key={r} value={r}>
                      {r} Star{r > 1 ? 's' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">Comment</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full border border-gray-700 rounded-lg p-3 bg-black text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
                  rows={4}
                  placeholder="Share your experience..."
                />
              </div>
              <button
                onClick={handleSubmit}
                className="bg-[#ff950e] text-black px-6 py-3 rounded-full hover:bg-[#e0850d] font-bold transition text-lg"
              >
                Submit Review
              </button>
              {submitted && (
                <p className="text-green-500 mt-4 text-sm font-semibold">
                  ✅ Review submitted successfully!
                </p>
              )}
            </div>
          )}
        </div>

        {/* Modals (Tip, Subscribe, Unsubscribe) */}
        {showTipModal && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4">
            <div className="bg-[#1a1a1a] p-6 sm:p-8 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-700">
              <h2 className="text-2xl font-bold text-[#ff950e] mb-6 text-center">Tip {username}</h2>
              <input
                type="number"
                min="1"
                step="0.01"
                value={tipAmount}
                onChange={e => setTipAmount(e.target.value)}
                className="w-full p-3 rounded-lg border border-gray-700 bg-black text-white mb-4 text-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
                placeholder="Enter tip amount ($)"
              />
              {tipError && <div className="text-red-500 text-sm mb-4 text-center">{tipError}</div>}
              {tipSuccess && <div className="text-green-500 text-sm mb-4 text-center">Tip sent successfully! 🎉</div>}
              <div className="flex flex-col sm:flex-row gap-3 justify-end">
                <button
                  onClick={() => setShowTipModal(false)}
                  className="w-full sm:w-auto px-6 py-3 rounded-full bg-gray-700 text-white hover:bg-gray-600 transition font-medium text-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTip}
                  className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#ff950e] text-black font-bold hover:bg-[#e0850d] transition text-lg"
                >
                  Send Tip
                </button>
              </div>
            </div>
          </div>
        )}

        {showSubscribeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4">
            <div className="bg-[#1a1a1a] p-6 sm:p-8 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-700">
              <h2 className="text-2xl font-bold text-[#ff950e] mb-6 text-center">Confirm Subscription</h2>
              <p className="mb-6 text-center text-white text-base">
                Subscribe to <strong className="text-[#ff950e]">{username}</strong> for{' '}
                <span className="text-[#ff950e] font-bold">
                  ${subscriptionPrice?.toFixed(2) ?? '...'}/month
                </span>
                ?
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-end">
                <button
                  onClick={() => setShowSubscribeModal(false)}
                  className="w-full sm:w-auto px-6 py-3 rounded-full bg-gray-700 text-white hover:bg-gray-600 transition font-medium text-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmSubscribe}
                  className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#ff950e] text-black font-bold hover:bg-[#e0850d] transition text-lg"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        {showUnsubscribeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4">
            <div className="bg-[#1a1a1a] p-6 sm:p-8 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-700">
              <h2 className="text-2xl font-bold text-red-500 mb-6 text-center">Confirm Unsubscription</h2>
              <p className="mb-6 text-center text-white text-base">
                Are you sure you want to unsubscribe from <strong className="text-red-400">{username}</strong>? This will remove your access to premium listings.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-end">
                <button
                  onClick={() => setShowUnsubscribeModal(false)}
                  className="w-full sm:w-auto px-6 py-3 rounded-full bg-gray-700 text-white hover:bg-gray-600 transition font-medium text-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmUnsubscribe}
                  className="w-full sm:w-auto px-6 py-3 rounded-full bg-red-600 text-white font-bold hover:bg-red-700 transition text-lg"
                >
                  Unsubscribe
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
