'use client';

import { useListings } from '@/context/ListingContext';
import { useWallet } from '@/context/WalletContext';
import RequireAuth from '@/components/RequireAuth';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { v4 as uuidv4 } from 'uuid';
import { Crown, Sparkles, Trash2, Clock, BarChart2, Eye, Edit, MoveVertical, Image as ImageIcon, X, Upload, Gavel, AlertCircle, Calendar } from 'lucide-react';
import { Listing } from '@/context/ListingContext';

// Helper function to calculate time since listed
function timeSinceListed(dateString: string) {
  const now = new Date();
  const listed = new Date(dateString);
  const diffMs = now.getTime() - listed.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  if (diffMinutes > 0) return `${diffMinutes} min ago`;
  return 'just now';
}

export default function MyListingsPage() {
  const { listings = [], addListing, addAuctionListing, removeListing, updateListing, user, cancelAuction } = useListings();
  const { orderHistory } = useWallet();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [tags, setTags] = useState('');
  const [hoursWorn, setHoursWorn] = useState<number | ''>('');
  const [showForm, setShowForm] = useState(false);

  // Auction state
  const [isAuction, setIsAuction] = useState<boolean>(false);
  const [startingPrice, setStartingPrice] = useState('');
  const [reservePrice, setReservePrice] = useState('');
  const [auctionDuration, setAuctionDuration] = useState('1'); // days

  // File upload state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Editing state
  const [editingListingId, setEditingListingId] = useState<string | null>(null);
  const isEditing = editingListingId !== null;

  // Analytics state
  const [viewsData, setViewsData] = useState<Record<string, number>>({});

  // Drag and drop state for image reordering
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  // Load views from localStorage and update on storage event and window focus
  useEffect(() => {
    function loadViews() {
      if (typeof window !== 'undefined') {
        const data = localStorage.getItem('listing_views');
        setViewsData(data ? JSON.parse(data) : {});
      }
    }
    loadViews();
    window.addEventListener('storage', loadViews);
    window.addEventListener('focus', loadViews);
    return () => {
      window.removeEventListener('storage', loadViews);
      window.removeEventListener('focus', loadViews);
    };
  }, [listings]);

  // Reset form function
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPrice('');
    setImageUrls([]);
    setSelectedFiles([]);
    setIsPremium(false);
    setTags('');
    setHoursWorn('');
    setIsAuction(false);
    setStartingPrice('');
    setReservePrice('');
    setAuctionDuration('1');
    setEditingListingId(null);
    setShowForm(false);
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const newFiles = Array.from(files);
    setSelectedFiles(prev => [...prev, ...newFiles]);
    e.target.value = '';
  };

  // Remove a selected file
  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Upload all selected files
  const handleUploadFiles = async () => {
    if (selectedFiles.length === 0) return;
    try {
      setIsUploading(true);
      const uploadPromises = selectedFiles.map(uploadImageToStorage);
      const uploadedUrls = await Promise.all(uploadPromises);
      setImageUrls(prev => [...prev, ...uploadedUrls]);
      setSelectedFiles([]);
    } catch (error) {
      console.error("Error uploading images:", error);
      alert("Failed to upload one or more images. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  // This function converts a file to a data URL (base64)
  const uploadImageToStorage = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert file to data URL'));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  };

  // Handle removing an image URL
  const handleRemoveImageUrl = (urlToRemove: string) => {
    setImageUrls(imageUrls.filter(url => url !== urlToRemove));
  };

  // Handle drag start
  const handleDragStart = (index: number) => {
    dragItem.current = index;
  };

  // Handle drag enter
  const handleDragEnter = (index: number) => {
    dragOverItem.current = index;
  };

  // Handle drag end (drop)
  const handleDrop = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    
    const _imageUrls = [...imageUrls];
    const draggedItemContent = _imageUrls[dragItem.current];
    _imageUrls.splice(dragItem.current, 1);
    _imageUrls.splice(dragOverItem.current, 0, draggedItemContent);
    dragItem.current = null;
    dragOverItem.current = null;
    setImageUrls(_imageUrls);
  };

  // Calculate auction end time
  const calculateAuctionEndTime = (): string => {
    const now = new Date();
    
    // Special case for 1-minute test option
    if (auctionDuration === '0.017') {
      const future = new Date(now.getTime() + 60 * 1000); // Exactly 1 minute in milliseconds
      return future.toISOString();
    }
    
    // Normal case for days
    const days = parseFloat(auctionDuration);
    now.setDate(now.getDate() + Math.floor(days));
    return now.toISOString();
  };

  // Handle adding or updating a listing
  const handleSaveListing = () => {
    if (!title || !description || imageUrls.length === 0) {
      alert('Please fill in all required fields (title, description) and add at least one image.');
      return;
    }

    if (isAuction) {
      const startingBid = parseFloat(startingPrice);
      if (isNaN(startingBid) || startingBid <= 0) {
        alert('Please enter a valid starting bid for the auction.');
        return;
      }

      // Validate reserve price if provided
      let reserveBid: number | undefined = undefined;
      if (reservePrice.trim() !== '') {
        reserveBid = parseFloat(reservePrice);
        if (isNaN(reserveBid) || reserveBid < startingBid) {
          alert('Reserve price must be equal to or greater than the starting bid.');
          return;
        }
      }

      const tagsList = tags.split(',').map(tag => tag.trim()).filter(tag => tag);

      const listingData = {
        title,
        description,
        price: startingBid, // Using starting bid as the base price
        imageUrls,
        seller: user?.username || 'unknown',
        isPremium,
        tags: tagsList,
        hoursWorn: hoursWorn === '' ? undefined : Number(hoursWorn),
      };

      // Create auction settings
      const auctionSettings = {
        startingPrice: startingBid,
        reservePrice: reserveBid,
        endTime: calculateAuctionEndTime()
      };

      // Add auction listing
      addAuctionListing(listingData, auctionSettings);
      resetForm();
    } else {
      // Handle regular listing
      const numericPrice = parseFloat(price);
      if (isNaN(numericPrice) || numericPrice <= 0) {
        alert('Please enter a valid price.');
        return;
      }

      const tagsList = tags.split(',').map(tag => tag.trim()).filter(tag => tag);

      const listingData = {
        title,
        description,
        price: numericPrice,
        imageUrls,
        seller: user?.username || 'unknown',
        isPremium,
        tags: tagsList,
        hoursWorn: hoursWorn === '' ? undefined : Number(hoursWorn),
      };

      if (isEditing && editingListingId) {
        if (updateListing) {
          updateListing(editingListingId, listingData);
        } else {
          console.error("updateListing function not available in context");
        }
      } else {
        addListing(listingData);
      }
      resetForm();
    }
  };

  // Handle clicking the Edit button on a listing
  const handleEditClick = (listing: Listing) => {
    setEditingListingId(listing.id);
    setTitle(listing.title);
    setDescription(listing.description);
    setPrice(listing.price.toString());
    setImageUrls(listing.imageUrls || []);
    setSelectedFiles([]);
    setIsPremium(listing.isPremium ?? false);
    setTags(listing.tags ? listing.tags.join(', ') : '');
    setHoursWorn(listing.hoursWorn !== undefined && listing.hoursWorn !== null ? listing.hoursWorn : '');
    setShowForm(true);
    
    // Handle auction data if present
    if (listing.auction) {
      setIsAuction(true);
      setStartingPrice(listing.auction.startingPrice.toString());
      setReservePrice(listing.auction.reservePrice?.toString() || '');
      
      // Calculate remaining days for auction
      const endTime = new Date(listing.auction.endTime);
      const now = new Date();
      const daysRemaining = Math.ceil((endTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      setAuctionDuration(Math.max(1, daysRemaining).toString());
    } else {
      setIsAuction(false);
    }
  };

  // Handle canceling an auction
  const handleCancelAuction = (listingId: string) => {
    if (confirm('Are you sure you want to cancel this auction? This action cannot be undone.')) {
      cancelAuction(listingId);
    }
  };

  const myListings: Listing[] = listings?.filter(
    (listing: Listing) => listing.seller === user?.username
  ) ?? [];

  // Count listing types
  const auctionCount = myListings.filter(listing => !!listing.auction).length;
  const premiumCount = myListings.filter(listing => listing.isPremium).length;
  const standardCount = myListings.length - (premiumCount + auctionCount);

  // Get seller orders and sort by date (newest first)
  const sellerOrders = orderHistory
    .filter(order => order.seller === user?.username)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Robust analytics for each listing
  const getListingAnalytics = (listing: Listing) => {
    const views = viewsData[listing.id] || 0;
    return { views };
  };

  // Format time remaining for auction
  const formatTimeRemaining = (endTimeStr: string) => {
    const endTime = new Date(endTimeStr);
    const now = new Date();
    
    if (endTime <= now) {
      return 'Ended';
    }
    
    const diffMs = endTime.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffDays > 0) {
      return `${diffDays}d ${diffHours}h left`;
    } else if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m left`;
    } else {
      return `${diffMinutes}m ${Math.floor((diffMs % (1000 * 60)) / 1000)}s left`;
    }
  };

  // --- Listing Limit Logic ---
  const isVerified = user?.verified || user?.verificationStatus === 'verified';
  const maxListings = isVerified ? 25 : 2;
  const atLimit = myListings.length >= maxListings;

  return (
    <RequireAuth role="seller">
      <main className="min-h-screen bg-black text-white py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Page Title */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white">My Listings</h1>
            <div className="w-16 h-1 bg-[#ff950e] mt-2 rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            {/* Left side: form + active listings */}
            <div className="lg:col-span-2 space-y-8">
              {/* Stats Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[#1a1a1a] p-6 rounded-xl shadow-lg border border-gray-800">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-300">Standard Listings</h3>
                      <span className="text-4xl font-bold text-white">{standardCount}</span>
                    </div>
                    <Sparkles className="w-10 h-10 text-gray-600" />
                  </div>
                </div>
                <div className="bg-[#1a1a1a] p-6 rounded-xl shadow-lg border border-[#ff950e]">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-300">Premium Listings</h3>
                      <span className="text-4xl font-bold text-[#ff950e]">{premiumCount}</span>
                    </div>
                    <Crown className="w-10 h-10 text-[#ff950e]" />
                  </div>
                </div>
                <div className="bg-[#1a1a1a] p-6 rounded-xl shadow-lg border border-purple-700">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-300">Auction Listings</h3>
                      <span className="text-4xl font-bold text-purple-500">{auctionCount}</span>
                    </div>
                    <Gavel className="w-10 h-10 text-purple-500" />
                  </div>
                </div>
              </div>

              {/* Listing Limit Message */}
              {atLimit && !isEditing && (
                <div className="bg-yellow-900 border border-yellow-700 text-yellow-200 rounded-lg p-4 my-4 text-center font-semibold">
                  {isVerified ? (
                    <>
                      You have reached the maximum of <span className="text-[#ff950e] font-bold">25</span> listings for verified sellers.
                    </>
                  ) : (
                    <>
                      Unverified sellers can only have <span className="text-[#ff950e] font-bold">2</span> active listings.<br />
                      <span className="block mt-2">
                        <Link
                          href="/sellers/verify"
                          className="text-[#ff950e] font-bold underline hover:text-white transition"
                        >
                          Verify your account
                        </Link>{' '}
                        to add up to 25 listings!
                      </span>
                    </>
                  )}
                </div>
              )}

              {/* Create Listing Button or Form */}
              {!showForm && !isEditing && (
                <div className="flex justify-center">
                  <button
                    onClick={() => setShowForm(true)}
                    className="px-8 py-3 rounded-full bg-[#ff950e] text-black font-bold text-lg shadow-lg hover:bg-[#e0850d] transition flex items-center gap-2"
                    disabled={atLimit}
                    style={atLimit ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                  >
                    <Sparkles className="w-5 h-5" />
                    Create New Listing
                  </button>
                </div>
              )}

              {(showForm || isEditing) && (
                <div className="bg-[#1a1a1a] p-6 sm:p-8 rounded-xl shadow-lg border border-gray-800">
                  <h2 className="text-2xl font-bold mb-6 text-white">
                    {isEditing ? 'Edit Listing' : 'Create New Listing'}
                  </h2>
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Title</label>
                      <input
                        type="text"
                        placeholder="e.g. 'Black Lace Panties Worn 24 Hours'"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full p-3 border border-gray-700 rounded-lg bg-black text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                      <textarea
                        placeholder="Describe your item in detail to attract buyers"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full p-3 border border-gray-700 rounded-lg bg-black text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ff950e] h-28"
                      />
                    </div>
                    
                    {/* Listing Type Selection */}
                    <div className="bg-[#121212] p-4 rounded-lg border border-gray-700">
                      <h3 className="text-lg font-medium mb-3 text-white">Listing Type</h3>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <label className={`flex items-center gap-3 py-3 px-4 rounded-lg cursor-pointer border-2 transition flex-1 ${!isAuction ? 'border-[#ff950e] bg-[#ff950e] bg-opacity-10' : 'border-gray-700 bg-black'}`}>
                          <input
                            type="radio"
                            checked={!isAuction}
                            onChange={() => setIsAuction(false)}
                            className="sr-only" // Hide actual radio button
                          />
                          <Sparkles className={`w-5 h-5 ${!isAuction ? 'text-[#ff950e]' : 'text-gray-500'}`} />
                          <div>
                            <span className="font-medium">Standard Listing</span>
                            <p className="text-xs text-gray-400 mt-1">Fixed price, first come first served</p>
                          </div>
                        </label>
                        
                        <label className={`flex items-center gap-3 py-3 px-4 rounded-lg cursor-pointer border-2 transition flex-1 ${isAuction ? 'border-purple-600 bg-purple-600 bg-opacity-10' : 'border-gray-700 bg-black'}`}>
                          <input
                            type="radio"
                            checked={isAuction}
                            onChange={() => setIsAuction(true)}
                            className="sr-only" // Hide actual radio button
                          />
                          <Gavel className={`w-5 h-5 ${isAuction ? 'text-purple-500' : 'text-gray-500'}`} />
                          <div>
                            <span className="font-medium">Auction</span>
                            <p className="text-xs text-gray-400 mt-1">Let buyers bid, highest wins</p>
                          </div>
                        </label>
                      </div>
                    </div>
                    
                    {/* Show different price fields based on listing type */}
                    {isAuction ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Starting Bid ($)</label>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="e.g. 9.99"
                            value={startingPrice}
                            onChange={(e) => setStartingPrice(e.target.value)}
                            className="w-full p-3 border border-gray-700 rounded-lg bg-black text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-600"
                            min="0"
                          />
                          <p className="text-xs text-gray-500 mt-1">Minimum price to start bidding</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Reserve Price ($) <span className="text-gray-500 text-xs">(Optional)</span></label>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="e.g. 19.99"
                            value={reservePrice}
                            onChange={(e) => setReservePrice(e.target.value)}
                            className="w-full p-3 border border-gray-700 rounded-lg bg-black text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-600"
                            min="0"
                          />
                          <p className="text-xs text-gray-500 mt-1">Minimum winning bid price (hidden from buyers)</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Auction Duration</label>
                          <select
                            value={auctionDuration}
                            onChange={(e) => setAuctionDuration(e.target.value)}
                            className="w-full p-3 border border-gray-700 rounded-lg bg-black text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                          >
                            <option value="0.017">1 Minute (Testing)</option>
                            <option value="1">1 Day</option>
                            <option value="3">3 Days</option>
                            <option value="5">5 Days</option>
                            <option value="7">7 Days</option>
                          </select>
                          <p className="text-xs text-gray-500 mt-1">How long the auction will last</p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Price ($)</label>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="e.g. 29.99"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            className="w-full p-3 border border-gray-700 rounded-lg bg-black text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
                            min="0"
                          />
                        </div>
                        {/* Image Upload Section */}
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Add Images</label>
                          <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-700 rounded-lg bg-black hover:border-[#ff950e] transition cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={handleFileSelect}
                              className="hidden"
                            />
                            <ImageIcon className="w-5 h-5 text-[#ff950e]" />
                            <span className="text-gray-300">Select images from your computer</span>
                          </label>
                        </div>
                      </div>
                    )}
                    
                    {/* Image upload section for auction type */}
                    {isAuction && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Add Images</label>
                        <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-700 rounded-lg bg-black hover:border-purple-600 transition cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleFileSelect}
                            className="hidden"
                          />
                          <ImageIcon className="w-5 h-5 text-purple-500" />
                          <span className="text-gray-300">Select images from your computer</span>
                        </label>
                      </div>
                    )}
                    
                    {/* Selected Files Preview */}
                    {selectedFiles.length > 0 && (
                      <div className="mt-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-300">{selectedFiles.length} file(s) selected</span>
                          <button
                            type="button"
                            onClick={handleUploadFiles}
                            disabled={isUploading}
                            className={`text-black px-4 py-2 rounded-lg font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${isAuction ? 'bg-purple-500 hover:bg-purple-600' : 'bg-[#ff950e] hover:bg-[#e0850d]'}`}
                          >
                            {isUploading ? (
                              <>Uploading...</>
                            ) : (
                              <>
                                <Upload className="w-4 h-4" />
                                Add to Listing
                              </>
                            )}
                          </button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                          {selectedFiles.map((file, index) => (
                            <div key={`selected-file-${index}`} className="relative border border-gray-700 rounded-lg overflow-hidden group">
                              <img
                                src={URL.createObjectURL(file)}
                                alt={`Selected ${index + 1}`}
                                className="w-full h-24 object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => removeSelectedFile(index)}
                                className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                              >
                                <X className="w-4 h-4" />
                              </button>
                              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 py-1 px-2">
                                <p className="text-xs text-white truncate">{file.name}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Image Preview and Reordering */}
                    {imageUrls.length > 0 && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Images (Drag to reorder)</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                          {imageUrls.map((url, index) => (
                            <div
                              key={`image-${index}-${url.substring(0, 20)}`}
                              draggable
                              onDragStart={() => handleDragStart(index)}
                              onDragEnter={() => handleDragEnter(index)}
                              onDragEnd={handleDrop}
                              onDragOver={(e) => e.preventDefault()}
                              className={`relative border rounded-lg overflow-hidden cursor-grab active:cursor-grabbing group ${index === 0 ? 'border-2 border-[#ff950e] shadow-md' : 'border-gray-700'}`}
                            >
                              <img
                                src={url}
                                alt={`Listing Image ${index + 1}`}
                                className={`w-full object-cover ${index === 0 ? 'h-32 sm:h-40' : 'h-24 sm:h-32'}`}
                              />
                              {index === 0 && (
                                <span className="absolute top-2 left-2 bg-[#ff950e] text-black text-xs px-2 py-0.5 rounded-full font-bold">
                                  Main
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => handleRemoveImageUrl(url)}
                                className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                                aria-label="Remove image"
                              >
                                <X className="w-4 h-4" />
                              </button>
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black bg-opacity-20">
                                <MoveVertical className="w-6 h-6 text-white" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Tags (comma separated)</label>
                      <input
                        type="text"
                        placeholder="e.g. thong, black, lace, cotton, gym"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        className="w-full p-3 border border-gray-700 rounded-lg bg-black text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
                      />
                      <p className="text-xs text-gray-500 mt-1">Help buyers find your items with relevant tags</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Hours Worn (optional)</label>
                      <input
                        type="number"
                        placeholder="e.g. 24"
                        value={hoursWorn}
                        onChange={(e) => setHoursWorn(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full p-3 border border-gray-700 rounded-lg bg-black text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
                        min="0"
                      />
                    </div>
                    
                    {/* Only show premium option for standard listings */}
                    {!isAuction && (
                      <div className="mt-4">
                        <label className={`flex items-center gap-3 py-4 px-5 border-2 rounded-lg cursor-pointer transition ${isPremium ? 'border-[#ff950e] bg-[#ff950e] bg-opacity-10' : 'border-gray-700 bg-black'}`}>
                          <input
                            type="checkbox"
                            checked={isPremium}
                            onChange={() => setIsPremium(!isPremium)}
                            className="h-5 w-5 text-[#ff950e] focus:ring-[#ff950e] rounded border-gray-600 bg-black checked:bg-[#ff950e]"
                          />
                          <Crown className={`w-6 h-6 ${isPremium ? 'text-[#ff950e]' : 'text-gray-500'}`} />
                          <div>
                            <span className={`font-semibold text-lg ${isPremium ? 'text-white' : 'text-gray-300'}`}>Make Premium Listing</span>
                            <p className={`text-sm mt-0.5 ${isPremium ? 'text-gray-200' : 'text-gray-400'}`}>Only available to your subscribers</p>
                          </div>
                        </label>
                      </div>
                    )}
                    
                    {/* Auction information notice */}
                    {isAuction && (
                      <div className="bg-purple-900 bg-opacity-30 border border-purple-700 rounded-lg p-4 mt-4">
                        <div className="flex gap-3">
                          <AlertCircle className="w-6 h-6 text-purple-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-purple-300 mb-1">Auction Information</h4>
                            <ul className="text-sm text-gray-300 space-y-1">
                              <li>• Auctions run for {auctionDuration === '0.017' ? '1 minute' : `${auctionDuration} day${parseInt(auctionDuration) !== 1 ? 's' : ''}`} from the time you create the listing</li>
                              <li>• Bidders must have sufficient funds in their wallet to place a bid</li>
                              <li>• If the reserve price is met, the highest bidder automatically purchases the item when the auction ends</li>
                              <li>• You can cancel an auction at any time before it ends</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex flex-col sm:flex-row gap-4 mt-6">
                      <button
                        onClick={handleSaveListing}
                        className={`w-full sm:flex-1 text-black px-6 py-3 rounded-lg font-bold text-lg transition flex items-center justify-center gap-2 ${
                          isAuction ? 'bg-purple-500 hover:bg-purple-600' : 'bg-[#ff950e] hover:bg-[#e0850d]'
                        }`}
                      >
                        {isEditing ? (
                          <>
                            <Edit className="w-5 h-5" />
                            Save Changes
                          </>
                        ) : isAuction ? (
                          <>
                            <Gavel className="w-5 h-5" />
                            Create Auction
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-5 h-5" />
                            Create Listing
                          </>
                        )}
                      </button>
                      <button
                        onClick={resetForm}
                        className="w-full sm:flex-1 bg-gray-700 text-white px-6 py-3 rounded-lg hover:bg-gray-600 font-medium text-lg transition flex items-center justify-center gap-2"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Seller's own listings with analytics */}
              <div className="bg-[#1a1a1a] p-6 sm:p-8 rounded-xl shadow-lg border border-gray-800">
                <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-3">
                  Your Active Listings
                  <BarChart2 className="w-6 h-6 text-[#ff950e]" />
                </h2>
                {myListings.length === 0 ? (
                  <div className="text-center py-10 bg-black rounded-lg border border-dashed border-gray-700 text-gray-400">
                    <p className="text-lg mb-2">You haven't created any listings yet.</p>
                    <p className="text-sm">Use the button above to add your first listing.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {myListings.map((listing) => {
                      const { views } = getListingAnalytics(listing);
                      const isAuctionListing = !!listing.auction;
                      
                      return (
                        <div
                          key={`listing-${listing.id}`}
                          className={`border rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition relative flex flex-col h-full
                            ${isAuctionListing 
                              ? 'border-purple-700 bg-black' 
                              : listing.isPremium 
                                ? 'border-[#ff950e] bg-black' 
                                : 'border-gray-700 bg-black'}`
                          }
                        >
                          {isAuctionListing && (
                            <div className="absolute top-4 right-4 z-10">
                              <span className="bg-purple-600 text-white text-xs px-3 py-1.5 rounded-full font-bold flex items-center shadow">
                                <Gavel className="w-4 h-4 mr-1" /> Auction
                              </span>
                            </div>
                          )}
                          
                          {!isAuctionListing && listing.isPremium && (
                            <div className="absolute top-4 right-4 z-10">
                              <span className="bg-[#ff950e] text-black text-xs px-3 py-1.5 rounded-full font-bold flex items-center shadow">
                                <Crown className="w-4 h-4 mr-1" /> Premium
                              </span>
                            </div>
                          )}

                          <div className="relative w-full h-48 sm:h-56 overflow-hidden">
                            {/* Display the first image from the array */}
                            {listing.imageUrls && listing.imageUrls.length > 0 && (
                              <img
                                src={listing.imageUrls[0]}
                                alt={listing.title}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>

                          <div className="p-5 flex flex-col flex-grow">
                            <h3 className="text-xl font-bold text-white mb-2">{listing.title}</h3>
                            <p className="text-gray-400 text-sm mb-3 line-clamp-2 flex-grow">{listing.description}</p>

                            {listing.tags && listing.tags.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-auto mb-3">
                                {listing.tags.map((tag, idx) => (
                                  <span key={`tag-${idx}-${listing.id}`} className="bg-gray-700 text-gray-300 text-xs px-2.5 py-1 rounded-full">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Auction info */}
                            {isAuctionListing && listing.auction && (
                              <div className="bg-purple-900 bg-opacity-20 rounded-lg p-3 mb-3 border border-purple-800">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-sm text-purple-300 flex items-center gap-1">
                                    <Gavel className="w-3 h-3" /> Current Bid:
                                  </span>
                                  <span className="font-bold text-white">
                                    ${listing.auction.highestBid || listing.auction.startingPrice.toFixed(2)}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-purple-300 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" /> Ends:
                                  </span>
                                  <span className="text-sm text-white">
                                    {formatTimeRemaining(listing.auction.endTime)}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-400 mt-1">
                                  {listing.auction.bids?.length || 0} {listing.auction.bids?.length === 1 ? 'bid' : 'bids'} placed
                                </div>
                              </div>
                            )}

                            {/* Analytics */}
                            <div className="flex items-center justify-between text-sm text-gray-400 bg-gray-800 rounded-lg p-3 mt-auto">
                              <span className="flex items-center gap-1">
                                <Eye className="w-4 h-4 text-[#ff950e]" /> {views} views
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4 text-gray-500" /> {timeSinceListed(listing.date)}
                              </span>
                            </div>

                            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-700">
                              <p className={`font-bold text-xl ${isAuctionListing ? 'text-purple-400' : 'text-[#ff950e]'}`}>
                                {isAuctionListing && listing.auction
                                  ? `$${listing.auction.startingPrice.toFixed(2)} start` 
                                  : `$${listing.price.toFixed(2)}`}
                              </p>
                              <div className="flex gap-2">
                                {/* Cancel auction button */}
                                {isAuctionListing && listing.auction?.status === 'active' && (
                                  <button
                                    onClick={() => handleCancelAuction(listing.id)}
                                    className="text-red-400 p-2 rounded-full hover:bg-gray-800 transition"
                                    aria-label="Cancel auction"
                                    title="Cancel auction"
                                  >
                                    <X className="w-5 h-5" />
                                  </button>
                                )}
                                {/* Edit Button - only for standard listings or ended auctions */}
                                {(!isAuctionListing || (listing.auction && listing.auction.status !== 'active')) && (
                                  <button
                                    onClick={() => handleEditClick(listing)}
                                    className="text-blue-400 p-2 rounded-full hover:bg-gray-800 transition"
                                    aria-label="Edit listing"
                                  >
                                    <Edit className="w-5 h-5" />
                                  </button>
                                )}
                                {/* Delete Button */}
                                <button
                                  onClick={() => removeListing(listing.id)}
                                  className="text-red-500 p-2 rounded-full hover:bg-gray-800 transition"
                                  aria-label="Delete listing"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right side: order history and premium tips */}
            <div className="space-y-8">
              {/* Auction Seller Tips */}
              <div className="bg-[#1a1a1a] p-6 sm:p-8 rounded-xl shadow-lg border border-purple-700">
                <h2 className="text-2xl font-bold mb-5 text-white flex items-center gap-3">
                  <Gavel className="text-purple-500 w-6 h-6" />
                  Auction Tips
                </h2>
                <ul className="space-y-4 text-gray-300 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-500 font-bold text-lg leading-none">•</span>
                    <span>Set a competitive starting price to attract initial bids.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-500 font-bold text-lg leading-none">•</span>
                    <span>Use a reserve price to ensure you don't sell below your minimum acceptable price.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-500 font-bold text-lg leading-none">•</span>
                    <span>Add high-quality photos and detailed descriptions to encourage higher bids.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-500 font-bold text-lg leading-none">•</span>
                    <span>Auctions create excitement and can result in higher final prices than fixed listings.</span>
                  </li>
                </ul>
              </div>
              
              {/* Premium Seller Tips */}
              <div className="bg-[#1a1a1a] p-6 sm:p-8 rounded-xl shadow-lg border border-[#ff950e]">
                <h2 className="text-2xl font-bold mb-5 text-white flex items-center gap-3">
                  <Crown className="text-[#ff950e] w-6 h-6" />
                  Premium Seller Tips
                </h2>
                <ul className="space-y-4 text-gray-300 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-[#ff950e] font-bold text-lg leading-none">•</span>
                    <span>Premium listings are only visible to your subscribers, increasing exclusivity.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#ff950e] font-bold text-lg leading-none">•</span>
                    <span>Set your monthly subscription price in your profile settings to unlock premium features.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#ff950e] font-bold text-lg leading-none">•</span>
                    <span>Use high-quality, appealing images for your listings to attract more views and buyers.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#ff950e] font-bold text-lg leading-none">•</span>
                    <span>Premium listings can often command higher prices due to their exclusive nature.</span>
                  </li>
                </ul>
              </div>

              {/* Order History */}
              <div className="bg-[#1a1a1a] p-6 sm:p-8 rounded-xl shadow-lg border border-gray-800">
                <h2 className="text-2xl font-bold mb-6 text-white">Recent Sales</h2>
                <div className="space-y-5">
                  {sellerOrders.length === 0 ? (
                    <div className="text-center py-8 bg-black rounded-lg border border-dashed border-gray-700 text-gray-400 italic">
                      <p>No sales yet. Keep promoting your listings!</p>
                    </div>
                  ) : (
                    sellerOrders.map((order, index) => (
                      <div
                        key={`order-${order.id}-${index}-${order.date}`}
                        className="border border-gray-700 p-4 rounded-lg text-sm bg-black hover:border-[#ff950e] transition"
                      >
                        <div className="flex items-center gap-4">
                          {order.imageUrl && (
                            <img
                              src={order.imageUrl}
                              alt={order.title}
                              className="w-16 h-16 object-cover rounded-md border border-gray-600"
                            />
                          )}
                          <div className="flex-1">
                            <h3 className="font-semibold text-white text-base">{order.title}</h3>
                            <p className="text-[#ff950e] font-bold text-lg mt-1">
                              ${order.markedUpPrice.toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Sold on {new Date(order.date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </RequireAuth>
  );
}
