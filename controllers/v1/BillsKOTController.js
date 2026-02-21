const Order = require("../../models/Order");
const FoodItemMaster = require("../../models/FoodItemMaster");
const { generateBillPDF, generateKOTPDF } = require("../../utils/pdfGenerator");


// List all orders as bills for a given date
exports.listBills = async (req, res) => {
  try {
    const { date } = req.query;
    let startDate, endDate;

    if (date) {
      startDate = new Date(date);
      startDate.setUTCHours(0, 0, 0, 0);
      endDate = new Date(date);
      endDate.setUTCHours(23, 59, 59, 999);
    } else {
      // Default to today
      startDate = new Date();
      startDate.setUTCHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setUTCHours(23, 59, 59, 999);
    }

    console.log('Fetching bills - Date param:', date);
    console.log('Date range:', { startDate, endDate });

    const orders = await Order.find({
      placedAt: { $gte: startDate, $lte: endDate },
      status: { $nin: ["cancelled"] },
    })
      .sort({ placedAt: 1 }) // ascending for sequential numbering
      .lean();

    console.log('Orders found:', orders.length);
    if (orders.length > 0) {
      console.log('First order placedAt:', orders[0].placedAt);
      console.log('Last order placedAt:', orders[orders.length - 1].placedAt);
    }

    const bills = orders.map((order, index) => ({
      _id: order._id,
      billNumber: `BILL-${index + 1}`,
      orderNumber: order.orderNumber,
      time: new Date(order.placedAt).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      total: order.pricing?.grandTotal || 0,
      items: order.items?.length || 0,
      orderType: order.orderType,
      status: order.status,
      payment: order.payment,
      placedAt: order.placedAt,
    })).reverse(); // reverse so newest is first in display

    res.status(200).json({ isOk: true, data: bills });
  } catch (error) {
    console.error("Error listing bills:", error);
    res.status(500).json({ isOk: false, message: "Failed to fetch bills", error: error.message });
  }
};

// List all orders as KOTs for a given date
exports.listKOTs = async (req, res) => {
  try {
    const { date } = req.query;
    let startDate, endDate;

    if (date) {
      startDate = new Date(date);
      startDate.setUTCHours(0, 0, 0, 0);
      endDate = new Date(date);
      endDate.setUTCHours(23, 59, 59, 999);
    } else {
      startDate = new Date();
      startDate.setUTCHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setUTCHours(23, 59, 59, 999);
    }

    console.log('Fetching KOTs - Date param:', date);
    console.log('Date range:', { startDate, endDate });

    const orders = await Order.find({
      placedAt: { $gte: startDate, $lte: endDate },
      status: { $nin: ["cancelled"] },
    })
      .sort({ placedAt: 1 }) // ascending for sequential numbering
      .lean();

    console.log('Orders found for KOT:', orders.length);
    if (orders.length > 0) {
      console.log('First order placedAt:', orders[0].placedAt);
    }

    // For each order, filter out packed food items to get KOT items
    const allItemIds = [];
    orders.forEach((order) => {
      order.items.forEach((item) => allItemIds.push(item.itemId));
    });

    const foodItems = await FoodItemMaster.find({ _id: { $in: allItemIds } }).lean();
    const packedFoodMap = {};
    foodItems.forEach((item) => {
      packedFoodMap[item._id.toString()] = item.ispackedfood;
    });

    let kotCounter = 0;
    const kots = orders.map((order) => {
      const kotItems = order.items.filter(
        (item) => !packedFoodMap[item.itemId?.toString()]
      );
      if (kotItems.length === 0) return null; // skip orders with no KOT items
      kotCounter++;
      return {
        _id: order._id,
        kotNumber: `KOT-${kotCounter}`,
        orderNumber: order.orderNumber,
        time: new Date(order.placedAt).toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        items: kotItems.length,
        orderType: order.orderType,
        status: order.status === "preparing" ? "preparing" : order.status === "ready" || order.status === "completed" || order.status === "delivered" ? "prepared" : "pending",
        placedAt: order.placedAt,
      };
    });

    // Filter out nulls (orders with no KOT items) and reverse for newest-first display
    const filteredKots = kots.filter(Boolean).reverse();

    res.status(200).json({ isOk: true, data: filteredKots });
  } catch (error) {
    console.error("Error listing KOTs:", error);
    res.status(500).json({ isOk: false, message: "Failed to fetch KOTs", error: error.message });
  }
};

// Print a bill (generates and returns PDF)
exports.printBill = async (req, res) => {
  try {
    const { billId } = req.params;
    const order = await Order.findById(billId).lean();
    if (!order) {
      return res.status(404).json({ isOk: false, message: "Bill not found" });
    }

    // Generate PDF
    const pdfBuffer = await generateBillPDF(order);

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Bill-${order.orderNumber}.pdf`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send PDF buffer
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error printing bill:", error);
    res.status(500).json({ isOk: false, message: "Failed to print bill", error: error.message });
  }
};

// Print a KOT (generates and returns PDF)
exports.printKOT = async (req, res) => {
  try {
    const { kotId } = req.params;
    const order = await Order.findById(kotId).lean();
    if (!order) {
      return res.status(404).json({ isOk: false, message: "KOT not found" });
    }

    // Filter to only non-packed food items
    const foodItemIds = order.items.map((item) => item.itemId);
    const foodItems = await FoodItemMaster.find({ _id: { $in: foodItemIds } }).lean();
    const packedFoodMap = {};
    foodItems.forEach((item) => {
      packedFoodMap[item._id.toString()] = item.ispackedfood;
    });
    const kotItems = order.items.filter(
      (item) => !packedFoodMap[item.itemId?.toString()]
    );

    // If no items for kitchen, return error
    if (kotItems.length === 0) {
      return res.status(400).json({ isOk: false, message: "No kitchen items in this order" });
    }

    // Generate KOT PDF
    const pdfBuffer = await generateKOTPDF(order, kotItems);

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=KOT-${order.orderNumber}.pdf`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send PDF buffer
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error printing KOT:", error);
    res.status(500).json({ isOk: false, message: "Failed to print KOT", error: error.message });
  }
};
