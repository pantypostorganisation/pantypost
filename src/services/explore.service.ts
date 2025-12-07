// src/services/explore.service.ts
import { apiCall } from './api';
import sanitize from './sanitize';

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
    if (tag) params.append('tag', sanitize.strict(tag));
    
    const response = await apiCall<{ posts: Post[]; meta: FeedMeta }>(
      `/posts/feed?${params.toString()}`,
      { method: 'GET' }
    );
    
    return response;
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
    
    const response = await apiCall<{ posts: Post[]; meta: FeedMeta }>(
      `/posts/following/feed?${params.toString()}`,
      { method: 'GET' }
    );
    
    return response;
  }

  /**
   * Get trending hashtags
   */
  async getTrendingTags(limit: number = 10): Promise<TrendingTag[]> {
    const response = await apiCall<{ tags: TrendingTag[] }>(
      `/posts/trending-tags?limit=${limit}`,
      { method: 'GET' }
    );
    
    return response.tags;
  }

  /**
   * Get a single post by ID
   */
  async getPost(postId: string): Promise<Post> {
    const response = await apiCall<{ post: Post }>(
      `/posts/${sanitize.strict(postId)}`,
      { method: 'GET' }
    );
    
    return response.post;
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
    
    const response = await apiCall<{ posts: Post[]; meta: FeedMeta }>(
      `/posts/user/${sanitize.username(username)}?${params.toString()}`,
      { method: 'GET' }
    );
    
    return response;
  }

  /**
   * Create a new post (sellers only)
   */
  async createPost(data: CreatePostRequest): Promise<Post> {
    const sanitizedData = {
      content: sanitize.strict(data.content),
      imageUrls: data.imageUrls?.map(url => sanitize.strict(url)) || [],
      linkedListing: data.linkedListing ? sanitize.strict(data.linkedListing) : undefined
    };
    
    const response = await apiCall<{ post: Post }>(
      '/posts',
      {
        method: 'POST',
        body: JSON.stringify(sanitizedData)
      }
    );
    
    return response.post;
  }

  /**
   * Update an existing post
   */
  async updatePost(postId: string, data: UpdatePostRequest): Promise<Post> {
    const sanitizedData: UpdatePostRequest = {};
    
    if (data.content !== undefined) {
      sanitizedData.content = sanitize.strict(data.content);
    }
    if (data.imageUrls !== undefined) {
      sanitizedData.imageUrls = data.imageUrls.map(url => sanitize.strict(url));
    }
    if (data.isPinned !== undefined) {
      sanitizedData.isPinned = data.isPinned;
    }
    if (data.linkedListing !== undefined) {
      sanitizedData.linkedListing = sanitize.strict(data.linkedListing);
    }
    
    const response = await apiCall<{ post: Post }>(
      `/posts/${sanitize.strict(postId)}`,
      {
        method: 'PUT',
        body: JSON.stringify(sanitizedData)
      }
    );
    
    return response.post;
  }

  /**
   * Delete a post (soft delete)
   */
  async deletePost(postId: string): Promise<void> {
    await apiCall(
      `/posts/${sanitize.strict(postId)}`,
      { method: 'DELETE' }
    );
  }

  /**
   * Toggle like on a post
   */
  async toggleLike(postId: string): Promise<{ liked: boolean; likeCount: number }> {
    const response = await apiCall<{ liked: boolean; likeCount: number }>(
      `/posts/${sanitize.strict(postId)}/like`,
      { method: 'POST' }
    );
    
    return response;
  }

  /**
   * Add a comment to a post
   */
  async addComment(postId: string, content: string): Promise<PostComment> {
    if (content.length > 500) {
      throw new Error('Comment must be 500 characters or less');
    }
    
    const response = await apiCall<{ comment: PostComment }>(
      `/posts/${sanitize.strict(postId)}/comment`,
      {
        method: 'POST',
        body: JSON.stringify({ content: sanitize.strict(content) })
      }
    );
    
    return response.comment;
  }

  /**
   * Delete a comment from a post
   */
  async deleteComment(postId: string, commentId: string): Promise<void> {
    await apiCall(
      `/posts/${sanitize.strict(postId)}/comment/${sanitize.strict(commentId)}`,
      { method: 'DELETE' }
    );
  }
}

// Export singleton instance
const exploreService = new ExploreService();
export default exploreService;