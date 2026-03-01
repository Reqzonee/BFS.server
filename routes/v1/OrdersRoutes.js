const express = require("express");
const router = express.Router();
const { createOrder, resyncKOTCounter } = require("../../controllers/v1/OrderController");
const { generateKOT } = require("../../controllers/v1/KOTController");
const { authMiddleware } = require("../../middlewares/authMiddleware");

// Allow POS, ADMIN, and EMPLOYEE roles to create orders
const posOrAdminAuth = authMiddleware(["POS", "ADMIN", "EMPLOYEE"]);

/**
 * @route POST /api/v1/orders
 * @desc Create a new order (POS/Admin)
 * @access POS, Admin, Employee
 */

// Create order
router.post("/orders", posOrAdminAuth, createOrder);

// Generate KOT for an order (only non-packed food)
router.post("/orders/:orderId/kot", posOrAdminAuth, generateKOT);

// Resync KOT counter (fix out-of-sync issue)
router.post("/orders/resync-kot", posOrAdminAuth, resyncKOTCounter);

module.exports = router;
