'use client';

import { useState, useEffect, useRef } from 'react';
import { useListings, VerificationDocs } from '@/context/ListingContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  Shield, 
  Camera, 
  Upload, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  ExternalLink,
  BadgeCheck,
  CalendarClock,
  RefreshCw,
  DollarSign,
  HelpCircle,
  InfoIcon
} from 'lucide-react';

export default function SellerVerifyPage() {
  const { user, requestVerification, users } = useListings();
  const router = useRouter();

  const [code, setCode] = useState('');
  const [codePhoto, setCodePhoto] = useState<string | null>(null);
  const [idFront, setIdFront] = useState<string | null>(null);
  const [idBack, setIdBack] = useState<string | null>(null);
  const [passport, setPassport] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [currentImage, setCurrentImage] = useState<{type: string, url: string} | null>(null);

  // Refs for file inputs
  const codePhotoInputRef = useRef<HTMLInputElement>(null);
  const idFrontInputRef = useRef<HTMLInputElement>(null);
  const idBackInputRef = useRef<HTMLInputElement>(null);
  const passportInputRef = useRef<HTMLInputElement>(null);

  // Generate or load unique code for this seller
  useEffect(() => {
    if (!user) return;
    
    // If user is rejected, always generate a new code
    if (user.verificationStatus === 'rejected') {
      const newCode = `VERIF-${user.username}-${Math.floor(10000000 + Math.random() * 90000000)}`;
      setCode(newCode);
    } else {
      // For non-rejected users, check for existing code
      const existing = users[user.username]?.verificationDocs?.code;
      if (existing) {
        setCode(existing);
      } else {
        // Generate new 8-digit code (increased from 6 digits)
        const newCode = `VERIF-${user.username}-${Math.floor(10000000 + Math.random() * 90000000)}`;
        setCode(newCode);
      }
    }
    
    // Load existing documents if available
    if (users[user.username]?.verificationDocs) {
      const docs = users[user.username].verificationDocs;
      if (docs?.codePhoto) setCodePhoto(docs.codePhoto);
      if (docs?.idFront) setIdFront(docs.idFront);
      if (docs?.idBack) setIdBack(docs.idBack);
      if (docs?.passport) setPassport(docs.passport);
    }
  }, [user, users]);

  // Helper to convert file to base64
  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await toBase64(file);
        setter(base64);
      } catch (error) {
        console.error("Error converting file:", error);
        alert("Failed to process image. Please try again with a smaller file.");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codePhoto || (!idFront && !passport)) {
      alert('Please upload all required documents.');
      return;
    }
    setSubmitting(true);

    const docs: VerificationDocs = {
      code,
      codePhoto,
      idFront: idFront || undefined,
      idBack: idBack || undefined,
      passport: passport || undefined,
    };

    requestVerification(docs);
    setSubmitting(false);
    setSubmitted(true);
    setTimeout(() => router.push('/sellers/profile'), 2000);
  };

  // Function to view an image fullscreen
  const viewImage = (type: string, url: string | null) => {
    if (!url) return;
    setCurrentImage({ type, url });
  };

  // Calculate time since verification request
  const getTimeAgo = (timestamp?: string): string => {
    if (!timestamp) return 'Unknown date';
    
    const requestDate = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - requestDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    if (diffMinutes > 0) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    
    return 'just now';
  };

  // Reusable Image Viewer Modal component
  const ImageViewerModal = () => {
    if (!currentImage) return null;
    
    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
        onClick={() => setCurrentImage(null)}
      >
        <div 
          className="max-w-3xl max-h-[90vh] relative"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="absolute top-2 right-2 z-10">
            <button 
              onClick={() => setCurrentImage(null)}
              className="bg-black bg-opacity-50 text-white p-2 rounded-full"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
          <div className="absolute top-2 left-2 z-10 bg-black bg-opacity-50 px-3 py-1 rounded-lg">
            <span className="text-sm text-white">{currentImage.type}</span>
          </div>
          <img 
            src={currentImage.url} 
            alt={currentImage.type} 
            className="max-h-[90vh] max-w-full object-contain"
          />
        </div>
      </div>
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white py-10 px-4 sm:px-6 flex items-center justify-center">
        <div className="bg-[#121212] rounded-xl shadow-xl p-8 max-w-md w-full border border-gray-800">
          <Shield className="w-12 h-12 text-[#ff950e] mb-4" />
          <h1 className="text-2xl font-bold mb-4">Seller Verification</h1>
          <p className="text-gray-400">You must be logged in as a seller to access this page.</p>
          <button
            onClick={() => router.push('/login')}
            className="mt-6 px-4 py-2 bg-[#ff950e] text-black font-bold rounded-lg hover:bg-[#e88800] transition w-full"
          >
            Log In
          </button>
        </div>
      </div>
    );
  }

  // VERIFIED STATE
  if (user.verificationStatus === 'verified') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black to-[#0a0a0a] text-white py-10 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-[#121212] rounded-xl shadow-xl overflow-hidden border border-green-800">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-green-900 to-green-800 px-6 py-5 flex items-center">
              <Shield className="w-8 h-8 text-green-400 mr-3" />
              <h1 className="text-2xl font-bold">Verification Status</h1>
            </div>
            
            <div className="p-6 sm:p-8">
              <div className="flex flex-col items-center justify-center text-center mb-8">
                {/* Display the verification badge image */}
                <div className="relative w-32 h-32 mb-6">
                  <img 
                    src="/verification_badge.png" 
                    alt="Verified Seller Badge" 
                    className="w-full h-full object-contain"
                  />
                </div>
                
                <h2 className="text-2xl font-bold text-white mb-2">Verified Seller</h2>
                <p className="text-green-400 font-medium">Your account has been verified!</p>
                
                <div className="mt-8 border-t border-gray-800 pt-6 w-full">
                  <div className="flex justify-between items-center text-sm text-gray-400 mb-3">
                    <span>Verification Status:</span>
                    <span className="px-3 py-1 bg-green-900 text-green-400 rounded-full text-xs font-medium">
                      Verified
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm text-gray-400 mb-3">
                    <span>Verification Code:</span>
                    <span className="font-mono bg-black px-2 py-1 rounded text-green-500">{code}</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm text-gray-400">
                    <span>Verified Since:</span>
                    <span>
                      {user.verificationRequestedAt 
                        ? new Date(user.verificationRequestedAt).toLocaleDateString() 
                        : 'Recently'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="rounded-lg bg-green-900 bg-opacity-20 border border-green-800 p-4 mt-4">
                <h3 className="font-medium text-green-400 flex items-center mb-2">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Seller Benefits
                </h3>
                <ul className="text-sm text-gray-300 space-y-2">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">•</span>
                    Post up to 25 listings (unverified sellers can only post 2)
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">•</span>
                    <div className="flex items-center">
                      Verified badge <img src="/verification_badge.png" alt="Badge" className="w-4 h-4 mx-1" /> on your profile and listings
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">•</span>
                    Higher trustworthiness leading to more sales
                  </li>
                </ul>
              </div>
              
              <div className="mt-8 flex gap-3">
                <button
                  onClick={() => router.push('/sellers/my-listings')}
                  className="flex-1 px-4 py-3 bg-[#ff950e] text-black font-bold rounded-lg hover:bg-[#e88800] transition text-center"
                >
                  Manage My Listings
                </button>
                <button
                  onClick={() => router.push('/sellers/profile')}
                  className="flex-1 px-4 py-3 bg-[#1a1a1a] text-white border border-gray-700 rounded-lg hover:bg-[#222] transition text-center"
                >
                  Back to Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // PENDING STATE
  if (user.verificationStatus === 'pending') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black to-[#0a0a0a] text-white py-10 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-[#121212] rounded-xl shadow-xl overflow-hidden border border-yellow-800">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-yellow-900 to-yellow-800 px-6 py-5 flex items-center">
              <Shield className="w-8 h-8 text-yellow-400 mr-3" />
              <h1 className="text-2xl font-bold">Verification Status</h1>
            </div>
            
            <div className="p-6 sm:p-8">
              <div className="flex flex-col items-center justify-center text-center mb-8">
                <div className="w-20 h-20 bg-yellow-900 bg-opacity-30 rounded-full flex items-center justify-center mb-4">
                  <Clock className="w-10 h-10 text-yellow-500" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Verification Pending</h2>
                <p className="text-yellow-400 font-medium">Your verification is being reviewed by our team</p>
                <p className="text-sm text-gray-400 mt-2">
                  Requested {user.verificationRequestedAt ? getTimeAgo(user.verificationRequestedAt) : 'recently'}
                </p>
                
                <div className="mt-8 border-t border-gray-800 pt-6 w-full">
                  <div className="flex justify-between items-center text-sm text-gray-400 mb-3">
                    <span>Verification Status:</span>
                    <span className="px-3 py-1 bg-yellow-900 text-yellow-400 rounded-full text-xs font-medium">
                      Pending Review
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm text-gray-400 mb-3">
                    <span>Verification Code:</span>
                    <span className="font-mono bg-black px-2 py-1 rounded text-yellow-500">{code}</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm text-gray-400">
                    <span>Estimated Time:</span>
                    <span>24-48 hours</span>
                  </div>
                </div>
              </div>
              
              {/* Document Preview */}
              <div className="border-t border-gray-800 pt-4 mt-4">
                <h3 className="font-medium text-gray-300 mb-4 flex items-center">
                  <CalendarClock className="w-4 h-4 mr-2 text-yellow-500" />
                  Submitted Documents
                </h3>
                
                <div className="grid grid-cols-2 gap-3">
                  {codePhoto && (
                    <div 
                      className="relative border border-gray-800 rounded-lg overflow-hidden h-40 cursor-pointer" 
                      onClick={() => viewImage("Photo with Verification Code", codePhoto)}
                    >
                      <div className="absolute inset-0 bg-black bg-opacity-30 hover:bg-opacity-0 transition flex items-center justify-center">
                        <ExternalLink className="w-6 h-6 text-white opacity-70" />
                      </div>
                      <img src={codePhoto} alt="Verification Code" className="h-full w-full object-cover" />
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 p-1.5 text-xs">
                        Photo with Code
                      </div>
                    </div>
                  )}
                  
                  {idFront && (
                    <div 
                      className="relative border border-gray-800 rounded-lg overflow-hidden h-40 cursor-pointer" 
                      onClick={() => viewImage("ID Front", idFront)}
                    >
                      <div className="absolute inset-0 bg-black bg-opacity-30 hover:bg-opacity-0 transition flex items-center justify-center">
                        <ExternalLink className="w-6 h-6 text-white opacity-70" />
                      </div>
                      <img src={idFront} alt="ID Front" className="h-full w-full object-cover" />
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 p-1.5 text-xs">
                        ID Front
                      </div>
                    </div>
                  )}
                  
                  {idBack && (
                    <div 
                      className="relative border border-gray-800 rounded-lg overflow-hidden h-40 cursor-pointer" 
                      onClick={() => viewImage("ID Back", idBack)}
                    >
                      <div className="absolute inset-0 bg-black bg-opacity-30 hover:bg-opacity-0 transition flex items-center justify-center">
                        <ExternalLink className="w-6 h-6 text-white opacity-70" />
                      </div>
                      <img src={idBack} alt="ID Back" className="h-full w-full object-cover" />
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 p-1.5 text-xs">
                        ID Back
                      </div>
                    </div>
                  )}
                  
                  {passport && (
                    <div 
                      className="relative border border-gray-800 rounded-lg overflow-hidden h-40 cursor-pointer" 
                      onClick={() => viewImage("Passport", passport)}
                    >
                      <div className="absolute inset-0 bg-black bg-opacity-30 hover:bg-opacity-0 transition flex items-center justify-center">
                        <ExternalLink className="w-6 h-6 text-white opacity-70" />
                      </div>
                      <img src={passport} alt="Passport" className="h-full w-full object-cover" />
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 p-1.5 text-xs">
                        Passport
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="rounded-lg bg-[#1a1a1a] border border-gray-800 p-4 mt-6">
                <h3 className="font-medium text-white flex items-center mb-2">
                  <AlertTriangle className="w-4 h-4 mr-2 text-yellow-500" />
                  What happens next?
                </h3>
                <p className="text-sm text-gray-300">
                  Our admin team will review your documents and either approve or reject your verification request. You'll receive a notification once the review is complete.
                </p>
              </div>
              
              <div className="mt-8">
                <button
                  onClick={() => router.push('/sellers/profile')}
                  className="w-full px-4 py-3 bg-[#1a1a1a] text-white border border-gray-700 rounded-lg hover:bg-[#222] transition text-center"
                >
                  Back to Profile
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Render the image viewer modal */}
        <ImageViewerModal />
      </div>
    );
  }

  // REJECTED STATE
  if (user.verificationStatus === 'rejected') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black to-[#0a0a0a] text-white py-10 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-[#121212] rounded-xl shadow-xl overflow-hidden border border-red-800">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-red-900 to-red-800 px-6 py-5 flex items-center">
              <Shield className="w-8 h-8 text-red-400 mr-3" />
              <h1 className="text-2xl font-bold">Verification Status</h1>
            </div>
            
            <div className="p-6 sm:p-8">
              <div className="flex flex-col items-center justify-center text-center mb-6">
                <div className="w-20 h-20 bg-red-900 bg-opacity-30 rounded-full flex items-center justify-center mb-4">
                  <XCircle className="w-10 h-10 text-red-500" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Verification Rejected</h2>
                <p className="text-red-400 font-medium">Your verification request was not approved</p>
              </div>
              
              {/* Rejection Reason */}
              <div className="bg-red-900 bg-opacity-20 border border-red-800 rounded-lg p-4 my-4">
                <h3 className="text-red-400 font-medium mb-2 flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Reason for Rejection
                </h3>
                <p className="text-gray-300 text-sm">
                  {user.verificationRejectionReason || "Your verification documents did not meet our requirements. Please review and submit again."}
                </p>
              </div>
              
              {/* New verification code */}
              <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 mt-6">
                <h3 className="font-medium text-gray-300 mb-2 flex items-center">
                  <RefreshCw className="w-4 h-4 mr-2 text-[#ff950e]" />
                  Your New Verification Code
                </h3>
                <div className="bg-black py-3 px-4 rounded-lg border border-gray-700 text-center mb-2">
                  <span className="font-mono text-xl text-[#ff950e] font-bold">
                    {code}
                  </span>
                </div>
                <p className="text-sm text-gray-400">
                  You must use this new code in your verification photo
                </p>
              </div>
              
              {/* Verification Instruction Image */}
              <div className="mt-6 border-t border-gray-800 pt-6">
                <div className="bg-[#1a1a1a] rounded-lg p-4 mb-6 border border-[#ff950e] border-opacity-30">
                  <h3 className="font-medium text-[#ff950e] mb-4 flex items-center">
                    <HelpCircle className="w-4 h-4 mr-2" />
                    How to Take Your Verification Photo
                  </h3>
                  
                  <div className="flex justify-center mb-3">
                    <img 
                      src="/verification_instruction.png" 
                      alt="Verification Instructions" 
                      className="w-1/2 h-auto object-contain"
                    />
                  </div>
                  
                  <p className="text-sm text-gray-300 text-center">
                    Take a clear photo with your smartphone showing your face and the verification code on a piece of paper or displayed on another device.
                  </p>
                </div>
              </div>
              
              {/* Upload Form */}
              <div className="mt-4">
                <h3 className="font-medium text-white mb-4">Upload New Documents</h3>
                
                <div className="space-y-4">
                  {/* Photo with code */}
                  <div>
                    <label className="text-sm text-gray-400 block mb-2">
                      Photo with verification code (required):
                    </label>
                    <div className="flex items-center gap-3">
                      <div
                        onClick={() => codePhotoInputRef.current?.click()}
                        className="relative border-2 border-dashed border-gray-700 hover:border-[#ff950e] rounded-lg p-4 cursor-pointer flex flex-col items-center justify-center transition"
                        style={{ height: "120px", width: "120px" }}
                      >
                        {codePhoto ? (
                          <img src={codePhoto} alt="Code preview" className="max-h-full max-w-full object-contain" />
                        ) : (
                          <>
                            <Camera className="w-8 h-8 text-gray-500 mb-2" />
                            <span className="text-xs text-gray-500">Click to upload</span>
                          </>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <p className="text-sm text-gray-300 mb-2">
                          Take a clear photo holding the code above next to your face
                        </p>
                        <p className="text-xs text-gray-500">
                          Make sure your face and the code are clearly visible
                        </p>
                      </div>
                      
                      <input
                        ref={codePhotoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, setCodePhoto)}
                        className="hidden"
                      />
                    </div>
                  </div>
                  
                  {/* ID Documents */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                    <div>
                      <label className="text-sm text-gray-400 block mb-2">
                        ID Front (driver's license/ID card):
                      </label>
                      <div
                        onClick={() => idFrontInputRef.current?.click()}
                        className="relative border-2 border-dashed border-gray-700 hover:border-[#ff950e] rounded-lg p-4 cursor-pointer flex flex-col items-center justify-center transition h-40"
                      >
                        {idFront ? (
                          <img src={idFront} alt="ID front preview" className="max-h-full max-w-full object-contain" />
                        ) : (
                          <>
                            <Upload className="w-8 h-8 text-gray-500 mb-2" />
                            <span className="text-xs text-gray-500">Click to upload</span>
                          </>
                        )}
                      </div>
                      <input
                        ref={idFrontInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, setIdFront)}
                        className="hidden"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm text-gray-400 block mb-2">
                        ID Back (if using driver's license):
                      </label>
                      <div
                        onClick={() => idBackInputRef.current?.click()}
                        className="relative border-2 border-dashed border-gray-700 hover:border-[#ff950e] rounded-lg p-4 cursor-pointer flex flex-col items-center justify-center transition h-40"
                      >
                        {idBack ? (
                          <img src={idBack} alt="ID back preview" className="max-h-full max-w-full object-contain" />
                        ) : (
                          <>
                            <Upload className="w-8 h-8 text-gray-500 mb-2" />
                            <span className="text-xs text-gray-500">Click to upload</span>
                          </>
                        )}
                      </div>
                      <input
                        ref={idBackInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, setIdBack)}
                        className="hidden"
                      />
                    </div>
                    
                    <div className="sm:col-span-2">
                      <label className="text-sm text-gray-400 block mb-2">
                        Passport (instead of driver's license):
                      </label>
                      <div
                        onClick={() => passportInputRef.current?.click()}
                        className="relative border-2 border-dashed border-gray-700 hover:border-[#ff950e] rounded-lg p-4 cursor-pointer flex flex-col items-center justify-center transition h-40"
                      >
                        {passport ? (
                          <img src={passport} alt="Passport preview" className="max-h-full max-w-full object-contain" />
                        ) : (
                          <>
                            <Upload className="w-8 h-8 text-gray-500 mb-2" />
                            <span className="text-xs text-gray-500">Click to upload</span>
                          </>
                        )}
                      </div>
                      <input
                        ref={passportInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, setPassport)}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 flex gap-3">
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || !codePhoto || (!idFront && !passport)}
                    className={`flex-1 px-4 py-3 font-bold rounded-lg text-center transition ${
                      submitting || !codePhoto || (!idFront && !passport)
                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                        : 'bg-[#ff950e] text-black hover:bg-[#e88800]'
                    }`}
                  >
                    {submitting ? 'Submitting...' : 'Submit New Verification'}
                  </button>
                  <button
                    onClick={() => router.push('/sellers/profile')}
                    className="flex-1 px-4 py-3 bg-[#1a1a1a] text-white border border-gray-700 rounded-lg hover:bg-[#222] transition text-center"
                  >
                    Back to Profile
                  </button>
                </div>
                
                {submitted && (
                  <p className="text-green-500 text-center mt-4">
                    ✅ Verification submitted successfully! Redirecting...
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Render the image viewer modal */}
        <ImageViewerModal />
      </div>
    );
  }

  // DEFAULT STATE - Unverified first time
  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-[#0a0a0a] text-white py-10 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-[#121212] rounded-xl shadow-xl overflow-hidden border border-gray-800">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-[#ff950e] to-yellow-600 px-6 py-5 flex items-center">
            <Shield className="w-8 h-8 text-black mr-3" />
            <h1 className="text-2xl font-bold text-black">Seller Verification</h1>
          </div>
          
          <div className="p-6 sm:p-8">
            {/* Introduction */}
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4">Get Verified to Unlock Benefits</h2>
              <div className="flex items-center gap-4 mb-4">
                <p className="text-gray-300 text-sm leading-relaxed flex-1">
                  Verified sellers gain more trust from buyers and can post up to 25 listings (vs just 2 for unverified sellers).
                  Complete the verification process below to get your account verified and receive your verification badge.
                </p>
                {/* Preview of the verification badge */}
                <div className="flex-shrink-0 w-20 h-20">
                  <img 
                    src="/verification_badge.png" 
                    alt="Verification Badge" 
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                <div className="bg-[#1a1a1a] p-4 rounded-lg border border-gray-800 flex flex-col items-center">
                  <img 
                    src="/verification_badge.png" 
                    alt="Verification Badge" 
                    className="w-7 h-7 object-contain mb-3"
                  />
                  <h3 className="font-medium mb-1">Verified Badge</h3>
                  <p className="text-gray-400 text-xs text-center">Display a verified badge on your profile and listings</p>
                </div>
                <div className="bg-[#1a1a1a] p-4 rounded-lg border border-gray-800 flex flex-col items-center">
                  <img 
                    src="/more_listings_icon.png" 
                    alt="More Listings" 
                    className="w-7 h-7 object-contain mb-3"
                  />
                  <h3 className="font-medium mb-1">More Listings</h3>
                  <p className="text-gray-400 text-xs text-center">Post up to 25 listings (unverified sellers can post only 2)</p>
                </div>
                <div className="bg-[#1a1a1a] p-4 rounded-lg border border-gray-800 flex flex-col items-center">
                  <img 
                    src="/more_sales_icon.png" 
                    alt="More Sales" 
                    className="w-7 h-7 object-contain mb-3"
                  />
                  <h3 className="font-medium mb-1">More Sales</h3>
                  <p className="text-gray-400 text-xs text-center">Verified sellers typically get more sales due to higher trust</p>
                </div>
              </div>
            </div>
            
            {/* Verification Code */}
            <div className="mb-8">
              <h3 className="text-lg font-medium mb-4">Verification Steps</h3>
              
              <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-[#ff950e] mb-2">1. Your Unique Verification Code</h4>
                <div className="bg-black py-3 px-4 rounded-lg border border-gray-700 text-center mb-2">
                  <span className="font-mono text-xl text-[#ff950e] font-bold">
                    {code}
                  </span>
                </div>
                <p className="text-sm text-gray-400">
                  Write this code on a piece of paper. You'll need to take a photo holding this code.
                </p>
              </div>
              
              <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-[#ff950e] mb-2">2. Required Documents</h4>
                <ul className="text-sm text-gray-300 space-y-2">
                  <li className="flex items-start">
                    <span className="text-[#ff950e] mr-2">•</span>
                    A photo of yourself holding a paper with your verification code
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#ff950e] mr-2">•</span>
                    Front of your driver's license or ID card (or passport)
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#ff950e] mr-2">•</span>
                    Back of your driver's license or ID card (if using license)
                  </li>
                </ul>
              </div>
            </div>
            
            {/* Verification Instruction Image */}
            <div className="bg-[#1a1a1a] rounded-lg p-4 mb-6 border border-[#ff950e] border-opacity-30">
              <h3 className="font-medium text-[#ff950e] mb-4 flex items-center">
                <HelpCircle className="w-4 h-4 mr-2" />
                How to Take Your Verification Photo
              </h3>
              
              <div className="flex justify-center mb-3">
                <img 
                  src="/verification_instruction.png" 
                  alt="Verification Instructions" 
                  className="w-1/2 h-auto object-contain"
                />
              </div>
              
              <p className="text-sm text-gray-300 text-center">
                Take a clear photo with your smartphone showing your face and the verification code on a piece of paper or displayed on another device.
              </p>
            </div>
            
            {/* Upload Form */}
            <div className="border-t border-gray-800 pt-6">
              <h3 className="font-medium text-white mb-4">Upload Verification Documents</h3>
              
              <div className="space-y-4">
                {/* Photo with code */}
                <div>
                  <label className="text-sm text-gray-400 block mb-2">
                    Photo with verification code (required):
                  </label>
                  <div className="flex items-center gap-3">
                    <div
                      onClick={() => codePhotoInputRef.current?.click()}
                      className="relative border-2 border-dashed border-gray-700 hover:border-[#ff950e] rounded-lg p-4 cursor-pointer flex flex-col items-center justify-center transition"
                      style={{ height: "120px", width: "120px" }}
                    >
                      {codePhoto ? (
                        <img src={codePhoto} alt="Code preview" className="max-h-full max-w-full object-contain" />
                      ) : (
                        <>
                          <Camera className="w-8 h-8 text-gray-500 mb-2" />
                          <span className="text-xs text-gray-500">Click to upload</span>
                        </>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <p className="text-sm text-gray-300 mb-2">
                        Take a clear photo holding the code above next to your face
                      </p>
                      <p className="text-xs text-gray-500">
                        Make sure your face and the code are clearly visible
                      </p>
                    </div>
                    
                    <input
                      ref={codePhotoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, setCodePhoto)}
                      className="hidden"
                    />
                  </div>
                </div>
                
                {/* ID Documents */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                  <div>
                    <label className="text-sm text-gray-400 block mb-2">
                      ID Front (driver's license/ID card):
                    </label>
                    <div
                      onClick={() => idFrontInputRef.current?.click()}
                      className="relative border-2 border-dashed border-gray-700 hover:border-[#ff950e] rounded-lg p-4 cursor-pointer flex flex-col items-center justify-center transition h-40"
                    >
                      {idFront ? (
                        <img src={idFront} alt="ID front preview" className="max-h-full max-w-full object-contain" />
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-gray-500 mb-2" />
                          <span className="text-xs text-gray-500">Click to upload</span>
                        </>
                      )}
                    </div>
                    <input
                      ref={idFrontInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, setIdFront)}
                      className="hidden"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-400 block mb-2">
                      ID Back (if using driver's license):
                    </label>
                    <div
                      onClick={() => idBackInputRef.current?.click()}
                      className="relative border-2 border-dashed border-gray-700 hover:border-[#ff950e] rounded-lg p-4 cursor-pointer flex flex-col items-center justify-center transition h-40"
                    >
                      {idBack ? (
                        <img src={idBack} alt="ID back preview" className="max-h-full max-w-full object-contain" />
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-gray-500 mb-2" />
                          <span className="text-xs text-gray-500">Click to upload</span>
                        </>
                      )}
                    </div>
                    <input
                      ref={idBackInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, setIdBack)}
                      className="hidden"
                    />
                  </div>
                  
                  <div className="sm:col-span-2">
                    <label className="text-sm text-gray-400 block mb-2">
                      Passport (instead of driver's license):
                    </label>
                    <div
                      onClick={() => passportInputRef.current?.click()}
                      className="relative border-2 border-dashed border-gray-700 hover:border-[#ff950e] rounded-lg p-4 cursor-pointer flex flex-col items-center justify-center transition h-40"
                    >
                      {passport ? (
                        <img src={passport} alt="Passport preview" className="max-h-full max-w-full object-contain" />
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-gray-500 mb-2" />
                          <span className="text-xs text-gray-500">Click to upload</span>
                        </>
                      )}
                    </div>
                    <input
                      ref={passportInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, setPassport)}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>
              
              {/* Help Text */}
              <div className="mt-6 bg-[#1a1a1a] rounded-lg p-4 border border-gray-800">
                <h4 className="text-sm font-medium text-white flex items-center mb-2">
                  <AlertTriangle className="w-4 h-4 mr-2 text-[#ff950e]" />
                  Important Notes
                </h4>
                <ul className="text-xs text-gray-400 space-y-1.5">
                  <li>• Your ID information is only used for verification purposes</li>
                  <li>• We take privacy seriously and your documents will be securely stored</li>
                  <li>• Verification usually takes 24-48 hours to complete</li>
                  <li>• Make sure all documents are clear and legible</li>
                </ul>
              </div>
              
              <div className="mt-8 flex gap-3">
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !codePhoto || (!idFront && !passport)}
                  className={`flex-1 px-4 py-3 font-bold rounded-lg text-center transition ${
                    submitting || !codePhoto || (!idFront && !passport)
                      ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      : 'bg-[#ff950e] text-black hover:bg-[#e88800]'
                  }`}
                >
                  {submitting ? 'Submitting...' : 'Submit Verification'}
                </button>
                <button
                  onClick={() => router.push('/sellers/profile')}
                  className="flex-1 px-4 py-3 bg-[#1a1a1a] text-white border border-gray-700 rounded-lg hover:bg-[#222] transition text-center"
                >
                  Back to Profile
                </button>
              </div>
              
              {submitted && (
                <p className="text-green-500 text-center mt-4">
                  ✅ Verification submitted successfully! Redirecting...
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Render the image viewer modal */}
      <ImageViewerModal />
    </div>
  );
}
