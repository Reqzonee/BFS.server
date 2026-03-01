const Order = require("../../models/Order");
const StoreMaster = require("../../models/StoreMaster");
const KOTCounter = require("../../models/KOTCounter");
const { generateOrderNumber } = require("../../utils/orderNumberGenerator");

// Create a new order (POS/Admin)
exports.createOrder = async (req, res) => {
  try {
    const { storeId, items, pricing, payment, orderType, deliveryAddress, specialInstructions, customerDetails } = req.body;

    // Validate required fields from frontend
    if (!storeId || !items || !Array.isArray(items) || items.length === 0 || !pricing || !payment || !orderType) {
      return res.status(400).json({ success: false, message: "Missing required fields: storeId, items, pricing, payment, orderType" });
    }

    // Generate order number
    const orderNumber = await generateOrderNumber();

    // Generate daily KOT number
    const kotNumber = await KOTCounter.getNextKOTNumber(storeId);

    // Get store details
    const store = await StoreMaster.findById(storeId).lean();
    if (!store) {
      return res.status(400).json({ success: false, message: "Invalid storeId" });
    }

    // Get customer info from token (if available)
    const user = req.user;
    let customerId = user && user.role === "POS" && user.customerId ? user.customerId : user && user.role === "CUSTOMER" ? user.id : undefined;

    // Compose storeDetails snapshot
    const storeDetails = {
      storeName: store.storeName,
      storeCode: store.storeCode,
      address: store.address,
      contactNumber: store.contactNumber || "",
    };

    // Compose customerDetails snapshot (optional)
    let customerDetailsSnapshot = undefined;
    if (customerDetails && (customerDetails.fullName || customerDetails.mobileNumber)) {
      customerDetailsSnapshot = {
        fullName: customerDetails.fullName || "",
        mobileNumber: customerDetails.mobileNumber || "",
        email: customerDetails.email || "",
      };
    }

    // Build order object
    const orderObj = {
      orderNumber,
      kotNumber, // Daily KOT number (resets every day)
      storeId,
      storeDetails,
      items,
      pricing,
      payment,
      orderType,
      deliveryAddress,
      specialInstructions,
    };
    if (customerId) orderObj.customerId = customerId;
    if (customerDetailsSnapshot) orderObj.customerDetails = customerDetailsSnapshot;

    const order = new Order(orderObj);
    await order.save();
    res.status(201).json({ success: true, order });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ success: false, message: "Failed to create order", error: error.message });
  }
};

// Resync KOT counter based on today's orders
exports.resyncKOTCounter = async (req, res) => {
  try {
    const { storeId } = req.body;

    if (!storeId) {
      return res.status(400).json({ success: false, message: "storeId is required" });
    }

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Count orders placed today for this store
    const todaysOrderCount = await Order.countDocuments({
      storeId,
      placedAt: { $gte: today, $lt: tomorrow }
    });

    // Update KOT counter to match
    await KOTCounter.findOneAndUpdate(
      { storeId, date: today },
      {
        currentNumber: todaysOrderCount,
        lastUpdated: new Date()
      },
      { upsert: true }
    );

    res.status(200).json({
      success: true,
      message: `KOT counter resynced successfully`,
      todaysOrderCount,
      nextKOTNumber: todaysOrderCount + 1
    });
  } catch (error) {
    console.error("Error resyncing KOT counter:", error);
    res.status(500).json({ success: false, message: "Failed to resync KOT counter", error: error.message });
  }
};
