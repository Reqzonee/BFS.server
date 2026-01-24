const express = require("express");
const router = express.Router();
const {
  getStoreMenu,
  getMerchandise,
  getCombos,
  searchProducts,
} = require("../../controllers/v1/CatalogController.js");

router.get("/customer/catalog/menu/:storeId", getStoreMenu);
router.get("/customer/catalog/merchandise/:storeId", getMerchandise);
router.get("/customer/catalog/combos/:storeId", getCombos);
router.get("/customer/catalog/search/:storeId", searchProducts);

module.exports = router;
