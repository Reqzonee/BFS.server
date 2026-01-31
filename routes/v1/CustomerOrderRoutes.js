const express = require("express");
const router = express.Router();
const customerOrderController = require("../../controllers/v1/CustomerOrderController");
const customerAuthMiddleware = require("../../middlewares/customerAuthMiddleware");

// Routes require customer authentication
// Applied specifically to each route to avoid global interception in the /api/v1 router stack

/**
 * @route   POST /api/v1/customer/orders
 * @desc    Place order from cart
 * @access  Customer (authenticated)
 */
router.post("/customer/orders", customerAuthMiddleware, customerOrderController.placeOrder);

/**
 * @route   GET /api/v1/customer/orders
 * @desc    Get order history with pagination and filters
 * @access  Customer (authenticated)
 * @query   page, limit, status, sortBy, sortOrder
 */
router.get("/customer/orders", customerAuthMiddleware, customerOrderController.getOrderHistory);

/**
 * @route   GET /api/v1/customer/orders/:orderNumber
 * @desc    Get order details by order number
 * @access  Customer (authenticated)
 */
router.get("/customer/orders/:orderNumber", customerAuthMiddleware, customerOrderController.getOrderDetails);

/**
 * @route   PUT /api/v1/customer/orders/:orderNumber/cancel
 * @desc    Cancel order (30-second window only)
 * @access  Customer (authenticated)
 */
router.put("/customer/orders/:orderNumber/cancel", customerAuthMiddleware, customerOrderController.cancelOrder);

module.exports = router;
