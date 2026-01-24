const express = require("express");
const router = express.Router();
const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
} = require("../../controllers/v1/WishlistController.js");
const customerAuthMiddleware = require("../../middlewares/customerAuthMiddleware.js");

router.get("/customer/wishlist", customerAuthMiddleware, getWishlist);
router.post("/customer/wishlist", customerAuthMiddleware, addToWishlist);
router.delete("/customer/wishlist/item/:wishlistItemId", customerAuthMiddleware, removeFromWishlist);
router.delete("/customer/wishlist", customerAuthMiddleware, clearWishlist);

module.exports = router;
