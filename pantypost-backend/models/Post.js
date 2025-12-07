// pantypost-backend/models/Post.js
const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  author: {
    type: String,
    required: true,
    ref: 'User'
  },
  content: {
    type: String,
    required: true,
    maxlength: 500
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const postSchema = new mongoose.Schema({
  // The seller who created the post
  author: {
    type: String,
    required: true,
    ref: 'User',
    index: true
  },
  
  // Post content
  content: {
    type: String,
    required: true,
    maxlength: 2000
  },
  
  // Optional images (up to 4)
  imageUrls: [{
    type: String,
    maxlength: 500
  }],
  
  // Likes (usernames of users who liked)
  likes: [{
    type: String,
    ref: 'User'
  }],
  
  // Like count for efficient querying
  likeCount: {
    type: Number,
    default: 0
  },
  
  // Comments
  comments: [commentSchema],
  
  // Comment count for efficient querying
  commentCount: {
    type: Number,
    default: 0
  },
  
  // View count
  views: {
    type: Number,
    default: 0
  },
  
  // Tags/hashtags extracted from content
  tags: [{
    type: String,
    lowercase: true,
    trim: true
  }],
  
  // Post status
  status: {
    type: String,
    enum: ['active', 'hidden', 'deleted'],
    default: 'active'
  },
  
  // Is this a pinned post on the author's profile?
  isPinned: {
    type: Boolean,
    default: false
  },
  
  // Optional link to a listing
  linkedListing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing',
    default: null
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for efficient queries
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ status: 1, createdAt: -1 });
postSchema.index({ tags: 1 });
postSchema.index({ likeCount: -1, createdAt: -1 });

// Extract hashtags from content before saving
postSchema.pre('save', function(next) {
  if (this.isModified('content')) {
    // Extract hashtags from content
    const hashtagRegex = /#(\w+)/g;
    const matches = this.content.match(hashtagRegex);
    if (matches) {
      this.tags = matches.map(tag => tag.slice(1).toLowerCase()).slice(0, 10); // Max 10 tags
    }
  }
  this.updatedAt = new Date();
  next();
});

// Instance methods
postSchema.methods.addLike = async function(username) {
  if (!this.likes.includes(username)) {
    this.likes.push(username);
    this.likeCount = this.likes.length;
    await this.save();
    return true;
  }
  return false;
};

postSchema.methods.removeLike = async function(username) {
  const index = this.likes.indexOf(username);
  if (index > -1) {
    this.likes.splice(index, 1);
    this.likeCount = this.likes.length;
    await this.save();
    return true;
  }
  return false;
};

postSchema.methods.addComment = async function(author, content) {
  this.comments.push({ author, content });
  this.commentCount = this.comments.length;
  await this.save();
  return this.comments[this.comments.length - 1];
};

postSchema.methods.removeComment = async function(commentId, requestingUser) {
  const comment = this.comments.id(commentId);
  if (!comment) {
    throw new Error('Comment not found');
  }
  // Only comment author or post author can delete
  if (comment.author !== requestingUser && this.author !== requestingUser) {
    throw new Error('Not authorized to delete this comment');
  }
  comment.deleteOne();
  this.commentCount = this.comments.length;
  await this.save();
  return true;
};

postSchema.methods.incrementViews = async function() {
  this.views += 1;
  await this.save();
  return this.views;
};

// Static methods
postSchema.statics.getFeed = async function(options = {}) {
  const {
    limit = 20,
    skip = 0,
    followedUsers = null, // Array of usernames the user follows
    excludeAuthor = null,
    tag = null
  } = options;

  const query = { status: 'active' };
  
  // If followedUsers provided, only show posts from those users
  if (followedUsers && followedUsers.length > 0) {
    query.author = { $in: followedUsers };
  }
  
  // Exclude specific author (e.g., for "discover" feed)
  if (excludeAuthor) {
    query.author = { ...query.author, $ne: excludeAuthor };
  }
  
  // Filter by tag
  if (tag) {
    query.tags = tag.toLowerCase();
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
};

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

postSchema.statics.getPostsByAuthor = async function(author, limit = 20, skip = 0) {
  return this.find({
    author,
    status: 'active'
  })
  .sort({ isPinned: -1, createdAt: -1 })
  .skip(skip)
  .limit(limit)
  .lean();
};

postSchema.statics.getTrendingTags = async function(limit = 10) {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  return this.aggregate([
    { $match: { status: 'active', createdAt: { $gte: oneDayAgo } } },
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit },
    { $project: { tag: '$_id', count: 1, _id: 0 } }
  ]);
};

const Post = mongoose.model('Post', postSchema);

module.exports = Post;