const express = require("express");
const router = express.Router();
const {
  listBills,
  listKOTs,
  printBill,
  printKOT,
  printCombined,
} = require("../../controllers/v1/BillsKOTController");
const { authMiddleware } = require("../../middlewares/authMiddleware");

// Allow POS, ADMIN, and EMPLOYEE roles
const posOrAdminAuth = authMiddleware(["POS", "ADMIN", "EMPLOYEE"]);

/**
 * @route GET /api/v1/bills?date=YYYY-MM-DD
 * @desc Get all bills for a specific date
 * @access POS, Admin, Employee
 */
router.get("/bills", posOrAdminAuth, listBills);

/**
 * @route GET /api/v1/bills/:billId/print
 * @desc Get printable bill data
 * @access POS, Admin, Employee
 */
router.get("/bills/:billId/print", posOrAdminAuth, printBill);

/**
 * @route GET /api/v1/kot?date=YYYY-MM-DD
 * @desc Get all KOTs for a specific date
 * @access POS, Admin, Employee
 */
router.get("/kot", posOrAdminAuth, listKOTs);

/**
 * @route GET /api/v1/kot/:kotId/print
 * @desc Get printable KOT data
 * @access POS, Admin, Employee
 */
router.get("/kot/:kotId/print", posOrAdminAuth, printKOT);

/**
 * @route GET /api/v1/combined/:orderId/print
 * @desc Get combined Bill + KOT PDF (2 pages in one file)
 * @access POS, Admin, Employee
 */
router.get("/combined/:orderId/print", posOrAdminAuth, printCombined);

module.exports = router;
