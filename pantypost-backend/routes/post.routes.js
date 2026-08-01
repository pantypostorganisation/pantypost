// pantypost-backend/routes/post.routes.js

const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const Notification = require('../models/Notification');
const authMiddleware = require('../middleware/auth.middleware');
const {
  markPending,
  hasMaterialChange,
  MATERIAL_POST_FIELDS,
} = require('../utils/moderation');

// Helper: Get author info
async function getAuthorInfo(username) {
  const user = await User.findOne({ username }).select('username profilePic isVerified tier bio').lean();
  if (!user) return null;
  
  return {
    username: user.username,
    profilePic: user.profilePic,
    isVerified: user.isVerified || false,
    tier: user.tier,
    bio: user.bio
  };
}

// Helper: Enrich posts with author info
async function enrichPostsWithAuthorInfo(posts) {
  const authorUsernames = [...new Set(posts.map(p => p.author))];
  const authors = await User.find({ username: { $in: authorUsernames } })
    .select('username profilePic isVerified tier bio')
    .lean();
  
  const authorMap = {};
  authors.forEach(a => {
    authorMap[a.username] = {
      username: a.username,
      profilePic: a.profilePic,
      isVerified: a.isVerified || false,
      tier: a.tier,
      bio: a.bio
    };
  });
  
  return posts.map(post => ({
    ...post,
    authorInfo: authorMap[post.author] || null
  }));
}

// Helper: Send notification (async, non-blocking)
async function sendNotification(userId, type, data) {
  try {
    if (!userId) return;
    
    const user = await User.findOne({ username: userId });
    if (!user) return;
    
    await Notification.create({
      userId: user._id,
      type,
      title: data.title,
      message: data.message,
      data: data.metadata || {},
      priority: 'low'
    });
  } catch (error) {
    console.error('[Post] Notification error:', error.message);
  }
}

// ==================== PUBLIC ROUTES ====================

// GET /api/posts/feed - Get public feed
router.get('/feed', async (req, res) => {
  try {
    const { page = 1, limit = 10, type = 'latest', tag } = req.query;
    
    const result = await Post.getFeed({
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 50),
      type,
      tag: tag || null
    });
    
    // Enrich with author info
    const enrichedPosts = await enrichPostsWithAuthorInfo(result.posts);
    
    res.json({
      success: true,
      data: {
        posts: enrichedPosts,
        pagination: result.pagination
      }
    });
  } catch (error) {
    console.error('[Post] Feed error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch feed'
    });
  }
});

// GET /api/posts/trending-tags - Get trending hashtags
router.get('/trending-tags', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const tags = await Post.getTrendingTags(parseInt(limit));
    
    res.json({
      success: true,
      data: tags
    });
  } catch (error) {
    console.error('[Post] Trending tags error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trending tags'
    });
  }
});

// GET /api/posts/user/:username - Get posts by user
router.get('/user/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Optionally identify the viewer. An author looking at their own
    // profile should still see posts awaiting review, otherwise
    // submitted content appears to vanish.
    let viewerUsername = null;
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        viewerUsername = decoded.username;
      } catch (error) {
        // Anonymous viewer.
      }
    }
    
    const result = await Post.getPostsByAuthor(username, {
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 50),
      viewerUsername
    });
    
    // Enrich with author info
    const enrichedPosts = await enrichPostsWithAuthorInfo(result.posts);
    
    res.json({
      success: true,
      data: {
        posts: enrichedPosts,
        pagination: result.pagination
      }
    });
  } catch (error) {
    console.error('[Post] User posts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user posts'
    });
  }
});

