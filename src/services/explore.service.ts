// src/services/explore.service.ts
import { apiCall } from './api.config';
import { sanitizeString, sanitizeUsername } from '@/utils/sanitizeInput';

// ==================== TYPES ====================

export interface PostComment {
  _id: string;
  author: string;
  content: string;
  createdAt: string;
}

export interface PostAuthorInfo {
  username: string;
  profilePic?: string;
  isVerified: boolean;
  tier?: string;
  bio?: string;
}

export interface Post {
  _id: string;
  author: string;
  authorInfo?: PostAuthorInfo;
  content: string;
  imageUrls: string[];
  likes: string[];
  likeCount: number;
  comments: PostComment[];
  commentCount: number;
  views: number;
  tags: string[];
  status: 'active' | 'hidden' | 'deleted';
  isPinned: boolean;
  linkedListing?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TrendingTag {
  tag: string;
  count: number;
}

export interface FeedMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
  hasMore: boolean;
}

export interface CreatePostRequest {
  content: string;
  imageUrls?: string[];
  linkedListing?: string;
}

export interface UpdatePostRequest {
  content?: string;
  imageUrls?: string[];
  isPinned?: boolean;
  linkedListing?: string;
}

// ==================== SERVICE ====================

class ExploreService {
  /**
   * Get the public feed (latest or trending posts)
   */
  async getFeed(options: {
    page?: number;
    limit?: number;
    tag?: string;
    type?: 'latest' | 'trending';
  } = {}): Promise<{ posts: Post[]; meta: FeedMeta }> {
    const { page = 1, limit = 20, tag, type = 'latest' } = options;
    
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    params.append('type', type);
    if (tag) params.append('tag', sanitizeString(tag));
    
    const response = await apiCall<any>(
      `/posts/feed?${params.toString()}`,
      { method: 'GET' }
    );
    
    if (response.success && response.data) {
      // Handle case where posts might be directly in data or nested
      const posts = Array.isArray(response.data) ? response.data : (response.data.posts || []);
      const meta = response.data.meta || response.meta || {
        total: posts.length,
        page: page,
        limit: limit,
        pages: 1,
        hasMore: false
      };
      
      return { posts, meta };
    }
    
    throw new Error(response.error?.message || 'Failed to fetch feed');
  }

  /**
   * Get feed from users the current user follows/subscribes to
   */
  async getFollowingFeed(options: {
    page?: number;
    limit?: number;
  } = {}): Promise<{ posts: Post[]; meta: FeedMeta }> {
    const { page = 1, limit = 20 } = options;
    
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    
    const response = await apiCall<any>(
      `/posts/following/feed?${params.toString()}`,
      { method: 'GET' }
    );
    
    if (response.success && response.data) {
      // Handle case where posts might be directly in data or nested
      const posts = Array.isArray(response.data) ? response.data : (response.data.posts || []);
      const meta = response.data.meta || response.meta || {
        total: posts.length,
        page: page,
        limit: limit,
        pages: 1,
        hasMore: false
      };
      
      return { posts, meta };
    }
    
    throw new Error(response.error?.message || 'Failed to fetch following feed');
  }

  /**
   * Get trending hashtags
   */
  async getTrendingTags(limit: number = 10): Promise<TrendingTag[]> {
    const response = await apiCall<{ tags: TrendingTag[] }>(
      `/posts/trending-tags?limit=${limit}`,
      { method: 'GET' }
    );
    
    if (response.success && response.data) {
      return response.data.tags;
    }
    
    return [];
  }

  /**
   * Get a single post by ID
   */
  async getPost(postId: string): Promise<Post> {
    const response = await apiCall<{ post: Post }>(
      `/posts/${sanitizeString(postId)}`,
      { method: 'GET' }
    );
    
    if (response.success && response.data) {
      return response.data.post;
    }
    
    throw new Error(response.error?.message || 'Failed to fetch post');
  }

