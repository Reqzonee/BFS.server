const Order = require("../../models/Order");
const Transaction = require("../../models/Transaction");
const Cart = require("../../models/Cart");
const Customer = require("../../models/Customer");
const StoreMaster = require("../../models/StoreMaster");
const StoreItemConfig = require("../../models/StoreItemConfig");
const StoreComboConfig = require("../../models/StoreComboConfig");
const StoreMerchandiseConfig = require("../../models/StoreMerchandiseConfig");
const { generateOrderNumber } = require("../../utils/orderNumberGenerator");
const { canCancelOrder, isAddressServiceable } = require("../../utils/orderValidation");
const { createTransaction } = require("../../utils/transactionHelper");

/**
 * Place order from cart
 * POST /api/v1/customer/orders/place
 */
exports.placeOrder = async (req, res) => {
  try {
    console.log("=== Place Order Debug ===");
    console.log("req.customer:", req.customer);
    console.log("Headers:", req.headers.authorization);
    
    if (!req.customer || !req.customer.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
        error: "Customer not authenticated. Please login again.",
        status: 401,
      });
    }
    
    const customerId = req.customer.id;
    const { orderType, deliveryAddressId, paymentMethod, specialInstructions } = req.body;

    // Validate required fields
    if (!orderType || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
        error: "orderType and paymentMethod are required",
        status: 400,
      });
    }

    // Validate enum values
    if (!["delivery", "pickup", "dine-in"].includes(orderType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order type",
        error: "orderType must be delivery, pickup, or dine-in",
        status: 400,
      });
    }

    if (!["cod", "online"].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method",
        error: "paymentMethod must be cod or online",
        status: 400,
      });
    }

    // Step 1: Fetch customer's cart
    const cart = await Cart.findOne({ customerId }).populate("storeId");

    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
        error: "Cannot place order with empty cart. Please add items.",
        status: 400,
      });
    }

    // Step 2: Fetch customer details
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
        status: 404,
      });
    }

    // Step 3: Fetch store details
    const store = await StoreMaster.findById(cart.storeId);
    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store not found",
        status: 404,
      });
    }

    // Step 4: Validate store is accepting orders
    if (!store.isAcceptingOrders) {
      return res.status(400).json({
        success: false,
        message: "Store not accepting orders",
        error: "Store is currently not accepting orders",
        status: 400,
        data: {
          storeId: store._id,
          storeName: store.storeName,
          isAcceptingOrders: false,
        },
      });
    }

    // Step 5: Validate all cart items (TWO-FLAG SYSTEM)
    const unavailableItems = [];
    const soldOutItems = [];

    for (const cartItem of cart.items) {
      let itemConfig;

      // Fetch appropriate config based on item type
      if (cartItem.itemType === "FoodItemMaster") {
        itemConfig = await StoreItemConfig.findOne({
          itemId: cartItem.itemId,
          storeId: cart.storeId,
        });
      } else if (cartItem.itemType === "ComboMaster") {
        itemConfig = await StoreComboConfig.findOne({
          comboId: cartItem.itemId,
          storeId: cart.storeId,
        });
      } else if (cartItem.itemType === "MerchandiseMaster") {
        itemConfig = await StoreMerchandiseConfig.findOne({
          merchandiseId: cartItem.itemId,
          storeId: cart.storeId,
        });
      }

      if (!itemConfig) {
        unavailableItems.push({
          itemId: cartItem.itemId,
          itemName: cartItem.itemName,
          itemType: cartItem.itemType,
          reason: "Item configuration not found",
        });
        continue;
      }

      // Check isAvailable flag (soft delete)
      if (!itemConfig.isAvailable) {
        unavailableItems.push({
          itemId: cartItem.itemId,
          itemName: cartItem.itemName,
          itemType: cartItem.itemType,
          isAvailable: false,
          reason: "Item no longer available at this store",
        });
      }

      // Check isSoldOut flag (out of stock)
      if (itemConfig.isSoldOut) {
        soldOutItems.push({
          itemId: cartItem.itemId,
          itemName: cartItem.itemName,
          itemType: cartItem.itemType,
          isSoldOut: true,
          reason: "Item currently out of stock",
        });
      }
    }

    // If any items are unavailable or sold out, reject order
    if (unavailableItems.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Some items are no longer available",
        error: "Cart contains items that are no longer available. Please refresh cart.",
        status: 400,
        data: { unavailableItems },
      });
    }

    if (soldOutItems.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Some items are out of stock",
        error: "Cannot place order. Please remove sold out items from cart.",
        status: 400,
        data: { soldOutItems },
      });
    }

    // Step 6: Validate delivery address (if delivery order)
    let deliveryAddress = null;
    if (orderType === "delivery") {
      if (!deliveryAddressId) {
        return res.status(400).json({
          success: false,
          message: "Delivery address required",
          error: "deliveryAddressId is required for delivery orders",
          status: 400,
        });
      }

      // Find address in customer's addresses array
      deliveryAddress = customer.addresses.id(deliveryAddressId);
      if (!deliveryAddress) {
        return res.status(404).json({
          success: false,
          message: "Delivery address not found",
          status: 404,
        });
      }

      // Check if address is within delivery radius
      if (store.location && deliveryAddress.location && store.deliveryRadius) {
        const serviceability = isAddressServiceable(
          store.location,
          deliveryAddress.location,
          store.deliveryRadius
        );

        if (!serviceability.serviceable) {
          return res.status(400).json({
            success: false,
            message: "Delivery not available",
            error: "Your delivery address is outside the store's service area",
            status: 400,
            data: {
              addressDistance: serviceability.distance,
              maxDeliveryRadius: serviceability.maxRadius,
            },
          });
        }
      }
    }

    // Step 7: Calculate pricing
    let subtotal = 0;
    let totalTax = 0;

    const orderItems = cart.items.map((item) => {
      const itemSubtotal = item.itemTotal;
      const itemTax = (itemSubtotal * (item.gstPercent || 0)) / 100;

      subtotal += itemSubtotal;
      totalTax += itemTax;

      return {
        itemId: item.itemId,
        itemType: item.itemType,
        itemName: item.itemName,
        itemCode: item.itemCode,
        basePrice: item.basePrice,
        selectedVariant: item.selectedVariant,
        addOns: item.addOns,
        quantity: item.quantity,
        itemTotal: item.itemTotal,
        imageUrl: item.imageUrl,
        gstPercent: item.gstPercent || 0,
      };
    });

    const deliveryFee = 0; // Not implemented yet
    const platformFee = 0;
    const discountAmount = 0;
    const grandTotal = subtotal + totalTax + deliveryFee + platformFee - discountAmount;

    // Step 8: Generate order number
    const orderNumber = await generateOrderNumber();

    // Step 9: Create order document
    const order = new Order({
      orderNumber,
      customerId,
      storeId: cart.storeId,
      customerDetails: {
        fullName: customer.fullName,
        mobileNumber: customer.mobileNumber,
        email: customer.email,
      },
      storeDetails: {
        storeName: store.storeName,
        storeCode: store.storeCode,
        address: store.address,
        contactNumber: store.contactNumber,
      },
      orderType,
      deliveryAddress: deliveryAddress
        ? {
            addressType: deliveryAddress.addressType,
            houseNumber: deliveryAddress.houseNumber,
            street: deliveryAddress.street,
            area: deliveryAddress.area,
            landmark: deliveryAddress.landmark,
            city: deliveryAddress.city,
            state: deliveryAddress.state,
            country: deliveryAddress.country,
            pincode: deliveryAddress.pincode,
            location: deliveryAddress.location,
          }
        : undefined,
      items: orderItems,
      pricing: {
        subtotal,
        totalTax,
        deliveryFee,
        platformFee,
        discountAmount,
        grandTotal,
      },
      payment: {
        method: paymentMethod,
        status: paymentMethod === "online" ? "paid" : "pending",
        totalAmount: grandTotal,
        paidAmount: paymentMethod === "online" ? grandTotal : 0,
        pendingAmount: paymentMethod === "online" ? 0 : grandTotal,
        transactionIds: [],
      },
      status: "pending",
      statusHistory: [
        {
          status: "pending",
          updatedAt: new Date(),
          updatedBy: "customer",
          notes: "Order placed",
        },
      ],
      specialInstructions,
      placedAt: new Date(),
    });

    await order.save();

    // Step 10: Create transaction record
    const transaction = await createTransaction({
      orderId: order._id,
      orderNumber: order.orderNumber,
      customerId,
      storeId: cart.storeId,
      amount: grandTotal,
      method: paymentMethod,
      type: "payment",
    });

    // Update order with transaction ID
    order.payment.transactionIds.push(transaction.transactionId);
    await order.save();

    // Step 11: Clear cart
    cart.items = [];
    await cart.save();

    // Step 12: Calculate cancellation deadline
    const cancelDeadline = new Date(order.placedAt.getTime() + 30000); // 30 seconds

    // Step 13: Return success response
    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      status: 201,
      data: {
        order: {
          _id: order._id,
          orderNumber: order.orderNumber,
          status: order.status,
          orderType: order.orderType,
          grandTotal: order.pricing.grandTotal,
          placedAt: order.placedAt,
          canCancel: true,
          cancelDeadline,
        },
      },
    });
  } catch (error) {
    console.error("Error placing order:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to place order",
      error: error.message,
      status: 500,
    });
  }
};

