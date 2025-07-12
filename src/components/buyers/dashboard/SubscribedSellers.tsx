// src/components/buyers/dashboard/SubscribedSellers.tsx
'use client';

import Link from 'next/link';
import { Crown, CheckCircle, ExternalLink } from 'lucide-react';
import { SubscribedSellersProps } from '@/types/dashboard';
import { SecureMessageDisplay, SecureImage } from '@/components/ui/SecureMessageDisplay';
import { sanitizeUsername } from '@/utils/security/sanitization';

export default function SubscribedSellers({ subscriptions }: SubscribedSellersProps) {
  return (
    <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Crown className="w-5 h-5 text-[#ff950e]" />
          Subscriptions
        </h2>
        <span className="bg-[#ff950e] text-black text-sm font-bold px-2 py-0.5 rounded">
          {subscriptions.length}
        </span>
      </div>
      
      {subscriptions.length === 0 ? (
        <div className="text-center py-8">
          <Crown className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 mb-4">No active subscriptions</p>
          <Link
            href="/browse"
            className="inline-block bg-[#ff950e] hover:bg-[#e88800] text-black font-bold px-6 py-2.5 rounded-lg transition-colors text-base"
            style={{ color: '#000000' }}
          >
            Browse Sellers
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {subscriptions.map((sub) => {
            const sanitizedUsername = sanitizeUsername(sub.seller);
            
            return (
              <div key={sub.seller} className="bg-[#111111] rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {sub.pic ? (
                      <SecureImage 
                        src={sub.pic} 
                        alt={sub.seller}
                        className="w-12 h-12 rounded-full object-cover border-2 border-gray-700"
                        fallbackSrc="/placeholder-avatar.png"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center">
                        <Crown className="w-5 h-5 text-gray-600" />
                      </div>
                    )}
                    
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Link 
                          href={`/sellers/${sanitizedUsername}`}
                          className="font-medium text-white hover:text-[#ff950e] transition-colors"
                        >
                          <SecureMessageDisplay 
                            content={sub.seller}
                            allowBasicFormatting={false}
                            className="inline"
                          />
                        </Link>
                        {sub.verified && (
                          <span title="Verified">
                            <CheckCircle className="w-4 h-4 text-blue-400" />
                          </span>
                        )}
                        {sub.tier && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getTierColor(sub.tier)}`}>
                            {sub.tier}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-400 line-clamp-2 mb-2">
                        <SecureMessageDisplay 
                          content={sub.bio}
                          allowBasicFormatting={false}
                          maxLength={200}
                        />
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>{sub.newListings} new listings</span>
                        <span>•</span>
                        <span>${sub.price}/month</span>
                      </div>
                    </div>
                  </div>
                  
                  <Link
                    href={`/sellers/${sanitizedUsername}`}
                    className="text-gray-400 hover:text-[#ff950e] transition-colors"
                    title="View Profile"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const getTierColor = (tier?: string) => {
  switch (tier) {
    case 'Goddess':
      return 'text-purple-400 bg-purple-400/20';
    case 'Desire':
      return 'text-pink-400 bg-pink-400/20';
    case 'Obsession':
      return 'text-red-400 bg-red-400/20';
    case 'Flirt':
      return 'text-orange-400 bg-orange-400/20';
    default:
      return 'text-yellow-400 bg-yellow-400/20';
  }
};
