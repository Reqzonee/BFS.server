const express = require("express");
const { getStoreMenu,
    updateStoreItemConfig,
    updateStoreComboConfig,
    getStoreAddOns,
    updateStoreAddOnConfig
} = require("../../controllers/v1/StoreItemConfigController.js");
const { authMiddleware } = require("../../middlewares/authMiddleware.js");

const router = express.Router();

// Store Admin routes (Manage Store Availability)
// router.use(authMiddleware(["ADMIN", "EMPLOYEE"]));

// Get Merged Menu for a specific store
// Use /store/:storeId/menu structure? Or just query param?
// Let's use path param as it's cleaner resource hierarchy representation but we are in v1 root.
// Let's do /store-configs/:storeId/menu
router.get("/store-configs/:storeId/menu", authMiddleware(["ADMIN", "EMPLOYEE", "STORE_ADMIN"]), getStoreMenu);
router.get("/store-configs/:storeId/addons", authMiddleware(["ADMIN", "EMPLOYEE", "STORE_ADMIN"]), getStoreAddOns);

// Update specific item config for a store
// /store-configs/:storeId/item/:itemId
router.put("/store-configs/:storeId/item/:itemId", authMiddleware(["ADMIN", "EMPLOYEE"]), updateStoreItemConfig);

// Update specific combo config for a store
// /store-configs/:storeId/combo/:comboId
router.put("/store-configs/:storeId/combo/:comboId", authMiddleware(["ADMIN", "EMPLOYEE"]), updateStoreComboConfig);

// Update specific add-on config for a store
// /store-configs/:storeId/addon/:addOnId
router.put("/store-configs/:storeId/addon/:addOnId", authMiddleware(["ADMIN", "EMPLOYEE"]), updateStoreAddOnConfig);

module.exports = router;
