// pantypost-backend/utils/paymentStats.js
const PaymentStats = require('../models/PaymentStats');

function roundCurrency(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return 0;
  }

  return Math.round(numericValue * 100) / 100;
}

function normalizeIncrementAmount(amount) {
  const numericAmount = roundCurrency(amount);
  return numericAmount > 0 ? numericAmount : 0;
}

function normalizeDisplayAdjustment(amount) {
  const numericAmount = roundCurrency(amount);
  return numericAmount >= 0 ? numericAmount : 0;
}

function buildPaymentStatsPayload(stats) {
  const actualPaymentsProcessed = Math.max(
    0,
    roundCurrency(stats?.totalPaymentsProcessed || 0)
  );

  const configuredAdjustment = Math.max(
    0,
    normalizeDisplayAdjustment(stats?.heroDisplayAdjustment || 0)
  );

  const heroDisplayAdjustmentEnabled =
    Boolean(stats?.heroDisplayAdjustmentEnabled) && configuredAdjustment > 0;

  const displayedCounterTotal = roundCurrency(
    actualPaymentsProcessed +
      (heroDisplayAdjustmentEnabled ? configuredAdjustment : 0)
  );

  return {
    // Keep the legacy field genuine for existing integrations.
    totalPaymentsProcessed: actualPaymentsProcessed,
    actualPaymentsProcessed,
    displayedCounterTotal,
    heroDisplayAdjustmentEnabled,
    counterLabel: heroDisplayAdjustmentEnabled
      ? 'Promotional counter'
      : 'Payments processed',
    updatedAt: stats?.updatedAt || new Date(),
    timestamp: new Date().toISOString(),
  };
}

function buildAdminHeroCounterPayload(stats) {
  const publicPayload = buildPaymentStatsPayload(stats);

  return {
    ...publicPayload,
    heroDisplayAdjustment: Math.max(
      0,
      normalizeDisplayAdjustment(stats?.heroDisplayAdjustment || 0)
    ),
    heroDisplayAdjustmentUpdatedAt:
      stats?.heroDisplayAdjustmentUpdatedAt || null,
    heroDisplayAdjustmentUpdatedBy:
      stats?.heroDisplayAdjustmentUpdatedBy || null,
  };
}

async function getPaymentStats() {
  const stats = await PaymentStats.findOne();
  if (stats) {
    return stats;
  }

  return PaymentStats.create({
    totalPaymentsProcessed: 0,
    heroDisplayAdjustment: 0,
    heroDisplayAdjustmentEnabled: false,
  });
}

function broadcastPaymentStats(stats) {
  const payload = buildPaymentStatsPayload(stats);

  try {
    if (global.webSocketService) {
      global.webSocketService.broadcast('stats:payments_processed', payload);
    }
  } catch (error) {
    console.error(
      '[PaymentStats] Failed to broadcast via main WebSocket:',
      error
    );
  }

  try {
    if (
      global.publicWebSocketService &&
      global.publicWebSocketService.broadcastPaymentsProcessed
    ) {
      global.publicWebSocketService.broadcastPaymentsProcessed(payload);
    }
  } catch (error) {
    console.error(
      '[PaymentStats] Failed to broadcast via public WebSocket:',
      error
    );
  }

  return payload;
}

async function incrementPaymentStats(amount = 0) {
  const incrementAmount = normalizeIncrementAmount(amount);

  if (incrementAmount <= 0) {
    return getPaymentStats();
  }

  const updated = await PaymentStats.findOneAndUpdate(
    {},
    {
      $inc: { totalPaymentsProcessed: incrementAmount },
      $set: { updatedAt: new Date() },
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );

  broadcastPaymentStats(updated);
  return updated;
}

async function setHeroDisplayAdjustment(amount, updatedBy = null) {
  const adjustment = normalizeDisplayAdjustment(amount);

  if (!Number.isFinite(Number(amount)) || adjustment <= 0) {
    const error = new Error('Adjustment must be a finite amount greater than 0');
    error.code = 'INVALID_HERO_ADJUSTMENT';
    throw error;
  }

  const now = new Date();
  const updated = await PaymentStats.findOneAndUpdate(
    {},
    {
      $set: {
        heroDisplayAdjustment: adjustment,
        heroDisplayAdjustmentEnabled: true,
        heroDisplayAdjustmentUpdatedAt: now,
        heroDisplayAdjustmentUpdatedBy: updatedBy
          ? String(updatedBy).slice(0, 200)
          : null,
        updatedAt: now,
      },
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );

  broadcastPaymentStats(updated);
  return updated;
}

async function clearHeroDisplayAdjustment(updatedBy = null) {
  const now = new Date();
  const updated = await PaymentStats.findOneAndUpdate(
    {},
    {
      $set: {
        heroDisplayAdjustment: 0,
        heroDisplayAdjustmentEnabled: false,
        heroDisplayAdjustmentUpdatedAt: now,
        heroDisplayAdjustmentUpdatedBy: updatedBy
          ? String(updatedBy).slice(0, 200)
          : null,
        updatedAt: now,
      },
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );

  broadcastPaymentStats(updated);
  return updated;
}

module.exports = {
  buildAdminHeroCounterPayload,
  buildPaymentStatsPayload,
  clearHeroDisplayAdjustment,
  getPaymentStats,
  incrementPaymentStats,
  setHeroDisplayAdjustment,
};
