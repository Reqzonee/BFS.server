const express = require("express");
const router = express.Router();
const adminOrderController = require("../../controllers/v1/AdminOrderController");
const { authMiddleware } = require("../../middlewares/authMiddleware");

// Routes for Admin/Employee Order Management
// We allow both ADMIN (Company Master) and EMPLOYEE to access these
// authMiddleware takes an array of roles to check against
const adminAuth = authMiddleware(["ADMIN", "EMPLOYEE", "STORE_ADMIN", "storeadmin", "SUPERADMIN", "POS"]);

/**
 * @route GET /api/v1/admin/orders
 * @desc Get all orders for the store
 * @access Admin, Employee
 */
router.get("/admin/orders", adminAuth, adminOrderController.getStoreOrders);

/**
 * @route GET /api/v1/admin/orders/:orderNumber
 * @desc Get order details
 * @access Admin, Employee
 */
router.get("/admin/orders/:orderNumber", adminAuth, adminOrderController.getOrderDetails);

/**
 * @route PUT /api/v1/admin/orders/:orderNumber/status
 * @desc Update order status
 * @access Admin, Employee
 */
router.put("/admin/orders/:orderNumber/status", adminAuth, adminOrderController.updateOrderStatus);

module.exports = router;
