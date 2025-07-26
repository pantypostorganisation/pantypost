// src/context/ListingContext.tsx
'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import { useWallet } from './WalletContext';
import { useAuth } from './AuthContext';
import { useAuction } from './AuctionContext';
import { Order } from './WalletContext';
import { v4 as uuidv4 } from 'uuid';
import { getSellerTierMemoized } from '@/utils/sellerTiers';
import { listingsService, usersService, storageService, ordersService } from '@/services';
import { ListingDraft } from '@/types/myListings';
import { securityService, sanitize } from '@/services/security.service';
import { listingSchemas, financialSchemas, fileSchemas } from '@/utils/validation/schemas';

export type Role = 'buyer' | 'seller' | 'admin';

export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

export type VerificationDocs = {
  codePhoto?: string;
  idFront?: string;
  idBack?: string;
  passport?: string;
  code?: string;
};

export type Bid = {
  id: string;
  bidder: string;
  amount: number;
  date: string;
};

export type AuctionStatus = 'active' | 'ended' | 'cancelled';

export type AuctionSettings = {
  isAuction: boolean;
  startingPrice: number;
  reservePrice?: number;
  endTime: string;
  bids: Bid[];
  highestBid?: number;
  highestBidder?: string;
  status: AuctionStatus;
  minimumIncrement?: number;
};

export type Listing = {
  id: string;
  title: string;
  description: string;
  price: number;
  markedUpPrice: number;
  imageUrls: string[];
  date: string;
  seller: string;

  isVerified?: boolean;
  isPremium?: boolean;
  tags?: string[];
  hoursWorn?: number;
  
  auction?: AuctionSettings;
};

export type NewListingInput = Omit<Listing, 'id' | 'date' | 'markedUpPrice'>;
export type AddListingInput = Omit<Listing, 'id' | 'date' | 'markedUpPrice'>;

export type AuctionInput = {
  startingPrice: number;
  reservePrice?: number;
  endTime: string;
};

export type Notification = {
  id: string;
  message: string;
  timestamp: string;
  cleared: boolean;
};

export type NotificationItem = string | Notification;

type NotificationStore = Record<string, NotificationItem[]>;

// Add subscription details interface
interface SubscriptionData {
  seller: string;
  price: number;
  subscribedAt: string;
}

type ListingContextType = {
  isAuthReady: boolean;
  listings: Listing[];
  addListing: (listing: AddListingInput) => Promise<void>;
  addAuctionListing: (listing: AddListingInput, auctionSettings: AuctionInput) => Promise<void>;
  removeListing: (id: string) => Promise<void>;
  updateListing: (id: string, updatedListing: Partial<Omit<Listing, 'id' | 'date' | 'markedUpPrice'>>) => Promise<void>;
  purchaseListingAndRemove: (listing: Listing, buyerUsername: string) => Promise<boolean>;
  
  // Auction functions
  placeBid: (listingId: string, bidder: string, amount: number) => Promise<boolean>;
  getAuctionListings: () => Listing[];
  getActiveAuctions: () => Listing[];
  getEndedAuctions: () => Listing[];
  checkEndedAuctions: () => Promise<void>;
  cancelAuction: (listingId: string) => Promise<boolean>;
  
  // Draft functions
  saveDraft: (draft: ListingDraft) => Promise<boolean>;
  getDrafts: () => Promise<ListingDraft[]>;
  deleteDraft: (draftId: string) => Promise<boolean>;
  
  // Image functions
  uploadImage: (file: File) => Promise<string | null>;
  deleteImage: (imageUrl: string) => Promise<boolean>;
  
  subscriptions: { [buyer: string]: string[] };
  subscribeToSeller: (buyer: string, seller: string, price: number) => Promise<boolean>;
  unsubscribeFromSeller: (buyer: string, seller: string) => Promise<void>;
  isSubscribed: (buyer: string, seller: string) => boolean;
  
  // Updated notification system
  sellerNotifications: Notification[];
  addSellerNotification: (seller: string, message: string) => void;
  clearSellerNotification: (notificationId: string | number) => void;
  restoreSellerNotification: (notificationId: string) => void;
  permanentlyDeleteSellerNotification: (notificationId: string) => void;

  requestVerification: (docs: VerificationDocs) => Promise<void>;
  setVerificationStatus: (username: string, status: VerificationStatus, rejectionReason?: string) => Promise<void>;
  
  users: { [username: string]: any };
  
  orderHistory: Order[];
  
  // Loading and error states
  isLoading: boolean;
  error: string | null;
  refreshListings: () => Promise<void>;
};

