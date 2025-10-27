// pantypost-backend/routes/stats.routes.js
const express = require('express');
const router = express.Router();
const { getPaymentStats } = require('../utils/paymentStats');

// GET /api/stats/payments-processed - public endpoint for total payments processed
router.get('/payments-processed', async (req, res) => {
  try {
    const stats = await getPaymentStats();
    const total = Math.round(Number(stats.totalPaymentsProcessed || 0) * 100) / 100;

    return res.json({
      success: true,
      data: {
        totalPaymentsProcessed: total,
        updatedAt: stats.updatedAt,
      },
    });
  } catch (error) {
    console.error('[Stats] Error fetching payment stats:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch payments processed stats',
    });
  }
});

// GET /api/stats/total-payments - alias endpoint for clarity
router.get('/total-payments', async (req, res) => {
  try {
    const stats = await getPaymentStats();
    const total = Math.round(Number(stats.totalPaymentsProcessed || 0) * 100) / 100;

    return res.json({
      success: true,
      data: {
        totalPaymentsProcessed: total,
        updatedAt: stats.updatedAt,
      },
    });
  } catch (error) {
    console.error('[Stats] Error fetching total payments:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch total payments processed',
    });
  }
});

module.exports = router;
