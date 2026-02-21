const Order = require("../../models/Order");
const FoodItemMaster = require("../../models/FoodItemMaster");

// Generate KOT for an order (only non-packed food)
exports.generateKOT = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId).lean();
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    // Filter items: only non-packed food
    const foodItemIds = order.items.map(item => item.itemId);
    const foodItems = await FoodItemMaster.find({ _id: { $in: foodItemIds } }).lean();
    const packedFoodMap = {};
    foodItems.forEach(item => {
      packedFoodMap[item._id.toString()] = item.ispackedfood;
    });
    const kotItems = order.items.filter(item => !packedFoodMap[item.itemId.toString()]);
    res.status(200).json({
      success: true,
      kot: {
        orderNumber: order.orderNumber,
        items: kotItems,
        placedAt: order.placedAt,
        storeDetails: order.storeDetails,
        table: order.table,
        specialInstructions: order.specialInstructions,
      }
    });
  } catch (error) {
    console.error("Error generating KOT:", error);
    res.status(500).json({ success: false, message: "Failed to generate KOT", error: error.message });
  }
};
