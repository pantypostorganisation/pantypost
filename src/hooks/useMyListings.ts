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
import { uploadMultipleToCloudinary, checkCloudinaryConfig } from '@/utils/cloudinary';
import { v4 as uuidv4 } from 'uuid';
import { listingSchemas, financialSchemas } from '@/utils/validation/schemas';
import { sanitizeStrict, sanitizeNumber } from '@/utils/security/sanitization';
import { securityService } from '@/services';
import { z } from 'zod';
import { ApiResponse } from '@/services/api.config';

// Validation schema for listing form
const listingFormSchema = z.object({
  title: listingSchemas.title,
  description: listingSchemas.description,
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid price format'),
  isPremium: z.boolean(),
  tags: z.string(),
  hoursWorn: z.union([z.string(), z.number()]),
  isAuction: z.boolean(),
  startingPrice: z.string().optional(),
  reservePrice: z.string().optional(),
  auctionDuration: z.string()
});

// Sanitize listing form data
function sanitizeFormState(formState: ListingFormState): ListingFormState {
  return {
    ...formState,
    title: sanitizeStrict(formState.title),
    description: sanitizeStrict(formState.description),
    tags: formState.tags.split(',').map(tag => sanitizeStrict(tag.trim())).join(', '),
    price: formState.price, // Keep as string for form
    startingPrice: formState.startingPrice,
    reservePrice: formState.reservePrice,
    auctionDuration: formState.auctionDuration
  };
}

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
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // Drag refs
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  
  // Track which listings we've loaded views for
  const loadedViewsRef = useRef<Set<string>>(new Set());

  const isVerified = user?.isVerified || user?.verificationStatus === 'verified';
  const myListings = listings?.filter((listing: Listing) => listing.seller === user?.username) ?? [];
  
  // Calculate stats with validation
  const auctionCount = myListings.filter((listing: Listing) => !!listing.auction).length;
  const premiumCount = myListings.filter((listing: Listing) => listing.isPremium).length;
  const standardCount = Math.max(0, myListings.length - (premiumCount + auctionCount));
  
  // Check listing limits
  const maxListings = isVerified ? 25 : 2;
  const atLimit = myListings.length >= maxListings;
  
  // Get seller orders with sanitization
  const sellerOrders = orderHistory
    .filter(order => order.seller === user?.username)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map(order => ({
      ...order,
      title: sanitizeStrict(order.title || ''),
      buyer: sanitizeStrict(order.buyer || '')
    }));

  // Load views data for all listings
  useEffect(() => {
    myListings.forEach(listing => {
      // Skip if already loaded
      if (loadedViewsRef.current.has(listing.id)) {
        return;
      }
      
      // Mark as loading/loaded
      loadedViewsRef.current.add(listing.id);
      
      // Load view count with proper typing
      listingsService.getListingViews(listing.id)
        .then((result: ApiResponse<number>) => {
          if (result.success && result.data !== undefined) {
            const views = Math.max(0, parseInt(result.data.toString()) || 0);
            setViewsData(prev => ({ ...prev, [listing.id]: views }));
          }
        })
        .catch((error: any) => {
          console.error(`Error loading views for listing ${listing.id}:`, error);
          // Remove from loaded set so it can be retried
          loadedViewsRef.current.delete(listing.id);
        });
    });
  }, [myListings]);

  // Load drafts with sanitization
  useEffect(() => {
    const loadDrafts = async () => {
      if (!user || user.role !== 'seller') return;
      
      setIsDraftLoading(true);
      try {
        const userDrafts = await getListingDrafts();
        // Sanitize draft data
        const sanitizedDrafts = userDrafts.map(draft => ({
          ...draft,
          name: sanitizeStrict(draft.name || 'Untitled Draft'),
          formState: sanitizeFormState(draft.formState)
        }));
        setDrafts(sanitizedDrafts);
      } catch (error) {
        console.error('Error loading drafts:', error);
        setError('Failed to load drafts');
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

  // Update form state with sanitization
  const updateFormState = useCallback((updates: Partial<ListingFormState>) => {
    setFormState(prev => {
      const updated = { ...prev, ...updates };
      // Clear validation errors when fields change
      setValidationErrors({});
      return updated;
    });
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
    setValidationErrors({});
  }, []);

  // Handle file selection with validation
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const newFiles = Array.from(files);
    const validFiles: File[] = [];
    const errors: string[] = [];
    
    newFiles.forEach(file => {
      const validation = securityService.validateFileUpload(file, {
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
        allowedExtensions: ['jpg', 'jpeg', 'png', 'webp']
      });
      
      if (validation.valid) {
        validFiles.push(file);
      } else {
        errors.push(`${file.name}: ${validation.error}`);
      }
    });
    
    if (errors.length > 0) {
      setError(errors.join(', '));
    }
    
    setSelectedFiles(prev => [...prev, ...validFiles]);
    e.target.value = '';
  }, []);

  // Remove selected file
  const removeSelectedFile = useCallback((index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Upload files using Cloudinary
  const handleUploadFiles = useCallback(async () => {
    if (selectedFiles.length === 0) return;
    
    // Check Cloudinary configuration
    const cloudinaryCheck = checkCloudinaryConfig();
    if (!cloudinaryCheck.configured) {
      console.warn(cloudinaryCheck.message);
      // Show a user-friendly message
      if (!error) {
        setError('Using local image storage for development. Images will work but are stored in browser memory.');
        // Clear the error after 3 seconds
        setTimeout(() => setError(null), 3000);
      }
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Validate all files before upload
      for (const file of selectedFiles) {
        const validation = securityService.validateFileUpload(file);
        if (!validation.valid) {
          throw new Error(validation.error);
        }
      }
      
      // Upload to Cloudinary with progress tracking
      const uploadResults = await uploadMultipleToCloudinary(
        selectedFiles,
        (progress) => {
          setUploadProgress(Math.round(progress));
        }
      );
      
      // Extract and validate URLs
      const newImageUrls = uploadResults.map(result => {
        // Validate URL
        try {
          new URL(result.url);
          return result.url;
        } catch {
          throw new Error('Invalid image URL received from upload');
        }
      });
      
      // Update form state with new URLs
      updateFormState({ imageUrls: [...formState.imageUrls, ...newImageUrls] });
      setSelectedFiles([]);
      setUploadProgress(0);
      
      console.log('Images uploaded successfully');
    } catch (error) {
      console.error("Error uploading images:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(sanitizeStrict(`Failed to upload images: ${errorMessage}`));
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [selectedFiles, formState.imageUrls, updateFormState, error]);

  // Remove image URL
  const handleRemoveImageUrl = useCallback((urlToRemove: string) => {
    updateFormState({ imageUrls: formState.imageUrls.filter(url => url !== urlToRemove) });
  }, [formState.imageUrls, updateFormState]);

  // Handle image reorder
  const handleImageReorder = useCallback((dragIndex: number, dropIndex: number) => {
    if (dragIndex < 0 || dropIndex < 0 || dragIndex >= formState.imageUrls.length || dropIndex >= formState.imageUrls.length) {
      return;
    }
    
    const _imageUrls = [...formState.imageUrls];
    const draggedItemContent = _imageUrls[dragIndex];
    _imageUrls.splice(dragIndex, 1);
    _imageUrls.splice(dropIndex, 0, draggedItemContent);
    updateFormState({ imageUrls: _imageUrls });
  }, [formState.imageUrls, updateFormState]);

  // Save as draft with validation
  const handleSaveDraft = useCallback(async () => {
    if (!user || user.role !== 'seller') return;
    
    setError(null);
    
    try {
      // Sanitize form state before saving
      const sanitizedFormState = sanitizeFormState(formState);
      
      const draft: ListingDraft = {
        id: currentDraftId || uuidv4(),
        seller: user.username,
        formState: sanitizedFormState,
        createdAt: currentDraftId ? drafts.find(d => d.id === currentDraftId)?.createdAt || new Date().toISOString() : new Date().toISOString(),
        lastModified: new Date().toISOString(),
        name: sanitizeStrict(formState.title || 'Untitled Draft')
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
    // Sanitize draft data before loading
    const sanitizedFormState = sanitizeFormState(draft.formState);
    setFormState(sanitizedFormState);
    setCurrentDraftId(draft.id);
    setShowForm(true);
    setEditingState({ listingId: null, isEditing: false });
    setValidationErrors({});
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

  // Validate form data
  const validateFormData = useCallback((): boolean => {
    const errors: Record<string, string> = {};
    
    // Validate basic fields
    try {
      listingSchemas.title.parse(formState.title);
    } catch {
      errors.title = 'Title must be 5-100 characters';
    }
    
    try {
      listingSchemas.description.parse(formState.description);
    } catch {
      errors.description = 'Description must be 20-2000 characters';
    }
    
    if (formState.imageUrls.length === 0) {
      errors.images = 'At least one image is required';
    }
    
    // Validate price fields
    if (formState.isAuction) {
      const startingBid = parseFloat(formState.startingPrice);
      if (isNaN(startingBid) || startingBid < 0.01 || startingBid > 10000) {
        errors.startingPrice = 'Starting bid must be between $0.01 and $10,000';
      }
      
      if (formState.reservePrice.trim() !== '') {
        const reserveBid = parseFloat(formState.reservePrice);
        if (isNaN(reserveBid) || reserveBid < startingBid) {
          errors.reservePrice = 'Reserve price must be equal to or greater than starting bid';
        }
      }
    } else {
      const price = parseFloat(formState.price);
      if (isNaN(price) || price < 0.01 || price > 10000) {
        errors.price = 'Price must be between $0.01 and $10,000';
      }
    }
    
    // Validate hours worn
    if (formState.hoursWorn !== '') {
      const hours = parseInt(formState.hoursWorn.toString());
      if (isNaN(hours) || hours < 0 || hours > 168) {
        errors.hoursWorn = 'Hours worn must be between 0 and 168';
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formState]);

  // Save listing with validation and sanitization
  const handleSaveListing = useCallback(async () => {
    if (!validateFormData()) {
      setError('Please fix the validation errors');
      return;
    }
    
    const { title, description, imageUrls, isAuction, startingPrice, reservePrice, auctionDuration, price, tags, hoursWorn, isPremium } = formState;
    
    setError(null);
    
    try {
      // Sanitize all inputs
      const sanitizedTitle = sanitizeStrict(title);
      const sanitizedDescription = sanitizeStrict(description);
      const tagsList = tags.split(',').map(tag => sanitizeStrict(tag.trim())).filter(tag => tag);
      
      if (isAuction) {
        if (!isVerified) {
          setError('You must be a verified seller to create auction listings.');
          return;
        }

        const startingBid = sanitizeNumber(startingPrice, 0.01, 10000);
        let reserveBid: number | undefined = undefined;
        
        if (reservePrice.trim() !== '') {
          reserveBid = sanitizeNumber(reservePrice, startingBid, 10000);
        }

        const listingData = {
          title: sanitizedTitle,
          description: sanitizedDescription,
          price: startingBid,
          imageUrls,
          seller: user?.username || 'unknown',
          isPremium,
          tags: tagsList,
          hoursWorn: hoursWorn === '' ? undefined : sanitizeNumber(hoursWorn.toString(), 0, 168),
        };

        const auctionSettings = {
          startingPrice: startingBid,
          reservePrice: reserveBid,
          endTime: calculateAuctionEndTime(auctionDuration)
        };

        await addAuctionListing(listingData, auctionSettings);
        
        // Delete draft if it was loaded
        if (currentDraftId) {
          await deleteListingDraft(currentDraftId);
          setDrafts(prev => prev.filter(d => d.id !== currentDraftId));
        }
        
        resetForm();
      } else {
        const numericPrice = sanitizeNumber(price, 0.01, 10000);

        const listingData = {
          title: sanitizedTitle,
          description: sanitizedDescription,
          price: numericPrice,
          imageUrls,
          seller: user?.username || 'unknown',
          isPremium,
          tags: tagsList,
          hoursWorn: hoursWorn === '' ? undefined : sanitizeNumber(hoursWorn.toString(), 0, 168),
        };

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
      }
    } catch (error) {
      console.error('Error saving listing:', error);
      setError('Failed to save listing. Please try again.');
    }
  }, [formState, editingState, user, isVerified, addListing, addAuctionListing, updateListing, currentDraftId, deleteListingDraft, resetForm, validateFormData]);

  // Handle edit click with sanitization
  const handleEditClick = useCallback((listing: Listing) => {
    setEditingState({ listingId: listing.id, isEditing: true });
    setFormState({
      title: sanitizeStrict(listing.title),
      description: sanitizeStrict(listing.description),
      price: listing.price.toString(),
      imageUrls: listing.imageUrls || [],
      isPremium: listing.isPremium ?? false,
      tags: listing.tags ? listing.tags.map(tag => sanitizeStrict(tag)).join(', ') : '',
      hoursWorn: listing.hoursWorn !== undefined && listing.hoursWorn !== null ? listing.hoursWorn : '',
      isAuction: !!listing.auction,
      startingPrice: listing.auction?.startingPrice.toString() || '',
      reservePrice: listing.auction?.reservePrice?.toString() || '',
      auctionDuration: listing.auction ? '1' : '1'
    });
    setSelectedFiles([]);
    setShowForm(true);
    setCurrentDraftId(null);
    setValidationErrors({});
    
    // Handle auction data if present
    if (listing.auction) {
      // Calculate remaining days for auction
      const endTime = new Date(listing.auction.endTime);
      const now = new Date();
      const daysRemaining = Math.ceil((endTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      updateFormState({ auctionDuration: Math.max(1, Math.min(7, daysRemaining)).toString() });
    }
  }, [updateFormState]);

  // Handle cancel auction
  const handleCancelAuction = useCallback(async (listingId: string) => {
    // Remove confirmation here - it's handled in the component
    try {
      const success = await cancelAuction(listingId);
      if (!success) {
        setError('Failed to cancel auction');
      }
    } catch (error) {
      console.error('Error cancelling auction:', error);
      setError('Failed to cancel auction');
    }
  }, [cancelAuction]);

  // Handle delete listing - FIXED: Removed duplicate confirmation
  const handleRemoveListing = useCallback(async (listingId: string) => {
    // No confirmation here - it's already handled in the ListingCard component
    try {
      await removeListing(listingId);
    } catch (error) {
      console.error('Error removing listing:', error);
      setError('Failed to remove listing');
    }
  }, [removeListing]);

  // Get listing analytics
  const getListingAnalytics = useCallback((listing: Listing): ListingAnalytics => {
    const views = Math.max(0, viewsData[listing.id] || 0);
    return { views };
  }, [viewsData]);

  // Drag handlers for direct use
  const handleDragStart = useCallback((index: number) => {
    if (index >= 0 && index < formState.imageUrls.length) {
      dragItem.current = index;
    }
  }, [formState.imageUrls.length]);

  const handleDragEnter = useCallback((index: number) => {
    if (index >= 0 && index < formState.imageUrls.length) {
      dragOverItem.current = index;
    }
  }, [formState.imageUrls.length]);

  const handleDrop = useCallback(() => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    
    if (dragItem.current < 0 || dragOverItem.current < 0 || 
        dragItem.current >= formState.imageUrls.length || 
        dragOverItem.current >= formState.imageUrls.length) {
      return;
    }
    
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
    validationErrors,
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
