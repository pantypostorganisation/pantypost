// pantypost-backend/models/Post.js

const mongoose = require('mongoose');

// Comment subdocument schema
const commentSchema = new mongoose.Schema({
  author: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Main Post schema
const postSchema = new mongoose.Schema({
  // Author info
  author: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  
  // Content
  content: {
    type: String,
    trim: true,
    maxlength: 2000,
    default: ''
  },
  
  // Media URLs (images and videos)
  imageUrls: [{
    type: String,
    trim: true
  }],
  
  // Engagement
  likes: [{
    type: String,
    trim: true
  }],
  likeCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Comments
  comments: [commentSchema],
  commentCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Views
  views: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Tags (hashtags extracted from content)
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  
  // Status
  status: {
    type: String,
    enum: ['active', 'hidden', 'deleted'],
    default: 'active',
    index: true
  },
  
  // Pinned post (one per seller)
  isPinned: {
    type: Boolean,
    default: false
  },
  
  // Optional linked listing
  linkedListing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing'
  }
}, {
  timestamps: true
});

// Indexes for performance
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ status: 1, createdAt: -1 });
postSchema.index({ tags: 1 });
postSchema.index({ likeCount: -1, createdAt: -1 });
postSchema.index({ isPinned: -1, createdAt: -1 });

// Pre-save hook to extract hashtags
postSchema.pre('save', function(next) {
  if (this.isModified('content') && this.content) {
    // Extract hashtags from content
    const hashtagRegex = /#(\w+)/g;
    const matches = this.content.match(hashtagRegex);
    
    if (matches) {
      // Remove # and deduplicate, limit to 10 tags
      this.tags = [...new Set(matches.map(tag => tag.slice(1).toLowerCase()))].slice(0, 10);
    } else {
      this.tags = [];
    }
  }
  next();
});

// Instance method: Add like
postSchema.methods.addLike = function(username) {
  if (!this.likes.includes(username)) {
    this.likes.push(username);
    this.likeCount = this.likes.length;
    return true;
  }
  return false;
};

// Instance method: Remove like
postSchema.methods.removeLike = function(username) {
  const index = this.likes.indexOf(username);
  if (index > -1) {
    this.likes.splice(index, 1);
    this.likeCount = this.likes.length;
    return true;
  }
  return false;
};

// Instance method: Add comment
postSchema.methods.addComment = function(author, content) {
  this.comments.push({ author, content });
  this.commentCount = this.comments.length;
  return this.comments[this.comments.length - 1];
};

// Instance method: Remove comment
postSchema.methods.removeComment = function(commentId, requestingUser) {
  const comment = this.comments.id(commentId);
  if (!comment) return false;
  
  // Only allow comment author or post author to delete
  if (comment.author !== requestingUser && this.author !== requestingUser) {
    return false;
  }
  
  comment.deleteOne();
  this.commentCount = this.comments.length;
  return true;
};

// Instance method: Increment views
postSchema.methods.incrementViews = function() {
  this.views += 1;
};

// Static method: Get feed with pagination
postSchema.statics.getFeed = async function(options = {}) {
  const {
    page = 1,
    limit = 10,
    type = 'latest',
    tag = null,
    followedUsers = null,
    excludeAuthor = null
  } = options;
  
  const query = { status: 'active' };
  
  // Filter by tag
  if (tag) {
    query.tags = tag.toLowerCase();
  }
  
  // Filter by followed users
  if (followedUsers && followedUsers.length > 0) {
    query.author = { $in: followedUsers };
  }
  
  // Exclude specific author
  if (excludeAuthor) {
    query.author = { $ne: excludeAuthor };
  }
  
  // Determine sort order
  let sort;
  if (type === 'trending') {
    // Trending: Sort by engagement score (likes + comments*2 + views*0.1)
    sort = { likeCount: -1, commentCount: -1, createdAt: -1 };
  } else {
    // Latest: Sort by creation date
    sort = { createdAt: -1 };
  }
  
  const skip = (page - 1) * limit;
  
  const [posts, total] = await Promise.all([
    this.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    this.countDocuments(query)
  ]);
  
  return {
    posts,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

// Static method: Get trending posts
postSchema.statics.getTrendingPosts = async function(limit = 10) {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  return this.find({
    status: 'active',
    createdAt: { $gte: oneDayAgo }
  })
    .sort({ likeCount: -1, commentCount: -1, views: -1 })
    .limit(limit)
    .lean();
};

// Static method: Get posts by author
postSchema.statics.getPostsByAuthor = async function(username, options = {}) {
  const { page = 1, limit = 10 } = options;
  const skip = (page - 1) * limit;
  
  const query = {
    author: username,
    status: 'active'
  };
  
  const [posts, total] = await Promise.all([
    this.find(query)
      .sort({ isPinned: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    this.countDocuments(query)
  ]);
  
  return {
    posts,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

// Static method: Get trending tags
postSchema.statics.getTrendingTags = async function(limit = 10) {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  return this.aggregate([
    {
      $match: {
        status: 'active',
        createdAt: { $gte: oneDayAgo },
        tags: { $exists: true, $ne: [] }
      }
    },
    { $unwind: '$tags' },
    {
      $group: {
        _id: '$tags',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: limit },
    {
      $project: {
        _id: 0,
        tag: '$_id',
        count: 1
      }
    }
  ]);
};

const Post = mongoose.model('Post', postSchema);

module.exports = Post;