// pantypost-backend/utils/paymentStats.js
const PaymentStats = require('../models/PaymentStats');

function normalizeAmount(amount) {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    return 0;
  }

  return Math.round(numericAmount * 100) / 100;
}

function buildPayload(totalPaymentsProcessed) {
  const normalizedTotal = Math.round(Number(totalPaymentsProcessed || 0) * 100) / 100;

  return {
    totalPaymentsProcessed: normalizedTotal,
    timestamp: new Date().toISOString(),
  };
}

async function getPaymentStats() {
  const stats = await PaymentStats.findOne();
  if (stats) {
    return stats;
  }

  return PaymentStats.create({ totalPaymentsProcessed: 0 });
}

async function incrementPaymentStats(amount = 0) {
  const incrementAmount = normalizeAmount(amount);

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

  const payload = buildPayload(updated.totalPaymentsProcessed);

  try {
    if (global.webSocketService) {
      global.webSocketService.broadcast('stats:payments_processed', payload);
    }
  } catch (error) {
    console.error('[PaymentStats] Failed to broadcast via main WebSocket:', error);
  }

  try {
    if (global.publicWebSocketService && global.publicWebSocketService.broadcastPaymentsProcessed) {
      global.publicWebSocketService.broadcastPaymentsProcessed(payload);
    }
  } catch (error) {
    console.error('[PaymentStats] Failed to broadcast via public WebSocket:', error);
  }

  return updated;
}

module.exports = {
  getPaymentStats,
  incrementPaymentStats,
};
