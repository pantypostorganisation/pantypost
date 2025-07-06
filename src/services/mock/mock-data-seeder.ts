// src/services/mock/mock-data-seeder.ts

import { mockDataStore } from './mock.config';
import { User } from '@/context/AuthContext';
import { Listing } from '@/context/ListingContext';
import { Order } from '@/context/WalletContext';
import { Message } from '@/services/messages.service';
import { v4 as uuidv4 } from 'uuid';

// Extended types for mock data
interface MockOrder extends Order {
  trackingNumber?: string;
  shippedDate?: string;
}

interface MockSubscriptionInfo {
  id: string;
  buyer: string;
  seller: string;
  price: string;
  status: 'active' | 'cancelled';
  subscribedAt: string;
  nextBillingDate: string;
  cancelledAt?: string;
}

/**
 * Seed initial mock data for testing
 */
export async function seedMockData(): Promise<void> {
  console.log('🌱 Seeding mock data...');
  
  // Check if data already exists
  const users = await mockDataStore.get<Record<string, User>>('users', {});
  if (Object.keys(users).length > 0) {
    console.log('✅ Mock data already seeded');
    return;
  }
  
  // Seed users
  await seedUsers();
  
  // Seed listings
  await seedListings();
  
  // Seed orders
  await seedOrders();
  
  // Seed messages
  await seedMessages();
  
  // Seed wallet balances - FIXED
  await seedWalletBalances();
  
  // Seed subscriptions
  await seedSubscriptions();
  
  console.log('✅ Mock data seeding complete');
}

async function seedUsers(): Promise<void> {
  const users: Record<string, User> = {};
  
  // Admin users
  users['oakley'] = {
    id: 'admin_1',
    username: 'oakley',
    role: 'admin',
    email: 'oakley@pantypost.com',
    isVerified: true,
    createdAt: '2024-01-01T00:00:00Z',
    lastActive: new Date().toISOString(),
    bio: 'Platform Administrator',
    isBanned: false,
    verificationStatus: 'verified',
  };
  
  users['gerome'] = {
    id: 'admin_2',
    username: 'gerome',
    role: 'admin',
    email: 'gerome@pantypost.com',
    isVerified: true,
    createdAt: '2024-01-01T00:00:00Z',
    lastActive: new Date().toISOString(),
    bio: 'Platform Administrator',
    isBanned: false,
    verificationStatus: 'verified',
  };
  
  // Seller users
  const sellerNames = ['alice', 'betty', 'carol', 'diana', 'emma', 'fiona', 'grace', 'helen'];
  const tiers: Array<'Tease' | 'Flirt' | 'Desire' | 'Obsession' | 'Goddess'> = ['Tease', 'Flirt', 'Desire', 'Obsession', 'Goddess'];
  
  sellerNames.forEach((name, index) => {
    users[name] = {
      id: `seller_${index + 1}`,
      username: name,
      role: 'seller',
      email: `${name}@example.com`,
      isVerified: index < 4, // First 4 are verified
      tier: tiers[Math.min(index, tiers.length - 1)],
      subscriberCount: Math.floor(Math.random() * 100) + 10,
      totalSales: Math.floor(Math.random() * 200) + 20,
      rating: 3.5 + Math.random() * 1.5,
      reviewCount: Math.floor(Math.random() * 50) + 5,
      createdAt: new Date(Date.now() - (365 - index * 30) * 24 * 60 * 60 * 1000).toISOString(),
      lastActive: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      bio: `Hi, I'm ${name.charAt(0).toUpperCase() + name.slice(1)}! I love creating beautiful content for my fans. 💕`,
      isBanned: false,
      verificationStatus: index < 4 ? 'verified' : 'unverified',
    };
  });
  
  // Buyer users
  const buyerNames = ['buyer1', 'buyer2', 'buyer3', 'buyer4', 'buyer5', 'john', 'mike', 'david'];
  
  buyerNames.forEach((name, index) => {
    users[name] = {
      id: `buyer_${index + 1}`,
      username: name,
      role: 'buyer',
      email: `${name}@example.com`,
      isVerified: false,
      createdAt: new Date(Date.now() - (200 - index * 20) * 24 * 60 * 60 * 1000).toISOString(),
      lastActive: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString(),
      bio: '',
      isBanned: false,
      verificationStatus: 'unverified',
    };
  });
  
  // Add a banned user for testing
  users['baduser'] = {
    id: 'banned_1',
    username: 'baduser',
    role: 'buyer',
    email: 'bad@example.com',
    isVerified: false,
    createdAt: '2024-03-01T00:00:00Z',
    lastActive: '2024-06-01T00:00:00Z',
    bio: 'Banned for violating terms',
    isBanned: true,
    banReason: 'Harassment and inappropriate behavior',
    banExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    verificationStatus: 'unverified',
  };
  
  await mockDataStore.set('users', users);
  
  // Seed user profiles
  const profiles: Record<string, any> = {};
  
  sellerNames.forEach((name, index) => {
    profiles[name] = {
      username: name,
      bio: users[name].bio,
      profilePic: `https://ui-avatars.com/api/?name=${name}&background=FF69B4&color=fff&size=200`,
      subscriptionPrice: (5 + index * 2.5).toFixed(2),
      galleryImages: [
        `https://picsum.photos/400/600?random=${index * 3}`,
        `https://picsum.photos/400/600?random=${index * 3 + 1}`,
        `https://picsum.photos/400/600?random=${index * 3 + 2}`,
      ],
      completeness: {
        percentage: 85,
        missingFields: [],
        suggestions: [
          'Consider adding more gallery images',
          'Update your bio regularly to keep followers engaged',
        ],
      },
    };
  });
  
  await mockDataStore.set('userProfiles', profiles);
}

