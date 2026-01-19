const express = require("express");
const { createLoyaltyCard, getCustomerLoyaltyCards } = require("../../controllers/v1/LoyaltyCardController.js");
const { authMiddleware } = require("../../middlewares/authMiddleware.js");

const router = express.Router();

router.post("/loyalty-cards", authMiddleware(["ADMIN", "SUPERADMIN", "STORE_ADMIN", "storeadmin"]), createLoyaltyCard);
router.get("/loyalty-cards/customer/:customerId", authMiddleware(["ADMIN", "SUPERADMIN", "STORE_ADMIN", "storeadmin"]), getCustomerLoyaltyCards);

module.exports = router;
