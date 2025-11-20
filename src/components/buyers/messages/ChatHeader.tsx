// src/components/buyers/messages/ChatHeader.tsx
'use client';

import React from 'react';
import { MoreVertical, Ban, Flag, CheckCircle, Heart, User } from 'lucide-react';
import { SecureMessageDisplay, SecureImage } from '@/components/ui/SecureMessageDisplay';
import { sanitizeUsername, sanitizeStrict } from '@/utils/security/sanitization';
import { formatActivityStatus } from '@/utils/format';
import { useUserActivityStatus } from '@/hooks/useUserActivityStatus';

interface ChatHeaderProps {
  activeThread: string;
  sellerProfile: { pic: string | null; verified: boolean };
  isUserReported: boolean;
  isUserBlocked: boolean;
  onReport: () => void;
  onBlockToggle: () => void;
  onSendTip: () => void;
}

export default function ChatHeader({
  activeThread,
  sellerProfile,
  isUserReported,
  isUserBlocked,
  onReport,
  onBlockToggle,
  onSendTip,
}: ChatHeaderProps) {
  const [showDropdown, setShowDropdown] = React.useState(false);
  const sanitizedUsername = sanitizeUsername(activeThread);
  const { activityStatus, loading } = useUserActivityStatus(activeThread);

  const getActivityDisplay = () => {
    if (isUserBlocked) return 'Blocked';
    if (loading) return '...';
    return formatActivityStatus(activityStatus.isOnline, activityStatus.lastActive);
  };

  return (
    <div className="bg-[#1a1a1a] border-b border-gray-800 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Seller Avatar */}
          <div className="relative">
            {sellerProfile.pic ? (
              <SecureImage
                src={sellerProfile.pic}
                alt={sanitizedUsername}
                className="w-10 h-10 rounded-full object-cover"
                fallbackSrc="/placeholder-avatar.png"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                {sanitizeStrict(sanitizedUsername).charAt(0).toUpperCase()}
              </div>
            )}

            {/* Online indicator */}
            {activityStatus.isOnline && !isUserBlocked && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#1a1a1a]" />
            )}
          </div>

          {/* Seller Info */}
          <div>
            <h3 className="font-semibold text-white flex items-center gap-2">
              <SecureMessageDisplay content={sanitizedUsername} allowBasicFormatting={false} className="inline" />
              {sellerProfile.verified && <CheckCircle className="w-4 h-4 text-blue-500" />}
            </h3>
            <p
              className={`text-xs ${
                activityStatus.isOnline && !isUserBlocked ? 'text-green-400' : 'text-gray-400'
              }`}
            >
              {getActivityDisplay()}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown((s) => !s)}
            className="p-2 hover:bg-[#222] rounded-lg transition-colors"
            aria-haspopup="menu"
            aria-expanded={showDropdown}
            aria-label="Conversation actions"
          >
            <MoreVertical className="w-5 h-5 text-gray-400" />
          </button>

          {showDropdown && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
              <div
                role="menu"
                className="absolute right-0 top-full mt-1 bg-[#222] border border-gray-700 rounded-lg shadow-lg py-1 min-w-[200px] z-20"
              >
                <button
                  onClick={() => {
                    // open safely in a new tab
                    window.open(`/sellers/${sanitizedUsername}`, '_blank', 'noopener,noreferrer');
                    setShowDropdown(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-[#333] hover:text-white transition-colors flex items-center gap-2"
                  role="menuitem"
                >
                  <User className="w-4 h-4" />
                  View Profile
                </button>

                <button
                  onClick={() => {
                    onSendTip();
                    setShowDropdown(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-[#333] hover:text-white transition-colors flex items-center gap-2"
                  role="menuitem"
                >
                  <Heart className="w-4 h-4 text-pink-500" />
                  Send Tip
                </button>

                <div className="border-t border-gray-700 my-1" />

                <button
                  onClick={() => {
                    onBlockToggle();
                    setShowDropdown(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-[#333] hover:text-white transition-colors flex items-center gap-2"
                  role="menuitem"
                >
                  <Ban className={`w-4 h-4 ${isUserBlocked ? 'text-green-500' : 'text-red-500'}`} />
                  {isUserBlocked ? 'Unblock' : 'Block'} Seller
                </button>

                {!isUserReported && (
                  <button
                    onClick={() => {
                      onReport();
                      setShowDropdown(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-[#333] hover:text-red-300 transition-colors flex items-center gap-2"
                    role="menuitem"
                  >
                    <Flag className="w-4 h-4" />
                    Report Seller
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