/**
 * Get order history with pagination and filters
 * GET /api/v1/customer/orders
 */
exports.getOrderHistory = async (req, res) => {
  try {
    const customerId = req.customer.id;
    const {
      page = 1,
      limit = 10,
      status = "all",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Build query
    const query = { customerId };

    if (status !== "all") {
      query.status = status;
    }

    // Validate and limit page size
    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 50); // Max 50 items per page

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Execute query with pagination
    const orders = await Order.find(query)
      .sort(sort)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .select(
        "orderNumber storeDetails orderType status pricing.grandTotal placedAt items"
      )
      .lean();

    // Get total count for pagination
    const totalOrders = await Order.countDocuments(query);
    const totalPages = Math.ceil(totalOrders / limitNum);

    // Format response
    const formattedOrders = orders.map((order) => ({
      _id: order._id,
      orderNumber: order.orderNumber,
      storeDetails: {
        storeName: order.storeDetails.storeName,
        storeCode: order.storeDetails.storeCode,
      },
      orderType: order.orderType,
      status: order.status,
      pricing: {
        grandTotal: order.pricing.grandTotal,
      },
      itemCount: order.items.length,
      placedAt: order.placedAt,
    }));

    return res.status(200).json({
      success: true,
      message: "Order history fetched successfully",
      status: 200,
      data: {
        orders: formattedOrders,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalOrders,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching order history:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch order history",
      error: error.message,
      status: 500,
    });
  }
};

/**
 * Get order details by order number
 * GET /api/v1/customer/orders/:orderNumber
 */
exports.getOrderDetails = async (req, res) => {
  try {
    const customerId = req.customer.id;
    const { orderNumber } = req.params;

    // Fetch order
    const order = await Order.findOne({ orderNumber }).lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
        status: 404,
      });
    }

    // Security: Verify order belongs to customer
    if (order.customerId.toString() !== customerId.toString()) {
      console.warn(`Unauthorized access attempt: order.customerId=${order.customerId.toString()} requester=${customerId.toString()}`);
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
        error: "You are not authorized to view this order",
        status: 403,
      });
    }

    // Check if order can still be cancelled
    const cancellationCheck = canCancelOrder(order);

    // Return order details with snapshot data
    return res.status(200).json({
      success: true,
      message: "Order details fetched successfully",
      status: 200,
      data: {
        order: {
          ...order,
          canCancel: cancellationCheck.canCancel,
          cancelDeadline: cancellationCheck.canCancel ? cancellationCheck.deadline : null,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching order details:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch order details",
      error: error.message,
      status: 500,
    });
  }
};

