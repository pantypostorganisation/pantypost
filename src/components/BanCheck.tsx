// src/components/BanCheck.tsx
'use client';

import { useEffect, useState } from 'react';
import { useBans } from '@/context/BanContext';
import { useListings } from '@/context/ListingContext';
import { 
  Ban, 
  Clock, 
  AlertTriangle, 
  MessageSquare, 
  Infinity,
  Shield,
  Calendar,
  FileText
} from 'lucide-react';

interface BanCheckProps {
  children: React.ReactNode;
}

const BanCheck: React.FC<BanCheckProps> = ({ children }) => {
  const { user, logout } = useListings();
  const { isUserBanned, submitAppeal } = useBans();
  const [banInfo, setBanInfo] = useState<any>(null);
  const [showAppealForm, setShowAppealForm] = useState(false);
  const [appealText, setAppealText] = useState('');
  const [appealSubmitted, setAppealSubmitted] = useState(false);

  // Check if user is banned whenever user changes
  useEffect(() => {
    if (user) {
      const ban = isUserBanned(user.username);
      setBanInfo(ban);
      
      // If user is banned, prevent them from using the platform
      if (ban) {
        console.log(`User ${user.username} is banned:`, ban);
      }
    } else {
      setBanInfo(null);
    }
  }, [user, isUserBanned]);

  // Handle appeal submission
  const handleSubmitAppeal = () => {
    if (!user || !appealText.trim()) return;
    
    const success = submitAppeal(user.username, appealText.trim());
    if (success) {
      setAppealSubmitted(true);
      setShowAppealForm(false);
      setAppealText('');
      
      // Refresh ban info to show appeal was submitted
      const updatedBan = isUserBanned(user.username);
      setBanInfo(updatedBan);
    } else {
      alert('Failed to submit appeal. Please try again.');
    }
  };

  // Format remaining time
  const formatRemainingTime = (ban: any) => {
    if (ban.banType === 'permanent') {
      return 'This is a permanent ban';
    }
    
    if (!ban.remainingHours || ban.remainingHours <= 0) {
      return 'Ban has expired - please refresh the page';
    }
    
    if (ban.remainingHours < 24) {
      return `${ban.remainingHours} hour${ban.remainingHours !== 1 ? 's' : ''} remaining`;
    }
    
    const days = Math.floor(ban.remainingHours / 24);
    const hours = ban.remainingHours % 24;
    return `${days} day${days !== 1 ? 's' : ''} ${hours ? `and ${hours} hour${hours !== 1 ? 's' : ''}` : ''} remaining`;
  };

  // Get ban reason display
  const getBanReasonDisplay = (reason: string, customReason?: string) => {
    const reasonMap: Record<string, string> = {
      harassment: 'Harassment',
      spam: 'Spam',
      inappropriate_content: 'Inappropriate Content',
      scam: 'Scam/Fraud',
      underage: 'Underage',
      payment_fraud: 'Payment Fraud',
      other: 'Other'
    };
    
    const displayReason = reasonMap[reason] || reason;
    return customReason ? `${displayReason}: ${customReason}` : displayReason;
  };

  // If user is banned, show ban screen instead of normal content
  if (banInfo) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-[#1a1a1a] border-2 border-red-800 rounded-xl p-8 text-center shadow-2xl">
          {/* Ban Icon */}
          <div className="mb-6">
            <div className="w-20 h-20 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              {banInfo.banType === 'permanent' ? (
                <Infinity size={40} className="text-red-400" />
              ) : (
                <Ban size={40} className="text-red-400" />
              )}
            </div>
            <h1 className="text-3xl font-bold text-red-400 mb-2">
              Account {banInfo.banType === 'permanent' ? 'Permanently' : 'Temporarily'} Banned
            </h1>
            <p className="text-gray-400">
              Your account has been suspended from PantyPost
            </p>
          </div>

          {/* Ban Details */}
          <div className="bg-[#222] rounded-lg p-6 mb-6 text-left">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 text-gray-400 mb-1">
                  <AlertTriangle size={16} />
                  <span className="font-medium">Reason</span>
                </div>
                <p className="text-white">{getBanReasonDisplay(banInfo.reason, banInfo.customReason)}</p>
              </div>
              
              <div>
                <div className="flex items-center gap-2 text-gray-400 mb-1">
                  <Clock size={16} />
                  <span className="font-medium">Duration</span>
                </div>
                <p className="text-white">{formatRemainingTime(banInfo)}</p>
              </div>
              
              <div>
                <div className="flex items-center gap-2 text-gray-400 mb-1">
                  <Calendar size={16} />
                  <span className="font-medium">Banned On</span>
                </div>
                <p className="text-white">{new Date(banInfo.startTime).toLocaleString()}</p>
              </div>
              
              {banInfo.endTime && (
                <div>
                  <div className="flex items-center gap-2 text-gray-400 mb-1">
                    <Calendar size={16} />
                    <span className="font-medium">Ban Ends</span>
                  </div>
                  <p className="text-white">{new Date(banInfo.endTime).toLocaleString()}</p>
                </div>
              )}
            </div>
            
            {banInfo.notes && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="flex items-center gap-2 text-gray-400 mb-1">
                  <FileText size={16} />
                  <span className="font-medium">Additional Information</span>
                </div>
                <p className="text-gray-300 text-sm">{banInfo.notes}</p>
              </div>
            )}
          </div>

          {/* Appeal Section */}
          {banInfo.appealable && !banInfo.appealSubmitted && !appealSubmitted && (
            <div className="bg-blue-900/10 border border-blue-800 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-blue-400 mb-3 flex items-center justify-center gap-2">
                <MessageSquare size={20} />
                Submit an Appeal
              </h3>
              <p className="text-gray-300 text-sm mb-4">
                If you believe this ban was issued in error, you can submit an appeal for admin review.
              </p>
              
              {!showAppealForm ? (
                <button
                  onClick={() => setShowAppealForm(true)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Submit Appeal
                </button>
              ) : (
                <div className="text-left">
                  <textarea
                    value={appealText}
                    onChange={(e) => setAppealText(e.target.value)}
                    placeholder="Explain why you believe this ban should be lifted..."
                    className="w-full p-3 bg-[#222] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                    rows={4}
                    maxLength={500}
                  />
                  <div className="text-xs text-gray-400 mb-4">
                    {appealText.length}/500 characters
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowAppealForm(false);
                        setAppealText('');
                      }}
                      className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmitAppeal}
                      disabled={!appealText.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Submit Appeal
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Appeal Status */}
          {(banInfo.appealSubmitted || appealSubmitted) && (
            <div className="bg-orange-900/10 border border-orange-800 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-orange-400 mb-2">Appeal Submitted</h3>
              <p className="text-gray-300 text-sm">
                Your appeal has been submitted and is pending review by our moderation team. 
                You will be notified of the decision.
              </p>
              {banInfo.appealText && (
                <div className="mt-3 p-3 bg-[#222] rounded">
                  <div className="text-sm text-gray-400 mb-1">Your appeal message:</div>
                  <div className="text-sm text-gray-300">{banInfo.appealText}</div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => {
                logout();
                window.location.href = '/';
              }}
              className="px-6 py-2 bg-[#333] text-white rounded-lg hover:bg-[#444] transition-colors"
            >
              Sign Out
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-[#ff950e] text-black rounded-lg hover:bg-[#e88800] transition-colors"
            >
              Refresh Status
            </button>
          </div>

          {/* Contact Info */}
          <div className="mt-8 pt-6 border-t border-gray-700 text-sm text-gray-400">
            <p>
              For urgent matters, contact our support team. Please reference your username: <strong>{user?.username}</strong>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If user is not banned, render children normally
  return <>{children}</>;
};

export default BanCheck;