const express = require("express");
const router = express.Router();
const {
  createCurrencyMaster,
  getCurrencyMasterById,
  updateCurrencyMaster,
  deleteCurrencyMaster,
  listCurrencyMastersByParams,
  getAllActiveCurrencyMasters,
} = require("../controllers/CurrencyMasterController");
const { authMiddleware } = require("../middlewares/authMiddleware");

// Create CurrencyMaster
router.post(
  "/auth/create/currency",
  authMiddleware(["ADMIN", "EMPLOYEE"]),
  createCurrencyMaster,
);

// Get CurrencyMaster by ID
router.get(
  "/auth/get/currency/:id",
  authMiddleware(["ADMIN", "EMPLOYEE"]),
  getCurrencyMasterById,
);

// Update CurrencyMaster
router.put(
  "/auth/update/currency/:id",
  authMiddleware(["ADMIN", "EMPLOYEE"]),
  updateCurrencyMaster,
);

// Delete CurrencyMaster
router.delete(
  "/auth/delete/currency/:id",
  authMiddleware(["ADMIN", "EMPLOYEE"]),
  deleteCurrencyMaster,
);

// List CurrencyMasters with parameters
router.post(
  "/auth/listbyparams/currency",
  authMiddleware(["ADMIN", "EMPLOYEE"]),
  listCurrencyMastersByParams,
);

// Get all active CurrencyMasters
router.get(
  "/auth/list/currency",
  authMiddleware(["ADMIN", "EMPLOYEE"]),
  getAllActiveCurrencyMasters,
);

module.exports = router;
