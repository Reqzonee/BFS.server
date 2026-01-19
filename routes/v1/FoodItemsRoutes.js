const express = require("express");
const { createFoodItem,
    getAllFoodItems,
    getFoodItemById,
    updateFoodItem,
    deleteFoodItem,
    searchFoodItems,
    bulkCreateFoodItems
} = require("../../controllers/v1/FoodItemController.js");
const { authMiddleware } = require("../../middlewares/authMiddleware.js");

const router = express.Router();

// Company Master routes (Manage Global Menu)
// router.use(authMiddleware(["ADMIN", "EMPLOYEE"])); // Employees might need read access, Admin write

const { createSecureImageUpload } = require("../../middlewares/secureUpload.js");

const upload = createSecureImageUpload({
    destination: "uploads/food-items",
    fieldName: "image",
    maxSize: 2 * 1024 * 1024 // 2MB limit for food items
});

router.post("/food-items/bulk", authMiddleware(["ADMIN", "EMPLOYEE"]), bulkCreateFoodItems); // Bulk creation
router.post("/food-items", authMiddleware(["ADMIN", "EMPLOYEE"]), upload, createFoodItem);
router.get("/food-items", authMiddleware(["ADMIN", "EMPLOYEE"]), getAllFoodItems);
router.post("/food-items/search", authMiddleware(["ADMIN", "EMPLOYEE"]), searchFoodItems); // Search endpoint
router.get("/food-items/:id", authMiddleware(["ADMIN", "EMPLOYEE"]), getFoodItemById);
router.put("/food-items/:id", authMiddleware(["ADMIN", "EMPLOYEE"]), upload, updateFoodItem);
router.delete("/food-items/:id", authMiddleware(["ADMIN", "EMPLOYEE"]), deleteFoodItem);

module.exports = router;
