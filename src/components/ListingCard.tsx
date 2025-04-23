'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useListings } from '@/context/ListingContext';
import { Heart, ShoppingCart, Shield, Eye, Star } from 'lucide-react';

// Define the Listing interface for TypeScript type safety
interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl?: string;
  sellerId: string;
  sellerName: string;
  isPremium?: boolean;
  category?: string;
  createdAt?: number;
  status: 'active' | 'sold' | 'pending';
  viewCount?: number;
  sellerRating?: number;
  isVerifiedSeller?: boolean;
}

interface ListingCardProps {
  listing: Listing;
}

export default function ListingCard({ listing }: ListingCardProps) {
  const { user, addToCart, isSubscribedToSeller } = useListings();
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  
  const isBlurred = listing.isPremium && user?.role === 'buyer' && 
    !isSubscribedToSeller(listing.sellerId);
  
  // Format price with currency symbol
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(listing.price);

  // Calculate seller rating display (if available)
  const renderSellerRating = () => {
    if (!listing.sellerRating) return null;
    
    return (
      <div className="flex items-center">
        <Star className="h-3 w-3 text-yellow-400 mr-1" />
        <span className="text-xs">{listing.sellerRating.toFixed(1)}</span>
      </div>
    );
  };

  // Handle add to cart
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      // Redirect to login if not logged in
      window.location.href = '/login';
      return;
    }
    
    addToCart(listing);
  };
  
  // Handle like toggle
  const handleLikeToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      // Redirect to login if not logged in
      window.location.href = '/login';
      return;
    }
    
    setIsLiked(!isLiked);
    // You would implement saving to liked items in context here
  };

  return (
    <Link href={`/listing/${listing.id}`}>
      <div 
        className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden shadow-lg transition-all duration-300 hover:shadow-pink-900/20 hover:scale-[1.02]"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image container */}
        <div className="relative aspect-[3/4] bg-gray-800 overflow-hidden">
          {listing.imageUrl ? (
            <Image
              src={listing.imageUrl}
              alt={listing.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              className={`object-cover transition-all duration-500 ${isBlurred ? 'blur-lg' : ''}`}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-gray-600">
              No Image
            </div>
          )}
          
          {/* Premium badge */}
          {listing.isPremium && (
            <div className="absolute top-2 left-2 bg-gradient-to-r from-amber-500 to-yellow-400 text-xs font-bold text-black py-1 px-2 rounded-full flex items-center">
              <Star className="h-3 w-3 mr-1" />
              Premium
            </div>
          )}
          
          {/* Verified seller badge */}
          {listing.isVerifiedSeller && (
            <div className="absolute top-2 right-2 bg-blue-500 text-xs font-bold text-white py-1 px-2 rounded-full flex items-center">
              <Shield className="h-3 w-3 mr-1" />
              Verified
            </div>
          )}
          
          {/* View count */}
          {listing.viewCount && (
            <div className="absolute bottom-2 left-2 bg-black/60 text-xs text-white py-1 px-2 rounded-full flex items-center">
              <Eye className="h-3 w-3 mr-1" />
              {listing.viewCount > 1000 ? `${(listing.viewCount / 1000).toFixed(1)}k` : listing.viewCount}
            </div>
          )}
          
          {/* Subscribe notice for premium content */}
          {isBlurred && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 p-4 text-center">
              <Shield className="h-8 w-8 text-pink-400 mb-2" />
              <p className="text-white font-medium mb-1">Premium Content</p>
              <p className="text-gray-300 text-sm mb-2">Subscribe to view</p>
              <Link 
                href={`/seller/${listing.sellerId}`}
                className="bg-pink-600 hover:bg-pink-700 text-white text-xs font-medium py-1 px-3 rounded-full transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                Subscribe
              </Link>
            </div>
          )}
          
          {/* Action buttons that appear on hover */}
          <div 
            className={`absolute bottom-0 left-0 right-0 p-2 flex justify-between items-center transition-all duration-300 ${
              isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
            }`}
          >
            <button
              onClick={handleLikeToggle}
              className={`p-2 rounded-full ${
                isLiked ? 'bg-pink-600 text-white' : 'bg-black/70 text-white hover:bg-black/90'
              }`}
            >
              <Heart className="h-4 w-4" />
            </button>
            
            <button
              onClick={handleAddToCart}
              className="p-2 rounded-full bg-black/70 text-white hover:bg-black/90"
            >
              <ShoppingCart className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {/* Listing info */}
        <div className="p-4">
          {/* Category */}
          {listing.category && (
            <div className="text-xs text-gray-500 mb-1">
              {listing.category}
            </div>
          )}
          
          {/* Title */}
          <h3 className="font-medium text-white mb-1 line-clamp-2">{listing.title}</h3>
          
          {/* Seller info */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <div className="text-xs text-gray-400">By {listing.sellerName}</div>
              {renderSellerRating()}
            </div>
          </div>
          
          {/* Price */}
          <div className="flex justify-between items-center">
            <div className="font-bold text-lg text-white">{formattedPrice}</div>
            
            {/* Created date (if available) */}
            {listing.createdAt && (
              <div className="text-xs text-gray-500">
                {new Date(listing.createdAt).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}