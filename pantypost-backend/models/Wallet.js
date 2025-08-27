// pantypost-backend/models/Wallet.js
const mongoose = require('mongoose');

// Create wallet schema (like a blueprint for wallets)
const walletSchema = new mongoose.Schema({
  // Link wallet to a user by their username
  username: {
    type: String,
    required: true,
    unique: true,  // Each user can only have one wallet
    ref: 'User'    // References the User model
  },
  
  // The amount of money in the wallet
  balance: {
    type: Number,
    default: 0,    // Start with $0
    min: 0,        // Can't go negative
    max: 1000000   // Maximum $1 million
  },
  
  // User's role (buyer, seller, or admin)
  role: {
    type: String,
    enum: ['buyer', 'seller', 'admin'],
    required: true
  },
  
  // Track when the last transaction happened
  lastTransaction: {
    type: Date,
    default: Date.now
  },
  
  // Track creation and update times automatically
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Add some helpful methods to the wallet

// Method to check if user has enough balance (FIXED for floating-point)
walletSchema.methods.hasBalance = function(amount) {
  // Convert to cents to avoid floating-point precision issues
  const balanceInCents = Math.round(this.balance * 100);
  const amountInCents = Math.round(amount * 100);
  return balanceInCents >= amountInCents;
};

// Method to add money (deposit)
walletSchema.methods.deposit = async function(amount) {
  // Round to 2 decimal places to avoid floating-point accumulation
  this.balance = Math.round((this.balance + amount) * 100) / 100;
  this.lastTransaction = new Date();
  return await this.save();
};

// Method to remove money (withdraw or purchase) (FIXED for floating-point)
walletSchema.methods.withdraw = async function(amount) {
  // Check balance using cents comparison
  const balanceInCents = Math.round(this.balance * 100);
  const amountInCents = Math.round(amount * 100);
  
  if (balanceInCents < amountInCents) {
    throw new Error('Insufficient balance');
  }
  
  // Subtract using cents and convert back to dollars
  const newBalanceInCents = balanceInCents - amountInCents;
  this.balance = newBalanceInCents / 100;
  this.lastTransaction = new Date();
  return await this.save();
};

// Create the model
const Wallet = mongoose.model('Wallet', walletSchema);

module.exports = Wallet;