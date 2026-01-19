const express = require("express");
const { createCombo,
    getAllCombos,
    updateCombo,
    deleteCombo
} = require("../../controllers/v1/ComboController.js");
const { authMiddleware } = require("../../middlewares/authMiddleware.js");
const { createSecureImageUpload } = require("../../middlewares/secureUpload.js");

const router = express.Router();

// router.use(authMiddleware(["ADMIN", "EMPLOYEE"]));

const upload = createSecureImageUpload({
    destination: "uploads/combos",
    fieldName: "image",
    maxSize: 2 * 1024 * 1024
});

router.post("/combos", authMiddleware(["ADMIN", "EMPLOYEE"]), upload, createCombo);
router.get("/combos", authMiddleware(["ADMIN", "EMPLOYEE"]), getAllCombos);
router.put("/combos/:id", authMiddleware(["ADMIN", "EMPLOYEE"]), upload, updateCombo);
router.delete("/combos/:id", authMiddleware(["ADMIN", "EMPLOYEE"]), deleteCombo);

module.exports = router;
