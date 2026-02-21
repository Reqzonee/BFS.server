const express = require("express");
const { createCategory,
    getAllCategories,
    updateCategory,
    deleteCategory,
    bulkCreateCategories
} = require("../../controllers/v1/CategoryController.js");
const { authMiddleware } = require("../../middlewares/authMiddleware.js");
const { createSecureImageUpload } = require("../../middlewares/secureUpload.js");

const router = express.Router();

// router.use(authMiddleware(["ADMIN", "EMPLOYEE"]));

const upload = createSecureImageUpload({
    destination: "uploads/categories",
    fieldName: "image",
    maxSize: 2 * 1024 * 1024
});
router.post("/categories/bulk", authMiddleware(["ADMIN", "EMPLOYEE"]), bulkCreateCategories); // Bulk creation
router.post("/categories", authMiddleware(["ADMIN", "EMPLOYEE"]), upload, createCategory);
router.get("/categories", authMiddleware(["ADMIN", "EMPLOYEE", "POS"]), getAllCategories);
router.put("/categories/:id", authMiddleware(["ADMIN", "EMPLOYEE"]), upload, updateCategory);
router.delete("/categories/:id", authMiddleware(["ADMIN", "EMPLOYEE"]), deleteCategory);

module.exports = router;
