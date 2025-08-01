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

// Method to check if user has enough balance
walletSchema.methods.hasBalance = function(amount) {
  return this.balance >= amount;
};

// Method to add money (deposit)
walletSchema.methods.deposit = async function(amount) {
  this.balance += amount;
  this.lastTransaction = new Date();
  return await this.save();
};

// Method to remove money (withdraw or purchase)
walletSchema.methods.withdraw = async function(amount) {
  if (!this.hasBalance(amount)) {
    throw new Error('Insufficient balance');
  }
  this.balance -= amount;
  this.lastTransaction = new Date();
  return await this.save();
};

// Create the model
const Wallet = mongoose.model('Wallet', walletSchema);

module.exports = Wallet;