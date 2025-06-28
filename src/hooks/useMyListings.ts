// src/hooks/useMyListings.ts

import { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useListings } from '@/context/ListingContext';
import { WalletContext } from '@/context/WalletContext';
import { storageService } from '@/services';
import { Listing } from '@/context/ListingContext';
import { ListingFormState, EditingState, ListingAnalytics } from '@/types/myListings';
import { 
  INITIAL_FORM_STATE, 
  calculateAuctionEndTime 
} from '@/utils/myListingsUtils';
import { uploadMultipleToCloudinary } from '@/utils/cloudinary';

export const useMyListings = () => {
  const { user } = useAuth();
  const { listings = [], addListing, addAuctionListing, removeListing, updateListing, cancelAuction } = useListings();
  
  // Use useContext to get wallet context - it might be undefined
  const walletContext = useContext(WalletContext);
  const orderHistory = walletContext?.orderHistory || [];

  // Form state
  const [formState, setFormState] = useState<ListingFormState>(INITIAL_FORM_STATE);
  const [showForm, setShowForm] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Editing state
  const [editingState, setEditingState] = useState<EditingState>({
    listingId: null,
    isEditing: false
  });
  
  // Analytics state
  const [viewsData, setViewsData] = useState<Record<string, number>>({});
  
  // Drag refs
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const isVerified = user?.isVerified || user?.verificationStatus === 'verified';
  const myListings = listings?.filter((listing: Listing) => listing.seller === user?.username) ?? [];
  
  // Calculate stats
  const auctionCount = myListings.filter((listing: Listing) => !!listing.auction).length;
  const premiumCount = myListings.filter((listing: Listing) => listing.isPremium).length;
  const standardCount = myListings.length - (premiumCount + auctionCount);
  
  // Check listing limits
  const maxListings = isVerified ? 25 : 2;
  const atLimit = myListings.length >= maxListings;
  
  // Get seller orders
  const sellerOrders = orderHistory
    .filter(order => order.seller === user?.username)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Load views data
  useEffect(() => {
    const loadViews = async () => {
      if (typeof window !== 'undefined') {
        const data = await storageService.getItem<Record<string, number>>('listing_views', {});
        setViewsData(data);
      }
    };
    
    loadViews();
    
    // Listen for storage changes
    const handleStorageChange = () => {
      loadViews();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleStorageChange);
    };
  }, [listings]);

  // Update form state
  const updateFormState = useCallback((updates: Partial<ListingFormState>) => {
    setFormState(prev => ({ ...prev, ...updates }));
  }, []);

  // Reset form
  const resetForm = useCallback(() => {
    setFormState(INITIAL_FORM_STATE);
    setSelectedFiles([]);
    setEditingState({ listingId: null, isEditing: false });
    setShowForm(false);
    setUploadProgress(0);
  }, []);

  // Handle file selection
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const newFiles = Array.from(files);
    setSelectedFiles(prev => [...prev, ...newFiles]);
    e.target.value = '';
  }, []);

  // Remove selected file
  const removeSelectedFile = useCallback((index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Upload files using Cloudinary
  const handleUploadFiles = useCallback(async () => {
    if (selectedFiles.length === 0) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Upload to Cloudinary with progress tracking
      const uploadResults = await uploadMultipleToCloudinary(
        selectedFiles,
        (progress) => {
          setUploadProgress(Math.round(progress));
        }
      );
      
      // Extract URLs from upload results
      const newImageUrls = uploadResults.map(result => result.url);
      
      // Update form state with new URLs
      updateFormState({ imageUrls: [...formState.imageUrls, ...newImageUrls] });
      setSelectedFiles([]);
      setUploadProgress(0);
      
      console.log('Images uploaded successfully:', uploadResults);
    } catch (error) {
      console.error("Error uploading images:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to upload images: ${errorMessage}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [selectedFiles, formState.imageUrls, updateFormState]);

  // Remove image URL
  const handleRemoveImageUrl = useCallback((urlToRemove: string) => {
    updateFormState({ imageUrls: formState.imageUrls.filter(url => url !== urlToRemove) });
  }, [formState.imageUrls, updateFormState]);

  // Handle image reorder with proper drag and drop logic
  const handleDragStart = useCallback((index: number) => {
    dragItem.current = index;
  }, []);

  const handleDragEnter = useCallback((index: number) => {
    dragOverItem.current = index;
  }, []);

  const handleDrop = useCallback(() => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    
    const _imageUrls = [...formState.imageUrls];
    const draggedItemContent = _imageUrls[dragItem.current];
    _imageUrls.splice(dragItem.current, 1);
    _imageUrls.splice(dragOverItem.current, 0, draggedItemContent);
    dragItem.current = null;
    dragOverItem.current = null;
    updateFormState({ imageUrls: _imageUrls });
  }, [formState.imageUrls, updateFormState]);

  // Handle image reorder - simplified version for the component
  const handleImageReorder = useCallback((dragIndex: number, dropIndex: number) => {
    const _imageUrls = [...formState.imageUrls];
    const draggedItemContent = _imageUrls[dragIndex];
    _imageUrls.splice(dragIndex, 1);
    _imageUrls.splice(dropIndex, 0, draggedItemContent);
    updateFormState({ imageUrls: _imageUrls });
  }, [formState.imageUrls, updateFormState]);

  // Save listing
  const handleSaveListing = useCallback(() => {
    const { title, description, imageUrls, isAuction, startingPrice, reservePrice, auctionDuration, price, tags, hoursWorn, isPremium } = formState;
    
    if (!title || !description || imageUrls.length === 0) {
      alert('Please fill in all required fields (title, description) and add at least one image.');
      return;
    }

    if (isAuction) {
      if (!isVerified) {
        alert('You must be a verified seller to create auction listings.');
        return;
      }

      const startingBid = parseFloat(startingPrice);
      if (isNaN(startingBid) || startingBid <= 0) {
        alert('Please enter a valid starting bid for the auction.');
        return;
      }

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
        price: startingBid,
        imageUrls,
        seller: user?.username || 'unknown',
        isPremium,
        tags: tagsList,
        hoursWorn: hoursWorn === '' ? undefined : Number(hoursWorn),
      };

      const auctionSettings = {
        startingPrice: startingBid,
        reservePrice: reserveBid,
        endTime: calculateAuctionEndTime(auctionDuration)
      };

      addAuctionListing(listingData, auctionSettings);
      resetForm();
    } else {
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

      if (editingState.isEditing && editingState.listingId) {
        if (updateListing) {
          updateListing(editingState.listingId, listingData);
        } else {
          console.error("updateListing function not available in context");
        }
      } else {
        addListing(listingData);
      }
      resetForm();
    }
  }, [formState, editingState, user, isVerified, addListing, addAuctionListing, updateListing, resetForm]);

  // Handle edit click
  const handleEditClick = useCallback((listing: Listing) => {
    setEditingState({ listingId: listing.id, isEditing: true });
    setFormState({
      title: listing.title,
      description: listing.description,
      price: listing.price.toString(),
      imageUrls: listing.imageUrls || [],
      isPremium: listing.isPremium ?? false,
      tags: listing.tags ? listing.tags.join(', ') : '',
      hoursWorn: listing.hoursWorn !== undefined && listing.hoursWorn !== null ? listing.hoursWorn : '',
      isAuction: !!listing.auction,
      startingPrice: listing.auction?.startingPrice.toString() || '',
      reservePrice: listing.auction?.reservePrice?.toString() || '',
      auctionDuration: listing.auction ? '1' : '1'
    });
    setSelectedFiles([]);
    setShowForm(true);
    
    // Handle auction data if present
    if (listing.auction) {
      // Calculate remaining days for auction
      const endTime = new Date(listing.auction.endTime);
      const now = new Date();
      const daysRemaining = Math.ceil((endTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      updateFormState({ auctionDuration: Math.max(1, daysRemaining).toString() });
    }
  }, [updateFormState]);

  // Handle cancel auction
  const handleCancelAuction = useCallback((listingId: string) => {
    if (confirm('Are you sure you want to cancel this auction? This action cannot be undone.')) {
      cancelAuction(listingId);
    }
  }, [cancelAuction]);

  // Get listing analytics
  const getListingAnalytics = useCallback((listing: Listing): ListingAnalytics => {
    const views = viewsData[listing.id] || 0;
    return { views };
  }, [viewsData]);

  return {
    // State
    user,
    formState,
    showForm,
    selectedFiles,
    isUploading,
    uploadProgress,
    editingState,
    isVerified,
    myListings,
    atLimit,
    maxListings,
    auctionCount,
    premiumCount,
    standardCount,
    sellerOrders,
    
    // Actions
    setShowForm,
    updateFormState,
    resetForm,
    handleFileSelect,
    removeSelectedFile,
    handleUploadFiles,
    handleRemoveImageUrl,
    handleImageReorder,
    handleSaveListing,
    handleEditClick,
    handleCancelAuction,
    removeListing,
    getListingAnalytics,
    
    // Drag handlers for direct use
    handleDragStart,
    handleDragEnter,
    handleDrop,
  };
};