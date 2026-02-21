const Order = require("../../models/Order");
const StoreMaster = require("../../models/StoreMaster");
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
