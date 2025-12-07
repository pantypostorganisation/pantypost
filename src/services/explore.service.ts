// src/services/explore.service.ts

import { apiCall } from './api.config';

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
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface FeedResponse {
  posts: Post[];
  meta: FeedMeta;
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
}

// ==================== SERVICE ====================

class ExploreService {
  /**
   * Get the public feed with optional filtering
   */
  async getFeed(options: {
    page?: number;
    limit?: number;
    type?: 'latest' | 'trending';
    tag?: string;
  } = {}): Promise<FeedResponse> {
    const { page = 1, limit = 10, type = 'latest', tag } = options;
    
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      type
    });
    
    if (tag) {
      params.append('tag', tag);
    }
    
    try {
      const response = await apiCall<{
        posts: Post[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          pages: number;
        };
      }>(`/posts/feed?${params.toString()}`);
      
      if (response.success && response.data) {
        return {
          posts: response.data.posts || [],
          meta: {
            page: response.data.pagination?.page || page,
            limit: response.data.pagination?.limit || limit,
            total: response.data.pagination?.total || 0,
            totalPages: response.data.pagination?.pages || 0,
            hasMore: (response.data.pagination?.page || 0) < (response.data.pagination?.pages || 0)
          }
        };
      }
      
      return {
        posts: [],
        meta: { page, limit, total: 0, totalPages: 0, hasMore: false }
      };
    } catch (error) {
      console.error('[ExploreService] getFeed error:', error);
      return {
        posts: [],
        meta: { page, limit, total: 0, totalPages: 0, hasMore: false }
      };
    }
  }

  /**
   * Get feed from users the current user follows
   */
  async getFollowingFeed(options: {
    page?: number;
    limit?: number;
  } = {}): Promise<FeedResponse> {
    const { page = 1, limit = 10 } = options;
    
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });
    
    try {
      const response = await apiCall<{
        posts: Post[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          pages: number;
        };
      }>(`/posts/following/feed?${params.toString()}`);
      
      if (response.success && response.data) {
        return {
          posts: response.data.posts || [],
          meta: {
            page: response.data.pagination?.page || page,
            limit: response.data.pagination?.limit || limit,
            total: response.data.pagination?.total || 0,
            totalPages: response.data.pagination?.pages || 0,
            hasMore: (response.data.pagination?.page || 0) < (response.data.pagination?.pages || 0)
          }
        };
      }
      
      return {
        posts: [],
        meta: { page, limit, total: 0, totalPages: 0, hasMore: false }
      };
    } catch (error) {
      console.error('[ExploreService] getFollowingFeed error:', error);
      return {
        posts: [],
        meta: { page, limit, total: 0, totalPages: 0, hasMore: false }
      };
    }
  }

  /**
   * Get trending hashtags
   */
  async getTrendingTags(limit: number = 10): Promise<TrendingTag[]> {
    try {
      const response = await apiCall<TrendingTag[]>(`/posts/trending-tags?limit=${limit}`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      return [];
    } catch (error) {
      console.error('[ExploreService] getTrendingTags error:', error);
      return [];
    }
  }

  /**
   * Get a single post by ID
   */
  async getPost(postId: string): Promise<Post | null> {
    try {
      const response = await apiCall<Post>(`/posts/${postId}`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      return null;
    } catch (error) {
      console.error('[ExploreService] getPost error:', error);
      return null;
    }
  }

  /**
   * Get posts by a specific user
   */
  async getPostsByUser(username: string, options: {
    page?: number;
    limit?: number;
  } = {}): Promise<FeedResponse> {
    const { page = 1, limit = 10 } = options;
    
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });
    
    try {
      const response = await apiCall<{
        posts: Post[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          pages: number;
        };
      }>(`/posts/user/${encodeURIComponent(username)}?${params.toString()}`);
      
      if (response.success && response.data) {
        return {
          posts: response.data.posts || [],
          meta: {
            page: response.data.pagination?.page || page,
            limit: response.data.pagination?.limit || limit,
            total: response.data.pagination?.total || 0,
            totalPages: response.data.pagination?.pages || 0,
            hasMore: (response.data.pagination?.page || 0) < (response.data.pagination?.pages || 0)
          }
        };
      }
      
      return {
        posts: [],
        meta: { page, limit, total: 0, totalPages: 0, hasMore: false }
      };
    } catch (error) {
      console.error('[ExploreService] getPostsByUser error:', error);
      return {
        posts: [],
        meta: { page, limit, total: 0, totalPages: 0, hasMore: false }
      };
    }
  }

  /**
   * Create a new post (sellers only)
   */
  async createPost(data: CreatePostRequest): Promise<Post> {
    const response = await apiCall<Post>('/posts', {
      method: 'POST',
      body: JSON.stringify({
        content: data.content,
        imageUrls: data.imageUrls || [],
        linkedListing: data.linkedListing
      })
    });
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create post');
    }
    
    return response.data;
  }

  /**
   * Update an existing post
   */
  async updatePost(postId: string, data: UpdatePostRequest): Promise<Post> {
    const response = await apiCall<Post>(`/posts/${postId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update post');
    }
    
    return response.data;
  }

  /**
   * Delete a post (soft delete)
   */
  async deletePost(postId: string): Promise<void> {
    const response = await apiCall(`/posts/${postId}`, {
      method: 'DELETE'
    });
    
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete post');
    }
  }

  /**
   * Toggle like on a post
   */
  async toggleLike(postId: string): Promise<{ liked: boolean; likeCount: number }> {
    const response = await apiCall<{
      liked: boolean;
      likeCount: number;
    }>(`/posts/${postId}/like`, {
      method: 'POST'
    });
    
    if (response.success && response.data) {
      return response.data;
    }
    
    return { liked: false, likeCount: 0 };
  }

  /**
   * Add a comment to a post
   */
  async addComment(postId: string, content: string): Promise<PostComment> {
    if (content.length > 500) {
      throw new Error('Comment must be 500 characters or less');
    }
    
    const response = await apiCall<PostComment>(`/posts/${postId}/comment`, {
      method: 'POST',
      body: JSON.stringify({ content })
    });
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to add comment');
    }
    
    return response.data;
  }

  /**
   * Delete a comment from a post
   */
  async deleteComment(postId: string, commentId: string): Promise<void> {
    const response = await apiCall(`/posts/${postId}/comment/${commentId}`, {
      method: 'DELETE'
    });
    
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete comment');
    }
  }
}

// Export singleton instance
const exploreService = new ExploreService();
export default exploreService;