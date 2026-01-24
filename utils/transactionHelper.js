const Transaction = require("../models/Transaction");

/**
 * Create a transaction record for an order
 * @param {Object} params - Transaction parameters
 * @returns {Promise<Object>} Created transaction
 */
async function createTransaction({
  orderId,
  orderNumber,
  customerId,
  storeId,
  amount,
  method,
  type = "payment",
}) {
  try {
    // Generate transaction ID
    const transactionId = `TXN-${orderId}`;

    // Determine transaction status based on payment method
    let status = "pending";
    let completedAt = null;

    if (method === "online") {
      // Mock: Online payments succeed immediately
      status = "success";
      completedAt = new Date();
    }

    // Create transaction document
    const transaction = new Transaction({
      transactionId,
      orderId,
      orderNumber,
      customerId,
      storeId,
      type,
      method,
      amount,
      currency: "INR",
      status,
      gateway: {
        name: "mock",
        gatewayTransactionId: `MOCK-${Date.now()}`,
        gatewayOrderId: orderNumber,
      },
      initiatedAt: new Date(),
      completedAt,
      notes: `${type} transaction for order ${orderNumber}`,
    });

    await transaction.save();

    return transaction;
  } catch (error) {
    console.error("Error creating transaction:", error);
    throw new Error("Failed to create transaction record");
  }
}

/**
 * Update transaction status
 * @param {string} transactionId - Transaction ID
 * @param {string} status - New status
 * @param {Object} additionalData - Additional data to update
 * @returns {Promise<Object>} Updated transaction
 */
async function updateTransactionStatus(transactionId, status, additionalData = {}) {
  try {
    const updateData = {
      status,
      ...additionalData,
    };

    if (status === "success") {
      updateData.completedAt = new Date();
    } else if (status === "failed") {
      updateData.failedAt = new Date();
    }

    const transaction = await Transaction.findOneAndUpdate(
      { transactionId },
      updateData,
      { new: true }
    );

    return transaction;
  } catch (error) {
    console.error("Error updating transaction status:", error);
    throw new Error("Failed to update transaction status");
  }
}

module.exports = {
  createTransaction,
  updateTransactionStatus,
};
