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
    
    // Test users data
    const testUsers = [
      {
        username: 'alice123',
        email: 'alice@example.com',
        password: 'password123',
        role: 'buyer'
      },
      {
        username: 'test',
        email: 'test@example.com',
        password: 'password123',
        role: 'buyer'
      },
      {
        username: 'emma_seller',
        email: 'emma@example.com',
        password: 'password123',
        role: 'seller'
      },
      {
        username: 'buyer789',
        email: 'buyer789@example.com',
        password: 'password123',
        role: 'buyer'
      },
      {
        username: 'sarah_s',
        email: 'sarah@example.com',
        password: 'password123',
        role: 'seller'
      },
      {
        username: 'john_buyer',
        email: 'john@example.com',
        password: 'password123',
        role: 'buyer'
      }
    ];
    
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
    
    console.log('\n🎉 User seeding completed!');
    console.log('\n📝 Test credentials:');
    console.log('Username: any of the above usernames');
    console.log('Password: password123\n');
    
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