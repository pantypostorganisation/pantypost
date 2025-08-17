// pantypost-backend/models/Review.js
const mongoose = require('mongoose');

// Create review schema
const reviewSchema = new mongoose.Schema({
  // The order this review is for - now accepts both ObjectId and String
  orderId: {
    type: mongoose.Schema.Types.Mixed, // Changed from ObjectId to Mixed to accept both
    required: true
  },
  
  // Who wrote the review (buyer)
  reviewer: {
    type: String,
    required: true,
    ref: 'User'
  },
  
  // Who the review is about (seller)
  reviewee: {
    type: String,
    required: true,
    ref: 'User'
  },
  
  // Star rating (1-5)
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  
  // Review text
  comment: {
    type: String,
    required: true,
    minlength: 10,
    maxlength: 500
  },
  
  // Was the order as described?
  asDescribed: {
    type: Boolean,
    default: true
  },
  
  // Was shipping fast?
  fastShipping: {
    type: Boolean,
    default: true
  },
  
  // Would buy again?
  wouldBuyAgain: {
    type: Boolean,
    default: true
  },
  
  // Date of review
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  // Has seller responded?
  sellerResponse: {
    text: String,
    date: Date
  },
  
  // Is review flagged/reported?
  isFlagged: {
    type: Boolean,
    default: false
  },
  
  // Admin approval status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved' // Auto-approve for now
  }
});

// Indexes for better performance
reviewSchema.index({ reviewer: 1, createdAt: -1 });
reviewSchema.index({ reviewee: 1, rating: -1 });
// Remove the unique constraint on orderId since we're using generated strings
// reviewSchema.index({ orderId: 1 }, { unique: true }); 
// Add unique constraint on reviewer + reviewee instead (one review per buyer-seller pair)
reviewSchema.index({ reviewer: 1, reviewee: 1 }, { unique: true });

// Virtual for calculating helpfulness (for future use)
reviewSchema.virtual('helpfulness').get(function() {
  // This could track how many people found the review helpful
  return 0; // Placeholder for future feature
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;