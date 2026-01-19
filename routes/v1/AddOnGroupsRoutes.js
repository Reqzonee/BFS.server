const express = require("express");
const { createAddOnGroup,
    getAllAddOnGroups,
    updateAddOnGroup,
    deleteAddOnGroup
} = require("../../controllers/v1/AddOnGroupController.js");
const { authMiddleware } = require("../../middlewares/authMiddleware.js");

const router = express.Router();

// router.use(authMiddleware(["ADMIN", "EMPLOYEE"]));

router.post("/addon-groups", authMiddleware(["ADMIN", "EMPLOYEE"]), createAddOnGroup);
router.get("/addon-groups", authMiddleware(["ADMIN", "EMPLOYEE"]), getAllAddOnGroups);
router.put("/addon-groups/:id", authMiddleware(["ADMIN", "EMPLOYEE"]), updateAddOnGroup);
router.delete("/addon-groups/:id", authMiddleware(["ADMIN", "EMPLOYEE"]), deleteAddOnGroup);

module.exports = router;
