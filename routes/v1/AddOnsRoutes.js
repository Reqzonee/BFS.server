const express = require("express");
const { createAddOn,
    getAllAddOns,
    updateAddOn,
    deleteAddOn,
    bulkCreateAddOns
} = require("../../controllers/v1/AddOnController.js");
const { authMiddleware } = require("../../middlewares/authMiddleware.js");
const { createSecureImageUpload } = require("../../middlewares/secureUpload.js");

const router = express.Router();

// router.use(authMiddleware(["ADMIN", "EMPLOYEE"]));

const upload = createSecureImageUpload({
    destination: "uploads/addons",
    fieldName: "image",
    maxSize: 2 * 1024 * 1024
});

router.post("/addons/bulk", authMiddleware(["ADMIN", "EMPLOYEE"]), bulkCreateAddOns); // Bulk creation
router.post("/addons", authMiddleware(["ADMIN", "EMPLOYEE"]), upload, createAddOn);
router.get("/addons", authMiddleware(["ADMIN", "EMPLOYEE"]), getAllAddOns);
router.put("/addons/:id", authMiddleware(["ADMIN", "EMPLOYEE"]), upload, updateAddOn);
router.delete("/addons/:id", authMiddleware(["ADMIN", "EMPLOYEE"]), deleteAddOn);

module.exports = router;
