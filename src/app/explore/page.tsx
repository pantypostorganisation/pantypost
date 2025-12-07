// src/app/explore/page.tsx
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

  // Don't show follow button for own profile
  if (user?.username === username) return null;

  const handleFollow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isLoggedIn) {
      router.push('/login');
      return;
    }

    setIsLoading(true);
    try {
      if (isFollowing) {
        await apiCall(`/subscriptions/unsubscribe/${username}`, { method: 'POST' });
        setIsFollowing(false);
        onFollowChange?.(false);
      } else {
        await apiCall(`/subscriptions/subscribe/${username}`, { method: 'POST' });
        setIsFollowing(true);
        onFollowChange?.(true);
      }
    } catch (error) {
      console.error('Follow action failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleFollow}
      disabled={isLoading}
      className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 ${
        isFollowing
          ? 'bg-[#ff950e]/20 text-[#ff950e] border border-[#ff950e]/50 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/50'
          : 'bg-[#ff950e] text-black hover:bg-[#ff6b00]'
      }`}
    >
      {isLoading ? (
        <Loader2 className="w-3 h-3 animate-spin" />
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
            className="text-[#ff950e] hover:text-[#ff6b00] hover:underline"
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
    <div className="bg-gradient-to-br from-[#1a1a1a] to-[#111] rounded-2xl border border-[#333] hover:border-[#ff950e]/30 transition-all duration-300 overflow-hidden shadow-xl">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Link href={`/sellers/${post.author}`} className="flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#ff950e]/20 to-[#ff6b00]/10 border-2 border-[#ff950e]/30 overflow-hidden hover:border-[#ff950e] transition-colors">
              {post.authorInfo?.profilePic ? (
                <OptimizedImage
                  src={post.authorInfo.profilePic}
                  alt={post.author}
                  width={48}
                  height={48}
                  className="w-full h-full"
                  objectFit="cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#ff950e] text-xl font-bold">
                  {post.author.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </Link>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={`/sellers/${post.author}`}
                className="font-bold text-white hover:text-[#ff950e] transition-colors truncate"
              >
                {post.author}
              </Link>
              {post.authorInfo?.isVerified && (
                <OptimizedImage
                  src="/verification_badge.png"
                  alt="Verified"
                  width={16}
                  height={16}
                  className="flex-shrink-0"
                />
              )}
              {post.authorInfo?.tier && (
                <span className="text-[10px] px-2 py-0.5 bg-[#ff950e]/20 text-[#ff950e] rounded-full font-semibold">
                  {post.authorInfo.tier}
                </span>
              )}
            </div>
            <span className="text-xs text-gray-500">
              {formatRelativeTime(post.createdAt)}
            </span>
          </div>

          <FollowButton username={post.author} />
        </div>

        {isOwner && (
          <div className="relative ml-2" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-1 bg-[#222] border border-[#444] rounded-xl shadow-2xl z-20 min-w-[150px] overflow-hidden">
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
            <div className="absolute top-3 left-3 bg-black/60 px-2 py-1 rounded-full flex items-center gap-1">
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
                        ? 'bg-[#ff950e] w-4'
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
      <div className="px-4 py-3 flex items-center gap-6 border-t border-[#333]">
        <button
          onClick={handleLike}
          disabled={!currentUser}
          className={`flex items-center gap-2 transition-all duration-200 ${
            currentUser
              ? isLiked
                ? 'text-red-500'
                : 'text-gray-400 hover:text-red-500'
              : 'text-gray-600 cursor-not-allowed'
          }`}
        >
          <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
          <span className="text-sm font-medium">{likeCount}</span>
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 text-gray-400 hover:text-[#ff950e] transition-colors"
        >
          <MessageCircle className="w-6 h-6" />
          <span className="text-sm font-medium">{comments.length}</span>
        </button>

        <div className="flex items-center gap-2 text-gray-500 ml-auto">
          <Eye className="w-5 h-5" />
          <span className="text-sm">{post.views}</span>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="px-4 pb-4 border-t border-[#333]">
          {/* Comment Input */}
          {currentUser ? (
            <div className="flex gap-3 mt-4">
              <div className="w-8 h-8 rounded-full bg-[#ff950e]/20 flex items-center justify-center text-[#ff950e] text-sm font-bold flex-shrink-0">
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
                  className="flex-1 bg-[#222] border border-[#444] rounded-full px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#ff950e] transition-colors"
                />
                <button
                  onClick={handleComment}
                  disabled={!commentText.trim()}
                  className="p-2 bg-[#ff950e] hover:bg-[#ff6b00] disabled:bg-[#333] disabled:cursor-not-allowed rounded-full transition-colors"
                >
                  <Send className="w-4 h-4 text-black" />
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 mt-4 text-center">
              <Link href="/login" className="text-[#ff950e] hover:underline font-semibold">
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
                  <div className="w-8 h-8 rounded-full bg-[#333] flex items-center justify-center text-gray-400 text-sm font-bold flex-shrink-0">
                    {comment.author.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 bg-[#222] rounded-2xl px-4 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        href={`/sellers/${comment.author}`}
                        className="text-sm font-semibold text-[#ff950e] hover:underline"
                      >
                        {comment.author}
                      </Link>
                      <span className="text-xs text-gray-500">
                        {formatRelativeTime(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 mt-1">{comment.content}</p>
                  </div>

                  {(currentUser?.username === comment.author || isOwner) && (
                    <button
                      onClick={() => handleDeleteComment(comment._id)}
                      className="p-1 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all self-center"
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
      <div className="bg-gradient-to-br from-[#1a1a1a] to-[#111] rounded-2xl w-full max-w-lg border border-[#333] shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#333] sticky top-0 bg-[#1a1a1a] z-10">
          <h2 className="text-xl font-bold text-white">Create Post</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
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
            className="w-full bg-[#222] border border-[#444] rounded-xl px-4 py-3 text-white placeholder-gray-500 resize-none focus:outline-none focus:border-[#ff950e] transition-colors"
          />
          <div className="flex justify-between mt-2">
            <span className="text-xs text-gray-500">
              Pro tip: Use hashtags like #lingerie #worn #custom
            </span>
            <span
              className={`text-xs ${
                content.length > 1900 ? 'text-[#ff950e]' : 'text-gray-500'
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
                  className="relative aspect-square rounded-xl overflow-hidden border border-[#444]"
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
                    <div className="absolute top-2 left-2 bg-black/60 px-2 py-1 rounded-full">
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
              className="flex items-center gap-2 px-4 py-3 bg-[#222] hover:bg-[#333] disabled:bg-[#1a1a1a] disabled:text-gray-600 rounded-xl text-gray-300 transition-colors w-full justify-center border border-[#444] hover:border-[#ff950e]/50"
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
            <p className="text-xs text-gray-500 mt-2 text-center">
              Images up to 10MB, Videos up to 50MB
            </p>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#333] flex justify-end gap-3 sticky bottom-0 bg-[#1a1a1a]">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={(!content.trim() && mediaUrls.length === 0) || isSubmitting}
            className="px-6 py-2.5 bg-[#ff950e] hover:bg-[#ff6b00] disabled:bg-[#333] disabled:text-gray-500 disabled:cursor-not-allowed rounded-full text-black font-bold transition-all duration-200 flex items-center gap-2"
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

export default function ExplorePage() {
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
    <div className="min-h-screen bg-gradient-to-b from-black via-[#0a0a0a] to-black">
      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Explore</h1>
            <p className="text-gray-500 text-sm mt-1">See what sellers are sharing</p>
          </div>

          {isSeller && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#ff950e] hover:bg-[#ff6b00] rounded-full text-black font-bold transition-all duration-200 shadow-lg shadow-[#ff950e]/20 hover:shadow-[#ff950e]/40"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">New Post</span>
            </button>
          )}
        </div>

        {/* Feed Type Tabs */}
        <div className="flex gap-1 mb-6 p-1 bg-[#1a1a1a] rounded-full border border-[#333]">
          <button
            onClick={() => setFeedType('latest')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-full font-semibold transition-all duration-200 ${
              feedType === 'latest'
                ? 'bg-[#ff950e] text-black'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span className="text-sm">Latest</span>
          </button>
          <button
            onClick={() => setFeedType('trending')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-full font-semibold transition-all duration-200 ${
              feedType === 'trending'
                ? 'bg-[#ff950e] text-black'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
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
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-full font-semibold transition-all duration-200 ${
              feedType === 'following'
                ? 'bg-[#ff950e] text-black'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="w-4 h-4" />
            <span className="text-sm">Following</span>
          </button>
        </div>

        {/* Selected Tag Indicator */}
        {selectedTag && (
          <div className="flex items-center gap-2 mb-4 px-4 py-3 bg-[#ff950e]/10 border border-[#ff950e]/30 rounded-xl">
            <span className="text-[#ff950e] font-bold">#{selectedTag}</span>
            <button
              onClick={() => setSelectedTag(null)}
              className="ml-auto p-1 text-[#ff950e] hover:text-white hover:bg-[#ff950e]/20 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Guest Banner */}
        {!isLoggedIn && (
          <div className="mb-6 p-5 bg-gradient-to-r from-[#ff950e]/10 to-[#ff6b00]/10 border border-[#ff950e]/30 rounded-2xl">
            <p className="text-white font-semibold mb-3">
              Join PantyPost to like, comment, and follow your favorite sellers!
            </p>
            <div className="flex gap-3">
              <Link
                href="/signup"
                className="px-5 py-2.5 bg-[#ff950e] hover:bg-[#ff6b00] rounded-full text-black font-bold transition-colors"
              >
                Sign Up
              </Link>
              <Link
                href="/login"
                className="px-5 py-2.5 bg-white/10 hover:bg-white/20 rounded-full text-white font-semibold transition-colors border border-white/20"
              >
                Log In
              </Link>
            </div>
          </div>
        )}

        {/* Posts Feed */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-[#ff950e] animate-spin mb-4" />
            <p className="text-gray-500">Loading posts...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-4 bg-[#1a1a1a] rounded-full flex items-center justify-center border border-[#333]">
              <MessageCircle className="w-10 h-10 text-gray-600" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No posts yet</h3>
            <p className="text-gray-500 max-w-sm mx-auto">
              {feedType === 'following'
                ? 'Posts from sellers you follow will appear here'
                : selectedTag
                ? `No posts with #${selectedTag} yet`
                : 'Be the first to post something!'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <div
                key={post._id}
                ref={(el) => {
                  if (el) postRefs.current.set(post._id, el);
                }}
                data-post-id={post._id}
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

            {/* Load More Trigger */}
            <div ref={loadMoreRef} className="py-8">
              {isLoadingMore && (
                <div className="flex items-center justify-center gap-3">
                  <Loader2 className="w-6 h-6 text-[#ff950e] animate-spin" />
                  <span className="text-gray-500">Loading more...</span>
                </div>
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
