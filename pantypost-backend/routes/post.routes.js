// pantypost-backend/routes/post.routes.js
const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const Notification = require('../models/Notification');
const authMiddleware = require('../middleware/auth.middleware');

// ==================== PUBLIC ROUTES ====================

// GET /api/posts/feed - Get explore feed (public, but personalized if logged in)
router.get('/feed', async (req, res) => {
  try {
    const { page = 1, limit = 20, tag, type = 'latest' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let posts;
    
    if (type === 'trending') {
      posts = await Post.getTrendingPosts(parseInt(limit));
    } else {
      posts = await Post.getFeed({
        limit: parseInt(limit),
        skip,
        tag: tag || null
      });
    }

    // Enrich posts with author info
    const enrichedPosts = await Promise.all(posts.map(async (post) => {
      const author = await User.findOne({ username: post.author })
        .select('username profilePic isVerified tier bio')
        .lean();
      
      return {
        ...post,
        id: post._id,
        authorInfo: author ? {
          username: author.username,
          profilePic: author.profilePic,
          isVerified: author.isVerified,
          tier: author.tier,
          bio: author.bio
        } : null
      };
    }));

    // Get total count for pagination
    const total = await Post.countDocuments({ status: 'active', ...(tag ? { tags: tag.toLowerCase() } : {}) });

    res.json({
      success: true,
      data: enrichedPosts,
      meta: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('[Posts] Feed error:', error);
    res.status(500).json({ success: false, error: error.message });
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
    console.error('[Posts] Trending tags error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/posts/:id - Get single post
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).lean();
    
    if (!post || post.status !== 'active') {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    // Get author info
    const author = await User.findOne({ username: post.author })
      .select('username profilePic isVerified tier bio subscriberCount')
      .lean();

    // Increment view count (async, don't wait)
    Post.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }).exec();

    res.json({
      success: true,
      data: {
        ...post,
        id: post._id,
        authorInfo: author ? {
          username: author.username,
          profilePic: author.profilePic,
          isVerified: author.isVerified,
          tier: author.tier,
          bio: author.bio,
          subscriberCount: author.subscriberCount
        } : null
      }
    });
  } catch (error) {
    console.error('[Posts] Get post error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/posts/user/:username - Get posts by user
router.get('/user/:username', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const posts = await Post.getPostsByAuthor(req.params.username, parseInt(limit), skip);
    
    // Get author info once
    const author = await User.findOne({ username: req.params.username })
      .select('username profilePic isVerified tier bio')
      .lean();

    const enrichedPosts = posts.map(post => ({
      ...post,
      id: post._id,
      authorInfo: author ? {
        username: author.username,
        profilePic: author.profilePic,
        isVerified: author.isVerified,
        tier: author.tier
      } : null
    }));

    const total = await Post.countDocuments({ author: req.params.username, status: 'active' });

    res.json({
      success: true,
      data: enrichedPosts,
      meta: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('[Posts] User posts error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== AUTHENTICATED ROUTES ====================

// POST /api/posts - Create a new post (sellers only)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { content, imageUrls, linkedListing } = req.body;
    const author = req.user.username;

    // Verify user is a seller
    const user = await User.findOne({ username: author });
    if (!user || user.role !== 'seller') {
      return res.status(403).json({ success: false, error: 'Only sellers can create posts' });
    }

    // Validate content
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Post content is required' });
    }

    if (content.length > 2000) {
      return res.status(400).json({ success: false, error: 'Post content too long (max 2000 characters)' });
    }

    // Validate images
    if (imageUrls && imageUrls.length > 4) {
      return res.status(400).json({ success: false, error: 'Maximum 4 images allowed per post' });
    }

    const post = new Post({
      author,
      content: content.trim(),
      imageUrls: imageUrls || [],
      linkedListing: linkedListing || null
    });

    await post.save();

    // Return with author info
    res.status(201).json({
      success: true,
      data: {
        ...post.toObject(),
        id: post._id,
        authorInfo: {
          username: user.username,
          profilePic: user.profilePic,
          isVerified: user.isVerified,
          tier: user.tier
        }
      }
    });

    // Notify subscribers about new post (async)
    const subscribers = await Subscription.find({ creator: author, status: 'active' }).select('subscriber');
    for (const sub of subscribers) {
      await Notification.createNotification({
        recipient: sub.subscriber,
        type: 'system',
        title: 'New Post',
        message: `${author} shared a new post`,
        data: { postId: post._id, author },
        priority: 'low'
      });
    }
  } catch (error) {
    console.error('[Posts] Create post error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/posts/:id - Update a post
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    if (post.author !== req.user.username && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not authorized to edit this post' });
    }

    const { content, imageUrls, isPinned } = req.body;

    if (content !== undefined) {
      if (content.trim().length === 0) {
        return res.status(400).json({ success: false, error: 'Post content cannot be empty' });
      }
      if (content.length > 2000) {
        return res.status(400).json({ success: false, error: 'Post content too long' });
      }
      post.content = content.trim();
    }

    if (imageUrls !== undefined) {
      if (imageUrls.length > 4) {
        return res.status(400).json({ success: false, error: 'Maximum 4 images allowed' });
      }
      post.imageUrls = imageUrls;
    }

    if (isPinned !== undefined) {
      // Unpin any existing pinned posts by this author
      if (isPinned) {
        await Post.updateMany(
          { author: post.author, isPinned: true, _id: { $ne: post._id } },
          { isPinned: false }
        );
      }
      post.isPinned = isPinned;
    }

    await post.save();

    res.json({
      success: true,
      data: {
        ...post.toObject(),
        id: post._id
      }
    });
  } catch (error) {
    console.error('[Posts] Update post error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/posts/:id - Delete a post
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    if (post.author !== req.user.username && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not authorized to delete this post' });
    }

    // Soft delete
    post.status = 'deleted';
    await post.save();

    res.json({ success: true, message: 'Post deleted' });
  } catch (error) {
    console.error('[Posts] Delete post error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/posts/:id/like - Like a post
router.post('/:id/like', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post || post.status !== 'active') {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    const username = req.user.username;
    const alreadyLiked = post.likes.includes(username);

    if (alreadyLiked) {
      // Unlike
      await post.removeLike(username);
    } else {
      // Like
      await post.addLike(username);
      
      // Notify post author (if not liking own post)
      if (post.author !== username) {
        await Notification.createNotification({
          recipient: post.author,
          type: 'system',
          title: 'New Like',
          message: `${username} liked your post`,
          data: { postId: post._id, liker: username },
          priority: 'low'
        });
      }
    }

    res.json({
      success: true,
      data: {
        liked: !alreadyLiked,
        likeCount: post.likeCount
      }
    });
  } catch (error) {
    console.error('[Posts] Like post error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/posts/:id/comment - Add comment to a post
router.post('/:id/comment', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post || post.status !== 'active') {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    const { content } = req.body;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Comment content is required' });
    }

    if (content.length > 500) {
      return res.status(400).json({ success: false, error: 'Comment too long (max 500 characters)' });
    }

    const username = req.user.username;
    const comment = await post.addComment(username, content.trim());

    // Get commenter info
    const commenter = await User.findOne({ username })
      .select('username profilePic isVerified')
      .lean();

    // Notify post author (if not commenting on own post)
    if (post.author !== username) {
      await Notification.createNotification({
        recipient: post.author,
        type: 'system',
        title: 'New Comment',
        message: `${username} commented on your post`,
        data: { postId: post._id, commenter: username, commentId: comment._id },
        priority: 'low'
      });
    }

    res.status(201).json({
      success: true,
      data: {
        ...comment.toObject(),
        id: comment._id,
        authorInfo: commenter
      }
    });
  } catch (error) {
    console.error('[Posts] Add comment error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/posts/:id/comment/:commentId - Delete a comment
router.delete('/:id/comment/:commentId', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    await post.removeComment(req.params.commentId, req.user.username);

    res.json({ success: true, message: 'Comment deleted' });
  } catch (error) {
    console.error('[Posts] Delete comment error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// GET /api/posts/following/feed - Get feed from followed users only
router.get('/following/feed', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const username = req.user.username;

    // Get list of users this user follows (subscribed to)
    const subscriptions = await Subscription.find({ 
      subscriber: username, 
      status: 'active' 
    }).select('creator');
    
    const followedUsers = subscriptions.map(s => s.creator);

    if (followedUsers.length === 0) {
      return res.json({
        success: true,
        data: [],
        meta: { page: 1, limit: parseInt(limit), total: 0, totalPages: 0 }
      });
    }

    const posts = await Post.getFeed({
      limit: parseInt(limit),
      skip,
      followedUsers
    });

    // Enrich with author info
    const enrichedPosts = await Promise.all(posts.map(async (post) => {
      const author = await User.findOne({ username: post.author })
        .select('username profilePic isVerified tier')
        .lean();
      
      return {
        ...post,
        id: post._id,
        isLiked: post.likes.includes(username),
        authorInfo: author ? {
          username: author.username,
          profilePic: author.profilePic,
          isVerified: author.isVerified,
          tier: author.tier
        } : null
      };
    }));

    const total = await Post.countDocuments({ 
      status: 'active', 
      author: { $in: followedUsers } 
    });

    res.json({
      success: true,
      data: enrichedPosts,
      meta: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('[Posts] Following feed error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;