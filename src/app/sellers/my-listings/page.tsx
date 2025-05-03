'use client';

import { useListings } from '@/context/ListingContext';
import { useWallet } from '@/context/WalletContext';
import RequireAuth from '@/components/RequireAuth';
import { useState, useEffect, useRef } from 'react'; // Added useRef
import { v4 as uuidv4 } from 'uuid';
import { Crown, Sparkles, Trash2, Clock, BarChart2, Eye, Edit, MoveVertical, Image as ImageIcon, X, Upload } from 'lucide-react'; // Added Upload
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
  const { listings = [], addListing, removeListing, updateListing, user } = useListings();
  const { orderHistory } = useWallet();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]); // Changed to array
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [tags, setTags] = useState('');
  const [hoursWorn, setHoursWorn] = useState<number | ''>('');
  const [showForm, setShowForm] = useState(false);

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
    setImageUrls([]); // Reset image URLs array
    setSelectedFiles([]); // Reset selected files
    setIsPremium(false);
    setTags('');
    setHoursWorn('');
    setEditingListingId(null);
    setShowForm(false);
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Convert FileList to array and add to selectedFiles
    const newFiles = Array.from(files);
    setSelectedFiles(prev => [...prev, ...newFiles]);

    // Reset the input
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

      // Upload each file and get URLs
      // This is a placeholder - replace with your actual file upload logic
      const uploadPromises = selectedFiles.map(uploadImageToStorage);
      const uploadedUrls = await Promise.all(uploadPromises);

      // Add all URLs to the imageUrls array
      setImageUrls(prev => [...prev, ...uploadedUrls]);

      // Clear selected files after successful upload
      setSelectedFiles([]);

    } catch (error) {
      console.error("Error uploading images:", error);
      alert("Failed to upload one or more images. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  // This function converts a file to a data URL (base64)
  // In a real app, you would replace this with actual file upload to a server/cloud storage
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
    const _imageUrls = [...imageUrls];
    const draggedItemContent = _imageUrls[dragItem.current!];
    _imageUrls.splice(dragItem.current!, 1);
    _imageUrls.splice(dragOverItem.current!, 0, draggedItemContent);
    dragItem.current = null;
    dragOverItem.current = null;
    setImageUrls(_imageUrls);
  };


  // Handle adding or updating a listing
  const handleSaveListing = () => {
    if (!title || !description || !price || imageUrls.length === 0) { // Check imageUrls array
      alert('Please fill in all required fields (title, description, price) and add at least one image.');
      return;
    }

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
      imageUrls, // Use the array
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
  };

  // Handle clicking the Edit button on a listing
  const handleEditClick = (listing: Listing) => {
    setEditingListingId(listing.id);
    setTitle(listing.title);
    setDescription(listing.description);
    setPrice(listing.price.toString());
    setImageUrls(listing.imageUrls || []); // Set image URLs array
    setSelectedFiles([]); // Clear selected files
    setIsPremium(listing.isPremium ?? false);
    setTags(listing.tags ? listing.tags.join(', ') : '');
    setHoursWorn(listing.hoursWorn !== undefined && listing.hoursWorn !== null ? listing.hoursWorn : '');
    setShowForm(true);
  };

  const myListings: Listing[] = listings?.filter(
    (listing: Listing) => listing.seller === user?.username
  ) ?? [];

  const premiumCount = myListings.filter(listing => listing.isPremium).length;
  const standardCount = myListings.length - premiumCount;

  const sellerOrders = orderHistory.filter(
    (order) => order.seller === user?.username
  );

  // Robust analytics for each listing
  const getListingAnalytics = (listing: Listing) => {
    const views = viewsData[listing.id] || 0;

    return {
      views,
    };
  };

  return (
    <RequireAuth role="seller">
      <main className="min-h-screen bg-black text-white py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Page Title */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white">My Listings</h1>
            <div className="w-16 h-1 bg-[#ff950e] mt-2 rounded-full"></div> {/* Orange underline */}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            {/* Left side: form + active listings */}
            <div className="lg:col-span-2 space-y-8">
              {/* Stats Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              </div>

              {/* Create Listing Button or Form */}
              {!showForm && !isEditing ? ( // Only show create button if form is hidden and not editing
                <div className="flex justify-center">
                  <button
                    onClick={() => setShowForm(true)}
                    className="px-8 py-3 rounded-full bg-[#ff950e] text-black font-bold text-lg shadow-lg hover:bg-[#e0850d] transition flex items-center gap-2"
                  >
                    <Sparkles className="w-5 h-5" />
                    Create New Listing
                  </button>
                </div>
              ) : ( // Show form if showForm is true OR if editing
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

                    {/* Selected Files Preview */}
                    {selectedFiles.length > 0 && (
                      <div className="mt-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-300">{selectedFiles.length} file(s) selected</span>
                          <button
                            type="button"
                            onClick={handleUploadFiles}
                            disabled={isUploading}
                            className="bg-[#ff950e] text-black px-4 py-2 rounded-lg hover:bg-[#e0850d] font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
                            <div key={index} className="relative border border-gray-700 rounded-lg overflow-hidden group">
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
                              key={url} // Using URL as key, assuming unique URLs
                              draggable
                              onDragStart={() => handleDragStart(index)}
                              onDragEnter={() => handleDragEnter(index)}
                              onDragEnd={handleDrop}
                              onDragOver={(e) => e.preventDefault()} // Needed to allow dropping
                              className={`relative border rounded-lg overflow-hidden cursor-grab active:cursor-grabbing group ${index === 0 ? 'border-2 border-[#ff950e] shadow-md' : 'border-gray-700'}`}
                            >
                              <img
                                src={url}
                                alt={`Listing Image ${index + 1}`}
                                className={`w-full object-cover ${index === 0 ? 'h-32 sm:h-40' : 'h-24 sm:h-32'}`} // First image slightly larger
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
                    <div className="flex flex-col sm:flex-row gap-4 mt-6">
                      <button
                        onClick={handleSaveListing}
                        className="w-full sm:flex-1 bg-[#ff950e] text-black px-6 py-3 rounded-lg hover:bg-[#e0850d] font-bold text-lg transition flex items-center justify-center gap-2"
                      >
                        {isEditing ? (
                          <>
                            <Edit className="w-5 h-5" />
                            Save Changes
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
                      return (
                        <div
                          key={listing.id}
                          className={`border rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition relative flex flex-col h-full
                            ${listing.isPremium ? 'border-[#ff950e] bg-black' : 'border-gray-700 bg-black'}`
                          }
                        >
                          {listing.isPremium && (
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
                                  <span key={idx} className="bg-gray-700 text-gray-300 text-xs px-2.5 py-1 rounded-full">
                                    {tag}
                                  </span>
                                ))}
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
                              <p className="text-[#ff950e] font-bold text-xl">
                                ${listing.price.toFixed(2)}
                              </p>
                              <div className="flex gap-2">
                                {/* Edit Button */}
                                <button
                                  onClick={() => handleEditClick(listing)}
                                  className="text-blue-400 p-2 rounded-full hover:bg-gray-800 transition"
                                  aria-label="Edit listing"
                                >
                                  <Edit className="w-5 h-5" />
                                </button>
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
                    sellerOrders.map((order) => (
                      <div
                        key={order.id + order.date}
                        className="border border-gray-700 p-4 rounded-lg text-sm bg-black hover:border-[#ff950e] transition"
                      >
                        <div className="flex items-center gap-4">
                           {/* Display the first image from the order */}
                           {/* NOTE: Assuming order history also stores imageUrl array */}
                           {order.imageUrl && ( // Use order.imageUrl here
                              <img
                                src={order.imageUrl} // Use order.imageUrl here
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
