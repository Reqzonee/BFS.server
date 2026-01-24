const Order = require("../models/Order");

/**
 * Generate unique order number in format: ORD-YYMMDD-XXX
 * Example: ORD-240124-001
 * @returns {Promise<string>} Generated order number
 */
async function generateOrderNumber() {
  try {
    // Get current date in YYMMDD format
    const now = new Date();
    const year = String(now.getFullYear()).slice(-2);
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const datePrefix = `${year}${month}${day}`;

    // Find last order number with same date prefix
    const lastOrder = await Order.findOne({
      orderNumber: new RegExp(`^ORD-${datePrefix}-`),
    })
      .sort({ orderNumber: -1 })
      .select("orderNumber")
      .lean();

    let sequence = 1;

    if (lastOrder) {
      // Extract sequence number from last order
      const lastSequence = parseInt(lastOrder.orderNumber.split("-")[2]);
      sequence = lastSequence + 1;
    }

    // Pad sequence with leading zeros (001, 002, etc.)
    const sequenceStr = String(sequence).padStart(3, "0");

    // Generate final order number
    const orderNumber = `ORD-${datePrefix}-${sequenceStr}`;

    return orderNumber;
  } catch (error) {
    console.error("Error generating order number:", error);
    throw new Error("Failed to generate order number");
  }
}

module.exports = { generateOrderNumber };