async function seedListings(): Promise<void> {
  const listings: Listing[] = [];
  const sellers = ['alice', 'betty', 'carol', 'diana', 'emma'];
  
  const listingTemplates = [
    { title: 'Lacy Dream Set', tags: ['lace', 'delicate', 'romantic'], hoursWorn: 24 },
    { title: 'Silk Sensation', tags: ['silk', 'smooth', 'luxury'], hoursWorn: 12 },
    { title: 'Cotton Comfort', tags: ['cotton', 'comfortable', 'daily'], hoursWorn: 48 },
    { title: 'Satin Surprise', tags: ['satin', 'shiny', 'special'], hoursWorn: 6 },
    { title: 'Athletic Essentials', tags: ['athletic', 'sporty', 'active'], hoursWorn: 3 },
    { title: 'Vintage Romance', tags: ['vintage', 'retro', 'unique'], hoursWorn: 24 },
    { title: 'Designer Delights', tags: ['designer', 'premium', 'exclusive'], hoursWorn: 12 },
    { title: 'Everyday Elegance', tags: ['casual', 'everyday', 'practical'], hoursWorn: 72 },
  ];
  
  sellers.forEach((seller, sellerIndex) => {
    listingTemplates.forEach((template, templateIndex) => {
      const basePrice = 20 + Math.random() * 80;
      const isAuction = Math.random() > 0.7;
      const isPremium = Math.random() > 0.8;
      
      const listing: Listing = {
        id: uuidv4(),
        title: `${template.title} by ${seller}`,
        description: `Beautiful ${template.title} worn with care. ${isPremium ? 'Premium quality!' : 'Great value!'} Perfect for collectors.`,
        price: Math.round(basePrice * 100) / 100,
        markedUpPrice: Math.round(basePrice * 1.1 * 100) / 100,
        imageUrls: [
          `https://picsum.photos/400/600?random=${sellerIndex * 100 + templateIndex * 3}`,
          `https://picsum.photos/400/600?random=${sellerIndex * 100 + templateIndex * 3 + 1}`,
          `https://picsum.photos/400/600?random=${sellerIndex * 100 + templateIndex * 3 + 2}`,
        ],
        date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        seller,
        isVerified: sellerIndex < 3,
        isPremium,
        tags: template.tags,
        hoursWorn: template.hoursWorn,
      };
      
      if (isAuction) {
        const endTime = new Date(Date.now() + (1 + Math.random() * 6) * 24 * 60 * 60 * 1000);
        listing.auction = {
          isAuction: true,
          startingPrice: Math.round(basePrice * 0.5 * 100) / 100,
          reservePrice: Math.round(basePrice * 0.8 * 100) / 100,
          endTime: endTime.toISOString(),
          bids: [],
          status: 'active',
        };
        
        // Add some bids
        const bidCount = Math.floor(Math.random() * 5);
        let currentBid = listing.auction.startingPrice;
        
        for (let i = 0; i < bidCount; i++) {
          currentBid += Math.round((5 + Math.random() * 15) * 100) / 100;
          listing.auction.bids.push({
            id: uuidv4(),
            bidder: `buyer${Math.floor(Math.random() * 5) + 1}`,
            amount: currentBid,
            date: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
          });
        }
        
        if (bidCount > 0) {
          listing.auction.highestBid = currentBid;
          listing.auction.highestBidder = listing.auction.bids[bidCount - 1].bidder;
        }
      }
      
      listings.push(listing);
    });
  });
  
  await mockDataStore.set('listings', listings);
  
  // Seed listing views
  const views: Record<string, number> = {};
  listings.forEach(listing => {
    views[listing.id] = Math.floor(Math.random() * 500) + 50;
  });
  await mockDataStore.set('listingViews', views);
}

