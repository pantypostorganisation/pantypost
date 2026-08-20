// src/app/explore/ExploreClient.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Heart,
  MessageCircle,
  Eye,
  Clock,
  TrendingUp,
  Users,
  ChevronLeft,
  ChevronRight,
  X,
  Send,
  MoreHorizontal,
  Trash2,
  ImageIcon,
  Loader2,
  Plus,
  Play,
  Volume2,
  VolumeX,
  UserPlus,
  UserCheck,
  Film,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import exploreService, { Post, PostComment } from '@/services/explore.service';
import { apiCall } from '@/services/api.config';
import OptimizedImage from '@/components/OptimizedImage';

// ==================== HELPER FUNCTIONS ====================

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;

  return date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
}

function isVideoUrl(url: string): boolean {
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.m4v'];
  const lowercaseUrl = url.toLowerCase();
  return (
    videoExtensions.some((ext) => lowercaseUrl.includes(ext)) ||
    lowercaseUrl.includes('video') ||
    lowercaseUrl.includes('/v/')
  );
}

// ==================== VIDEO PLAYER COMPONENT ====================

interface VideoPlayerProps {
  src: string;
  isVisible: boolean;
}

function VideoPlayer({ src, isVisible }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!videoRef.current) return;

    if (isVisible) {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [isVisible]);

  const toggleMute = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(!isMuted);
    }
  };

  const togglePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  return (
    <div className="relative w-full h-full group">
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-cover"
        loop
        muted={isMuted}
        playsInline
        preload="metadata"
      />

      {/* Play/Pause overlay */}
      <div
        className="absolute inset-0 flex items-center justify-center cursor-pointer"
        onClick={togglePlay}
      >
        {!isPlaying && (
          <div className="w-16 h-16 bg-black/50 rounded-full flex items-center justify-center">
            <Play className="w-8 h-8 text-white ml-1" fill="white" />
          </div>
        )}
      </div>

      {/* Mute button */}
      <button
        onClick={toggleMute}
        className="absolute bottom-3 right-3 p-2 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors opacity-0 group-hover:opacity-100"
      >
        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      </button>
    </div>
  );
}

// ==================== FOLLOW BUTTON COMPONENT ====================

interface FollowButtonProps {
  username: string;
  initialIsFollowing?: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
}

