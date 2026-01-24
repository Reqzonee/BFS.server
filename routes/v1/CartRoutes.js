const express = require("express");
const router = express.Router();
const {
  getCart,
  addItemToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} = require("../../controllers/v1/CartController.js");
const customerAuthMiddleware = require("../../middlewares/customerAuthMiddleware.js");

router.get("/customer/cart", customerAuthMiddleware, getCart);
router.post("/customer/cart/add", customerAuthMiddleware, addItemToCart);
router.put("/customer/cart/item/:cartItemId", customerAuthMiddleware, updateCartItem);
router.delete("/customer/cart/item/:cartItemId", customerAuthMiddleware, removeCartItem);
router.delete("/customer/cart", customerAuthMiddleware, clearCart);

module.exports = router;
