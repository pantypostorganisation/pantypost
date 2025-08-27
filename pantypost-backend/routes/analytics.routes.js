// pantypost-backend/routes/analytics.routes.js
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Listing = require('../models/Listing');
const Review = require('../models/Review');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const Transaction = require('../models/Transaction');
const authMiddleware = require('../middleware/auth.middleware');

// ============= SELLER ANALYTICS ROUTES =============

// GET /api/analytics/seller/overview - Get comprehensive seller analytics
router.get('/seller/overview', authMiddleware, async (req, res) => {
  try {
    // Ensure user is a seller
    if (req.user.role !== 'seller') {
      return res.status(403).json({
        success: false,
        error: 'Only sellers can access analytics'
      });
    }

    const username = req.user.username;
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const thisWeekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    // Get all orders for this seller
    const allOrders = await Order.find({ seller: username });
    
    // Calculate order metrics
    const thisMonthOrders = allOrders.filter(o => new Date(o.date) >= thisMonthStart);
    const lastMonthOrders = allOrders.filter(
      o => new Date(o.date) >= lastMonthStart && new Date(o.date) <= lastMonthEnd
    );
    const thisWeekOrders = allOrders.filter(o => new Date(o.date) >= thisWeekStart);
    const lastWeekOrders = allOrders.filter(
      o => new Date(o.date) >= lastWeekStart && new Date(o.date) < thisWeekStart
    );

    // Calculate revenue (after platform fees)
    const calculateSellerEarnings = (order) => {
      if (order.wasAuction) {
        // Auctions: 80% to seller (20% platform fee)
        return order.price * 0.8;
      }
      // Regular: 90% to seller + tier bonuses
      return (order.price * 0.9) + (order.tierCreditAmount || 0);
    };

    const totalRevenue = allOrders.reduce((sum, o) => sum + calculateSellerEarnings(o), 0);
    const thisMonthRevenue = thisMonthOrders.reduce((sum, o) => sum + calculateSellerEarnings(o), 0);
    const lastMonthRevenue = lastMonthOrders.reduce((sum, o) => sum + calculateSellerEarnings(o), 0);
    const thisWeekRevenue = thisWeekOrders.reduce((sum, o) => sum + calculateSellerEarnings(o), 0);
    const lastWeekRevenue = lastWeekOrders.reduce((sum, o) => sum + calculateSellerEarnings(o), 0);

    // Calculate growth rates
    const monthlyGrowth = lastMonthRevenue > 0 
      ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
      : 0;
    const weeklyGrowth = lastWeekRevenue > 0 
      ? ((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100 
      : 0;

    // Order status breakdown
    const pendingOrders = allOrders.filter(o => o.shippingStatus === 'pending').length;
    const processingOrders = allOrders.filter(o => o.shippingStatus === 'processing').length;
    const shippedOrders = allOrders.filter(o => o.shippingStatus === 'shipped').length;
    const deliveredOrders = allOrders.filter(o => o.shippingStatus === 'delivered').length;

    // Get active listings
    const activeListings = await Listing.find({ 
      seller: username, 
      status: 'active' 
    });

    // Get listing metrics
    const totalListings = await Listing.countDocuments({ seller: username });
    const soldListings = await Listing.countDocuments({ 
      seller: username, 
      status: 'sold' 
    });
    const activeAuctions = await Listing.countDocuments({
      seller: username,
      'auction.isAuction': true,
      'auction.status': 'active'
    });

    // Calculate total views
    const allListings = await Listing.find({ seller: username });
    const totalViews = allListings.reduce((sum, l) => sum + (l.views || 0), 0);

    // Get subscriber count - FIXED: using creator field
    const subscriberCount = await Subscription.countDocuments({ 
      creator: username, 
      status: 'active' 
    });

    // Get seller's actual subscription price
    const sellerUser = await User.findOne({ username });
    const subscriptionPrice = sellerUser?.subscriptionPrice || 25;

    // Get subscription revenue - show full amount, note about 75% will be in frontend
    const subscriptionRevenue = subscriberCount * subscriptionPrice;

    // Get reviews stats
    const reviews = await Review.find({ 
      reviewee: username, 
      status: 'approved' 
    });
    
    const avgRating = reviews.length > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
      : 0;

    // Calculate conversion rate
    const conversionRate = totalViews > 0 
      ? (soldListings / totalViews) * 100 
      : 0;

    // Get top performing listings
    const topListings = await Listing.find({ 
      seller: username 
    })
      .sort({ views: -1 })
      .limit(5)
      .select('title price views status');

    // Get recent orders
    const recentOrders = await Order.find({ seller: username })
      .sort({ date: -1 })
      .limit(10)
      .select('title buyer price markedUpPrice date shippingStatus wasAuction tierCreditAmount');

    res.json({
      success: true,
      data: {
        revenue: {
          total: Math.round(totalRevenue * 100) / 100,
          thisMonth: Math.round(thisMonthRevenue * 100) / 100,
          lastMonth: Math.round(lastMonthRevenue * 100) / 100,
          thisWeek: Math.round(thisWeekRevenue * 100) / 100,
          lastWeek: Math.round(lastWeekRevenue * 100) / 100,
          monthlyGrowth: Math.round(monthlyGrowth * 100) / 100,
          weeklyGrowth: Math.round(weeklyGrowth * 100) / 100,
          averageOrderValue: allOrders.length > 0 
            ? Math.round((totalRevenue / allOrders.length) * 100) / 100 
            : 0,
          subscriptionRevenue: Math.round(subscriptionRevenue * 100) / 100,
          subscriptionRevenueEarnings: Math.round(subscriptionRevenue * 0.75 * 100) / 100 // What seller actually earns
        },
        orders: {
          total: allOrders.length,
          thisMonth: thisMonthOrders.length,
          pending: pendingOrders,
          processing: processingOrders,
          shipped: shippedOrders,
          delivered: deliveredOrders,
          recent: recentOrders
        },
        listings: {
          total: totalListings,
          active: activeListings.length,
          sold: soldListings,
          activeAuctions,
          totalViews,
          conversionRate: Math.round(conversionRate * 100) / 100,
          topPerforming: topListings
        },
        subscribers: {
          count: subscriberCount,
          monthlyRevenue: Math.round(subscriptionRevenue * 100) / 100,
          monthlyRevenueEarnings: Math.round(subscriptionRevenue * 0.75 * 100) / 100, // What seller actually earns
          subscriptionPrice: subscriptionPrice
        },
        ratings: {
          average: Math.round(avgRating * 10) / 10,
          totalReviews: reviews.length
        }
      }
    });
  } catch (error) {
    console.error('[Analytics] Error fetching seller overview:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/analytics/seller/revenue/:period - Get revenue data for specific period
router.get('/seller/revenue/:period', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'seller') {
      return res.status(403).json({
        success: false,
        error: 'Only sellers can access analytics'
      });
    }

    const { period } = req.params; // 'daily', 'weekly', 'monthly', 'yearly'
    const username = req.user.username;
    const now = new Date();
    let startDate, groupBy;

    switch (period) {
      case 'daily':
        startDate = new Date(now.setDate(now.getDate() - 30)); // Last 30 days
        groupBy = { $dateToString: { format: '%Y-%m-%d', date: '$date' } };
        break;
      case 'weekly':
        startDate = new Date(now.setDate(now.getDate() - 84)); // Last 12 weeks
        groupBy = { $week: '$date' };
        break;
      case 'monthly':
        startDate = new Date(now.setMonth(now.getMonth() - 12)); // Last 12 months
        groupBy = { $month: '$date' };
        break;
      case 'yearly':
        startDate = new Date(now.setFullYear(now.getFullYear() - 5)); // Last 5 years
        groupBy = { $year: '$date' };
        break;
      default:
        startDate = new Date(now.setDate(now.getDate() - 30));
        groupBy = { $dateToString: { format: '%Y-%m-%d', date: '$date' } };
    }

    const revenueData = await Order.aggregate([
      {
        $match: {
          seller: username,
          date: { $gte: startDate },
          paymentStatus: 'completed'
        }
      },
      {
        $group: {
          _id: groupBy,
          totalRevenue: { 
            $sum: {
              $cond: [
                { $eq: ['$wasAuction', true] },
                { $multiply: ['$price', 0.8] }, // 80% for auctions
                { $add: [
                  { $multiply: ['$price', 0.9] }, // 90% for regular
                  { $ifNull: ['$tierCreditAmount', 0] } // Plus tier bonus
                ]}
              ]
            }
          },
          orderCount: { $sum: 1 },
          avgOrderValue: { $avg: '$price' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        period,
        startDate,
        revenueData
      }
    });
  } catch (error) {
    console.error('[Analytics] Error fetching revenue data:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/analytics/seller/subscribers - Get detailed subscriber analytics
router.get('/seller/subscribers', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'seller') {
      return res.status(403).json({
        success: false,
        error: 'Only sellers can access analytics'
      });
    }

    const username = req.user.username;
    
    // Get seller's subscription price
    const sellerUser = await User.findOne({ username });
    const sellerSubscriptionPrice = sellerUser?.subscriptionPrice || 25;
    
    // Get all active subscriptions - FIXED: using creator field
    const subscriptions = await Subscription.find({
      creator: username,
      status: 'active'
    });

    // Get subscriber order history
    const subscriberUsernames = subscriptions.map(s => s.subscriber);
    const subscriberOrders = await Order.find({
      seller: username,
      buyer: { $in: subscriberUsernames }
    });

    // Calculate subscriber metrics
    const subscriberMetrics = subscriptions.map(sub => {
      const orders = subscriberOrders.filter(o => o.buyer === sub.subscriber);
      const totalSpent = orders.reduce((sum, o) => sum + o.markedUpPrice, 0);
      const lastOrder = orders.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
      
      return {
        username: sub.subscriber,
        subscribedAt: sub.startDate,
        totalOrders: orders.length,
        totalSpent: Math.round(totalSpent * 100) / 100,
        lastOrderDate: lastOrder ? lastOrder.date : null,
        subscriptionPrice: sub.price || sellerSubscriptionPrice
      };
    });

    // Calculate churn rate (subscribers who cancelled in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const cancelledRecently = await Subscription.countDocuments({
      creator: username,
      status: 'cancelled',
      cancelledAt: { $gte: thirtyDaysAgo }
    });

    const churnRate = subscriptions.length > 0 
      ? (cancelledRecently / (subscriptions.length + cancelledRecently)) * 100 
      : 0;

    // Calculate monthly recurring revenue - full amount
    const monthlyRecurringRevenue = subscriptions.reduce((sum, s) => {
      return sum + (s.price || sellerSubscriptionPrice);
    }, 0);

    // Calculate what seller actually earns (75%)
    const monthlyRecurringRevenueEarnings = monthlyRecurringRevenue * 0.75;

    res.json({
      success: true,
      data: {
        totalSubscribers: subscriptions.length,
        monthlyRecurringRevenue: Math.round(monthlyRecurringRevenue * 100) / 100,
        monthlyRecurringRevenueEarnings: Math.round(monthlyRecurringRevenueEarnings * 100) / 100,
        subscribers: subscriberMetrics,
        churnRate: Math.round(churnRate * 100) / 100,
        averageSubscriberValue: subscriberMetrics.length > 0
          ? Math.round((subscriberMetrics.reduce((sum, s) => sum + s.totalSpent, 0) / subscriberMetrics.length) * 100) / 100
          : 0,
        subscriptionPrice: sellerSubscriptionPrice
      }
    });
  } catch (error) {
    console.error('[Analytics] Error fetching subscriber analytics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/analytics/seller/products - Get product performance analytics
router.get('/seller/products', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'seller') {
      return res.status(403).json({
        success: false,
        error: 'Only sellers can access analytics'
      });
    }

    const username = req.user.username;
    
    // Get all listings with performance metrics
    const listings = await Listing.find({ seller: username });
    
    // Get order data for each listing
    const listingIds = listings.map(l => l._id.toString());
    const orders = await Order.find({
      seller: username,
      listingId: { $in: listingIds }
    });

    // Calculate performance metrics for each listing
    const productMetrics = listings.map(listing => {
      const listingOrders = orders.filter(o => o.listingId === listing._id.toString());
      const revenue = listingOrders.reduce((sum, o) => {
        if (o.wasAuction) {
          return sum + (o.price * 0.8);
        }
        return sum + (o.price * 0.9) + (o.tierCreditAmount || 0);
      }, 0);

      return {
        id: listing._id,
        title: listing.title,
        status: listing.status,
        type: listing.auction?.isAuction ? 'auction' : 'regular',
        price: listing.price || listing.auction?.currentBid || 0,
        views: listing.views || 0,
        orderCount: listingOrders.length,
        revenue: Math.round(revenue * 100) / 100,
        conversionRate: listing.views > 0 
          ? Math.round((listingOrders.length / listing.views) * 10000) / 100 
          : 0,
        createdAt: listing.createdAt,
        lastSold: listingOrders.length > 0 
          ? listingOrders.sort((a, b) => new Date(b.date) - new Date(a.date))[0].date 
          : null
      };
    });

    // Sort by revenue
    productMetrics.sort((a, b) => b.revenue - a.revenue);

    // Calculate aggregate stats
    const totalProducts = productMetrics.length;
    const activeProducts = productMetrics.filter(p => p.status === 'active').length;
    const totalRevenue = productMetrics.reduce((sum, p) => sum + p.revenue, 0);
    const totalViews = productMetrics.reduce((sum, p) => sum + p.views, 0);
    const totalOrders = productMetrics.reduce((sum, p) => sum + p.orderCount, 0);

    res.json({
      success: true,
      data: {
        summary: {
          totalProducts,
          activeProducts,
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          totalViews,
          totalOrders,
          averageConversionRate: totalViews > 0 
            ? Math.round((totalOrders / totalViews) * 10000) / 100 
            : 0
        },
        products: productMetrics
      }
    });
  } catch (error) {
    console.error('[Analytics] Error fetching product analytics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/analytics/seller/comparison - Compare current performance with previous period
router.get('/seller/comparison', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'seller') {
      return res.status(403).json({
        success: false,
        error: 'Only sellers can access analytics'
      });
    }

    const username = req.user.username;
    const { period = '30' } = req.query; // Days to compare
    const periodDays = parseInt(period);
    
    const now = new Date();
    const currentPeriodStart = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
    const previousPeriodStart = new Date(currentPeriodStart.getTime() - periodDays * 24 * 60 * 60 * 1000);

    // Get orders for both periods
    const currentOrders = await Order.find({
      seller: username,
      date: { $gte: currentPeriodStart }
    });

    const previousOrders = await Order.find({
      seller: username,
      date: { $gte: previousPeriodStart, $lt: currentPeriodStart }
    });

    // Calculate metrics for both periods
    const calculateMetrics = (orders) => {
      const revenue = orders.reduce((sum, o) => {
        if (o.wasAuction) {
          return sum + (o.price * 0.8);
        }
        return sum + (o.price * 0.9) + (o.tierCreditAmount || 0);
      }, 0);

      return {
        orders: orders.length,
        revenue: Math.round(revenue * 100) / 100,
        avgOrderValue: orders.length > 0 
          ? Math.round((revenue / orders.length) * 100) / 100 
          : 0
      };
    };

    const currentMetrics = calculateMetrics(currentOrders);
    const previousMetrics = calculateMetrics(previousOrders);

    // Calculate percentage changes
    const calculateChange = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 10000) / 100;
    };

    res.json({
      success: true,
      data: {
        period: periodDays,
        current: currentMetrics,
        previous: previousMetrics,
        changes: {
          orders: calculateChange(currentMetrics.orders, previousMetrics.orders),
          revenue: calculateChange(currentMetrics.revenue, previousMetrics.revenue),
          avgOrderValue: calculateChange(currentMetrics.avgOrderValue, previousMetrics.avgOrderValue)
        }
      }
    });
  } catch (error) {
    console.error('[Analytics] Error fetching comparison data:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;