// pantypost-backend/models/Subscription.js
const mongoose = require('mongoose');

// Create subscription schema
const subscriptionSchema = new mongoose.Schema({
  // The buyer who is subscribing
  subscriber: {
    type: String,
    required: true,
    ref: 'User'
  },
  
  // The seller they're subscribing to
  creator: {
    type: String,
    required: true,
    ref: 'User'
  },
  
  // Monthly price
  price: {
    type: Number,
    required: true,
    min: 0.01,
    max: 999.99
  },
  
  // When the subscription started
  startDate: {
    type: Date,
    default: Date.now
  },
  
  // When the subscription ends (null if active)
  endDate: {
    type: Date,
    default: null
  },
  
  // Current status
  status: {
    type: String,
    enum: ['active', 'cancelled', 'expired', 'paused'],
    default: 'active'
  },
  
  // Should it renew automatically?
  autoRenew: {
    type: Boolean,
    default: true
  },
  
  // Next billing date
  nextBillingDate: {
    type: Date,
    default: function() {
      // Set to 1 month from start date
      const date = new Date();
      date.setMonth(date.getMonth() + 1);
      return date;
    }
  },
  
  // Last successful payment date
  lastPaymentDate: {
    type: Date,
    default: Date.now
  },
  
  // Track failed payment attempts
  failedPaymentAttempts: {
    type: Number,
    default: 0
  },
  
  // Cancellation info
  cancelledAt: Date,
  cancelReason: String,
  
  // 🔧 FIXED: Platform fee (25%)
  platformFee: {
    type: Number,
    default: function() {
      return Math.round(this.price * 0.25 * 100) / 100;
    }
  },
  
  // 🔧 FIXED: Creator earnings (75%)
  creatorEarnings: {
    type: Number,
    default: function() {
      return Math.round(this.price * 0.75 * 100) / 100;
    }
  }
});

// Create compound index to ensure one subscription per buyer-seller pair
subscriptionSchema.index({ subscriber: 1, creator: 1 }, { unique: true });
subscriptionSchema.index({ status: 1, nextBillingDate: 1 }); // For finding subscriptions to bill
subscriptionSchema.index({ creator: 1, status: 1 }); // For counting active subscribers

// Check if subscription is due for renewal
subscriptionSchema.methods.isDue = function() {
  return this.status === 'active' && 
         this.autoRenew && 
         this.nextBillingDate <= new Date();
};

// Process renewal (updates dates, doesn't handle payment)
subscriptionSchema.methods.processRenewal = function() {
  this.lastPaymentDate = new Date();
  
  // Set next billing date to 1 month from now
  const nextDate = new Date();
  nextDate.setMonth(nextDate.getMonth() + 1);
  this.nextBillingDate = nextDate;
  
  // Reset failed payment attempts
  this.failedPaymentAttempts = 0;
  
  return this.save();
};

// Handle failed payment
subscriptionSchema.methods.handleFailedPayment = function() {
  this.failedPaymentAttempts += 1;
  
  // Cancel after 3 failed attempts
  if (this.failedPaymentAttempts >= 3) {
    this.status = 'cancelled';
    this.cancelledAt = new Date();
    this.cancelReason = 'Failed payment attempts';
    this.autoRenew = false;
  }
  
  return this.save();
};

// Cancel subscription
subscriptionSchema.methods.cancel = function(reason = 'User requested') {
  this.status = 'cancelled';
  this.cancelledAt = new Date();
  this.cancelReason = reason;
  this.autoRenew = false;
  
  return this.save();
};

// Get active subscriber count for a creator
subscriptionSchema.statics.getActiveSubscriberCount = async function(creator) {
  return await this.countDocuments({
    creator: creator,
    status: 'active'
  });
};

// Get monthly revenue for a creator
subscriptionSchema.statics.getMonthlyRevenue = async function(creator) {
  const activeSubscriptions = await this.find({
    creator: creator,
    status: 'active'
  });
  
  const totalRevenue = activeSubscriptions.reduce((sum, sub) => {
    return sum + sub.creatorEarnings;
  }, 0);
  
  return Math.round(totalRevenue * 100) / 100;
};

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription;