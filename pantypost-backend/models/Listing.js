const mongoose = require('mongoose');

// Create listing schema
const listingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  seller: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    default: 'https://via.placeholder.com/300'
  },
  tags: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['active', 'sold', 'expired'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create the model
const Listing = mongoose.model('Listing', listingSchema);

module.exports = Listing;