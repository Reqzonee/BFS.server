const express = require("express");
const router = express.Router();
const {
  getNearbyStores,
  getStoreById,
  checkDeliveryServiceability,
} = require("../../controllers/v1/CustomerStoreController.js");
const customerAuthMiddleware = require("../../middlewares/customerAuthMiddleware.js");

router.get("/customer/store/nearby", getNearbyStores);
router.get("/customer/store/:id", getStoreById);
router.post("/customer/store/check-delivery", customerAuthMiddleware, checkDeliveryServiceability);

module.exports = router;
