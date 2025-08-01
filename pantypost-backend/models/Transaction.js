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
      'fee',           // Platform fee (10%)
      'tier_credit'    // Tier bonus credit
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
    enum: ['buyer', 'seller', 'admin']
  },
  
  toRole: {
    type: String,
    enum: ['buyer', 'seller', 'admin']
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
  
  // Extra information about the transaction
  metadata: {
    orderId: String,         // If this is for an order
    listingId: String,       // If this is for a listing
    subscriptionId: String,  // If this is for a subscription
    platformFee: Number,     // Amount taken as platform fee
    paymentMethod: String,   // How they paid
    accountDetails: Object   // For withdrawals
  }
});

// Create indexes for faster queries
transactionSchema.index({ from: 1, createdAt: -1 });
transactionSchema.index({ to: 1, createdAt: -1 });
transactionSchema.index({ type: 1, status: 1 });

// Create the model
const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;