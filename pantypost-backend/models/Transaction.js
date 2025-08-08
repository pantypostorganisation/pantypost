// pantypost-backend/models/Transaction.js
const mongoose = require('mongoose');

// Create transaction schema
const transactionSchema = new mongoose.Schema({
  // What type of transaction
  type: {
    type: String,
    enum: [
      'deposit',       // Buyer adds money
      'withdrawal',    // Seller takes money out
      'purchase',      // Buyer buys something
      'sale',          // Seller receives payment
      'tip',           // Buyer tips seller
      'subscription',  // Subscription payment
      'admin_credit',  // Admin adds money
      'admin_debit',   // Admin removes money
      'refund',        // Money returned
      'fee',           // Platform fee (10% from buyer or seller)
      'platform_fee',  // 🔧 NEW: Combined platform fees credited to admin
      'tier_credit',   // Tier bonus credit
      'bid_hold',      // When a bid is placed, money is held
      'bid_refund',    // When outbid or auction cancelled
      'auction_sale'   // When auction completes successfully
    ],
    required: true
  },
  
  // Amount of money
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Who sent the money (optional - not all transactions have a sender)
  from: {
    type: String,
    ref: 'User'
  },
  
  // Who received the money (optional - not all transactions have a receiver)
  to: {
    type: String,
    ref: 'User'
  },
  
  // Roles of sender and receiver
  fromRole: {
    type: String,
    enum: ['buyer', 'seller', 'admin', 'system'] // 🔧 ADDED 'system' for platform fee transactions
  },
  
  toRole: {
    type: String,
    enum: ['buyer', 'seller', 'admin', 'system'] // 🔧 ADDED 'system' for platform fee transactions
  },
  
  // Description of what this transaction is for
  description: {
    type: String,
    required: true
  },
  
  // Transaction status
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  completedAt: {
    type: Date
  },
  
  failedAt: {
    type: Date
  },
  
  // If it failed, why?
  errorMessage: {
    type: String
  },
  
  // 🔧 ENHANCED METADATA FOR PLATFORM FEE TRACKING
  metadata: {
    orderId: String,         // If this is for an order
    listingId: String,       // If this is for a listing
    listingTitle: String,    // 🔧 NEW: For better admin dashboard display
    subscriptionId: String,  // If this is for a subscription
    platformFee: Number,     // Amount taken as platform fee
    paymentMethod: String,   // How they paid
    accountDetails: Object,  // For withdrawals
    auctionId: String,       // If this is for an auction
    bidAmount: Number,       // For bid holds
    reason: String,          // For refunds (outbid, cancelled, reserve not met)
    newHighestBidder: String, // Who outbid them (for bid refunds)
    
    // 🔧 NEW: Enhanced platform fee metadata
    originalPrice: Number,   // Original listing price
    buyerPayment: Number,    // Total amount buyer paid
    sellerEarnings: Number,  // Amount seller received
    buyerFee: Number,        // 10% markup fee from buyer
    sellerFee: Number,       // 10% platform fee from seller
    totalFee: Number,        // Combined platform fees
    feeType: String,         // 'buyer_markup', 'seller_platform', or 'combined'
    percentage: Number,      // Fee percentage (usually 10)
    wasAuction: Boolean,     // Whether this was an auction purchase
    finalBid: Number,        // Final bid amount if auction
    seller: String,          // Seller username
    buyer: String            // Buyer username
  }
});

// Create indexes for faster queries
transactionSchema.index({ from: 1, createdAt: -1 });
transactionSchema.index({ to: 1, createdAt: -1 });
transactionSchema.index({ type: 1, status: 1 });
transactionSchema.index({ 'metadata.auctionId': 1 }); // For finding auction-related transactions
transactionSchema.index({ 'metadata.orderId': 1 });   // 🔧 NEW: For finding order-related transactions
transactionSchema.index({ type: 1, to: 1 });          // 🔧 NEW: For finding admin platform fee transactions

// Create the model
const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;