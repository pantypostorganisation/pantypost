// listing.routes.js
// This file contains all listing-related routes

const express = require('express');
const router = express.Router();
const Listing = require('../models/Listing');
const authMiddleware = require('../middleware/auth.middleware');
const { ERROR_CODES, LISTING_STATUS } = require('../utils/constants');

// ============= LISTING ROUTES =============

// GET /api/listings - Get all listings
router.get('/', async (req, res) => {
  try {
    const listings = await Listing.find({});
    res.json({
      success: true,
      count: listings.length,
      listings: listings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/listings - Create a listing (protected route)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, description, price, tags } = req.body;
    
    // Only sellers can create listings
    if (req.user.role !== 'seller') {
      return res.status(403).json({
        success: false,
        error: 'Only sellers can create listings'
      });
    }
    
    const newListing = new Listing({
      title,
      description,
      price,
      seller: req.user.username,
      tags,
      status: 'active'
    });
    
    await newListing.save();
    
    res.json({
      success: true,
      message: 'Listing created!',
      listing: newListing
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/listings/seller/:username - Get listings by seller
router.get('/seller/:username', async (req, res) => {
  try {
    const listings = await Listing.find({ seller: req.params.username });
    res.json({
      success: true,
      count: listings.length,
      listings: listings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Export the router
module.exports = router;