async function seedOrders(): Promise<void> {
  const orders: MockOrder[] = [];
  const buyers = ['buyer1', 'buyer2', 'buyer3', 'john', 'mike'];
  const sellers = ['alice', 'betty', 'carol', 'diana'];
  
  buyers.forEach(buyer => {
    sellers.forEach((seller, index) => {
      if (Math.random() > 0.6) return; // Not every buyer buys from every seller
      
      const price = 30 + Math.random() * 70;
      const wasAuction = Math.random() > 0.7;
      const daysAgo = Math.floor(Math.random() * 60);
      const statuses: Order['shippingStatus'][] = ['pending', 'processing', 'shipped'];
      
      const order: MockOrder = {
        id: uuidv4(),
        title: `Premium Set from ${seller}`,
        description: `High quality items from ${seller}'s collection`,
        price: Math.round(price * 100) / 100,
        markedUpPrice: Math.round(price * 1.1 * 100) / 100,
        imageUrl: `https://picsum.photos/400/600?random=${index * 10}`,
        date: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
        seller,
        buyer,
        tags: ['premium', 'quality'],
        wasAuction,
        finalBid: wasAuction ? Math.round(price * 100) / 100 : undefined,
        deliveryAddress: {
          fullName: `${buyer} Customer`,
          addressLine1: '123 Main Street',
          city: 'New York',
          state: 'NY',
          postalCode: '10001',
          country: 'US',
        },
        shippingStatus: daysAgo > 10 ? 'shipped' : daysAgo > 3 ? 'processing' : 'pending',
      };
      
      if (order.shippingStatus === 'shipped') {
        order.trackingNumber = `TRACK${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        order.shippedDate = new Date(Date.now() - (daysAgo - 5) * 24 * 60 * 60 * 1000).toISOString();
      }
      
      orders.push(order);
    });
  });
  
  await mockDataStore.set('orders', orders);
}

async function seedMessages(): Promise<void> {
  const messages: Record<string, Message[]> = {};
  
  // Create some conversations
  const conversations = [
    { participants: ['buyer1', 'alice'], messageCount: 10 },
    { participants: ['buyer2', 'betty'], messageCount: 15 },
    { participants: ['buyer3', 'carol'], messageCount: 5 },
    { participants: ['john', 'diana'], messageCount: 20 },
    { participants: ['mike', 'emma'], messageCount: 8 },
  ];
  
  const messageTemplates = [
    { sender: 0, content: 'Hi! I love your listings!' },
    { sender: 1, content: 'Thank you so much! 💕 Anything specific you\'re looking for?' },
    { sender: 0, content: 'I really like the silk sets. Do you have any in pink?' },
    { sender: 1, content: 'Yes! I just posted a new pink silk set. Check it out!' },
    { sender: 0, content: 'Perfect! I just placed an order.' },
    { sender: 1, content: 'Awesome! I\'ll ship it out tomorrow morning.' },
    { sender: 0, content: 'When will it arrive?' },
    { sender: 1, content: 'Should be there in 3-5 business days. I\'ll send tracking info.' },
    { sender: 0, content: 'Thanks! Can\'t wait!' },
    { sender: 1, content: 'You\'re welcome! Let me know if you need anything else 😊' },
  ];
  
  conversations.forEach(({ participants, messageCount }) => {
    const [userA, userB] = participants;
    const key = [userA, userB].sort().join('-');
    messages[key] = [];
    
    for (let i = 0; i < Math.min(messageCount, messageTemplates.length); i++) {
      const template = messageTemplates[i];
      const sender = template.sender === 0 ? participants[0] : participants[1];
      const receiver = sender === participants[0] ? participants[1] : participants[0];
      
      messages[key].push({
        id: uuidv4(),
        sender,
        receiver,
        content: template.content,
        date: new Date(Date.now() - (messageCount - i) * 60 * 60 * 1000).toISOString(),
        isRead: i < messageCount - 2,
        read: i < messageCount - 2,
        type: 'normal',
      });
    }
  });
  
  await mockDataStore.set('messages', messages);
}

async function seedWalletBalances(): Promise<void> {
  // Set up the basic balance structure for mock API
  const balances: Record<string, number> = {
    // Admin balances
    'admin_oakley': 10000,
    'admin_gerome': 10000,
    
    // Buyer balances
    'buyer_buyer1': 500,
    'buyer_buyer2': 250,
    'buyer_buyer3': 1000,
    'buyer_john': 750,
    'buyer_mike': 300,
    
    // Seller balances
    'seller_alice': 1250,
    'seller_betty': 980,
    'seller_carol': 650,
    'seller_diana': 1500,
    'seller_emma': 450,
    'seller_fiona': 200,
    'seller_grace': 100,
    'seller_helen': 50,
  };
  
  await mockDataStore.set('walletBalances', balances);
  
  // IMPORTANT: Also set up the wallet data in the format WalletContext expects
  // This prevents the NaN issue
  
  // Set up collective buyer balances
  const buyerBalances: Record<string, number> = {
    'buyer1': 500,
    'buyer2': 250,
    'buyer3': 1000,
    'john': 750,
    'mike': 300,
  };
  
  // Set up collective seller balances with proper structure
  const sellerBalances: Record<string, any> = {
    'alice': {
      balance: 1250,
      earnings: 1250,
      withdrawn: 0,
      orders: []
    },
    'betty': {
      balance: 980,
      earnings: 980,
      withdrawn: 0,
      orders: []
    },
    'carol': {
      balance: 650,
      earnings: 650,
      withdrawn: 0,
      orders: []
    },
    'diana': {
      balance: 1500,
      earnings: 1500,
      withdrawn: 0,
      orders: []
    },
    'emma': {
      balance: 450,
      earnings: 450,
      withdrawn: 0,
      orders: []
    },
    'fiona': {
      balance: 200,
      earnings: 200,
      withdrawn: 0,
      orders: []
    },
    'grace': {
      balance: 100,
      earnings: 100,
      withdrawn: 0,
      orders: []
    },
    'helen': {
      balance: 50,
      earnings: 50,
      withdrawn: 0,
      orders: []
    }
  };
  
  // Store collective data using mockDataStore
  await mockDataStore.set('wallet_buyers', buyerBalances);
  await mockDataStore.set('wallet_sellers', sellerBalances);
  
  // Also store individual keys and other wallet data if in browser context
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    // Set individual buyer balance keys (in cents)
    Object.entries(buyerBalances).forEach(([username, balance]) => {
      localStorage.setItem(`wallet_buyer_${username}`, (balance * 100).toString());
    });
    
    // Set individual seller balance keys (in cents)
    Object.entries(sellerBalances).forEach(([username, data]) => {
      localStorage.setItem(`wallet_seller_${username}`, (data.balance * 100).toString());
    });
    
    // Set admin balance
    localStorage.setItem('wallet_admin', '10000');
    localStorage.setItem('wallet_admin_enhanced', '1000000'); // In cents
    
    // Initialize empty arrays for other wallet data
    localStorage.setItem('wallet_orders', '[]');
    localStorage.setItem('wallet_adminActions', '[]');
    localStorage.setItem('wallet_sellerWithdrawals', '{}');
    localStorage.setItem('wallet_adminWithdrawals', '[]');
    localStorage.setItem('wallet_depositLogs', '[]');
  }
}

async function seedSubscriptions(): Promise<void> {
  const subscriptions: Record<string, MockSubscriptionInfo[]> = {
    'buyer1': [
      {
        id: 'sub_1',
        buyer: 'buyer1',
        seller: 'alice',
        price: '10.00',
        status: 'active',
        subscribedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        nextBillingDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    'buyer2': [
      {
        id: 'sub_2',
        buyer: 'buyer2',
        seller: 'betty',
        price: '15.00',
        status: 'active',
        subscribedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        nextBillingDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'sub_3',
        buyer: 'buyer2',
        seller: 'carol',
        price: '12.50',
        status: 'active',
        subscribedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        nextBillingDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    'john': [
      {
        id: 'sub_4',
        buyer: 'john',
        seller: 'diana',
        price: '20.00',
        status: 'active',
        subscribedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        nextBillingDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
  };
  
  await mockDataStore.set('subscriptions', subscriptions);
}

/**
 * Clear all mock data
 */
export async function clearMockData(): Promise<void> {
  await mockDataStore.clear();
  
  // Also clear wallet-specific localStorage keys
  if (typeof window !== 'undefined') {
    const keysToRemove = Object.keys(localStorage).filter(key => 
      key.startsWith('wallet_') && !key.startsWith('mock_api_')
    );
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
  }
  
  console.log('🧹 Mock data cleared');
}
