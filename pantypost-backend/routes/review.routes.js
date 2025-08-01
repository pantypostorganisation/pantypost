// pantypost-backend/routes/review.routes.js
const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Order = require('../models/Order');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth.middleware');

// ============= REVIEW ROUTES =============

// GET /api/reviews/seller/:username - Get all reviews for a seller
router.get('/seller/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    // Check if seller exists
    const seller = await User.findOne({ username, role: 'seller' });
    if (!seller) {
      return res.status(404).json({
        success: false,
        error: 'Seller not found'
      });
    }
    
    // Get reviews with pagination
    const skip = (page - 1) * limit;
    const reviews = await Review.find({ 
      reviewee: username,
      status: 'approved' 
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));
    
    // Get total count for pagination
    const totalReviews = await Review.countDocuments({ 
      reviewee: username,
      status: 'approved' 
    });
    
    // Calculate average rating
    const stats = await Review.aggregate([
      { $match: { reviewee: username, status: 'approved' } },
      { 
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          fiveStars: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
          fourStars: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
          threeStars: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
          twoStars: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
          oneStars: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        reviews,
        stats: stats[0] || {
          avgRating: 0,
          totalReviews: 0,
          fiveStars: 0,
          fourStars: 0,
          threeStars: 0,
          twoStars: 0,
          oneStars: 0
        },
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalReviews,
          pages: Math.ceil(totalReviews / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/reviews/order/:orderId - Check if order has been reviewed
router.get('/order/:orderId', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // Check if review exists for this order
    const review = await Review.findOne({ orderId });
    
    res.json({
      success: true,
      data: {
        hasReview: !!review,
        review: review
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/reviews - Create a new review
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { orderId, rating, comment, asDescribed, fastShipping, wouldBuyAgain } = req.body;
    
    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: 'Rating must be between 1 and 5'
      });
    }
    
    // Validate comment
    if (!comment || comment.length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Review comment must be at least 10 characters'
      });
    }
    
    // Check if order exists
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    // Check if user is the buyer of this order
    if (order.buyer !== req.user.username) {
      return res.status(403).json({
        success: false,
        error: 'You can only review your own orders'
      });
    }
    
    // Check if order has been delivered
    if (order.shippingStatus !== 'delivered') {
      return res.status(400).json({
        success: false,
        error: 'You can only review delivered orders'
      });
    }
    
    // Check if review already exists
    const existingReview = await Review.findOne({ orderId });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        error: 'This order has already been reviewed'
      });
    }
    
    // Create the review
    const review = new Review({
      orderId,
      reviewer: req.user.username,
      reviewee: order.seller,
      rating,
      comment,
      asDescribed: asDescribed !== false,
      fastShipping: fastShipping !== false,
      wouldBuyAgain: wouldBuyAgain !== false
    });
    
    await review.save();
    
    // Update seller's rating in User model
    const allSellerReviews = await Review.find({ 
      reviewee: order.seller,
      status: 'approved'
    });
    
    const totalRating = allSellerReviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = totalRating / allSellerReviews.length;
    
    await User.findOneAndUpdate(
      { username: order.seller },
      { 
        rating: Math.round(avgRating * 10) / 10, // Round to 1 decimal
        reviewCount: allSellerReviews.length
      }
    );
    
    res.json({
      success: true,
      data: review
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/reviews/:reviewId/response - Seller response to review
router.post('/:reviewId/response', authMiddleware, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { response } = req.body;
    
    // Validate response
    if (!response || response.length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Response must be at least 10 characters'
      });
    }
    
    // Find the review
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Review not found'
      });
    }
    
    // Check if user is the seller being reviewed
    if (review.reviewee !== req.user.username) {
      return res.status(403).json({
        success: false,
        error: 'You can only respond to reviews about you'
      });
    }
    
    // Check if already responded
    if (review.sellerResponse && review.sellerResponse.text) {
      return res.status(400).json({
        success: false,
        error: 'You have already responded to this review'
      });
    }
    
    // Add the response
    review.sellerResponse = {
      text: response,
      date: new Date()
    };
    
    await review.save();
    
    res.json({
      success: true,
      data: review
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/reviews/:reviewId/flag - Flag a review for moderation
router.post('/:reviewId/flag', authMiddleware, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { reason } = req.body;
    
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Review not found'
      });
    }
    
    review.isFlagged = true;
    // In a real app, you'd also track who flagged it and why
    await review.save();
    
    res.json({
      success: true,
      message: 'Review flagged for moderation'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;