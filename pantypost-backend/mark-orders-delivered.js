// pantypost-backend/mark-orders-delivered.js
// This script marks shipped orders as delivered for testing reviews

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Order = require('./models/Order');
const connectDB = require('./config/database');

async function markOrdersDelivered() {
  try {
    // Connect to database
    await connectDB();
    console.log('📊 Starting order delivery update...\n');

    // Find all shipped orders
    const orders = await Order.find({ 
      shippingStatus: 'shipped'
    });

    console.log(`Found ${orders.length} shipped orders\n`);

    // Update each order to delivered
    for (const order of orders) {
      order.shippingStatus = 'delivered';
      order.deliveredDate = new Date(); // Mark as delivered now
      
      await order.save();
      
      console.log(`✅ Marked as delivered: ${order.title}`);
      console.log(`   Buyer: ${order.buyer}`);
      console.log(`   Seller: ${order.seller}`);
      console.log(`   Status: ${order.shippingStatus}\n`);
    }

    console.log('🎉 Delivery status update completed!');
    console.log('You can now review these orders in the review test page.\n');
    
    // Close database connection
    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    mongoose.connection.close();
  }
}

// Run the update
markOrdersDelivered();