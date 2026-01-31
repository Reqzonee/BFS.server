const Order = require("../models/Order");
const { emitToRoom } = require("../utils/socket");

/**
 * Initializes MongoDB Change Streams to watch the orders collection.
 * This ensures that even if status changes happen outside the main controller
 * (e.g., via background jobs or direct DB updates), they are still broadcast.
 */
const initOrderWatcher = () => {
    // Check if current MongoDB version/setup supports change streams (requires Replica Set)
    try {
        const orderStream = Order.watch([], { fullDocument: "updateLookup" });

        orderStream.on("change", (change) => {
            try {
                if (change.operationType === "insert") {
                    const order = change.fullDocument;
                    console.log(`✨ [ChangeStream] New order detected: ${order.orderNumber}`);

                    // Emit to store room
                    emitToRoom(`store:${order.storeId}`, "new_order", {
                        orderNumber: order.orderNumber,
                        storeId: order.storeId,
                        status: order.status,
                        pricing: { grandTotal: order.pricing.grandTotal },
                        customerDetails: {
                            fullName: order.customerDetails?.fullName,
                            mobileNumber: order.customerDetails?.mobileNumber
                        },
                        orderType: order.orderType,
                        placedAt: order.placedAt,
                    });
                }
                else if (change.operationType === "update") {
                    const order = change.fullDocument;
                    const updatedFields = change.updateDescription.updatedFields;

                    // If status changed, notify customer
                    if (updatedFields && updatedFields.status) {
                        console.log(`🔄 [ChangeStream] Status update for ${order.orderNumber}: ${updatedFields.status}`);

                        emitToRoom(`customer:${order.customerId}`, "order_status_update", {
                            orderNumber: order.orderNumber,
                            status: order.status,
                            updatedAt: new Date(),
                            notes: order.statusHistory?.[order.statusHistory.length - 1]?.notes || `Order status: ${order.status}`,
                        });
                    }
                }
            } catch (err) {
                console.error("❌ Error processing Order ChangeStream event:", err);
            }
        });

        orderStream.on("error", (error) => {
            console.error("❌ Order ChangeStream Error:", error);
            // Attempt to restart watcher after a delay
            setTimeout(initOrderWatcher, 5000);
        });

        console.log("✅ Order ChangeStream Watcher Active");
    } catch (error) {
        console.error("⚠️ Failed to initialize Order ChangeStream. This might be because you're using a single-node MongoDB without a Replica Set.");
        console.warn("Real-time updates will fallback to explicit controller emissions.");
    }
};

module.exports = { initOrderWatcher };
