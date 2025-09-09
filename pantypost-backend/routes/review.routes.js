// pantypost-backend/routes/review.routes.js
const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Order = require('../models/Order');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth.middleware');
const mongoose = require('mongoose');

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
    
    // Calculate average rating with proper decimal handling
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
    
    // Process stats to ensure proper decimal handling
    let processedStats = {
      avgRating: 0,
      totalReviews: 0,
      fiveStars: 0,
      fourStars: 0,
      threeStars: 0,
      twoStars: 0,
      oneStars: 0
    };
    
    if (stats && stats.length > 0) {
      processedStats = stats[0];
      // Ensure avgRating maintains decimal precision
      if (processedStats.avgRating !== null && processedStats.avgRating !== undefined) {
        // Round to 1 decimal place for display
        processedStats.avgRating = Math.round(processedStats.avgRating * 10) / 10;
      }
    }
    
    console.log('[Review Route] Seller stats:', {
      username,
      avgRating: processedStats.avgRating,
      totalReviews: processedStats.totalReviews
    });
    
    res.json({
      success: true,
      data: {
        reviews,
        stats: processedStats,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalReviews,
          pages: Math.ceil(totalReviews / limit)
        }
      }
    });
  } catch (error) {
    console.error('[Review Route] Error getting seller reviews:', error);
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
    
    // Check if review exists for this order (orderId can be string or ObjectId)
    const review = await Review.findOne({ orderId: orderId });
    
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
    
    console.log('[Review Route] Creating review:', {
      orderId,
      rating,
      reviewer: req.user.username,
      commentLength: comment?.length
    });
    
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
    
    // Determine the seller from the orderId
    let sellerUsername;
    
    // Check if orderId is a valid MongoDB ObjectId
    if (mongoose.Types.ObjectId.isValid(orderId) && orderId.length === 24) {
      // It's a valid ObjectId, try to find the order
      const order = await Order.findById(orderId);
      if (order) {
        // Check if user is the buyer of this order
        if (order.buyer !== req.user.username) {
          return res.status(403).json({
            success: false,
            error: 'You can only review your own orders'
          });
        }
        
        sellerUsername = order.seller;
      } else {
        // Order not found, but we can still proceed if it's a generated ID
        // Parse the seller from the string format
        if (orderId.includes('_')) {
          const parts = orderId.split('_');
          if (parts.length >= 3 && parts[0] === 'order') {
            sellerUsername = parts[2];
          }
        }
        
        if (!sellerUsername) {
          return res.status(404).json({
            success: false,
            error: 'Order not found'
          });
        }
      }
    } else {
      // It's not a valid ObjectId, parse from string format
      // Format: order_buyer_seller_timestamp
      const parts = orderId.split('_');
      if (parts.length >= 3 && parts[0] === 'order') {
        const buyer = parts[1];
        sellerUsername = parts[2];
        
        // Verify the buyer matches
        if (buyer !== req.user.username) {
          return res.status(403).json({
            success: false,
            error: 'Invalid order ID for this user'
          });
        }
      } else {
        return res.status(400).json({
          success: false,
          error: 'Invalid order ID format'
        });
      }
    }
    
    // Check if seller exists
    const seller = await User.findOne({ username: sellerUsername, role: 'seller' });
    if (!seller) {
      return res.status(404).json({
        success: false,
        error: 'Seller not found'
      });
    }
    
    // Check if review already exists for this buyer-seller combination
    const existingReview = await Review.findOne({ 
      reviewer: req.user.username,
      reviewee: sellerUsername
    });
    
    if (existingReview) {
      return res.status(400).json({
        success: false,
        error: 'You have already reviewed this seller'
      });
    }
    
    // Create the review
    const review = new Review({
      orderId: orderId, // Store as-is (Mixed type accepts both string and ObjectId)
      reviewer: req.user.username,
      reviewee: sellerUsername,
      rating,
      comment,
      asDescribed: asDescribed !== false,
      fastShipping: fastShipping !== false,
      wouldBuyAgain: wouldBuyAgain !== false
    });
    
    await review.save();
    
    console.log('[Review Route] Review created successfully:', review._id);
    
    // Update seller's rating in User model with proper decimal handling
    const allSellerReviews = await Review.find({ 
      reviewee: sellerUsername,
      status: 'approved'
    });
    
    const totalRating = allSellerReviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = totalRating / allSellerReviews.length;
    
    // Store with 1 decimal precision
    const roundedRating = Math.round(avgRating * 10) / 10;
    
    await User.findOneAndUpdate(
      { username: sellerUsername },
      { 
        rating: roundedRating,
        reviewCount: allSellerReviews.length
      }
    );
    
    console.log('[Review Route] Updated seller rating:', {
      seller: sellerUsername,
      rating: roundedRating,
      reviewCount: allSellerReviews.length
    });
    
    res.json({
      success: true,
      data: review
    });
  } catch (error) {
    console.error('[Review Route] Error creating review:', error);
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