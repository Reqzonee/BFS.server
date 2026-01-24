const express = require("express");
const router = express.Router();
const {
  getCustomer,
  updateCustomer,
  addAddress,
  updateAddress,
  deleteAddress,
} = require("../../controllers/v1/CustomerController.js");
const customerAuthMiddleware = require("../../middlewares/customerAuthMiddleware.js");

router.get("/customer", customerAuthMiddleware, getCustomer);
router.put("/customer", customerAuthMiddleware, updateCustomer);
router.post("/customer/address", customerAuthMiddleware, addAddress);
router.put("/customer/address/:addressId", customerAuthMiddleware, updateAddress);
router.delete("/customer/address/:addressId", customerAuthMiddleware, deleteAddress);

module.exports = router;
