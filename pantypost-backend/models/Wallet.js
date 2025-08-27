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
  
  // The amount of money in the wallet (stored in dollars)
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

// Method to check if user has enough balance (FIXED for floating-point precision)
walletSchema.methods.hasBalance = function(amount) {
  // Convert to cents to avoid floating-point precision issues
  const balanceInCents = Math.round(this.balance * 100);
  const amountInCents = Math.round(amount * 100);
  return balanceInCents >= amountInCents;
};

// Method to add money (deposit) with floating-point safety
walletSchema.methods.deposit = async function(amount) {
  // Round to 2 decimal places to avoid floating-point accumulation
  this.balance = Math.round((this.balance + amount) * 100) / 100;
  this.lastTransaction = new Date();
  this.updatedAt = new Date();
  return await this.save();
};

// Method to remove money (withdraw or purchase) with floating-point safety
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
  this.updatedAt = new Date();
  return await this.save();
};

// Method to transfer money between wallets (with floating-point safety)
walletSchema.methods.transferTo = async function(recipientWallet, amount) {
  // Use cents for all calculations
  const senderBalanceInCents = Math.round(this.balance * 100);
  const recipientBalanceInCents = Math.round(recipientWallet.balance * 100);
  const amountInCents = Math.round(amount * 100);
  
  if (senderBalanceInCents < amountInCents) {
    throw new Error('Insufficient balance for transfer');
  }
  
  // Update balances using cents, then convert back to dollars
  this.balance = (senderBalanceInCents - amountInCents) / 100;
  recipientWallet.balance = (recipientBalanceInCents + amountInCents) / 100;
  
  // Update timestamps
  const now = new Date();
  this.lastTransaction = now;
  this.updatedAt = now;
  recipientWallet.lastTransaction = now;
  recipientWallet.updatedAt = now;
  
  // Save both wallets
  await this.save();
  await recipientWallet.save();
  
  return { sender: this, recipient: recipientWallet };
};

// Pre-save middleware to ensure balance is always rounded to 2 decimal places
walletSchema.pre('save', function(next) {
  if (this.isModified('balance')) {
    // Ensure balance is always stored with max 2 decimal places
    this.balance = Math.round(this.balance * 100) / 100;
  }
  this.updatedAt = new Date();
  next();
});

// Create the model
const Wallet = mongoose.model('Wallet', walletSchema);

module.exports = Wallet;