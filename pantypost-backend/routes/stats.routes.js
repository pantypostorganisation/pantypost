// pantypost-backend/routes/stats.routes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const {
  buildAdminHeroCounterPayload,
  buildPaymentStatsPayload,
  clearHeroDisplayAdjustment,
  getPaymentStats,
  setHeroDisplayAdjustment,
} = require('../utils/paymentStats');

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'ADMIN_REQUIRED',
        message: 'Admin access required',
      },
    });
  }

  next();
}

function getAdminIdentifier(req) {
  return req.user?.id || req.user?._id || req.user?.username || 'admin';
}

async function sendPublicPaymentStats(req, res, errorMessage) {
  try {
    const stats = await getPaymentStats();

    return res.json({
      success: true,
      data: buildPaymentStatsPayload(stats),
    });
  } catch (error) {
    console.error('[Stats] Error fetching payment stats:', error);
    return res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
}

// GET /api/stats/payments-processed - public endpoint
router.get('/payments-processed', async (req, res) => {
  return sendPublicPaymentStats(
    req,
    res,
    'Failed to fetch payments processed stats'
  );
});

// GET /api/stats/total-payments - public alias used by the frontend
router.get('/total-payments', async (req, res) => {
  return sendPublicPaymentStats(
    req,
    res,
    'Failed to fetch total payments processed'
  );
});

// GET /api/stats/admin/hero-counter - current admin-only hero counter settings
router.get(
  '/admin/hero-counter',
  authMiddleware,
  requireAdmin,
  async (req, res) => {
    try {
      const stats = await getPaymentStats();

      return res.json({
        success: true,
        data: buildAdminHeroCounterPayload(stats),
      });
    } catch (error) {
      console.error('[Stats] Error fetching hero counter settings:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'HERO_COUNTER_FETCH_FAILED',
          message: 'Failed to fetch hero counter settings',
        },
      });
    }
  }
);

// PATCH /api/stats/admin/hero-counter - set a display-only adjustment
router.patch(
  '/admin/hero-counter',
  authMiddleware,
  requireAdmin,
  async (req, res) => {
    try {
      const amount = Number(req.body?.amount);

      if (!Number.isFinite(amount) || amount <= 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_HERO_ADJUSTMENT',
            message: 'Adjustment must be a finite amount greater than 0',
          },
        });
      }

      const roundedAmount = Math.round(amount * 100) / 100;
      const stats = await setHeroDisplayAdjustment(
        roundedAmount,
        getAdminIdentifier(req)
      );

      return res.json({
        success: true,
        data: buildAdminHeroCounterPayload(stats),
      });
    } catch (error) {
      console.error('[Stats] Error updating hero counter adjustment:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: error.code || 'HERO_COUNTER_UPDATE_FAILED',
          message:
            error.message || 'Failed to update hero counter adjustment',
        },
      });
    }
  }
);

// DELETE /api/stats/admin/hero-counter - remove the display-only adjustment
router.delete(
  '/admin/hero-counter',
  authMiddleware,
  requireAdmin,
  async (req, res) => {
    try {
      const stats = await clearHeroDisplayAdjustment(getAdminIdentifier(req));

      return res.json({
        success: true,
        data: buildAdminHeroCounterPayload(stats),
      });
    } catch (error) {
      console.error('[Stats] Error removing hero counter adjustment:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'HERO_COUNTER_RESET_FAILED',
          message: 'Failed to remove hero counter adjustment',
        },
      });
    }
  }
);

module.exports = router;