// GET /api/posts/following/feed - Get feed from followed users (must be before /:id)
router.get('/following/feed', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const userId = req.user._id;
    
    // Get list of users this user follows
    const subscriptions = await Subscription.find({
      subscriberId: userId,
      status: 'active'
    }).select('sellerUsername').lean();
    
    const followedUsers = subscriptions.map(s => s.sellerUsername);
    
    if (followedUsers.length === 0) {
      return res.json({
        success: true,
        data: {
          posts: [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: 0,
            pages: 0
          }
        }
      });
    }
    
    const result = await Post.getFeed({
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 50),
      type: 'latest',
      followedUsers
    });
    
    // Enrich with author info
    const enrichedPosts = await enrichPostsWithAuthorInfo(result.posts);
    
    res.json({
      success: true,
      data: {
        posts: enrichedPosts,
        pagination: result.pagination
      }
    });
  } catch (error) {
    console.error('[Post] Following feed error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch following feed'
    });
  }
});

// GET /api/posts/:id - Get single post
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post || post.status === 'deleted') {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    // Unapproved posts must not be reachable by direct link. Only the
    // author and admins may view them. A 404 rather than a 403 avoids
    // confirming that a pending post exists.
    if (post.approvalStatus !== 'approved') {
      let viewerUsername = null;
      let viewerRole = null;

      const token = req.headers.authorization?.replace('Bearer ', '');
      if (token) {
        try {
          const jwt = require('jsonwebtoken');
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          viewerUsername = decoded.username;
          viewerRole = decoded.role;
        } catch (error) {
          // Treat an invalid token as anonymous.
        }
      }

      if (viewerUsername !== post.author && viewerRole !== 'admin') {
        return res.status(404).json({
          success: false,
          error: 'Post not found'
        });
      }
    }
    
    // Increment views
    post.incrementViews();
    await post.save();
    
    // Get author info
    const authorInfo = await getAuthorInfo(post.author);
    
    res.json({
      success: true,
      data: {
        ...post.toObject(),
        authorInfo
      }
    });
  } catch (error) {
    console.error('[Post] Get post error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch post'
    });
  }
});

// ==================== AUTHENTICATED ROUTES ====================

// POST /api/posts - Create new post (sellers only)
router.post('/', authMiddleware, async (req, res) => {
  try {
    // Check if user is a seller
    if (req.user.role !== 'seller') {
      return res.status(403).json({
        success: false,
        error: 'Only sellers can create posts'
      });
    }
    
    const { content, imageUrls, linkedListing } = req.body;
    
    // Validate content
    if (!content && (!imageUrls || imageUrls.length === 0)) {
      return res.status(400).json({
        success: false,
        error: 'Post must have content or media'
      });
    }
    
    if (content && content.length > 2000) {
      return res.status(400).json({
        success: false,
        error: 'Content must be 2000 characters or less'
      });
    }
    
    // Validate imageUrls
    if (imageUrls && imageUrls.length > 4) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 4 media files allowed'
      });
    }
    
    // Create post. The schema defaults to pending; this is explicit so
    // the intent is obvious at the point of creation.
    const post = new Post({
      author: req.user.username,
      content: content || '',
      imageUrls: imageUrls || [],
      linkedListing
    });
    markPending(post, 'Awaiting initial review');
    
    await post.save();
    
    // Get author info
    const authorInfo = await getAuthorInfo(req.user.username);
    
    // NOTE: Subscribers are deliberately NOT notified here.
    // A notification is itself a form of publication — it would push
    // the post's existence to users before a moderator has seen it.
    // Notifications are sent on approval instead.
    
    res.status(201).json({
      success: true,
      data: {
        ...post.toObject(),
        authorInfo
      },
      message: 'Post submitted and awaiting review before publication.'
    });
  } catch (error) {
    console.error('[Post] Create error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create post'
    });
  }
});

