// src/components/BanCheck.tsx
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useBans } from '@/context/BanContext';
import { useAuth } from '@/context/AuthContext';
import { SecureTextarea } from '@/components/ui/SecureInput';
import { SecureMessageDisplay } from '@/components/ui/SecureMessageDisplay';
import { sanitizeStrict } from '@/utils/security/sanitization';
import {
  Ban as BanIcon,
  Clock,
  AlertTriangle,
  MessageSquare,
  Infinity as InfinityIcon,
  Shield,
  Calendar,
  FileText,
  Upload,
  X,
  RefreshCw,
  Image as ImageIcon,
  Send,
  Info,
  ExternalLink,
} from 'lucide-react';

interface BanCheckProps {
  children: React.ReactNode;
}

const BanCheck: React.FC<BanCheckProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const { isUserBanned, submitAppeal, getBanInfo } = useBans();

  const [banInfo, setBanInfo] = useState<any>(null);
  const [showAppealForm, setShowAppealForm] = useState(false);
  const [appealText, setAppealText] = useState('');
  const [appealFiles, setAppealFiles] = useState<File[]>([]);
  const [appealSubmitted, setAppealSubmitted] = useState(false);
  const [isSubmittingAppeal, setIsSubmittingAppeal] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastCheckTime, setLastCheckTime] = useState<number>(0);
  const [connectionError, setConnectionError] = useState(false);
  const [appealError, setAppealError] = useState('');

  const maxRetries = 3;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const checkBanStatus = useCallback(async () => {
    if (!user?.username) {
      setBanInfo(null);
      return;
    }

    try {
      setConnectionError(false);
      const ban = isUserBanned(user.username);
      setBanInfo(ban);
      setLastCheckTime(Date.now());
      setRetryCount(0);

      if (!ban && banInfo) {
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (error) {
      console.error('Error checking ban status:', error);
      setConnectionError(true);

      if (retryCount < maxRetries) {
        const backoffDelay = Math.pow(2, retryCount) * 1000;
        setTimeout(() => {
          setRetryCount((prev) => prev + 1);
          void checkBanStatus();
        }, backoffDelay);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.username, isUserBanned, retryCount, banInfo]);

  useEffect(() => {
    void checkBanStatus();

    const interval = setInterval(() => {
      void checkBanStatus();
    }, 30000);

    const handleBanExpired = (event: Event) => {
      const custom = event as CustomEvent;
      if ((custom.detail as any)?.username === user?.username) {
        void checkBanStatus();
      }
    };

    window.addEventListener('banExpired', handleBanExpired);
    return () => {
      clearInterval(interval);
      window.removeEventListener('banExpired', handleBanExpired);
    };
  }, [checkBanStatus, user?.username]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter((file) => {
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} is not an image file`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} is too large (max 5MB)`);
        return false;
      }
      return true;
    });

    const newFiles = [...appealFiles, ...validFiles].slice(0, 3);
    setAppealFiles(newFiles);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setAppealFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitAppeal = async () => {
    if (!user) {
      setAppealError('User not found');
      return;
    }

    const trimmedAppeal = appealText.trim();

    if (!trimmedAppeal) {
      setAppealError('Please enter an appeal message');
      return;
    }
    if (trimmedAppeal.length < 10) {
      setAppealError('Appeal message must be at least 10 characters long');
      return;
    }
    if (trimmedAppeal.length > 1000) {
      setAppealError('Appeal message must be less than 1000 characters');
      return;
    }

    setIsSubmittingAppeal(true);
    setAppealError('');

    try {
      const success = await submitAppeal(user.username, trimmedAppeal, appealFiles);

      if (success) {
        setAppealSubmitted(true);
        setShowAppealForm(false);
        setAppealText('');
        setAppealFiles([]);

        const updatedBan = getBanInfo(user.username);
        setBanInfo(updatedBan);

        setTimeout(() => {
          alert('Appeal submitted successfully! You will be notified of the decision.');
        }, 500);
      } else {
        setAppealError('Failed to submit appeal. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting appeal:', error);
      setAppealError('An error occurred while submitting your appeal. Please try again.');
    } finally {
      setIsSubmittingAppeal(false);
    }
  };

  const formatRemainingTime = (ban: any) => {
    if (ban.banType === 'permanent') {
      return 'This is a permanent ban';
    }

    if (!ban.remainingHours || ban.remainingHours <= 0) {
      return 'Ban has expired - refreshing page...';
    }

    const hours = ban.remainingHours;

    if (hours < 1) {
      const minutes = Math.ceil(hours * 60);
      return `${minutes} minute${minutes !== 1 ? 's' : ''} remaining`;
    } else if (hours < 24) {
      const wholeHours = Math.floor(hours);
      const minutes = Math.ceil((hours - wholeHours) * 60);
      return `${wholeHours} hour${wholeHours !== 1 ? 's' : ''}${
        minutes > 0 ? ` and ${minutes} minute${minutes !== 1 ? 's' : ''}` : ''
      } remaining`;
    } else {
      const days = Math.floor(hours / 24);
      const remainingHours = Math.floor(hours % 24);
      return `${days} day${days !== 1 ? 's' : ''}${
        remainingHours > 0 ? ` and ${remainingHours} hour${remainingHours !== 1 ? 's' : ''}` : ''
      } remaining`;
    }
  };

  const getBanReasonDisplay = (reason: string, customReason?: string) => {
    const reasonMap: Record<string, { title: string; description: string }> = {
      harassment: { title: 'Harassment', description: 'Engaging in abusive or threatening behavior toward other users' },
      spam: { title: 'Spam', description: 'Posting repetitive, unwanted, or promotional content' },
      inappropriate_content: { title: 'Inappropriate Content', description: 'Sharing content that violates platform guidelines' },
      scam: { title: 'Scam/Fraud', description: 'Attempting to defraud or scam other users' },
      underage: { title: 'Underage Violation', description: 'Platform restricted to users 21 and older' },
      payment_fraud: { title: 'Payment Fraud', description: 'Fraudulent payment activity or chargebacks' },
      other: { title: 'Other', description: 'Other violations of platform terms of service' },
    };

    const reasonInfo = reasonMap[reason] || { title: reason, description: '' };
    const displayReason = customReason ? `${reasonInfo.title}: ${sanitizeStrict(customReason)}` : reasonInfo.title;

    return { display: displayReason, description: reasonInfo.description };
  };

  const getEscalationDisplay = (level?: number) => {
    if (!level) return null;

    const escalationMap: Record<number, { title: string; color: string; description: string }> = {
      1: { title: 'Level 1', color: 'text-yellow-400', description: 'First offense' },
      2: { title: 'Level 2', color: 'text-orange-400', description: 'Multiple violations' },
      3: { title: 'Level 3', color: 'text-red-400', description: 'Serious violations' },
      4: { title: 'Level 4', color: 'text-purple-400', description: 'Severe violations' },
      5: { title: 'Level 5', color: 'text-red-600', description: 'Final warning level' },
    };

    return escalationMap[level] || null;
  };

  if (!children) {
    console.warn('BanCheck: children prop is undefined');
    return null;
  }

  if (!banInfo) {
    return <>{children}</>;
  }

  const reasonInfo = getBanReasonDisplay(banInfo.reason, banInfo.customReason);
  const escalationInfo = getEscalationDisplay(banInfo.escalationLevel);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-[#1a1a1a] border-2 border-red-800 rounded-xl p-8 shadow-2xl">
        {/* Connection Error Banner */}
        {connectionError && (
          <div className="mb-6 p-4 bg-yellow-900/20 border border-yellow-800 rounded-lg flex items-center gap-3">
            <AlertTriangle size={20} className="text-yellow-400" />
            <div>
              <p className="text-yellow-400 font-medium">Connection Issue</p>
              <p className="text-gray-300 text-sm">Unable to verify ban status. Retrying automatically...</p>
            </div>
          </div>
        )}

        {/* Ban Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            {banInfo.banType === 'permanent' ? (
              <InfinityIcon size={40} className="text-red-400" />
            ) : (
              <BanIcon size={40} className="text-red-400" />
            )}
          </div>
          <h1 className="text-3xl font-bold text-red-400 mb-2">
            Account {banInfo.banType === 'permanent' ? 'Permanently' : 'Temporarily'} Suspended
          </h1>
          <p className="text-gray-400">Your access to PantyPost has been restricted</p>
          {escalationInfo && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-gray-900/50 rounded-full">
              <Shield size={16} className={escalationInfo.color} />
              <span className={`text-sm font-medium ${escalationInfo.color}`}>
                {escalationInfo.title} - {escalationInfo.description}
              </span>
            </div>
          )}
        </div>

        {/* Ban Details */}
        <div className="bg-[#222] rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Info size={20} />
            Suspension Details
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-gray-400 mb-1">
                    <AlertTriangle size={16} />
                    <span className="font-medium">Violation</span>
                  </div>
                  <div className="text-white">
                    <p className="font-medium">{reasonInfo.display}</p>
                    {reasonInfo.description && <p className="text-sm text-gray-400 mt-1">{reasonInfo.description}</p>}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-gray-400 mb-1">
                    <Clock size={16} />
                    <span className="font-medium">Duration</span>
                  </div>
                  <div className="text-white">
                    <p className="font-medium">{formatRemainingTime(banInfo)}</p>
                    {banInfo.banType === 'temporary' && (
                      <div className="mt-2 bg-red-900/20 rounded-full h-2">
                        <div
                          className="bg-red-500 h-2 rounded-full transition-all duration-1000"
                          style={{
                            width: `${Math.max(
                              0,
                              Math.min(100, ((banInfo.remainingHours || 0) / ((parseInt(banInfo.notes) || 24))) * 100)
                            )}%`,
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-gray-400 mb-1">
                    <Calendar size={16} />
                    <span className="font-medium">Suspended On</span>
                  </div>
                  <p className="text-white">{new Date(banInfo.startTime).toLocaleString()}</p>
                </div>

                {banInfo.endTime && (
                  <div>
                    <div className="flex items-center gap-2 text-gray-400 mb-1">
                      <Calendar size={16} />
                      <span className="font-medium">Suspension Ends</span>
                    </div>
                    <p className="text-white">{new Date(banInfo.endTime).toLocaleString()}</p>
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2 text-gray-400 mb-1">
                    <Shield size={16} />
                    <span className="font-medium">Moderator</span>
                  </div>
                  <p className="text-white">
                    <SecureMessageDisplay content={banInfo.bannedBy} allowBasicFormatting={false} as="span" />
                  </p>
                </div>
              </div>
            </div>
          </div>

          {banInfo.notes && (
            <div className="mt-6 pt-4 border-t border-gray-700">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <FileText size={16} />
                <span className="font-medium">Additional Information</span>
              </div>
              <div className="bg-[#1a1a1a] rounded-lg p-3">
                <SecureMessageDisplay content={banInfo.notes} allowBasicFormatting={false} className="text-gray-300 text-sm" />
              </div>
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
            <div className="text-center mb-4">
              <p className="text-gray-300 text-sm mb-2">
                If you believe this suspension was issued in error, you can submit an appeal for review.
              </p>
              <p className="text-gray-400 text-xs">Appeals are reviewed by our moderation team within 24-48 hours.</p>
            </div>

            {!showAppealForm ? (
              <div className="text-center">
                <button
                  onClick={() => {
                    setShowAppealForm(true);
                    setAppealError('');
                  }}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Start Appeal Process
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-blue-400 mb-2">Explain why this suspension should be lifted *</label>
                  <SecureTextarea
                    value={appealText}
                    onChange={setAppealText}
                    onBlur={() => setAppealError('')}
                    placeholder="Please provide a detailed explanation of why you believe this suspension was issued in error, or describe any circumstances that should be considered..."
                    rows={5}
                    maxLength={1000}
                    characterCount={true}
                    error={appealError}
                    touched={!!appealError}
                    className="w-full"
                  />
                </div>

                {/* Evidence Upload */}
                <div>
                  <label className="block text-sm font-medium text-blue-400 mb-2">Supporting Evidence (Optional)</label>
                  <div className="border-2 border-dashed border-gray-700 rounded-lg p-4">
                    <div className="text-center">
                      <Upload size={32} className="mx-auto text-gray-500 mb-2" />
                      <p className="text-sm text-gray-400 mb-2">Upload screenshots or images that support your appeal</p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors text-sm"
                      >
                        Choose Files
                      </button>
                      <p className="text-xs text-gray-500 mt-2">Max 3 files, 5MB each. Images only.</p>
                      <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleFileSelect} className="hidden" />
                    </div>
                  </div>

                  {/* Selected Files */}
                  {appealFiles.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-sm font-medium text-gray-300">Selected Evidence:</p>
                      {appealFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-[#222] p-2 rounded">
                          <div className="flex items-center gap-2">
                            <ImageIcon size={16} className="text-blue-400" />
                            <span className="text-sm text-gray-300">{file.name}</span>
                            <span className="text-xs text-gray-500">({(file.size / 1024 / 1024).toFixed(1)}MB)</span>
                          </div>
                          <button onClick={() => removeFile(index)} className="text-red-400 hover:text-red-3 00 transition-colors">
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowAppealForm(false);
                      setAppealText('');
                      setAppealFiles([]);
                      setAppealError('');
                    }}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                    disabled={isSubmittingAppeal}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitAppeal}
                    disabled={!appealText.trim() || appealText.length < 10 || isSubmittingAppeal}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {isSubmittingAppeal ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        Submit Appeal
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Appeal Status */}
        {(banInfo.appealSubmitted || appealSubmitted) && (
          <div className="bg-orange-900/10 border border-orange-800 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-orange-400 mb-3 flex items-center gap-2">
              <MessageSquare size={20} />
              Appeal Status: {banInfo.appealStatus || 'Pending'}
            </h3>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-orange-400 rounded-full"></div>
                <span className="text-gray-300 text-sm">Your appeal has been submitted and is being reviewed by our moderation team.</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
                <span className="text-gray-400 text-sm">You will be notified of the decision via email and platform notification.</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
                <span className="text-gray-400 text-sm">Appeals are typically reviewed within 24-48 hours.</span>
              </div>
            </div>

            {banInfo.appealText && (
              <div className="mt-4 p-3 bg-[#222] rounded border-l-4 border-orange-400">
                <div className="text-sm text-orange-400 mb-1">Your appeal message:</div>
                <SecureMessageDisplay content={banInfo.appealText} allowBasicFormatting={false} className="text-sm text-gray-300" />
                {banInfo.appealDate && <div className="text-xs text-gray-500 mt-2">Submitted: {new Date(banInfo.appealDate).toLocaleString()}</div>}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
          <button
            onClick={() => {
              logout();
              window.location.href = '/';
            }}
            className="px-6 py-3 bg-[#333] text-white rounded-lg hover:bg-[#444] transition-colors font-medium"
          >
            Sign Out
          </button>

          <button
            onClick={() => {
              setRetryCount(0);
              void checkBanStatus();
            }}
            className="px-6 py-3 bg-[#ff950e] text-black rounded-lg hover:bg-[#e88800] transition-colors font-medium flex items-center gap-2"
            disabled={connectionError && retryCount >= maxRetries}
          >
            <RefreshCw size={16} className={connectionError ? 'animate-spin' : ''} />
            {connectionError ? 'Retrying...' : 'Refresh Status'}
          </button>
        </div>

        {/* Contact Info */}
        <div className="text-center pt-6 border-top border-gray-700">
          <div className="text-sm text-gray-400 mb-2">
            <p className="mb-2">For urgent matters or technical issues, you can contact our support team.</p>
            <div>
              Please reference your username:{' '}
              <strong className="text-white">
                <SecureMessageDisplay content={user?.username || ''} allowBasicFormatting={false} as="span" />
              </strong>
            </div>
          </div>

          {lastCheckTime > 0 && <div className="text-xs text-gray-500 mt-3">Last status check: {new Date(lastCheckTime).toLocaleTimeString()}</div>}
        </div>

        {/* Platform Guidelines Link */}
        <div className="mt-6 text-center">
          <button
            onClick={() => window.open('/terms', '_blank')}
            className="text-blue-400 hover:text-blue-300 text-sm underline flex items-center gap-1 mx-auto transition-colors"
          >
            <ExternalLink size={14} />
            Review Platform Guidelines
          </button>
        </div>
      </div>
    </div>
  );
};

export default BanCheck;
