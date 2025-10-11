// pantypost-backend/services/userStatsService.js
const User = require('../models/User');

/**
 * Fetch aggregated user statistics for public display
 * This helper is shared between API routes and WebSocket broadcasts
 */
async function getUserStats() {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    totalBuyers,
    totalSellers,
    verifiedSellers,
    newUsersToday,
    newUsers24Hours
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'buyer' }),
    User.countDocuments({ role: 'seller' }),
    User.countDocuments({ role: 'seller', isVerified: true }),
    User.countDocuments({ createdAt: { $gte: startOfToday } }),
    User.countDocuments({ createdAt: { $gte: last24Hours } })
  ]);

  return {
    totalUsers,
    totalBuyers,
    totalSellers,
    verifiedSellers,
    newUsersToday,
    newUsers24Hours,
    timestamp: now.toISOString()
  };
}

module.exports = {
  getUserStats
};
