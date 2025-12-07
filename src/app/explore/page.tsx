// src/app/explore/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Heart, 
  MessageCircle, 
  Eye, 
  Clock, 
  TrendingUp, 
  Users, 
  Hash,
  ChevronLeft,
  ChevronRight,
  X,
  Send,
  MoreHorizontal,
  Trash2,
  ImageIcon,
  Loader2,
  BadgeCheck,
  Plus
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import exploreService, { Post, TrendingTag, PostComment } from '@/services/explore.service';
import Header from '@/components/Header';

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

// ==================== SUB-COMPONENTS ====================

interface PostCardProps {
  post: Post;
  currentUser: { username: string; role: string } | null;
  onLike: (postId: string) => void;
  onComment: (postId: string, content: string) => void;
  onDeleteComment: (postId: string, commentId: string) => void;
  onDelete: (postId: string) => void;
  onTagClick: (tag: string) => void;
}

function PostCard({ 
  post, 
  currentUser, 
  onLike, 
  onComment, 
  onDeleteComment,
  onDelete,
  onTagClick 
}: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [isLiked, setIsLiked] = useState(
    currentUser ? post.likes.includes(currentUser.username) : false
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
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    
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
        createdAt: new Date().toISOString()
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
      setComments(comments.filter(c => c._id !== commentId));
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
            className="text-pink-400 hover:text-pink-300 hover:underline"
          >
            {part}
          </button>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  const isOwner = currentUser?.username === post.author;

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <Link href={`/sellers/${post.author}`} className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden">
            {post.authorInfo?.profilePic ? (
              <Image
                src={post.authorInfo.profilePic}
                alt={post.author}
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-lg font-bold">
                {post.author.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-white group-hover:text-pink-400 transition-colors">
                {post.author}
              </span>
              {post.authorInfo?.isVerified && (
                <BadgeCheck className="w-4 h-4 text-pink-500" />
              )}
              {post.authorInfo?.tier && (
                <span className="text-xs px-1.5 py-0.5 bg-pink-500/20 text-pink-400 rounded">
                  {post.authorInfo.tier}
                </span>
              )}
            </div>
            <span className="text-xs text-gray-500">
              {formatRelativeTime(post.createdAt)}
            </span>
          </div>
        </Link>
        
        {isOwner && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-10 min-w-[150px]">
                <button
                  onClick={() => {
                    onDelete(post._id);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-red-400 hover:bg-gray-800 flex items-center gap-2 rounded-lg"
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
      <div className="px-4 pb-3">
        <p className="text-gray-200 whitespace-pre-wrap break-words">
          {renderContent(post.content)}
        </p>
      </div>

      {/* Images */}
      {post.imageUrls.length > 0 && (
        <div className="relative">
          <div className="aspect-square bg-gray-900 relative overflow-hidden">
            <Image
              src={post.imageUrls[currentImageIndex]}
              alt="Post image"
              fill
              className="object-cover"
            />
          </div>
          
          {post.imageUrls.length > 1 && (
            <>
              <button
                onClick={() => setCurrentImageIndex(i => i === 0 ? post.imageUrls.length - 1 : i - 1)}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentImageIndex(i => i === post.imageUrls.length - 1 ? 0 : i + 1)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {post.imageUrls.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentImageIndex ? 'bg-white' : 'bg-white/40'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-3 flex items-center gap-6 border-t border-gray-700/50">
        <button
          onClick={handleLike}
          disabled={!currentUser}
          className={`flex items-center gap-2 transition-colors ${
            currentUser 
              ? isLiked 
                ? 'text-pink-500' 
                : 'text-gray-400 hover:text-pink-500'
              : 'text-gray-500 cursor-not-allowed'
          }`}
        >
          <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
          <span className="text-sm">{likeCount}</span>
        </button>
        
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 text-gray-400 hover:text-blue-400 transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm">{comments.length}</span>
        </button>
        
        <div className="flex items-center gap-2 text-gray-500">
          <Eye className="w-5 h-5" />
          <span className="text-sm">{post.views}</span>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="px-4 pb-4 border-t border-gray-700/50">
          {/* Comment Input */}
          {currentUser ? (
            <div className="flex gap-2 mt-3">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleComment()}
                placeholder="Write a comment..."
                maxLength={500}
                className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-pink-500"
              />
              <button
                onClick={handleComment}
                disabled={!commentText.trim()}
                className="p-2 bg-pink-600 hover:bg-pink-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          ) : (
            <p className="text-sm text-gray-500 mt-3">
              <Link href="/login" className="text-pink-400 hover:underline">Log in</Link> to comment
            </p>
          )}
          
          {/* Comments List */}
          {comments.length > 0 && (
            <div className="mt-3 space-y-3">
              {comments.map((comment) => (
                <div key={comment._id} className="flex gap-2 group">
                  <div className="flex-1 bg-gray-700/50 rounded-lg px-3 py-2">
                    <div className="flex items-center justify-between">
                      <Link 
                        href={`/sellers/${comment.author}`}
                        className="text-sm font-medium text-pink-400 hover:underline"
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
                      className="p-1 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
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
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    if (imageUrls.length + files.length > 4) {
      setError('Maximum 4 images allowed');
      return;
    }
    
    setIsUploading(true);
    setError('');
    
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'pantypost');
        
        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
          { method: 'POST', body: formData }
        );
        
        if (!response.ok) throw new Error('Upload failed');
        
        const data = await response.json();
        setImageUrls(prev => [...prev, data.secure_url]);
      }
    } catch (err) {
      setError('Failed to upload image');
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!content.trim()) return;
    
    setIsSubmitting(true);
    setError('');
    
    try {
      const post = await exploreService.createPost({
        content: content.trim(),
        imageUrls
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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl w-full max-w-lg border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">Create Post</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind? Use #hashtags to help people find your post..."
            maxLength={2000}
            rows={4}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 resize-none focus:outline-none focus:border-pink-500"
          />
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-500">
              Tip: Use hashtags like #lingerie #worn #custom
            </span>
            <span className={`text-xs ${content.length > 1900 ? 'text-yellow-500' : 'text-gray-500'}`}>
              {content.length}/2000
            </span>
          </div>
          
          {/* Image Preview */}
          {imageUrls.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              {imageUrls.map((url, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                  <Image
                    src={url}
                    alt={`Upload ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-black/70 rounded-full text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {/* Upload Button */}
          <div className="mt-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || imageUrls.length >= 4}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 rounded-lg text-gray-300 transition-colors"
            >
              {isUploading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <ImageIcon className="w-5 h-5" />
              )}
              <span>{isUploading ? 'Uploading...' : `Add Images (${imageUrls.length}/4)`}</span>
            </button>
          </div>
          
          {error && (
            <p className="mt-3 text-sm text-red-400">{error}</p>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!content.trim() || isSubmitting}
            className="px-6 py-2 bg-pink-600 hover:bg-pink-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors flex items-center gap-2"
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
  const { user, isAuthenticated } = useAuth();
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [trendingTags, setTrendingTags] = useState<TrendingTag[]>([]);
  const [feedType, setFeedType] = useState<'latest' | 'trending' | 'following'>('latest');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Load posts
  const loadPosts = useCallback(async (reset: boolean = false) => {
    try {
      if (reset) {
        setIsLoading(true);
        setPage(1);
      } else {
        setIsLoadingMore(true);
      }
      
      const currentPage = reset ? 1 : page;
      
      let response;
      if (feedType === 'following' && isAuthenticated) {
        response = await exploreService.getFollowingFeed({ page: currentPage, limit: 20 });
      } else {
        response = await exploreService.getFeed({ 
          page: currentPage, 
          limit: 20, 
          type: feedType === 'following' ? 'latest' : feedType,
          tag: selectedTag || undefined
        });
      }
      
      if (reset) {
        setPosts(response.posts);
      } else {
        setPosts(prev => [...prev, ...response.posts]);
      }
      
      setHasMore(response.meta.hasMore);
      if (!reset) setPage(prev => prev + 1);
    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [feedType, selectedTag, page, isAuthenticated]);

  // Load trending tags
  const loadTrendingTags = useCallback(async () => {
    try {
      const tags = await exploreService.getTrendingTags(10);
      setTrendingTags(tags);
    } catch (error) {
      console.error('Failed to load trending tags:', error);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadPosts(true);
    loadTrendingTags();
  }, [feedType, selectedTag]);

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isLoading) {
          loadPosts(false);
        }
      },
      { threshold: 0.1 }
    );
    
    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }
    
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, isLoading, loadPosts]);

  // Handlers
  const handleLike = async (postId: string) => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    await exploreService.toggleLike(postId);
  };

  const handleComment = async (postId: string, content: string) => {
    if (!isAuthenticated) {
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
      setPosts(prev => prev.filter(p => p._id !== postId));
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
  };

  const handleTagClick = (tag: string) => {
    setSelectedTag(tag);
    setFeedType('latest');
  };

  const handlePostCreated = (post: Post) => {
    setPosts(prev => [post, ...prev]);
  };

  const isSeller = user?.role === 'seller';

  return (
    <div className="min-h-screen bg-gray-900">
      <Header />
      
      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Main Feed */}
          <div className="flex-1 max-w-2xl">
            {/* Feed Header */}
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-white">Explore</h1>
              
              {isSeller && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-700 rounded-lg text-white font-medium transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  New Post
                </button>
              )}
            </div>
            
            {/* Feed Type Tabs */}
            <div className="flex gap-2 mb-6 p-1 bg-gray-800 rounded-lg">
              <button
                onClick={() => setFeedType('latest')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md font-medium transition-colors ${
                  feedType === 'latest'
                    ? 'bg-pink-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <Clock className="w-4 h-4" />
                Latest
              </button>
              <button
                onClick={() => setFeedType('trending')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md font-medium transition-colors ${
                  feedType === 'trending'
                    ? 'bg-pink-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                Trending
              </button>
              <button
                onClick={() => {
                  if (!isAuthenticated) {
                    router.push('/login');
                    return;
                  }
                  setFeedType('following');
                }}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md font-medium transition-colors ${
                  feedType === 'following'
                    ? 'bg-pink-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <Users className="w-4 h-4" />
                Following
              </button>
            </div>
            
            {/* Selected Tag Indicator */}
            {selectedTag && (
              <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-pink-600/20 border border-pink-500/30 rounded-lg">
                <Hash className="w-4 h-4 text-pink-400" />
                <span className="text-pink-400 font-medium">#{selectedTag}</span>
                <button
                  onClick={() => setSelectedTag(null)}
                  className="ml-auto p-1 text-pink-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            
            {/* Guest Banner */}
            {!isAuthenticated && (
              <div className="mb-6 p-4 bg-gradient-to-r from-pink-600/20 to-purple-600/20 border border-pink-500/30 rounded-xl">
                <p className="text-gray-200 mb-3">
                  Join PantyPost to like, comment, and follow your favorite sellers!
                </p>
                <div className="flex gap-3">
                  <Link
                    href="/register"
                    className="px-4 py-2 bg-pink-600 hover:bg-pink-700 rounded-lg text-white font-medium transition-colors"
                  >
                    Sign Up
                  </Link>
                  <Link
                    href="/login"
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-medium transition-colors"
                  >
                    Log In
                  </Link>
                </div>
              </div>
            )}
            
            {/* Posts Feed */}
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-8 h-8 text-gray-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-300 mb-2">No posts yet</h3>
                <p className="text-gray-500">
                  {feedType === 'following' 
                    ? "Posts from sellers you follow will appear here"
                    : selectedTag 
                      ? `No posts with #${selectedTag} yet`
                      : "Be the first to post something!"
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {posts.map((post) => (
                  <PostCard
                    key={post._id}
                    post={post}
                    currentUser={user}
                    onLike={handleLike}
                    onComment={handleComment}
                    onDeleteComment={handleDeleteComment}
                    onDelete={handleDeletePost}
                    onTagClick={handleTagClick}
                  />
                ))}
                
                {/* Load More Trigger */}
                <div ref={loadMoreRef} className="py-4">
                  {isLoadingMore && (
                    <div className="flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-pink-500 animate-spin" />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Sidebar - Trending Tags */}
          <div className="hidden lg:block w-80">
            <div className="sticky top-24">
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-pink-500" />
                  Trending Tags
                </h2>
                
                {trendingTags.length > 0 ? (
                  <div className="space-y-2">
                    {trendingTags.map((tag, index) => (
                      <button
                        key={tag.tag}
                        onClick={() => handleTagClick(tag.tag)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                          selectedTag === tag.tag
                            ? 'bg-pink-600/20 text-pink-400'
                            : 'hover:bg-gray-700 text-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 text-sm w-4">{index + 1}</span>
                          <span>#{tag.tag}</span>
                        </div>
                        <span className="text-xs text-gray-500">{tag.count} posts</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No trending tags yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Create Post Modal */}
      {showCreateModal && (
        <CreatePostModal
          onClose={() => setShowCreateModal(false)}
          onPostCreated={handlePostCreated}
        />
      )}
    </div>
  );
}