// src/hooks/seller-settings/useProfileSettings.ts
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useProfileData } from './useProfileData';
import { useProfileSave } from './useProfileSave';
import { useTierCalculation } from './useTierCalculation';
import { API_BASE_URL, buildApiUrl } from '@/services/api.config';
import { sanitizeUrl } from '@/utils/security/sanitization';
import { securityService } from '@/services/security.service';
import { getRateLimiter, RATE_LIMITS } from '@/utils/security/rate-limiter';

const MAX_GALLERY_IMAGES = 20;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_COVER_SIZE = 8 * 1024 * 1024; // matches uploadConfigs.coverPhoto
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'] as const;

type AllowedMime = typeof ALLOWED_IMAGE_TYPES[number];
const isAllowed = (t: string): t is AllowedMime => (ALLOWED_IMAGE_TYPES as readonly string[]).includes(t);

export function useProfileSettings() {
  const { user, token } = useAuth();
  const rateLimiter = getRateLimiter();

  const profileData = useProfileData();

  // Backend-only gallery state
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationError, setValidationError] = useState<string>('');
  const multipleFileInputRef = useRef<HTMLInputElement>(null);
  const profilePicInputRef = useRef<HTMLInputElement>(null);
  const mountedRef = useRef(true);

  const { saveSuccess, saveError, isSaving, handleSave: baseSaveProfile } = useProfileSave();
  const tierData = useTierCalculation();

  const [selectedTierDetails, setSelectedTierDetails] = useState<any>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // ---- Cover photo ----
  // Uploaded and moderated exactly like the profile picture: the POST
  // queues it, an admin approves it, and only then does it become the
  // live banner. Nothing here goes through Save.
  const [coverPhoto, setCoverPhoto] = useState<string | null>(null);
  const [coverPending, setCoverPending] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverError, setCoverError] = useState<string>('');
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Load gallery images from backend ONLY
  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      if (!user?.username || !token) {
        if (mountedRef.current) setGalleryImages([]);
        return;
      }

      try {
        const resp = await fetch(buildApiUrl('/users/:username/profile', { username: user.username }), {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal
        });
        if (!resp.ok) throw new Error('Failed to load profile');
        const data = await resp.json();
        const userData = data?.data?.profile || data?.data || {};
        const validated = Array.isArray(userData.galleryImages) ? userData.galleryImages : [];

        const normalized = validated
          .map((url: string) => {
            if (!url) return null;
            if (url.startsWith('http://') || url.startsWith('https://')) return sanitizeUrl(url);
            if (url.startsWith('/uploads/')) return `${API_BASE_URL}${url}`;
            return sanitizeUrl(url);
          })
          .filter((u: string | null): u is string => !!u)
          .slice(0, MAX_GALLERY_IMAGES);

        if (mountedRef.current) setGalleryImages(normalized);
      } catch {
        if (mountedRef.current) setGalleryImages([]);
      }
    };

    void load();
    return () => controller.abort();
  }, [user?.username, token]);

  // Owner view of the cover photo. /users/me/profile returns the queued
  // banner when one is awaiting review, so the seller sees their own
  // change immediately even though buyers still see the approved one.
  useEffect(() => {
    const controller = new AbortController();

    const loadCover = async () => {
      if (!user?.username || !token) return;
      try {
        const resp = await fetch(buildApiUrl('/users/me/profile'), {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal
        });
        if (!resp.ok) return;
        const data = await resp.json();
        const payload = data?.data || {};
        const raw = payload.coverPhoto || null;
        const normalized = raw
          ? (raw.startsWith('/uploads/') ? `${API_BASE_URL}${raw}` : sanitizeUrl(raw))
          : null;
        if (mountedRef.current) {
          setCoverPhoto(normalized || null);
          setCoverPending(Boolean(payload.coverPhotoPendingReview));
        }
      } catch {
        /* a missing cover is not an error worth surfacing */
      }
    };

    void loadCover();
    return () => controller.abort();
  }, [user?.username, token]);

  const handleCoverPhotoChangeAsync = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    setCoverError('');

    if (file.size > MAX_COVER_SIZE) {
      setCoverError('Cover photo must be 8MB or smaller.');
      if (coverInputRef.current) coverInputRef.current.value = '';
      return;
    }
    if (!isAllowed(file.type)) {
      setCoverError('Unsupported file type. Use JPG, PNG or WEBP.');
      if (coverInputRef.current) coverInputRef.current.value = '';
      return;
    }

    if (user?.username) {
      const rateLimitResult = rateLimiter.check('IMAGE_UPLOAD', {
        ...RATE_LIMITS.IMAGE_UPLOAD,
        identifier: user.username
      });
      if (!rateLimitResult.allowed) {
        setCoverError(`Too many uploads. Please wait ${rateLimitResult.waitTime} seconds.`);
        return;
      }
    }

    setCoverUploading(true);
    try {
      const formData = new FormData();
      formData.append('coverPhoto', file);

      const response = await fetch(buildApiUrl('/upload/cover-photo'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result?.success) {
        throw new Error(result?.message || result?.error || 'Upload failed');
      }

      const raw = result?.data?.url || result?.url;
      const normalized = raw?.startsWith('/uploads/') ? `${API_BASE_URL}${raw}` : sanitizeUrl(raw);

      if (mountedRef.current) {
        setCoverPhoto(normalized || null);
        setCoverPending(true);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      if (mountedRef.current) setCoverError(`Failed to upload cover photo: ${msg}`);
    } finally {
      if (mountedRef.current) setCoverUploading(false);
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  };

  const handleCoverPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    void handleCoverPhotoChangeAsync(e);
  };

  const removeCoverPhotoAsync = async () => {
    if (!token) return;
    setCoverError('');
    setCoverUploading(true);
    try {
      // Withdraw a queued banner; otherwise remove the live one. Both
      // apply immediately — taking an image down cannot introduce
      // prohibited content.
      const endpoint = coverPending ? '/upload/cover-photo/pending' : '/upload/cover-photo';
      const response = await fetch(buildApiUrl(endpoint), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || 'Failed to remove cover photo');
      }

      const remaining = result?.data?.coverPhoto || null;
      const normalized = remaining
        ? (remaining.startsWith('/uploads/') ? `${API_BASE_URL}${remaining}` : sanitizeUrl(remaining))
        : null;

      if (mountedRef.current) {
        setCoverPhoto(normalized || null);
        setCoverPending(false);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      if (mountedRef.current) setCoverError(msg);
    } finally {
      if (mountedRef.current) setCoverUploading(false);
    }
  };

  const removeCoverPhoto = () => { void removeCoverPhotoAsync(); };

  // Refresh tier data when profile is saved
  useEffect(() => {
    if (saveSuccess && tierData.refreshTierData) {
      void tierData.refreshTierData();
    }
  }, [saveSuccess, tierData.refreshTierData]);

  useEffect(() => {
    setValidationError('');
  }, [selectedFiles]);

  const validateFiles = (files: File[]): { valid: boolean; error?: string } => {
    if (galleryImages.length + files.length > MAX_GALLERY_IMAGES) {
      return {
        valid: false,
        error: `Maximum ${MAX_GALLERY_IMAGES} gallery images allowed. You have ${galleryImages.length} images.`
      };
    }

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return { valid: false, error: `File "${file.name}" exceeds 10MB.` };
      }
      if (!isAllowed(file.type)) {
        return { valid: false, error: `Unsupported type for "${file.name}". Allowed: JPG, PNG, WEBP.` };
      }
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!ext || !['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
        return { valid: false, error: `Invalid extension for "${file.name}".` };
      }
    }
    return { valid: true };
  };

  const handleMultipleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    const validation = validateFiles(newFiles);
    if (!validation.valid) {
      setValidationError(validation.error || 'Invalid files selected');
      if (multipleFileInputRef.current) multipleFileInputRef.current.value = '';
      return;
    }

    setSelectedFiles((prev) => [...prev, ...newFiles]);
    if (multipleFileInputRef.current) multipleFileInputRef.current.value = '';
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadGalleryImagesAsync = async () => {
    if (selectedFiles.length === 0 || !token) return;

    if (user?.username) {
      const rateLimitResult = rateLimiter.check('IMAGE_UPLOAD', {
        ...RATE_LIMITS.IMAGE_UPLOAD,
        identifier: user.username
      });
      if (!rateLimitResult.allowed) {
        setValidationError(`Too many uploads. Please wait ${rateLimitResult.waitTime} seconds.`);
        return;
      }
    }

    const validation = validateFiles(selectedFiles);
    if (!validation.valid) {
      setValidationError(validation.error || 'Invalid files');
      return;
    }

    setGalleryUploading(true);
    setUploadProgress(0);
    setValidationError('');

    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => Math.min(prev + 10, 90));
    }, 200);

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => formData.append('gallery', file));

      const response = await fetch(buildApiUrl('/upload/gallery'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        let message = 'Upload failed';
        try {
          const err = await response.json();
          message = err?.error || message;
        } catch {}
        throw new Error(message);
      }

      const result = await response.json();
      const newGallery = (result?.data?.gallery || [])
        .map((url: string) => {
          if (!url) return null;
          if (url.startsWith('http://') || url.startsWith('https://')) return sanitizeUrl(url);
          if (url.startsWith('/uploads/')) return `${API_BASE_URL}${url}`;
          return sanitizeUrl(url);
        })
        .filter((u: string | null): u is string => !!u)
        .slice(0, MAX_GALLERY_IMAGES);

      if (mountedRef.current) {
        setGalleryImages(newGallery);
        setSelectedFiles([]);
        setUploadProgress(100);
        setTimeout(() => mountedRef.current && setUploadProgress(0), 800);
      }
    } catch (error) {
      clearInterval(progressInterval);
      const msg = error instanceof Error ? error.message : 'Unknown error';
      setValidationError(`Failed to upload images: ${msg}`);
    } finally {
      if (mountedRef.current) setGalleryUploading(false);
    }
  };

  const uploadGalleryImages = () => { void uploadGalleryImagesAsync(); };

  const removeGalleryImageAsync = async (index: number) => {
    if (index < 0 || index >= galleryImages.length || !token) return;

    try {
      const response = await fetch(buildApiUrl(`/upload/gallery/${index}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        try {
          const err = await response.json();
          throw new Error(err?.error || 'Failed to remove image');
        } catch {
          throw new Error('Failed to remove image');
        }
      }

      const result = await response.json();
      const updatedGallery = (result?.data?.gallery || [])
        .map((url: string) => {
          if (!url) return null;
          if (url.startsWith('http://') || url.startsWith('https://')) return sanitizeUrl(url);
          if (url.startsWith('/uploads/')) return `${API_BASE_URL}${url}`;
          return sanitizeUrl(url);
        })
        .filter((u: string | null): u is string => !!u)
        .slice(0, MAX_GALLERY_IMAGES);

      if (mountedRef.current) setGalleryImages(updatedGallery);
    } catch {
      // Fallback: optimistic removal if backend fails
      const updated = galleryImages.filter((_, i) => i !== index);
      if (mountedRef.current) setGalleryImages(updated);
    }
  };

  const removeGalleryImage = (index: number) => { void removeGalleryImageAsync(index); };

  const clearAllGalleryImagesAsync = async () => {
    if (typeof window !== 'undefined' && !window.confirm('Are you sure you want to remove all gallery images?')) return;

    if (!token) {
      if (mountedRef.current) setGalleryImages([]);
      return;
    }

    try {
      // Best-effort: delete by index from end to start
      for (let i = galleryImages.length - 1; i >= 0; i--) {
        // eslint-disable-next-line no-await-in-loop
        await fetch(buildApiUrl(`/upload/gallery/${i}`), {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      if (mountedRef.current) setGalleryImages([]);
    } catch {
      if (mountedRef.current) setGalleryImages([]);
    }
  };

  const clearAllGalleryImages = () => { void clearAllGalleryImagesAsync(); };

  const handleSave = async () => {
    const sanitizedCountry = profileData.country.trim();
    if (!sanitizedCountry) {
      setLocationError('Please select your country.');
      return false;
    }
    setLocationError(null);

    // =====================================================
    // WHAT SAVE DOES *NOT* SEND, AND WHY
    //
    // profilePic: POST /api/upload/profile-pic already calls
    //   submitProfilePicForReview, so the image is in the moderation
    //   queue the moment it uploads. Re-sending it here made the PATCH
    //   handler queue it a second time, resetting submittedAt and
    //   pushing it to the back of the line on every save. The only
    //   profilePic change Save still transmits is an explicit removal,
    //   which the backend applies immediately.
    //
    // galleryImages: managed entirely by POST/DELETE /api/upload/gallery,
    //   which persist on their own. Sending the array here re-queued
    //   every not-yet-approved image — and it was being sent twice,
    //   once in this payload and again via handleSaveWithGallery.
    // =====================================================
    const payload: {
      bio: string;
      subscriptionPrice: string;
      country: string;
      isLocationPublic: boolean;
      profilePic?: string | null;
    } = {
      bio: profileData.bio,
      subscriptionPrice: profileData.subscriptionPrice,
      country: sanitizedCountry,
      isLocationPublic: profileData.isLocationPublic ?? true,
    };

    if (profileData.profilePicRemoved) {
      payload.profilePic = null;
    }

    await baseSaveProfile(payload as any);
    if (tierData.refreshTierData) await tierData.refreshTierData();
    return saveSuccess;
  };

  return {
    // User
    user,

    // Profile data
    bio: profileData.bio,
    setBio: profileData.setBio,
    profilePic: profileData.profilePic,
    preview: profileData.preview,
    subscriptionPrice: profileData.subscriptionPrice,
    setSubscriptionPrice: profileData.setSubscriptionPrice,
    country: profileData.country,
    setCountry: (value: string) => {
      setLocationError(null);
      profileData.setCountry(value);
    },
    isLocationPublic: profileData.isLocationPublic,
    setIsLocationPublic: profileData.setIsLocationPublic,
    profileUploading: profileData.isUploading,
    profilePicPendingReview: profileData.profilePicPendingReview,
    handleProfilePicChange: profileData.handleProfilePicChange,
    removeProfilePic: profileData.removeProfilePic,
    profilePicInputRef,

    // Cover photo
    coverPhoto,
    coverPending,
    coverUploading,
    coverError,
    coverInputRef,
    handleCoverPhotoChange,
    removeCoverPhoto,

    // Gallery - Backend only
    galleryImages,
    selectedFiles,
    galleryUploading,
    uploadProgress,
    multipleFileInputRef,
    handleMultipleFileChange,
    removeSelectedFile,
    uploadGalleryImages,
    removeGalleryImage,
    clearAllGalleryImages,
    validationError,

    // Tier info
    sellerTierInfo: tierData.sellerTierInfo,
    userStats: tierData.userStats,
    getTierProgress: tierData.getTierProgress,
    getNextTier: tierData.getNextTier,
    selectedTierDetails,
    setSelectedTierDetails,
    isTierLoading: tierData.isLoading,
    tierError: tierData.error,

    // Save
    saveSuccess,
    saveError,
    isSaving,
    handleSave,
    locationError
  };
}
