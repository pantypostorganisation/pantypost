// src/app/admin/verification-requests/page.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useListings, VerificationStatus } from '@/context/ListingContext';
import RequireAuth from '@/components/RequireAuth';
import { 
  CheckCircle, XCircle, ArrowLeft, ExternalLink, 
  X, Eye, AlertCircle, Upload, Search, Shield, 
  UserCheck, Clock, Calendar, ChevronRight 
} from 'lucide-react';

// Define proper types for our data structures
interface VerificationDocs {
  code?: string;
  codePhoto?: string;
  idFront?: string;
  idBack?: string;
  passport?: string;
}

interface User {
  username: string;
  verificationStatus: VerificationStatus;
  verificationRequestedAt?: string;
  verificationDocs?: VerificationDocs;
}

interface ImageViewData {
  type: string;
  url: string;
}

export default function AdminVerificationRequestsPage() {
  const { user } = useAuth();
  const { users, setVerificationStatus } = useListings();
  const [pending, setPending] = useState<User[]>([]);
  const [selected, setSelected] = useState<User | null>(null);
  const [currentImageView, setCurrentImageView] = useState<ImageViewData | null>(null);
  const [showRejectInput, setShowRejectInput] = useState<boolean>(false);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'alphabetical'>('newest');
  const [isImageLoading, setIsImageLoading] = useState<boolean>(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Get pending verification requests
  useEffect(() => {
    const pendingUsers = Object.values(users).filter(
      (u) => u.verificationStatus === 'pending'
    ) as User[];
    
    // Sort users based on selected sort method
    const sortedUsers = [...pendingUsers].sort((a: User, b: User) => {
      if (sortBy === 'newest') {
        return new Date(b.verificationRequestedAt || '0').getTime() - 
               new Date(a.verificationRequestedAt || '0').getTime();
      } else if (sortBy === 'oldest') {
        return new Date(a.verificationRequestedAt || '0').getTime() - 
               new Date(b.verificationRequestedAt || '0').getTime();
      } else if (sortBy === 'alphabetical') {
        return a.username.localeCompare(b.username);
      }
      return 0;
    });
    
    setPending(sortedUsers);
    setSelected(null);
  }, [users, sortBy]);

  // Filter users based on search term
  const filteredUsers = pending.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate time since request
  const getTimeAgo = (timestamp?: string): string => {
    if (!timestamp) return 'Unknown date';
    
    const requestDate = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - requestDate.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    
    return requestDate.toLocaleDateString('en-US', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  // Handle approval
  const handleApprove = (username: string): void => {
    setVerificationStatus(username, 'verified');
    setSelected(null);
  };

  // Handle rejection
  const handleReject = (username: string, reason: string): void => {
    setVerificationStatus(username, 'rejected', reason);
    setSelected(null);
    setShowRejectInput(false);
    setRejectReason('');
  };

  // Handler for full image view
  const openFullImage = (type: string, url: string): void => {
    setIsImageLoading(true);
    setCurrentImageView({ type, url });
  };

  const closeFullImage = (): void => {
    setCurrentImageView(null);
  };

  // Handle image load completion
  const handleImageLoad = (): void => {
    setIsImageLoading(false);
  };

  return (
    <RequireAuth role="admin">
      <div className="min-h-screen bg-gradient-to-b from-black to-[#0a0a0a] text-white">
        {/* Header with subtle gradient border */}
        <header className="sticky top-0 z-30 bg-black bg-opacity-90 backdrop-blur-sm border-b border-[#2a2a2a] shadow-md">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center">
              <Shield className="w-6 h-6 text-[#ff950e] mr-3" />
              <h1 className="text-xl font-bold text-white">Verification Center</h1>
            </div>
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
              <input
                type="text"
                placeholder="Search username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#121212] border border-[#2a2a2a] text-white rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#ff950e] focus:border-[#ff950e] transition-all"
              />
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 md:px-6 py-6">
          {/* Control panel */}
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-[#ff950e] flex items-center">
                <UserCheck className="mr-2 h-6 w-6" />
                Pending Verifications
                <span className="ml-3 text-sm bg-[#1f1f1f] text-gray-300 rounded-full px-3 py-1 font-normal">
                  {filteredUsers.length} {filteredUsers.length === 1 ? 'request' : 'requests'}
                </span>
              </h2>
              <p className="text-gray-400 text-sm mt-1">
                Review and validate seller identity documents
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-gray-400 text-sm">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'alphabetical')}
                className="bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#ff950e] cursor-pointer"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="alphabetical">Alphabetical</option>
              </select>
            </div>
          </div>

          {/* Requests list */}
          <div className="space-y-4">
            {filteredUsers.length === 0 ? (
              <div className="bg-[#0e0e0e] border border-[#222] rounded-xl p-8 text-center">
                {searchTerm ? (
                  <div className="flex flex-col items-center">
                    <AlertCircle className="h-10 w-10 text-gray-500 mb-2" />
                    <p className="text-gray-400">No verification requests found for "{searchTerm}"</p>
                    <button 
                      onClick={() => setSearchTerm('')}
                      className="mt-3 text-[#ff950e] hover:text-[#ffb04e] text-sm"
                    >
                      Clear search
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Upload className="h-10 w-10 text-gray-500 mb-2" />
                    <p className="text-gray-400">No pending verification requests</p>
                  </div>
                )}
              </div>
            ) : (
              <>
                {filteredUsers.map((user, index) => (
                  <div
                    key={user.username}
                    className="bg-gradient-to-r from-[#0e0e0e] to-[#121212] border border-[#222] hover:border-[#333] rounded-xl shadow-lg overflow-hidden group transition-all duration-300"
                  >
                    <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative">
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                          <span className="text-lg font-semibold text-white group-hover:text-[#ff950e] transition-colors">
                            {user.username}
                          </span>
                          <div className="flex items-center">
                            <span className="bg-[#ff950e] bg-opacity-20 text-black text-xs px-2 py-1 rounded-full font-medium flex items-center justify-center">
                              <Clock className="h-3 w-3 mr-1 text-black" />
                              Pending
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center text-sm text-gray-400">
                          <Calendar className="h-4 w-4 mr-1.5 text-gray-500" />
                          <span>
                            Requested {getTimeAgo(user.verificationRequestedAt)}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelected(user)}
                        className="sm:w-auto px-4 py-2 bg-[#1a1a1a] hover:bg-[#252525] border border-[#333] text-white font-medium rounded-lg transition-all duration-300 flex items-center justify-center gap-2 group-hover:bg-[#ff950e] group-hover:text-black group-hover:border-transparent"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Review</span>
                        <ChevronRight className="w-4 h-4 opacity-0 -ml-1 group-hover:opacity-100 group-hover:ml-1 transition-all" />
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Fullscreen Image Viewer Modal */}
          {currentImageView && (
            <div
              className="fixed inset-0 bg-black bg-opacity-95 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
              onClick={closeFullImage}
            >
              <div
                className="relative max-w-6xl w-full h-full flex flex-col items-center justify-center"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="relative w-full h-full flex flex-col">
                  {/* Header */}
                  <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black to-transparent px-6 py-4 flex items-center justify-between">
                    <h3 className="text-white font-medium">{currentImageView.type}</h3>
                    <button
                      onClick={closeFullImage}
                      className="p-2 rounded-full bg-black bg-opacity-40 hover:bg-opacity-70 text-white transition-all"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Loading indicator */}
                  {isImageLoading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-10 h-10 border-2 border-[#ff950e] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}

                  {/* Image container */}
                  <div className="flex-1 flex items-center justify-center overflow-auto p-8 pt-16">
                    <img
                      src={currentImageView.url}
                      alt={currentImageView.type}
                      className="max-w-full max-h-full object-contain select-none"
                      onLoad={handleImageLoad}
                      style={{ opacity: isImageLoading ? 0.2 : 1, transition: 'opacity 0.3s' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Review Modal */}
          {selected && (
            <div
              className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4"
            >
              <div
                ref={modalRef}
                className="bg-[#0e0e0e] rounded-none sm:rounded-xl shadow-2xl border border-[#2a2a2a] w-full sm:max-w-5xl h-full sm:h-auto sm:max-h-[90vh] mx-auto flex flex-col overflow-hidden"
              >
                {/* Modal Header */}
                <div className="bg-[#080808] border-b border-[#1a1a1a] p-3 sm:p-4 flex items-center sticky top-0 z-10">
                  <button
                    onClick={() => {
                      setSelected(null);
                      setShowRejectInput(false);
                      setRejectReason('');
                    }}
                    className="p-2 rounded-full hover:bg-[#1a1a1a] text-gray-400 mr-2 transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center">
                      <span className="mr-1.5">Review:</span>
                      <span className="text-[#ff950e]">{selected.username}</span>
                    </h2>
                    <p className="text-xs text-gray-400">
                      Requested {getTimeAgo(selected.verificationRequestedAt)}
                    </p>
                  </div>
                </div>

                {/* Scrollable Content Area */}
                <div className="p-4 sm:p-6 overflow-y-auto flex-1 custom-scrollbar">
                  {/* Verification Code */}
                  <div className="mb-6">
                    <h3 className="text-sm uppercase text-gray-400 font-medium mb-2 tracking-wider">Verification Code</h3>
                    <div className="inline-block px-4 py-1.5 bg-[#ff950e] bg-opacity-10 text-black font-mono text-lg border border-[#ff950e] border-opacity-20 rounded-full">
                      {selected.verificationDocs?.code || 'No code provided'}
                    </div>
                  </div>

                  {/* Document grid with improved layout and hover effects */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <DocumentCard
                      title="Photo with Code"
                      imageSrc={selected.verificationDocs?.codePhoto}
                      onViewFull={() => openFullImage('Photo with Verification Code', selected.verificationDocs?.codePhoto || '')}
                    />
                    
                    <DocumentCard
                      title="ID Front"
                      imageSrc={selected.verificationDocs?.idFront}
                      onViewFull={() => openFullImage('ID Front', selected.verificationDocs?.idFront || '')}
                    />
                    
                    <DocumentCard
                      title="ID Back"
                      imageSrc={selected.verificationDocs?.idBack}
                      onViewFull={() => openFullImage('ID Back', selected.verificationDocs?.idBack || '')}
                    />
                    
                    <DocumentCard
                      title="Passport"
                      imageSrc={selected.verificationDocs?.passport}
                      onViewFull={() => openFullImage('Passport', selected.verificationDocs?.passport || '')}
                    />
                  </div>
                </div>

                {/* Fixed Action Buttons at Bottom */}
                <div className="bg-[#080808] border-t border-[#1a1a1a] p-3 sm:p-4 mt-auto sticky bottom-0">
                  {!showRejectInput ? (
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleApprove(selected.username)}
                        className="flex-1 px-3 py-2 sm:py-2.5 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-green-900/30"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => setShowRejectInput(true)}
                        className="flex-1 px-3 py-2 sm:py-2.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-red-900/30"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <textarea
                        className="w-full p-3 border border-[#2a2a2a] rounded-lg bg-[#121212] text-white resize-none focus:ring-2 focus:ring-[#ff950e] focus:border-transparent focus:outline-none transition-all text-sm"
                        placeholder="Provide a reason for rejection..."
                        value={rejectReason}
                        onChange={e => setRejectReason(e.target.value)}
                        rows={2}
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          className="flex-1 bg-red-600 hover:bg-red-500 text-white font-medium px-3 py-2.5 rounded-lg transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                          onClick={() => handleReject(selected.username, rejectReason)}
                          disabled={!rejectReason.trim()}
                        >
                          <span>Confirm Rejection</span>
                        </button>
                        <button
                          className="px-3 py-2.5 bg-[#1a1a1a] hover:bg-[#252525] text-white font-medium rounded-lg transition-colors border border-[#333]"
                          onClick={() => {
                            setShowRejectInput(false);
                            setRejectReason('');
                          }}
                        >
                          <span>Cancel</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </RequireAuth>
  );
}

// Document Card Component
interface DocumentCardProps {
  title: string;
  imageSrc?: string;
  onViewFull: () => void;
}

const DocumentCard: React.FC<DocumentCardProps> = ({ title, imageSrc, onViewFull }) => {
  const [isHovered, setIsHovered] = useState<boolean>(false);
  
  return (
    <div className="space-y-2">
      <h3 className="text-sm uppercase text-gray-400 font-medium tracking-wider flex items-center">
        {title}
      </h3>
      
      {imageSrc ? (
        <div 
          className="relative border border-[#222] rounded-lg overflow-hidden h-[200px] sm:h-[250px] bg-[#0a0a0a] transition-all duration-300"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="w-full h-full overflow-hidden flex items-center justify-center">
            <img
              src={imageSrc}
              alt={title}
              className="w-full h-full object-contain transition-transform duration-500"
              style={{ 
                transform: isHovered ? 'scale(1.05)' : 'scale(1)' 
              }}
            />
          </div>
          
          {/* Gradient overlay on hover */}
          <div 
            className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-0 transition-opacity duration-300 flex items-end justify-center p-4"
            style={{ opacity: isHovered ? 0.8 : 0 }}
          >
            <button 
              onClick={onViewFull}
              className="bg-[#ff950e] text-black font-medium py-1.5 px-3 rounded-lg transition-all transform hover:bg-[#ffaa2c] flex items-center gap-1.5"
            >
              <ExternalLink className="w-4 h-4" />
              <span>View Full</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="h-[200px] sm:h-[250px] bg-[#0a0a0a] border border-[#222] rounded-lg flex items-center justify-center">
          <span className="text-gray-500 text-sm">Not provided</span>
        </div>
      )}
    </div>
  );
};