// PUT /api/posts/:id - Update post
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }
    
    // Check ownership
    if (post.author !== req.user.username) {
      return res.status(403).json({
        success: false,
        error: 'You can only edit your own posts'
      });
    }
    
    const { content, imageUrls, isPinned } = req.body;

    // Detect material changes before mutating the document, so the
    // comparison is against what a moderator actually reviewed.
    // Pinning is excluded: it changes placement, not content.
    const needsReReview = hasMaterialChange(post, req.body, MATERIAL_POST_FIELDS);
    
    // Update fields
    if (content !== undefined) {
      if (content.length > 2000) {
        return res.status(400).json({
          success: false,
          error: 'Content must be 2000 characters or less'
        });
      }
      post.content = content;
    }
    
    if (imageUrls !== undefined) {
      if (imageUrls.length > 4) {
        return res.status(400).json({
          success: false,
          error: 'Maximum 4 media files allowed'
        });
      }
      post.imageUrls = imageUrls;
    }
    
    if (isPinned !== undefined) {
      // Unpin other posts if pinning this one
      if (isPinned) {
        await Post.updateMany(
          { author: req.user.username, isPinned: true, _id: { $ne: post._id } },
          { isPinned: false }
        );
      }
      post.isPinned = isPinned;
    }

    // Same principle as listings: approval covers the reviewed content,
    // not the post forever. Editing the text or swapping the media
    // returns it to the queue.
    if (needsReReview) {
      markPending(post, 'Returned to review after edit by author');
      console.log('[Post] Returned to moderation queue after material edit:', post._id);
    }
    
    await post.save();
    
    // Get author info
    const authorInfo = await getAuthorInfo(req.user.username);
    
    res.json({
      success: true,
      data: {
        ...post.toObject(),
        authorInfo
      },
      ...(needsReReview
        ? { message: 'Your edit has been submitted for review and is not publicly visible until approved.' }
        : {})
    });
  } catch (error) {
    console.error('[Post] Update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update post'
    });
  }
});

// DELETE /api/posts/:id - Delete post (soft delete)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }
    
    // Check ownership (or admin)
    if (post.author !== req.user.username && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'You can only delete your own posts'
      });
    }
    
    post.status = 'deleted';
    await post.save();
    
    res.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('[Post] Delete error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete post'
    });
  }
});

// POST /api/posts/:id/like - Toggle like on post
router.post('/:id/like', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    // Unapproved posts cannot be interacted with, since they are not
    // publicly visible in the first place.
    if (!post || post.status !== 'active' || post.approvalStatus !== 'approved') {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }
    
    const username = req.user.username;
    let liked;
    
    if (post.likes.includes(username)) {
      post.removeLike(username);
      liked = false;
    } else {
      post.addLike(username);
      liked = true;
      
      // Notify post author (async)
      if (post.author !== username) {
        setImmediate(() => {
          sendNotification(post.author, 'like', {
            title: 'New Like',
            message: `${username} liked your post`,
            metadata: { postId: post._id }
          });
        });
      }
    }
    
    await post.save();
    
    res.json({
      success: true,
      data: {
        liked,
        likeCount: post.likeCount
      }
    });
  } catch (error) {
    console.error('[Post] Like error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle like'
    });
  }
});

// POST /api/posts/:id/comment - Add comment to post
router.post('/:id/comment', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    // Comments are only accepted on posts that are actually published.
    if (!post || post.status !== 'active' || post.approvalStatus !== 'approved') {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }
    
    const { content } = req.body;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Comment content is required'
      });
    }
    
    if (content.length > 500) {
      return res.status(400).json({
        success: false,
        error: 'Comment must be 500 characters or less'
      });
    }
    
    const comment = post.addComment(req.user.username, content.trim());
    await post.save();
    
    // Notify post author (async)
    if (post.author !== req.user.username) {
      setImmediate(() => {
        sendNotification(post.author, 'comment', {
          title: 'New Comment',
          message: `${req.user.username} commented on your post`,
          metadata: { postId: post._id, commentId: comment._id }
        });
      });
    }
    
    res.status(201).json({
      success: true,
      data: comment
    });
  } catch (error) {
    console.error('[Post] Comment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add comment'
    });
  }
});

// DELETE /api/posts/:id/comment/:commentId - Delete comment
router.delete('/:id/comment/:commentId', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }
    
    const removed = post.removeComment(req.params.commentId, req.user.username);
    
    if (!removed) {
      return res.status(403).json({
        success: false,
        error: 'Cannot delete this comment'
      });
    }
    
    await post.save();
    
    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('[Post] Delete comment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete comment'
    });
  }
});

module.exports = router;