const express = require("express");
const router = express.Router();
const controller = require("../../controllers/v1/MerchandiseController");
const { authMiddleware } = require("../../middlewares/authMiddleware");
const { createSecureImageUpload } = require("../../middlewares/secureUpload.js");

const upload = createSecureImageUpload({
    destination: "uploads/merchandise",
    fieldName: "image",
    maxSize: 2 * 1024 * 1024 // 2MB limit
});

// Global Master Routes (Admin)
// Prefixing with /merchandise as server mounts us at root /api/v1
router.get("/merchandise", authMiddleware(["ADMIN", "SUPERADMIN", "STORE_ADMIN", "EMPLOYEE"]), controller.getAllMerchandise);
router.post("/merchandise", authMiddleware(["ADMIN", "SUPERADMIN"]), upload, controller.createMerchandise);
router.put("/merchandise/:id", authMiddleware(["ADMIN", "SUPERADMIN"]), upload, controller.updateMerchandise);
router.delete("/merchandise/:id", authMiddleware(["ADMIN", "SUPERADMIN"]), controller.deleteMerchandise);

// Store-Specific Routes
router.get("/merchandise/store/:storeId", authMiddleware(["ADMIN", "SUPERADMIN", "STORE_ADMIN", "EMPLOYEE"]), controller.getStoreMerchandise);
router.put("/merchandise/store/:storeId/item/:merchandiseId", authMiddleware(["ADMIN", "SUPERADMIN", "STORE_ADMIN", "EMPLOYEE"]), controller.updateStoreMerchandiseConfig);

module.exports = router;
