// src/components/browse/ListingCard.tsx
'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import {
 Crown, Clock, Lock, CheckCircle, Gavel, ArrowUp, Eye, Package, Heart, ChevronLeft, ChevronRight
} from 'lucide-react';
import { ListingCardProps } from '@/types/browse';
import { isAuctionListing } from '@/utils/browseUtils';
import { useFavorites } from '@/context/FavoritesContext';
import { useToast } from '@/context/ToastContext';
import { resolveApiUrl } from '@/utils/url';

interface ExtendedListingCardProps extends ListingCardProps {
  isGuest?: boolean;
}

export default function ListingCard({
 listing,
 isHovered,
 onMouseEnter,
 onMouseLeave,
 onClick,
 onQuickView,
 user,
 isSubscribed,
 displayPrice,
 forceUpdateTimer,
 formatTimeRemaining,
 isGuest = false
}: ExtendedListingCardProps) {
 // State for image carousel
 const [currentImageIndex, setCurrentImageIndex] = useState(0);
 const [showArrows, setShowArrows] = useState(false);
 const imageContainerRef = useRef<HTMLDivElement>(null);
 
 // FIXED: Use the server's isLocked field directly
 const isLockedPremium = listing.isLocked === true;
 const hasAuction = isAuctionListing(listing);
 const hasMultipleImages = listing.imageUrls && listing.imageUrls.length > 1;

 // Favorites functionality
 const { isFavorited, toggleFavorite } = useFavorites();
 const { error: showErrorToast, success: showSuccessToast } = useToast();

 // Generate consistent seller ID
 const sellerId = `seller_${listing.seller}`;
 const isFav = user?.role === 'buyer' ? isFavorited(sellerId) : false;

 // FIX: Resolve the seller profile picture URL
 const resolvedSellerPic = resolveApiUrl(listing.sellerProfile?.pic);
 
 // FIXED: Match the browse/[id] page verification check exactly
 const isSellerVerified = (listing.isSellerVerified ?? listing.isVerified) || false;

 // Reset image index when listing changes
 useEffect(() => {
   setCurrentImageIndex(0);
 }, [listing.id]);

 const handleFavoriteClick = async (e: React.MouseEvent) => {
   e.stopPropagation();
   e.preventDefault();

   if (user?.role !== 'buyer') {
     showErrorToast('Only buyers can add favorites');
     return;
   }

   const success = await toggleFavorite({
     id: sellerId,
     username: listing.seller,
     profilePicture: listing.sellerProfile?.pic || undefined,
     tier: undefined,
     isVerified: isSellerVerified,
   });

   if (success) {
     showSuccessToast(isFav ? 'Removed from favorites' : 'Added to favorites');
   }
 };

 // Handle image navigation
 const handlePrevImage = (e: React.MouseEvent) => {
   e.stopPropagation();
   e.preventDefault();
   if (!hasMultipleImages) return;
   
   setCurrentImageIndex((prev) => 
     prev === 0 ? listing.imageUrls.length - 1 : prev - 1
   );
 };

 const handleNextImage = (e: React.MouseEvent) => {
   e.stopPropagation();
   e.preventDefault();
   if (!hasMultipleImages) return;
   
   setCurrentImageIndex((prev) => 
     prev === listing.imageUrls.length - 1 ? 0 : prev + 1
   );
 };

 // Handle click for guests - prevent navigation
 const handleCardClick = () => {
   if (!isGuest) {
     onClick();
   }
 };

 return (
   <div
     className={`relative flex flex-col bg-gradient-to-br from-[#1a1a1a] to-[#111] border ${
       hasAuction ? 'border-purple-800' : 'border-gray-800'
     } rounded-lg sm:rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden ${
       hasAuction ? 'hover:border-purple-600' : 'hover:border-[#ff950e]'
     } ${isGuest ? '' : 'cursor-pointer'} group hover:transform hover:scale-[1.02]`}
     onMouseEnter={() => {
       onMouseEnter();
       setShowArrows(true);
     }}
     onMouseLeave={() => {
       onMouseLeave();
       setShowArrows(false);
     }}
     onClick={handleCardClick}
   >
     {/* Type Badge and Favorite Button - Adjusted for mobile */}
     <div className="absolute top-2 sm:top-3 md:top-4 right-2 sm:right-3 md:right-4 z-10 flex items-center gap-1 sm:gap-2">
       {/* Favorite Button for Buyers - Not shown for guests */}
       {user?.role === 'buyer' && !isLockedPremium && !isGuest && (
         <button
           onClick={handleFavoriteClick}
           className="p-1.5 sm:p-2 bg-black/70 backdrop-blur-sm rounded-md sm:rounded-lg hover:bg-black/90 transition-all group/fav"
           aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
         >
           <Heart
             size={14}
             className={`transition-all group-hover/fav:scale-110 sm:w-4 sm:h-4 ${
               isFav ? 'fill-[#ff950e] text-[#ff950e]' : 'text-white hover:text-[#ff950e]'
             }`}
           />
         </button>
       )}

       {/* Type Badges - Smaller on mobile */}
       {hasAuction && (
         <span className="bg-gradient-to-r from-purple-600 to-purple-500 text-white text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg font-bold flex items-center shadow-lg">
           <Gavel className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5" /> AUCTION
         </span>
       )}

       {!hasAuction && listing.isPremium && (
         <span className="bg-gradient-to-r from-[#ff950e] to-[#ff6b00] text-black text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg font-bold flex items-center shadow-lg">
           <Crown className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5" /> PREMIUM
         </span>
       )}
     </div>

     {/* Image with carousel functionality - Responsive aspect ratio */}
     <div ref={imageContainerRef} className="relative aspect-[4/5] sm:aspect-square overflow-hidden bg-black">
       {listing.imageUrls && listing.imageUrls.length > 0 ? (
         <>
           <img
             src={listing.imageUrls[currentImageIndex]}
             alt={listing.title}
             className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ${
               isLockedPremium ? 'blur-md' : (isGuest ? 'blur-md' : '')
             }`}
             onError={(e) => {
               const target = e.currentTarget;
               target.src = '/placeholder-panty.png';
               target.onerror = null;
               console.warn('Image failed to load:', listing.imageUrls?.[currentImageIndex]);
             }}
           />

           {/* Image carousel arrows - Only show on hover and if multiple images */}
           {hasMultipleImages && isHovered && showArrows && !isLockedPremium && (
             <>
               <button
                 onClick={handlePrevImage}
                 className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 text-[#ff950e] rounded-full p-1.5 sm:p-2 transition-all z-20 backdrop-blur-sm"
                 aria-label="Previous image"
               >
                 <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
               </button>
               <button
                 onClick={handleNextImage}
                 className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 text-[#ff950e] rounded-full p-1.5 sm:p-2 transition-all z-20 backdrop-blur-sm"
                 aria-label="Next image"
               >
                 <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
               </button>
             </>
           )}

           {/* Image indicators - Show if multiple images */}
           {hasMultipleImages && (
             <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-20">
               {listing.imageUrls.map((_, index) => (
                 <div
                   key={index}
                   className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all ${
                     index === currentImageIndex 
                       ? 'bg-[#ff950e] w-3 sm:w-4' 
                       : 'bg-white/50 hover:bg-white/70'
                   }`}
                 />
               ))}
             </div>
           )}
         </>
       ) : (
         <div className="w-full h-full flex items-center justify-center bg-gray-900">
           <div className="text-center text-gray-400">
             <Package className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-2 sm:mb-3 opacity-50" />
             <p className="text-xs sm:text-sm">No Image</p>
           </div>
         </div>
       )}

       {/* Enhanced bottom gradient */}
       <div className="absolute inset-x-0 bottom-0 h-24 sm:h-32 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />

       {/* Guest blur overlay - removed the overlay div, keeping just the blur on the image */}
       {isGuest && !isLockedPremium && (
         <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
           <Lock className="w-8 h-8 sm:w-10 sm:h-10 text-[#ff950e] mb-2 drop-shadow-lg" />
           <p className="text-xs sm:text-sm font-bold text-white drop-shadow-lg">
             Sign up to view
           </p>
         </div>
       )}

       {isLockedPremium && (
         <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center backdrop-blur-sm">
           <Lock className="w-8 h-8 sm:w-12 sm:h-12 text-[#ff950e] mb-2 sm:mb-4" />
           <p className="text-xs sm:text-sm font-bold text-white text-center px-2 sm:px-4">
             Subscribe to view premium content
           </p>
         </div>
       )}

       {/* Enhanced auction timer - Smaller on mobile */}
       {hasAuction && listing.auction && (
         <div className="absolute bottom-2 sm:bottom-3 md:bottom-4 left-2 sm:left-3 md:left-4 z-10" key={`timer-${listing.id}-${forceUpdateTimer}`}>
           <span className="bg-black/90 backdrop-blur-sm text-white text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-2 rounded-md sm:rounded-lg font-bold flex items-center shadow-lg border border-purple-500/30">
             <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-purple-400" />
             {formatTimeRemaining(listing.auction.endTime)}
           </span>
         </div>
       )}

       {/* Enhanced quick view button - Hidden on mobile and for guests */}
       {isHovered && !isLockedPremium && !isGuest && (
         <div className="hidden sm:block absolute bottom-4 right-4 z-10">
           <button
             className="bg-gradient-to-r from-[#ff950e] to-[#ff6b00] text-black text-sm font-bold px-4 py-2 rounded-lg flex items-center gap-2 shadow-xl hover:from-[#e88800] hover:to-[#ff950e] transition-all transform hover:scale-105"
             onClick={onQuickView}
             aria-label="Quick view"
           >
             <Eye className="w-4 h-4" /> Quick View
           </button>
         </div>
       )}
     </div>

     {/* Content - Optimized for mobile */}
     <div className="p-3 sm:p-4 md:p-5 flex flex-col flex-grow">
       {!isGuest ? (
         <div>
           <h2 className="text-sm sm:text-base md:text-xl font-bold text-white mb-1 sm:mb-2 line-clamp-1 group-hover:text-[#ff950e] transition-colors">
             {listing.title}
           </h2>
           <p className="text-xs sm:text-sm text-gray-400 mb-2 sm:mb-3 line-clamp-1 sm:line-clamp-2 leading-relaxed">
             {listing.description}
           </p>
         </div>
       ) : (
         <div>
           <div className="h-5 sm:h-6 md:h-7 bg-gray-800/50 rounded mb-1 sm:mb-2" />
           <div className="h-8 sm:h-10 bg-gray-800/30 rounded mb-2 sm:mb-3" />
         </div>
       )}

       {/* Tags - Hidden on mobile to save space */}
       {listing.tags && listing.tags.length > 0 && (
         <div className="hidden sm:flex flex-wrap gap-2 mb-4">
           {listing.tags.slice(0, 3).map((tag, i) => (
             <span key={i} className="bg-black/50 text-[#ff950e] text-xs px-3 py-1 rounded-full font-medium border border-[#ff950e]/20">
               #{tag}
             </span>
           ))}
           {listing.tags.length > 3 && (
             <span className="text-gray-500 text-xs px-2 py-1">
               +{listing.tags.length - 3} more
             </span>
           )}
         </div>
       )}

       {/* Auction info - Compact on mobile */}
       {hasAuction && listing.auction && !isGuest && (
         <div className="bg-gradient-to-r from-purple-900/30 to-purple-800/20 rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 mb-2 sm:mb-4 border border-purple-700/30 backdrop-blur-sm">
           <div className="flex justify-between items-center text-xs sm:text-sm mb-1 sm:mb-2">
             <span className="text-purple-300 font-medium text-[10px] sm:text-xs">{displayPrice.label}</span>
             <span className="font-bold text-white flex items-center text-sm sm:text-base md:text-lg">
               {listing.auction.bids && listing.auction.bids.length > 0 && (
                 <ArrowUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-400 mr-1" />
               )}
               ${displayPrice.price}
             </span>
           </div>
           <div className="flex justify-between items-center text-[10px] sm:text-xs">
             <span className="text-gray-400 flex items-center gap-0.5 sm:gap-1">
               <Gavel className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
               {listing.auction.bids?.length || 0} bids
             </span>
             {listing.auction.reservePrice && (
               <span
                 className={`font-medium text-[10px] sm:text-xs ${
                   (!listing.auction.highestBid || listing.auction.highestBid < listing.auction.reservePrice)
                     ? 'text-yellow-400'
                     : 'text-green-400'
                 }`}
               >
                 {(!listing.auction.highestBid || listing.auction.highestBid < listing.auction.reservePrice)
                   ? '⚠️ Reserve not met'
                   : '✅ Reserve met'
                 }
               </span>
             )}
           </div>
         </div>
       )}
       
       {/* Auction info for guests - no price shown */}
       {hasAuction && listing.auction && isGuest && (
         <div className="bg-gradient-to-r from-purple-900/30 to-purple-800/20 rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 mb-2 sm:mb-4 border border-purple-700/30 backdrop-blur-sm">
           <div className="text-center">
             <span className="text-xs sm:text-sm text-gray-500 font-semibold">
               Log in to view auction details
             </span>
           </div>
         </div>
       )}

       {/* Price & seller - Compact layout on mobile */}
       <div className="flex justify-between items-end mt-auto">
         {/* Seller info - visible for all but not clickable for guests */}
         {!isGuest ? (
           <Link
             href={`/sellers/${listing.seller}`}
             className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm md:text-base text-gray-400 hover:text-[#ff950e] transition-colors group/seller max-w-[60%]"
             onClick={e => e.stopPropagation()}
           >
             {resolvedSellerPic ? (
               <img
                 src={resolvedSellerPic}
                 alt={listing.seller}
                 className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full object-cover border-2 border-gray-700 group-hover/seller:border-[#ff950e] transition-colors flex-shrink-0"
                 onError={(e) => {
                   const target = e.currentTarget;
                   target.src = '/default-avatar.png';
                   target.onerror = null;
                 }}
               />
             ) : (
               <span className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-gray-800 to-gray-700 flex items-center justify-center text-xs sm:text-sm md:text-lg font-bold text-[#ff950e] border-2 border-gray-700 group-hover/seller:border-[#ff950e] transition-colors flex-shrink-0">
                 {listing.seller.charAt(0).toUpperCase()}
               </span>
             )}
             <div className="flex flex-col min-w-0">
               <span className="font-bold text-xs sm:text-sm md:text-base flex items-center gap-1 sm:gap-2 truncate">
                 <span className="truncate">{listing.seller}</span>
                 {/* Show verification badge only when isSellerVerified is true from backend */}
                 {isSellerVerified && (
                   <img
                     src="/verification_badge.png"
                     alt="Verified"
                     className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 flex-shrink-0"
                   />
                 )}
               </span>
               {(listing.sellerSalesCount ?? 0) > 0 && (
                 <span className="text-[10px] sm:text-xs text-gray-500 hidden sm:flex items-center gap-1">
                   <CheckCircle className="w-3 h-3" />
                   {listing.sellerSalesCount} sales
                 </span>
               )}
             </div>
           </Link>
         ) : (
           <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm md:text-base text-gray-400 max-w-[60%]">
             {resolvedSellerPic ? (
               <img
                 src={resolvedSellerPic}
                 alt={listing.seller}
                 className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full object-cover border-2 border-gray-700 flex-shrink-0"
                 onError={(e) => {
                   const target = e.currentTarget;
                   target.src = '/default-avatar.png';
                   target.onerror = null;
                 }}
               />
             ) : (
               <span className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-gray-800 to-gray-700 flex items-center justify-center text-xs sm:text-sm md:text-lg font-bold text-[#ff950e] border-2 border-gray-700 flex-shrink-0">
                 {listing.seller.charAt(0).toUpperCase()}
               </span>
             )}
             <div className="flex flex-col min-w-0">
               <span className="font-bold text-xs sm:text-sm md:text-base flex items-center gap-1 sm:gap-2 truncate">
                 <span className="truncate">{listing.seller}</span>
                 {/* Show verification badge only when isSellerVerified is true from backend */}
                 {isSellerVerified && (
                   <img
                     src="/verification_badge.png"
                     alt="Verified"
                     className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 flex-shrink-0"
                   />
                 )}
               </span>
               {(listing.sellerSalesCount ?? 0) > 0 && (
                 <span className="text-[10px] sm:text-xs text-gray-500 hidden sm:flex items-center gap-1">
                   <CheckCircle className="w-3 h-3" />
                   {listing.sellerSalesCount} sales
                 </span>
               )}
             </div>
           </div>
         )}

         {/* Price - hidden for guests */}
         {!hasAuction && !isGuest && (
           <div className="text-right">
             <p className="font-bold text-[#ff950e] text-base sm:text-xl md:text-2xl">
               ${displayPrice.price}
             </p>
             <p className="text-[10px] sm:text-xs text-gray-500 font-medium hidden sm:block">
               {displayPrice.label}
             </p>
           </div>
         )}
         
         {/* Show "Log in to view details" for guests */}
         {!hasAuction && isGuest && (
           <div className="text-right">
             <p className="text-xs sm:text-sm text-gray-500 font-semibold">
               Log in to view details
             </p>
           </div>
         )}
       </div>

       {/* Locked premium CTA - Smaller on mobile - Not shown for guests */}
       {user?.role === 'buyer' && isLockedPremium && !isGuest && (
         <Link
           href={`/sellers/${listing.seller}`}
           className="mt-2 sm:mt-3 md:mt-4 w-full bg-gradient-to-r from-gray-700 to-gray-600 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl hover:from-gray-600 hover:to-gray-500 font-bold transition-all text-xs sm:text-sm text-center flex items-center justify-center gap-1 sm:gap-2 shadow-lg"
           onClick={e => e.stopPropagation()}
         >
           <Lock className="w-3 h-3 sm:w-4 sm:h-4" /> Subscribe to Unlock
         </Link>
       )}
     </div>
   </div>
 );
}