/**
 * Cancel order (30-second window only)
 * PUT /api/v1/customer/orders/:orderNumber/cancel
 */
exports.cancelOrder = async (req, res) => {
  try {
    const customerId = req.customer.id;
    const { orderNumber } = req.params;
    const { reason } = req.body;

    // Fetch order
    const order = await Order.findOne({ orderNumber });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
        status: 404,
      });
    }

    // Security: Verify order belongs to customer
    if (order.customerId.toString() !== customerId.toString()) {
      console.warn(`Unauthorized cancel attempt: order.customerId=${order.customerId.toString()} requester=${customerId.toString()}`);
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
        error: "You are not authorized to cancel this order",
        status: 403,
      });
    }

    // Check if order can be cancelled
    const cancellationCheck = canCancelOrder(order);

    if (!cancellationCheck.canCancel) {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel order",
        error: cancellationCheck.reason,
        status: 400,
        data: {
          orderPlacedAt: order.placedAt,
          currentTime: new Date(),
          windowExpired: cancellationCheck.windowExpired || false,
        },
      });
    }

    // Update order status to cancelled
    order.status = "cancelled";
    order.cancelledAt = new Date();
    order.cancellationReason = reason || "Cancelled by customer";

    // Add status history entry
    order.statusHistory.push({
      status: "cancelled",
      updatedAt: new Date(),
      updatedBy: "customer",
      notes: reason || "Cancelled by customer",
    });

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      status: 200,
      data: {
        order: {
          orderNumber: order.orderNumber,
          status: order.status,
          cancelledAt: order.cancelledAt,
          cancellationReason: order.cancellationReason,
        },
      },
    });
  } catch (error) {
    console.error("Error cancelling order:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to cancel order",
      error: error.message,
      status: 500,
    });
  }
};
