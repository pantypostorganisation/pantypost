// pantypost-backend/utils/paymentStats.js
const PaymentStats = require('../models/PaymentStats');

function buildPayload(totalPaymentsProcessed) {
  return {
    totalPaymentsProcessed,
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

async function incrementPaymentStats(amount = 1) {
  if (amount <= 0) {
    return getPaymentStats();
  }

  const updated = await PaymentStats.findOneAndUpdate(
    {},
    {
      $inc: { totalPaymentsProcessed: amount },
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
