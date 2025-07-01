// src/hooks/useMyListings.ts

import { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useListings } from '@/context/ListingContext';
import { WalletContext } from '@/context/WalletContext';
import { listingsService } from '@/services';
import { Listing } from '@/context/ListingContext';
import { ListingFormState, EditingState, ListingAnalytics, ListingDraft } from '@/types/myListings';
import { 
  INITIAL_FORM_STATE, 
  calculateAuctionEndTime 
} from '@/utils/myListingsUtils';
import { uploadMultipleToCloudinary } from '@/utils/cloudinary';
import { v4 as uuidv4 } from 'uuid';

export const useMyListings = () => {
  const { user } = useAuth();
  const { 
    listings = [], 
    addListing, 
    addAuctionListing, 
    removeListing, 
    updateListing, 
    cancelAuction,
    saveDraft: saveListingDraft,
    getDrafts: getListingDrafts,
    deleteDraft: deleteListingDraft,
    refreshListings,
    isLoading: listingsLoading,
    error: listingsError
  } = useListings();
  
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
  const [viewsLoading, setViewsLoading] = useState<Record<string, boolean>>({});
  
  // Draft state
  const [drafts, setDrafts] = useState<ListingDraft[]>([]);
  const [isDraftLoading, setIsDraftLoading] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  
  // Error state
  const [error, setError] = useState<string | null>(null);
  
  // Drag refs
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  
  // Track which listings we've loaded views for
  const loadedViewsRef = useRef<Set<string>>(new Set());

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

  // Load views data for all listings
  useEffect(() => {
    myListings.forEach(listing => {
      // Skip if already loaded
      if (loadedViewsRef.current.has(listing.id)) {
        return;
      }
      
      // Mark as loading/loaded
      loadedViewsRef.current.add(listing.id);
      
      // Load view count
      listingsService.getListingViews(listing.id)
        .then(result => {
          if (result.success && result.data !== undefined) {
            setViewsData(prev => ({ ...prev, [listing.id]: result.data as number }));
          }
        })
        .catch(error => {
          console.error(`Error loading views for listing ${listing.id}:`, error);
          // Remove from loaded set so it can be retried
          loadedViewsRef.current.delete(listing.id);
        });
    });
  }, [myListings]);

  // Load drafts
  useEffect(() => {
    const loadDrafts = async () => {
      if (!user || user.role !== 'seller') return;
      
      setIsDraftLoading(true);
      try {
        const userDrafts = await getListingDrafts();
        setDrafts(userDrafts);
      } catch (error) {
        console.error('Error loading drafts:', error);
      } finally {
        setIsDraftLoading(false);
      }
    };
    
    loadDrafts();
  }, [user, getListingDrafts]);

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
    // Return undefined when there's no error
    return undefined;
  }, [error]);

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
    setCurrentDraftId(null);
    setError(null);
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
    setError(null);
    
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
      setError(`Failed to upload images: ${errorMessage}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [selectedFiles, formState.imageUrls, updateFormState]);

  // Remove image URL
  const handleRemoveImageUrl = useCallback((urlToRemove: string) => {
    updateFormState({ imageUrls: formState.imageUrls.filter(url => url !== urlToRemove) });
  }, [formState.imageUrls, updateFormState]);

  // Handle image reorder
  const handleImageReorder = useCallback((dragIndex: number, dropIndex: number) => {
    const _imageUrls = [...formState.imageUrls];
    const draggedItemContent = _imageUrls[dragIndex];
    _imageUrls.splice(dragIndex, 1);
    _imageUrls.splice(dropIndex, 0, draggedItemContent);
    updateFormState({ imageUrls: _imageUrls });
  }, [formState.imageUrls, updateFormState]);

  // Save as draft
  const handleSaveDraft = useCallback(async () => {
    if (!user || user.role !== 'seller') return;
    
    setError(null);
    
    try {
      const draft: ListingDraft = {
        id: currentDraftId || uuidv4(),
        seller: user.username,
        formState: { ...formState },
        createdAt: currentDraftId ? drafts.find(d => d.id === currentDraftId)?.createdAt || new Date().toISOString() : new Date().toISOString(),
        lastModified: new Date().toISOString(),
        name: formState.title || 'Untitled Draft'
      };
      
      const success = await saveListingDraft(draft);
      
      if (success) {
        // Update local drafts
        setDrafts(prev => {
          const existing = prev.findIndex(d => d.id === draft.id);
          if (existing >= 0) {
            const updated = [...prev];
            updated[existing] = draft;
            return updated;
          } else {
            return [...prev, draft];
          }
        });
        
        setCurrentDraftId(draft.id);
        alert('Draft saved successfully!');
      } else {
        throw new Error('Failed to save draft');
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      setError('Failed to save draft. Please try again.');
    }
  }, [user, formState, currentDraftId, drafts, saveListingDraft]);

  // Load draft
  const handleLoadDraft = useCallback((draft: ListingDraft) => {
    setFormState(draft.formState);
    setCurrentDraftId(draft.id);
    setShowForm(true);
    setEditingState({ listingId: null, isEditing: false });
  }, []);

  // Delete draft
  const handleDeleteDraft = useCallback(async (draftId: string) => {
    if (confirm('Are you sure you want to delete this draft?')) {
      try {
        const success = await deleteListingDraft(draftId);
        if (success) {
          setDrafts(prev => prev.filter(d => d.id !== draftId));
          if (currentDraftId === draftId) {
            setCurrentDraftId(null);
          }
        }
      } catch (error) {
        console.error('Error deleting draft:', error);
        setError('Failed to delete draft');
      }
    }
  }, [currentDraftId, deleteListingDraft]);

  // Save listing
  const handleSaveListing = useCallback(async () => {
    const { title, description, imageUrls, isAuction, startingPrice, reservePrice, auctionDuration, price, tags, hoursWorn, isPremium } = formState;
    
    setError(null);
    
    if (!title || !description || imageUrls.length === 0) {
      setError('Please fill in all required fields (title, description) and add at least one image.');
      return;
    }

    if (isAuction) {
      if (!isVerified) {
        setError('You must be a verified seller to create auction listings.');
        return;
      }

      const startingBid = parseFloat(startingPrice);
      if (isNaN(startingBid) || startingBid <= 0) {
        setError('Please enter a valid starting bid for the auction.');
        return;
      }

      let reserveBid: number | undefined = undefined;
      if (reservePrice.trim() !== '') {
        reserveBid = parseFloat(reservePrice);
        if (isNaN(reserveBid) || reserveBid < startingBid) {
          setError('Reserve price must be equal to or greater than the starting bid.');
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

      try {
        await addAuctionListing(listingData, auctionSettings);
        
        // Delete draft if it was loaded
        if (currentDraftId) {
          await deleteListingDraft(currentDraftId);
          setDrafts(prev => prev.filter(d => d.id !== currentDraftId));
        }
        
        resetForm();
      } catch (error) {
        console.error('Error creating auction:', error);
        setError('Failed to create auction listing');
      }
    } else {
      const numericPrice = parseFloat(price);
      if (isNaN(numericPrice) || numericPrice <= 0) {
        setError('Please enter a valid price.');
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

      try {
        if (editingState.isEditing && editingState.listingId) {
          if (updateListing) {
            await updateListing(editingState.listingId, listingData);
          } else {
            console.error("updateListing function not available in context");
          }
        } else {
          await addListing(listingData);
        }
        
        // Delete draft if it was loaded
        if (currentDraftId) {
          await deleteListingDraft(currentDraftId);
          setDrafts(prev => prev.filter(d => d.id !== currentDraftId));
        }
        
        resetForm();
      } catch (error) {
        console.error('Error saving listing:', error);
        setError('Failed to save listing');
      }
    }
  }, [formState, editingState, user, isVerified, addListing, addAuctionListing, updateListing, currentDraftId, deleteListingDraft, resetForm]);

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
    setCurrentDraftId(null);
    
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
  const handleCancelAuction = useCallback(async (listingId: string) => {
    if (confirm('Are you sure you want to cancel this auction? This action cannot be undone.')) {
      try {
        const success = await cancelAuction(listingId);
        if (!success) {
          setError('Failed to cancel auction');
        }
      } catch (error) {
        console.error('Error cancelling auction:', error);
        setError('Failed to cancel auction');
      }
    }
  }, [cancelAuction]);

  // Handle delete listing
  const handleRemoveListing = useCallback(async (listingId: string) => {
    try {
      await removeListing(listingId);
    } catch (error) {
      console.error('Error removing listing:', error);
      setError('Failed to remove listing');
    }
  }, [removeListing]);

  // Get listing analytics
  const getListingAnalytics = useCallback((listing: Listing): ListingAnalytics => {
    const views = viewsData[listing.id] || 0;
    return { views };
  }, [viewsData]);

  // Drag handlers for direct use
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
    drafts,
    isDraftLoading,
    currentDraftId,
    error,
    isLoading: listingsLoading,
    
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
    removeListing: handleRemoveListing,
    getListingAnalytics,
    handleSaveDraft,
    handleLoadDraft,
    handleDeleteDraft,
    refreshListings,
    
    // Drag handlers for direct use
    handleDragStart,
    handleDragEnter,
    handleDrop,
  };
};
