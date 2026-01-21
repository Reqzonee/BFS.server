const express = require("express");
const {
    createSubCategory,
    getAllSubCategories,
    updateSubCategory,
    deleteSubCategory,
    bulkCreateSubCategories
} = require("../../controllers/v1/SubCategoryMasterController.js");
const { authMiddleware } = require("../../middlewares/authMiddleware.js");

const router = express.Router();

router.post("/sub-categories/bulk", authMiddleware(["ADMIN", "EMPLOYEE"]), bulkCreateSubCategories);
router.post("/sub-categories", authMiddleware(["ADMIN", "EMPLOYEE"]), createSubCategory);
router.get("/sub-categories", authMiddleware(["ADMIN", "EMPLOYEE"]), getAllSubCategories);
router.put("/sub-categories/:id", authMiddleware(["ADMIN", "EMPLOYEE"]), updateSubCategory);
router.delete("/sub-categories/:id", authMiddleware(["ADMIN", "EMPLOYEE"]), deleteSubCategory);

module.exports = router;