  /**
   * Get posts by a specific user
   */
  async getPostsByUser(username: string, options: {
    page?: number;
    limit?: number;
  } = {}): Promise<{ posts: Post[]; meta: FeedMeta }> {
    const { page = 1, limit = 20 } = options;
    
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    
    const response = await apiCall<any>(
      `/posts/user/${sanitizeUsername(username)}?${params.toString()}`,
      { method: 'GET' }
    );
    
    if (response.success && response.data) {
      // Handle case where posts might be directly in data or nested
      const posts = Array.isArray(response.data) ? response.data : (response.data.posts || []);
      const meta = response.data.meta || response.meta || {
        total: posts.length,
        page: page,
        limit: limit,
        pages: 1,
        hasMore: false
      };
      
      return { posts, meta };
    }
    
    throw new Error(response.error?.message || 'Failed to fetch user posts');
  }

  /**
   * Create a new post (sellers only)
   */
  async createPost(data: CreatePostRequest): Promise<Post> {
    const sanitizedData = {
      content: sanitizeString(data.content),
      imageUrls: data.imageUrls?.map(url => sanitizeString(url)) || [],
      linkedListing: data.linkedListing ? sanitizeString(data.linkedListing) : undefined
    };
    
    const response = await apiCall<{ post: Post }>(
      '/posts',
      {
        method: 'POST',
        body: JSON.stringify(sanitizedData)
      }
    );
    
    if (response.success && response.data) {
      return response.data.post;
    }
    
    throw new Error(response.error?.message || 'Failed to create post');
  }

  /**
   * Update an existing post
   */
  async updatePost(postId: string, data: UpdatePostRequest): Promise<Post> {
    const sanitizedData: UpdatePostRequest = {};
    
    if (data.content !== undefined) {
      sanitizedData.content = sanitizeString(data.content);
    }
    if (data.imageUrls !== undefined) {
      sanitizedData.imageUrls = data.imageUrls.map(url => sanitizeString(url));
    }
    if (data.isPinned !== undefined) {
      sanitizedData.isPinned = data.isPinned;
    }
    if (data.linkedListing !== undefined) {
      sanitizedData.linkedListing = sanitizeString(data.linkedListing);
    }
    
    const response = await apiCall<{ post: Post }>(
      `/posts/${sanitizeString(postId)}`,
      {
        method: 'PUT',
        body: JSON.stringify(sanitizedData)
      }
    );
    
    if (response.success && response.data) {
      return response.data.post;
    }
    
    throw new Error(response.error?.message || 'Failed to update post');
  }

  /**
   * Delete a post (soft delete)
   */
  async deletePost(postId: string): Promise<void> {
    const response = await apiCall(
      `/posts/${sanitizeString(postId)}`,
      { method: 'DELETE' }
    );
    
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete post');
    }
  }

  /**
   * Toggle like on a post
   */
  async toggleLike(postId: string): Promise<{ liked: boolean; likeCount: number }> {
    const response = await apiCall<{ liked: boolean; likeCount: number }>(
      `/posts/${sanitizeString(postId)}/like`,
      { method: 'POST' }
    );
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error?.message || 'Failed to toggle like');
  }

  /**
   * Add a comment to a post
   */
  async addComment(postId: string, content: string): Promise<PostComment> {
    if (content.length > 500) {
      throw new Error('Comment must be 500 characters or less');
    }
    
    const response = await apiCall<{ comment: PostComment }>(
      `/posts/${sanitizeString(postId)}/comment`,
      {
        method: 'POST',
        body: JSON.stringify({ content: sanitizeString(content) })
      }
    );
    
    if (response.success && response.data) {
      return response.data.comment;
    }
    
    throw new Error(response.error?.message || 'Failed to add comment');
  }

  /**
   * Delete a comment from a post
   */
  async deleteComment(postId: string, commentId: string): Promise<void> {
    const response = await apiCall(
      `/posts/${sanitizeString(postId)}/comment/${sanitizeString(commentId)}`,
      { method: 'DELETE' }
    );
    
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete comment');
    }
  }
}

// Export singleton instance
const exploreService = new ExploreService();
export default exploreService;