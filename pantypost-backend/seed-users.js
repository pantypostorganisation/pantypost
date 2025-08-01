// pantypost-backend/seed-users.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Import models
const User = require('./models/User');

// Import database connection
const connectDB = require('./config/database');

const seedUsers = async () => {
  try {
    // Connect to database
    await connectDB();
    
    console.log('🌱 Starting user seeding...');
    
    // Test users data - EMPTY ARRAY (no pre-seeded users)
    const testUsers = [
      // Add your own test users here if needed
      // Example format:
      // {
      //   username: 'testuser1',
      //   email: 'test1@example.com',
      //   password: 'password123',
      //   role: 'buyer'
      // },
    ];
    
    if (testUsers.length === 0) {
      console.log('📝 No users to seed. Add users to the testUsers array if needed.');
      console.log('\nExample format:');
      console.log(`{
        username: 'testuser1',
        email: 'test1@example.com',
        password: 'password123',
        role: 'buyer' // or 'seller'
      }`);
    } else {
      // Create users
      for (const userData of testUsers) {
        try {
          // Check if user already exists
          const existingUser = await User.findOne({ 
            $or: [
              { username: userData.username }, 
              { email: userData.email }
            ] 
          });
          
          if (existingUser) {
            console.log(`⏭️  User ${userData.username} already exists, skipping...`);
            continue;
          }
          
          // Create new user (password will be hashed automatically by the model)
          const newUser = new User(userData);
          await newUser.save();
          
          console.log(`✅ Created user: ${userData.username} (${userData.role})`);
        } catch (error) {
          console.log(`❌ Error creating user ${userData.username}: ${error.message}`);
        }
      }
    }
    
    console.log('\n🎉 User seeding completed!');
    
  } catch (error) {
    console.error('❌ Seeding error:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('👋 Database connection closed');
  }
};

// Run the seeding
seedUsers();