function FollowButton({ username, initialIsFollowing = false, onFollowChange }: FollowButtonProps) {
  const { user, isLoggedIn } = useAuth();
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The API reports follow state per post, but a card can outlive a
  // change made elsewhere in the feed; keep the button in step.
  useEffect(() => {
    setIsFollowing(initialIsFollowing);
  }, [initialIsFollowing]);

  // Don't show follow button for own profile
  if (user?.username === username) return null;

  const handleFollow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isLoggedIn) {
      router.push('/login');
      return;
    }

    /* This used to call /subscriptions/subscribe -- the PAID monthly
       subscription endpoint -- so a button labelled "Follow" was
       attempting to charge the buyer's wallet. Follows are free and now
       have their own endpoints.

       It also flipped the UI without checking the response: apiCall
       resolves with { success: false } rather than throwing, so a failed
       call still rendered "Following". The service now throws on
       failure, and the state only changes on a real success. */
    const nextFollowing = !isFollowing;
    setIsLoading(true);
    setError(null);
    try {
      const result = nextFollowing
        ? await exploreService.followUser(username)
        : await exploreService.unfollowUser(username);

      setIsFollowing(result.following);
      onFollowChange?.(result.following);
    } catch (err) {
      console.error('Follow action failed:', err);
      // Leave the button in its previous state and say so, rather than
      // claiming a follow that did not happen.
      setError(nextFollowing ? 'Could not follow' : 'Could not unfollow');
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleFollow}
      disabled={isLoading}
      className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs font-semibold transition-all duration-200 ${
        isFollowing
          ? 'bg-primary-soft text-primary border border-primary-line hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/50'
          : 'bg-primary text-black hover:bg-primary-hover'
      }`}
    >
      {isLoading ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : error ? (
        <span>{error}</span>
      ) : isFollowing ? (
        <>
          <UserCheck className="w-3 h-3" />
          <span>Following</span>
        </>
      ) : (
        <>
          <UserPlus className="w-3 h-3" />
          <span>Follow</span>
        </>
      )}
    </button>
  );
}

// ==================== POST CARD COMPONENT ====================

interface PostCardProps {
  post: Post;
  currentUser: { username: string; role: string } | null;
  onLike: (postId: string) => void;
  onComment: (postId: string, content: string) => void;
  onDeleteComment: (postId: string, commentId: string) => void;
  onDelete: (postId: string) => void;
  onTagClick: (tag: string) => void;
  isVisible: boolean;
}

function PostCard({
  post,
  currentUser,
  onLike,
  onComment,
  onDeleteComment,
  onDelete,
  onTagClick,
  isVisible,
}: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [isLiked, setIsLiked] = useState(
    currentUser ? post.likes.includes(currentUser.username) : false,
  );
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [comments, setComments] = useState<PostComment[]>(post.comments || []);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLike = async () => {
    if (!currentUser) return;

    // Optimistic update
    setIsLiked(!isLiked);
    setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));

    try {
      await onLike(post._id);
    } catch {
      // Revert on error
      setIsLiked(isLiked);
      setLikeCount(likeCount);
    }
  };

  const handleComment = async () => {
    if (!commentText.trim() || !currentUser) return;

    try {
      await onComment(post._id, commentText);
      // Add comment optimistically
      const newComment: PostComment = {
        _id: Date.now().toString(),
        author: currentUser.username,
        content: commentText,
        createdAt: new Date().toISOString(),
      };
      setComments([...comments, newComment]);
      setCommentText('');
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await onDeleteComment(post._id, commentId);
      setComments(comments.filter((c) => c._id !== commentId));
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  // Parse content for hashtags
  const renderContent = (content: string) => {
    const parts = content.split(/(#\w+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('#')) {
        return (
          <button
            key={index}
            onClick={() => onTagClick(part.slice(1))}
            className="text-primary hover:text-primary-hover hover:underline"
          >
            {part}
          </button>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  const isOwner = currentUser?.username === post.author;
  const mediaUrls = post.imageUrls || [];
  const currentMedia = mediaUrls[currentMediaIndex];
  const isCurrentMediaVideo = currentMedia ? isVideoUrl(currentMedia) : false;

  return (
    <div className="bg-surface-raised rounded-lg border border-line hover:border-primary-line transition-colors duration-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Link href={`/sellers/${post.author}`} className="flex-shrink-0">
            <div className="w-14 h-14 rounded-full bg-primary-soft border border-primary-line overflow-hidden hover:border-primary transition-colors">
              {post.authorInfo?.profilePic ? (
                /* Plain <img>, NOT OptimizedImage.
                   OptimizedImage applies className to its wrapper <div>,
                   not to the underlying <img> -- verified in the browser:
                   the img reported className "" while the parent div had
                   "w-full h-full object-cover". So the image was never
                   stretched to fill the circle; it rendered at its own
                   ratio (611x407 -> 56x37 in a 56px box), leaving a
                   19px empty band at the bottom that read as a clipped
                   avatar.

                   object-fit could not save it either: object-fit only
                   applies when the element's box differs from the
                   content, and here the box WAS the content size.

                   h-full w-full object-cover directly on the img is what
                   the browse card does, and it fills the circle. */
                <img
                  src={post.authorInfo.profilePic}
                  alt={`${post.author}'s profile picture`}
                  loading="lazy"
                  className="h-full w-full object-cover object-center"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-primary text-2xl font-bold">
                  {post.author.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </Link>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={`/sellers/${post.author}`}
                className="font-bold text-white hover:text-primary transition-colors truncate"
              >
                {post.author}
              </Link>
              {/* Verification badge removed: every seller must pass
                  identity verification before they can list (enforced
                  server-side in listing.routes.js), so badging it on each
                  post marked a universal condition as if it were a
                  distinction. It was also pointing at
                  /verification_badge.png, which 404s. */}
              {post.authorInfo?.tier && (
                <span className="text-[10px] px-2 py-0.5 bg-primary-soft text-primary rounded-sm font-semibold">
                  {post.authorInfo.tier}
                </span>
              )}
            </div>
            <span className="text-xs text-ink-faint">
              {formatRelativeTime(post.createdAt)}
            </span>
          </div>

          <FollowButton
            username={post.author}
            initialIsFollowing={Boolean(post.isFollowing)}
          />
        </div>

        {isOwner && (
          <div className="relative ml-2" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-ink-muted hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-1 bg-surface-overlay border border-line-strong rounded-lg shadow-2xl z-20 min-w-[150px] overflow-hidden">
                <button
                  onClick={() => {
                    onDelete(post._id);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-3 text-left text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Post
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {post.content && (
        <div className="px-4 pb-3">
          <p className="text-gray-200 whitespace-pre-wrap break-words leading-relaxed">
            {renderContent(post.content)}
          </p>
        </div>
      )}

      {/* Media (Images/Videos) */}
      {mediaUrls.length > 0 && (
        <div className="relative bg-black">
          <div className="aspect-square relative overflow-hidden">
            {isCurrentMediaVideo ? (
              <VideoPlayer src={currentMedia} isVisible={isVisible} />
            ) : (
              <OptimizedImage
                src={currentMedia}
                alt="Post media"
                fill
                objectFit="cover"
              />
            )}
          </div>

          {/* Media type indicator */}
          {isCurrentMediaVideo && (
            <div className="absolute top-3 left-3 bg-black/70 px-2 py-1 rounded-sm flex items-center gap-1">
              <Film className="w-3 h-3 text-white" />
              <span className="text-white text-xs">Video</span>
            </div>
          )}

          {mediaUrls.length > 1 && (
            <>
              <button
                onClick={() =>
                  setCurrentMediaIndex((i) => (i === 0 ? mediaUrls.length - 1 : i - 1))
                }
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/60 hover:bg-black/80 rounded-full text-white transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() =>
                  setCurrentMediaIndex((i) =>
                    i === mediaUrls.length - 1 ? 0 : i + 1,
                  )
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/60 hover:bg-black/80 rounded-full text-white transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {mediaUrls.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentMediaIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentMediaIndex
                        ? 'bg-primary w-4'
                        : 'bg-white/50 hover:bg-white/70'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-3 flex items-center gap-6 border-t border-line">
        <button
          onClick={handleLike}
          disabled={!currentUser}
          className={`flex items-center gap-2 transition-all duration-200 ${
            currentUser
              ? isLiked
                ? 'text-red-500'
                : 'text-ink-muted hover:text-red-500'
              : 'text-ink-faint cursor-not-allowed'
          }`}
        >
          <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
          <span className="text-sm font-medium">{likeCount}</span>
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 text-ink-muted hover:text-primary transition-colors"
        >
          <MessageCircle className="w-6 h-6" />
          <span className="text-sm font-medium">{comments.length}</span>
        </button>

        <div className="flex items-center gap-2 text-ink-faint ml-auto">
          <Eye className="w-5 h-5" />
          <span className="text-sm">{post.views}</span>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="px-4 pb-4 border-t border-line">
          {/* Comment Input */}
          {currentUser ? (
            <div className="flex gap-3 mt-4">
              <div className="w-8 h-8 rounded-full bg-primary-soft flex items-center justify-center text-primary text-sm font-bold flex-shrink-0">
                {currentUser.username.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleComment()}
                  placeholder="Write a comment..."
                  maxLength={500}
                  className="flex-1 bg-surface-overlay border border-line-strong rounded-md px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors"
                />
                <button
                  onClick={handleComment}
                  disabled={!commentText.trim()}
                  className="p-2 bg-primary hover:bg-primary-hover disabled:bg-surface-overlay disabled:cursor-not-allowed rounded-md transition-colors"
                >
                  <Send className="w-4 h-4 text-black" />
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-ink-faint mt-4 text-center">
              <Link href="/login" className="text-primary hover:underline font-semibold">
                Log in
              </Link>{' '}
              to comment
            </p>
          )}

          {/* Comments List */}
          {comments.length > 0 && (
            <div className="mt-4 space-y-3">
              {comments.map((comment) => (
                <div key={comment._id} className="flex gap-3 group">
                  <div className="w-8 h-8 rounded-full bg-surface-overlay flex items-center justify-center text-ink-muted text-sm font-bold flex-shrink-0">
                    {comment.author.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 bg-surface-overlay rounded-lg px-4 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        href={`/sellers/${comment.author}`}
                        className="text-sm font-semibold text-primary hover:underline"
                      >
                        {comment.author}
                      </Link>
                      <span className="text-xs text-ink-faint">
                        {formatRelativeTime(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-ink-muted mt-1">{comment.content}</p>
                  </div>

                  {(currentUser?.username === comment.author || isOwner) && (
                    <button
                      onClick={() => handleDeleteComment(comment._id)}
                      className="p-1 text-ink-faint hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all self-center"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ==================== CREATE POST MODAL ====================

interface CreatePostModalProps {
  onClose: () => void;
  onPostCreated: (post: Post) => void;
}

function CreatePostModal({ onClose, onPostCreated }: CreatePostModalProps) {
  const [content, setContent] = useState('');
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { getAuthToken } = useAuth();

  // Upload using YOUR EXISTING backend /api/upload endpoint
  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (mediaUrls.length + files.length > 4) {
      setError('Maximum 4 media files allowed');
      return;
    }

    setIsUploading(true);
    setError('');
    setUploadProgress(0);

    try {
      const totalFiles = files.length;
      let completedFiles = 0;

      for (const file of Array.from(files)) {
        // Validate file size (50MB max for videos, 10MB for images)
        const isVideo = file.type.startsWith('video/');
        const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;

        if (file.size > maxSize) {
          setError(
            `File too large. Max ${isVideo ? '50MB' : '10MB'} for ${
              isVideo ? 'videos' : 'images'
            }`,
          );
          continue;
        }

        // Create FormData for your existing backend upload endpoint
        const formData = new FormData();
        formData.append('file', file);

        // Get the auth token
        const token = getAuthToken();

        // Use your existing /api/upload endpoint
        const response = await fetch(
          `${
            process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.pantypost.com'
          }/api/upload`,
          {
            method: 'POST',
            body: formData,
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const data = await response.json();

        if (data.success && (data.url || data.data?.url)) {
          const uploadedUrl = data.url || data.data?.url;
          setMediaUrls((prev) => [...prev, uploadedUrl]);
        } else {
          throw new Error(data.error || 'Upload failed');
        }

        completedFiles++;
        setUploadProgress(Math.round((completedFiles / totalFiles) * 100));
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to upload media. Please try again.',
      );
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeMedia = (index: number) => {
    setMediaUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!content.trim() && mediaUrls.length === 0) return;

    setIsSubmitting(true);
    setError('');

    try {
      const post = await exploreService.createPost({
        content: content.trim(),
        imageUrls: mediaUrls,
      });
      onPostCreated(post);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface-raised rounded-lg w-full max-w-lg border border-line shadow-raised max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-line sticky top-0 bg-surface-raised z-10">
          <h2 className="text-xl font-bold text-white">Create Post</h2>
          <button
            onClick={onClose}
            className="p-2 text-ink-muted hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's happening? Use #hashtags to help people find your post..."
            maxLength={2000}
            rows={4}
            className="w-full bg-surface-overlay border border-line-strong rounded-lg px-4 py-3 text-white placeholder-gray-500 resize-none focus:outline-none focus:border-primary transition-colors"
          />
          <div className="flex justify-between mt-2">
            <span className="text-xs text-ink-faint">
              Pro tip: Use hashtags like #lingerie #worn #custom
            </span>
            <span
              className={`text-xs ${
                content.length > 1900 ? 'text-primary' : 'text-ink-faint'
              }`}
            >
              {content.length}/2000
            </span>
          </div>

          {/* Media Preview */}
          {mediaUrls.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              {mediaUrls.map((url, index) => (
                <div
                  key={index}
                  className="relative aspect-square rounded-lg overflow-hidden border border-line-strong"
                >
                  {isVideoUrl(url) ? (
                    <video src={url} className="w-full h-full object-cover" muted />
                  ) : (
                    <OptimizedImage
                      src={url}
                      alt={`Upload ${index + 1}`}
                      fill
                      objectFit="cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      onClick={() => removeMedia(index)}
                      className="p-2 bg-red-500 hover:bg-red-600 rounded-full text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  {isVideoUrl(url) && (
                    <div className="absolute top-2 left-2 bg-black/70 px-2 py-1 rounded-sm">
                      <Film className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Upload Button */}
          <div className="mt-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleMediaUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || mediaUrls.length >= 4}
              className="flex items-center gap-2 px-4 py-3 bg-surface-overlay hover:bg-surface-hover disabled:bg-surface-raised disabled:text-ink-faint rounded-lg text-ink-muted transition-colors w-full justify-center border border-line-strong hover:border-primary-line"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Uploading... {uploadProgress}%</span>
                </>
              ) : (
                <>
                  <ImageIcon className="w-5 h-5" />
                  <span>Add Photos/Videos ({mediaUrls.length}/4)</span>
                </>
              )}
            </button>
            <p className="text-xs text-ink-faint mt-2 text-center">
              Images up to 10MB, Videos up to 50MB
            </p>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-line flex justify-end gap-3 sticky bottom-0 bg-surface-raised">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-ink-muted hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={(!content.trim() && mediaUrls.length === 0) || isSubmitting}
            className="px-6 py-2.5 bg-primary hover:bg-primary-hover disabled:bg-surface-overlay disabled:text-ink-faint disabled:cursor-not-allowed rounded-md text-black font-bold transition-all duration-200 flex items-center gap-2"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Post
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================== MAIN PAGE COMPONENT ====================

export default function ExploreClient() {
  const router = useRouter();
  const { user, isLoggedIn } = useAuth();

  const [posts, setPosts] = useState<Post[]>([]);
  const [feedType, setFeedType] = useState<'latest' | 'trending' | 'following'>('latest');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [visiblePostIds, setVisiblePostIds] = useState<Set<string>>(new Set());

  const loadMoreRef = useRef<HTMLDivElement>(null);
  const postRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Intersection observer for video autoplay
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const postId = entry.target.getAttribute('data-post-id');
          if (postId) {
            setVisiblePostIds((prev) => {
              const next = new Set(prev);
              if (entry.isIntersecting) {
                next.add(postId);
              } else {
                next.delete(postId);
              }
              return next;
            });
          }
        });
      },
      { threshold: 0.5 },
    );

    postRefs.current.forEach((element) => {
      observer.observe(element);
    });

    return () => observer.disconnect();
  }, [posts]);

  // Load posts
  const loadPosts = useCallback(
    async (reset: boolean = false) => {
      try {
        if (reset) {
          setIsLoading(true);
          setPage(1);
        } else {
          setIsLoadingMore(true);
        }

        const currentPage = reset ? 1 : page;

        let response;
        if (feedType === 'following' && isLoggedIn) {
          response = await exploreService.getFollowingFeed({ page: currentPage, limit: 10 });
        } else {
          response = await exploreService.getFeed({
            page: currentPage,
            limit: 10,
            type: feedType === 'following' ? 'latest' : feedType,
            tag: selectedTag || undefined,
          });
        }

        if (reset) {
          setPosts(response.posts);
        } else {
          setPosts((prev) => [...prev, ...response.posts]);
        }

        setHasMore(response.meta.hasMore);
        if (!reset) setPage((prev) => prev + 1);
      } catch (error) {
        console.error('Failed to load posts:', error);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [feedType, selectedTag, page, isLoggedIn],
  );

  // Initial load
  useEffect(() => {
    loadPosts(true);
  }, [feedType, selectedTag, loadPosts]);

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isLoading) {
          loadPosts(false);
        }
      },
      { threshold: 0.1 },
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, isLoading, loadPosts]);

  // Handlers
  const handleLike = async (postId: string) => {
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }
    await exploreService.toggleLike(postId);
  };

  const handleComment = async (postId: string, content: string) => {
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }
    await exploreService.addComment(postId, content);
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    await exploreService.deleteComment(postId, commentId);
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      await exploreService.deletePost(postId);
      setPosts((prev) => prev.filter((p) => p._id !== postId));
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
  };

  const handleTagClick = (tag: string) => {
    setSelectedTag(tag);
    setFeedType('latest');
  };

  const handlePostCreated = (post: Post) => {
    setPosts((prev) => [post, ...prev]);
  };

  const isSeller = user?.role === 'seller';

  return (
    <div className="min-h-screen bg-surface">
      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Explore</h1>
            <p className="text-ink-faint text-sm mt-1">See what sellers are sharing</p>
          </div>

          {isSeller && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover active:bg-primary-press rounded-md text-black font-bold transition-colors duration-200"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">New Post</span>
            </button>
          )}
        </div>

        {/* Feed type tabs -- sticky to the TOP OF THE VIEWPORT.

            top-0, not top-16. The site header (ClientLayout -> Header) is
            `relative`, not fixed, so it scrolls away with the page. An
            offset of 64px therefore pinned this bar 64px BELOW the top of
            the window and left a gap with post content scrolling through
            it.

            With top-0 the bar sits naturally under the header at the top
            of the page, then pins flush to the top of the window once you
            scroll past it -- posts pass underneath. Same behaviour on
            every device; no JS, no scroll listener, so nothing to get out
            of sync and nothing that can fight the header.

            -mx-4/px-4 lets it span the full container width when pinned
            rather than floating as an inset island. */}
        <div className="sticky top-0 z-30 -mx-4 mb-6 border-b border-line bg-surface/95 px-4 py-3 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-surface/80">
        <div className="flex gap-1 p-1 bg-surface-raised rounded-lg border border-line">
          <button
            onClick={() => setFeedType('latest')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md font-semibold transition-all duration-200 ${
              feedType === 'latest'
                ? 'bg-primary text-black'
                : 'text-ink-muted hover:text-white hover:bg-white/5'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span className="text-sm">Latest</span>
          </button>
          <button
            onClick={() => setFeedType('trending')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md font-semibold transition-all duration-200 ${
              feedType === 'trending'
                ? 'bg-primary text-black'
                : 'text-ink-muted hover:text-white hover:bg-white/5'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm">Trending</span>
          </button>
          <button
            onClick={() => {
              if (!isLoggedIn) {
                router.push('/login');
                return;
              }
              setFeedType('following');
            }}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md font-semibold transition-all duration-200 ${
              feedType === 'following'
                ? 'bg-primary text-black'
                : 'text-ink-muted hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="w-4 h-4" />
            <span className="text-sm">Following</span>
          </button>
        </div>
        </div>

        {/* Selected Tag Indicator */}
        {selectedTag && (
          <div className="flex items-center gap-2 mb-4 px-4 py-3 bg-primary-soft border border-primary-line rounded-lg">
            <span className="text-primary font-bold">#{selectedTag}</span>
            <button
              onClick={() => setSelectedTag(null)}
              className="ml-auto p-1 text-primary hover:text-white hover:bg-primary-soft rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Guest Banner */}
        {!isLoggedIn && (
          <div className="mb-6 p-5 bg-primary-soft border border-primary-line rounded-lg">
            <p className="text-white font-semibold mb-3">
              Join PantyPost to like, comment, and follow your favorite sellers!
            </p>
            <div className="flex gap-3">
              <Link
                href="/signup"
                className="px-5 py-2.5 bg-primary hover:bg-primary-hover rounded-md text-black font-bold transition-colors"
              >
                Sign Up
              </Link>
              <Link
                href="/login"
                className="px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-md text-white font-semibold transition-colors border border-line-strong"
              >
                Log In
              </Link>
            </div>
          </div>
        )}

        {/* Posts Feed */}
        {isLoading ? (
          /* Skeletons, not a spinner: they occupy the same footprint the
             real cards will, so nothing jumps when content lands, and a
             sparse feed still looks deliberate while it loads. Hidden
             from screen readers -- the feed's aria-busy carries the state. */
          <div className="space-y-6" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="overflow-hidden rounded-lg border border-line bg-surface-raised">
                <div className="flex items-center gap-3 p-4">
                  <div className="h-14 w-14 flex-shrink-0 animate-pulse rounded-full bg-surface-overlay" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="h-3.5 w-32 animate-pulse rounded-sm bg-surface-overlay" />
                    <div className="h-3 w-20 animate-pulse rounded-sm bg-surface-overlay" />
                  </div>
                </div>
                <div className="aspect-square w-full animate-pulse bg-surface-overlay" />
                <div className="space-y-2 p-4">
                  <div className="h-3 w-3/4 animate-pulse rounded-sm bg-surface-overlay" />
                  <div className="h-3 w-1/2 animate-pulse rounded-sm bg-surface-overlay" />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          /* A good empty state says why it is empty and gives exactly
             one next action. The old one ended on a dead sentence, which
             on a pre-launch feed reads as "this site is broken" rather
             than "this is new". Every branch below now exits somewhere. */
          <div className="rounded-lg border border-line bg-surface-raised px-6 py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-lg border border-line bg-surface">
              <MessageCircle className="h-8 w-8 text-ink-faint" aria-hidden="true" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-white">
              {feedType === 'following'
                ? 'Nothing from your sellers yet'
                : selectedTag
                ? `Nothing tagged #${selectedTag}`
                : 'No posts yet'}
            </h3>
            <p className="mx-auto mb-6 max-w-sm text-sm text-ink-muted">
              {feedType === 'following'
                ? 'Follow a few sellers and their posts will show up here.'
                : selectedTag
                ? 'Try another tag, or see everything sellers are posting.'
                : isSeller
                ? 'Share a photo and it goes live once an admin approves it.'
                : 'Sellers post here between drops. Browse the shop in the meantime.'}
            </p>
            {feedType === 'following' || selectedTag ? (
              <button
                type="button"
                onClick={() => {
                  setSelectedTag(null);
                  setFeedType('latest');
                }}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-primary-hover active:bg-primary-press"
              >
                <Clock className="h-4 w-4" aria-hidden="true" />
                See latest posts
              </button>
            ) : isSeller ? (
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-primary-hover active:bg-primary-press"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Create your first post
              </button>
            ) : (
              <Link
                href="/browse"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-primary-hover active:bg-primary-press"
                style={{ color: '#000' }}
              >
                <span className="text-black">Browse listings</span>
              </Link>
            )}
          </div>
        ) : (
          /* role="feed" with article children is the ARIA pattern for a
             dynamically-appended stream; aria-busy announces the append. */
          <div className="space-y-6" role="feed" aria-busy={isLoadingMore} aria-label="Seller posts">
            {posts.map((post) => (
              <div
                key={post._id}
                ref={(el) => {
                  if (el) postRefs.current.set(post._id, el);
                }}
                data-post-id={post._id}
                role="article"
                aria-label={`Post by ${post.author}`}
              >
                <PostCard
                  post={post}
                  currentUser={user}
                  onLike={handleLike}
                  onComment={handleComment}
                  onDeleteComment={handleDeleteComment}
                  onDelete={handleDeletePost}
                  onTagClick={handleTagClick}
                  isVisible={visiblePostIds.has(post._id)}
                />
              </div>
            ))}

            {/* Load more.
                The observer still auto-loads, but an explicit control is
                offered too: pure infinite scroll loses scroll position on
                back-navigation and makes the footer unreachable, which is
                worse for goal-directed browsing. */}
            <div ref={loadMoreRef} className="py-8">
              {isLoadingMore ? (
                <div className="flex items-center justify-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden="true" />
                  <span className="text-sm text-ink-faint">Loading more...</span>
                </div>
              ) : hasMore ? (
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => loadPosts(false)}
                    className="rounded-md border border-line-strong bg-surface-raised px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:border-primary-line hover:bg-surface-hover"
                  >
                    Load more posts
                  </button>
                </div>
              ) : (
                <p className="text-center text-sm text-ink-faint">You&rsquo;re all caught up.</p>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Create Post Modal */}
      {showCreateModal && (
        <CreatePostModal onClose={() => setShowCreateModal(false)} onPostCreated={handlePostCreated} />
      )}
    </div>
  );
}