const ListingContext = createContext<ListingContextType | undefined>(undefined);

export const ListingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, updateUser } = useAuth();
  
  const [users, setUsers] = useState<{ [username: string]: any }>({});
  const [listings, setListings] = useState<Listing[]>([]);
  const [subscriptions, setSubscriptions] = useState<{ [buyer: string]: string[] }>({});
  const [notificationStore, setNotificationStore] = useState<NotificationStore>({});
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper function to normalize notification items to the new format
  const normalizeNotification = (item: NotificationItem): Notification => {
    if (typeof item === 'string') {
      return {
        id: uuidv4(),
        message: sanitize.strict(item), // Sanitize message
        timestamp: new Date().toISOString(),
        cleared: false
      };
    }
    return {
      ...item,
      message: sanitize.strict(item.message) // Sanitize message
    };
  };

  // Helper function to save notification store
  const saveNotificationStore = async (store: NotificationStore) => {
    await storageService.setItem('seller_notifications_store', store);
  };

  // Memoized notification function to avoid infinite render loop
  const addSellerNotification = useCallback((seller: string, message: string) => {
    if (!seller) {
      console.warn("Attempted to add notification without seller ID");
      return;
    }
    
    // Sanitize the notification message
    const sanitizedMessage = sanitize.strict(message);
    
    const newNotification: Notification = {
      id: uuidv4(),
      message: sanitizedMessage,
      timestamp: new Date().toISOString(),
      cleared: false
    };
    
    setNotificationStore(prev => {
      const sellerNotifications = prev[seller] || [];
      const updated = {
        ...prev,
        [seller]: [...sellerNotifications, newNotification]
      };
      saveNotificationStore(updated);
      return updated;
    });
  }, []);

  const { 
    subscribeToSellerWithPayment, 
    setAddSellerNotificationCallback, 
    purchaseListing, 
    orderHistory
  } = useWallet();

  // Get auction functions from AuctionContext
  const {
    placeBid: auctionPlaceBid,
    cancelAuction: auctionCancelAuction,
    processEndedAuction
  } = useAuction();

  // On mount, set the notification callback in WalletContext
  useEffect(() => {
    if (setAddSellerNotificationCallback) {
      setAddSellerNotificationCallback(addSellerNotification);
    }
  }, [setAddSellerNotificationCallback, addSellerNotification]);

  // Listen for notification changes in localStorage (for header live updates)
  useEffect(() => {
    function handleStorageChange(e: StorageEvent) {
      if (e.key === 'seller_notifications_store') {
        try {
          setNotificationStore(JSON.parse(e.newValue || '{}'));
        } catch {
          setNotificationStore({});
        }
      }
    }
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Migration function to convert old notifications to new format
  const migrateNotifications = (notifications: NotificationItem[]): Notification[] => {
    return notifications.map(normalizeNotification);
  };

  // Load initial data using services
  const loadData = useCallback(async () => {
    if (typeof window === 'undefined') return;

    setIsLoading(true);
    setError(null);

    try {
      // Load users
      const usersResult = await usersService.getUsers();
      if (usersResult.success && usersResult.data) {
        setUsers(usersResult.data);
      }

      // Load listings using the service
      const listingsResult = await listingsService.getListings();
      if (listingsResult.success && listingsResult.data) {
        setListings(listingsResult.data);
      } else {
        throw new Error(listingsResult.error?.message || 'Failed to load listings');
      }

      // Load subscriptions
      const storedSubs = await storageService.getItem<{ [buyer: string]: string[] }>('subscriptions', {});
      setSubscriptions(storedSubs);

      // Load notifications
      const storedNotifications = await storageService.getItem<NotificationStore>('seller_notifications_store', {});
      const migrated: NotificationStore = {};
      Object.keys(storedNotifications).forEach(username => {
        if (Array.isArray(storedNotifications[username])) {
          migrated[username] = migrateNotifications(storedNotifications[username]);
        }
      });
      setNotificationStore(migrated);
      await saveNotificationStore(migrated);

      setIsAuthReady(true);
    } catch (error) {
      console.error('Error loading ListingContext data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
      setIsAuthReady(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Refresh listings
  const refreshListings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const listingsResult = await listingsService.getListings();
      if (listingsResult.success && listingsResult.data) {
        setListings(listingsResult.data);
      } else {
        throw new Error(listingsResult.error?.message || 'Failed to refresh listings');
      }
    } catch (error) {
      console.error('Error refreshing listings:', error);
      setError(error instanceof Error ? error.message : 'Failed to refresh listings');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check for ended auctions on load and at regular intervals
  useEffect(() => {
    checkEndedAuctions();
    
    const interval = setInterval(() => {
      checkEndedAuctions();
    }, 60000);
    
    return () => clearInterval(interval);
  }, [listings]);

  const persistUsers = async (updated: { [username: string]: any }) => {
    setUsers(updated);
    await storageService.setItem('all_users_v2', updated);
  };

  // Use listings service for adding listings
  const addListing = async (listing: NewListingInput): Promise<void> => {
    console.log('🔍 addListing called with user:', user);
    
    if (!user || user.role !== 'seller') {
      console.error('❌ addListing failed: user is not a seller', { user: user?.username, role: user?.role });
      alert('You must be logged in as a seller to create listings.');
      return;
    }

    // Validate and sanitize listing data
    const validationResult = securityService.validateAndSanitize(
      {
        title: listing.title,
        description: listing.description,
        price: listing.price,
        tags: listing.tags,
        hoursWorn: listing.hoursWorn
      },
      listingSchemas.createListingSchema.pick({
        title: true,
        description: true,
        price: true,
        tags: true,
        wearDuration: true
      }),
      {
        title: sanitize.strict,
        description: sanitize.strict,
        tags: (tags: string[]) => tags?.map(tag => sanitize.strict(tag))
      }
    );

    if (!validationResult.success) {
      console.error('Validation failed:', validationResult.errors);
      alert('Please check your listing details:\n' + Object.values(validationResult.errors || {}).join('\n'));
      return;
    }

    const myListings = listings.filter(l => l.seller === user.username);
    const isVerified = user.isVerified || user.verificationStatus === 'verified';
    const maxListings = isVerified ? 25 : 2;

    console.log('📊 Listing check:', {
      currentListings: myListings.length,
      maxListings,
      isVerified,
      username: user.username
    });

    if (myListings.length >= maxListings) {
      alert(
        isVerified
          ? 'You have reached the maximum of 25 listings for verified sellers.'
          : 'Unverified sellers can only have 2 active listings. Please verify your account to add more.'
      );
      return;
    }

    try {
      const sanitizedListing = {
        ...listing,
        title: validationResult.data!.title,
        description: validationResult.data!.description,
        price: validationResult.data!.price,
        tags: validationResult.data!.tags,
        hoursWorn: validationResult.data!.wearDuration,
        seller: user.username,
        isVerified: isVerified,
      };

      const result = await listingsService.createListing(sanitizedListing);

      if (result.success && result.data) {
        setListings(prev => [...prev, result.data!]);
        console.log('✅ Created new listing:', result.data);
        window.dispatchEvent(new CustomEvent('listingCreated', { detail: { listing: result.data } }));
      } else {
        console.error('Failed to create listing:', result.error);
        alert(result.error?.message || 'Failed to create listing. Please try again.');
      }
    } catch (error) {
      console.error('Error creating listing:', error);
      alert('An error occurred while creating the listing.');
    }
  };

  // Add an auction listing
  const addAuctionListing = async (listing: AddListingInput, auctionSettings: AuctionInput): Promise<void> => {
    if (!user || user.role !== 'seller') {
      alert('You must be logged in as a seller to create auction listings.');
      return;
    }

    // Validate and sanitize listing data
    const listingValidation = securityService.validateAndSanitize(
      {
        title: listing.title,
        description: listing.description,
        price: listing.price,
        tags: listing.tags,
        hoursWorn: listing.hoursWorn
      },
      listingSchemas.createListingSchema.pick({
        title: true,
        description: true,
        price: true,
        tags: true,
        wearDuration: true
      }),
      {
        title: sanitize.strict,
        description: sanitize.strict,
        tags: (tags: string[]) => tags?.map(tag => sanitize.strict(tag))
      }
    );

    if (!listingValidation.success) {
      console.error('Listing validation failed:', listingValidation.errors);
      alert('Please check your listing details:\n' + Object.values(listingValidation.errors || {}).join('\n'));
      return;
    }

    // Validate auction settings
    const amountValidation = securityService.validateAmount(auctionSettings.startingPrice, {
      min: 0.01,
      max: 10000
    });

    if (!amountValidation.valid) {
      alert(amountValidation.error || 'Invalid starting price');
      return;
    }

    if (auctionSettings.reservePrice) {
      const reserveValidation = securityService.validateAmount(auctionSettings.reservePrice, {
        min: auctionSettings.startingPrice,
        max: 10000
      });

      if (!reserveValidation.valid) {
        alert('Reserve price must be at least the starting price');
        return;
      }
    }

    const myListings = listings.filter(l => l.seller === user.username);
    const isVerified = user.isVerified || user.verificationStatus === 'verified';
    const maxListings = isVerified ? 25 : 2;

    if (myListings.length >= maxListings) {
      alert(
        isVerified
          ? 'You have reached the maximum of 25 listings for verified sellers.'
          : 'Unverified sellers can only have 2 active listings. Please verify your account to add more.'
      );
      return;
    }

    try {
      const sanitizedListing = {
        ...listing,
        title: listingValidation.data!.title,
        description: listingValidation.data!.description,
        price: listingValidation.data!.price,
        tags: listingValidation.data!.tags,
        hoursWorn: listingValidation.data!.wearDuration,
        seller: user.username,
        isVerified: isVerified,
        auction: auctionSettings,
      };

      const result = await listingsService.createListing(sanitizedListing);

      if (result.success && result.data) {
        setListings(prev => [...prev, result.data!]);
        
        addSellerNotification(
          user.username,
          `🔨 You've created a new auction: "${sanitizedListing.title}" starting at $${auctionSettings.startingPrice.toFixed(2)}`
        );
        window.dispatchEvent(new CustomEvent('listingCreated', { detail: { listing: result.data } }));
      } else {
        alert(result.error?.message || 'Failed to create auction listing. Please try again.');
      }
    } catch (error) {
      console.error('Error creating auction listing:', error);
      alert('An error occurred while creating the auction listing.');
    }
  };

  const removeListing = async (id: string): Promise<void> => {
    try {
      const result = await listingsService.deleteListing(id);
      if (result.success) {
        setListings(prev => prev.filter(listing => listing.id !== id));
        window.dispatchEvent(new CustomEvent('listingDeleted', { detail: { listingId: id } }));
      } else {
        throw new Error(result.error?.message || 'Failed to delete listing');
      }
    } catch (error) {
      console.error('Error removing listing:', error);
      alert(error instanceof Error ? error.message : 'Failed to remove listing');
    }
  };

  const purchaseListingAndRemove = async (listing: Listing, buyerUsername: string): Promise<boolean> => {
    try {
      // Sanitize buyer username
      const sanitizedBuyer = sanitize.username(buyerUsername);
      
      // First, process the purchase through wallet
      const success = await purchaseListing(listing, sanitizedBuyer);
      
      if (success) {
        // If purchase was successful, remove the listing
        await removeListing(listing.id);
        
        console.log('✅ Listing purchased and removed:', listing.id);
      }
      
      return success;
    } catch (error) {
      console.error('Error in purchaseListingAndRemove:', error);
      return false;
    }
  };

  const updateListing = async (id: string, updatedListing: Partial<Omit<Listing, 'id' | 'date' | 'markedUpPrice'>>): Promise<void> => {
    try {
      // Sanitize updated fields if they exist
      const sanitizedUpdate: any = { ...updatedListing };
      
      if (updatedListing.title) {
        sanitizedUpdate.title = sanitize.strict(updatedListing.title);
      }
      if (updatedListing.description) {
        sanitizedUpdate.description = sanitize.strict(updatedListing.description);
      }
      if (updatedListing.tags) {
        sanitizedUpdate.tags = updatedListing.tags.map(tag => sanitize.strict(tag));
      }
      
      const result = await listingsService.updateListing(id, sanitizedUpdate);
      if (result.success && result.data) {
        setListings(prev => prev.map(listing => 
          listing.id === id ? result.data! : listing
        ));
      } else {
        throw new Error(result.error?.message || 'Failed to update listing');
      }
    } catch (error) {
      console.error('Error updating listing:', error);
      alert(error instanceof Error ? error.message : 'Failed to update listing');
    }
  };

  // NEW: Use AuctionContext for placing bids
  const placeBid = async (listingId: string, bidder: string, amount: number): Promise<boolean> => {
    try {
      const listing = listings.find(l => l.id === listingId);
      if (!listing) {
        console.error('[ListingContext] Listing not found:', listingId);
        return false;
      }

      // Delegate to AuctionContext
      const success = await auctionPlaceBid(listingId, bidder, amount);
      
      if (success) {
        // Refresh listings to get updated bid info
        await refreshListings();
        
        // Add seller notification
        addSellerNotification(
          listing.seller,
          `💰 New bid! ${bidder} bid $${amount.toFixed(2)} on "${listing.title}"`
        );
      }
      
      return success;
    } catch (error) {
      console.error('[ListingContext] Bid error:', error);
      return false;
    }
  };

  const getAuctionListings = (): Listing[] => {
    return listings.filter(listing => listing.auction?.isAuction);
  };

  const getActiveAuctions = (): Listing[] => {
    return listings.filter(listing => 
      listing.auction?.isAuction && 
      listing.auction.status === 'active'
    );
  };

  const getEndedAuctions = (): Listing[] => {
    return listings.filter(listing => 
      listing.auction?.isAuction && 
      listing.auction.status === 'ended'
    );
  };

  // NEW: Use AuctionContext for processing ended auctions
  const checkEndedAuctions = async (): Promise<void> => {
    const activeAuctions = getActiveAuctions();
    const now = new Date();
    
    for (const listing of activeAuctions) {
      if (listing.auction && new Date(listing.auction.endTime) <= now) {
        const processed = await processEndedAuction(listing);
        
        if (processed) {
          // Update listing status locally
          setListings(prev => prev.map(l => 
            l.id === listing.id 
              ? { ...l, auction: { ...l.auction!, status: 'ended' as AuctionStatus } }
              : l
          ));
          
          // Remove the listing if it was sold
          if (listing.auction.highestBidder) {
            setListings(prev => prev.filter(l => l.id !== listing.id));
          }
          
          // Notify seller
          if (listing.auction.highestBidder) {
            addSellerNotification(
              listing.seller,
              `🏆 Auction ended: "${listing.title}" sold to ${listing.auction.highestBidder} for $${listing.auction.highestBid?.toFixed(2)}`
            );
          } else {
            addSellerNotification(
              listing.seller,
              `🔨 Auction ended: No valid bids for "${listing.title}"`
            );
          }
        }
      }
    }
  };

  // NEW: Use AuctionContext for cancelling auctions
  const cancelAuction = async (listingId: string): Promise<boolean> => {
    if (!user) return false;
    
    const listing = listings.find(l => l.id === listingId);
    if (!listing) return false;
    
    if (user.role !== 'admin' && user.username !== listing.seller) return false;
    
    const success = await auctionCancelAuction(listingId);
    
    if (success) {
      // Update listing locally
      setListings(prev => prev.map(l => 
        l.id === listingId 
          ? { ...l, auction: { ...l.auction!, status: 'cancelled' as AuctionStatus } }
          : l
      ));
      
      addSellerNotification(
        listing.seller,
        `🛑 You cancelled your auction: "${listing.title}". All bidders have been refunded.`
      );
    }
    
    return success;
  };

  // Draft management functions
  const saveDraft = async (draft: ListingDraft): Promise<boolean> => {
    if (!user || user.role !== 'seller') {
      console.error('Only sellers can save drafts');
      return false;
    }

    try {
      // Sanitize draft fields - Access from formState
      const sanitizedDraft = {
        ...draft,
        formState: {
          ...draft.formState,
          title: draft.formState.title ? sanitize.strict(draft.formState.title) : '',
          description: draft.formState.description ? sanitize.strict(draft.formState.description) : '',
          tags: draft.formState.tags ? sanitize.strict(draft.formState.tags) : ''
        },
        seller: user.username,
      };

      const result = await listingsService.saveDraft(sanitizedDraft);
      return result.success;
    } catch (error) {
      console.error('Error saving draft:', error);
      return false;
    }
  };

  const getDrafts = async (): Promise<ListingDraft[]> => {
    if (!user || user.role !== 'seller') {
      return [];
    }

    try {
      const result = await listingsService.getDrafts(user.username);
      return result.success && result.data ? result.data : [];
    } catch (error) {
      console.error('Error getting drafts:', error);
      return [];
    }
  };

  const deleteDraft = async (draftId: string): Promise<boolean> => {
    try {
      const result = await listingsService.deleteDraft(draftId);
      return result.success;
    } catch (error) {
      console.error('Error deleting draft:', error);
      return false;
    }
  };

  // Image management functions
  const uploadImage = async (file: File): Promise<string | null> => {
    // Validate file before upload
    const fileValidation = securityService.validateFileUpload(file, {
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
      allowedExtensions: ['jpg', 'jpeg', 'png', 'webp']
    });

    if (!fileValidation.valid) {
      alert(fileValidation.error || 'Invalid file');
      return null;
    }

    try {
      const result = await listingsService.uploadImage(file);
      return result.success && result.data ? result.data : null;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const deleteImage = async (imageUrl: string): Promise<boolean> => {
    try {
      // Validate URL before deletion
      const sanitizedUrl = sanitize.url(imageUrl);
      if (!sanitizedUrl) {
        console.error('Invalid image URL');
        return false;
      }

      const result = await listingsService.deleteImage(sanitizedUrl);
      return result.success;
    } catch (error) {
      console.error('Error deleting image:', error);
      return false;
    }
  };

  const subscribeToSeller = async (buyer: string, seller: string, price: number): Promise<boolean> => {
    // Validate subscription price
    const priceValidation = securityService.validateAmount(price, {
      min: 0.01,
      max: 1000
    });

    if (!priceValidation.valid) {
      console.error('Invalid subscription price:', priceValidation.error);
      return false;
    }

    // Sanitize usernames
    const sanitizedBuyer = sanitize.username(buyer);
    const sanitizedSeller = sanitize.username(seller);

    const success = await subscribeToSellerWithPayment(sanitizedBuyer, sanitizedSeller, price);
    if (success) {
      setSubscriptions((prev) => {
        const updated = {
          ...prev,
          [sanitizedBuyer]: [...(prev[sanitizedBuyer] || []), sanitizedSeller],
        };
        storageService.setItem('subscriptions', updated);
        return updated;
      });
      
      // NEW: Store subscription details with the actual price paid
      const subscriptionDetails = await storageService.getItem<Record<string, SubscriptionData[]>>('subscription_details', {});
      const buyerSubs = subscriptionDetails[sanitizedBuyer] || [];
      
      // Remove any existing subscription to this seller
      const filteredSubs = buyerSubs.filter(sub => sub.seller !== sanitizedSeller);
      
      // Add new subscription with price
      filteredSubs.push({
        seller: sanitizedSeller,
        price: price,
        subscribedAt: new Date().toISOString()
      });
      
      subscriptionDetails[sanitizedBuyer] = filteredSubs;
      await storageService.setItem('subscription_details', subscriptionDetails);
      
      addSellerNotification(
        sanitizedSeller,
        `🎉 ${sanitizedBuyer} subscribed to you!`
      );
    }
    return success;
  };

  const unsubscribeFromSeller = async (buyer: string, seller: string): Promise<void> => {
    // Sanitize usernames
    const sanitizedBuyer = sanitize.username(buyer);
    const sanitizedSeller = sanitize.username(seller);

    setSubscriptions((prev) => {
      const updated = {
        ...prev,
        [sanitizedBuyer]: (prev[sanitizedBuyer] || []).filter((s) => s !== sanitizedSeller),
      };
      storageService.setItem('subscriptions', updated);
      return updated;
    });
    
    // NEW: Also remove from subscription details
    const subscriptionDetails = await storageService.getItem<Record<string, SubscriptionData[]>>('subscription_details', {});
    const buyerSubs = subscriptionDetails[sanitizedBuyer] || [];
    const filteredSubs = buyerSubs.filter(sub => sub.seller !== sanitizedSeller);
    subscriptionDetails[sanitizedBuyer] = filteredSubs;
    await storageService.setItem('subscription_details', subscriptionDetails);
  };

  const isSubscribed = (buyer: string, seller: string): boolean => {
    // Sanitize usernames
    const sanitizedBuyer = sanitize.username(buyer);
    const sanitizedSeller = sanitize.username(seller);
    
    return subscriptions[sanitizedBuyer]?.includes(sanitizedSeller) ?? false;
  };

  const getCurrentSellerNotifications = (): Notification[] => {
    if (!user || user.role !== 'seller') {
      return [];
    }
    const userNotifications = notificationStore[user.username] || [];
    return userNotifications.map(normalizeNotification);
  };

  const clearSellerNotification = (notificationId: string | number) => {
    if (!user || user.role !== 'seller') {
      return;
    }

    const username = user.username;
    const userNotifications = notificationStore[username] || [];

    setNotificationStore(prev => {
      const updatedNotifications = userNotifications.map((item, index) => {
        const notification = normalizeNotification(item);
        
        const shouldClear = typeof notificationId === 'string' 
          ? notification.id === notificationId
          : index === notificationId;
          
        if (shouldClear) {
          return {
            ...notification,
            cleared: true
          };
        }
        return notification;
      });

      const updated = {
        ...prev,
        [username]: updatedNotifications
      };
      saveNotificationStore(updated);
      return updated;
    });
  };

  const restoreSellerNotification = (notificationId: string) => {
    if (!user || user.role !== 'seller') {
      return;
    }

    const username = user.username;
    const userNotifications = notificationStore[username] || [];

    setNotificationStore(prev => {
      const updatedNotifications = userNotifications.map(item => {
        const notification = normalizeNotification(item);
        if (notification.id === notificationId) {
          return {
            ...notification,
            cleared: false
          };
        }
        return notification;
      });

      const updated = {
        ...prev,
        [username]: updatedNotifications
      };
      saveNotificationStore(updated);
      return updated;
    });
  };

  const permanentlyDeleteSellerNotification = (notificationId: string) => {
    if (!user || user.role !== 'seller') {
      return;
    }

    const username = user.username;
    const userNotifications = notificationStore[username] || [];

    setNotificationStore(prev => {
      const updatedNotifications = userNotifications.filter(item => {
        const notification = normalizeNotification(item);
        return notification.id !== notificationId;
      });

      const updated = {
        ...prev,
        [username]: updatedNotifications
      };
      saveNotificationStore(updated);
      return updated;
    });
  };

  const requestVerification = async (docs: VerificationDocs): Promise<void> => {
    if (!user) return;
    
    console.log('🔍 requestVerification called with user:', user.username);
    
    const code = docs.code || `VERIF-${user.username}-${Math.floor(100000 + Math.random() * 900000)}`;
    
    try {
      const result = await usersService.requestVerification(user.username, { ...docs, code });
      
      if (result.success) {
        await updateUser({
          verificationStatus: 'pending',
          verificationRequestedAt: new Date().toISOString(),
          verificationDocs: { ...docs, code },
        });
        
        // Also update the legacy users store for admin functionality
        const updatedUser = {
          ...user,
          verificationStatus: 'pending' as VerificationStatus,
          verificationDocs: { ...docs, code },
          verificationRequestedAt: new Date().toISOString(),
        };
        
        await persistUsers({
          ...users,
          [user.username]: updatedUser,
        });
        
        console.log('✅ Verification request submitted for:', user.username);
      } else {
        console.error('Failed to submit verification request:', result.error);
        alert('Failed to submit verification request. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting verification request:', error);
      alert('An error occurred while submitting verification request.');
    }
  };

  const setVerificationStatus = async (
    username: string,
    status: VerificationStatus,
    rejectionReason?: string
  ): Promise<void> => {
    // Sanitize inputs
    const sanitizedUsername = sanitize.username(username);
    const sanitizedReason = rejectionReason ? sanitize.strict(rejectionReason) : undefined;

    const existingUser = users[sanitizedUsername];
    if (!existingUser) return;
    
    try {
      const result = await usersService.updateVerificationStatus(sanitizedUsername, {
        status,
        rejectionReason: sanitizedReason,
        adminUsername: user?.username || 'admin',
      });
      
      if (result.success) {
        const updatedUser = {
          ...existingUser,
          verificationStatus: status,
          verified: status === 'verified',
          verificationReviewedAt: new Date().toISOString(),
          verificationRejectionReason: sanitizedReason,
        };
        
        // Also update AuthContext if this is the current user
        if (user?.username === sanitizedUsername) {
          await updateUser({
            verificationStatus: status,
            isVerified: status === 'verified',
            verificationRejectionReason: sanitizedReason,
          });
        }
        
        await persistUsers({
          ...users,
          [sanitizedUsername]: updatedUser,
        });

        setListings(prev => {
          return prev.map(listing => {
            if (listing.seller === sanitizedUsername) {
              return { ...listing, isVerified: status === 'verified' };
            }
            return listing;
          });
        });
      } else {
        console.error('Failed to update verification status:', result.error);
        alert('Failed to update verification status. Please try again.');
      }
    } catch (error) {
      console.error('Error updating verification status:', error);
      alert('An error occurred while updating verification status.');
    }
  };

  const sellerNotifications = getCurrentSellerNotifications();
  
  return (
    <ListingContext.Provider
      value={{
        isAuthReady,
        listings,
        addListing,
        addAuctionListing,
        removeListing,
        updateListing,
        purchaseListingAndRemove,
        placeBid,
        getAuctionListings,
        getActiveAuctions,
        getEndedAuctions,
        checkEndedAuctions,
        cancelAuction,
        saveDraft,
        getDrafts,
        deleteDraft,
        uploadImage,
        deleteImage,
        subscriptions,
        subscribeToSeller,
        unsubscribeFromSeller,
        isSubscribed,
        sellerNotifications,
        addSellerNotification,
        clearSellerNotification,
        restoreSellerNotification,
        permanentlyDeleteSellerNotification,
        requestVerification,
        setVerificationStatus,
        users,
        orderHistory,
        isLoading,
        error,
        refreshListings,
      }}
    >
      {children}
    </ListingContext.Provider>
  );
};

export const useListings = () => {
  const context = useContext(ListingContext);
  if (!context) throw new Error('useListings must be used within a ListingProvider');
  return context;
};